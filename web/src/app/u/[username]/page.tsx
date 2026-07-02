import { projectsCol, usersCol, ratingsCol } from '@/lib/db';
import ProjectCard from '@/components/ProjectCard';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Generate meta title for SEO */
export async function generateMetadata({ params }: { params: { username: string } }) {
  return { title: `${params.username} • Stellar Wave` };
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;

  // Retrieve user profile
  const userSnap = await usersCol.ref.where('username', '==', username).limit(1).get();
  if (userSnap.empty) {
    notFound();
  }
  const userDoc = userSnap.docs[0];
  const profileData = {
    ...userDoc.data(),
    id: Number(userDoc.id),
  };

  // Retrieve user's submitted projects
  const projectsSnap = await projectsCol.ref
    .where('status', 'in', ['approved', 'featured'])
    .where('user_id', '==', profileData.id)
    .get();

  // Fetch ratings for avg computation
  const ratingsAllSnap = await ratingsCol.ref.get();
  const ratingsByProject = new Map<number, number[]>();
  ratingsAllSnap.docs.forEach((d) => {
    const r = d.data();
    const pid = r.project_id as number;
    if (!ratingsByProject.has(pid)) ratingsByProject.set(pid, []);
    ratingsByProject.get(pid)!.push(r.score as number);
  });

  const projects = projectsSnap.docs.map((d) => {
    const p = d.data();
    const pid = p.numericId ?? Number(d.id);
    const scores = ratingsByProject.get(pid) || [];
    const avg_rating = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return {
      ...p,
      id: pid,
      avg_rating,
      rating_count: scores.length,
    };
  });

  // Retrieve ratings given by this user
  const userRatingsSnap = await ratingsCol.ref
    .where('user_id', '==', profileData.id)
    .orderBy('created_at', 'desc')
    .get();

  // Fetch project titles to display nicely
  const ratings = await Promise.all(
    userRatingsSnap.docs.map(async (d) => {
      const r = d.data();
      let project_title = `Project ${r.project_id}`;
      const pSnap = await projectsCol.ref.where('numericId', '==', r.project_id).limit(1).get();
      if (!pSnap.empty) {
        project_title = pSnap.docs[0].data().name;
      }
      return {
        ...r,
        id: r.numericId ?? d.id,
        project_title,
      };
    })
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* Header */}
      <section className="glass rounded-2xl p-8 text-center animate-in">
        <h1 className="font-display text-4xl text-starlight mb-2">
          {profileData.username}
        </h1>
        <p className="text-ash">
          Joined {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'Unknown'}
        </p>
      </section>

      {/* Submitted Projects */}
      <section className="space-y-6 animate-in animate-in-delay-1">
        <h2 className="font-display text-2xl text-starlight mb-4">
          Submitted Projects
        </h2>
        {projects && projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="text-ash">This user hasn't submitted any projects yet.</p>
        )}
      </section>

      {/* Ratings Given */}
      <section className="space-y-6 animate-in animate-in-delay-2">
        <h2 className="font-display text-2xl text-starlight mb-4">
          Ratings Given
        </h2>
        {ratings && ratings.length > 0 ? (
          <div className="space-y-4">
            {ratings.map((r: any) => (
              <div
                key={r.id}
                className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="flex-1 font-medium text-starlight">
                  {r.project_title}
                </div>
                <div className="flex items-center gap-1 text-aurora">
                  ★ {r.score ?? 'N/A'}
                </div>
                <span className="text-ash text-sm whitespace-nowrap">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-ash">No ratings have been given by this user.</p>
        )}
      </section>
    </div>
  );
}

