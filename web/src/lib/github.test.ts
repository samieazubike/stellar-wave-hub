import { describe, expect, it } from "vitest";
import { parseGithubRepo } from "./github";

describe("parseGithubRepo", () => {
  it.each([
    ["https://github.com/stellar/js-stellar-sdk", "stellar/js-stellar-sdk"],
    ["https://www.github.com/stellar/js-stellar-sdk/", "stellar/js-stellar-sdk"],
    ["https://github.com/stellar/js-stellar-sdk.git", "stellar/js-stellar-sdk"],
    ["https://github.com/a/b?tab=readme", "a/b"],
  ])("parses %s", (url, expected) => {
    expect(parseGithubRepo(url)).toBe(expected);
  });

  it.each([["https://gitlab.com/a/b"], ["https://github.com/onlyowner"], ["https://github.com/a/b/tree/main"], [null]])(
    "rejects %s",
    (url) => {
      expect(parseGithubRepo(url)).toBeNull();
    },
  );
});
