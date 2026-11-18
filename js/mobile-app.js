/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Mobile app shell
   Sign-in, the role check, tabs, a page stack with "back",
   bottom sheets and confirm boxes. The teacher and parent apps
   (mobile-teacher.js, mobile-parent.js) register their pages here.
   The role comes from the account: a teacher login can only open
   the teacher app, a family login only the parent app.
   ============================================================ */
'use strict';
window.MApp = (function () {
const { $, $$, esc, toast } = window.App;
const S = window.SchoolDB;
const P = window.Portal;
const { ico } = P;

const apps = {};
let app = null;          // the registered module for the signed-in role
let session = null;
let stack = [];          // [{ page, params }]
let tab = null;

/* ---------- small helpers for the role apps ---------- */
const fieldBad = (sel, bad, msg) => {
  const f = $(sel) && $(sel).closest('.m-field');
  if (f) { f.classList.toggle('bad', !!bad); if (msg && bad) $('.err', f).textContent = msg; }
  return !bad;
};
const empty = (icon, title, text) => `<div class="m-empty">${ico(icon, 32)}<b>${esc(title)}</b>${text ? esc(text) : ''}</div>`;
const ring = (pct, label) => {
  const r = 32, c = 2 * Math.PI * r, v = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  return `<div class="m-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="bg" cx="40" cy="40" r="${r}"/><circle class="fg${v < 85 ? ' warn' : ''}" cx="40" cy="40" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c - c * v / 100}"/></svg>
    <div><b>${pct == null ? '—' : P.pct(pct)}</b><span>${esc(label)}</span></div></div>`;
};
const chips = (id, items, cur) => `<div class="m-chips" id="${id}" role="tablist">${items.map(([k, l, n]) => `<button type="button" class="m-chip${k === cur ? ' on' : ''}" data-k="${esc(k)}" role="tab" aria-selected="${k === cur}">${esc(l)}${n ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</div>`;

/* ---------- status bar clock ---------- */
function tick() {
  const d = new Date(), h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  const c = $('#mClock'); if (c) c.textContent = `${((h + 11) % 12) + 1}:${m}`;
}

/* ============================================================
   SIGN-IN
   ============================================================ */
function renderLogin(prefill) {
  app = null; session = null; stack = [];
  document.body.classList.remove('m-teacher', 'm-parent');
  $('#mStatus').classList.add('on-dark');
  $('#mApp').innerHTML = `<div class="m-login">
    <div class="brand-top"><img src="../assets/logo.png" alt="" /><h2>Christina School</h2><p>Nursery &amp; Primary · Attur, Salem</p></div>
    <form class="card" id="mLogin" novalidate>
      <h3>Welcome</h3><p class="sub">Teachers use the login from the school office. Parents use the family login given when the child joined.</p>
      <div class="m-field"><label for="ml-user">Login name or mobile number</label><input id="ml-user" autocomplete="username" autocapitalize="none" value="${esc(prefill ? prefill[0] : '')}" /><span class="err">Enter your login name.</span></div>
      <div class="m-field"><label for="ml-pass">Password</label><div class="m-pw"><input id="ml-pass" type="password" autocomplete="current-password" value="${esc(prefill ? prefill[1] : '')}" /><button type="button" id="ml-eye" aria-label="Show password">${ico('ic-eye')}</button></div><span class="err">Enter your password.</span></div>
      <label class="check"><input type="checkbox" id="ml-remember" checked /> Keep me signed in on this phone</label>
      <button class="m-btn" type="submit">Sign in ${ico('ic-arrow-r')}</button>
      <div class="roles"><span>${ico('ic-clipboard', 16)} Teachers</span><span>${ico('ic-heart', 16)} Parents</span></div>
      <div class="demo-chips"><button type="button" data-demo="priya.t|teacher123">Demo teacher</button><button type="button" data-demo="9876543210|parent123">Demo parent</button></div>
    </form>
    <p style="text-align:center;font-size:.76rem;color:var(--ink-50);margin-top:16px">Forgot your password? Call the office on 0427 225 4053.</p>
  </div>`;
  $('#ml-eye').addEventListener('click', () => { const i = $('#ml-pass'); i.type = i.type === 'password' ? 'text' : 'password'; });
  $('#mLogin').addEventListener('submit', e => {
    e.preventDefault();
    const u = $('#ml-user').value.trim(), p = $('#ml-pass').value;
    if (![fieldBad('#ml-user', !u), fieldBad('#ml-pass', !p)].every(Boolean)) return;
    if (['admin', 'admin@christinaschool.in'].includes(u.toLowerCase())) {
      fieldBad('#ml-user', true, 'The office uses the web dashboard, not the app.');
      return;
    }
    const res = S.login(u, p);
    if (!res.ok) {
      fieldBad('#ml-pass', true, res.reason === 'off' ? 'This login is switched off. Please contact the office.' : 'Wrong login name or password.');
      return;
    }
    S.setSession(res.user, $('#ml-remember').checked);
    start();
  });
}

/** First sign-in with a password from the office: choose a new one before the app opens. */
function renderNewPassword(u) {
  $('#mApp').innerHTML = `<div class="m-login"><div class="brand-top"><img src="../assets/logo.png" alt="" /><h2>One more step</h2><p>Choose your own password</p></div>
    <form class="card" id="mNewPw" novalidate><p class="sub">You signed in with a password from the school office. Choose a new one that only you know.</p>
      <div class="m-field"><label for="np1">New password</label><input id="np1" type="password" autocomplete="new-password" /><span class="err">Use at least 8 characters, different from your login name.</span></div>
      <div class="m-field"><label for="np2">Type it again</label><input id="np2" type="password" autocomplete="new-password" /><span class="err">The two passwords do not match.</span></div>
      <button class="m-btn" type="submit">Save and continue</button>
      <button class="m-btn ghost" type="button" id="npOut" style="margin-top:8px">Sign out</button></form></div>`;
  $('#npOut').addEventListener('click', signOut);
  $('#mNewPw').addEventListener('submit', e => {
    e.preventDefault();
    const a = $('#np1').value, b = $('#np2').value;
    if (![fieldBad('#np1', a.length < 8 || a.toLowerCase() === u.loginId.toLowerCase() || a === u.password), fieldBad('#np2', a !== b)].every(Boolean)) return;
    u.password = a; u.mustChange = false; S.save();
    toast('Password saved|Use it next time you sign in.');
    start();
  });
}

function signOut() {
  S.clearSession();
  closeSheet();
  renderLogin();
}

/* ============================================================
   APP
   ============================================================ */
function start() {
  const s = S.getSession();
  const u = s && S.db.users.find(x => x.id === s.userId);
  if (!s || !u || !u.active || !apps[s.role]) { if (s) S.clearSession(); renderLogin(); return; }
  if (u.mustChange) { renderNewPassword(u); return; }
  session = Object.assign({}, s, { user: u });
  app = apps[s.role];                       // role-based: only this role's pages exist from here on
  document.body.classList.remove('m-teacher', 'm-parent');
  document.body.classList.add(app.cls);
  $('#mApp').innerHTML = `<header class="m-head" id="mHead"></header><main class="m-main" id="mMain"></main><div id="mFloat"></div><nav class="m-tabs" id="mTabs" aria-label="Main sections"></nav>`;
  $('#mTabs').innerHTML = app.tabs.map(t => `<button type="button" data-tab="${t.key}">${ico(t.icon, 22)}<span>${esc(t.label)}</span><span class="badge" data-badge="${t.key}" hidden></span></button>`).join('');
  $('#mMain').addEventListener('scroll', e => { $('#mHead').classList.toggle('scrolled', e.target.scrollTop > 4); }, { passive: true });
  if (app.init) app.init(session);
  goTab(app.tabs[0].key);
}

function goTab(key) {
  tab = key;
  stack = [{ page: key, params: {} }];
  render();
}
function go(page, params) {
  if (!app.pages[page]) return;
  stack.push({ page, params: params || {} });
  render();
}
function back() {
  if (stack.length > 1) { stack.pop(); render(); }
}
function render() {
  if (!app) return;
  const cur = stack[stack.length - 1];
  const pg = app.pages[cur.page];
  const dark = !!pg.dark && stack.length === 1;
  const title = typeof pg.title === 'function' ? pg.title(cur.params) : pg.title;
  const sub = typeof pg.sub === 'function' ? pg.sub(cur.params) : (pg.sub || '');
  const head = $('#mHead');
  head.className = 'm-head' + (dark ? ' dark' : '');
  $('#mStatus').classList.toggle('on-dark', dark);
  head.innerHTML = (stack.length > 1 ? `<button class="m-icon" type="button" id="mBack" aria-label="Back">${ico('ic-chev-l')}</button>` : '')
    + `<h1>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</h1>`
    + (stack.length === 1 && app.headRight ? app.headRight(cur.page) : '');
  const main = $('#mMain');
  main.scrollTop = 0;
  main.innerHTML = '<div class="m-page" id="mPage"></div>';
  $('#mFloat').innerHTML = '';
  $$('#mTabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === (pg.tab || tab)));
  try { pg.render($('#mPage'), cur.params); }
  catch (err) { console.error(err); $('#mPage').innerHTML = empty('ic-bell', 'Something went wrong', 'Please go back and try again.'); }
  if (pg.fab) {
    $('#mFloat').innerHTML = `<button class="m-fab" type="button" id="mFab" aria-label="${esc(pg.fab.label)}">${ico(pg.fab.icon || 'ic-plus', 26)}</button>`;
    $('#mFab').addEventListener('click', () => pg.fab.onClick(cur.params));
  }
  badges();
}
/** A fixed bar above the tabs (save buttons). */
function dock(html) {
  $('#mFloat').innerHTML = `<div class="m-dock">${html}</div>`;
  return $('#mFloat .m-dock');
}
function badges() {
  if (!app || !app.badges) return;
  const b = app.badges();
  $$('[data-badge]').forEach(el => { const n = b[el.dataset.badge]; el.hidden = !n; el.textContent = n || ''; });
}

/* ---------- bottom sheet and confirm ---------- */
function sheet(html) {
  $('#mSheetBody').innerHTML = html;
  $('#mSheet').classList.add('open');
  const f = $('#mSheetBody input:not([type=checkbox]):not([type=hidden]), #mSheetBody select, #mSheetBody textarea');
  if (f && window.matchMedia('(pointer:fine)').matches) setTimeout(() => f.focus(), 120);
}
function closeSheet() { $('#mSheet').classList.remove('open'); $('#mSheetBody').innerHTML = ''; }
const sheetOpen = () => $('#mSheet').classList.contains('open');
function confirm(o) {
  return new Promise(resolve => {
    sheet(`<h3>${esc(o.title)}</h3><p class="sub">${esc(o.text || '')}</p>
      <div class="m-btn-row"><button class="m-btn soft" type="button" id="cfNo">Cancel</button><button class="m-btn${o.danger ? ' danger' : ''}" type="button" id="cfOk">${esc(o.ok || 'OK')}</button></div>`);
    $('#cfOk').addEventListener('click', () => { closeSheet(); resolve(true); });
    $('#cfNo').addEventListener('click', () => { closeSheet(); resolve(false); });
  });
}

/* ---------- global events ---------- */
function bind() {
  document.addEventListener('click', e => {
    if (e.target.closest('#mBack')) { back(); return; }
    const t = e.target.closest('#mTabs [data-tab]');
    if (t) { goTab(t.dataset.tab); return; }
    if (e.target.closest('[data-sheet-close]')) { closeSheet(); return; }
    const g = e.target.closest('[data-go]');
    if (g && app) { const [page, arg] = g.dataset.go.split('|'); go(page, arg ? { id: arg } : {}); return; }
    const gt = e.target.closest('[data-gotab]');
    if (gt && app) { goTab(gt.dataset.gotab); return; }
    if (e.target.closest('[data-signout]')) { signOut(); return; }
    const d = e.target.closest('[data-demo]');
    if (d) { const [u, p] = d.dataset.demo.split('|'); S.clearSession(); closeSheet(); renderLogin([u, p]); return; }
    const tt = e.target.closest('[data-toast]');
    if (tt) { const p = tt.dataset.toast.split('|'); toast(p[0] + (p[1] ? '|' + p[1] : ''), 'info'); }
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (sheetOpen()) closeSheet(); else back(); }
  });
  // Another tab or window changed the data (e.g. the office): redraw unless the person is filling in a sheet.
  S.onChange(() => { if (app && !sheetOpen() && !app.busy) render(); });
}

function boot() {
  bind();
  tick(); setInterval(tick, 30000);
  start();
}

return {
  boot, define: (role, mod) => { apps[role] = mod; },
  go, back, goTab, render, dock, badges, sheet, closeSheet, confirm, signOut,
  get session() { return session; },
  fieldBad, empty, ring, chips
};
})();
