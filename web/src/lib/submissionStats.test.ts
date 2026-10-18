// Run with: npm test (node --test --experimental-strip-types, Node >= 22.6)
import { test } from "node:test";
import assert from "node:assert/strict";
import { weeklySubmissionStats, startOfUtcWeek } from "./submissionStats.ts";

const NOW = new Date("2026-10-18T12:00:00Z"); // Sunday

test("startOfUtcWeek returns the Monday 00:00 UTC of the week", () => {
  assert.equal(startOfUtcWeek(NOW).toISOString(), "2026-10-12T00:00:00.000Z");
  assert.equal(
    startOfUtcWeek(new Date("2026-10-12T00:00:00Z")).toISOString(),
    "2026-10-12T00:00:00.000Z",
  );
});

test("returns 12 consecutive weeks ending with the current week, zero-filled", () => {
  const weeks = weeklySubmissionStats([], [], NOW);
  assert.equal(weeks.length, 12);
  assert.equal(weeks[0].week_start, "2026-07-27");
  assert.equal(weeks[11].week_start, "2026-10-12");
  assert.ok(weeks.every((w) => w.submissions === 0 && w.approvals === 0));
});

test("counts submissions by project created_at and approvals by approval event", () => {
  const weeks = weeklySubmissionStats(
    [
      { created_at: "2026-10-13T09:00:00Z" },
      { created_at: "2026-10-12T00:00:00Z" },
      { created_at: "2026-10-06T09:00:00Z" },
    ],
    [
      { project_id: 1, status: "approved", created_at: "2026-10-14T09:00:00Z" },
      { project_id: 2, status: "featured", created_at: "2026-10-08T09:00:00Z" },
      { project_id: 3, status: "rejected", created_at: "2026-10-13T00:00:00Z" },
    ],
    NOW,
  );
  assert.deepEqual(weeks[11], { week_start: "2026-10-12", submissions: 2, approvals: 1 });
  assert.deepEqual(weeks[10], { week_start: "2026-10-05", submissions: 1, approvals: 1 });
});

test("approve then feature of the same project in one week counts once", () => {
  const weeks = weeklySubmissionStats(
    [],
    [
      { project_id: 7, status: "approved", created_at: "2026-10-13T09:00:00Z" },
      { project_id: 7, status: "featured", created_at: "2026-10-15T09:00:00Z" },
      { project_id: 7, status: "featured", created_at: "2026-10-06T09:00:00Z" },
    ],
    NOW,
  );
  assert.equal(weeks[11].approvals, 1);
  assert.equal(weeks[10].approvals, 1);
});

test("ignores rows outside the window and invalid or missing dates", () => {
  const weeks = weeklySubmissionStats(
    [
      { created_at: "2026-07-26T23:59:59Z" },
      { created_at: "not-a-date" },
      {},
      { created_at: "2026-07-27T00:00:00Z" },
      { created_at: "2026-10-19T00:00:00Z" },
    ],
    [
      { project_id: 1, status: "approved", created_at: "2026-07-26T23:59:59Z" },
      { project_id: 2, status: "approved" },
    ],
    NOW,
  );
  assert.equal(weeks.reduce((s, w) => s + w.submissions, 0), 1);
  assert.equal(weeks[0].submissions, 1);
  assert.equal(weeks.reduce((s, w) => s + w.approvals, 0), 0);
});
