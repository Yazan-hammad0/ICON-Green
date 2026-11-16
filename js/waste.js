/* Waste owner (صاحب مخلفات): home, my waste, solutions, updates. */
(function(){
  var t = function(k, v){ return I18N.t(k, v); }, esc = UI.esc, L = UI.L;

  function solutionsFor(streams){
    var types = streams.map(function(s){ return s.waste; });
    return Store.getProjects().filter(function(p){ return types.indexOf(p.waste) >= 0; });
  }
  function streamCard(s, withAction){
    var n = solutionsFor([s]).length;
    return '<div class="card"><div class="between"><h3 dir="auto">' + esc(L(s, "title") || I18N.opt("waste", s.waste)) + "</h3>" +
      (s.challenge ? UI.pill(t("st_challenge"), "lime") : UI.pill(t("st_listed"))) + "</div>" +
      '<p class="soft small">' + esc(I18N.opt("waste", s.waste)) + t("list_sep") + esc(I18N.opt("city", s.city)) + t("list_sep") + t("per_month", {x: UI.tonnes(s.tonnes)}) + (s.cost ? t("list_sep") + t("cost_line", {x: UI.sar(s.cost)}) : "") + "</p>" +
      '<div class="row">' + (n ? UI.pill(t("solutions_n", {n: n}), "green") : UI.pill(t("solutions_none"))) +
      (withAction && !s.challenge ? '<span class="grow"></span><button type="button" class="btn small" data-act="post-challenge" data-id="' + s.id + '">' + t("post_challenge") + "</button>" : "") + "</div></div>";
  }
  function home(){
    var u = Store.getUser(), streams = Store.myStreams(), unposted = streams.filter(function(s){ return !s.challenge; })[0], sol = solutionsFor(streams), nx;
    if (!streams.length) nx = {text: t("wo_next_add"), href: "#/waste", btn: t("add_stream")};
    else if (unposted) nx = {text: t("wo_next_post", {title: L(unposted, "title") || I18N.opt("waste", unposted.waste)}), href: "#/waste", btn: t("tab_waste")};
    else if (sol.length) nx = {text: t("wo_next_solutions", {n: sol.length}), href: "#/solutions", btn: t("tab_solutions")};
    else nx = {text: t("wo_next_wait"), href: "#/updates", btn: t("tab_updates")};
    return '<div class="stack">' + UI.head(t("hello", {name: u.name})) +
      '<div class="card deep"><p class="eyebrow">' + t("do_next") + "</p><h2>" + esc(nx.text) + '</h2><a class="btn pop" href="' + nx.href + '">' + esc(nx.btn) + "</a></div>" +
      '<div class="sect"><h2>' + t("your_streams") + "</h2></div>" +
      (streams.length ? '<div class="list">' + streams.map(function(s){ return streamCard(s, false); }).join("") + "</div>" : UI.empty(t("no_streams"))) + "</div>";
  }
  function waste(){
    var u = Store.getUser(), streams = Store.myStreams();
    return '<div class="stack">' + UI.head(t("tab_waste")) +
      (streams.length ? '<div class="list">' + streams.map(function(s){ return streamCard(s, true); }).join("") + "</div>" : UI.empty(t("no_streams"))) +
      '<div class="card"><h2>' + t("add_stream") + '</h2><form data-form="add-stream">' +
        UI.select("waste", t("waste_type"), I18N.keys("waste"), "waste", {required: true}) +
        UI.input("tonnes", t("f_tonnes"), {type: "number", min: 0, max: 100000, inputmode: "decimal", required: true}) +
        UI.select("city", t("city"), I18N.keys("city"), "city", {required: true, value: u.city}) +
        UI.input("cost", t("f_cost"), {type: "number", min: 0, max: 100000, inputmode: "decimal", optional: true}) +
        UI.input("title", t("f_stream_title"), {optional: true, maxlength: 80}) +
        '<label class="check"><input type="checkbox" name="challenge" value="1" checked><span>' + t("f_post_now") + "</span></label>" +
        '<button class="btn pop" type="submit">' + t("add_stream") + "</button></form></div></div>";
  }
  function solutions(){
    var list = solutionsFor(Store.myStreams());
    return '<div class="stack">' + UI.head(t("tab_solutions"), {}) +
      (list.length ? '<div class="list">' + list.map(function(p){
        var failed = Screens.shared.isFailed(p, p.stage);
        return '<div class="card"><div class="between"><h2 dir="auto">' + esc(L(p, "name")) + "</h2>" + UI.pill(I18N.opt("waste", p.waste)) + "</div>" +
          '<p dir="auto">' + esc(L(p, "solution")) + "</p>" + UI.route(p.stage, failed) +
          '<p class="soft small">' + t("stage_now", {stage: I18N.stage(p.stage).name}) + (p.stage > 1 ? t("list_sep") + t("last_gate", {gate: I18N.stage(p.stage - 1).gate}) : "") + "</p>" +
          (L(p, "trial") ? '<p class="note" dir="auto">' + esc(L(p, "trial")) + "</p>" : "") + "</div>";
      }).join("") + "</div>" : UI.empty(t("no_solutions"))) + "</div>";
  }

  App.actions["post-challenge"] = function(d){
    var s = Store.getStreams().filter(function(x){ return x.id === d.id; })[0]; if (!s) return;
    s = JSON.parse(JSON.stringify(s)); s.challenge = true; s.date = Store.today(); Store.saveStream(s); App.render(); UI.toast(t("challenge_toast"));
  };
  App.forms["add-stream"] = function(d, form){
    var post = d.challenge && d.challenge.length > 0;
    Store.saveStream({waste: d.waste, tonnes: Number(d.tonnes), city: d.city, cost: d.cost ? Number(d.cost) : null, title: d.title || "", challenge: post, local: true});
    form.reset(); App.render(); App.scrollTop0(); UI.toast(t(post ? "challenge_toast" : "stream_toast"));
  };

  Screens.waste_owner = {
    tabs: [{id: "home", icon: "home", label: "tab_home"}, {id: "waste", icon: "box", label: "tab_waste"}, {id: "solutions", icon: "bulb", label: "tab_solutions"}, {id: "updates", icon: "news", label: "tab_updates"}],
    render: function(tab){ return tab === "waste" ? waste() : tab === "solutions" ? solutions() : tab === "updates" ? News.screen("waste_owner") : home(); }
  };
})();
