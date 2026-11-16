/* The app frame: routing by #/tab/…, header, tab bar, profile, and one place where clicks and forms are wired.
   Each role file adds itself to Screens: {tabs: [{id, icon, label}], render(tab, rest) -> html or {html, wide}}. */
var Screens = window.Screens || {};
var App = (function(){
  var t = function(k, v){ return I18N.t(k, v); }, esc = UI.esc;
  var actions = {}, forms = {}, lastRoute = null;
  var main = document.getElementById("main"), top = document.getElementById("top"), tabbar = document.getElementById("tabbar");
  var ROLES = ["founder", "waste_owner", "partner", "investor", "team"];
  var ROLE_ICON = {founder: "bulb", waste_owner: "factory", partner: "flask", investor: "coins", team: "people"};

  function parts(){ return location.hash.replace(/^#\/?/, "").split("/").filter(Boolean); }
  function go(hash){ if (location.hash === hash) render(); else location.hash = hash; }
  function scroller(){ return document.documentElement.classList.contains("shell") ? main : (document.scrollingElement || document.documentElement); }
  function scrollTop0(){ scroller().scrollTop = 0; }

  function header(user){
    var def = Screens[user.role] || {};
    top.innerHTML = '<div class="top-in">' + Brand.iconImg() + '<div class="top-t"><b class="ltr">' + Brand.name + "</b><span>" + esc(I18N.opt("role", user.role)) + "</span></div>" +
      '<a class="avatar" href="#/profile" aria-label="' + esc(t("profile")) + '">' + esc((user.name || "?").trim().charAt(0).toUpperCase()) + "</a></div>";
    return def;
  }
  function tabs(def, current){
    tabbar.setAttribute("aria-label", t("tabs_label"));
    tabbar.innerHTML = (def.tabs || []).map(function(tb){
      var n = tb.count ? tb.count() : 0;
      return '<a href="#/' + tb.id + '"' + (tb.id === current ? ' aria-current="page"' : "") + ">" + UI.icon(tb.icon) + "<span>" + esc(t(tb.label)) + "</span>" + (n ? '<span class="dot" aria-label="' + n + '">' + n + "</span>" : "") + "</a>";
    }).join("");
  }

  function profile(user){
    var lang = I18N.lang();
    return '<div class="stack">' + UI.head(t("profile"), {demo: false}) +
      '<div class="card"><div class="row"><span class="avatar" aria-hidden="true">' + esc((user.name || "?").trim().charAt(0).toUpperCase()) + '</span><div class="grow"><h2 dir="auto">' + esc(user.name) + '</h2><p class="soft small">' + esc(I18N.opt("role", user.role)) + "</p>" + (user.org ? '<p class="soft small" dir="auto">' + esc(user.org) + "</p>" : "") + "</div></div>" +
      '<p class="note">' + t("demo_signin_note") + "</p></div>" +
      '<div class="card"><h2>' + t("language") + '</h2><div class="seg" role="group" aria-label="' + esc(t("language")) + '">' +
        '<button type="button" data-act="lang" data-lang="ar" lang="ar" aria-pressed="' + (lang === "ar") + '">العربية</button>' +
        '<button type="button" data-act="lang" data-lang="en" lang="en" aria-pressed="' + (lang === "en") + '">English</button></div>' +
        '<p class="soft small">' + t("theme_note") + "</p></div>" +
      '<div class="card"><div class="between"><h2>' + t("switch_role") + "</h2>" + UI.demo() + '</div><p class="soft small">' + t("switch_role_note") + '</p><div class="list">' +
        ROLES.map(function(r){
          return '<button type="button" class="card rolecard" data-act="switch-role" data-role="' + r + '"' + (r === user.role ? ' aria-current="true"' : "") + '><span class="ric">' + UI.icon(ROLE_ICON[r]) + "</span><span><b>" + esc(I18N.opt("role", r)) + "</b>" +
            (r === user.role ? "<span>" + t("current_role") + "</span>" : "") + "</span>" + UI.chev() + "</button>";
        }).join("") + "</div></div>" +
      '<div class="card"><h2>' + t("about_demo") + '</h2><p class="soft small">' + t("about_demo_text") + '</p><p class="soft small">' + t("contact") + ": " + t("coming_soon") + '</p>' +
        '<div class="btnrow"><a class="btn small" href="#/install">' + t("install_title") + '</a><button type="button" class="btn small" data-act="reset-demo">' + t("reset_demo") + "</button></div>" +
        '<button type="button" class="btn small danger" data-act="sign-out">' + t("sign_out") + "</button>" +
        '<p class="soft small ltr" style="text-align:center">v' + esc(window.ICON_VERSION || "dev") + "</p></div></div>";
  }

  function render(){
    var user = Store.getUser(), p = parts(), html, wide = false, route = p.join("/");
    document.body.classList.remove("bare");
    if (!user){
      if (p[0] !== "welcome" && p[0] !== "signin"){ history.replaceState(null, "", "#/welcome"); p = ["welcome"]; route = "welcome"; }
      top.hidden = true; tabbar.hidden = true; document.body.classList.add("bare");
      html = Auth.render(p);
    } else if (p[0] === "install"){
      top.hidden = true; tabbar.hidden = true; document.body.classList.add("bare");
      html = Onboard.render();
    } else {
      var def = header(user), list = def.tabs || [], tab = p[0];
      if (tab === "welcome" || tab === "signin" || !tab || (tab !== "profile" && !list.some(function(x){ return x.id === tab; }))){
        tab = list.length ? list[0].id : "profile"; history.replaceState(null, "", "#/" + tab); p = [tab]; route = tab;
      }
      top.hidden = false; tabbar.hidden = false;
      tabs(def, tab);
      var out = tab === "profile" ? profile(user) : def.render(tab, p.slice(1));
      if (out && typeof out === "object"){ html = out.html; wide = !!out.wide; } else html = out;
    }
    main.classList.toggle("wide", wide);
    main.innerHTML = html || "";
    document.title = Brand.name;
    if (route !== lastRoute){ scrollTop0(); if (lastRoute !== null) main.focus({preventScroll: true}); lastRoute = route; }
  }

  /* ---- one place for clicks, changes and form submits ---- */
  document.addEventListener("click", function(e){
    var el = e.target.closest ? e.target.closest("[data-act]") : null;
    if (!el || el.tagName === "INPUT" || el.tagName === "SELECT") return;
    var fn = actions[el.getAttribute("data-act")];
    if (fn){ e.preventDefault(); fn(el.dataset, el); }
  });
  document.addEventListener("change", function(e){
    var el = e.target; if (!el.getAttribute || !el.getAttribute("data-act")) return;
    var fn = actions[el.getAttribute("data-act")]; if (fn) fn(el.dataset, el);
  });
  document.addEventListener("submit", function(e){
    var form = e.target, name = form.getAttribute && form.getAttribute("data-form");
    if (!name) return;
    e.preventDefault();
    if (forms[name]) forms[name](UI.formData(form), form);
  });
  window.addEventListener("hashchange", render);

  actions.lang = function(d){ I18N.set(d.lang); render(); };
  actions["switch-role"] = function(d){ Store.switchRole(d.role); go("#/"); UI.toast(t("role_switched", {role: I18N.opt("role", d.role)})); };
  actions["sign-out"] = function(){ Store.signOut(); go("#/welcome"); };
  actions["reset-demo"] = function(){ if (!window.confirm(t("reset_confirm"))) return; Store.resetDemo(); render(); UI.toast(t("reset_done")); };

  function start(){
    I18N.apply();
    Store.init().then(function(){
      I18N.set(Store.getLang());
      render();
      Store.refreshNews().then(function(ok){ if (ok && Store.getUser() && /^(updates|insights|home)?$/.test(parts()[0] || "")) render(); });
    }).catch(function(){
      main.innerHTML = '<div class="stack"><div class="empty">' + t("load_error") + '</div><button type="button" class="btn pop" onclick="location.reload()">' + t("retry") + "</button></div>";
    });
  }

  return {start: start, render: render, go: go, actions: actions, forms: forms, ROLES: ROLES, ROLE_ICON: ROLE_ICON, parts: parts, scrollTop0: scrollTop0};
})();
