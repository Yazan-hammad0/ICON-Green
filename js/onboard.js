/* Install guide: how to put the app on the home screen, for iPhone (Safari) and Android (Chrome). Shown once after sign-in, and from the profile. */
var Onboard = (function(){
  var t = function(k, v){ return I18N.t(k, v); };
  var ua = navigator.userAgent, android = /android/i.test(ua), device = android ? "android" : "ios", deferred = null;
  window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); deferred = e; });
  window.addEventListener("appinstalled", function(){ Store.installSeen(true); });

  function render(){
    var steps = "";
    for (var i = 1; i <= 4; i++) steps += '<li><span class="n">' + i + "</span><div><b>" + t("inst_" + device + "_" + i) + '</b><span class="d">' + t("inst_" + device + "_" + i + "d") + "</span></div></li>";
    return '<div class="stack">' + (Store.installSeen() ? '<a class="back" href="#/profile">' + UI.icon("back", "flip") + t("back") + "</a>" : "") +
      "<h1>" + t("install_title") + '</h1><p class="soft">' + t("install_sub") + "</p>" +
      '<div class="card"><div class="appline"><img src="' + Brand.appIcon + '" width="56" height="56" alt=""><div><b class="ltr">' + Brand.name + '</b><p class="soft small">' + t("install_works") + "</p></div></div></div>" +
      '<div class="seg" role="group" aria-label="' + UI.esc(t("install_device")) + '">' +
        '<button type="button" data-act="inst-device" data-device="ios" aria-pressed="' + (device === "ios") + '">' + t("inst_ios") + "</button>" +
        '<button type="button" data-act="inst-device" data-device="android" aria-pressed="' + (device === "android") + '">' + t("inst_android") + "</button></div>" +
      '<div class="card"><ol class="steps">' + steps + "</ol></div>" +
      (deferred && device === "android" ? '<button type="button" class="btn" data-act="inst-now">' + t("install_now") + "</button>" : "") +
      '<button type="button" class="btn pop" data-act="inst-done">' + t("install_continue") + "</button></div>";
  }
  App.actions["inst-device"] = function(d){ device = d.device === "android" ? "android" : "ios"; App.render(); };
  App.actions["inst-now"] = function(){ if (deferred){ deferred.prompt(); deferred = null; } };
  App.actions["inst-done"] = function(){ Store.installSeen(true); App.go("#/"); };
  return {render: render};
})();
