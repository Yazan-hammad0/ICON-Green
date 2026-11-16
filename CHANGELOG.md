# Changelog

All notable changes to the ICON Green app. Newest first.

## 0.2.0, 17 November 2026

Less text, clearer value, real registration path, motion.

### Added
- Welcome shows what each kind of user gets: pick founder, waste owner, partner or investor and see three benefits and a sample of the first screen.
- Registration by name and email. With the backend connected (`docs/BACKEND.md`) it uses an emailed 6-digit code, saves progress to the account and counts sign-ups across devices. Without it, the account stays on the device.
- Install guide that detects the browser (Safari, Chrome, Samsung Internet, Firefox, in-app browsers, desktop) and plays the three steps for it on a small animated screen. On a phone it is the first thing a new visitor sees.
- Motion: screens arrive as a cascade, the journey draws itself, charts and bars fill in, numbers count up, touch feedback on buttons and cards. All of it is off when the device asks for reduced motion.

### Changed
- Much shorter copy on the welcome screen and across the role screens.
- Registration asks for fewer fields.

## 0.1.0, 16 November 2026

First demo for the ICON team.

### Added
- One app for five roles: founder, waste owner, partner, investor and ICON team. The role is picked at the demo sign-in and the whole app adapts.
- Founder: "do this next", the six-gate route, tickable gate checklists, feedback from ICON, submit an idea or a solution to an industrial challenge.
- Waste owner: waste streams, post a stream as an industrial challenge, pipeline projects that work on the same waste type.
- Partner: matching requests for lab tests, line time and expert reviews, accept or decline, offer and capacity.
- Investor: portfolio with health rules and alerts, revenue chart, deal flow of projects that passed gate 4, meeting requests, insights by sector.
- ICON team: pipeline board, pass a gate or send feedback, demand panel, inbox, write updates for chosen roles.
- Arabic (right to left) and English, light and dark themes, installable to the home screen, works offline.
- 14 real news items, each checked against its source, with ICON's take.
- Demo data for 8 projects, 4 waste owners, 6 partners, 2 investors and 7 portfolio companies.
- Fast checks (`tools/check.js`) and a browser walk-through (`tools/walk.js`).
