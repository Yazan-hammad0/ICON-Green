# Working on ICON Green

Read README.md first for the file map, then docs/ARCHITECTURE.md. The business is described in `brief/BRIEF.md` (on the owner's Mac only, not in the repo): it is the source of truth.

## Rules
- Small changes: one problem, one fix, shipped the same day. No frameworks, no build tools, no npm dependencies shipped to the browser.
- Every change to the app ends with `python3 release.py "<one line for users>"`, then commit and push. Without it, installed apps never update. News alone (`data/news.json`) needs no release.
- A new file in `js/` must be added in three places: a `<script>` in index.html, the `SHELL` list in sw.js, the `files` list in release.py. `node tools/check.js` fails if one is missing.
- Test before pushing. `node tools/check.js` first. Then serve the folder (`python3 -m http.server 8765`) and run `node tools/walk.js http://localhost:8765/ <shots folder>` (Playwright, iPhone viewport and one desktop width, Arabic and English, light and dark, home-screen mode by faking `navigator.standalone = true`). Zero page errors, zero console errors, no horizontal scroll at 375 px. Look at the screenshots of the screen you changed. The walk blocks service workers; if you test by hand, unregister the service worker between runs or you test old files.
- The home-screen app uses a screen-tall shell (`html.shell` in css/app.css and js/shell.js): content scrolls inside `<main>`, not the page. Use `App.scrollTop0()`, never `window.scrollTo`.
- Accounts: `js/config.js` empty means accounts stay on the device. Filled in, `js/backend.js` talks to Supabase (setup in docs/BACKEND.md). Only `js/store.js` may call `Backend`. Never show names or emails of registered people inside the app, and never commit a `service_role` key.
- Motion lives in the last section of css/app.css, inside `@media (prefers-reduced-motion:no-preference)`. Entrance animations hang on `main.enter`, which the app sets once per screen, so a re-render after a tap does not replay them.
- Keep copy short: a screen title, at most one line under it, and labels. If a sentence is not needed to act, cut it.
- All data access goes through `js/store.js`. Screens never touch localStorage or fetch. Keep the function names stable so a real backend can replace the inside of the store later.
- Every UI string lives in `js/i18n.js` as `{ key: { ar: "...", en: "..." } }`, both filled. Option lists (roles, waste types, cities) go in `OPT`. No Arabic or English user text in other files.
- Arabic first, right to left. Use `text-align: start`, `margin-inline-*`, `padding-inline-*`, logical properties everywhere. No `letter-spacing` and no italics. Icons that point a direction get the class `flip`. Wrap Latin names inside Arabic sentences in ⁦…⁩. Join lists with `t("list_sep")`. After a UI change look at it in both languages.
- Arabic copy: Modern Standard Arabic, plain business tone, short sentences, Saudi context. Western digits. Currency SAR (ريال), weights in tonnes (طن), dates as "16 نوفمبر 2026". English: plain and direct. No em dashes in any language. Sentence case.
- Brand: deep green #103B28 and lime #93FF5E. Lime only sits on deep green, or carries deep green text. Lime text on white is not allowed. Fonts are Alexandria (headings, big numbers) and IBM Plex Sans Arabic (reading), served from `fonts/`, never from an outside font service. Weights: 600 headings, 500 labels, 400 body, nothing above 700. Light and dark follow the phone. No imagery of heavy assets (buildings, factories, production lines owned by ICON) and no recycling arrows symbol.
- Every logo reference in code goes through `js/brand.js`. The interim logo has dark ink, so it always sits on a light plate.
- One main action per screen (`.btn.pop`). Other buttons are plain `.btn` or `.btn.quiet`.
- Accessibility: real buttons and labels, visible focus, 44 px touch targets, `prefers-reduced-motion` respected, contrast at least 4.5:1.
- Demo data: everything that is not real is demo data in `data/*.json`. Names are clearly invented and say "تجريبي" / "demo". No real companies, people or phone numbers. Every screen that shows demo data shows the "بيانات تجريبية / Demo data" label (`UI.head` adds it unless `demo: false`). Give ages (`*_ago`, in days), not dates. Saudi cities, SAR amounts and tonnes must be plausible.
- Never show prices. Prices are set after the market study.
- Never present any organisation as an ICON partner. No partnership is confirmed.
- News: only real items in `data/news.json`, from official sources (MWAN, MODON, Monsha'at, MEWA, SPA, PIF, ministries, the European Commission) or established outlets. For every item open the URL and check that it loads and says what the summary says. If you cannot verify it, leave it out. Never invent news. Mark figures that change (fees, targets, dates) with a `recheck` note. `why_ar` / `why_en` is one line, shown as ICON's take.
- Privacy: the repo is public. No personal details of anyone, in code, data, docs or commit messages. `brief/`, `PROMPT.md` and `notes.md` stay out of git. The page keeps `<meta name="robots" content="noindex">` while this is a team demo.
- Health rules for portfolio companies live in `js/investor.js` (`health`): red if runway under 6 months or revenue fell 3 months in a row, amber if runway 6 to 12 months or no update for 45 days, green otherwise.
- Stage 1 score weights in `js/i18n.js` (`WEIGHTS`) are provisional until the team agrees them.
