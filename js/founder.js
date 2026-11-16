/* Founder (صاحب فكرة): home, my project (six stages and gates), submit, updates. */
(function(){
  var t = function(k, v){ return I18N.t(k, v); }, esc = UI.esc, L = UI.L;

  function mine(){ return Store.myProjects()[0] || null; }
  function isFailed(p, stage){ return !!(p.failed && p.failed.stage === stage && p.stage === stage); }
  function checks(p, stage){ var def = I18N.stage(stage).checks, a = (p.checks || {})[stage] || []; return def.map(function(_, i){ return stage < p.stage ? true : !!a[i]; }); }
  /* the single next step for a project */
  function next(p){
    var s = p.stage, href = "#/project/stage/" + s;
    if (isFailed(p, s)) return {text: t("next_feedback", {stage: I18N.stage(s).name}), href: href, btn: t("next_feedback_btn")};
    if (s === 6) return {text: t("next_services"), href: href, btn: t("open")};
    var c = checks(p, s), i = c.indexOf(false);
    if (i < 0) return p.review ? {text: t("next_wait", {gate: I18N.stage(s).gate}), href: href, btn: t("open")} : {text: t("next_review", {gate: I18N.stage(s).gate}), href: href, btn: t("request_review")};
    return {text: t("next_provide", {item: I18N.stage(s).checks[i]}), href: href, btn: t("next_provide_btn")};
  }

  function home(){
    var u = Store.getUser(), p = mine();
    if (!p) return '<div class="stack">' + UI.head(t("hello", {name: u.name})) + UI.empty(t("no_project")) + '<a class="btn pop" href="#/submit">' + t("tab_submit") + "</a></div>";
    var n = next(p), failed = isFailed(p, p.stage);
    return '<div class="stack">' + UI.head(t("hello", {name: u.name})) +
      '<div class="card deep"><p class="eyebrow">' + t("do_next") + "</p><h2>" + esc(n.text) + '</h2><a class="btn pop" href="' + n.href + '">' + esc(n.btn) + "</a></div>" +
      '<div class="card"><div class="between"><div><p class="eyebrow">' + t("your_project") + "</p><h2>" + esc(L(p, "name")) + "</h2></div>" + UI.stagePill(p) + "</div>" +
        UI.route(p.stage, failed, function(i){ return "#/project/stage/" + i; }) +
        '<p class="soft small">' + t("days_in_stage", {n: UI.daysSince(p.since)}) + "</p></div>" +
      '<div class="sect between"><h2>' + t("latest_updates") + '</h2><a class="btn small quiet" href="#/updates">' + t("see_all") + "</a></div>" + News.feed("founder", 2) + "</div>";
  }

  function project(rest){
    var p = mine();
    if (!p) return '<div class="stack">' + UI.head(t("tab_project")) + UI.empty(t("no_project")) + "</div>";
    if (rest[0] === "stage" && +rest[1] >= 1 && +rest[1] <= 6) return stage(p, +rest[1]);
    var rows = "";
    for (var i = 1; i <= 6; i++){
      var s = I18N.stage(i), st = i < p.stage ? "passed" : i === p.stage ? "current" : "locked", failed = isFailed(p, i);
      var pill = st === "passed" ? UI.pill(t("gs_passed"), "green") : failed ? UI.pill(t("gs_retry"), "amber") : st === "current" ? UI.pill(t("gs_current"), "lime") : UI.pill(t("gs_locked"));
      rows += '<a class="card stagerow ' + st + '" href="#/project/stage/' + i + '"><span class="sn">' + (st === "passed" ? UI.icon("check") : st === "locked" ? UI.icon("lock") : i) + "</span><span><b>" + esc(s.name) + '</b><span class="g">' + esc(i === 6 ? s.gate : t("gate_is", {gate: s.gate})) + "</span></span>" + pill + "</a>";
    }
    return '<div class="stack">' + UI.head(L(p, "name")) +
      UI.kv([[t("waste_type"), I18N.opt("waste", p.waste)], [t("city"), I18N.opt("city", p.city)], [t("tonnes_month"), UI.tonnes(p.tonnes)], [t("days_here"), UI.num(UI.daysSince(p.since))]]) +
      '<div class="list">' + rows + "</div></div>";
  }

  function stage(p, i){
    var s = I18N.stage(i), st = i < p.stage ? "passed" : i === p.stage ? "current" : "locked", failed = isFailed(p, i), c = checks(p, i);
    var pill = st === "passed" ? UI.pill(t("gs_passed"), "green") : failed ? UI.pill(t("gs_retry"), "amber") : st === "current" ? UI.pill(t("gs_current"), "lime") : UI.pill(t("gs_locked"));
    var html = '<div class="stack">' + UI.head(i + ". " + s.name, {back: "#/project", backLabel: t("tab_project")}) + '<div class="row">' + pill + "</div>";
    if (failed) html += '<div class="card"><div class="alert amber">' + UI.icon("alert") + "<div><b>" + t("feedback_from_icon") + '</b><p dir="auto">' + esc(L(p.failed, "text")) + '</p><p class="small">' + UI.date(p.failed.date) + "</p></div></div><p class=\"soft small\">" + t("feedback_note") + "</p></div>";
    html += '<div class="card"><p class="eyebrow">' + t("what_happens") + "</p><p>" + esc(s.what) + "</p></div>";
    if (i === 6){
      html += '<div class="card"><h2>' + t("services_title") + '</h2><p class="soft small">' + t("services_note") + '</p><div class="list">' +
        I18N.keys("service").map(function(k){ return '<div class="row"><span class="pill">' + esc(I18N.opt("service", k)) + '</span><span class="soft small grow">' + esc(I18N.opt("service_desc", k)) + "</span></div>"; }).join("") + "</div></div>";
    } else {
      html += '<div class="card"><p class="eyebrow">' + t("gate_is", {gate: s.gate}) + "</p><h2>" + t("needed_to_pass") + "</h2>" +
        (st === "locked" ? '<p class="note">' + t("locked_note") + "</p>" : "") + "<div>" +
        s.checks.map(function(item, k){
          return '<label class="check' + (c[k] ? " done" : "") + '"><input type="checkbox" data-act="tick" data-stage="' + i + '" data-i="' + k + '"' + (c[k] ? " checked" : "") + (st === "current" ? "" : " disabled") + "><span>" + esc(item) + "</span></label>";
        }).join("") + "</div></div>";
      if (i === 1 && p.scores) html += scoreCard(p);
      if (st === "current"){
        var all = c.indexOf(false) < 0;
        html += p.review ? '<p class="note">' + t("review_sent", {date: UI.date(p.review)}) + "</p>"
          : all ? '<button type="button" class="btn pop" data-act="request-review">' + t("request_review") + "</button>" : '<p class="note">' + t("review_hint") + "</p>";
      }
    }
    return html + "</div>";
  }
  function scoreCard(p){
    var sc = I18N.score(p.scores);
    return '<div class="card"><div class="between"><h2>' + t("score_title") + '</h2><span class="num">' + sc.total.toFixed(1) + " / 5</span></div>" +
      '<p class="soft small">' + t("score_note") + "</p>" + UI.bars(sc.rows, 5) + "</div>";
  }

  function submit(rest){
    var kind = rest[0] === "challenge" ? "challenge" : "idea", ch = Store.getChallenges(), W = I18N.keys("waste");
    var mineAll = Store.myProjects().filter(function(p){ return p.submitted; });
    var html = '<div class="stack">' + UI.head(t("submit_title"), {demo: false}) +
      '<div class="seg" role="group" aria-label="' + esc(t("submit_kind")) + '"><button type="button" data-act="submit-kind" data-kind="idea" aria-pressed="' + (kind === "idea") + '">' + t("submit_idea") + "</button>" +
      '<button type="button" data-act="submit-kind" data-kind="challenge" aria-pressed="' + (kind === "challenge") + '">' + t("submit_challenge") + "</button></div>" +
      '<form data-form="submit-project" data-kind="' + kind + '">';
    if (kind === "challenge"){
      html += '<div class="field"><label for="f-challenge">' + t("pick_challenge") + ' <span class="pill demo">' + t("demo") + '</span></label><select id="f-challenge" name="challenge" required><option value="">' + t("choose") + "</option>" +
        ch.map(function(s){ return '<option value="' + s.id + '">' + esc(L(s, "title") + " (" + I18N.opt("city", s.city) + t("list_sep") + UI.tonnes(s.tonnes) + ")") + "</option>"; }).join("") + "</select></div>";
    } else {
      html += UI.select("waste", t("f_waste"), W, "waste", {required: true}) + UI.input("tonnes", t("f_tonnes_need"), {type: "number", min: 0, max: 100000, inputmode: "decimal", optional: true});
    }
    html += UI.input("name", t("f_project_name"), {required: true, maxlength: 60}) +
      (kind === "idea" ? UI.textarea("problem", t("f_problem"), {required: true, maxlength: 400}) : "") +
      UI.textarea("solution", t("f_solution"), {required: true, maxlength: 400}) + UI.input("buyer", t("f_buyer"), {optional: true, maxlength: 100}) +
      '<button class="btn pop" type="submit">' + t("submit_send") + '</button><p class="soft small">' + t("submit_note") + "</p></form>";
    if (mineAll.length) html += '<div class="sect"><h2>' + t("my_submissions") + '</h2></div><div class="list">' + mineAll.map(function(p){
      return '<div class="card"><div class="between"><h3 dir="auto">' + esc(L(p, "name")) + "</h3>" + UI.stagePill(p) + '</div><p class="soft small">' + esc(I18N.opt("waste", p.waste)) + t("list_sep") + t("sent_on", {date: UI.date(p.created)}) + "</p></div>";
    }).join("") + "</div>";
    return html + "</div>";
  }

  App.actions.tick = function(d, el){ var p = mine(); if (!p) return; Store.tick(p.id, +d.stage, +d.i, el.checked); App.render(); var again = document.querySelector('[data-act="tick"][data-i="' + d.i + '"]'); if (again) again.focus({preventScroll: true}); };
  App.actions["request-review"] = function(){ var p = mine(); if (!p) return; p = JSON.parse(JSON.stringify(p)); p.review = Store.today(); Store.saveProject(p); App.render(); UI.toast(t("review_toast")); };
  App.actions["submit-kind"] = function(d){ App.go("#/submit/" + d.kind); };
  App.forms["submit-project"] = function(d, form){
    var u = Store.getUser(), kind = form.getAttribute("data-kind"), ch = kind === "challenge" ? Store.getStreams().filter(function(s){ return s.id === d.challenge; })[0] : null;
    Store.saveProject({name: d.name, founder: Store.me().founder, founder_name: u.name, waste: ch ? ch.waste : d.waste, city: ch ? ch.city : (u.city || "other"), tonnes: ch ? ch.tonnes : Number(d.tonnes || 0),
      stage: 1, source: kind, challenge: ch ? ch.id : null, problem: ch ? UI.L(ch, "title") : d.problem, solution: d.solution, buyer: d.buyer, submitted: true, local: true, checks: {"1": [true, true, true, false, !!d.buyer, false]}});
    form.reset(); App.render(); App.scrollTop0(); UI.toast(t("submit_toast"));
  };

  Screens.founder = {
    tabs: [{id: "home", icon: "home", label: "tab_home"}, {id: "project", icon: "route", label: "tab_project"}, {id: "submit", icon: "plus", label: "tab_submit"}, {id: "updates", icon: "news", label: "tab_updates"}],
    render: function(tab, rest){ return tab === "project" ? project(rest) : tab === "submit" ? submit(rest) : tab === "updates" ? News.screen("founder") : home(); }
  };
  Screens.shared = {scoreCard: scoreCard, checks: checks, isFailed: isFailed};
})();
