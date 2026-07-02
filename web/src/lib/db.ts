import firestore from "./firebase";
import {getSupabase} from "./firebase";

// Lazy collection getters — avoid touching Firestore at module load (build time)
function col(name: string) {
	return firestore.collection(name);
}

export const usersCol = {
	get ref() {
		return col("users");
	},
};
export const projectsCol = {
	get ref() {
		return col("projects");
	},
};
export const ratingsCol = {
	get ref() {
		return col("ratings");
	},
};
export const financialSnapshotsCol = {
	get ref() {
		return col("financial_snapshots");
	},
};
export const submissionNotesCol = {
	get ref() {
		return col("submission_notes");
	},
};

// Auto-incrementing numeric ID
export async function nextId(collection: string): Promise<number> {
	const supabase = getSupabase();

	for (let attempt = 0; attempt < 5; attempt += 1) {
		const {data: existing, error: readError} = await supabase
			.from("counters")
			.select("name, value")
			.eq("name", collection)
			.maybeSingle();

		if (readError) throw readError;

		const current = Number(existing?.value ?? 0);
		const next = current + 1;

		if (!existing) {
			const {error: insertError} = await supabase
				.from("counters")
				.insert({name: collection, value: next});
			if (!insertError) return next;
			if (insertError.code !== "23505") throw insertError;
			continue;
		}

		const {data: updatedRows, error: updateError} = await supabase
			.from("counters")
			.update({value: next})
			.eq("name", collection)
			.eq("value", current)
			.select("value");

		if (updateError) throw updateError;
		if ((updatedRows?.length ?? 0) > 0) {
			return Number(updatedRows![0].value);
		}
	}

	throw new Error(`Failed to increment counter for ${collection}`);
}

export default firestore;
