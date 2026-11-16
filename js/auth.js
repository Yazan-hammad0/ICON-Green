/* Before sign-in: welcome, then pick a role, then a short demo sign-in form. No password, nothing leaves the device. */
var Auth = (function(){
  var t = function(k, v){ return I18N.t(k, v); }, esc = UI.esc;

  function langButton(){
    var other = I18N.lang() === "ar" ? "en" : "ar";
    return '<button type="button" class="btn small langbtn" data-act="lang" data-lang="' + other + '" lang="' + other + '">' + (other === "en" ? "English" : "العربية") + "</button>";
  }
  function welcome(){
    var chips = "";
    for (var i = 1; i <= 6; i++) chips += "<span><b>" + i + "</b>" + esc(I18N.stage(i).name) + "</span>";
    return '<div class="welcome">' + langButton() +
      '<div class="plate">' + Brand.logoImg() + "</div>" +
      '<div class="hero"><h1>' + t("idea_line") + "</h1><p>" + t("idea_sub") + "</p></div>" +
      '<div class="card wcard"><p class="eyebrow">' + t("w_problem_eyebrow") + "</p><h2>" + t("w_problem_title") + "</h2><ul>" +
        [1, 2, 3, 4, 5].map(function(n){ return "<li>" + t("w_problem_" + n) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="card wcard"><p class="eyebrow">' + t("w_journey_eyebrow") + "</p><h2>" + t("w_journey_title") + '</h2><div class="stagechips">' + chips + '</div><p class="soft small">' + t("w_journey_note") + "</p></div>" +
      '<div class="card deep wcard"><p class="eyebrow">' + t("w_partner_eyebrow") + "</p><h2>" + t("w_partner_title") + '</h2><p class="soft">' + t("w_partner_text") + "</p></div>" +
      '<a class="btn pop" href="#/signin">' + t("get_started") + "</a>" +
      '<p class="soft small" style="text-align:center">' + t("w_demo_note") + "</p></div>";
  }
  function roles(){
    return '<div class="stack"><a class="back" href="#/welcome">' + UI.icon("back", "flip") + t("back") + "</a>" +
      "<h1>" + t("who_are_you") + '</h1><p class="soft">' + t("who_are_you_sub") + '</p><div class="list">' +
      App.ROLES.map(function(r){
        return '<a class="card rolecard" href="#/signin/' + r + '"><span class="ric">' + UI.icon(App.ROLE_ICON[r]) + "</span><span><b>" + esc(I18N.opt("role", r)) + "</b><span>" + esc(I18N.opt("role_value", r)) + "</span></span>" + UI.chev() + "</a>";
      }).join("") + "</div></div>";
  }
  function roleFields(r){
    var W = I18N.keys("waste");
    if (r === "founder") return UI.select("waste", t("f_waste"), W, "waste", {required: true}) + UI.select("idea_stage", t("f_idea_stage"), I18N.keys("idea_stage"), "idea_stage", {required: true});
    if (r === "waste_owner") return UI.select("waste", t("f_waste_have"), W, "waste", {required: true}) + UI.input("tonnes", t("f_tonnes"), {type: "number", min: 0, max: 100000, inputmode: "decimal", required: true});
    if (r === "partner") return UI.select("partner_type", t("f_partner_type"), I18N.keys("partner_type"), "partner_type", {required: true}) + UI.textarea("offers", t("f_offers"), {maxlength: 300, optional: true});
    if (r === "investor") return UI.select("investor_type", t("f_investor_type"), I18N.keys("investor_type"), "investor_type", {required: true}) +
      UI.chips("sectors", t("f_sectors"), W.filter(function(k){ return k !== "other"; }), "waste", []) + UI.select("ticket", t("f_ticket"), I18N.keys("ticket"), "ticket", {optional: true});
    return "";
  }
  function form(r){
    return '<div class="stack"><a class="back" href="#/signin">' + UI.icon("back", "flip") + t("back") + "</a>" +
      '<div class="row"><span class="rolecard" style="display:contents"><span class="ric">' + UI.icon(App.ROLE_ICON[r]) + '</span></span><div class="grow"><h1>' + esc(I18N.opt("role", r)) + '</h1><p class="soft small">' + esc(I18N.opt("role_value", r)) + "</p></div></div>" +
      '<p class="note">' + t("demo_signin_note") + "</p>" +
      '<form data-form="signin" data-role="' + r + '">' +
        UI.input("name", t("f_name"), {required: true, maxlength: 60, autocomplete: "off"}) +
        (r === "team" ? "" : UI.input("org", t("f_org"), {optional: true, maxlength: 80})) +
        UI.select("city", t("f_city"), I18N.keys("city"), "city", {required: true}) +
        roleFields(r) +
        '<button class="btn pop" type="submit">' + t("demo_enter") + "</button></form></div>";
  }
  function render(p){
    if (p[0] === "signin") return p[1] && App.ROLES.indexOf(p[1]) >= 0 ? form(p[1]) : roles();
    return welcome();
  }

  App.forms.signin = function(d, formEl){
    var role = formEl.getAttribute("data-role"), fields = {};
    ["waste", "idea_stage", "tonnes", "partner_type", "offers", "investor_type", "sectors", "ticket"].forEach(function(k){ if (d[k] !== undefined && d[k] !== "") fields[k] = k === "tonnes" ? Number(d[k]) : d[k]; });
    Store.signIn({role: role, name: d.name, org: d.org, city: d.city, fields: fields});
    App.go(window.ICON_SHELL && ICON_SHELL.standalone() || Store.installSeen() ? "#/" : "#/install");
  };

  return {render: render};
})();
