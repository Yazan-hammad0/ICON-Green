/* Investor (مستثمر): portfolio with health rules, deal flow, insights, updates from portfolio companies. */
(function(){
  var t = function(k, v){ return I18N.t(k, v); }, esc = UI.esc, L = UI.L;

  function me(){ return Store.getInvestor(Store.me().investor); }
  function companies(){ return Store.getCompanies(me().id); }
  function fell3(rev){ var n = rev.length; return n >= 4 && rev[n - 1] < rev[n - 2] && rev[n - 2] < rev[n - 3] && rev[n - 3] < rev[n - 4]; }
  /* Health rules. Red: runway under 6 months, or revenue fell 3 months in a row.
     Amber: runway 6 to 12 months, or no update for 45 days. Green otherwise. */
  function health(c){
    var a = [], quiet = UI.daysSince(c.updated);
    if (c.runway < 6) a.push({tone: "red", text: t("al_runway_low")});
    if (fell3(c.revenue)) a.push({tone: "red", text: t("al_rev_fell")});
    if (c.runway >= 6 && c.runway <= 12) a.push({tone: "amber", text: t("al_runway_mid")});
    if (quiet >= 45) a.push({tone: "amber", text: t("al_quiet")});
    var tone = a.some(function(x){ return x.tone === "red"; }) ? "red" : a.length ? "amber" : "green";
    if (c.gate_event) a.push({tone: "green", text: t("al_gate", {n: c.gate_event.gate})});
    return {tone: tone, alerts: a};
  }
  function healthPill(h){ return '<span class="pill ' + h.tone + '"><i></i>' + t("health_" + h.tone) + "</span>"; }

  function portfolio(rest){
    if (rest[0] === "c" && rest[1]){ var one = Store.getCompany(rest[1]); if (one && one.investor === me().id) return company(one); }
    var u = Store.getUser(), list = companies(), hs = list.map(health), alerts = [];
    list.forEach(function(c, i){ hs[i].alerts.forEach(function(a){ alerts.push({tone: a.tone, text: a.text, c: c}); }); });
    var order = {red: 0, amber: 1, green: 2}; alerts.sort(function(a, b){ return order[a.tone] - order[b.tone]; });
    var sum = function(k){ return list.reduce(function(s, c){ return s + c[k]; }, 0); };
    return '<div class="stack">' + UI.head(t("tab_portfolio"), {sub: t("hello", {name: u.name})}) +
      '<div class="card deep"><div class="sumgrid">' +
        '<div><b class="num">' + UI.sarShort(sum("invested")) + '</b><span class="soft">' + t("sum_invested") + "</span></div>" +
        '<div><b class="num">' + list.length + '</b><span class="soft">' + t("sum_companies") + "</span></div>" +
        '<div><b class="num">' + hs.filter(function(h){ return h.tone !== "green"; }).length + '</b><span class="soft">' + t("sum_attention") + "</span></div>" +
        '<div><b class="num">' + UI.tonnes(sum("tonnes_total")) + '</b><span class="soft">' + t("sum_tonnes") + "</span></div></div></div>" +
      '<div class="card"><h2>' + t("alerts") + '</h2><div class="list">' + (alerts.length ? alerts.map(function(a){
        return '<a class="alert ' + a.tone + '" href="#/portfolio/c/' + a.c.id + '">' + UI.icon(a.tone === "green" ? "check" : "alert") + "<span><b>" + esc(L(a.c, "name")) + "</b><br>" + esc(a.text) + "</span></a>";
      }).join("") : '<p class="soft">' + t("no_alerts") + "</p>") + "</div></div>" +
      '<div class="sect"><h2>' + t("companies") + '</h2></div><div class="list">' + list.map(function(c, i){
        return '<a class="card" href="#/portfolio/c/' + c.id + '"><div class="between"><h3>' + esc(L(c, "name")) + "</h3>" + healthPill(hs[i]) + "</div>" +
          '<p class="soft small">' + esc(I18N.opt("waste", c.waste)) + t("list_sep") + esc(I18N.stage(c.stage).name) + "</p>" + UI.spark(c.revenue, hs[i].tone === "red" ? "red" : "") +
          '<div class="between small"><span class="soft">' + t("rev_last", {x: UI.sarShort(c.revenue[c.revenue.length - 1])}) + '</span><span class="soft">' + t("runway_n", {n: c.runway}) + "</span></div></a>";
      }).join("") + "</div></div>";
  }
  function company(c){
    var h = health(c), posts = Store.getPosts(me().id).filter(function(p){ return p.company === c.id; });
    return '<div class="stack">' + UI.head(L(c, "name"), {back: "#/portfolio", backLabel: t("tab_portfolio")}) + '<div class="row">' + healthPill(h) + "</div>" +
      (h.alerts.length ? '<div class="list">' + h.alerts.map(function(a){ return '<div class="alert ' + a.tone + '">' + UI.icon(a.tone === "green" ? "check" : "alert") + "<span>" + esc(a.text) + "</span></div>"; }).join("") + "</div>" : "") +
      UI.kv([[t("sector"), I18N.opt("waste", c.waste)], [t("stage"), c.stage + ". " + I18N.stage(c.stage).name], [t("invested"), UI.sarShort(c.invested)], [t("ownership"), c.ownership + "%"],
        [t("tonnes_diverted"), t("per_month", {x: UI.tonnes(c.tonnes_month)})], [t("runway"), t("months_n", {n: c.runway})], [t("last_update"), UI.date(c.updated)], [t("city"), I18N.opt("city", c.city)]]) +
      '<div class="card"><div class="between"><h2>' + t("rev_title") + '</h2><span class="num">' + UI.sarShort(c.revenue[c.revenue.length - 1]) + "</span></div>" + UI.spark(c.revenue, h.tone === "red" ? "red" : "") +
        '<div class="sparklab"><span>' + esc(t("rev_from", {x: UI.sarShort(c.revenue[0])})) + "</span><span>" + esc(t("rev_now")) + "</span></div></div>" +
      '<div class="sect"><h2>' + t("company_posts") + "</h2></div>" + (posts.length ? '<div class="list">' + posts.map(postCard).join("") + "</div>" : UI.empty(t("no_updates"))) + "</div>";
  }
  function postCard(p){
    var c = Store.getCompany(p.company);
    return '<article class="card newscard"><div class="meta"><b>' + esc(L(c, "name")) + "</b><span>" + UI.date(p.date) + "</span></div><p>" + esc(L(p, "text")) + "</p></article>";
  }

  function requested(id){ var inv = me().id; return Store.getMeetings().some(function(m){ return m.project === id && m.investor === inv; }); }
  function deals(rest){
    var list = Store.getProjects().filter(function(p){ return p.stage >= 5; });
    if (rest[0] === "p" && rest[1]){ var one = list.filter(function(p){ return p.id === rest[1]; })[0]; if (one) return deal(one); }
    return '<div class="stack">' + UI.head(t("tab_deals"), {sub: t("deals_sub")}) +
      (list.length ? '<div class="list">' + list.map(function(p){
        return '<a class="card" href="#/deals/p/' + p.id + '"><div class="between"><h2 dir="auto">' + esc(L(p, "name")) + "</h2>" + UI.chev() + "</div>" +
          '<div class="row">' + UI.pill(I18N.opt("waste", p.waste)) + UI.stagePill(p) + (requested(p.id) ? UI.pill(t("meeting_requested"), "lime") : "") + "</div>" +
          '<p dir="auto">' + esc(L(p, "solution")) + "</p>" + (p.ask ? '<p class="soft small">' + t("ask_line", {x: UI.sarShort(p.ask)}) + "</p>" : "") + "</a>";
      }).join("") + "</div>" : UI.empty(t("no_deals"))) + "</div>";
  }
  function deal(p){
    var done = requested(p.id), row = function(k, v){ return v ? '<div class="card"><p class="eyebrow">' + t(k) + '</p><p dir="auto">' + esc(v) + "</p></div>" : ""; };
    return '<div class="stack">' + UI.head(L(p, "name"), {back: "#/deals", backLabel: t("tab_deals")}) +
      '<div class="row">' + UI.pill(I18N.opt("waste", p.waste)) + UI.pill(I18N.opt("city", p.city)) + UI.stagePill(p) + "</div>" +
      (p.stage === 6 ? '<p class="note">' + t("deal_funded") + "</p>" : "") +
      UI.kv([[t("ask"), p.ask ? UI.sarShort(p.ask) : t("not_set")], [t("tonnes_month"), UI.tonnes(p.tonnes)]]) +
      row("d_problem", L(p, "problem")) + row("d_solution", L(p, "solution")) + row("d_trial", L(p, "trial")) + row("d_use", L(p, "use")) + row("d_buyer", L(p, "buyer")) +
      (done ? '<p class="note">' + t("meeting_done") + "</p>" : '<button type="button" class="btn pop" data-act="request-meeting" data-id="' + p.id + '">' + t("request_meeting") + "</button>") + "</div>";
  }

  function mySectors(){ var u = Store.getUser(), s = (u.fields && u.fields.sectors) || []; return s.length ? s : me().sectors; }
  function insights(){
    var sectors = mySectors(), list = companies();
    var items = News.newsFor("investor").filter(function(n){ return !n.sectors || !n.sectors.length || n.sectors.indexOf("all") >= 0 || n.sectors.some(function(s){ return sectors.indexOf(s) >= 0; }); });
    return '<div class="stack">' + UI.head(t("tab_insights"), {demo: false, sub: t("insights_sub")}) +
      '<div class="row">' + sectors.map(function(s){ return UI.pill(I18N.opt("waste", s)); }).join("") + "</div>" +
      (items.length ? '<div class="list">' + items.map(function(n){
        var hit = list.filter(function(c){ return (n.sectors || []).indexOf(c.waste) >= 0; });
        var extra = hit.length ? '<p class="note"><b>' + t("means_title") + "</b> " + esc(t("means_text", {names: hit.map(function(c){ return L(c, "name"); }).join(t("list_sep")), sector: I18N.opt("waste", hit[0].waste)})) + " " + UI.demo() + "</p>" : "";
        return News.card(n, "investor", extra);
      }).join("") + "</div>" : UI.empty(t("no_insights"))) + "</div>";
  }
  function updates(){
    var posts = Store.getPosts(me().id);
    return '<div class="stack">' + UI.head(t("tab_updates"), {sub: t("inv_updates_sub")}) + (posts.length ? '<div class="list">' + posts.map(postCard).join("") + "</div>" : UI.empty(t("no_updates"))) + "</div>";
  }

  App.actions["request-meeting"] = function(d){
    Store.saveMeeting({investor: me().id, project: d.id, by: Store.getUser().name}); App.render(); UI.toast(t("meeting_toast"));
  };

  Screens.investor = {
    tabs: [{id: "portfolio", icon: "brief", label: "tab_portfolio"}, {id: "deals", icon: "hand", label: "tab_deals"}, {id: "insights", icon: "eye", label: "tab_insights"}, {id: "updates", icon: "news", label: "tab_updates"}],
    render: function(tab, rest){ return tab === "deals" ? deals(rest) : tab === "insights" ? insights() : tab === "updates" ? updates() : portfolio(rest); }
  };
})();
