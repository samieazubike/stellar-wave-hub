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
export const maintainerCategoriesCol = {
	get ref() {
		return col("maintainer_categories");
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
export const reportsCol = {
	get ref() {
		return col("reports");
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
export const maintainerApplicationsCol = {
	get ref() {
		return col("maintainer_applications");
	},
};
export const ratingVotesCol = {
	get ref() {
		return col("rating_votes");
	},
};
export const projectUpdatesCol = {
	get ref() {
		return col("project_updates");
	},
};
export const notificationsCol = {
	get ref() {
		return col("notifications");
	},
};
export const heroSponsorsCol = {
	get ref() {
		return col("hero_sponsors");
	},
};

export type ModerationAction = "approve" | "reject" | "feature" | "delist" | "delete";

/**
 * Record a moderation action in the audit log. Never throws: a logging
 * failure must not undo a moderation decision that already succeeded.
 */
export async function logModerationAction(input: {
  actor_id: number;
  action: ModerationAction;
  project_id: number;
  reason?: string | null;
}) {
  try {
    const {error} = await getSupabase().from("moderation_log").insert({
      actor_id: input.actor_id,
      action: input.action,
      project_id: input.project_id,
      reason: input.reason ?? null,
    });
    if (error) throw error;
  } catch (err) {
    console.error("Failed to write moderation log:", err);
  }
}

export async function createNotification(input: {
  user_id: number;
  project_id?: number | null;
  project_name?: string | null;
  status: string;
  message: string;
}) {
  const numericId = await nextId("notifications");
  await notificationsCol.ref.doc(String(numericId)).set({
    numericId,
    user_id: input.user_id,
    project_id: input.project_id ?? null,
    project_name: input.project_name ?? null,
    status: input.status,
    message: input.message,
    read: false,
    created_at: new Date().toISOString(),
  });
  return numericId;
}

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
