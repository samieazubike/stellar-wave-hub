import { createNotification, usersCol, maintainerCategoriesCol } from "./db";
import { getSupabase } from "./firebase";

/**
 * Get user IDs of all maintainers (and admins) who should be notified
 * about a submission in the given category.
 * 
 * @param category - Project category (e.g. "defi", "payments")
 * @returns Array of user IDs to notify
 */
export async function getMaintainerUserIds(category: string): Promise<number[]> {
  const userIds = new Set<number>();

  // 1. Get all admins (they receive all notifications regardless of category)
  const adminSnap = await usersCol.ref.where("role", "==", "admin").get();
  adminSnap.docs.forEach((doc) => {
    const userId = doc.data().numericId as number;
    if (userId) userIds.add(userId);
  });

  // 2. Get maintainers scoped to this specific category via Supabase
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("maintainer_categories")
      .select("userId")
      .eq("category", category);

    if (error) {
      console.error("Failed to fetch category-scoped maintainers:", error);
    } else if (data) {
      data.forEach((row) => {
        const userId = Number(row.userId);
        if (userId) userIds.add(userId);
      });
    }
  } catch (err) {
    console.error("Error querying maintainer categories:", err);
  }

  // 3. Also include maintainers without category restrictions (legacy behavior fallback)
  const maintainerSnap = await usersCol.ref.where("role", "==", "maintainer").get();
  maintainerSnap.docs.forEach((doc) => {
    const userId = doc.data().numericId as number;
    if (userId) userIds.add(userId);
  });

  return Array.from(userIds);
}

/**
 * Notify maintainers of a new project submission.
 * Creates in-app notifications for all relevant maintainers based on category scope.
 * 
 * This function is fire-and-forget from the submission handler's perspective —
 * notification failures must not block the submission response.
 * 
 * @param submission - The submitted project data
 */
export async function notifyMaintainersOfSubmission(submission: {
  numericId: number;
  name: string;
  category: string;
  user_id: number;
}): Promise<void> {
  try {
    // Get maintainer user IDs scoped to this category
    const maintainerIds = await getMaintainerUserIds(submission.category);

    if (maintainerIds.length === 0) {
      console.warn(
        `No maintainers found for category "${submission.category}". Submission notification not sent.`
      );
      return;
    }

    // Create in-app notification for each maintainer
    const notificationPromises = maintainerIds.map((userId) =>
      createNotification({
        user_id: userId,
        project_id: submission.numericId,
        project_name: submission.name,
        status: "submitted",
        message: `New "${submission.category}" project submitted: "${submission.name}" is awaiting review.`,
      })
    );

    await Promise.all(notificationPromises);

    console.log(
      `Notified ${maintainerIds.length} maintainer(s) of submission: "${submission.name}" (category: ${submission.category})`
    );

    // TODO: Email notification
    // Email infrastructure does not exist yet (no nodemailer, sendgrid, resend, or similar).
    // Once email sending is set up:
    // 1. Query maintainer email addresses using maintainerIds
    // 2. Send email to each maintainer with subject: "New submission pending review: [name]"
    // 3. Include link to /maintainer or /admin pending queue
    // See issue #245 follow-up or future email infrastructure task.
  } catch (err) {
    // Log but do not throw — notification failure must not block submission
    console.error("Failed to notify maintainers of submission:", err);
  }
}
