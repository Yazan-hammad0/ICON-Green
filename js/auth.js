/* Before sign-in: a short welcome with a "what you get" showcase per role, then registration by email.
   On the device registration is instant. With a backend connected (js/config.js) it also asks for a password,
   and people who registered before can sign in on a new device. */
var Auth = (function(){
  var t = function(k, v){ return I18N.t(k, v); }, esc = UI.esc;
  var SHOW = ["founder", "waste_owner", "partner", "investor"], show = "founder", busy = false;

  function langButton(){
    var other = I18N.lang() === "ar" ? "en" : "ar";
    return '<button type="button" class="btn small langbtn" data-act="lang" data-lang="' + other + '" lang="' + other + '">' + (other === "en" ? "English" : "العربية") + "</button>";
  }
  /* a small, honest sample of the first thing each role sees */
  function preview(r){
    var inner;
    if (r === "founder") inner = '<div class="card deep"><p class="eyebrow">' + t("do_next") + "</p><h3>" + t("pv_next") + "</h3></div>" + UI.route(2, false);
    else if (r === "waste_owner") inner = '<div class="card"><h3>' + t("pv_stream") + '</h3><div class="row">' + UI.pill(t("st_challenge"), "lime") + UI.pill(t("solutions_n", {n: 2}), "green") + "</div></div>";
    else if (r === "partner") inner = '<div class="card"><div class="between"><h3>' + t("pv_request") + "</h3>" + UI.pill(I18N.opt("req_kind", "lab_test")) + '</div><div class="btnrow"><span class="btn small fake">' + t("accept") + '</span><span class="btn small quiet fake">' + t("decline") + "</span></div></div>";
    else inner = '<div class="card"><div class="between"><h3>' + t("pv_company") + '</h3><span class="pill green"><i></i>' + t("health_green") + "</span></div>" + UI.spark([210, 225, 240, 262, 281, 305]) + "</div>";
    return '<div class="preview" inert><div class="between"><span class="eyebrow">' + t("you_see") + '</span><span class="pill demo">' + t("example") + "</span></div>" + inner + "</div>";
  }
  function welcome(){
    var how = "";
    for (var i = 1; i <= 3; i++) how += '<li><b>' + i + "</b><span>" + t("how_" + i) + "</span></li>";
    return '<div class="welcome">' + langButton() +
      '<div class="hero"><div class="plate">' + Brand.logoImg() + "</div><h1>" + t("idea_line") + "</h1><p>" + t("idea_sub") + '</p><ol class="how">' + how + "</ol></div>" +
      '<h2 class="pick">' + t("pick_you") + "</h2>" +
      '<div class="rolepick" role="tablist" aria-label="' + esc(t("pick_you")) + '">' + SHOW.map(function(r){
        return '<button type="button" role="tab" aria-selected="' + (r === show) + '" data-act="show-role" data-role="' + r + '">' + UI.icon(App.ROLE_ICON[r]) + "<span>" + esc(I18N.opt("role_short", r)) + "</span></button>";
      }).join("") + "</div>" +
      '<div class="card showcase" role="tabpanel" id="showcase"><h2>' + t("sc_" + show) + '</h2><ul class="gets">' +
        [1, 2, 3].map(function(n){ return "<li>" + UI.icon("check") + "<span>" + t("sc_" + show + "_" + n) + "</span></li>"; }).join("") + "</ul>" + preview(show) +
        '<a class="btn pop" href="#/signin/' + show + '">' + t("start_as", {role: I18N.opt("role_short", show)}) + "</a></div>" +
      '<div class="btnrow">' + (window.ICON_SHELL && ICON_SHELL.standalone() ? "" : '<a class="btn small" href="#/install">' + t("install_title") + "</a>") + '<a class="btn small quiet" href="#/signin/team">' + t("team_link") + "</a>" + (Store.accountMode() === "cloud" ? '<a class="btn small quiet" href="#/signin/login">' + t("login_title") + "</a>" : "") + "</div>" +
      '<p class="soft small center">' + t("w_demo_note") + "</p></div>";
  }
  function roleFields(r){
    var W = I18N.keys("waste");
    if (r === "founder") return UI.select("waste", t("f_waste"), W, "waste", {required: true});
    if (r === "waste_owner") return UI.select("waste", t("f_waste_have"), W, "waste", {required: true}) + UI.input("tonnes", t("f_tonnes"), {type: "number", min: 0, max: 100000, inputmode: "decimal", required: true});
    if (r === "partner") return UI.select("partner_type", t("f_partner_type"), I18N.keys("partner_type"), "partner_type", {required: true});
    if (r === "investor") return UI.select("investor_type", t("f_investor_type"), I18N.keys("investor_type"), "investor_type", {required: true}) +
      UI.chips("sectors", t("f_sectors"), W.filter(function(k){ return k !== "other"; }), "waste", []);
    return "";
  }
  function form(r){
    var cloud = Store.accountMode() === "cloud";
    return '<div class="stack"><a class="back" href="#/welcome">' + UI.icon("back", "flip") + t("back") + "</a>" +
      '<div class="row"><span class="ric">' + UI.icon(App.ROLE_ICON[r]) + '</span><div class="grow"><h1>' + t("reg_title") + '</h1><p class="soft small">' + esc(I18N.opt("role", r)) + "</p></div></div>" +
      '<form data-form="signin" data-role="' + r + '">' +
        UI.input("name", t("f_name"), {required: true, maxlength: 60, autocomplete: "name"}) +
        UI.input("email", t("f_email"), {type: "email", required: true, maxlength: 120, autocomplete: "email", inputmode: "email"}) +
        (cloud ? UI.input("password", t("f_password"), {type: "password", required: true, maxlength: 72, autocomplete: "new-password"}) : "") +
        UI.select("city", t("f_city"), I18N.keys("city"), "city", {required: true}) +
        roleFields(r) +
        '<p class="formerr" id="formerr" role="alert" hidden></p>' +
        '<button class="btn pop" type="submit">' + t("reg_go") + "</button>" +
        '<p class="soft small">' + t(cloud ? "reg_note_cloud" : "reg_note_device") + "</p></form>" +
      (cloud ? '<a class="btn small quiet" href="#/signin/login">' + t("have_account") + "</a>" : "") + "</div>";
  }
  function loginForm(){
    return '<div class="stack"><a class="back" href="#/welcome">' + UI.icon("back", "flip") + t("back") + "</a>" +
      "<h1>" + t("login_title") + "</h1>" +
      '<form data-form="login">' +
        UI.input("email", t("f_email"), {type: "email", required: true, maxlength: 120, autocomplete: "email", inputmode: "email"}) +
        UI.input("password", t("f_password_in"), {type: "password", required: true, maxlength: 72, autocomplete: "current-password"}) +
        '<p class="formerr" id="formerr" role="alert" hidden></p>' +
        '<button class="btn pop" type="submit">' + t("login_go") + "</button></form></div>";
  }
  function render(p){
    if (p[0] === "signin"){
      if (p[1] === "login" && Store.accountMode() === "cloud") return loginForm();
      return p[1] && App.ROLES.indexOf(p[1]) >= 0 ? form(p[1]) : welcome();
    }
    return welcome();
  }
  function fail(msg){ var el = document.getElementById("formerr"); if (el){ el.textContent = msg; el.hidden = false; } }
  function enter(){ App.go("#/"); }
  var ERR = {exists: "acc_exists", wrong: "acc_wrong", weak: "pass_short", setup: "acc_setup", net: "net_bad"};
  function send(formEl, promise){
    var btn = formEl.querySelector("button[type=submit]"); busy = true; if (btn) btn.setAttribute("aria-busy", "true");
    promise.then(function(){ busy = false; enter(); })
      .catch(function(e){ busy = false; if (btn) btn.removeAttribute("aria-busy"); fail(t(ERR[e && e.kind] || "net_bad")); });
  }

  App.actions["show-role"] = function(d){
    if (SHOW.indexOf(d.role) < 0 || d.role === show) return;
    show = d.role; App.render();
    var el = document.getElementById("showcase"); if (el) el.classList.add("swap");
    var tab = document.querySelector('.rolepick [data-role="' + show + '"]'); if (tab) tab.focus({preventScroll: true});
  };
  App.forms.signin = function(d, formEl){
    if (busy) return;
    var role = formEl.getAttribute("data-role"), fields = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((d.email || "").trim())){ fail(t("email_bad")); return; }
    ["waste", "tonnes", "partner_type", "investor_type", "sectors"].forEach(function(k){ if (d[k] !== undefined && d[k] !== "") fields[k] = k === "tonnes" ? Number(d[k]) : d[k]; });
    var cloud = Store.accountMode() === "cloud";
    if (cloud && String(d.password || "").length < 8){ fail(t("pass_short")); return; }
    var profile = {role: role, name: d.name, email: d.email.trim().toLowerCase(), city: d.city, fields: fields};
    send(formEl, Store.register(profile, d.password));
  };
  App.forms.login = function(d, formEl){
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((d.email || "").trim())){ fail(t("email_bad")); return; }
    send(formEl, Store.login(d.email.trim().toLowerCase(), d.password || ""));
  };

  return {render: render};
})();
