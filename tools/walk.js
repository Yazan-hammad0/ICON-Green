// Walks every role from sign-in to its last tab. Usage: node walk.js <baseUrl> <shotsDir> [quick]
const { chromium } = require('playwright'); const fs = require('fs');
const base = process.argv[2], shots = process.argv[3], quick = process.argv[4] === 'quick';
fs.mkdirSync(shots, {recursive: true});
const problems = [];
async function run(cfg){
  const tag = `${cfg.lang}-${cfg.scheme}-${cfg.standalone ? 'app' : 'web'}-${cfg.w}`;
  const br = await chromium.launch();
  const ctx = await br.newContext({viewport: {width: cfg.w, height: cfg.h}, deviceScaleFactor: 2, isMobile: cfg.w < 500, hasTouch: cfg.w < 500, colorScheme: cfg.scheme, serviceWorkers: 'block',
    userAgent: cfg.w < 500 ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' : undefined});
  await ctx.addInitScript(([lang, st]) => {
    if (st) Object.defineProperty(navigator, 'standalone', {get: () => true});
    if (!localStorage.getItem('iconGreenV1')) localStorage.setItem('iconGreenV1', JSON.stringify({lang, user: null, changes: {}}));
  }, [cfg.lang, cfg.standalone]);
  const page = await ctx.newPage();
  const note = (m) => problems.push(`[${tag}] ${m}`);
  page.on('pageerror', e => note('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') note('console: ' + m.text()); });
  page.on('requestfailed', r => note('requestfailed: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) note('http ' + r.status() + ' ' + r.url()); });
  page.on('dialog', d => d.accept());
  const check = async (label) => {
    await page.waitForTimeout(70);
    const r = await page.evaluate(() => {
      const de = document.documentElement, m = document.getElementById('main');
      const txt = m.innerText;
      const small = [...document.querySelectorAll('main a, main button, .tabbar a, .top a, main select, main input:not([type=checkbox]), main textarea')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.height < 43.5 || b.width < 43.5); }).map(e => (e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
      const wide = [...m.querySelectorAll('*')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 1 || b.left < -1); }).slice(0, 3).map(e => e.tagName + '.' + e.className);
      const bad = txt.match(/.{0,30}(undefined|NaN|\[object|null).{0,30}/);
      return {over: de.scrollWidth > innerWidth + 1 || m.scrollWidth > m.clientWidth + 1, wide, bad: bad ? bad[0] : '',
        key: (txt.match(/\b[a-z]+_[a-z_0-9]+\b/) || [''])[0], dash: /[—–]/.test(txt), small: small.slice(0, 4), empty: txt.trim().length < 5, dir: de.dir, lang: de.lang, shell: de.classList.contains('shell'), hash: location.hash};
    });
    if (r.over || r.wide.length) note(`${label}: horizontal overflow ${r.wide.join(' | ')}`);
    if (r.bad) note(`${label}: bad text "${r.bad}"`);
    if (r.key) note(`${label}: raw key "${r.key}"`);
    if (r.dash) note(`${label}: dash in text`);
    if (r.small.length) note(`${label}: small targets ${r.small.join(' | ')}`);
    if (r.empty) note(`${label}: empty screen`);
    if (r.lang !== cfg.lang || r.dir !== (cfg.lang === 'ar' ? 'rtl' : 'ltr')) note(`${label}: lang/dir wrong ${r.lang}/${r.dir}`);
    if (r.shell !== !!cfg.standalone) note(`${label}: shell class wrong`);
    return r;
  };
  const go = async (hash, label, shot) => { await page.evaluate(h => { location.hash = h; }, hash); const r = await check(label || hash); if (shot) await snap({path: `${shots}/${tag}-${shot}.png`, fullPage: !cfg.standalone}); return r; };
  const snap = async (o) => { await page.waitForTimeout(900); await page.screenshot(o); };
  const signIn = async (role) => {
    await page.goto(base + '#/welcome'); await page.waitForSelector('.welcome, .install');
    const seen = await page.evaluate(() => !!JSON.parse(localStorage.iconGreenV1).installSeen);
    if (!cfg.standalone && cfg.w < 500 && !seen) {
      const r = await check('install'); if (!/install/.test(r.hash)) note('install guide not shown first on a phone');
      if (role === 'founder') await snap({path: `${shots}/${tag}-install.png`, fullPage: true});
      await page.click('[data-act="inst-step"][data-i="1"]'); await check('install step 2');
      if (await page.getAttribute('#mock', 'data-scene') !== '1') note('install step did not change the scene');
      if (role === 'founder') await snap({path: `${shots}/${tag}-install-2.png`, fullPage: true});
      await page.click('[data-act="inst-done"]'); await page.waitForSelector('.welcome');
    }
    await check('welcome');
    if (role === 'founder') {
      await snap({path: `${shots}/${tag}-welcome.png`, fullPage: true});
      for (const r of ['waste_owner', 'partner', 'investor']) { await page.click(`[data-act="show-role"][data-role="${r}"]`); await check('showcase ' + r); if (r === 'investor') await snap({path: `${shots}/${tag}-welcome-investor.png`, fullPage: true}); }
      if (!cfg.standalone) { await page.click('a[href="#/install"]'); await check('install from welcome'); await page.click('[data-act="inst-done"]'); await page.waitForSelector('.welcome'); }
    }
    if (role === 'team') await page.click('a[href="#/signin/team"]');
    else { await page.click(`[data-act="show-role"][data-role="${role}"]`).catch(() => {}); await page.click(`a.btn.pop[href="#/signin/${role}"]`); }
    await page.waitForSelector('form[data-form=signin]'); await check('register-' + role);
    await page.fill('#f-name', cfg.lang === 'ar' ? 'زائر تجريبي' : 'Demo Visitor');
    await page.fill('#f-email', 'not-an-email'); await page.selectOption('#f-city', 'riyadh');
    if (role === 'founder') await page.selectOption('#f-waste', 'plastic');
    if (role === 'waste_owner') { await page.selectOption('#f-waste', 'plastic'); await page.fill('#f-tonnes', '80'); }
    if (role === 'partner') await page.selectOption('#f-partner_type', 'lab');
    if (role === 'investor') { await page.selectOption('#f-investor_type', 'fund'); await page.click('label.chip:has(input[value=plastic])'); await page.click('label.chip:has(input[value=batteries])'); if (await page.locator('input[name=sectors]:checked').count() !== 2) note('chips not checked'); }
    await page.fill('#f-email', 'visitor@example.com');
    if (role === 'investor') await snap({path: `${shots}/${tag}-register-investor.png`, fullPage: true});
    await page.click('form[data-form=signin] button[type=submit]');
    await page.waitForSelector('.tabbar a'); await check(role + ' first tab');
    const em = await page.evaluate(() => JSON.parse(localStorage.iconGreenV1).user.email); if (em !== 'visitor@example.com') note('email not saved: ' + em);
  };
  const signOut = async () => { await go('#/profile', 'profile'); await page.click('[data-act="sign-out"]'); await page.waitForSelector('.welcome'); };
  const count = (sel) => page.locator(sel).count();
  const text = () => page.locator('main').innerText();
  const switchTo = async (role) => { await go('#/profile'); await page.click(`[data-act="switch-role"][data-role="${role}"]`); await check(role + ' after switch'); };

  // founder
  await signIn('founder');
  await snap({path: `${shots}/${tag}-founder-home.png`, fullPage: !cfg.standalone});
  await page.click('.card.deep a.btn.pop'); await check('founder do-next target');
  await go('#/project', 'founder project', 'founder-project');
  for (let i = 1; i <= 6; i++) await go('#/project/stage/' + i, 'founder stage ' + i, i === 2 ? 'founder-stage2' : i === 1 ? 'founder-stage1' : null);
  await go('#/project/stage/2'); const before = await count('main input[type=checkbox]:checked');
  await page.locator('main input[type=checkbox]:not(:checked)').first().click(); await check('founder tick');
  if (await count('main input[type=checkbox]:checked') !== before + 1) note('tick not saved');
  while (await count('main input[type=checkbox]:not(:checked)')) await page.locator('main input[type=checkbox]:not(:checked)').first().click();
  await check('founder all ticked');
  if (!await count('[data-act="request-review"]')) note('no request review button'); else { await page.click('[data-act="request-review"]'); await check('founder review requested'); }
  await go('#/submit', 'founder submit', 'founder-submit');
  await page.selectOption('#f-waste', 'textiles'); await page.fill('#f-tonnes', '30'); await page.fill('#f-name', 'Walk Test Idea'); await page.fill('#f-problem', 'Problem text'); await page.fill('#f-solution', 'Solution text');
  await page.click('form[data-form="submit-project"] button[type=submit]'); await check('founder submitted');
  await page.click('[data-act="submit-kind"][data-kind="challenge"]'); await check('founder submit challenge');
  await page.selectOption('#f-challenge', 's5'); await page.fill('#f-name', 'Walk Test Challenge'); await page.fill('#f-solution', 'Solution text');
  await page.click('form[data-form="submit-project"] button[type=submit]'); await check('founder submitted challenge');
  if (await count('main .card h3') < 2) note('submissions not listed');
  await go('#/updates', 'founder updates', 'founder-updates');
  if (quick) { await br.close(); return; }
  // team sees the founder's work
  await go('#/profile', 'profile', 'profile'); await switchTo('team');
  await snap({path: `${shots}/${tag}-team-pipeline.png`, fullPage: !cfg.standalone});
  if (!(await text()).includes('Walk Test Idea')) note('submission missing from pipeline');
  await go('#/pipeline/p/p2', 'team project p2', 'team-project'); await page.click('[data-act="pass-gate"]'); await check('team passed gate');
  await go('#/pipeline/p/p3', 'team project p3'); await page.fill('#f-text', 'Please add a letter of intent.'); await page.click('form[data-form=feedback] button[type=submit]'); await check('team feedback sent');
  await go('#/pipeline/p/p1', 'team project p1'); await page.click('[data-act="pass-gate"]'); await check('team passed p1');
  await go('#/pipeline/p/p8', 'team project p8');
  await go('#/demand', 'team demand', 'team-demand'); await go('#/inbox', 'team inbox', 'team-inbox');
  if (!(await text()).includes('Walk Test Challenge')) note('inbox missing submission');
  await go('#/updates', 'team updates'); await page.fill('#f-title', 'Walk update'); await page.fill('#f-body', 'Body of update'); await page.click('form[data-form="post-update"] button[type=submit]'); await check('team update posted');
  await snap({path: `${shots}/${tag}-team-updates.png`, fullPage: !cfg.standalone});
  // back to founder: the passed gate and the team update should show
  await switchTo('founder');
  await go('#/updates', 'founder updates after'); if (!(await text()).includes('Walk update')) note('team update not visible to founder');
  await go('#/project', 'founder project after'); if (await count('.stagerow.passed') !== 2) note('gate pass not visible to founder: ' + await count('.stagerow.passed'));
  // waste owner
  await switchTo('waste_owner');
  await snap({path: `${shots}/${tag}-waste-home.png`, fullPage: !cfg.standalone});
  await go('#/waste', 'waste my waste', 'waste-my'); await page.click('[data-act="post-challenge"]'); await check('waste posted challenge');
  await page.selectOption('#f-waste', 'paper'); await page.fill('#f-tonnes', '25'); await page.selectOption('#f-city', 'jeddah'); await page.fill('#f-cost', '150'); await page.fill('#f-title', 'Walk cardboard');
  await page.click('form[data-form="add-stream"] button[type=submit]'); await check('waste stream added');
  if (!(await text()).includes('Walk cardboard')) note('stream not listed');
  await go('#/home', 'waste home after'); await go('#/solutions', 'waste solutions', 'waste-solutions'); await go('#/updates', 'waste updates');
  // partner (all four types)
  for (const ty of ['lab', 'factory', 'university', 'expert']) {
    await page.evaluate((ty) => { const s = JSON.parse(localStorage.iconGreenV1); s.user.role = 'partner'; s.user.fields = {partner_type: ty}; localStorage.iconGreenV1 = JSON.stringify(s); }, ty);
    await page.reload(); await page.waitForSelector('.tabbar a'); await go('#/home', 'partner home ' + ty, ty === 'lab' ? 'partner-home' : null);
    await go('#/requests', 'partner requests ' + ty, ty === 'lab' ? 'partner-requests' : null);
    if (ty === 'lab') {
      const n = await count('[data-act="req-reply"][data-status="accepted"]');
      await page.locator('[data-act="req-reply"][data-status="accepted"]').first().click(); await check('partner accepted');
      await page.locator('[data-act="req-reply"][data-status="declined"]').first().click(); await check('partner declined');
      if (await count('[data-act="req-reply"][data-status="accepted"]') !== n - 2) note('request replies not saved');
    }
    await go('#/offer', 'partner offer ' + ty, ty === 'lab' ? 'partner-offer' : null);
    if (ty === 'lab') { await page.fill('#f-offers', 'Updated offer'); await page.fill('#f-capacity', '15'); await page.click('form[data-form=offer] button[type=submit]'); await check('partner offer saved'); }
    await go('#/updates', 'partner updates ' + ty);
  }
  // investor
  await switchTo('investor');
  await snap({path: `${shots}/${tag}-investor-portfolio.png`, fullPage: !cfg.standalone});
  const pills = await page.evaluate(() => ['red', 'amber', 'green'].map(c => document.querySelectorAll('main a.card .pill.' + c).length).join(','));
  if (pills !== '1,1,2') note('health pills wrong: ' + pills);
  for (const c of ['c1', 'c2', 'c3', 'c4']) await go('#/portfolio/c/' + c, 'investor company ' + c, c === 'c2' ? 'investor-company' : null);
  await go('#/deals', 'investor deals', 'investor-deals'); await go('#/deals/p/p5', 'investor deal p5'); await go('#/deals/p/p6', 'investor deal p6', 'investor-deal');
  await page.click('[data-act="request-meeting"]'); await check('investor meeting requested'); if (await count('[data-act="request-meeting"]')) note('meeting not saved');
  await go('#/insights', 'investor insights', 'investor-insights'); await go('#/updates', 'investor updates', 'investor-updates');
  // team inbox shows the meeting and partner replies
  await switchTo('team'); await go('#/inbox', 'team inbox 2', 'team-inbox2'); await go('#/demand', 'team demand 2');
  // language switch, reset, sign out
  await go('#/profile'); await page.click(`[data-act="lang"][data-lang="${cfg.lang === 'ar' ? 'en' : 'ar'}"]`); await page.waitForTimeout(60);
  const d = await page.evaluate(() => document.documentElement.dir + document.documentElement.lang); if (d !== (cfg.lang === 'ar' ? 'ltren' : 'rtlar')) note('language switch failed ' + d);
  await page.click(`[data-act="lang"][data-lang="${cfg.lang}"]`); await check('profile after lang');
  await page.click('[data-act="reset-demo"]'); await check('after reset'); await go('#/pipeline', 'pipeline after reset'); if ((await text()).includes('Walk Test Idea')) note('reset did not clear');
  await signOut(); await check('welcome after sign out');
  for (const r of ['waste_owner', 'partner', 'investor', 'team']) { await signIn(r); await signOut(); }
  await br.close();
}
/* registration against a fake accounts backend: code is emailed, checked, profile and progress are saved */
async function cloudRun(){
  const tag = 'cloud'; const note = (m) => problems.push(`[${tag}] ${m}`); const calls = [];
  const br = await chromium.launch();
  const ctx = await br.newContext({viewport: {width: 375, height: 812}, serviceWorkers: 'block'});
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'standalone', {get: () => true}); });
  await ctx.route('**/js/config.js', r => r.fulfill({contentType: 'application/javascript', body: 'window.ICON_CONFIG = {supabaseUrl: "https://fake-project.supabase.co", supabaseKey: "fake-anon-key-0123456789abcdef"};'}));
  await ctx.route('https://fake-project.supabase.co/**', async (r) => {
    const u = new URL(r.request().url()), body = r.request().postData() || ''; calls.push(r.request().method() + ' ' + u.pathname);
    const json = (o, status = 200) => r.fulfill({status, contentType: 'application/json', body: JSON.stringify(o)});
    if (u.pathname === '/auth/v1/otp') return json({});
    if (u.pathname === '/auth/v1/verify') return JSON.parse(body).token === '123456' ? json({access_token: 'acc', refresh_token: 'ref', expires_in: 3600, user: {id: 'user-1', email: 'visitor@example.com'}}) : json({msg: 'Token has expired or is invalid'}, 403);
    if (u.pathname === '/rest/v1/progress' && r.request().method() === 'GET') return json([]);
    if (u.pathname === '/rest/v1/rpc/signup_counts') return json([{role: 'founder', city: 'riyadh', n: 3}, {role: 'investor', city: 'jeddah', n: 1}]);
    return json(null, 201);
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => note('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/403/.test(m.text())) note('console: ' + m.text()); });
  await page.goto(base + '#/welcome'); await page.waitForSelector('.welcome');
  await page.click('a[href="#/signin/team"]'); await page.waitForSelector('form[data-form=signin]');
  await page.fill('#f-name', 'Cloud Visitor'); await page.fill('#f-email', 'visitor@example.com'); await page.selectOption('#f-city', 'riyadh');
  await page.click('form[data-form=signin] button[type=submit]'); await page.waitForSelector('form[data-form=code]');
  await page.screenshot({path: `${shots}/cloud-code.png`});
  await page.fill('#f-code', '000000'); await page.click('form[data-form=code] button[type=submit]'); await page.waitForSelector('#formerr:not([hidden])');
  await page.fill('#f-code', '123456'); await page.click('form[data-form=code] button[type=submit]'); await page.waitForSelector('.tabbar a');
  await page.evaluate(() => { location.hash = '#/demand'; }); await page.waitForTimeout(600);
  if (!(await page.locator('main').innerText()).includes('4')) note('remote counts not shown');
  await page.screenshot({path: `${shots}/cloud-demand.png`, fullPage: true});
  await page.evaluate(() => { location.hash = '#/updates'; }); await page.waitForSelector('#f-title');
  await page.fill('#f-title', 'Cloud update'); await page.fill('#f-body', 'Body'); await page.click('form[data-form="post-update"] button[type=submit]'); await page.waitForTimeout(1800);
  for (const need of ['POST /auth/v1/otp', 'POST /auth/v1/verify', 'POST /rest/v1/profiles', 'GET /rest/v1/progress', 'POST /rest/v1/progress', 'POST /rest/v1/rpc/signup_counts']) if (!calls.includes(need)) note('backend call missing: ' + need);
  await br.close();
}
(async () => {
  const phone = {w: 375, h: 812};
  const list = quick ? [{lang: 'ar', scheme: 'light', standalone: false, ...phone}] : [
    {lang: 'ar', scheme: 'light', standalone: false, ...phone}, {lang: 'ar', scheme: 'dark', standalone: true, ...phone},
    {lang: 'en', scheme: 'light', standalone: true, ...phone}, {lang: 'en', scheme: 'dark', standalone: false, ...phone},
    {lang: 'ar', scheme: 'dark', standalone: false, ...phone}, {lang: 'en', scheme: 'light', standalone: false, ...phone},
    {lang: 'ar', scheme: 'light', standalone: false, w: 1280, h: 800}, {lang: 'en', scheme: 'dark', standalone: false, w: 1280, h: 800}];
  if (!quick) { try { await cloudRun(); } catch (e) { problems.push('[cloud] CRASH ' + e.message.split('\n')[0]); } }
  for (const cfg of list) { try { await run(cfg); } catch (e) { problems.push(`[${cfg.lang}-${cfg.scheme}-${cfg.w}] CRASH ${e.message.split('\n')[0]}`); } }
  const uniq = [...new Set(problems)];
  console.log(uniq.length ? uniq.slice(0, 80).join('\n') + `\n${uniq.length} problems` : 'WALK OK, 0 problems');
  process.exit(uniq.length ? 1 : 0);
})();
