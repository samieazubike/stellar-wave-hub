import { usersCol } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { username: string } }) {
  const { username } = params;
  // Public endpoint, no auth required
  try {
    const snap = await usersCol.ref.where('username', '==', username).limit(1).get();
    if (snap.empty) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const data = snap.docs[0].data();
    return Response.json({
      username: data.username,
      email: data.email ?? null,
      role: data.role,
      created_at: data.created_at,
      stellar_address: data.stellar_address ?? null,
      github_url: data.github_url ?? null,
      twitter_url: data.twitter_url ?? null,
      discord_username: data.discord_username ?? null,
      telegram_url: data.telegram_url ?? null,
      website_url: data.website_url ?? null,
    });
  } catch (err) {
    console.error('Get user profile error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
