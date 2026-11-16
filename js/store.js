/* The only file that knows where data lives. Every screen reads and writes through the functions on Store.

   Today: Store.init() loads the demo records from data/*.json, and every change is kept on this device in
   localStorage under "iconGreenV1" (the signed-in user, the language, and changed or new records per collection).

   Later, with a real backend (Supabase or a Cloudflare Worker): keep the function names and what they return,
   and replace three private pieces only: load() (fetch the collections from the API instead of data/*.json),
   put() (send the record to the API instead of localStorage) and the user functions (real sign-in).
   Screens call getters after init() has finished, so getters can keep answering from the in-memory copy. */
var Store = (function(){
  var KEY = "iconGreenV1", NEWS_KEY = "iconGreenNews";
  var FILES = ["projects", "waste", "partners", "investors", "activity"];
  var seed = {}, news = [], state = {user: null, lang: "ar", changes: {}, installSeen: false};

  /* ---- private: storage ---- */
  function read(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch(e){ return null; } }
  function write(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function persist(){ write(KEY, state); }
  function iso(d){ return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function today(){ return iso(new Date()); }
  function daysAgo(n){ var d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
  /* Demo files give ages, not dates ("since_ago": 23 means 23 days ago), so the demo never looks stale. */
  function datesFromAges(x){
    if (Array.isArray(x)) return x.map(datesFromAges);
    if (x && typeof x === "object"){
      var o = {};
      Object.keys(x).forEach(function(k){
        if (/_ago$/.test(k) && typeof x[k] === "number") o[k.slice(0, -4)] = daysAgo(x[k]);
        else o[k] = datesFromAges(x[k]);
      });
      return o;
    }
    return x;
  }
  function load(){
    return Promise.all(FILES.map(function(f){
      return fetch("data/" + f + ".json").then(function(r){ if (!r.ok) throw new Error(f); return r.json(); });
    })).then(function(parts){
      parts.forEach(function(p){ p = datesFromAges(p); Object.keys(p).forEach(function(col){ seed[col] = p[col]; }); });
    });
  }
  function all(col){
    var base = seed[col] || [], ch = state.changes[col] || {}, seen = {};
    var out = base.map(function(r){ seen[r.id] = 1; return ch[r.id] || r; });
    Object.keys(ch).forEach(function(id){ if (!seen[id]) out.push(ch[id]); });
    return out;
  }
  function one(col, id){ return all(col).filter(function(r){ return r.id === id; })[0] || null; }
  function put(col, rec){
    if (!rec.id) rec.id = col.slice(0, 2) + "-" + Date.now().toString(36) + Math.floor(Math.random() * 1e3);
    if (!state.changes[col]) state.changes[col] = {};
    state.changes[col][rec.id] = rec;
    persist();
    return rec;
  }
  function copy(x){ return JSON.parse(JSON.stringify(x)); }

  /* ---- start-up ---- */
  function init(){
    var saved = read(KEY);
    if (saved && typeof saved === "object"){ state.user = saved.user || null; state.lang = saved.lang === "en" ? "en" : "ar"; state.changes = saved.changes || {}; state.installSeen = !!saved.installSeen; }
    news = read(NEWS_KEY) || [];
    return load();
  }

  /* ---- user (demo sign-in: no password, no server) ---- */
  function getUser(){ return state.user; }
  function signIn(profile){
    var byRole = {}; byRole[profile.role] = profile.fields || {};
    state.user = {role: profile.role, name: profile.name, org: profile.org || "", city: profile.city || "", fields: profile.fields || {}, fieldsByRole: byRole, date: today()};
    /* each sign-up on this device is one row in the demand panel */
    put("signups", {id: "su-me-" + profile.role, local: true, role: profile.role, city: profile.city || "other", waste: (profile.fields || {}).waste || null, date: today()});
    persist();
    return state.user;
  }
  function signOut(){ state.user = null; persist(); }
  function switchRole(role){
    if (!state.user) return;
    var defaults = {founder: {waste: "plastic", idea_stage: "prototype"}, waste_owner: {waste: "plastic", tonnes: 120}, partner: {partner_type: "lab"}, investor: {investor_type: "fund", sectors: ["plastic", "batteries", "organic"]}, team: {}};
    state.user.role = role; state.user.fields = Object.assign({}, defaults[role], state.user.fieldsByRole && state.user.fieldsByRole[role]);
    persist();
  }
  function getLang(){ return state.lang; }
  function setLang(l){ state.lang = l === "en" ? "en" : "ar"; persist(); }
  function installSeen(v){ if (v !== undefined){ state.installSeen = !!v; persist(); } return state.installSeen; }
  /* Which demo records belong to the signed-in user. A real backend returns the user's own records instead. */
  function me(){
    var u = state.user || {fields: {}}, p = (seed.personas || [])[0] || {};
    var type = (u.fields && u.fields.partner_type) || "lab";
    return {founder: p.founder, owner: p.owner, investor: p.investor, partner: (p.partner || {})[type] || (p.partner || {}).lab};
  }
  function resetDemo(){ var u = state.user; state.changes = {}; if (u) put("signups", {id: "su-me-" + u.role, local: true, role: u.role, city: u.city || "other", waste: (u.fields || {}).waste || null, date: today()}); persist(); }

  /* ---- projects and gates ---- */
  function getProjects(){ return all("projects"); }
  function getProject(id){ return one("projects", id); }
  function saveProject(p){ p = copy(p); if (!p.since) p.since = today(); if (!p.created) p.created = today(); return put("projects", p); }
  function myProjects(){ var f = me().founder; return getProjects().filter(function(p){ return p.founder === f; }); }
  function tick(id, stage, i, val){
    var p = copy(getProject(id)); if (!p) return;
    p.checks = p.checks || {}; var a = p.checks[stage] || []; a[i] = !!val; p.checks[stage] = a;
    return put("projects", p);
  }
  function passGate(id){
    var p = copy(getProject(id)); if (!p || p.stage >= 6) return p;
    var gate = p.stage; p.stage = gate + 1; p.since = today(); p.failed = null;
    put("projects", p);
    put("updates", {id: "", kind: "gate", date: today(), project: p.id, gate: gate, roles: ["founder"], local: true});
    return p;
  }
  function sendFeedback(id, text){
    var p = copy(getProject(id)); if (!p) return;
    p.failed = {stage: p.stage, text: text, date: today()};
    put("projects", p);
    put("updates", {id: "", kind: "feedback", date: today(), project: p.id, gate: p.stage, roles: ["founder"], local: true});
    return p;
  }

  /* ---- waste owners, streams, challenges ---- */
  function getOwners(){ return all("owners"); }
  function getOwner(id){ return one("owners", id); }
  function getStreams(){ return all("streams"); }
  function myStreams(){ var o = me().owner; return getStreams().filter(function(s){ return s.owner === o; }); }
  function saveStream(s){ s = copy(s); if (!s.owner) s.owner = me().owner; if (!s.date) s.date = today(); if (!s.id) s.local = true; return put("streams", s); }
  function getChallenges(){ return getStreams().filter(function(s){ return s.challenge; }); }

  /* ---- partners and requests ---- */
  function getPartners(){ return all("partners"); }
  function getPartner(id){ return one("partners", id); }
  function savePartner(p){ return put("partners", copy(p)); }
  function getRequests(){ return all("requests"); }
  function saveRequest(r){ r = copy(r); r.replied = today(); return put("requests", r); }

  /* ---- investors, portfolio, meetings ---- */
  function getInvestors(){ return all("investors"); }
  function getInvestor(id){ return one("investors", id); }
  function getCompanies(investorId){ return all("companies").filter(function(c){ return !investorId || c.investor === investorId; }); }
  function getCompany(id){ return one("companies", id); }
  function getPosts(investorId){
    var ids = getCompanies(investorId).map(function(c){ return c.id; });
    return all("posts").filter(function(p){ return ids.indexOf(p.company) >= 0; }).sort(byDate);
  }
  function getMeetings(){ return all("meetings"); }
  function saveMeeting(m){ m = copy(m); if (!m.date) m.date = today(); if (!m.id) m.local = true; return put("meetings", m); }

  /* ---- updates, sign-ups, news ---- */
  function byDate(a, b){ return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }
  function getUpdates(){ return all("updates").sort(byDate); }
  function saveUpdate(u){ u = copy(u); if (!u.date) u.date = today(); u.local = true; return put("updates", u); }
  function getSignups(){ return all("signups"); }
  function getNews(){ return news.slice().sort(byDate); }
  /* News is real and changes without a release: fetch it fresh when online, keep the last copy for offline. */
  function refreshNews(){
    return fetch("data/news.json", {cache: "no-store"}).then(function(r){ if (!r.ok) throw new Error("news"); return r.json(); })
      .then(function(list){ if (Array.isArray(list)){ var t = today(); news = list.filter(function(n){ return !n.until || n.until >= t; }); write(NEWS_KEY, news); } return true; })
      .catch(function(){ return false; });
  }

  return {
    init: init, today: today,
    getUser: getUser, signIn: signIn, signOut: signOut, switchRole: switchRole, getLang: getLang, setLang: setLang, installSeen: installSeen, me: me, resetDemo: resetDemo,
    getProjects: getProjects, getProject: getProject, saveProject: saveProject, myProjects: myProjects, tick: tick, passGate: passGate, sendFeedback: sendFeedback,
    getOwners: getOwners, getOwner: getOwner, getStreams: getStreams, myStreams: myStreams, saveStream: saveStream, getChallenges: getChallenges,
    getPartners: getPartners, getPartner: getPartner, savePartner: savePartner, getRequests: getRequests, saveRequest: saveRequest,
    getInvestors: getInvestors, getInvestor: getInvestor, getCompanies: getCompanies, getCompany: getCompany, getPosts: getPosts, getMeetings: getMeetings, saveMeeting: saveMeeting,
    getUpdates: getUpdates, saveUpdate: saveUpdate, getSignups: getSignups, getNews: getNews, refreshNews: refreshNews
  };
})();
