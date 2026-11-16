/* Install guide. It works out which browser this is and plays the three steps for that browser on a small animated screen.
   On a phone it is the first thing a new visitor sees; it is also in the profile. */
var Onboard = (function(){
  var t = function(k, v){ return I18N.t(k, v); }, esc = UI.esc;
  var ua = navigator.userAgent, deferred = null, scene = 0, timer = null;
  var ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1), android = /android/i.test(ua);
  var inApp = /Instagram|FBAN|FBAV|FB_IAB|LinkedInApp|Snapchat|TikTok|musical_ly|BytedanceWebview|Twitter|Line\/|Pinterest|WhatsApp/i.test(ua) || (android && /; wv\)/.test(ua));
  window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); deferred = e; if (/^#\/install/.test(location.hash)) App.render(); });
  window.addEventListener("appinstalled", function(){ Store.installSeen(true); deferred = null; });

  function variant(){
    if (ios){
      if (inApp || /FxiOS|EdgiOS|OPiOS|GSA\/|DuckDuckGo|YaBrowser/.test(ua)) return "ios_other";
      return /CriOS/.test(ua) ? "ios_chrome" : "ios_safari";
    }
    if (android){
      if (inApp) return "android_other";
      if (/SamsungBrowser/.test(ua)) return "android_samsung";
      if (/Firefox/.test(ua)) return "android_firefox";
      return /Chrome/.test(ua) ? "android_chrome" : "android_other";
    }
    if (/Edg\/|Chrome\//.test(ua) && !/OPR\//.test(ua)) return "desktop_chromium";
    if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Firefox/.test(ua)) return "mac_safari";
    return "desktop_other";
  }
  /* where the control sits and what it looks like, per browser */
  var SHARE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1"/></svg>';
  var INSTALL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 8v6M9 11.5l3 3 3-3M8 21h8"/></svg>';
  var LOOK = {
    ios_safari: {bar: "bottom", ctl: SHARE, row: "ins_add_home"}, ios_chrome: {bar: "top", ctl: SHARE, row: "ins_add_home"}, ios_other: {bar: "bottom", ctl: SHARE, row: "ins_add_home"},
    android_chrome: {bar: "top", ctl: "⋮", row: "ins_install_app"}, android_samsung: {bar: "bottom", ctl: "☰", row: "ins_add_home"}, android_firefox: {bar: "top", ctl: "⋮", row: "ins_add_home"}, android_other: {bar: "top", ctl: "⋮", row: "ins_install_app"},
    desktop_chromium: {bar: "top", ctl: INSTALL, row: "ins_install_app", desk: true}, mac_safari: {bar: "top", ctl: SHARE, row: "ins_add_dock", desk: true}, desktop_other: {bar: "top", ctl: INSTALL, row: "ins_install_app", desk: true}
  };
  function isPhone(){ return ios || android; }
  /* play the guide first for a new visitor on a phone or tablet that has not installed the app */
  function auto(){ return isPhone() && !(window.ICON_SHELL && ICON_SHELL.standalone()) && !Store.installSeen(); }

  function mock(v){
    var L = LOOK[v], host = location.host || "icon green", cells = "";
    for (var i = 0; i < 7; i++) cells += "<span></span>";
    return '<div class="mock' + (L.desk ? " desk" : "") + " bar-" + L.bar + '" id="mock" data-scene="' + scene + '" aria-hidden="true"><div class="m-screen">' +
      '<div class="m-bar"><span class="m-url ltr">' + esc(host) + '</span><span class="m-ctl">' + L.ctl + '<i class="ring"></i></span></div>' +
      '<div class="m-page"><i></i><i></i><i></i><i></i></div>' +
      '<div class="m-sheet"><div class="m-row">' + t("ins_share") + '</div><div class="m-row hl">' + t(L.row) + '<i class="ring"></i></div><div class="m-row"></div></div>' +
      '<div class="m-home">' + cells + '<span class="m-app"><img src="' + Brand.appIcon + '" alt=""><em class="ltr">ICON Green</em></span></div>' +
      "</div></div>";
  }
  function render(){
    var v = variant(), user = Store.getUser(), steps = "";
    for (var i = 1; i <= 3; i++) steps += '<li><button type="button" data-act="inst-step" data-i="' + (i - 1) + '"' + (i - 1 === scene ? ' aria-current="step"' : "") + '><span class="n">' + i + "</span><b>" + t("ins_" + v + "_" + i) + "</b></button></li>";
    var needsCopy = v === "ios_other" || v === "android_other" || v === "desktop_other";
    return '<div class="stack install">' + (user ? '<a class="back" href="#/profile">' + UI.icon("back", "flip") + t("back") + "</a>" : "") +
      '<div class="center">' + Brand.iconImg("brand-icon big") + "<h1>" + t("install_title") + '</h1><p class="soft">' + t("install_sub") + "</p></div>" +
      mock(v) +
      '<p class="eyebrow center">' + t("install_for", {browser: I18N.opt("browser", v)}) + "</p>" +
      '<ol class="steps">' + steps + "</ol>" +
      (deferred ? '<button type="button" class="btn pop" data-act="inst-now">' + t("install_now") + "</button>" : "") +
      (needsCopy ? '<button type="button" class="btn" data-act="inst-copy">' + t("install_copy") + "</button>" : "") +
      '<button type="button" class="btn' + (deferred ? "" : " pop") + '" data-act="inst-done">' + t("install_continue") + "</button></div>";
  }
  function paint(){
    var m = document.getElementById("mock"); if (!m) return;
    m.setAttribute("data-scene", scene);
    Array.prototype.forEach.call(document.querySelectorAll('[data-act="inst-step"]'), function(b, i){ if (i === scene) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
  }
  function reduced(){ return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  /* called by the app after every render: start the loop on the install screen, stop it everywhere else */
  function mount(active){
    clearInterval(timer); timer = null;
    if (!active){ scene = 0; return; }
    if (!reduced()) timer = setInterval(function(){ scene = (scene + 1) % 3; paint(); }, 2600);
  }
  App.actions["inst-step"] = function(d){ scene = Math.max(0, Math.min(2, +d.i || 0)); paint(); mount(true); };
  App.actions["inst-now"] = function(){ if (!deferred) return; var p = deferred; deferred = null; p.prompt(); if (p.userChoice) p.userChoice.then(function(){ App.render(); }); };
  App.actions["inst-copy"] = function(){
    var url = location.href.split("#")[0];
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function(){ UI.toast(t("install_copied")); }, function(){ UI.toast(url); });
    else UI.toast(url);
  };
  App.actions["inst-done"] = function(){ Store.installSeen(true); App.go(Store.getUser() ? "#/profile" : "#/welcome"); };
  return {render: render, mount: mount, auto: auto, variant: variant, isPhone: isPhone};
})();
