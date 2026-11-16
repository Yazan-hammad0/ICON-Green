/* Partner (شريك): home, requests, my offer, updates. */
(function(){
  var t = function(k, v){ return I18N.t(k, v); }, esc = UI.esc, L = UI.L;

  function me(){ return Store.getPartner(Store.me().partner); }
  function openFor(p){ return Store.getRequests().filter(function(r){ return r.status === "open" && r.types.indexOf(p.type) >= 0; }); }
  function repliedBy(p){ return Store.getRequests().filter(function(r){ return r.status !== "open" && r.partner === p.id; }); }
  function reqCard(r, actions){
    var p = Store.getProject(r.project) || {};
    return '<div class="card"><div class="between"><h3 dir="auto">' + esc(L(p, "name")) + "</h3>" +
      (r.status === "open" ? UI.pill(I18N.opt("req_kind", r.kind)) : UI.pill(t("req_" + r.status), r.status === "accepted" ? "green" : "")) + "</div>" +
      '<p dir="auto">' + esc(L(r, "note")) + '</p><p class="soft small">' + esc(I18N.opt("waste", p.waste)) + t("list_sep") + esc(I18N.opt("city", p.city)) + t("list_sep") + t("asked_on", {date: UI.date(r.date)}) + "</p>" +
      (actions ? '<div class="btnrow"><button type="button" class="btn small" data-act="req-reply" data-id="' + r.id + '" data-status="accepted">' + t("accept") + "</button>" +
        '<button type="button" class="btn small quiet" data-act="req-reply" data-id="' + r.id + '" data-status="declined">' + t("decline") + "</button></div>" : "") + "</div>";
  }
  function home(){
    var u = Store.getUser(), p = me(), open = openFor(p);
    return '<div class="stack">' + UI.head(t("hello", {name: u.name})) +
      '<div class="card deep"><p class="eyebrow">' + t("do_next") + "</p><h2>" + esc(open.length ? t("pa_next_requests", {n: open.length}) : t("pa_next_offer")) + "</h2>" +
        '<a class="btn pop" href="' + (open.length ? "#/requests" : "#/offer") + '">' + t(open.length ? "tab_requests" : "tab_offer") + "</a></div>" +
      '<div class="card"><p class="eyebrow">' + t("you_are_demo") + '</p><h2 dir="auto">' + esc(L(p, "name")) + '</h2><p class="soft small">' + esc(I18N.opt("partner_type", p.type)) + t("list_sep") + esc(I18N.opt("city", p.city)) + "</p></div>" +
      '<div class="sect"><h2>' + t("matching_requests", {type: I18N.opt("partner_type", p.type)}) + "</h2></div>" +
      (open.length ? '<div class="list">' + open.slice(0, 3).map(function(r){ return reqCard(r, false); }).join("") + "</div>" : UI.empty(t("no_requests"))) + "</div>";
  }
  function requests(){
    var p = me(), open = openFor(p), done = repliedBy(p);
    return '<div class="stack">' + UI.head(t("tab_requests"), {sub: t("requests_sub")}) +
      (open.length ? '<div class="list">' + open.map(function(r){ return reqCard(r, true); }).join("") + "</div>" : UI.empty(t("no_requests"))) +
      (done.length ? '<div class="sect"><h2>' + t("replied") + '</h2></div><div class="list">' + done.map(function(r){ return reqCard(r, false); }).join("") + "</div>" : "") + "</div>";
  }
  function offer(){
    var p = me();
    return '<div class="stack">' + UI.head(t("tab_offer"), {sub: t("offer_sub")}) +
      '<form data-form="offer" class="card">' +
        UI.textarea("offers", t("f_offers"), {required: true, value: L(p, "offers"), maxlength: 300}) +
        UI.select("pricing", t("f_pricing"), I18N.keys("pricing"), "pricing", {required: true, value: p.pricing, placeholder: false}) +
        UI.input("capacity", t("f_capacity"), {type: "number", min: 0, max: 1000, inputmode: "numeric", required: true, value: p.capacity}) +
        '<label class="check"><input type="checkbox" name="available" value="1"' + (p.available ? " checked" : "") + "><span>" + t("f_available") + "</span></label>" +
        '<p class="soft small">' + t("no_prices_note") + '</p><button class="btn pop" type="submit">' + t("save") + "</button></form></div>";
  }

  App.actions["req-reply"] = function(d){
    var r = Store.getRequests().filter(function(x){ return x.id === d.id; })[0]; if (!r) return;
    r = JSON.parse(JSON.stringify(r)); r.status = d.status; r.partner = me().id; Store.saveRequest(r); App.render();
    UI.toast(t(d.status === "accepted" ? "accepted_toast" : "declined_toast"));
  };
  App.forms.offer = function(d){
    var p = JSON.parse(JSON.stringify(me()));
    p.offers = d.offers; delete p.offers_ar; delete p.offers_en; p.pricing = d.pricing; p.capacity = Number(d.capacity); p.available = !!(d.available && d.available.length);
    Store.savePartner(p); App.render(); UI.toast(t("saved"));
  };

  Screens.partner = {
    tabs: [{id: "home", icon: "home", label: "tab_home"}, {id: "requests", icon: "inbox", label: "tab_requests", count: function(){ return openFor(me()).length; }}, {id: "offer", icon: "edit", label: "tab_offer"}, {id: "updates", icon: "news", label: "tab_updates"}],
    render: function(tab){ return tab === "requests" ? requests() : tab === "offer" ? offer() : tab === "updates" ? News.screen("partner") : home(); }
  };
})();
