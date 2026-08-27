export type BlogBlock =
	| {type: "paragraph"; text: string}
	| {type: "heading"; level: 2 | 3; text: string}
	| {type: "image"; src: string; alt: string; caption?: string}
	| {type: "list"; ordered?: boolean; items: string[]}
	| {type: "callout"; tone?: "nova" | "solar" | "aurora" | "plasma"; title?: string; text: string}
	| {type: "link-button"; href: string; label: string; external?: boolean};

export interface BlogStep {
	number: number;
	title: string;
	blocks: BlogBlock[];
}

export interface BlogPost {
	slug: string;
	title: string;
	excerpt: string;
	author: string;
	publishedAt: string;
	readingMinutes: number;
	tags: string[];
	coverImage?: string;
	intro: BlogBlock[];
	steps?: BlogStep[];
	outro?: BlogBlock[];
}

export const blogs: BlogPost[] = [
	{
		slug: "how-to-research-stellar-wave-projects-on-drips",
		title: "How to Research a Stellar Wave Project on Drips and Submit it to Stellar Wave Hub",
		excerpt:
			"A walk-through of finding a Stellar Wave Program project on Drips, validating it against our submission criteria, and shipping it to Stellar Wave Hub for review.",
		author: "Stellar Wave Hub Team",
		publishedAt: "2026-05-27",
		readingMinutes: 5,
		tags: ["Guide", "Onboarding", "Submissions"],
		intro: [
			{
				type: "paragraph",
				text:
					"Every project on Stellar Wave Hub starts with a little detective work. Drips is the source of truth for who has been approved for the Stellar Wave Program — orgs, repos, funding, the lot — and the best submissions on the Hub all begin there.",
			},
			{
				type: "paragraph",
				text:
					"This guide walks you through the exact flow we use ourselves: open Drips, find a project worth writing up, validate it against the submission criteria, then push it through to the Hub for review.",
			},
			{
				type: "callout",
				tone: "solar",
				title: "⚠ Important: check for duplicates first",
				text:
					"Before you start researching a project you've picked, search for it on Stellar Wave Hub to confirm it hasn't already been submitted. Duplicate submissions get rejected at review and you'll have wasted the work — a 30-second search saves you an evening of writing.",
			},
			{
				type: "link-button",
				href: "/explore",
				label: "Search the Hub for your project →",
			},
		],
		steps: [
			{
				number: 1,
				title: "Open the Stellar Wave page on Drips",
				blocks: [
					{
						type: "paragraph",
						text:
							"Head over to the Stellar Wave landing page on Drips. This is the canonical list of everything approved for the Stellar Wave Program — if it's not here, it doesn't count.",
					},
					{
						type: "link-button",
						href: "https://www.drips.network/wave/stellar",
						label: "Open drips.network/wave/stellar",
						external: true,
					},
				],
			},
			{
				number: 2,
				title: "Pick the Repos or Orgs view",
				blocks: [
					{
						type: "paragraph",
						text:
							"Drips splits Wave participants into Orgs (the teams behind the work) and Repos (individual codebases). Start with whichever angle matches how you like to research — by team or by code.",
					},
					{
						type: "image",
						src: "/blog/drips-stellar-orgs-repos.png",
						alt: "Drips Wave page showing the Orgs view filtered to Stellar",
						caption: "The Orgs view: a paginated grid of every team approved for the Stellar Wave Program.",
					},
					{
						type: "paragraph",
						text:
							"Tip: the Orgs view tells you how many repos each team owns. Teams with several repos are often building a wider product surface, which gives you more to write about.",
					},
				],
			},
			{
				number: 3,
				title: "Pick a project you actually want to research",
				blocks: [
					{
						type: "paragraph",
						text:
							"Click into an org and browse its repos, or jump straight to the Repos tab. Choose something that excites you — the best Hub entries are written by people who genuinely want to understand the project.",
					},
					{
						type: "image",
						src: "/blog/drips-stellar-repos.png",
						alt: "Drips repos view listing Stellar Wave-approved repositories",
						caption: "The Repos view: every approved codebase, with links straight to GitHub.",
					},
					{
						type: "callout",
						tone: "plasma",
						title: "What makes a good pick",
						text:
							"Look for a clear README, recent commits, and a problem statement you can explain in one sentence. If you can't summarise what the project does after five minutes, move on.",
					},
				],
			},
			{
				number: 4,
				title: "Work through the Submission Criteria",
				blocks: [
					{
						type: "paragraph",
						text:
							"Open the issue on our repo and treat the Submission Criteria as a checklist. Every field is there for a reason — reviewers reject submissions that skip it. Do your homework now and the submit form takes minutes.",
					},
					{
						type: "list",
						items: [
							"Project name, one-line description, and category",
							"Links: GitHub, live demo (if any), website, docs",
							"Team or org behind the project, plus contributors you can credit",
							"Tech stack — Soroban, Horizon, SDKs, contracts deployed",
							"On-chain evidence: contract IDs, transaction hashes, mainnet vs. testnet",
							"What problem it solves and who the user is",
						],
					},
					{
						type: "callout",
						tone: "solar",
						title: "Don't paraphrase the README",
						text:
							"Reviewers can read GitHub themselves. The submission earns points when you add context the README doesn't — usage notes, comparable projects, gotchas you found while exploring the code.",
					},
				],
			},
			{
				number: 5,
				title: "Submit on Stellar Wave Hub and wait for review",
				blocks: [
					{
						type: "paragraph",
						text:
							"Head to the Submit page, paste in everything you gathered, and hit submit. Your project lands in the review queue where an admin gives it a final look before it goes live on the Explore page.",
					},
					{
						type: "link-button",
						href: "/submit",
						label: "Submit a project →",
					},
					{
						type: "paragraph",
						text:
							"You can track the status of your submissions from the My Projects page. Reviewers may comment with edits — respond there and resubmit when you're ready.",
					},
				],
			},
		],
		outro: [
			{
				type: "heading",
				level: 2,
				text: "That's the whole flow",
			},
			{
				type: "paragraph",
				text:
					"Drips for discovery, the checklist for rigour, Stellar Wave Hub for permanence. Do that loop a few times and you'll know the Wave ecosystem better than most.",
			},
			{
				type: "paragraph",
				text:
					"Spotted something we should improve in the flow? Open an issue on the repo — guides like this one evolve with the program.",
			},
		],
	},
];

export function getAllBlogs(): BlogPost[] {
	return [...blogs].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getBlogBySlug(slug: string): BlogPost | undefined {
	return blogs.find((b) => b.slug === slug);
}

export function getBlogSlugs(): string[] {
	return blogs.map((b) => b.slug);
}
