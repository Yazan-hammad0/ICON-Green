/* Talks to the accounts backend (Supabase) with plain fetch, no library. Only js/store.js calls this file.
   Backend.on is false until js/config.js is filled in; then nothing here runs and accounts stay on the device.
   Tables, rules and the email template it expects are in docs/BACKEND.md. */
var Backend = (function(){
  var cfg = window.ICON_CONFIG || {}, base = String(cfg.supabaseUrl || "").replace(/\/+$/, ""), key = cfg.supabaseKey || "";
  var on = /^https:\/\//.test(base) && key.length > 20;

  function call(path, body, token, extra){
    var headers = {"apikey": key, "Authorization": "Bearer " + (token || key), "Content-Type": "application/json"};
    if (extra) Object.keys(extra).forEach(function(k){ headers[k] = extra[k]; });
    return fetch(base + path, {method: body === undefined ? "GET" : "POST", headers: headers, body: body === undefined ? undefined : JSON.stringify(body)})
      .then(function(r){
        return r.text().then(function(txt){
          var data = null; try{ data = txt ? JSON.parse(txt) : null; }catch(e){}
          if (!r.ok){ var err = new Error((data && (data.msg || data.message || data.error_description || data.error)) || ("HTTP " + r.status)); err.status = r.status; throw err; }
          return data;
        });
      });
  }
  function toSession(d){ return {access: d.access_token, refresh: d.refresh_token, uid: d.user && d.user.id, email: d.user && d.user.email, exp: Date.now() + (Number(d.expires_in) || 3600) * 1000}; }

  /* email a 6-digit code (creates the account on first use) */
  function sendCode(email){ return call("/auth/v1/otp", {email: email, create_user: true}); }
  function verify(email, code){ return call("/auth/v1/verify", {type: "email", email: email, token: code}).then(toSession); }
  /* a fresh access token when the old one is about to run out; onSession lets the store save it */
  function fresh(session, onSession){
    if (session.exp - Date.now() > 60000) return Promise.resolve(session);
    return call("/auth/v1/token?grant_type=refresh_token", {refresh_token: session.refresh}).then(function(d){
      var s = toSession(d); if (!s.uid) s.uid = session.uid; if (!s.email) s.email = session.email;
      if (onSession) onSession(s); return s;
    });
  }
  var UPSERT = {"Prefer": "resolution=merge-duplicates,return=minimal"};
  function saveProfile(session, p){
    return call("/rest/v1/profiles?on_conflict=id", {id: session.uid, email: session.email, name: p.name, role: p.role, city: p.city || null, fields: p.fields || {}, lang: p.lang || "ar"}, session.access, UPSERT);
  }
  function loadProfile(session){ return call("/rest/v1/profiles?select=name,role,city,fields,lang&id=eq." + encodeURIComponent(session.uid), undefined, session.access).then(function(rows){ return rows && rows[0] || null; }); }
  function saveProgress(session, data){ return call("/rest/v1/progress?on_conflict=user_id", {user_id: session.uid, data: data, updated_at: new Date().toISOString()}, session.access, UPSERT); }
  function loadProgress(session){ return call("/rest/v1/progress?select=data&user_id=eq." + encodeURIComponent(session.uid), undefined, session.access).then(function(rows){ return rows && rows[0] ? rows[0].data : null; }); }
  /* totals only (role, city, n): no names and no emails ever come back from this */
  function counts(session){ return call("/rest/v1/rpc/signup_counts", {}, session.access); }
  function signOut(session){ return call("/auth/v1/logout", {}, session.access).catch(function(){}); }

  return {on: on, sendCode: sendCode, verify: verify, fresh: fresh, saveProfile: saveProfile, loadProfile: loadProfile, saveProgress: saveProgress, loadProgress: loadProgress, counts: counts, signOut: signOut};
})();
