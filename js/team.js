/* ICON team (فريق ICON): pipeline board, demand panel, inbox, write updates. */
(function(){
  var t = function(k, v){ return I18N.t(k, v); }, esc = UI.esc, L = UI.L;

  function projCard(p){
    var failed = Screens.shared.isFailed(p, p.stage), d = UI.daysSince(p.since);
    return '<a class="card" href="#/pipeline/p/' + p.id + '"><h3 dir="auto">' + esc(L(p, "name")) + '</h3><div class="row">' + UI.pill(I18N.opt("waste", p.waste)) +
      (failed ? UI.pill(t("gs_retry"), "amber") : "") + (p.review ? UI.pill(t("review_asked"), "lime") : "") + (p.local ? UI.pill(t("new"), "green") : "") + "</div>" +
      '<p class="soft small">' + t("days_in_stage", {n: d}) + "</p></a>";
  }
  function pipeline(rest){
    var all = Store.getProjects();
    if (rest[0] === "p" && rest[1]){ var one = Store.getProject(rest[1]); if (one) return {html: project(one)}; }
    var cols = "";
    for (var i = 1; i <= 6; i++){
      var list = all.filter(function(p){ return p.stage === i; });
      cols += '<section class="col"><h2><span>' + i + ". " + esc(I18N.stage(i).name) + "</span>" + UI.pill(String(list.length)) + "</h2>" +
        (list.length ? '<div class="list">' + list.map(projCard).join("") + "</div>" : '<p class="soft small">' + t("col_empty") + "</p>") + "</section>";
    }
    return {wide: true, html: '<div class="stack">' + UI.head(t("tab_pipeline"), {sub: t("pipeline_sub", {n: all.length})}) + '<div class="board">' + cols + "</div></div>"};
  }
  function project(p){
    var s = I18N.stage(p.stage), failed = Screens.shared.isFailed(p, p.stage), c = Screens.shared.checks(p, p.stage), done = c.filter(Boolean).length;
    var row = function(k, v){ return v ? '<div class="card"><p class="eyebrow">' + t(k) + '</p><p dir="auto">' + esc(v) + "</p></div>" : ""; };
    return '<div class="stack">' + UI.head(L(p, "name"), {back: "#/pipeline", backLabel: t("tab_pipeline")}) +
      '<div class="row">' + UI.stagePill(p) + (p.review ? UI.pill(t("review_asked"), "lime") : "") + (failed ? UI.pill(t("gs_retry"), "amber") : "") + "</div>" +
      '<div class="card">' + UI.route(p.stage, failed) + "</div>" +
      UI.kv([[t("founder"), L(p, "founder") || p.founder_name || "", true], [t("waste_type"), I18N.opt("waste", p.waste)], [t("city"), I18N.opt("city", p.city)], [t("tonnes_month"), UI.tonnes(p.tonnes)],
        [t("days_here"), UI.num(UI.daysSince(p.since))], [t("source_of"), I18N.opt("source", p.source || "idea")]]) +
      row("d_problem", L(p, "problem")) + row("d_solution", L(p, "solution")) + row("d_trial", L(p, "trial")) + (p.ask ? row("ask", UI.sar(p.ask)) : "") +
      (p.scores ? Screens.shared.scoreCard(p) : "") +
      (p.stage < 6 ? '<div class="card"><p class="eyebrow">' + t("gate_is", {gate: s.gate}) + "</p><h2>" + t("checklist_progress", {a: done, b: c.length}) + "</h2><div>" +
        s.checks.map(function(item, k){ return '<div class="row small" style="min-height:32px"><span class="pill ' + (c[k] ? "green" : "") + '">' + (c[k] ? t("yes") : t("not_yet")) + '</span><span class="grow">' + esc(item) + "</span></div>"; }).join("") + "</div>" +
        '<button type="button" class="btn pop" data-act="pass-gate" data-id="' + p.id + '">' + t("pass_gate", {gate: s.gate}) + "</button></div>" : '<p class="note">' + t("stage6_note") + "</p>") +
      (failed ? '<div class="alert amber">' + UI.icon("alert") + "<div><b>" + t("feedback_sent", {date: UI.date(p.failed.date)}) + '</b><p dir="auto">' + esc(L(p.failed, "text")) + "</p></div></div>" : "") +
      (p.stage < 6 ? '<form data-form="feedback" data-id="' + p.id + '" class="card"><h2>' + t("not_passed_title") + '</h2><p class="soft small">' + t("not_passed_note") + "</p>" +
        UI.textarea("text", t("f_feedback"), {required: true, maxlength: 500}) + '<button class="btn" type="submit">' + t("send_feedback") + "</button></form>" : "") + "</div>";
  }

  function count(list, key){ var m = {}; list.forEach(function(x){ var k = x[key]; if (k) m[k] = (m[k] || 0) + 1; }); return m; }
  function rows(map, group, order){
    return Object.keys(map).sort(function(a, b){ return order ? order.indexOf(a) - order.indexOf(b) : map[b] - map[a]; }).map(function(k){ return [I18N.opt(group, k), map[k]]; });
  }
  function demand(){
    var su = Store.getSignups(), streams = Store.getStreams(), partners = Store.getPartners(), ch = Store.getChallenges(), meetings = Store.getMeetings();
    var local = su.filter(function(s){ return s.local; }).length;
    var waste = count(su, "waste"); streams.forEach(function(s){ waste[s.waste] = (waste[s.waste] || 0) + 1; });
    var types = I18N.keys("partner_type");
    return '<div class="stack">' + UI.head(t("tab_demand"), {sub: t("demand_sub")}) + '<p class="note">' + t("demand_honest", {n: local}) + "</p>" +
      '<div class="card deep"><div class="sumgrid">' +
        '<div><b class="num">' + su.length + '</b><span class="soft">' + t("dm_signups") + "</span></div>" +
        '<div><b class="num">' + ch.length + '</b><span class="soft">' + t("dm_challenges") + "</span></div>" +
        '<div><b class="num">' + meetings.length + '</b><span class="soft">' + t("dm_meetings") + "</span></div>" +
        '<div><b class="num">' + UI.tonnes(streams.reduce(function(s, x){ return s + Number(x.tonnes || 0); }, 0)) + '</b><span class="soft">' + t("dm_tonnes") + "</span></div></div></div>" +
      '<div class="cols2 stack"><div class="card"><h2>' + t("dm_by_role") + "</h2>" + UI.bars(rows(count(su, "role"), "role", App.ROLES)) + "</div>" +
      '<div class="card"><h2>' + t("dm_by_waste") + '</h2><p class="soft small">' + t("dm_by_waste_note") + "</p>" + UI.bars(rows(waste, "waste")) + "</div>" +
      '<div class="card"><h2>' + t("dm_by_city") + "</h2>" + UI.bars(rows(count(su, "city"), "city")) + "</div>" +
      '<div class="card"><h2>' + t("dm_capacity") + '</h2><div class="list">' + types.map(function(ty){
        var list = partners.filter(function(p){ return p.type === ty; }), open = list.filter(function(p){ return p.available; });
        var cap = open.reduce(function(s, p){ return s + Number(p.capacity || 0); }, 0), unit = list[0] ? I18N.opt("pricing_unit", list[0].pricing) : "";
        return '<div class="between"><span>' + esc(I18N.opt("partner_type", ty)) + ' <span class="soft small">(' + t("dm_available", {a: open.length, b: list.length}) + ')</span></span><b class="num">' + UI.num(cap) + ' <span class="small soft" style="font-weight:400">' + esc(unit) + "</span></b></div>";
      }).join("") + "</div></div></div>" +
      '<div class="card"><h2>' + t("dm_open_challenges") + '</h2><div class="list">' + ch.map(function(s){
        return '<div class="between"><span dir="auto">' + esc(L(s, "title") || I18N.opt("waste", s.waste)) + '</span><span class="soft small" style="white-space:nowrap">' + UI.tonnes(s.tonnes) + "</span></div>";
      }).join("") + "</div></div></div>";
  }

  function inboxItems(){
    var items = [];
    Store.getProjects().forEach(function(p){
      if (p.submitted || UI.daysSince(p.created) <= 14) items.push({date: p.created, kind: "in_submission", text: L(p, "name"), sub: I18N.opt("source", p.source || "idea") + t("list_sep") + I18N.opt("waste", p.waste), href: "#/pipeline/p/" + p.id, local: p.local});
      if (p.review) items.push({date: p.review, kind: "in_review", text: L(p, "name"), sub: t("gate_is", {gate: I18N.stage(p.stage).gate}), href: "#/pipeline/p/" + p.id, local: true});
    });
    Store.getChallenges().forEach(function(s){ if (s.local || UI.daysSince(s.date) <= 30){ var o = Store.getOwner(s.owner); items.push({date: s.date, kind: "in_challenge", text: L(s, "title") || I18N.opt("waste", s.waste), sub: L(o, "name") + t("list_sep") + UI.tonnes(s.tonnes), local: s.local}); } });
    Store.getMeetings().forEach(function(m){ var p = Store.getProject(m.project), inv = Store.getInvestor(m.investor); items.push({date: m.date, kind: "in_meeting", text: L(p, "name"), sub: t("asked_by", {name: m.by || L(inv, "name")}), href: "#/pipeline/p/" + m.project, local: m.local}); });
    Store.getRequests().forEach(function(r){ if (r.status === "open") return; var p = Store.getProject(r.project), pa = Store.getPartner(r.partner); items.push({date: r.replied || r.date, kind: r.status === "accepted" ? "in_accepted" : "in_declined", text: L(pa, "name"), sub: I18N.opt("req_kind", r.kind) + t("list_sep") + L(p, "name"), local: UI.daysSince(r.replied) === 0}); });
    return items.sort(function(a, b){ return a.date < b.date ? 1 : a.date > b.date ? -1 : (b.local ? 1 : 0) - (a.local ? 1 : 0); });
  }
  function inbox(){
    var items = inboxItems();
    return '<div class="stack">' + UI.head(t("tab_inbox"), {sub: t("inbox_sub")}) + '<div class="list">' + items.map(function(it){
      var tone = it.kind === "in_declined" ? "" : it.kind === "in_meeting" || it.kind === "in_review" ? "lime" : it.kind === "in_accepted" ? "green" : "";
      var inner = '<div class="between"><div class="row">' + UI.pill(t(it.kind), tone) + (it.local ? UI.pill(t("new"), "green") : "") + '</div><span class="soft small" style="white-space:nowrap">' + UI.date(it.date) + "</span></div>" +
        '<h3 dir="auto">' + esc(it.text) + '</h3><p class="soft small" dir="auto">' + esc(it.sub) + "</p>";
      return it.href ? '<a class="card" href="' + it.href + '">' + inner + "</a>" : '<div class="card">' + inner + "</div>";
    }).join("") + "</div></div>";
  }
  function updates(){
    var roles = App.ROLES.filter(function(r){ return r !== "team"; }), list = Store.getUpdates().filter(function(u){ return u.kind === "icon"; });
    return '<div class="stack">' + UI.head(t("write_update"), {demo: false, sub: t("write_update_sub")}) +
      '<form data-form="post-update" class="card">' + UI.input("title", t("f_title"), {required: true, maxlength: 90}) + UI.textarea("body", t("f_body"), {required: true, maxlength: 400}) +
        UI.chips("roles", t("f_roles"), roles, "role", roles) + '<button class="btn pop" type="submit">' + t("publish") + "</button></form>" +
      '<div class="sect"><h2>' + t("published") + '</h2></div><div class="list">' + list.map(function(u){
        return '<article class="card newscard"><div class="meta"><span>' + UI.date(u.date) + "</span>" + UI.demo() + '</div><h3 dir="auto">' + esc(L(u, "title")) + '</h3><p dir="auto">' + esc(L(u, "body")) + '</p><div class="row">' +
          (u.roles || []).filter(function(r){ return r !== "team"; }).map(function(r){ return UI.pill(I18N.opt("role", r)); }).join("") + "</div></article>";
      }).join("") + '</div><div class="sect"><h2>' + t("sector_news") + "</h2></div>" + News.newsList("team") + "</div>";
  }

  App.actions["pass-gate"] = function(d){ var p = Store.getProject(d.id), g = I18N.stage(p.stage).gate; if (!window.confirm(t("pass_confirm", {gate: g}))) return; Store.passGate(d.id); App.render(); App.scrollTop0(); UI.toast(t("pass_toast", {gate: g})); };
  App.forms.feedback = function(d, form){ Store.sendFeedback(form.getAttribute("data-id"), d.text); App.render(); App.scrollTop0(); UI.toast(t("feedback_toast")); };
  App.forms["post-update"] = function(d, form){
    if (!d.roles || !d.roles.length){ UI.toast(t("pick_roles")); return; }
    Store.saveUpdate({kind: "icon", title: d.title, body: d.body, roles: d.roles.concat(["team"])}); form.reset(); App.render(); UI.toast(t("published_toast"));
  };

  Screens.team = {
    tabs: [{id: "pipeline", icon: "board", label: "tab_pipeline"}, {id: "demand", icon: "chart", label: "tab_demand"}, {id: "inbox", icon: "inbox", label: "tab_inbox"}, {id: "updates", icon: "edit", label: "tab_updates"}],
    render: function(tab, rest){ return tab === "demand" ? demand() : tab === "inbox" ? inbox() : tab === "updates" ? updates() : pipeline(rest); }
  };
})();
