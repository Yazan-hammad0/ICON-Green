/* Screen-tall layout for the home-screen app, update card, service worker. Same idea as in Klaar. */
var ICON_VERSION = "d147fb4393", ICON_NEWS = "First demo of ICON Green";
(function(){
  var probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:0;top:0;width:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)";
  document.body.appendChild(probe);
  var info = {}, root = document.documentElement;
  /* Home-screen app: the whole app is one block exactly as tall as the screen, with the tab bar as its last row.
     Nothing is pinned to the "viewport", which iOS sometimes reports shorter than the screen, so nothing can move. */
  function isStandalone(){ return window.navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches); }
  function fit(){
    var st = isStandalone();
    var portrait = !window.matchMedia || matchMedia("(orientation: portrait)").matches;
    var full = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    var h = window.innerHeight, d = full - h;
    if (st && d >= 0 && d <= 140) h = full;
    if (st && h !== info.h) root.style.setProperty("--app-h", h + "px");
    if (root.classList.contains("shell") !== st) root.classList.toggle("shell", st);
    info = {st: st, full: full, h: h};
  }
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", function(){ setTimeout(fit, 300); });
  window.addEventListener("pageshow", fit);
  window.addEventListener("scroll", function(){ if (root.classList.contains("shell") && window.scrollY) window.scrollTo(0, 0); }, {passive: true});

  /* updates: check when the app comes back to the front. A new version that arrives before you have touched anything
     is put in straight away; later on, a one-tap card offers it so nothing reloads under your thumb. */
  function tr(k){ return window.I18N ? I18N.t(k) : k; }
  var touched = false, updated = false;
  try{ updated = sessionStorage.getItem("iconUpdated") === "1"; sessionStorage.removeItem("iconUpdated"); }catch(e){}
  document.addEventListener("pointerdown", function(){ touched = true; }, {capture: true, once: true});
  function updateBar(done){
    if (document.getElementById("upd")) return;
    var u = document.createElement("div"); u.id = "upd"; u.className = "upd"; u.setAttribute("role", "status");
    var s = document.createElement("span"), b = document.createElement("b"), n = document.createElement("span"), btn = document.createElement("button");
    b.textContent = tr(done ? "upd_done" : "upd_new"); n.textContent = ICON_NEWS; n.dir = "auto";
    s.appendChild(b); s.appendChild(n);
    btn.className = "btn pop"; btn.type = "button"; btn.textContent = tr(done ? "ok" : "upd_btn");
    btn.addEventListener("click", function(){ if (done) u.remove(); else location.reload(); });
    u.appendChild(s); u.appendChild(btn);
    document.body.appendChild(u);
    if (done) setTimeout(function(){ u.remove(); }, 6000);
  }
  if (updated) setTimeout(function(){ updateBar(true); }, 300);
  if ("serviceWorker" in navigator){
    var hadController = !!navigator.serviceWorker.controller, reg = null;
    navigator.serviceWorker.addEventListener("controllerchange", function(){
      if (hadController){
        if (!touched){ try{ sessionStorage.setItem("iconUpdated", "1"); }catch(e){} location.reload(); }
        else updateBar(false);
      }
      hadController = true;
    });
    window.addEventListener("load", function(){ navigator.serviceWorker.register("sw.js").then(function(r){ reg = r; }).catch(function(){}); });
    document.addEventListener("visibilitychange", function(){ if (!document.hidden){ setTimeout(fit, 120); if (reg) reg.update().catch(function(){}); } });
    setInterval(function(){ if (reg && !document.hidden) reg.update().catch(function(){}); }, 30 * 60 * 1000);
  }
  window.ICON_SHELL = {standalone: isStandalone, version: function(){ return ICON_VERSION; }};
})();
