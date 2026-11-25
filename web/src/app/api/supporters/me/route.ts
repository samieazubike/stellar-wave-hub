import { getAuthUser } from "@/lib/auth";
import { getSupporterStatus } from "@/lib/supporters";

export const dynamic = "force-dynamic";

/** Supporter status for the signed-in user, consumed by /profile. */
export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getSupporterStatus(auth.userId);
    return Response.json(status, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load supporter status",
      },
      { status: 500 },
    );
  }
}
