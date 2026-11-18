/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Portal shell (shared)
   Used by the teacher portal and the parent portal: role guard,
   sidebar and bottom bar, titles, modal, confirm box, and render
   helpers (status chips, month calendar, timetable grid) that the
   admin "School" screens use too.
   ============================================================ */
'use strict';
window.Portal = (function () {
const { $, $$, esc, toast, avatar } = window.App;
const S = window.SchoolDB;

let cfg = null;
let router = null;
let session = null;

/* ---------- modal ---------- */
let lastFocus = null;
function openModal(html, size) {
  lastFocus = document.activeElement;
  $('#modalContent').innerHTML = html;
  $('#modalBox').className = 'box' + (size ? ' ' + size : '');
  $('#modal').classList.add('open');
  document.body.classList.add('locked');
  const f = $('#modalContent input:not([type=hidden]), #modalContent select, #modalContent textarea, #modalContent button');
  setTimeout(() => (f || $('#modal .x')).focus(), 60);
}
function closeModal() {
  $('#modal').classList.remove('open');
  document.body.classList.remove('locked');
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
const modalOpen = () => $('#modal') && $('#modal').classList.contains('open');

/** A yes/no box. Resolves true when the main button is pressed. */
function confirmBox(o) {
  return new Promise(resolve => {
    openModal(`
      <div class="mhead"><h3 id="modalTitle">${esc(o.title)}</h3></div>
      <div class="mbody">
        <p style="color:var(--ink-70);margin:0 0 1.2rem">${o.html || esc(o.text || '')}</p>
        <div class="btn-row">
          <button class="btn ${o.danger ? 'btn-navy' : 'btn-primary'}" type="button" id="cbOk" ${o.danger ? 'style="background:var(--bad)"' : ''}>${esc(o.ok || 'Confirm')}</button>
          <button class="btn btn-soft" type="button" id="cbNo">Cancel</button>
        </div>
      </div>`, 'narrow');
    $('#cbOk').addEventListener('click', () => { closeModal(); resolve(true); });
    $('#cbNo').addEventListener('click', () => { closeModal(); resolve(false); });
  });
}

/* ---------- small render helpers ---------- */
const av = (name, seed) => avatar(name || '?', seed);
const ico = (id, size) => `<svg class="i i-${size || 18}"><use href="#${id}"/></svg>`;
function chip(code) {
  if (!code) return '<span class="att-chip" title="Not marked">—</span>';
  const s = S.STATUS[code];
  return `<span class="att-chip ${s.cls}" title="${s.label}">${s.short}</span>`;
}
function statusPill(kind, text) { return `<span class="pillx ${kind || ''}">${esc(text)}</span>`; }
function leavePill(status) {
  const map = { sent: 'warn', ack: 'ok', cancelled: 'grey', pending: 'warn', approved: 'ok', rejected: 'off' };
  const label = S.STUDENT_LEAVE_STATES[status] || S.STAFF_LEAVE_STATES[status] || status;
  return statusPill(map[status] || '', label);
}
const remarkIcon = type => ({ appreciation: ['ic-star', 'ok'], concern: ['ic-bell', 'warn'], general: ['ic-doc', ''] }[type] || ['ic-doc', '']);
const daysBetween = (a, b) => { let n = 0, d = a; while (d <= b && n < 400) { if (S.isSchoolDay(d)) n++; d = S.addDays(d, 1); } return n; };
const dateRange = (a, b) => a === b ? S.fmtShort(a) : `${S.fmtShort(a)} – ${S.fmtShort(b)}`;
const pct = v => v == null ? '—' : (Math.round(v * 10) / 10) + '%';
function emptyState(icon, title, text) {
  return `<div class="empty">${ico(icon, 32)}<b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ''}</div>`;
}
function timeAgo(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'am' : 'pm'}`;
}
function fieldBad(sel, bad) {
  const f = $(sel) && $(sel).closest('.field');
  if (f) f.classList.toggle('bad', !!bad);
  return !bad;
}

/** Month calendar for one child. Week starts on Monday. */
function calendarHTML(studentId, y, m) {
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const today = S.todayISO();
  let html = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="wd">${d}</div>`).join('');
  for (let i = 0; i < lead; i++) html += '<div class="d blank"></div>';
  for (let day = 1; day <= dim; day++) {
    const d = S.iso(new Date(y, m, day));
    const hol = S.holidayOn(d);
    const code = S.statusOf(studentId, d);
    let cls = '', small = '', title = '';
    if (code) { const st = S.STATUS[code]; cls = st.cls; small = st.short; title = st.label; }
    else if (hol) { cls = 'hol'; small = 'Hol'; title = hol.name; }
    else if (S.isWeeklyOff(d)) { cls = 'off'; title = 'Weekly holiday'; }
    else if (d > today) { cls = 'future'; title = 'Upcoming'; }
    else if (!S.isSchoolDay(d)) { cls = 'off'; title = 'No school'; }
    else { title = 'Attendance not taken'; small = '—'; }
    if (d === today) cls += ' today';
    html += `<div class="d ${cls}" title="${esc(S.fmtDate(d) + ' · ' + title)}">${day}${small ? `<small>${small}</small>` : ''}</div>`;
  }
  return `<div class="cal" role="grid" aria-label="${S.MONTHS[m]} ${y} attendance">${html}</div>`;
}
const legendHTML = () => `<div class="legend">
  <span><i class="p"></i>Present</span><span><i class="l"></i>Late</span><span><i class="h"></i>Half day</span>
  <span><i class="a"></i>Absent</span><span><i class="v"></i>On leave</span><span><i class="hol"></i>Holiday</span><span><i class="off"></i>No school</span></div>`;

/** Weekly timetable grid. opts: { sectionId } or { teacherId }, plus editable (adds data-slot). */
function timetableHTML(opts) {
  const o = opts || {};
  const todayDow = S.dayOfWeek(S.todayISO());
  const days = [1, 2, 3, 4, 5, 6];
  let html = '<div class="th"></div>' + days.map(d => `<div class="th ${d === todayDow ? 'today' : ''}">${S.DAYS[d].slice(0, 3)}</div>`).join('');
  S.allPeriods().forEach(p => {
    html += `<div class="tm"><b>${esc(p.isBreak ? p.label : 'P' + p.no)}</b>${p.start}–${p.end}</div>`;
    if (p.isBreak) { html += `<div class="brk">${esc(p.label)}</div>`; return; }
    days.forEach(day => {
      const todayCls = day === todayDow ? ' today' : '';
      if (o.teacherId) {
        const slot = S.teacherSlot(o.teacherId, day, p.id);
        html += slot
          ? `<div class="cell mine${todayCls}"><b>${esc(S.sectionLabel(slot.sectionId))}</b><span>${esc(S.subjectName(slot.subjectId))}</span></div>`
          : `<div class="cell free${todayCls}"><span>Free</span></div>`;
      } else {
        const t = S.ttEntry(o.sectionId, day, p.id);
        const cs = t && t.csId ? S.classSubject(t.csId) : null;
        let clash = '';
        if (cs && o.editable && S.teacherBusy(cs.teacherId, day, p.id, o.sectionId)) clash = ' clash';
        const attrs = o.editable ? ` edit" data-slot="${day}|${p.id}" tabindex="0" role="button` : '';
        html += cs
          ? `<div class="cell${todayCls}${clash}${attrs}"><b>${esc(S.subjectName(cs.subjectId))}</b><span>${esc(S.teacherName(cs.teacherId))}</span></div>`
          : `<div class="cell free${todayCls}${attrs}"><span>Library / games</span></div>`;
      }
    });
  });
  return `<div class="tt-scroll"><div class="tt">${html}</div></div>`;
}

function noticeList(items, limit) {
  const list = limit ? items.slice(0, limit) : items;
  if (!list.length) return emptyState('ic-bell', 'Nothing new', 'Notices from the school will appear here.');
  const CATS = window.App.CATS || {};
  return `<div class="lst">${list.map(n => {
    const c = CATS[n.category] || CATS.General || { c: '#1D4ED8', bg: '#E7F1FF' };
    return `<div class="li"><span class="lic" style="background:${c.bg};color:${c.c}">${ico(n.pinned ? 'ic-pin' : 'ic-mega')}</span>
      <div class="lb"><b>${esc(n.title)}</b><p>${esc(n.body)}</p>
      <span class="meta">${esc(S.fmtDate(n.date))} · ${esc(n.category)} · ${esc(S.audienceLabel(n))}</span></div></div>`;
  }).join('')}</div>`;
}
function documentList(items) {
  if (!items.length) return emptyState('ic-doc', 'No documents', 'Circulars and syllabus files will appear here.');
  return `<div class="lst">${items.map(d => `<div class="li"><span class="lic mari">${ico('ic-doc')}</span>
    <div class="lb"><b>${esc(d.title)}</b><span class="meta">${esc(d.file)} · ${esc(d.size)} · ${esc(S.fmtDate(d.date))} · ${esc(S.audienceLabel(d))}</span></div>
    <div class="lr"><button class="btn btn-soft btn-sm" type="button" data-toast="Download starts in the live portal|${esc(d.file)}">${ico('ic-arrow-u', 16)} Download</button></div></div>`).join('')}</div>`;
}

/** Account screen used by both portals: details list, change password, reset demo data. */
function accountPage(rows) {
  $('#acDetails').innerHTML = `<div class="prof-grid">${rows.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v || '—')}</b></div>`).join('')}</div>`;
  $('#pwForm').addEventListener('submit', e => {
    e.preventDefault();
    const u = S.db.users.find(x => x.id === session.userId);
    const cur = $('#pw-cur').value, n1 = $('#pw-new').value, n2 = $('#pw-new2').value;
    const ok = [
      fieldBad('#pw-cur', cur !== u.password),
      fieldBad('#pw-new', n1.length < 8 || n1.toLowerCase() === u.loginId.toLowerCase()),
      fieldBad('#pw-new2', n1 !== n2)
    ].every(Boolean);
    if (!ok) return;
    u.password = n1; u.mustChange = false;
    S.save();
    e.target.reset();
    toast('Password changed|Use the new password next time you sign in.');
  });
  $('#resetDemo').addEventListener('click', async () => {
    const yes = await confirmBox({ title: 'Reset the demo data?', text: 'All changes made in the teacher, parent and admin screens are replaced by the sample data. You stay signed in.', ok: 'Reset', danger: true });
    if (!yes) return;
    S.reset();
    toast('Demo data reset|The sample data is back.');
    setTimeout(() => window.location.reload(), 500);
  });
}

/* ============================================================
   SHELL
   ============================================================ */
/**
 * config: {
 *   role: 'teacher' | 'parent',
 *   routes: { key: { page, title, sub, onLoad, label, icon, group, bar } },
 *   order: [route keys in sidebar order],
 *   who: () => ({ name, sub }),
 *   counts: () => ({ key: { n, hot } }),
 *   topExtra: () => html placed before the "who" pill (child switcher),
 *   onTopClick: (event) => void
 * }
 */
function init(config) {
  session = S.guard(config.role);
  if (!session) return null;
  cfg = config;

  // sidebar
  let group = null;
  $('#pnav').innerHTML = cfg.order.map(k => {
    const r = cfg.routes[k];
    const head = r.group && r.group !== group ? `<div class="nav-group">${esc(r.group)}</div>` : '';
    group = r.group || group;
    return head + `<button type="button" data-view="${k}">${ico(r.icon)} ${esc(r.label)} <span class="cnt" data-cnt="${k}" hidden></span></button>`;
  }).join('');

  // bottom bar (phones): routes marked bar:true, then "More" which opens the sidebar
  const barKeys = cfg.order.filter(k => cfg.routes[k].bar);
  $('#pbar').innerHTML = barKeys.map(k => `<button type="button" data-view="${k}">${ico(cfg.routes[k].icon, 20)}<span>${esc(cfg.routes[k].short || cfg.routes[k].label)}</span><i class="dot" data-dot="${k}" hidden></i></button>`).join('')
    + `<button type="button" id="pbarMore">${ico('ic-grid', 20)}<span>More</span></button>`;

  renderTop();

  const routes = {};
  Object.keys(cfg.routes).forEach(k => { routes[k] = { page: cfg.routes[k].page, onLoad: cfg.routes[k].onLoad }; });
  routes.home = routes.home || routes[cfg.order[0]];

  router = window.Router.init({
    container: '#portal-app',
    routes,
    onRouteChange(hash) {
      const key = cfg.routes[hash] ? hash : 'home';
      const r = cfg.routes[key];
      $('#aTitle').textContent = typeof r.title === 'function' ? r.title() : r.title;
      $('#aSub').innerHTML = typeof r.sub === 'function' ? r.sub() : esc(r.sub || '');
      document.title = `${typeof r.title === 'function' ? r.title() : r.title} · ${cfg.role === 'teacher' ? 'Teacher' : 'Parent'} portal · Christina School`;
      $$('#pnav button, #pbar button[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === key));
      $('#aside').classList.remove('show');
      const v = $('#portal-app .aview'); if (v) v.classList.add('on');
      refreshCounts();
    }
  });

  bindGlobal();
  if (session.user.mustChange) setTimeout(forcePassword, 350);
  S.onChange(() => {
    // Another tab (for example the teacher portal) changed the data: redraw unless the user is typing in a pop-up.
    if (modalOpen()) return;
    renderTop();
    window.Router.reload();
  });
  return session;
}

/** First sign-in with a temporary password from the office: the person must choose their own before going on. */
function forcePassword() {
  const u = S.db.users.find(x => x.id === session.userId);
  if (!u || !u.mustChange) return;
  openModal(`
    <div class="mhead"><h3 id="modalTitle">Choose your own password</h3>
      <p class="small muted" style="margin-top:.35rem">You signed in with a temporary password from the school office. Choose a new one to continue.</p></div>
    <div class="mbody"><form id="fpForm" class="fgrid" novalidate style="margin-top:0">
      <div class="field full"><label for="fp-new">New password</label><input type="password" id="fp-new" autocomplete="new-password" /><span class="err">Use at least 8 characters, different from your login name.</span></div>
      <div class="field full"><label for="fp-new2">Type it again</label><input type="password" id="fp-new2" autocomplete="new-password" /><span class="err">The two passwords do not match.</span></div>
      <div class="field full"><button class="btn btn-primary" type="submit">Save and continue</button></div>
    </form></div>`, 'narrow');
  // No way round it: hide the close button and stop the backdrop from closing the pop-up.
  const x = $('#modal .x'), veil = $('#modal .veil');
  x.hidden = true; veil.removeAttribute('data-close-modal');
  $('#fpForm').addEventListener('submit', e => {
    e.preventDefault();
    const n1 = $('#fp-new').value, n2 = $('#fp-new2').value;
    const ok = [fieldBad('#fp-new', n1.length < 8 || n1.toLowerCase() === u.loginId.toLowerCase() || n1 === u.password), fieldBad('#fp-new2', n1 !== n2)].every(Boolean);
    if (!ok) return;
    u.password = n1; u.mustChange = false;
    S.save();
    x.hidden = false; veil.setAttribute('data-close-modal', '');
    closeModal();
    toast('Password saved|Use it next time you sign in.');
  });
}
window.addEventListener('keydown', e => {
  // Escape must not skip the forced password change.
  if (e.key === 'Escape' && $('#fpForm')) e.stopImmediatePropagation();
}, true);

function renderTop() {
  const w = cfg.who();
  $('#whoName').textContent = w.name;
  $('#whoSub').textContent = w.sub;
  $('#whoAv').textContent = S.initials(w.name);
  const extra = $('#topExtra');
  if (extra) extra.innerHTML = cfg.topExtra ? cfg.topExtra() : '';
}

function refreshCounts() {
  if (!cfg || !cfg.counts) return;
  const c = cfg.counts();
  $$('[data-cnt]').forEach(el => {
    const v = c[el.dataset.cnt];
    el.hidden = !v || !v.n;
    if (v) { el.textContent = v.n; el.classList.toggle('hot', !!v.hot); }
  });
  $$('[data-dot]').forEach(el => { const v = c[el.dataset.dot]; el.hidden = !(v && v.hot && v.n); });
}

function go(key) { window.Router.go(key); }
function reload() { window.Router.reload(); }

let bound = false;
function bindGlobal() {
  if (bound) return;
  bound = true;
  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-view]');
    if (nav && (nav.closest('#pnav') || nav.closest('#pbar'))) { go(nav.dataset.view); window.scrollTo({ top: 0 }); return; }
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); go(g.dataset.go); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest('#pbarMore') || e.target.closest('#aBurger')) { e.stopPropagation(); $('#aside').classList.toggle('show'); return; }
    if (e.target.closest('[data-close-modal]')) { closeModal(); return; }
    if (e.target.closest('#signOut')) { e.preventDefault(); S.clearSession(); window.location.href = 'index.html'; return; }
    const t = e.target.closest('[data-toast]');
    if (t) { const p = t.dataset.toast.split('|'); toast(p[0] + (p[1] ? '|' + p[1] : ''), 'info'); }
    const aside = $('#aside');
    if (aside && aside.classList.contains('show') && !aside.contains(e.target)) aside.classList.remove('show');
    if (cfg && cfg.onTopClick && e.target.closest('.atop')) cfg.onTopClick(e);
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalOpen()) closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-slot][role=button]')) { e.preventDefault(); e.target.click(); }
  });
}

return {
  init, go, reload, refreshCounts, renderTop,
  get session() { return session; },
  openModal, closeModal, modalOpen, confirmBox,
  av, ico, chip, statusPill, leavePill, remarkIcon, daysBetween, dateRange, pct, emptyState, timeAgo, fieldBad,
  calendarHTML, legendHTML, timetableHTML, noticeList, documentList, accountPage
};
})();
