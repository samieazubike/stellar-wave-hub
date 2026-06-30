import ProjectCard from '@/components/ProjectCard';

export const dynamic = 'force-dynamic';

/** Generate meta title for SEO */
export async function generateMetadata({ params }: { params: { username: string } }) {
  return { title: `${params.username} • Stellar Wave` };
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;

  // Parallel fetch of profile, projects and ratings
  const [profileRes, projectsRes, ratingsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/users/${username}`),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/projects?author=${username}`),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ratings/user/${username}`),
  ]);

  const profileData = await profileRes.json();
  const projectsData = await projectsRes.json();
  const ratingsData = await ratingsRes.json();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* Header */}
      <section className="glass rounded-2xl p-8 text-center animate-in">
        <h1 className="font-display text-4xl text-starlight mb-2">
          {profileData.username}
        </h1>
        <p className="text-ash">
          Joined {new Date(profileData.created_at).toLocaleDateString()}
        </p>
      </section>

      {/* Submitted Projects */}
      <section className="space-y-6 animate-in animate-in-delay-1">
        <h2 className="font-display text-2xl text-starlight mb-4">
          Submitted Projects
        </h2>
        {projectsData.projects && projectsData.projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {projectsData.projects.map((project: any) => (
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
        {ratingsData.ratings && ratingsData.ratings.length > 0 ? (
          <div className="space-y-4">
            {ratingsData.ratings.map((r: any) => (
              <div
                key={r.id}
                className="glass rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="flex-1 font-medium text-starlight">
                  {r.project_title ?? `Project ${r.project_id}`}
                </div>
                <div className="flex items-center gap-1 text-aurora">
                  ★ {r.score ?? 'N/A'}
                </div>
                <span className="text-ash text-sm whitespace-nowrap">
                  {new Date(r.created_at).toLocaleDateString()}
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
