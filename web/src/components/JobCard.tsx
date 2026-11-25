import Image from "next/image";
import Link from "next/link";
import { formatCompensation, isJobFeatured, JOB_TYPE_LABELS, type Job } from "@/lib/jobs";

function postedAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function JobCard({ job }: { job: Job }) {
  const featured = isJobFeatured(job);
  const compensation = formatCompensation(job);
  const project = job.project;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`group glass flex flex-col gap-4 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 sm:flex-row sm:items-center sm:p-6 ${
        featured
          ? "border-solar/40 bg-solar/5 hover:border-solar/60"
          : "border-dust/20 hover:border-nova/30"
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stardust font-display text-lg font-bold text-nova-bright">
        {project?.logo_url ? (
          <Image
            src={project.logo_url}
            alt={`${project.name} logo`}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        ) : (
          (project?.name?.[0] ?? "?").toUpperCase()
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-starlight transition-colors group-hover:text-nova-bright">
            {job.title}
          </h3>
          {featured && (
            <span className="rounded-full border border-solar/40 bg-solar/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-solar-bright">
              Featured
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-moonlight/80">
          {project?.name ?? "Unknown project"}
          {project?.category && (
            <span className="text-ash"> · {project.category}</span>
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-nova/30 bg-nova/10 px-2.5 py-1 text-nova-bright">
            {JOB_TYPE_LABELS[job.type] ?? job.type}
          </span>
          <span className="rounded-full border border-dust/30 bg-stardust/50 px-2.5 py-1 text-moonlight/80">
            {job.remote ? "Remote" : job.location || "On-site"}
            {job.remote && job.location ? ` · ${job.location}` : ""}
          </span>
          {compensation && (
            <span className="rounded-full border border-aurora/30 bg-aurora/10 px-2.5 py-1 text-aurora-bright">
              {compensation}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-xs text-ash sm:text-right">{postedAgo(job.created_at)}</div>
    </Link>
  );
}
