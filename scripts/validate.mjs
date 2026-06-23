#!/usr/bin/env node
// Zero-dependency sanity check for the marketplace, plugins, and skills.
// Run: node scripts/validate.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

let errors = 0;
const fail = (m) => { console.error("✗ " + m); errors++; };
const ok = (m) => console.log("✓ " + m);

function parseJSON(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (e) { fail(`${path} is not valid JSON: ${e.message}`); return null; }
}

// --- marketplace.json ---
const mkPath = ".claude-plugin/marketplace.json";
if (!existsSync(mkPath)) fail(`missing ${mkPath}`);
const mk = existsSync(mkPath) ? parseJSON(mkPath) : null;
if (mk) {
  if (!mk.name) fail("marketplace.json: missing 'name'");
  else if (!/^[a-z0-9-]+$/.test(mk.name)) fail("marketplace.json: 'name' must be kebab-case");
  else ok(`marketplace '${mk.name}'`);
  if (!mk.owner?.name) fail("marketplace.json: missing owner.name");
  if (!Array.isArray(mk.plugins) || mk.plugins.length === 0) fail("marketplace.json: 'plugins' must be a non-empty array");
}

const RESERVED = new Set([
  "claude-code-marketplace","claude-code-plugins","claude-plugins-official",
  "claude-plugins-community","claude-community","anthropic-marketplace",
  "anthropic-plugins","agent-skills","anthropic-agent-skills",
  "knowledge-work-plugins","life-sciences","claude-for-legal",
  "claude-for-financial-services","financial-services-plugins",
]);
if (mk?.name && RESERVED.has(mk.name)) fail(`marketplace name '${mk.name}' is reserved`);

// --- each plugin ---
for (const p of mk?.plugins ?? []) {
  const src = (p.source || "").replace(/^\.\//, "");
  const manifest = join(src, ".claude-plugin", "plugin.json");
  if (!existsSync(manifest)) { fail(`plugin '${p.name}': missing ${manifest}`); continue; }
  const pj = parseJSON(manifest);
  if (pj) {
    if (!pj.name) fail(`${manifest}: missing 'name'`);
    if (!pj.version) fail(`${manifest}: missing 'version' (required)`);
    else if (!/^\d+\.\d+\.\d+/.test(pj.version)) fail(`${manifest}: 'version' should be semver`);
    else ok(`plugin '${pj.name}' v${pj.version}`);
  }
  // --- skills in this plugin ---
  const skillsDir = join(src, "skills");
  if (existsSync(skillsDir)) {
    for (const d of readdirSync(skillsDir)) {
      const skillMd = join(skillsDir, d, "SKILL.md");
      if (!existsSync(skillMd)) { fail(`skill '${d}': missing SKILL.md`); continue; }
      const body = readFileSync(skillMd, "utf8");
      const fm = body.match(/^---\n([\s\S]*?)\n---/);
      if (!fm) { fail(`${skillMd}: missing YAML frontmatter`); continue; }
      if (!/\bname\s*:/.test(fm[1])) fail(`${skillMd}: frontmatter missing 'name'`);
      if (!/\bdescription\s*:/.test(fm[1])) fail(`${skillMd}: frontmatter missing 'description'`);
      else ok(`skill '${d}' frontmatter`);
    }
  }
}

if (errors) { console.error(`\n${errors} problem(s) found.`); process.exit(1); }
console.log("\nAll checks passed.");
