import { describe, expect, it } from "vitest";
import { isSafeSvg } from "./uploadValidation";

describe("isSafeSvg", () => {
  it("accepts a plain drawing", () => {
    expect(
      isSafeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>'),
    ).toBe(true);
  });

  it.each([
    ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
    ['<svg xmlns="http://www.w3.org/2000/svg"><x:script xmlns:x="http://www.w3.org/2000/svg">alert(1)</x:script></svg>'],
    ['<svg xmlns="http://www.w3.org/2000/svg"><svg:foreignObject/></svg>'],
    ['<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'],
    ['<svg xmlns="http://www.w3.org/2000/svg"><use href="https://evil.example/x.svg#a"/></svg>'],
  ])("rejects %s", (svg) => {
    expect(isSafeSvg(svg)).toBe(false);
  });
});
