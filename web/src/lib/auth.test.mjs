import assert from "node:assert/strict";
import test from "node:test";

import { ACTIONS, can, requireRole, signToken } from "./auth.ts";

const expectedPermissions = {
  contributor: [],
  maintainer: ["approve", "reject", "feature", "delist"],
  admin: [...ACTIONS],
};

for (const [role, allowedActions] of Object.entries(expectedPermissions)) {
  test(`${role} has the expected permissions`, () => {
    for (const action of ACTIONS) {
      assert.equal(can(role, action), allowedActions.includes(action), `${role}: ${action}`);
    }
  });
}

test("unknown roles and actions are denied", () => {
  assert.equal(can("owner", "approve"), false);
  assert.equal(can("admin", "unknown"), false);
});

test("requireRole enforces the role hierarchy", () => {
  const requestFor = (role) =>
    new Request("https://example.test", {
      headers: { Authorization: `Bearer ${signToken({ userId: 1, role })}` },
    });

  assert.equal(requireRole(requestFor("contributor"), "maintainer"), null);
  assert.equal(requireRole(requestFor("maintainer"), "maintainer")?.role, "maintainer");
  assert.equal(requireRole(requestFor("admin"), "maintainer")?.role, "admin");
  assert.equal(requireRole(requestFor("unknown"), "contributor"), null);
  assert.equal(requireRole(new Request("https://example.test"), "contributor"), null);
});
