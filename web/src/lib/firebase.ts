import {createClient, type SupabaseClient} from "@supabase/supabase-js";

type Row = Record<string, unknown>;
type FilterOp = "==" | "in";

const TABLE_BY_COLLECTION: Record<string, string> = {
	users: "users",
	projects: "projects",
	ratings: "ratings",
	financial_snapshots: "financial_snapshots",
	auth_challenges: "auth_challenges",
	counters: "counters",
};

function resolveTable(collection: string): string {
	return TABLE_BY_COLLECTION[collection] ?? collection;
}

function keyField(collection: string): string {
	if (
		collection === "users" ||
		collection === "projects" ||
		collection === "ratings"
	) {
		return "numericId";
	}
	if (collection === "counters") return "name";
	if (collection === "auth_challenges") return "publicKey";
	return "id";
}

function normalizeDocId(collection: string, id: string): string | number {
	if (
		collection === "users" ||
		collection === "projects" ||
		collection === "ratings"
	) {
		const numeric = Number(id);
		return Number.isNaN(numeric) ? id : numeric;
	}
	return id;
}

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
	if (_supabase) return _supabase;

	const supabaseUrl = process.env.SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		throw new Error(
			"Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
		);
	}

	_supabase = createClient(supabaseUrl, serviceRoleKey, {
		auth: {persistSession: false, autoRefreshToken: false},
	});

	return _supabase;
}

type QueryFilter = {field: string; op: FilterOp; value: unknown};
type QueryOrder = {field: string; direction: "asc" | "desc"};

class DocRef {
	constructor(
		public readonly collection: string,
		public readonly id: string,
	) {}

	async get(): Promise<DocumentSnapshot> {
		const supabase = getSupabase();
		const table = resolveTable(this.collection);
		const idField = keyField(this.collection);
		const normalizedId = normalizeDocId(this.collection, this.id);

		const {data, error} = await supabase
			.from(table)
			.select("*")
			.eq(idField, normalizedId)
			.maybeSingle();

		if (error) throw error;
		return new DocumentSnapshot(this, data as Row | null);
	}

	async set(data: Row): Promise<void> {
		const supabase = getSupabase();
		const table = resolveTable(this.collection);
		const idField = keyField(this.collection);
		const normalizedId = normalizeDocId(this.collection, this.id);

		const payload: Row = {...data};
		if (payload[idField] === undefined) payload[idField] = normalizedId;

		const {error} = await supabase
			.from(table)
			.upsert(payload, {onConflict: idField});
		if (error) throw error;
	}

	async update(data: Row): Promise<void> {
		const supabase = getSupabase();
		const table = resolveTable(this.collection);
		const idField = keyField(this.collection);
		const normalizedId = normalizeDocId(this.collection, this.id);

		const {error} = await supabase
			.from(table)
			.update(data)
			.eq(idField, normalizedId);

		if (error) throw error;
	}

	async delete(): Promise<void> {
		const supabase = getSupabase();
		const table = resolveTable(this.collection);
		const idField = keyField(this.collection);
		const normalizedId = normalizeDocId(this.collection, this.id);

		const {error} = await supabase
			.from(table)
			.delete()
			.eq(idField, normalizedId);

		if (error) throw error;
	}
}

class QueryDocumentSnapshot {
	constructor(
		public readonly ref: DocRef,
		private readonly row: Row,
	) {}

	get id(): string {
		const idField = keyField(this.ref.collection);
		return String(this.row[idField] ?? this.ref.id);
	}

	data(): Row {
		return this.row;
	}
}

class DocumentSnapshot {
	constructor(
		public readonly ref: DocRef,
		private readonly row: Row | null,
	) {}

	get exists(): boolean {
		return this.row !== null;
	}

	get id(): string {
		if (!this.row) return this.ref.id;
		const idField = keyField(this.ref.collection);
		return String(this.row[idField] ?? this.ref.id);
	}

	data(): Row | undefined {
		return this.row ?? undefined;
	}
}

class QuerySnapshot {
	constructor(public readonly docs: QueryDocumentSnapshot[]) {}

	get empty(): boolean {
		return this.docs.length === 0;
	}
}

class QueryRef {
	constructor(
		private readonly collection: string,
		private readonly filters: QueryFilter[] = [],
		private readonly orders: QueryOrder[] = [],
		private readonly maxRows: number | null = null,
	) {}

	where(field: string, op: FilterOp, value: unknown): QueryRef {
		return new QueryRef(
			this.collection,
			[...this.filters, {field, op, value}],
			this.orders,
			this.maxRows,
		);
	}

	orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryRef {
		return new QueryRef(
			this.collection,
			this.filters,
			[...this.orders, {field, direction}],
			this.maxRows,
		);
	}

	limit(count: number): QueryRef {
		return new QueryRef(this.collection, this.filters, this.orders, count);
	}

	doc(id: string): DocRef {
		return new DocRef(this.collection, id);
	}

	get firestore(): {
		batch: () => {
			delete: (ref: DocRef) => void;
			commit: () => Promise<void>;
		};
	} {
		return {
			batch: () => {
				const operations: Array<() => Promise<void>> = [];
				return {
					delete: (ref: DocRef) => {
						operations.push(() => ref.delete());
					},
					commit: async () => {
						await Promise.all(operations.map((op) => op()));
					},
				};
			},
		};
	}

	async get(): Promise<QuerySnapshot> {
		const supabase = getSupabase();
		const table = resolveTable(this.collection);

		let query = supabase.from(table).select("*");

		for (const filter of this.filters) {
			if (filter.op === "==") {
				query = query.eq(filter.field, filter.value as never);
			} else if (filter.op === "in") {
				query = query.in(filter.field, filter.value as never[]);
			}
		}

		for (const order of this.orders) {
			query = query.order(order.field, {
				ascending: order.direction === "asc",
			});
		}

		if (this.maxRows !== null) {
			query = query.limit(this.maxRows);
		}

		const {data, error} = await query;
		if (error) throw error;

		const docs = (data ?? []).map((row) => {
			const idField = keyField(this.collection);
			const id = String((row as Row)[idField] ?? (row as Row).id ?? "");
			return new QueryDocumentSnapshot(
				new DocRef(this.collection, id),
				row as Row,
			);
		});

		return new QuerySnapshot(docs);
	}
}

class CollectionRef {
	constructor(private readonly collection: string) {}

	doc(id: string): DocRef {
		return new DocRef(this.collection, id);
	}

	where(field: string, op: FilterOp, value: unknown): QueryRef {
		return new QueryRef(this.collection).where(field, op, value);
	}

	orderBy(field: string, direction: "asc" | "desc" = "asc"): QueryRef {
		return new QueryRef(this.collection).orderBy(field, direction);
	}

	limit(count: number): QueryRef {
		return new QueryRef(this.collection).limit(count);
	}

	get firestore(): {
		batch: () => {
			delete: (ref: DocRef) => void;
			commit: () => Promise<void>;
		};
	} {
		return new QueryRef(this.collection).firestore;
	}

	async get(): Promise<QuerySnapshot> {
		return new QueryRef(this.collection).get();
	}
}

const firestore = {
	collection(name: string): CollectionRef {
		return new CollectionRef(name);
	},
};

export default firestore;
