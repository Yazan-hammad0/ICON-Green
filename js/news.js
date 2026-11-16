/* News (real, from data/news.json, each item checked against its source) and updates (written in the app, demo). */
var News = (function(){
  var t = function(k, v){ return I18N.t(k, v); }, esc = UI.esc, L = UI.L;

  /* a real news item. extra = optional html line under the card (the investor's portfolio line) */
  function card(n, role, extra){
    var why = L(n, "why");
    return '<article class="card newscard"><div class="meta">' + UI.pill(I18N.opt("news_kind", n.kind)) + "<span>" + UI.date(n.date) + "</span></div>" +
      "<h2>" + esc(L(n, "title")) + "</h2><p>" + esc(L(n, "summary")) + "</p>" +
      (why ? '<p class="why"><b>' + t("icon_take") + "</b>" + esc(why) + "</p>" : "") + (extra || "") +
      (n.recheck ? '<p class="soft small">' + t("recheck_note") + "</p>" : "") +
      '<a class="src" href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer">' + UI.icon("link") + "<span>" + t("source") + ': <span class="ltr">' + esc(n.source_name) + "</span></span></a></article>";
  }
  /* an update from the app's own data: ICON posts, gate results, feedback notices */
  function updateCard(u){
    var title, body, p = u.project ? Store.getProject(u.project) : null, href = "";
    if (u.kind === "gate"){ title = t("upd_gate_title", {gate: I18N.stage(u.gate).gate}); body = t("upd_gate_body", {project: L(p, "name"), next: I18N.stage(Math.min(6, u.gate + 1)).name}); href = "#/project"; }
    else if (u.kind === "feedback"){ title = t("upd_feedback_title", {stage: I18N.stage(u.gate).name}); body = t("upd_feedback_body", {project: L(p, "name")}); href = "#/project/stage/" + u.gate; }
    else { title = L(u, "title"); body = L(u, "body"); }
    var role = (Store.getUser() || {}).role;
    return '<article class="card newscard"><div class="meta">' + UI.pill(I18N.opt("news_kind", "icon_update"), "lime") + "<span>" + UI.date(u.date) + "</span>" + UI.demo() + "</div>" +
      '<h2 dir="auto">' + esc(title) + '</h2><p dir="auto">' + esc(body) + "</p>" +
      (href && role === "founder" ? '<a class="btn small" href="' + href + '">' + t("open") + "</a>" : "") + "</article>";
  }
  function updatesFor(role){
    var mine = role === "founder" ? Store.myProjects().map(function(p){ return p.id; }) : [];
    return Store.getUpdates().filter(function(u){
      if (role === "team") return u.kind === "icon";
      if (!u.roles || u.roles.indexOf(role) < 0) return false;
      return !u.project || mine.indexOf(u.project) >= 0;
    });
  }
  function newsFor(role){ return Store.getNews().filter(function(n){ return !n.roles || !n.roles.length || n.roles.indexOf(role) >= 0; }); }

  /* everything a role should see, newest first */
  function feed(role, limit){
    var items = updatesFor(role).map(function(u){ return {date: u.date, html: updateCard(u)}; })
      .concat(newsFor(role).map(function(n){ return {date: n.date, html: card(n, role)}; }));
    items.sort(function(a, b){ return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    if (limit) items = items.slice(0, limit);
    return items.length ? '<div class="list">' + items.map(function(i){ return i.html; }).join("") + "</div>" : UI.empty(t("no_updates"));
  }
  function newsList(role){
    var items = newsFor(role);
    return items.length ? '<div class="list">' + items.map(function(n){ return card(n, role); }).join("") + "</div>" : UI.empty(t("no_updates"));
  }
  function screen(role){
    return '<div class="stack">' + UI.head(t("tab_updates"), {demo: false, sub: t("updates_sub")}) + feed(role) + "</div>";
  }
  return {card: card, updateCard: updateCard, updatesFor: updatesFor, newsFor: newsFor, feed: feed, newsList: newsList, screen: screen};
})();
