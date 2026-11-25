import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { buildJobPostingJsonLd, serializeJsonLd } from "@/lib/jobJsonLd";
import { formatCompensation, isJobActive, isJobFeatured, JOB_TYPE_LABELS, type Job } from "@/lib/jobs";
import { getJobById, isPublicProjectStatus } from "@/lib/jobs-server";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stellarwavehub.com";

type Props = { params: Promise<{ id: string }> };

/**
 * The public job, or null when it doesn't exist, is closed/expired, or its
 * project isn't listed. Cached so metadata and the page share one lookup.
 */
const getPublicJob = cache(async (rawId: string): Promise<Job | null> => {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const found = await getJobById(id);
  if (!found) return null;
  if (!isJobActive(found.job) || !isPublicProjectStatus(found.projectStatus)) return null;
  return found.job;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const canonical = `${siteUrl}/jobs/${id}`;

  let job: Job | null = null;
  try {
    job = await getPublicJob(id);
  } catch {
    // Fall through to the not-found metadata below.
  }

  if (!job) {
    return { title: "Job not found", robots: { index: false, follow: false } };
  }

  const projectName = job.project?.name ?? "a Stellar project";
  const title = `${job.title} at ${projectName}`;
  const description = job.description.replace(/\s+/g, " ").trim().slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${title} | Stellar Wave Hub`,
      description,
      url: canonical,
      siteName: "Stellar Wave Hub",
      ...(job.project?.logo_url ? { images: [{ url: job.project.logo_url }] } : {}),
    },
    twitter: {
      card: "summary",
      title: `${title} | Stellar Wave Hub`,
      description,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await getPublicJob(id);
  if (!job) notFound();

  const project = job.project;
  const compensation = formatCompensation(job);
  const featured = isJobFeatured(job);
  const jsonLd = buildJobPostingJsonLd(job, siteUrl);

  const facts: { label: string; value: string }[] = [
    { label: "Type", value: JOB_TYPE_LABELS[job.type] ?? job.type },
    {
      label: "Location",
      value: job.remote ? (job.location ? `Remote · ${job.location}` : "Remote") : job.location || "On-site",
    },
    ...(compensation ? [{ label: "Compensation", value: compensation }] : []),
    { label: "Posted", value: formatDate(job.created_at) },
    { label: "Apply by", value: formatDate(job.expires_at) },
  ];

  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-nova/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ash">
          <Link href="/" className="transition-colors hover:text-nova-bright">
            Home
          </Link>
          <span className="mx-2 text-dust">/</span>
          <Link href="/jobs" className="transition-colors hover:text-nova-bright">
            Jobs
          </Link>
          <span className="mx-2 text-dust">/</span>
          <span className="text-moonlight">{job.title}</span>
        </nav>

        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stardust font-display text-2xl font-bold text-nova-bright">
              {project?.logo_url ? (
                <Image
                  src={project.logo_url}
                  alt={`${project.name} logo`}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                (project?.name?.[0] ?? "?").toUpperCase()
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-black tracking-tight text-starlight sm:text-4xl">
                  {job.title}
                </h1>
                {featured && (
                  <span className="rounded-full border border-solar/40 bg-solar/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-solar-bright">
                    Featured
                  </span>
                )}
              </div>
              {project && (
                <p className="mt-2 text-moonlight/80">
                  at{" "}
                  <Link
                    href={`/projects/${project.slug}`}
                    className="font-medium text-nova-bright transition-colors hover:text-starlight"
                  >
                    {project.name}
                  </Link>
                </p>
              )}
            </div>
          </div>

          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="btn-primary inline-flex shrink-0 items-center justify-center"
          >
            Apply now
          </a>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <section aria-labelledby="job-description" className="glass rounded-2xl border border-dust/20 p-6 sm:p-8">
            <h2 id="job-description" className="mb-4 font-display text-xl font-bold text-starlight">
              About the role
            </h2>
            <div className="whitespace-pre-line break-words text-[15px] leading-7 text-moonlight/90">
              {job.description}
            </div>
          </section>

          <aside className="space-y-6">
            <dl className="glass space-y-4 rounded-2xl border border-dust/20 p-5">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ash">{fact.label}</dt>
                  <dd className="mt-1 text-sm text-starlight">{fact.value}</dd>
                </div>
              ))}
              <a
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn-primary mt-2 inline-flex w-full items-center justify-center"
              >
                Apply now
              </a>
            </dl>

            {project && (
              <div className="glass rounded-2xl border border-dust/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ash">About the project</p>
                <p className="mt-2 font-display text-lg font-semibold text-starlight">{project.name}</p>
                <p className="text-xs capitalize text-ash">{project.category}</p>
                {project.description && (
                  <p className="mt-3 line-clamp-5 text-sm leading-6 text-moonlight/80">{project.description}</p>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <Link href={`/projects/${project.slug}`} className="btn-ghost inline-flex items-center justify-center">
                    View project
                  </Link>
                  {project.website_url && (
                    <a
                      href={project.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center text-sm text-nova-bright transition-colors hover:text-starlight"
                    >
                      Visit website ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>

        <div className="mt-12">
          <Link href="/jobs" className="text-sm text-ash transition-colors hover:text-nova-bright">
            ← Back to all jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
