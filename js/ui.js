/* Small helpers every screen uses: escaping, formatting, icons, form parts, the journey route, the line chart. */
var UI = (function(){
  var t = function(k, v){ return I18N.t(k, v); };
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
  /* L(record, "name") picks name_ar or name_en for the current language; plain "name" (typed by a user) is shown as written. */
  function L(o, k){ if (!o) return ""; var l = I18N.lang(); return o[k + "_" + l] || o[k] || o[k + "_ar"] || o[k + "_en"] || ""; }

  /* ---- numbers and dates: western digits in both languages ---- */
  function num(n){ return Number(n || 0).toLocaleString("en-US", {maximumFractionDigits: 1}); }
  function sar(n){ return t("sar", {n: num(n)}); }
  function sarShort(n){
    n = Number(n || 0);
    if (n >= 1e6) return t("sar_m", {n: num(Math.round(n / 1e5) / 10)});
    if (n >= 1e3) return t("sar_k", {n: num(Math.round(n / 1e3))});
    return sar(n);
  }
  function tonnes(n){ return t("tonnes", {n: num(n)}); }
  function date(iso){
    if (!iso) return "";
    var p = String(iso).split("-"), m = I18N.months()[+p[1] - 1];
    return I18N.lang() === "ar" ? (+p[2]) + " " + m + " " + p[0] : (+p[2]) + " " + m + " " + p[0];
  }
  function daysSince(iso){
    if (!iso) return 0;
    var p = String(iso).split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]), n = new Date(); n.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((n - d) / 864e5));
  }

  /* ---- icons (stroke, 24 box). Directional ones get class "flip" so they mirror in right to left. ---- */
  var P = {
    home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.5"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    news: '<path d="M5 5h11v14H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1z"/><path d="M16 9h3a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2h-2M8 9h5M8 13h5"/>',
    box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    inbox: '<path d="M4 13l2.5-8h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 13h4.5a3.5 3.5 0 0 0 7 0H20"/>',
    hand: '<path d="M3 12l4-4 5 3 4-3 5 4-4 4-3-2-3 3-3-2z"/><path d="M12 11l-3 3"/>',
    chart: '<path d="M4 20V5M4 20h16"/><path d="M7 15l4-4 3 3 5-6"/>',
    brief: '<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M9 7V5h6v2M4 12h16"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    board: '<rect x="4" y="4" width="4.5" height="16" rx="1"/><rect x="10" y="4" width="4.5" height="10" rx="1"/><rect x="16" y="4" width="4.5" height="13" rx="1"/>',
    people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3 2.7-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><path d="M16 6a3 3 0 0 1 0 5.5M17.5 14.8c1.7.6 2.7 2 3 4.2"/>',
    edit: '<path d="M5 19h4l10-10-4-4L5 15z"/><path d="M13.5 6.5l4 4"/>',
    factory: '<path d="M4 20V10l5 3v-3l5 3V6h5v14z"/><path d="M8 17h2M13 17h2"/>',
    coins: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v5M12 17.5v.5"/>',
    link: '<path d="M14 5h5v5M19 5l-8 8M11 6H6a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  function icon(name, cls){
    var d = P[name] || "";
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : "") + ">" + d + "</svg>";
  }
  function chev(){ return icon("chevron", "chev flip"); }

  /* ---- screen parts ---- */
  function demo(){ return '<span class="pill demo">' + t("demo") + "</span>"; }
  function head(title, o){
    o = o || {};
    return (o.back ? '<a class="back" href="' + o.back + '">' + icon("back", "flip") + esc(o.backLabel || t("back")) + "</a>" : "") +
      '<div class="shead"><h1>' + esc(title) + "</h1>" + (o.demo === false ? "" : demo()) + "</div>" + (o.sub ? '<p class="soft">' + esc(o.sub) + "</p>" : "");
  }
  function pill(text, tone){ return '<span class="pill ' + (tone || "") + '">' + esc(text) + "</span>"; }
  function empty(text){ return '<div class="empty">' + esc(text) + "</div>"; }
  function kv(pairs){ return '<div class="kv">' + pairs.map(function(p){ return "<div><b" + (p[2] ? ' dir="auto"' : "") + ">" + esc(p[1]) + "</b><span>" + esc(p[0]) + "</span></div>"; }).join("") + "</div>"; }
  function bars(rows, max){
    max = max || Math.max.apply(null, rows.map(function(r){ return r[1]; }).concat([1]));
    return '<div class="bars">' + rows.map(function(r){
      return '<div class="bar"><span>' + esc(r[0]) + '</span><span class="track"><span class="fill" style="width:' + Math.round(r[1] / max * 100) + '%;display:block"></span></span><b>' + num(r[1]) + "</b></div>";
    }).join("") + "</div>";
  }

  /* the six-stage journey as a horizontal route. stage = current stage, failed = current gate was not passed */
  function route(stage, failed, hrefFor){
    var html = '<div class="route" role="list">';
    for (var i = 1; i <= 6; i++){
      var st = i < stage ? "passed" : i === stage ? (failed ? "current failed" : "current") : "locked";
      var label = I18N.stage(i).name + ": " + t("gs_" + (i < stage ? "passed" : i === stage ? (failed ? "retry" : "current") : "locked"));
      var inner = '<span class="dotn">' + (i < stage ? icon("check") : i) + "</span><span>" + esc(I18N.stage(i).short) + "</span>";
      html += hrefFor ? '<a role="listitem" class="stop ' + st + '" href="' + hrefFor(i) + '" aria-label="' + esc(label) + '">' + inner + "</a>"
                      : '<div role="listitem" class="stop ' + st + '" aria-label="' + esc(label) + '">' + inner + "</div>";
    }
    return html + "</div>";
  }
  function stagePill(p){
    var s = I18N.stage(p.stage);
    return pill(p.stage + ". " + s.name, p.failed && p.failed.stage === p.stage ? "amber" : p.stage >= 5 ? "green" : "");
  }

  /* line chart for six monthly values */
  function spark(vals, tone){
    var w = 300, h = 64, pad = 6, max = Math.max.apply(null, vals.concat([1])), min = Math.min.apply(null, vals);
    var span = (max - min) || 1;
    var pts = vals.map(function(v, i){ return [pad + i * (w - 2 * pad) / (vals.length - 1), h - pad - (v - min) / span * (h - 2 * pad)]; });
    var line = pts.map(function(p, i){ return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var last = pts[pts.length - 1];
    return '<svg class="spark ' + (tone || "") + '" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" role="img" aria-label="' + esc(t("chart_label", {a: sarShort(vals[0]), b: sarShort(vals[vals.length - 1])})) + '">' +
      '<path class="ar" d="' + line + " L" + last[0].toFixed(1) + " " + h + " L" + pts[0][0].toFixed(1) + " " + h + ' Z"/><path class="ln" d="' + line + '" vector-effect="non-scaling-stroke"/></svg>';
  }

  /* ---- form parts ---- */
  function opts(list, group, val, placeholder){
    return (placeholder ? '<option value="">' + esc(placeholder) + "</option>" : "") + list.map(function(k){ return '<option value="' + k + '"' + (k === val ? " selected" : "") + ">" + esc(I18N.opt(group, k)) + "</option>"; }).join("");
  }
  function field(label, control, optional){ return '<div class="field"><label>' + esc(label) + (optional ? ' <span class="opt">' + t("optional") + "</span>" : "") + control + "</label></div>"; }
  function input(name, label, o){
    o = o || {};
    return '<div class="field"><label for="f-' + name + '">' + esc(label) + (o.optional ? ' <span class="opt">' + t("optional") + "</span>" : "") + "</label>" +
      '<input id="f-' + name + '" name="' + name + '" type="' + (o.type || "text") + '"' + (o.required ? " required" : "") + (o.min != null ? ' min="' + o.min + '"' : "") + (o.max != null ? ' max="' + o.max + '"' : "") +
      (o.inputmode ? ' inputmode="' + o.inputmode + '"' : "") + (o.maxlength ? ' maxlength="' + o.maxlength + '"' : "") + ' value="' + esc(o.value == null ? "" : o.value) + '" autocomplete="' + (o.autocomplete || "off") + '" dir="auto"></div>';
  }
  function textarea(name, label, o){
    o = o || {};
    return '<div class="field"><label for="f-' + name + '">' + esc(label) + (o.optional ? ' <span class="opt">' + t("optional") + "</span>" : "") + "</label>" +
      '<textarea id="f-' + name + '" name="' + name + '"' + (o.required ? " required" : "") + ' maxlength="' + (o.maxlength || 600) + '" dir="auto">' + esc(o.value || "") + "</textarea></div>";
  }
  function select(name, label, list, group, o){
    o = o || {};
    return '<div class="field"><label for="f-' + name + '">' + esc(label) + (o.optional ? ' <span class="opt">' + t("optional") + "</span>" : "") + "</label>" +
      '<select id="f-' + name + '" name="' + name + '"' + (o.required ? " required" : "") + ">" + opts(list, group, o.value, o.placeholder === false ? "" : t("choose")) + "</select></div>";
  }
  function chips(name, label, list, group, values){
    values = values || [];
    return "<fieldset><legend>" + esc(label) + '</legend><div class="chips">' + list.map(function(k){
      return '<label class="chip"><input type="checkbox" name="' + name + '" value="' + k + '"' + (values.indexOf(k) >= 0 ? " checked" : "") + "><span>" + esc(I18N.opt(group, k)) + "</span></label>";
    }).join("") + "</div></fieldset>";
  }
  function formData(form){
    var o = {};
    Array.prototype.forEach.call(form.elements, function(el){
      if (!el.name) return;
      if (el.type === "checkbox"){ if (!o[el.name]) o[el.name] = []; if (el.checked) o[el.name].push(el.value); }
      else if (el.type === "radio"){ if (el.checked) o[el.name] = el.value; }
      else o[el.name] = el.value.trim();
    });
    return o;
  }

  var toastTimer = null;
  function toast(msg){
    var el = document.getElementById("toast"); if (!el) return;
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ el.hidden = true; }, 2600);
  }

  return {esc: esc, L: L, num: num, sar: sar, sarShort: sarShort, tonnes: tonnes, date: date, daysSince: daysSince, icon: icon, chev: chev, demo: demo, head: head, pill: pill, empty: empty, kv: kv, bars: bars,
    route: route, stagePill: stagePill, spark: spark, opts: opts, field: field, input: input, textarea: textarea, select: select, chips: chips, formData: formData, toast: toast};
})();
