# Architecture

How the ICON Green demo app is put together, and how to grow it.

## Principles

- **Plain files.** HTML, CSS and JavaScript. No framework, no build step, no runtime dependencies. What is in the repo is what the browser gets.
- **One data door.** Only `js/store.js` reads or writes data.
- **One string file.** Every string a user sees is in `js/i18n.js`, in Arabic and English.
- **One logo file.** Every logo reference in code is in `js/brand.js`.
- **Arabic first.** `<html lang="ar" dir="rtl">` from the first byte. English flips `lang` and `dir`.

## Load order

`index.html` loads scripts in this order, and the order matters:

1. `brand.js`, `i18n.js`, `config.js`, `backend.js`, `store.js`, `ui.js`: no dependencies on screens.
2. `app.js`: defines `App` and `Screens`. Screens register themselves on these.
3. `news.js`, `auth.js`, `onboard.js`, then one file per role.
4. `shell.js`: home-screen layout, service worker, update card.
5. `App.start()`.

## Routing

The address after `#/` picks the screen: `#/tab`, `#/tab/sub/id`. Examples: `#/project/stage/2`, `#/portfolio/c/c2`, `#/pipeline/p/p3`.

`App.render()` runs on every `hashchange`. It decides between the before sign-in screens (`Auth`), the install guide (`Onboard`), the profile, and the current role's screens.

A role file registers itself like this:

```js
Screens.founder = {
  tabs: [{id: "home", icon: "home", label: "tab_home"}, …],   // four tabs
  render: function(tab, rest){ return "<html string>"; }       // or {html, wide: true}
};
```

## Events

Screens return HTML strings. Nothing binds listeners by hand. `app.js` listens once on the document:

| In the HTML | Handled by |
|---|---|
| `data-act="name"` on a button or link | `App.actions.name(dataset, element)` on click |
| `data-act="name"` on an input | `App.actions.name(dataset, element)` on change |
| `<form data-form="name">` | `App.forms.name(values, form)` on submit |

After changing data, a handler calls `App.render()`.

## Data

### Collections

| Collection | File | What it is |
|---|---|---|
| `projects` | `data/projects.json` | Pipeline projects: stage, gate checklist ticks, scores, feedback |
| `owners`, `streams` | `data/waste.json` | Waste owners and their waste streams. A stream with `challenge: true` is an open industrial challenge |
| `partners`, `requests` | `data/partners.json` | Labs, factories, universities, experts, and the requests projects send them |
| `investors`, `companies`, `posts`, `meetings` | `data/investors.json` | Investors, their portfolio companies, company posts, meeting requests |
| `personas`, `updates`, `signups` | `data/activity.json` | Which demo records belong to each role, ICON updates, sign-ups for the demand panel |
| news | `data/news.json` | Real news. Fetched fresh when online, kept in localStorage (`iconGreenNews`) for offline |

### How changes are kept

The seed files are never changed by the app. A changed or new record is saved whole, per collection, in localStorage under `iconGreenV1`:

```json
{ "user": {…}, "lang": "ar", "installSeen": true, "changes": { "projects": { "p1": {…} } } }
```

A getter returns the seed list with changed records swapped in and new ones added. "Reset demo data" empties `changes`.

### Ages instead of dates

Seed files give ages. Any key ending in `_ago` holds a number of days, and the store adds a date key without the suffix on load: `"since_ago": 23` becomes `since: "2026-10-24"` when loaded on 16 November 2026.

### The Store API

| Area | Functions |
|---|---|
| Start | `init()`, `today()` |
| User | `getUser()`, `signIn(profile)`, `signOut()`, `switchRole(role)`, `me()`, `getLang()`, `setLang()`, `installSeen()`, `resetDemo()` |
| Projects | `getProjects()`, `getProject(id)`, `myProjects()`, `saveProject(p)`, `tick(id, stage, i, value)`, `passGate(id)`, `sendFeedback(id, text)` |
| Waste | `getOwners()`, `getOwner(id)`, `getStreams()`, `myStreams()`, `saveStream(s)`, `getChallenges()` |
| Partners | `getPartners()`, `getPartner(id)`, `savePartner(p)`, `getRequests()`, `saveRequest(r)` |
| Investors | `getInvestors()`, `getInvestor(id)`, `getCompanies(investorId)`, `getCompany(id)`, `getPosts(investorId)`, `getMeetings()`, `saveMeeting(m)` |
| Feed | `getUpdates()`, `saveUpdate(u)`, `getSignups()`, `getNews()`, `refreshNews()` |

### Accounts

`Store.register(profile, password)` and `Store.login(email, password)` are the only doors. With `js/config.js` empty, `register` saves the user on the device and resolves `{done: true}`. With a backend named, `register` opens a new account (or the existing one if the email is known and the password fits), saves the profile, and loads progress saved from another device; `login` opens an existing account and brings its profile back. A failure carries `kind`: `exists`, `wrong`, `weak`, `setup` or `net`. After sign-in every `persist()` also queues a save of the user's changes to their account. `Store.remoteCounts()` returns sign-up totals for the demand panel. Setup: [BACKEND.md](BACKEND.md).

### Moving to a real backend

Keep every function name and return shape above. Inside `js/store.js`:

1. **`load()`** fetches `data/*.json`. Point it at the API (for example one request per collection, or one for all). Getters keep answering from the in-memory copy, so screens stay synchronous.
2. **`put(collection, record)`** writes to localStorage. Send the record to the API instead, and keep the in-memory copy in step. If the write can fail, return a promise and show a toast in the handler that called it.
3. **`signIn`, `signOut`, `getUser`, `me`** hold the demo sign-in. Replace them with real sign-in. `me()` must return the ids of the records that belong to the user (their founder id, owner id, partner id, investor id).
4. Delete `switchRole` and "Switch role (demo)" in `js/app.js`, and compute the demand panel on the server so it counts every device.

Nothing in the role files needs to change.

## News

Fields of an item in `data/news.json`:

| Field | Meaning |
|---|---|
| `id` | Unique, starts with `n-` |
| `date` | `YYYY-MM-DD`, the publication date |
| `kind` | `news`, `regulation`, `funding`, `event` or `icon_update` |
| `title_ar`, `title_en` | Headline |
| `summary_ar`, `summary_en` | Two sentences, naming who reported it |
| `why_ar`, `why_en` | One line, shown as ICON's take |
| `source_name`, `url` | The source, https only |
| `roles` | Who sees it: `founder`, `waste_owner`, `partner`, `investor`, `team` |
| `sectors` | Waste types it touches, or `["all"]` |
| `until` | Optional. The item is hidden after this date |
| `recheck` | Optional. Why a figure or date in it may change |

Rules: prefer official sources and established outlets. Open the link and check it loads and says what the summary says. If you cannot verify an item, leave it out. Never present an organisation as an ICON Green partner.

The investor's Insights tab filters news by the sectors picked at sign-in, and adds a "what this means for your portfolio" line when an item's sectors match a portfolio company.

## Layout and the home-screen shell

In the browser the header is sticky and the tab bar is fixed. Installed to the home screen, `js/shell.js` adds the class `shell` to `<html>` and the app becomes one block exactly as tall as the screen: header, scrolling `<main>`, tab bar. Nothing is pinned to the viewport, because iOS sometimes reports it shorter than the screen. Use `App.scrollTop0()`, never `window.scrollTo`.

## Right to left

- Logical properties only: `margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `text-align: start`.
- No `letter-spacing` and no italics.
- Icons that point a direction carry the class `flip` and mirror in RTL.
- Latin names inside Arabic strings are wrapped in U+2066 and U+2069 so they stay in order.
- Lists join with the `list_sep` string, so Arabic gets the Arabic comma.

## Brand

Deep green `#103B28`, lime `#93FF5E`. Lime only sits on deep green, or carries deep green text. Lime text on white is not allowed. Alexandria for headings and big numbers, IBM Plex Sans Arabic for reading text. Weights: 600 headings, 500 labels, 400 body. One main action per screen (`.btn.pop`).

## Updates to installed apps

`python3 release.py "what is new"` hashes the app's files and writes the version into `sw.js` and `js/shell.js`. A new version makes the service worker fetch everything again. If the user has not touched the screen yet the app reloads itself, otherwise a card offers the update.
