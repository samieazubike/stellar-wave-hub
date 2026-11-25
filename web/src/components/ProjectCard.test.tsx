import {describe, expect, it, vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import ProjectCard from "./ProjectCard";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		...props
	}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {href: string}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("next/image", () => ({
	default: ({
		alt,
		src,
	}: {alt: string; src: string}) => (
		<span role="img" aria-label={alt} data-src={src} />
	),
}));

vi.mock("@/context/CompareContext", () => ({
	useCompare: () => ({
		isSelected: () => false,
		toggleProject: vi.fn(),
		projects: [],
	}),
}));

const project = {
	id: 1,
	name: "Project",
	slug: "project",
	description: "Project description",
	category: "tools",
	status: "approved",
	featured: 0,
};

describe("ProjectCard hiring badge", () => {
	it("links the badge to the active job application", () => {
		const html = renderToStaticMarkup(
			<ProjectCard
				project={{
					...project,
					has_active_jobs: true,
					active_job_url: "https://jobs.example/apply",
				}}
			/>,
		);

		expect(html).toContain(">Hiring</a>");
		expect(html).toContain('href="https://jobs.example/apply"');
		expect(html).toContain('target="_blank"');
	});

	it("does not show the badge for projects without an active job", () => {
		const html = renderToStaticMarkup(
			<ProjectCard
				project={{
					...project,
					has_active_jobs: false,
					active_job_url: "https://jobs.example/apply",
				}}
			/>,
		);

		expect(html).not.toContain(">Hiring</a>");
	});
});
