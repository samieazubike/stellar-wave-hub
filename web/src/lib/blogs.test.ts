import { describe, it, expect } from "vitest";
import { parseMarkdownToBlocks, getStaticBlogs } from "./blogs";
import { getProjectStoryPriceXlm, DEFAULT_PROJECT_STORY_PRICE_XLM } from "./pricing";

describe("pricing helper", () => {
  it("defaults to 60 XLM", () => {
    delete process.env.NEXT_PUBLIC_PRICE_PROJECT_STORY_XLM;
    expect(DEFAULT_PROJECT_STORY_PRICE_XLM).toBe(60);
    expect(getProjectStoryPriceXlm()).toBe(60);
  });

  it("reads NEXT_PUBLIC_PRICE_PROJECT_STORY_XLM when set", () => {
    process.env.NEXT_PUBLIC_PRICE_PROJECT_STORY_XLM = "120";
    expect(getProjectStoryPriceXlm()).toBe(120);
    delete process.env.NEXT_PUBLIC_PRICE_PROJECT_STORY_XLM;
  });
});

describe("blogs helper", () => {
  it("returns static blogs", () => {
    const list = getStaticBlogs();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("parses markdown into structured blocks, excerpt and reading time", () => {
    const md = `## Project Overview
This is the opening paragraph about the project and its goals.

### Key Features
- Decentralized orderbook
- Sub-second settlement
- Low transaction costs

> Note: Fully verified on Stellar testnet.

A closing summary about what's next.`;

    const parsed = parseMarkdownToBlocks(md);
    expect(parsed.intro.length).toBeGreaterThanOrEqual(5);
    expect(parsed.intro[0]).toEqual({
      type: "heading",
      level: 2,
      text: "Project Overview",
    });
    expect(parsed.intro[1]).toEqual({
      type: "paragraph",
      text: "This is the opening paragraph about the project and its goals.",
    });
    expect(parsed.intro[2]).toEqual({
      type: "heading",
      level: 3,
      text: "Key Features",
    });
    expect(parsed.intro[3]).toEqual({
      type: "list",
      ordered: false,
      items: [
        "Decentralized orderbook",
        "Sub-second settlement",
        "Low transaction costs",
      ],
    });
    expect(parsed.intro[4]).toEqual({
      type: "callout",
      tone: "solar",
      text: "Note: Fully verified on Stellar testnet.",
    });
    expect(parsed.excerpt).toContain("This is the opening paragraph");
    expect(parsed.readingMinutes).toBeGreaterThanOrEqual(1);
  });
});
