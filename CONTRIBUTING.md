# Contributing

This is a small demo with a small team. Keep changes small too: one problem, one fix.

## Before you start

- Read [README.md](README.md) for the file map and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit.
- Open an issue first for anything larger than a fix, so the direction is agreed before the work.

## Ground rules

| Area | Rule |
|---|---|
| Stack | Plain HTML, CSS and JavaScript. No framework, no build step, nothing from npm shipped to the browser |
| Data | Only `js/store.js` reads or writes data |
| Strings | Every user-facing string goes in `js/i18n.js`, in Arabic and English |
| Layout | Logical CSS properties only, so right to left works. No `letter-spacing`, no italics |
| Copy | Plain and direct. Sentence case. No em dashes in any language |
| Brand | Lime `#93FF5E` only on deep green `#103B28`, or as a background with deep green text |
| Screens | One main action per screen |
| Demo data | Invented names that say "تجريبي" / "demo". No real companies, people or phone numbers |
| News | Real, dated, linked, and checked against the source by a person. If in doubt, leave it out |
| Privacy | No personal details of anyone, anywhere in the repo |

## Workflow

1. Make the change.
2. Run the fast checks:

   ```bash
   node tools/check.js
   ```

3. Serve the folder and run the browser walk-through (see README, "Checks and tests"). It must end with `WALK OK, 0 problems`.
4. Look at the screen you changed in Arabic and English, light and dark.
5. Stamp a version, with one line a user would understand:

   ```bash
   python3 release.py "What is new, in one line"
   ```

6. Commit with a short message in the imperative ("Add capacity field to partner offer") and open a pull request.

## Adding a screen file

A new file in `js/` has to be listed in three places: a `<script>` tag in `index.html`, the `SHELL` list in `sw.js`, and the `files` list in `release.py`. The fast checks fail if one is missing.

## Reporting a problem

Use the bug report template. Say which role, which tab, which language, light or dark, phone or desktop, and whether the app was installed to the home screen.
