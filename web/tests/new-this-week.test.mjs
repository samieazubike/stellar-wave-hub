import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

const NOW = Date.parse("2026-10-21T00:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [NOW]));
  }
  static now() {
    return NOW;
  }
}

// Execute the real route/page with isolated imports; no database or network access.
function compile(relativePath) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  return ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
}

const routeCode = compile("../src/app/api/projects/route.ts");
const pageCode = compile("../src/app/page.tsx");

function loadModule(code, imports, globals = {}) {
  const loadedModule = { exports: {} };
  vm.runInNewContext(code, {
    module: loadedModule,
    exports: loadedModule.exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
      return imports[name];
    },
    URL,
    Request,
    Response,
    console,
    Date: FixedDate,
    ...globals,
  });
  return loadedModule.exports;
}

function project(id, daysAgo, overrides = {}) {
  return {
    id,
    numericId: id,
    name: `Project ${id}`,
    slug: `project-${id}`,
    description: "Test project",
    category: "Tools",
    status: "approved",
    featured: 0,
    created_at: new Date(NOW - daysAgo * DAY_MS).toISOString(),
    ...overrides,
  };
}

async function listProjects(rows, search = "sort=new-this-week&limit=6") {
  const filters = [];
  let ordering;
  const query = {
    select() { return this; },
    in(column, values) {
      filters.push((row) => values.includes(row[column]));
      return this;
    },
    gte(column, value) {
      filters.push((row) => Date.parse(row[column]) >= Date.parse(value));
      return this;
    },
    order(column, options) {
      assert.equal(column, "created_at");
      assert.equal(options.ascending, false);
      ordering = (a, b) => Date.parse(b[column]) - Date.parse(a[column]);
      return this;
    },
    then(resolve, reject) {
      const data = rows.filter((row) => filters.every((filter) => filter(row)));
      if (ordering) data.sort(ordering);
      // PostgREST may cap a result set: ordering must happen before that cap.
      return Promise.resolve({ data: data.slice(0, 1000), count: data.length, error: null }).then(resolve, reject);
    },
  };
  const { GET } = loadModule(routeCode, {
    "@/lib/db": { ratingsCol: { ref: { get: async () => ({ docs: [] }) } } },
    "@/lib/auth": {},
    "@/lib/validation/parse-body": {},
    "@/lib/validation/schemas/projects": {},
    "@/lib/public-project-cache": { publicProjectCacheHeaders: {} },
    "@/lib/notifications": {},
    "@/lib/rate-limit": {},
    slugify: () => { throw new Error("POST must not execute"); },
    "@/lib/firebase": {
      getSupabase: () => ({
        from(table) {
          assert.equal(table, "projects");
          return query;
        },
      }),
    },
  });
  const response = await GET(new Request(`https://hub.test/api/projects?${search}`));
  assert.equal(response.status, 200);
  return response.json();
}

function renderHome(newProjects, loading = false) {
  // Positional useState mocks, in declaration order in app/page.tsx:
  // spotlights, trending, trendingFallback, newThisWeek, featured, loading.
  const states = [[], [], false, newProjects, [], loading];
  const effects = [];
  const requests = [];
  let stateIndex = 0;
  const { default: Home } = loadModule(pageCode, {
    react: {
      ...React,
      useState: () => [states[stateIndex++], () => {}],
      useEffect: (effect) => effects.push(effect),
    },
    "react/jsx-runtime": jsxRuntime,
    "next/link": ({ children, href }) => React.createElement("a", { href }, children),
    "@/components/FeaturedCarousel": () => null,
    "@/components/ProjectCard": ({ project: item, badge }) =>
      React.createElement("article", { "data-project-id": item.numericId }, `${badge.label}: ${item.name}`),
  }, {
    fetch: (url) => {
      requests.push(url);
      return Promise.resolve({ json: async () => ({ projects: [] }) });
    },
  });
  return {
    html: renderToStaticMarkup(React.createElement(Home)),
    effects,
    requests,
  };
}

describe("new-this-week project query", () => {
  for (const count of [0, 1, 2, 3]) {
    test(`${count} recent projects never pull in an older fallback`, async () => {
      const recent = Array.from({ length: count }, (_, index) => project(index + 1, index + 1));
      const result = await listProjects([project(90, 30), ...recent.reverse(), project(91, 8)]);
      assert.deepEqual(result.projects.map((item) => item.id), Array.from({ length: count }, (_, index) => index + 1));
      assert.equal(result.pagination.total, count);
      assert.equal(result.pagination.pages, count ? 1 : 0);
    });
  }

  test("includes the exact seven-day cutoff and excludes one millisecond older", async () => {
    const result = await listProjects([
      project(1, 7),
      project(2, 7, { created_at: new Date(NOW - 7 * DAY_MS - 1).toISOString() }),
      project(3, 1, { status: "pending" }),
      project(4, 2, { status: "featured" }),
    ]);
    assert.deepEqual(result.projects.map((item) => item.id), [4, 1]);
    assert.equal(result.pagination.total, 2);
  });

  test("sorts by timestamp even when timezone offsets differ", async () => {
    const result = await listProjects([
      project(1, 0, { created_at: "2026-10-20T23:00:00+02:00" }),
      project(2, 0, { created_at: "2026-10-20T22:00:00Z" }),
    ]);
    assert.deepEqual(result.projects.map((item) => item.id), [2, 1]);
  });

  test("homepage limit returns the six newest and counts only eligible projects", async () => {
    const rows = Array.from({ length: 8 }, (_, index) => project(index + 1, index / 2));
    const result = await listProjects([project(99, 9), ...rows.reverse()]);
    assert.deepEqual(result.projects.map((item) => item.id), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(result.pagination, { page: 1, limit: 6, total: 8, pages: 2 });
    const nextPage = await listProjects(rows, "sort=new-this-week&limit=6&page=2");
    assert.deepEqual(nextPage.projects.map((item) => item.id), [7, 8]);
  });

  test("orders in the database before its result-set cap", async () => {
    const rows = Array.from({ length: 1002 }, (_, index) => project(index + 1, index / 1000)).reverse();
    const result = await listProjects(rows);
    assert.deepEqual(result.projects.map((item) => item.id), [1, 2, 3, 4, 5, 6]);
    assert.equal(result.pagination.total, 1002);
  });

  test("other sorts retain older public projects", async () => {
    const result = await listProjects([project(1, 1), project(2, 30)], "sort=oldest");
    assert.deepEqual(result.projects.map((item) => item.id), [2, 1]);
    assert.equal(result.pagination.total, 2);
  });
});

describe("homepage new-this-week section", () => {
  test("hides the entire section after an empty response", () => {
    const { html } = renderHome([]);
    assert.doesNotMatch(html, /New this week|View All New|From Created At/);
    assert.doesNotMatch(html, /No new projects submitted/);
    assert.match(html, /Trending/);
  });

  for (const count of [1, 2, 3]) {
    test(`renders ${count} recent projects through ProjectCard`, () => {
      const { html } = renderHome(Array.from({ length: count }, (_, index) => project(index + 1, 1)));
      assert.match(html, /New this week/);
      assert.equal((html.match(/data-project-id=/g) || []).length, count);
      assert.match(html, /New: Project 1/);
    });
  }

  test("keeps the loading skeleton until the request settles", () => {
    const { html } = renderHome([], true);
    assert.match(html, /New this week/);
    assert.match(html, /skeleton h-56/);
  });

  test("requests the six newest projects using the real homepage effect", () => {
    const result = renderHome([]);
    result.effects.forEach((effect) => effect());
    const url = result.requests.find((value) => value.includes("sort=new-this-week"));
    assert.ok(url);
    assert.equal(new URL(url, "https://hub.test").searchParams.get("limit"), "6");
  });
});
