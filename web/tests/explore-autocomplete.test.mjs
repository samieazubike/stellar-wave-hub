import {test, describe} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

describe("Explore project autocomplete", () => {
	const routeFile = path.join(webRoot, "src", "app", "api", "projects", "suggest", "route.ts");
	const pageFile = path.join(webRoot, "src", "app", "explore", "page.tsx");

	test("exposes an approved-project suggestion endpoint", () => {
		assert.ok(fs.existsSync(routeFile), "suggest/route.ts must exist");
		const content = fs.readFileSync(routeFile, "utf-8");
		assert.match(content, /export async function GET\(/);
		assert.match(content, /\.in\("status", \["approved", "featured"\]\)/);
		assert.match(content, /\.ilike\("name", `%\$\{q\}%`\)/);
		assert.match(content, /\.slice\(0, 6\)/);
	});

	test("uses a 250ms debounce and project navigation", () => {
		const content = fs.readFileSync(pageFile, "utf-8");
		assert.match(content, /}, 250\)/);
		assert.match(content, /\/api\/projects\/suggest\?q=/);
		assert.match(content, /router\.push\(`\/projects\/\$\{suggestion\.slug\}`\)/);
	});

	test("provides combobox semantics and keyboard controls", () => {
		const content = fs.readFileSync(pageFile, "utf-8");
		assert.match(content, /role="combobox"/);
		assert.match(content, /aria-autocomplete="list"/);
		assert.match(content, /role="listbox"/);
		assert.match(content, /role="option"/);
		assert.match(content, /event\.key === "ArrowDown"/);
		assert.match(content, /event\.key === "ArrowUp"/);
		assert.match(content, /event\.key === "Enter"/);
		assert.match(content, /event\.key === "Escape"/);
	});
});
