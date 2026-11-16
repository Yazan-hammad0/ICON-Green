#!/usr/bin/env node
/* Fast checks with no dependencies. Run: node tools/check.js
   1. Every string key and option group used in js/ exists in js/i18n.js, in Arabic and English.
   2. No em or en dashes anywhere in the app's text.
   3. Every data/*.json file parses, and news items have all their fields and an https source.
   4. Every file the service worker caches exists, and release.py covers the same code files.
   5. Demo records are labelled as demo (name contains "تجريبي" / "demo"). */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
let bad = 0;
const fail = (m) => { console.log("FAIL  " + m); bad++; };

/* 1. strings */
const ctx = {window: {}, document: {documentElement: {}}};
vm.createContext(ctx);
vm.runInContext(read("js/i18n.js") + ";this.I18N = I18N;", ctx);
const S = ctx.I18N._S, OPT = ctx.I18N._OPT, used = new Set();
const jsFiles = fs.readdirSync(path.join(root, "js")).filter((f) => f.endsWith(".js"));
for (const f of jsFiles) {
  const s = read("js/" + f);
  for (const m of s.matchAll(/\bt(?:r)?\(\s*"([a-z0-9_]+)"/g)) used.add(m[1]);
  for (const m of s.matchAll(/label: "([a-z_]+)"/g)) used.add(m[1]);
  for (const m of s.matchAll(/(?:opt|keys)\("([a-z_]+)"/g)) if (!OPT[m[1]]) fail(`option group "${m[1]}" used in js/${f} is missing from i18n.js`);
}
for (const k of used) if (!k.endsWith("_") && !S[k]) fail(`string "${k}" is used but missing from i18n.js`);
for (const k in S) if (!S[k].ar || !S[k].en) fail(`string "${k}" needs both ar and en`);
for (const g in OPT) for (const k in OPT[g]) if (!OPT[g][k].ar || !OPT[g][k].en) fail(`option ${g}.${k} needs both ar and en`);

/* 2. dashes */
const textFiles = ["index.html", "css/app.css", "manifest.webmanifest", "README.md", "CLAUDE.md", "CONTRIBUTING.md", "CHANGELOG.md", "SECURITY.md", "docs/ARCHITECTURE.md"]
  .concat(jsFiles.map((f) => "js/" + f), fs.readdirSync(path.join(root, "data")).map((f) => "data/" + f));
for (const f of textFiles) { if (fs.existsSync(path.join(root, f)) && /[—–]/.test(read(f))) fail(`em or en dash in ${f}`); }

/* 3. data */
const data = {};
for (const f of fs.readdirSync(path.join(root, "data")).filter((x) => x.endsWith(".json"))) {
  try { data[f] = JSON.parse(read("data/" + f)); } catch (e) { fail(`data/${f} is not valid JSON: ${e.message}`); }
}
const NEWS = ["id", "date", "kind", "title_ar", "title_en", "summary_ar", "summary_en", "why_ar", "why_en", "source_name", "url", "roles", "sectors"];
const KINDS = Object.keys(OPT.news_kind), ROLES = Object.keys(OPT.role), WASTE = Object.keys(OPT.waste).concat(["all"]);
for (const n of data["news.json"] || []) {
  for (const k of NEWS) if (n[k] == null || n[k] === "" || (Array.isArray(n[k]) && !n[k].length)) fail(`news ${n.id}: missing ${k}`);
  if (!/^https:\/\//.test(n.url || "")) fail(`news ${n.id}: url must be https`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date || "")) fail(`news ${n.id}: date must be YYYY-MM-DD`);
  if (!KINDS.includes(n.kind)) fail(`news ${n.id}: unknown kind ${n.kind}`);
  for (const r of n.roles || []) if (!ROLES.includes(r)) fail(`news ${n.id}: unknown role ${r}`);
  for (const s of n.sectors || []) if (!WASTE.includes(s)) fail(`news ${n.id}: unknown sector ${s}`);
}

/* 5. demo labels */
const demoName = (o) => /تجريبي/.test(o.name_ar || "") && /demo/i.test(o.name_en || "");
const named = [["projects.json", "projects"], ["waste.json", "owners"], ["partners.json", "partners"], ["investors.json", "investors"], ["investors.json", "companies"]];
for (const [f, col] of named) for (const o of (data[f] || {})[col] || []) if (!demoName(o)) fail(`${f} ${col} ${o.id}: demo names must say "تجريبي" and "demo"`);

/* 4. service worker and release lists */
const sw = read("sw.js"), rel = read("release.py");
for (const m of sw.matchAll(/"\.\/([^"]+)"/g)) if (m[1] && !fs.existsSync(path.join(root, m[1]))) fail(`sw.js caches ./${m[1]} but the file does not exist`);
for (const f of jsFiles) {
  if (!sw.includes(`"./js/${f}"`)) fail(`js/${f} is not in the sw.js cache list`);
  if (f !== "shell.js" && !rel.includes(`"js/${f}"`)) fail(`js/${f} is not in the release.py file list`);
  if (!read("index.html").includes(`src="js/${f}"`)) fail(`js/${f} is not loaded by index.html`);
}

console.log(bad ? `\n${bad} problem(s)` : `OK  ${used.size} strings, ${(data["news.json"] || []).length} news items, ${jsFiles.length} scripts`);
process.exit(bad ? 1 : 0);
