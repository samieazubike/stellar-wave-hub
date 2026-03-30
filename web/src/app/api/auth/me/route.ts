import { usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await usersCol.ref.doc(String(auth.userId)).get();
  if (!doc.exists) return Response.json({ error: "User not found" }, { status: 404 });

  const u = doc.data()!;
  return Response.json({
    user: {
      id: u.numericId,
      username: u.username,
      email: u.email,
      role: u.role,
      stellar_address: u.stellar_address,
      github_url: u.github_url,
      twitter_url: u.twitter_url,
      discord_username: u.discord_username,
      telegram_url: u.telegram_url,
      website_url: u.website_url,
      bio: u.bio,
      created_at: u.created_at,
    },
  });
}

export async function PUT(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { username, bio, stellar_address, github_url, twitter_url, discord_username, telegram_url, website_url } = await request.json();
    const updates: Record<string, unknown> = {};

    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (stellar_address !== undefined) updates.stellar_address = stellar_address;
    if (github_url !== undefined) updates.github_url = github_url;
    if (twitter_url !== undefined) updates.twitter_url = twitter_url;
    if (discord_username !== undefined) updates.discord_username = discord_username;
    if (telegram_url !== undefined) updates.telegram_url = telegram_url;
    if (website_url !== undefined) updates.website_url = website_url;

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const ref = usersCol.ref.doc(String(auth.userId));
    await ref.update(updates);

    const updated = await ref.get();
    const u = updated.data()!;
    return Response.json({
      user: {
        id: u.numericId,
        username: u.username,
        email: u.email,
        role: u.role,
        stellar_address: u.stellar_address,
        github_url: u.github_url,
        twitter_url: u.twitter_url,
        discord_username: u.discord_username,
        telegram_url: u.telegram_url,
        website_url: u.website_url,
        bio: u.bio,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
