// ICON Green offline cache. release.py stamps VERSION; a new VERSION makes phones download everything fresh.
const VERSION = "7b6e4dbf57";
const CACHE = "icongreen-" + VERSION;
const SHELL = ["./", "./index.html", "./css/app.css", "./js/brand.js", "./js/i18n.js", "./js/config.js", "./js/backend.js", "./js/store.js", "./js/ui.js", "./js/news.js", "./js/auth.js", "./js/onboard.js", "./js/founder.js", "./js/waste.js", "./js/partner.js", "./js/investor.js", "./js/team.js", "./js/app.js", "./js/shell.js", "./manifest.webmanifest",
  "./data/projects.json", "./data/waste.json", "./data/partners.json", "./data/investors.json", "./data/activity.json",
  "./icons/icon.png", "./icons/logo.png", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png",
  "./fonts/alexandria-arabic.woff2", "./fonts/alexandria-latin.woff2", "./fonts/plex-arabic-arabic-400.woff2", "./fonts/plex-arabic-arabic-500.woff2", "./fonts/plex-arabic-arabic-600.woff2", "./fonts/plex-arabic-latin-400.woff2", "./fonts/plex-arabic-latin-500.woff2", "./fonts/plex-arabic-latin-600.woff2"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const root = new URL("./", self.location).pathname, rest = url.pathname.slice(root.length);
  if (url.pathname.indexOf(root) !== 0) return;
  if (req.mode === "navigate" && rest !== "" && rest !== "index.html") return;
  // news is fetched fresh whenever the phone is online; js/store.js keeps the last copy for offline use
  if (rest === "data/news.json") return;
  // network first for the page (so updates arrive), cache when offline
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res; })
      .catch(() => caches.match("./index.html", {ignoreSearch: true})));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
});
