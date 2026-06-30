import { ratingsCol, usersCol } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { username: string } }) {
  try {
    const { username } = params;
    // Find user id
    const userSnap = await usersCol.ref.where('username', '==', username).limit(1).get();
    if (userSnap.empty) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const uid = Number(userSnap.docs[0].id);
    // Get ratings by this user
    const snap = await ratingsCol.ref.where('user_id', '==', uid).orderBy('created_at', 'desc').get();
    const ratings = snap.docs.map((d) => {
      const r = d.data();
      return { ...r, id: r.numericId ?? d.id };
    });
    return Response.json({ ratings });
  } catch (err) {
    console.error('User ratings fetch error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
