/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Admin "School" screens
   Everything the teacher and parent portals depend on: students,
   families and their logins, classes and subjects, attendance
   overview, exams and results, timetable, teacher logins, staff
   leave, notices for parents and teachers, the school year and
   holidays, promotion, and the student import.
   Loaded on admin-dashboard.html before admin.js, which picks up
   the routes and titles from window.AdminSchool.
   ============================================================ */
'use strict';
window.AdminSchool = (function () {
const { $, $$, esc, toast } = window.App;
const S = window.SchoolDB;
const P = window.Portal;
const { av, ico, chip, leavePill, emptyState, dateRange, daysBetween, pct } = P;
const today = () => S.todayISO();
const PAGE = 'pages/admin-school.html';

/* ---------- small helpers ---------- */
const save = () => { S.save(); refreshCounts(); };
const opts = (list, val, label, value) => list.map(x => {
  const v = value ? value(x) : x.id;
  return `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(label(x))}</option>`;
}).join('');
const seg = (id, items, cur) => `<div class="seg" id="${id}" role="tablist">${items.map(([k, l]) => `<button type="button" data-k="${k}" class="${k === cur ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
const mini = (a, id, icon, label, del) => `<button class="mini${del ? ' del' : ''}" type="button" data-a="${a}" data-id="${esc(id)}" aria-label="${esc(label)}" title="${esc(label)}">${ico(icon, 16)}</button>`;
const tbl = (head, rows, empty, cls) => `<div class="tbl-wrap${cls ? ' ' + cls : ''}"${cls ? '' : ' style="margin-top:0"'}><div class="tbl-scroll"><table${cls ? ` class="${cls}"` : ''}><thead><tr>${head.map(h => `<th${h.endsWith(' ') ? ' style="text-align:right"' : ''}>${esc(h.trim())}</th>`).join('')}</tr></thead>
  <tbody>${rows.length ? rows.join('') : `<tr><td colspan="${head.length}">${emptyState('ic-search', empty || 'Nothing here yet', '')}</td></tr>`}</tbody></table></div></div>`;
const setTool = html => { $('#scTool').innerHTML = html; };
const setBody = html => { $('#scBody').innerHTML = html; };
const onBody = (fn) => { $('#scBody').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) fn(b.dataset.a, b.dataset.id, b, e); }); };
const onTool = (fn) => { $('#scTool').addEventListener('click', e => { const b = e.target.closest('[data-a], [data-k]'); if (b) fn(b.dataset.a || null, b.dataset.k || null, b, e); }); };
const yearSections = () => S.sectionsOfYear();
const tempPassword = () => 'Cs' + Math.floor(100000 + Math.random() * 899999);
const phoneOk = p => /^\d{10}$/.test(String(p || '').replace(/\D/g, '')) ;
const cleanPhone = p => String(p || '').replace(/\D/g, '');

/**
 * Form pop-up. fields: [{ k, l, t: text|select|date|number|textarea|tel, opts: [[value,label]], req, full, hint, min, max, err }]
 * onSave(values) returns true (close) or an object { key: 'message' } to show under fields.
 */
function form(o) {
  const r = o.rec || {};
  const field = f => {
    const id = 'sf-' + f.k;
    const v = r[f.k] != null ? r[f.k] : (f.def != null ? f.def : '');
    let input;
    if (f.t === 'select') input = `<select id="${id}">${f.opts.map(([ov, ol]) => `<option value="${esc(ov)}"${String(ov) === String(v) ? ' selected' : ''}>${esc(ol)}</option>`).join('')}</select>`;
    else if (f.t === 'textarea') input = `<textarea id="${id}" maxlength="${f.max || 500}">${esc(v)}</textarea>`;
    else input = `<input id="${id}" type="${f.t || 'text'}" value="${esc(v)}"${f.min != null ? ` min="${f.min}"` : ''}${f.t !== 'number' && f.max ? ` maxlength="${f.max}"` : f.max != null ? ` max="${f.max}"` : ''}${f.ph ? ` placeholder="${esc(f.ph)}"` : ''} />`;
    return `<div class="field${f.full ? ' full' : ''}" data-f="${f.k}"${f.hide ? ' hidden' : ''}><label for="${id}">${esc(f.l)}</label>${input}${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ''}<span class="err">${esc(f.err || 'This is needed.')}</span></div>`;
  };
  P.openModal(`
    <div class="mhead"><h3 id="modalTitle">${esc(o.title)}</h3>${o.sub ? `<div class="small muted" style="margin-top:.35rem">${o.sub}</div>` : ''}</div>
    <div class="mbody"><form id="sfForm" class="fgrid" novalidate style="margin-top:0">
      ${o.fields.map(field).join('')}
      ${o.extra || ''}
      <div class="field full btn-row"><button class="btn btn-primary" type="submit">${esc(o.submit || 'Save')}</button><button class="btn btn-soft" type="button" data-close-modal>Cancel</button></div>
    </form></div>`, o.wide ? 'wide' : '');
  if (o.after) o.after();
  $('#sfForm').addEventListener('submit', e => {
    e.preventDefault();
    const vals = {};
    o.fields.forEach(f => { const el = $('#sf-' + f.k); vals[f.k] = el ? el.value.trim() : ''; });
    $$('#sfForm .field').forEach(f => f.classList.remove('bad'));
    const missing = {};
    o.fields.forEach(f => { const el = $('#sf-' + f.k); if (f.req && el && !el.closest('[hidden]') && !vals[f.k]) missing[f.k] = f.err || 'This is needed.'; });
    const res = Object.keys(missing).length ? missing : o.onSave(vals);
    if (res === true) { P.closeModal(); return; }
    Object.entries(res || {}).forEach(([k, msg]) => {
      const f = $(`#sfForm [data-f="${k}"]`);
      if (f) { f.classList.add('bad'); $('.err', f).textContent = msg; }
    });
  });
}

/* ============================================================
   LOGIN NAME AND PASSWORD (typed by the office)
   ============================================================ */
const LOGIN_RX = /^[a-z0-9._]{4,30}$/i;
const loginTaken = (loginId, exceptUserId) => S.db.users.some(u => u.loginId.toLowerCase() === String(loginId).toLowerCase() && u.id !== exceptUserId);
const suggestLogin = name => {
  const parts = String(name || '').replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/i, '').toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  const base = parts.length ? parts[0] + '.' + (parts[1] ? parts[1][0] : 't') : 'teacher';
  let id = base, n = 1;
  while (loginTaken(id)) id = base + (++n);
  return id;
};
/** The login fields as HTML. prefix keeps ids unique; user = the existing login (if any). */
function loginFieldsHTML(prefix, suggested, user) {
  return `<div class="field" data-f="${prefix}-login"><label for="${prefix}-login">Login name</label>
      <input id="${prefix}-login" value="${esc(user ? user.loginId : suggested)}" maxlength="30" autocomplete="off" />
      <span class="hint">4–30 letters, numbers, dots or _</span><span class="err">Choose another login name.</span></div>
    <div class="field" data-f="${prefix}-pw"><label for="${prefix}-pw">${user ? 'New password (leave empty to keep)' : 'Password'}</label>
      <span class="pw-wrap"><input id="${prefix}-pw" type="password" autocomplete="new-password" maxlength="128" />
      <button type="button" data-pwshow="${prefix}-pw" aria-label="Show password">${ico('ic-eye')}</button></span>
      <span class="hint"><button type="button" class="forgot" data-pwgen="${prefix}">Suggest a password</button></span><span class="err">Use at least 8 characters, different from the login name.</span></div>
    <div class="field" data-f="${prefix}-pw2"><label for="${prefix}-pw2">Type the password again</label><input id="${prefix}-pw2" type="password" autocomplete="new-password" maxlength="128" /><span class="err">The two passwords do not match.</span></div>
    <div class="field"><label class="check" style="margin-top:1.9rem"><input type="checkbox" id="${prefix}-must" ${user && !user.mustChange ? '' : 'checked'} /> Ask for a new password at the first sign-in</label></div>`;
}
/** Shows/suggests passwords inside any form that has login fields. */
document.addEventListener('click', e => {
  const sh = e.target.closest('[data-pwshow]');
  if (sh) { const i = document.getElementById(sh.dataset.pwshow); if (i) i.type = i.type === 'password' ? 'text' : 'password'; }
  const g = e.target.closest('[data-pwgen]');
  if (g) {
    const p = g.dataset.pwgen, pw = tempPassword();
    ['-pw', '-pw2'].forEach(s => { const i = document.getElementById(p + s); if (i) { i.value = pw; i.type = 'text'; } });
  }
});
/** Checks the login fields. Returns { errors } or { loginId, password, mustChange }. */
function readLogin(prefix, user, required) {
  const loginId = ($('#' + prefix + '-login') || {}).value.trim();
  const pw = $('#' + prefix + '-pw').value, pw2 = $('#' + prefix + '-pw2').value;
  const errors = {};
  if (!LOGIN_RX.test(loginId)) errors[prefix + '-login'] = 'Use 4–30 letters, numbers, dots or _ (no spaces).';
  else if (loginTaken(loginId, user && user.id)) errors[prefix + '-login'] = 'Someone already has this login name.';
  if ((required || pw) && (pw.length < 8 || pw.toLowerCase() === loginId.toLowerCase())) errors[prefix + '-pw'] = 'Use at least 8 characters, different from the login name.';
  if (pw !== pw2) errors[prefix + '-pw2'] = 'The two passwords do not match.';
  return Object.keys(errors).length ? { errors } : { loginId, password: pw, mustChange: $('#' + prefix + '-must').checked };
}
function applyLogin(user, role, refId, vals) {
  let u = user;
  if (!u) { u = { id: S.newId('u'), role, refId }; S.db.users.push(u); }
  u.loginId = vals.loginId;
  if (vals.password) u.password = vals.password;
  u.mustChange = vals.mustChange;
  u.active = true;
  return u;
}
/** Pop-up to create or change a login (families and teachers screens). */
function loginBox(o) {
  form({
    title: o.title, sub: o.sub, wide: true, fields: [],
    extra: loginFieldsHTML('lg', o.suggested, o.user),
    submit: o.user ? 'Save login' : 'Create login',
    onSave() {
      const r = readLogin('lg', o.user, !o.user);
      if (r.errors) return r.errors;
      const u = applyLogin(o.user, o.role, o.refId, r);
      save(); o.done();
      toast(`${o.user ? 'Login saved' : 'Login created'}|${o.who} signs in with "${u.loginId}"${u.mustChange ? ' and must choose a new password the first time' : ''}.`);
      return true;
    }
  });
}

/* ============================================================
   STAFF EDITOR HOOK (website Staff page in admin.js)
   Choosing "Teacher" adds the login fields to the form, the way
   Angular's @if adds a block; "Other staff" removes them.
   ============================================================ */
const teacherOfStaff = rec => rec && rec.teacherId ? S.teacher(rec.teacherId) : null;
const staffHook = {
  html(rec, isNew) {
    const kind = isNew || teacherOfStaff(rec) ? 'teacher' : 'other';
    return `<div class="field full"><label for="st-kind">Staff type</label>
        <select id="st-kind"><option value="teacher"${kind === 'teacher' ? ' selected' : ''}>Teacher — signs in to the teacher portal</option><option value="other"${kind === 'other' ? ' selected' : ''}>Other staff — no portal login</option></select></div>
      <div id="st-portal" class="fgrid" style="grid-column:1/-1;margin:0"></div>`;
  },
  after(rec) {
    const t = teacherOfStaff(rec);
    const user = t && S.db.users.find(u => u.role === 'teacher' && u.refId === t.id);
    const draw = () => {
      const box = $('#st-portal');
      if ($('#st-kind').value !== 'teacher') { box.innerHTML = ''; return; }   // @if (teacher) { … }
      box.innerHTML = `<div class="field full"><div class="alert" style="margin:0">${ico('ic-key')}<div><b>Teacher portal login</b>${user ? `Current login: <b>${esc(user.loginId)}</b> · ${user.active ? 'active' : 'switched off'}` : 'Create the login now. Give the teacher the login name and password.'}</div></div></div>`
        + loginFieldsHTML('st', suggestLogin($('#f-staff-name').value || (rec && rec.name)), user);
    };
    $('#st-kind').addEventListener('change', draw);
    $('#f-staff-name').addEventListener('change', () => { const l = $('#st-login'); if (l && !user && !l.dataset.typed) l.value = suggestLogin($('#f-staff-name').value); });
    $('#entForm').addEventListener('input', e => { if (e.target.id === 'st-login') e.target.dataset.typed = '1'; });
    draw();
  },
  validate(rec) {
    $$('#st-portal .field').forEach(f => f.classList.remove('bad'));
    if ($('#st-kind').value !== 'teacher') return true;
    const t = teacherOfStaff(rec);
    const user = t && S.db.users.find(u => u.role === 'teacher' && u.refId === t.id);
    const r = readLogin('st', user, !user);
    if (!r.errors) { staffHook.pending = r; return true; }
    Object.entries(r.errors).forEach(([k, msg]) => { const f = $(`#st-portal [data-f="${k}"]`); if (f) { f.classList.add('bad'); $('.err', f).textContent = msg; } });
    return false;
  },
  save(out) {
    const asTeacher = $('#st-kind').value === 'teacher';
    let t = teacherOfStaff(out);
    if (!asTeacher) {
      if (t) S.db.users.filter(u => u.role === 'teacher' && u.refId === t.id).forEach(u => { u.active = false; });
      S.save();
      return t ? ' Their portal login is switched off.' : '';
    }
    if (!t) { t = { id: S.newId('t'), phone: '', email: '' }; S.db.teachers.push(t); }
    Object.assign(t, { name: out.name, designation: out.desig, department: out.dept, staffId: out.id });
    out.teacherId = t.id;
    const user = S.db.users.find(u => u.role === 'teacher' && u.refId === t.id);
    const u = applyLogin(user, 'teacher', t.id, staffHook.pending);
    S.save(); refreshCounts();
    return ` Teacher portal login: ${u.loginId}. Give them classes on Classes & subjects.`;
  }
};

/* ============================================================
   SIDEBAR COUNTS AND DASHBOARD
   ============================================================ */
function notMarkedToday() {
  const d = today();
  if (!S.isSchoolDay(d)) return [];
  return yearSections().filter(s => !S.attendanceDay(s.id, d));
}
function refreshCounts() {
  const set = (k, n, hot) => $$(`[data-scnt="${k}"]`).forEach(el => { el.textContent = n; el.hidden = !n; el.style.background = hot && n ? 'var(--mari)' : ''; });
  set('students', S.db.students.filter(s => s.status === 'active').length);
  set('families', S.db.families.length);
  set('attendance', notMarkedToday().length, true);
  set('staffleave', S.db.staffLeaves.filter(l => l.status === 'pending').length, true);
  set('classes', yearSections().length);
}
function overview() {
  const box = $('#schoolKpis');
  if (!box) return;
  const d = S.isSchoolDay(today()) ? today() : S.prevSchoolDay(today());
  let total = 0, present = 0;
  yearSections().forEach(s => { const sm = S.sectionDaySummary(s.id, d); if (sm) { total += sm.total; present += sm.present; } });
  const nm = notMarkedToday();
  const pend = S.db.staffLeaves.filter(l => l.status === 'pending').length;
  box.innerHTML = `
    <div class="kpi"><span class="ic">${ico('ic-users')}</span><b>${S.db.students.filter(s => s.status === 'active').length}</b><span>Students in ${esc(S.currentYear().name)}</span></div>
    <div class="kpi"><span class="ic ok">${ico('ic-check-circle')}</span><b>${total ? pct(Math.round(present / total * 1000) / 10) : '—'}</b><span>Present ${d === today() ? 'today' : 'on ' + esc(S.fmtShort(d))}</span></div>
    <div class="kpi" style="cursor:pointer" data-goview="s-attendance"><span class="ic warn">${ico('ic-clipboard')}</span><b>${nm.length}</b><span>Classes not marked yet</span>${nm.length ? `<small>${nm.slice(0, 3).map(s => esc(S.sectionLabel(s))).join(', ')}${nm.length > 3 ? '…' : ''}</small>` : ''}</div>
    <div class="kpi" style="cursor:pointer" data-goview="s-staffleave"><span class="ic mari">${ico('ic-leave')}</span><b>${pend}</b><span>Staff leave waiting</span></div>`;
  box.addEventListener('click', e => { const k = e.target.closest('[data-goview]'); if (k) window.Router.go(k.dataset.goview); });
  const away = S.leavesOn(today());
  const line = $('#schoolToday');
  if (line) line.innerHTML = away.length
    ? `<div class="alert" style="margin:-8px 0 22px">${ico('ic-leave')}<div><b>Teachers on leave today</b>${away.map(l => `${esc(S.teacherName(l.teacherId))} (cover: ${l.coverId ? esc(S.teacherName(l.coverId)) : '<b style="color:var(--bad)">nobody yet</b>'})`).join(' · ')}</div>
       <span class="push"><button class="btn btn-soft btn-sm" type="button" data-goview="s-staffleave">Staff leave</button></span></div>` : '';
  if (line) line.addEventListener('click', e => { const k = e.target.closest('[data-goview]'); if (k) window.Router.go(k.dataset.goview); });
  refreshCounts();
}

/* ============================================================
   STUDENTS
   ============================================================ */
const st = { q: '', sec: 'all', status: 'active' };
function initStudents() {
  setTool(`<label class="search" style="max-width:280px"><span class="sr-only">Search students</span>${ico('ic-search')}<input type="search" id="stQ" placeholder="Name or admission no." value="${esc(st.q)}" /></label>
    <select class="ctl" id="stSec" aria-label="Class"><option value="all">All classes</option>${opts(yearSections(), st.sec, S.sectionLabel)}</select>
    <select class="ctl" id="stStatus" aria-label="Status"><option value="active"${st.status === 'active' ? ' selected' : ''}>Studying</option><option value="left"${st.status === 'left' ? ' selected' : ''}>Left</option><option value="all"${st.status === 'all' ? ' selected' : ''}>All</option></select>
    <div class="push"><button class="btn btn-soft btn-sm" type="button" data-a="import">${ico('ic-upload', 16)} Import from a file</button><button class="btn btn-primary btn-sm" type="button" data-a="add">${ico('ic-plus', 16)} Add student</button></div>`);
  const render = () => {
    const q = st.q.toLowerCase();
    const list = S.db.students.filter(s => {
      const sec = S.sectionOfStudent(s.id);
      return (st.status === 'all' || s.status === st.status) && (st.sec === 'all' || (sec && sec.id === st.sec))
        && (!q || (s.firstName + ' ' + s.lastName + ' ' + s.admissionNo).toLowerCase().includes(q));
    }).sort((a, b) => {
      const sa = S.sectionOfStudent(a.id), sb = S.sectionOfStudent(b.id);
      const ga = sa ? S.grade(sa.gradeId).order * 10 + sa.name.charCodeAt(0) : 999, gb = sb ? S.grade(sb.gradeId).order * 10 + sb.name.charCodeAt(0) : 999;
      return ga - gb || (S.enrollmentOf(a.id) || {}).roll - (S.enrollmentOf(b.id) || {}).roll;
    });
    setBody(`<p class="muted small" style="margin:0 0 10px">${list.length} student${list.length === 1 ? '' : 's'}</p>` + tbl(['Student', 'Class · roll', 'Family', 'Date of birth', 'Status', 'Actions '], list.map(s => {
      const sec = S.sectionOfStudent(s.id), e = S.enrollmentOf(s.id), f = S.family(s.familyId);
      return `<tr><td data-col="Student"><div class="cellav"><span class="av">${av(S.studentName(s), s.id)}</span><span><b>${esc(S.studentName(s))}</b><span>${esc(s.admissionNo)}${s.medical ? ' · ⚕ ' + esc(s.medical) : ''}</span></span></div></td>
        <td data-col="Class · roll">${sec ? esc(S.sectionLabel(sec)) + ' · ' + e.roll : '<span class="muted">Not in a class</span>'}</td>
        <td data-col="Family">${f ? esc(f.fatherName) + '<br><span class="muted small">' + esc(f.primary === 'mother' ? f.motherPhone : f.fatherPhone) + '</span>' : '—'}</td>
        <td data-col="Date of birth">${esc(S.fmtDate(s.dob))}</td>
        <td data-col="Status">${s.status === 'active' ? '<span class="pillx ok">Studying</span>' : `<span class="pillx grey">Left ${esc(S.fmtShort(s.leftDate || ''))}</span>`}</td>
        <td data-col="Actions"><div class="rowacts">${mini('edit', s.id, 'ic-pencil', 'Edit')}${s.status === 'active' ? mini('left', s.id, 'ic-logout', 'Mark as left', true) : mini('back', s.id, 'ic-refresh', 'Back to studying')}</div></td></tr>`;
    }), 'No students match'));
  };
  $('#stQ').addEventListener('input', e => { st.q = e.target.value; render(); });
  $('#stSec').addEventListener('change', e => { st.sec = e.target.value; render(); });
  $('#stStatus').addEventListener('change', e => { st.status = e.target.value; render(); });
  onTool(a => { if (a === 'add') studentForm(null, render); if (a === 'import') window.Router.go('s-import'); });
  onBody(async (a, id) => {
    const s = S.student(id);
    if (a === 'edit') studentForm(s, render);
    if (a === 'left') {
      const yes = await P.confirmBox({ title: `Mark ${S.studentName(s)} as left?`, text: 'Their attendance and marks are kept. They disappear from the class lists and the family can no longer see this child if no other children are studying.', ok: 'Mark as left', danger: true });
      if (!yes) return;
      s.status = 'left'; s.leftDate = today();
      const fam = S.family(s.familyId);
      if (fam && !S.db.students.some(x => x.familyId === fam.id && x.status === 'active')) S.db.users.filter(u => u.refId === fam.id).forEach(u => { u.active = false; });
      save(); render(); toast(`${s.firstName} marked as left|The record and history are kept.`, 'info');
    }
    if (a === 'back') { s.status = 'active'; s.leftDate = null; save(); render(); toast(`${s.firstName} is back on the class list`); }
  });
  render();
}
function nextRoll(sectionId) { return S.db.enrollments.filter(e => e.sectionId === sectionId).reduce((m, e) => Math.max(m, e.roll), 0) + 1; }
function studentForm(s, done) {
  const e = s ? S.enrollmentOf(s.id) : null;
  const fams = S.db.families.slice().sort((a, b) => a.surname.localeCompare(b.surname));
  form({
    title: s ? 'Edit student' : 'Add a student', wide: true,
    sub: s ? '' : 'Choose the child\'s family, or “New family” to add the parents and their login here.',
    rec: s ? Object.assign({}, s, { sectionId: e ? e.sectionId : '', roll: e ? e.roll : '' }) : { gender: 'Boy', admissionDate: today(), sectionId: yearSections()[0].id },
    fields: [
      { k: 'firstName', l: 'First name', req: 1, max: 50 },
      { k: 'lastName', l: 'Last name', req: 1, max: 50 },
      { k: 'gender', l: 'Gender', t: 'select', opts: [['Boy', 'Boy'], ['Girl', 'Girl']] },
      { k: 'dob', l: 'Date of birth', t: 'date', req: 1, max: today() },
      { k: 'admissionNo', l: 'Admission number', req: 1, max: 20, def: 'CS' + new Date().getFullYear() + String(S.db.students.length + 101).padStart(3, '0') },
      { k: 'admissionDate', l: 'Joined on', t: 'date', req: 1 },
      { k: 'sectionId', l: `Class in ${S.currentYear().name}`, t: 'select', opts: yearSections().map(x => [x.id, S.sectionLabel(x)]) },
      { k: 'roll', l: 'Roll number', t: 'number', min: 1, hint: 'Leave empty to add at the end of the class list' },
      { k: 'bloodGroup', l: 'Blood group', t: 'select', opts: ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(x => [x, x || 'Not known']) },
      { k: 'medical', l: 'Medical notes (seen by the class teacher)', t: 'textarea', full: 1, max: 300 },
      { k: 'familyId', l: 'Family', t: 'select', full: 1, req: 1, err: 'Choose the family, or New family.', opts: [['', 'Choose the family…'], ['__new', '+ New family (add the parents and their login)']].concat(fams.map(f => [f.id, `${f.surname} — ${f.fatherName || f.motherName} · ${f.primary === 'mother' ? f.motherPhone : f.fatherPhone}`])) }
    ],
    extra: '<div id="famBlock" class="fgrid" style="grid-column:1/-1;margin:0"></div>',
    after: () => {
      // @if (family === new) { parent details + login } @else if (family has no login) { optional login } @else { current login }
      const draw = () => {
        const fid = $('#sf-familyId').value, box = $('#famBlock');
        const head = (t, sub) => `<div class="field full"><div class="alert" style="margin:0">${ico('ic-key')}<div><b>${t}</b>${sub}</div></div></div>`;
        if (fid === '__new') {
          box.innerHTML = head('Parents and their login', 'One login for the family; both parents share it. The mobile number of the parent the school contacts first is suggested as the login name.')
            + `<div class="field" data-f="nf-father"><label for="nf-father">Father's name</label><input id="nf-father" maxlength="100" /><span class="err">Enter at least one parent.</span></div>
               <div class="field" data-f="nf-fphone"><label for="nf-fphone">Father's mobile</label><input id="nf-fphone" type="tel" maxlength="15" /><span class="err">Enter a 10-digit mobile number.</span></div>
               <div class="field" data-f="nf-mother"><label for="nf-mother">Mother's name</label><input id="nf-mother" maxlength="100" /><span class="err"></span></div>
               <div class="field" data-f="nf-mphone"><label for="nf-mphone">Mother's mobile</label><input id="nf-mphone" type="tel" maxlength="15" /><span class="err">Enter a 10-digit mobile number.</span></div>
               <div class="field"><label for="nf-primary">The school contacts first</label><select id="nf-primary"><option value="father">Father</option><option value="mother">Mother</option></select></div>
               <div class="field"><label for="nf-email">E-mail (optional)</label><input id="nf-email" type="email" maxlength="255" /></div>`
            + loginFieldsHTML('pl', '', null);
          const sync = () => { const l = $('#pl-login'); if (l.dataset.typed) return; l.value = cleanPhone($('#nf-primary').value === 'mother' ? $('#nf-mphone').value : $('#nf-fphone').value); };
          ['#nf-fphone', '#nf-mphone', '#nf-primary'].forEach(x => { $(x).addEventListener('input', sync); $(x).addEventListener('change', sync); });
          $('#pl-login').addEventListener('input', e => { e.target.dataset.typed = '1'; });
          return;
        }
        const f = fid && S.family(fid);
        if (!f) { box.innerHTML = ''; return; }
        const u = loginOf(f.id);
        if (u) { box.innerHTML = head('Family login', `The ${esc(f.surname)} family already signs in as <b>${esc(u.loginId)}</b> (${u.active ? 'active' : 'switched off'}). This child appears in their portal straight away.`); return; }
        const phone = cleanPhone(f.primary === 'mother' ? f.motherPhone : f.fatherPhone);
        box.innerHTML = head('This family has no login yet', 'Create it now so the parents can see this child.')
          + `<div class="field full"><label class="check"><input type="checkbox" id="pl-make" checked /> Create the family login now</label></div><div id="plFields" class="fgrid" style="grid-column:1/-1;margin:0">${loginFieldsHTML('pl', phone && !loginTaken(phone) ? phone : suggestLogin(f.fatherName), null)}</div>`;
        $('#pl-make').addEventListener('change', e => { $('#plFields').hidden = !e.target.checked; });
      };
      $('#sf-familyId').addEventListener('change', draw);
      draw();
    },
    onSave(v) {
      const errs = {};
      if (S.db.students.some(x => x.admissionNo.toLowerCase() === v.admissionNo.toLowerCase() && (!s || x.id !== s.id))) errs.admissionNo = 'Another student already has this number.';
      if (v.roll && S.db.enrollments.some(x => x.sectionId === v.sectionId && x.roll === Number(v.roll) && (!s || x.studentId !== s.id))) errs.roll = 'This roll number is taken in that class.';
      // the family block
      const isNew = v.familyId === '__new';
      const makeLogin = isNew || ($('#pl-make') && $('#pl-make').checked);
      let login = null;
      if (isNew) {
        const fp = $('#nf-fphone').value.trim(), mp = $('#nf-mphone').value.trim();
        if (!$('#nf-father').value.trim() && !$('#nf-mother').value.trim()) errs['nf-father'] = 'Enter at least one parent.';
        if (fp && !phoneOk(fp)) errs['nf-fphone'] = 'Enter a 10-digit mobile number.';
        if (mp && !phoneOk(mp)) errs['nf-mphone'] = 'Enter a 10-digit mobile number.';
        if ($('#nf-primary').value === 'father' && !fp) errs['nf-fphone'] = 'The parent the school contacts first needs a mobile number.';
        if ($('#nf-primary').value === 'mother' && !mp) errs['nf-mphone'] = 'The parent the school contacts first needs a mobile number.';
      }
      if (makeLogin) { const r = readLogin('pl', null, true); if (r.errors) Object.assign(errs, r.errors); else login = r; }
      if (Object.keys(errs).length) return errs;
      let familyId = v.familyId;
      if (isNew) {
        const fam = { id: S.newId('f'), surname: v.lastName, fatherName: $('#nf-father').value.trim(), fatherPhone: cleanPhone($('#nf-fphone').value), motherName: $('#nf-mother').value.trim(), motherPhone: cleanPhone($('#nf-mphone').value), guardianName: '', guardianPhone: '', primary: $('#nf-primary').value, email: $('#nf-email').value.trim(), address: '' };
        S.db.families.push(fam);
        familyId = fam.id;
      }
      if (login) applyLogin(null, 'parent', familyId, login);
      const rec = s || { id: S.newId('st'), status: 'active', leftDate: null, ability: 70, punctual: .5 };
      Object.assign(rec, { firstName: v.firstName, lastName: v.lastName, gender: v.gender, dob: v.dob, admissionNo: v.admissionNo, admissionDate: v.admissionDate, familyId, bloodGroup: v.bloodGroup, medical: v.medical });
      if (!s) S.db.students.push(rec);
      let en = S.enrollmentOf(rec.id);
      if (!en) { en = { id: S.newId('e'), studentId: rec.id, yearId: S.currentYear().id, sectionId: v.sectionId, roll: 0 }; S.db.enrollments.push(en); }
      const moved = en.sectionId !== v.sectionId;
      en.sectionId = v.sectionId;
      en.roll = v.roll ? Number(v.roll) : (moved || !en.roll ? nextRoll(v.sectionId) : en.roll);
      save(); done();
      toast(`${s ? 'Saved' : 'Student added'}|${S.studentName(rec)} · ${S.sectionLabel(v.sectionId)}, roll ${en.roll}.${login ? ` Parents sign in with "${login.loginId}".` : ''}`);
      return true;
    }
  });
}

/* ============================================================
   FAMILIES AND THEIR LOGIN
   ============================================================ */
const fm = { q: '' };
const loginOf = famId => S.db.users.find(u => u.role === 'parent' && u.refId === famId) || null;
function initFamilies() {
  setTool(`<label class="search" style="max-width:300px"><span class="sr-only">Search families</span>${ico('ic-search')}<input type="search" id="fmQ" placeholder="Name or phone" value="${esc(fm.q)}" /></label>
    <div class="push"><button class="btn btn-primary btn-sm" type="button" data-a="add">${ico('ic-plus', 16)} Add family</button></div>`);
  const render = () => {
    const q = fm.q.toLowerCase().replace(/\s+/g, '');
    const list = S.db.families.filter(f => !q || (f.fatherName + f.motherName + f.fatherPhone + f.motherPhone + f.surname).toLowerCase().replace(/\s+/g, '').includes(q))
      .sort((a, b) => a.surname.localeCompare(b.surname));
    setBody(`<div class="alert">${ico('ic-key')}<div><b>One login per family</b>Both parents share it. The login name is the mobile number of the parent the school contacts first.</div></div>` +
      tbl(['Family', 'Contact first', 'Children', 'Portal login', 'Actions '], list.map(f => {
        const u = loginOf(f.id);
        const kids = S.childrenOfFamily(f.id);
        return `<tr><td data-col="Family"><b>${esc(f.fatherName)}</b><br><span class="muted small">${esc(f.motherName)}</span></td>
          <td data-col="Contact first">${esc(f.primary === 'mother' ? 'Mother' : f.primary === 'guardian' ? 'Guardian' : 'Father')} · ${esc(f.primary === 'mother' ? f.motherPhone : f.primary === 'guardian' ? f.guardianPhone : f.fatherPhone)}</td>
          <td data-col="Children">${kids.length ? kids.map(k => `${esc(k.firstName)} <span class="muted small">(${esc(k.status === 'active' ? S.sectionLabel(S.sectionOfStudent(k.id)) : 'left')})</span>`).join('<br>') : '<span class="muted">None</span>'}</td>
          <td data-col="Portal login">${!u ? '<span class="pillx grey">No login yet</span>' : u.active ? `<span class="pillx ok">Active</span><br><span class="muted small">${esc(u.loginId)}${u.mustChange ? ' · must change password' : ''}</span>` : '<span class="pillx off">Switched off</span>'}</td>
          <td data-col="Actions"><div class="rowacts">${mini('edit', f.id, 'ic-pencil', 'Edit family')}${!u ? mini('login', f.id, 'ic-key', 'Create login') : mini('reset', f.id, 'ic-key', 'Reset password') + mini('toggle', f.id, u.active ? 'ic-lock' : 'ic-check', u.active ? 'Switch login off' : 'Switch login on', u.active)}</div></td></tr>`;
      }), 'No families match'));
  };
  $('#fmQ').addEventListener('input', e => { fm.q = e.target.value; render(); });
  onTool(a => { if (a === 'add') familyForm(null, render); });
  onBody(async (a, id) => {
    const f = S.family(id);
    if (a === 'edit') familyForm(f, render);
    if (a === 'login' || a === 'reset') {
      const phone = cleanPhone(f.primary === 'mother' ? f.motherPhone : f.primary === 'guardian' ? f.guardianPhone : f.fatherPhone);
      const u = loginOf(f.id);
      loginBox({
        title: u ? `Change the ${f.surname} family's login` : `Create a login for the ${f.surname} family`,
        sub: 'One login for the family; both parents use it. The mobile number is suggested as the login name — you can change it.',
        suggested: phone && !loginTaken(phone) ? phone : suggestLogin(f.fatherName || f.motherName),
        user: u, role: 'parent', refId: f.id, who: `The ${f.surname} family`, done: render
      });
    }
    if (a === 'toggle') {
      const u = loginOf(f.id); u.active = !u.active; save(); render();
      toast(u.active ? 'Login switched on' : 'Login switched off|The family can no longer sign in.', 'info');
    }
  });
  render();
}
function familyForm(f, done) {
  form({
    title: f ? 'Edit family' : 'Add a family', wide: true, rec: f || { primary: 'father' },
    fields: [
      { k: 'surname', l: 'Family name', req: 1, max: 50, full: 1 },
      { k: 'fatherName', l: 'Father\'s name', max: 100 },
      { k: 'fatherPhone', l: 'Father\'s mobile', t: 'tel', max: 15, err: 'Enter a 10-digit mobile number.' },
      { k: 'motherName', l: 'Mother\'s name', max: 100 },
      { k: 'motherPhone', l: 'Mother\'s mobile', t: 'tel', max: 15, err: 'Enter a 10-digit mobile number.' },
      { k: 'guardianName', l: 'Guardian\'s name (if any)', max: 100 },
      { k: 'guardianPhone', l: 'Guardian\'s mobile', t: 'tel', max: 15, err: 'Enter a 10-digit mobile number.' },
      { k: 'primary', l: 'The school contacts first', t: 'select', opts: [['father', 'Father'], ['mother', 'Mother'], ['guardian', 'Guardian']], hint: 'This number becomes the login name' },
      { k: 'email', l: 'E-mail', t: 'email', max: 255 },
      { k: 'address', l: 'Address', t: 'textarea', full: 1, max: 300 }
    ],
    onSave(v) {
      const errs = {};
      ['fatherPhone', 'motherPhone', 'guardianPhone'].forEach(k => { if (v[k] && !phoneOk(v[k])) errs[k] = 'Enter a 10-digit mobile number.'; });
      const primPhone = v[v.primary + 'Phone'];
      if (!primPhone) errs[v.primary + 'Phone'] = 'The parent the school contacts first needs a mobile number.';
      if (!v.fatherName && !v.motherName && !v.guardianName) errs.fatherName = 'Enter at least one parent or guardian.';
      if (Object.keys(errs).length) return errs;
      const rec = f || { id: S.newId('f') };
      Object.assign(rec, v, { fatherPhone: cleanPhone(v.fatherPhone), motherPhone: cleanPhone(v.motherPhone), guardianPhone: cleanPhone(v.guardianPhone) });
      if (!f) S.db.families.push(rec);
      const u = loginOf(rec.id);
      if (u && u.loginId !== cleanPhone(primPhone)) { u.loginId = cleanPhone(primPhone); toast('Login name changed|The family now signs in with ' + u.loginId + '.', 'info'); }
      save(); done();
      toast(f ? 'Family saved' : 'Family added|Now add their children on the Students screen and create a login.');
      return true;
    }
  });
}

/* ============================================================
   CLASSES AND SUBJECTS
   ============================================================ */
const cl = { tab: 'classes', year: null };
function initClasses() {
  cl.year = cl.year || S.currentYear().id;
  const draw = () => {
    setTool(seg('clTab', [['classes', 'Classes'], ['subjects', 'Subjects']], cl.tab) +
      (cl.tab === 'classes' ? `<select class="ctl" id="clYear" aria-label="School year">${opts(S.db.years, cl.year, y => y.name + (y.current ? ' (current)' : ''))}</select>` : '') +
      `<div class="push"><button class="btn btn-primary btn-sm" type="button" data-a="add">${ico('ic-plus', 16)} ${cl.tab === 'classes' ? 'Add class' : 'Add subject'}</button></div>`);
    if ($('#clYear')) $('#clYear').addEventListener('change', e => { cl.year = e.target.value; draw(); });
    cl.tab === 'classes' ? drawClasses() : drawSubjects();
  };
  const drawClasses = () => {
    const secs = S.sectionsOfYear(cl.year);
    setBody(tbl(['Class', 'Room', 'Class teacher', 'Children', 'Subjects and teachers', 'Actions '], secs.map(s => {
      const css = S.classSubjectsOf(s.id);
      return `<tr><td data-col="Class"><b>${esc(S.sectionLabel(s))}</b></td><td data-col="Room">${esc(s.room || '—')}</td>
        <td data-col="Class teacher">${esc(S.teacherName(s.classTeacherId))}</td>
        <td data-col="Children">${S.rosterOf(s.id).length}</td>
        <td data-col="Subjects and teachers"><span class="small">${css.length ? css.map(cs => `${esc(S.subjectName(cs.subjectId))} <span class="muted">(${esc(S.teacherName(cs.teacherId).replace(/^(Mr|Ms|Mrs)\.\s*/, ''))})</span>`).join(', ') : '<span class="muted">None yet</span>'}</span></td>
        <td data-col="Actions"><div class="rowacts">${mini('subjects', s.id, 'ic-book', 'Subjects and teachers')}${mini('edit', s.id, 'ic-pencil', 'Edit class')}${mini('del', s.id, 'ic-trash', 'Delete class', true)}</div></td></tr>`;
    }), 'No classes in this year yet'));
  };
  const drawSubjects = () => {
    setBody(tbl(['Subject', 'Taught in', 'In use', 'Actions '], S.db.subjects.slice().sort((a, b) => a.order - b.order).map(sb => {
      const n = S.db.classSubjects.filter(cs => cs.subjectId === sb.id && S.section(cs.sectionId) && S.section(cs.sectionId).yearId === S.currentYear().id).length;
      return `<tr><td data-col="Subject"><b>${esc(sb.name)}</b></td><td data-col="Taught in">${n} class${n === 1 ? '' : 'es'}</td>
        <td data-col="In use">${sb.active ? '<span class="pillx ok">Active</span>' : '<span class="pillx grey">Not used</span>'}</td>
        <td data-col="Actions"><div class="rowacts">${mini('sedit', sb.id, 'ic-pencil', 'Rename')}${mini('stoggle', sb.id, sb.active ? 'ic-lock' : 'ic-check', sb.active ? 'Stop using' : 'Use again')}</div></td></tr>`;
    }), 'No subjects'));
  };
  onTool((a, k) => {
    if (k && ['classes', 'subjects'].includes(k)) { cl.tab = k; draw(); }
    if (a === 'add') cl.tab === 'classes' ? classForm(null, draw) : subjectForm(null, draw);
  });
  onBody(async (a, id) => {
    if (a === 'edit') classForm(S.section(id), draw);
    if (a === 'subjects') classSubjectsBox(S.section(id), draw);
    if (a === 'del') {
      const s = S.section(id);
      if (S.db.enrollments.some(e => e.sectionId === id)) { toast('This class has children|Move them to another class first.', 'warn'); return; }
      if (!(await P.confirmBox({ title: `Delete ${S.sectionLabel(s)}?`, text: 'Its subjects and timetable are removed too.', ok: 'Delete', danger: true }))) return;
      S.db.sections = S.db.sections.filter(x => x.id !== id);
      S.db.classSubjects = S.db.classSubjects.filter(x => x.sectionId !== id);
      S.db.timetable = S.db.timetable.filter(x => x.sectionId !== id);
      save(); draw(); toast('Class deleted', 'info');
    }
    if (a === 'sedit') subjectForm(S.subject(id), draw);
    if (a === 'stoggle') { const sb = S.subject(id); sb.active = !sb.active; save(); draw(); }
  });
  draw();
}
function classForm(s, done) {
  form({
    title: s ? `Edit ${S.sectionLabel(s)}` : 'Add a class', rec: s || { yearId: cl.year, name: 'A' },
    fields: [
      { k: 'gradeId', l: 'Grade', t: 'select', opts: S.db.grades.map(g => [g.id, g.label]) },
      { k: 'name', l: 'Section', req: 1, max: 5, ph: 'A' },
      { k: 'room', l: 'Room', max: 50 },
      { k: 'classTeacherId', l: 'Class teacher', t: 'select', opts: S.db.teachers.map(t => [t.id, t.name]) }
    ],
    onSave(v) {
      const yearId = s ? s.yearId : cl.year;
      if (S.db.sections.some(x => x.yearId === yearId && x.gradeId === v.gradeId && x.name.toLowerCase() === v.name.toLowerCase() && (!s || x.id !== s.id))) return { name: 'This class already exists in the year.' };
      const other = S.db.sections.find(x => x.yearId === yearId && x.classTeacherId === v.classTeacherId && (!s || x.id !== s.id));
      if (other) return { classTeacherId: `Already class teacher of ${S.sectionLabel(other)}.` };
      const rec = s || { id: S.newId('c'), yearId };
      Object.assign(rec, { gradeId: v.gradeId, name: v.name.toUpperCase(), room: v.room, classTeacherId: v.classTeacherId });
      if (!s) S.db.sections.push(rec);
      save(); done(); toast(s ? 'Class saved' : `Class added|Now choose its subjects and teachers.`);
      return true;
    }
  });
}
function subjectForm(sb, done) {
  form({
    title: sb ? 'Rename subject' : 'Add a subject', rec: sb || {},
    fields: [{ k: 'name', l: 'Subject name', req: 1, max: 50, full: 1 }],
    onSave(v) {
      if (S.db.subjects.some(x => x.name.toLowerCase() === v.name.toLowerCase() && (!sb || x.id !== sb.id))) return { name: 'This subject already exists.' };
      if (sb) sb.name = v.name; else S.db.subjects.push({ id: S.newId('s'), name: v.name, order: S.db.subjects.length + 1, active: true });
      save(); done(); toast('Subject saved'); return true;
    }
  });
}
function classSubjectsBox(sec, done) {
  const rows = () => S.classSubjectsOf(sec.id).map(cs => `<div class="mk-row" style="grid-template-columns:minmax(0,1fr) minmax(0,1.2fr) 90px 40px">
      <b>${esc(S.subjectName(cs.subjectId))}</b>
      <select class="ctl" data-cs-teacher="${cs.id}" aria-label="Teacher">${opts(S.db.teachers, cs.teacherId, t => t.name)}</select>
      <input class="mk-in" type="number" min="0" max="12" value="${cs.perWeek}" data-cs-per="${cs.id}" aria-label="Periods a week" title="Periods a week" />
      <button class="mini del" type="button" data-cs-del="${cs.id}" aria-label="Remove">${ico('ic-trash', 16)}</button></div>`).join('');
  const unused = () => S.db.subjects.filter(sb => sb.active && !S.classSubjectsOf(sec.id).some(cs => cs.subjectId === sb.id));
  P.openModal(`<div class="mhead"><h3 id="modalTitle">Subjects for ${esc(S.sectionLabel(sec))}</h3><p class="small muted" style="margin-top:.3rem">The teacher of a subject posts its homework, enters its marks and sees the class.</p></div>
    <div class="mbody"><div class="mk-head" style="grid-template-columns:minmax(0,1fr) minmax(0,1.2fr) 90px 40px;display:grid"><span>Subject</span><span>Teacher</span><span>Periods / week</span><span></span></div>
    <div class="mk-list" id="csRows">${rows()}</div>
    <div class="btn-row" style="margin-top:1rem"><select class="ctl" id="csAddSel">${unused().map(sb => `<option value="${sb.id}">${esc(sb.name)}</option>`).join('')}</select>
      <button class="btn btn-soft btn-sm" type="button" id="csAdd">${ico('ic-plus', 16)} Add subject</button>
      <button class="btn btn-primary btn-sm" type="button" data-close-modal style="margin-left:auto">Done</button></div></div>`, 'wide');
  const redraw = () => { $('#csRows').innerHTML = rows(); $('#csAddSel').innerHTML = unused().map(sb => `<option value="${sb.id}">${esc(sb.name)}</option>`).join(''); save(); done(); };
  $('#modalContent').addEventListener('change', e => {
    const t = e.target.closest('[data-cs-teacher]'), p = e.target.closest('[data-cs-per]');
    if (t) { S.classSubject(t.dataset.csTeacher).teacherId = t.value; save(); done(); toast('Teacher changed|' + S.teacherName(t.value) + ' now teaches this subject here.', 'info'); }
    if (p) { S.classSubject(p.dataset.csPer).perWeek = Math.max(0, Math.min(12, Number(p.value) || 0)); save(); }
  });
  $('#modalContent').addEventListener('click', async e => {
    const d = e.target.closest('[data-cs-del]');
    if (d) {
      const used = S.db.papers.some(pp => pp.csId === d.dataset.csDel) || S.db.timetable.some(t => t.csId === d.dataset.csDel);
      if (used) { toast('This subject is on the timetable or has exam papers|Remove it from those first.', 'warn'); return; }
      S.db.classSubjects = S.db.classSubjects.filter(cs => cs.id !== d.dataset.csDel); redraw();
    }
    if (e.target.closest('#csAdd')) {
      const sid = $('#csAddSel').value; if (!sid) return;
      S.db.classSubjects.push({ id: S.newId('cs'), sectionId: sec.id, subjectId: sid, teacherId: sec.classTeacherId, perWeek: 4 });
      redraw();
    }
  });
}

/* ============================================================
   ATTENDANCE OVERVIEW (and corrections)
   ============================================================ */
const at = { date: null };
function initAttendance() {
  at.date = at.date || (S.isSchoolDay(today()) ? today() : S.prevSchoolDay(today()));
  setTool(`<label class="ctl-label" for="atDate">Date</label><input type="date" class="ctl" id="atDate" value="${at.date}" max="${today()}" min="${S.currentYear().start}" />
    <div class="push"><button class="btn btn-soft btn-sm" type="button" data-a="today">Today</button></div>`);
  const render = () => {
    const d = at.date;
    if (!S.isSchoolDay(d)) { const h = S.holidayOn(d); setBody(`<div class="panel-card">${emptyState('ic-cal', 'No school on ' + S.fmtShort(d), h ? h.name : 'Weekly holiday')}</div>`); return; }
    const secs = yearSections();
    let total = 0, present = 0, absent = 0, leave = 0, marked = 0;
    secs.forEach(s => { const sm = S.sectionDaySummary(s.id, d); if (sm) { marked++; total += sm.total; present += sm.present; absent += sm.A; leave += sm.V; } });
    const corrections = S.db.changeLog.filter(c => c.what === 'Attendance').slice(0, 8);
    setBody(`<div class="kpis k4">
        <div class="kpi"><span class="ic">${ico('ic-clipboard')}</span><b>${marked}/${secs.length}</b><span>Classes marked</span></div>
        <div class="kpi"><span class="ic ok">${ico('ic-check-circle')}</span><b>${total ? pct(Math.round(present / total * 1000) / 10) : '—'}</b><span>Present</span></div>
        <div class="kpi"><span class="ic warn">${ico('ic-bell')}</span><b>${absent}</b><span>Absent</span></div>
        <div class="kpi"><span class="ic violet">${ico('ic-leave')}</span><b>${leave}</b><span>On leave</span></div></div>
      <div style="margin-top:16px">${tbl(['Class', 'Class teacher', 'Status', 'Present', 'Absent', 'On leave', 'Actions '], secs.map(s => {
        const sm = S.sectionDaySummary(s.id, d), day = S.attendanceDay(s.id, d);
        return `<tr><td data-col="Class"><b>${esc(S.sectionLabel(s))}</b></td><td data-col="Class teacher">${esc(S.teacherName(s.classTeacherId))}</td>
          <td data-col="Status">${day ? `<span class="pillx ok">Marked ${esc(P.timeAgo(day.at))}</span>` : '<span class="pillx warn">Not marked</span>'}</td>
          <td data-col="Present">${sm ? `${sm.P + sm.L + sm.H} / ${sm.total} · ${pct(sm.pct)}` : '—'}</td>
          <td data-col="Absent">${sm ? sm.A : '—'}</td><td data-col="On leave">${sm ? sm.V : '—'}</td>
          <td data-col="Actions"><div class="rowacts">${day ? mini('open', s.id, 'ic-pencil', 'Correct this day') : `<button class="btn btn-soft btn-sm" type="button" data-a="open" data-id="${s.id}">Mark for the class</button>`}</div></td></tr>`;
      }))}</div>
      <div class="panel-card" style="margin-top:16px"><div class="ph-head"><h3>${ico('ic-refresh')} Recent corrections</h3><span class="push muted small">Every change after the day is logged</span></div>
      ${corrections.length ? `<div class="lst">${corrections.map(c => `<div class="li"><span class="lic warn">${ico('ic-pencil')}</span><div class="lb"><b>${esc(S.studentName(c.studentId))} · ${esc(S.sectionLabel(c.sectionId))} · ${esc(S.fmtShort(c.date))}</b>
        <span class="meta">${esc(S.STATUS[c.from] ? S.STATUS[c.from].label : c.from)} → ${esc(S.STATUS[c.to] ? S.STATUS[c.to].label : c.to)} · by ${esc(c.by === 'admin' ? 'the office' : S.teacherName(c.by))} · ${esc(new Date(c.at).toLocaleString())}</span></div></div>`).join('')}</div>` : emptyState('ic-check-circle', 'No corrections yet', '')}</div>`);
  };
  $('#atDate').addEventListener('change', e => { at.date = e.target.value || today(); render(); });
  onTool(a => { if (a === 'today') { at.date = S.isSchoolDay(today()) ? today() : S.prevSchoolDay(today()); $('#atDate').value = at.date; render(); } });
  onBody((a, id) => { if (a === 'open') attendanceBox(S.section(id), at.date, render); });
  render();
}
function attendanceBox(sec, d, done) {
  const day = S.attendanceDay(sec.id, d);
  const roster = S.rosterOf(sec.id);
  const draft = {};
  roster.forEach(s => { draft[s.id] = day && day.marks[s.id] ? day.marks[s.id] : (S.ackLeaveOn(s.id, d) ? 'V' : 'P'); });
  P.openModal(`<div class="mhead"><h3 id="modalTitle">${esc(S.sectionLabel(sec))} · ${esc(S.fmtShort(d))}</h3><p class="small muted" style="margin-top:.3rem">${day ? 'Correcting attendance. Every change is logged with your name.' : 'Marking for the class teacher.'}</p></div>
    <div class="mbody"><div class="roster">${roster.map(s => `<div class="rrow"><span class="roll">${av(S.studentName(s), s.id)}<em>${s.roll}</em></span><span class="nm"><b>${esc(S.studentName(s))}</b></span>
      <span class="stgroup">${S.STATUS_ORDER.map(c => `<button type="button" class="stbtn ${S.STATUS[c].cls}${draft[s.id] === c ? ' on' : ''}" data-sid="${s.id}" data-code="${c}" title="${S.STATUS[c].label}">${S.STATUS[c].short}</button>`).join('')}</span></div>`).join('')}</div>
    <div class="btn-row" style="margin-top:1rem"><button class="btn btn-primary" type="button" id="abSave">Save</button><button class="btn btn-soft" type="button" data-close-modal>Cancel</button></div></div>`, 'wide');
  $('#modalContent').addEventListener('click', e => {
    const b = e.target.closest('.stbtn'); if (b) { draft[b.dataset.sid] = b.dataset.code; $$('.stbtn', b.parentNode).forEach(x => x.classList.toggle('on', x === b)); }
    if (e.target.closest('#abSave')) {
      S.saveAttendance(sec.id, d, draft, 'admin');
      if (day) Object.keys(draft).forEach(sid => { if (day.marks[sid] && day.marks[sid] !== draft[sid] && !S.db.changeLog.some(c => c.studentId === sid && c.date === d && c.to === draft[sid])) S.logChange({ what: 'Attendance', sectionId: sec.id, date: d, studentId: sid, from: day.marks[sid], to: draft[sid], by: 'admin' }); });
      S.save(); P.closeModal(); done(); refreshCounts();
      toast(`Attendance saved|${S.sectionLabel(sec)}, ${S.fmtShort(d)}.`);
    }
  });
}

/* ============================================================
   EXAMS, PAPERS, RESULTS AND GRADE SCALE
   ============================================================ */
const ex = { tab: 'exams' };
function examProgress(e) {
  const pps = S.papersOf(e.id);
  let need = 0, got = 0;
  pps.forEach(pp => { const s = S.paperStats(pp.id); need += s.total; got += s.entered; });
  return { papers: pps.length, need, got, pct: need ? Math.round(got / need * 100) : 0 };
}
function initExams() {
  const draw = () => {
    setTool(seg('exTab', [['exams', 'Exams'], ['scale', 'Grade scale']], ex.tab) +
      (ex.tab === 'exams' ? `<div class="push"><button class="btn btn-primary btn-sm" type="button" data-a="add">${ico('ic-plus', 16)} Add exam</button></div>` : ''));
    ex.tab === 'exams' ? drawExams() : drawScale();
  };
  const drawExams = () => {
    const list = S.db.exams.filter(e => e.yearId === S.currentYear().id).sort((a, b) => a.order - b.order);
    setBody(tbl(['Exam', 'Dates', 'Papers', 'Marks entered', 'Parents see results', 'Actions '], list.map(e => {
      const p = examProgress(e);
      return `<tr><td data-col="Exam"><b>${esc(e.name)}</b></td><td data-col="Dates">${esc(dateRange(e.start, e.end))}</td>
        <td data-col="Papers">${p.papers ? p.papers + ' papers' : '<span class="muted">Not set up</span>'}</td>
        <td data-col="Marks entered">${p.papers ? `${p.got} / ${p.need} <div class="meter ${p.pct === 100 ? 'ok' : 'warn'}" style="min-width:90px"><i style="width:${p.pct}%"></i></div>` : '—'}</td>
        <td data-col="Parents see results">${e.published ? '<span class="pillx ok">Published</span>' : '<span class="pillx grey">Not yet</span>'}</td>
        <td data-col="Actions"><div class="rowacts">${mini('papers', e.id, 'ic-doc', 'Papers and maximum marks')}${mini('edit', e.id, 'ic-pencil', 'Edit exam')}
          ${p.papers ? `<button class="btn ${e.published ? 'btn-soft' : 'btn-primary'} btn-sm" type="button" data-a="publish" data-id="${e.id}">${e.published ? 'Unpublish' : 'Publish'}</button>` : ''}</div></td></tr>`;
    }), 'No exams yet'));
  };
  const drawScale = () => {
    const bands = S.db.gradeBands.slice().sort((a, b) => b.min - a.min);
    setBody(`<div class="apanels wide-left" style="margin-top:0"><div class="panel-card">
      <div class="ph-head"><h3>${ico('ic-chart')} Grade from percentage</h3></div>
      <div class="mk-list" id="gbRows">${bands.map(b => `<div class="mk-row" style="grid-template-columns:110px 1fr 40px"><input class="mk-in" type="number" min="0" max="100" value="${b.min}" data-gb-min="${b.id}" aria-label="From percent" /><input class="mk-in" type="text" maxlength="5" value="${esc(b.label)}" data-gb-label="${b.id}" aria-label="Grade" /><button class="mini del" type="button" data-a="gbdel" data-id="${b.id}" aria-label="Remove">${ico('ic-trash', 16)}</button></div>`).join('')}</div>
      <div class="btn-row" style="margin-top:1rem"><button class="btn btn-soft btn-sm" type="button" data-a="gbadd">${ico('ic-plus', 16)} Add a band</button><button class="btn btn-primary btn-sm" type="button" data-a="gbsave" style="margin-left:auto">Save scale</button></div></div>
      <div class="panel-card"><div class="ph-head"><h3>${ico('ic-sparkle')} How it works</h3></div><p class="muted" style="font-size:.9rem;margin:0">Each band starts at its percentage and runs up to the next one. One band must start at 0. The grade is worked out when results are shown, so changing the scale changes every report card at once.</p></div></div>`);
  };
  onTool((a, k) => {
    if (k && ['exams', 'scale'].includes(k)) { ex.tab = k; draw(); }
    if (a === 'add') examForm(null, draw);
  });
  onBody(async (a, id) => {
    if (a === 'edit') examForm(S.exam(id), draw);
    if (a === 'papers') papersBox(S.exam(id), draw);
    if (a === 'publish') {
      const e = S.exam(id), p = examProgress(e);
      if (!e.published) {
        const yes = await P.confirmBox({ title: `Publish ${e.name}?`, html: `${p.got < p.need ? `<b style="color:var(--bad)">${p.need - p.got} marks are still missing.</b> ` : ''}Parents will see the marks and report cards straight away, and teachers can no longer change them.`, ok: 'Publish results' });
        if (!yes) return;
      }
      e.published = !e.published; save(); draw();
      toast(e.published ? `${e.name} published|Parents can see the results now.` : `${e.name} unpublished|Teachers can correct marks again.`, e.published ? 'ok' : 'info');
    }
    if (a === 'gbadd') { S.db.gradeBands.push({ id: S.newId('gb'), min: 0, label: 'New' }); drawScale(); }
    if (a === 'gbdel') { S.db.gradeBands = S.db.gradeBands.filter(b => b.id !== id); drawScale(); }
    if (a === 'gbsave') {
      const rows = $$('#gbRows .mk-row').map(r => ({ id: $('[data-gb-min]', r).dataset.gbMin, min: Number($('[data-gb-min]', r).value), label: $('[data-gb-label]', r).value.trim() }));
      const mins = rows.map(r => r.min);
      if (rows.some(r => !r.label || isNaN(r.min) || r.min < 0 || r.min > 100)) { toast('Check the bands|Each needs a grade and a percentage from 0 to 100.', 'warn'); return; }
      if (new Set(mins).size !== mins.length) { toast('Two bands start at the same percentage', 'warn'); return; }
      if (!mins.includes(0)) { toast('One band must start at 0', 'warn'); return; }
      S.db.gradeBands = rows; save(); drawScale(); toast('Grade scale saved|Report cards use it straight away.');
    }
  });
  draw();
}
function examForm(e, done) {
  form({
    title: e ? 'Edit exam' : 'Add an exam', rec: e || { start: today(), end: today() },
    fields: [
      { k: 'name', l: 'Name', req: 1, max: 60, full: 1, ph: 'Term 2 assessment' },
      { k: 'start', l: 'Starts', t: 'date', req: 1 },
      { k: 'end', l: 'Ends', t: 'date', req: 1 }
    ],
    onSave(v) {
      if (v.end < v.start) return { end: 'The end cannot be before the start.' };
      const rec = e || { id: S.newId('ex'), yearId: S.currentYear().id, published: false, order: S.db.exams.length + 1 };
      Object.assign(rec, v);
      if (!e) S.db.exams.push(rec);
      save(); done(); toast(e ? 'Exam saved' : 'Exam added|Now set up its papers and maximum marks.'); return true;
    }
  });
}
function papersBox(e, done) {
  const grades = S.db.grades.filter(g => yearSections().some(s => s.gradeId === g.id));
  let gid = grades[0].id;
  const body = () => {
    const secs = yearSections().filter(s => s.gradeId === gid);
    const subjIds = [...new Set(secs.flatMap(s => S.classSubjectsOf(s.id).map(cs => cs.subjectId)))];
    return `<div class="mk-head" style="display:grid;grid-template-columns:minmax(0,1fr) 90px 90px 150px"><span>Subject (${esc(secs.map(S.sectionLabel).join(', '))})</span><span>Max</span><span>Pass</span><span>Date</span></div>
      <div class="mk-list">${subjIds.map(sid => {
        const ex1 = S.db.papers.find(pp => pp.examId === e.id && S.classSubject(pp.csId) && S.classSubject(pp.csId).subjectId === sid && secs.some(s => s.id === S.classSubject(pp.csId).sectionId));
        return `<div class="mk-row" style="grid-template-columns:minmax(0,1fr) 90px 90px 150px" data-subj="${sid}">
          <label class="mk-abs"><input type="checkbox" class="pp-on"${ex1 ? ' checked' : ''} /> <b>${esc(S.subjectName(sid))}</b></label>
          <input class="mk-in pp-max" type="number" min="5" max="200" value="${ex1 ? ex1.max : S.grade(gid).stage === 'early' ? 50 : 100}" aria-label="Maximum marks" />
          <input class="mk-in pp-pass" type="number" min="0" max="200" value="${ex1 ? ex1.pass : S.grade(gid).stage === 'early' ? 18 : 35}" aria-label="Pass mark" />
          <input class="mk-in pp-date" type="date" value="${ex1 ? ex1.date : e.start}" min="${e.start}" max="${e.end}" aria-label="Date" /></div>`;
      }).join('')}</div>`;
  };
  P.openModal(`<div class="mhead"><h3 id="modalTitle">Papers for ${esc(e.name)}</h3><p class="small muted" style="margin-top:.3rem">Set up a whole grade at once. Every class in the grade gets the same papers.</p></div>
    <div class="mbody"><div class="toolbar"><select class="ctl" id="ppGrade">${opts(grades, gid, g => g.label)}</select></div>
    <div id="ppBody">${body()}</div>
    <div class="btn-row" style="margin-top:1rem"><button class="btn btn-primary" type="button" id="ppSave">Save papers for this grade</button><button class="btn btn-soft" type="button" data-close-modal>Close</button></div></div>`, 'wide');
  $('#ppGrade').addEventListener('change', ev => { gid = ev.target.value; $('#ppBody').innerHTML = body(); });
  $('#ppSave').addEventListener('click', () => {
    const secs = yearSections().filter(s => s.gradeId === gid);
    let bad = false;
    $$('#ppBody .mk-row').forEach(r => {
      const on = $('.pp-on', r).checked, max = Number($('.pp-max', r).value), pass = Number($('.pp-pass', r).value);
      const wrong = on && (!(max > 0) || pass < 0 || pass > max);
      r.classList.toggle('bad', wrong); bad = bad || wrong;
    });
    if (bad) { toast('Check the rows in red|The pass mark must be between 0 and the maximum.', 'warn'); return; }
    let blocked = 0;
    $$('#ppBody .mk-row').forEach(r => {
      const sid = r.dataset.subj, on = $('.pp-on', r).checked;
      secs.forEach(s => {
        const cs = S.classSubjectsOf(s.id).find(c => c.subjectId === sid);
        if (!cs) return;
        const pp = S.db.papers.find(x => x.examId === e.id && x.csId === cs.id);
        if (on) {
          const vals = { max: Number($('.pp-max', r).value), pass: Number($('.pp-pass', r).value), date: $('.pp-date', r).value };
          if (pp) Object.assign(pp, vals); else S.db.papers.push(Object.assign({ id: S.newId('pp'), examId: e.id, csId: cs.id }, vals));
        } else if (pp) {
          if (Object.keys(S.marksOf(pp.id)).length) blocked++;
          else S.db.papers = S.db.papers.filter(x => x.id !== pp.id);
        }
      });
    });
    save(); done();
    toast(`Papers saved for ${S.grade(gid).label}${blocked ? `|${blocked} paper(s) already have marks and were kept.` : ''}`, blocked ? 'warn' : 'ok');
  });
}

/* ============================================================
   TIMETABLE
   ============================================================ */
const tt = { sec: null, mode: 'class', teacher: null };
/** Fill the class's empty periods from "periods a week", spreading each subject over the week and never double-booking a teacher. */
function autoFill(secId) {
  const css = S.classSubjectsOf(secId);
  const placed = cs => S.db.timetable.filter(t => t.csId === cs.id).length;
  const left = {}; css.forEach(cs => { left[cs.id] = cs.perWeek - placed(cs); });
  let filled = 0;
  for (let day = 1; day <= 6; day++) {
    S.teachingPeriods().forEach(p => {
      let t = S.ttEntry(secId, day, p.id);
      if (t && t.csId) return;
      const todays = S.db.timetable.filter(x => x.sectionId === secId && x.day === day && x.csId).map(x => x.csId);
      const pick = css.filter(cs => left[cs.id] > 0 && !S.teacherBusy(cs.teacherId, day, p.id, secId)
          && todays.filter(x => x === cs.id).length < Math.max(1, Math.ceil(cs.perWeek / 6)))
        .sort((a, b) => left[b.id] - left[a.id])[0];
      if (!pick) return;
      if (!t) { t = { id: S.newId('tt'), sectionId: secId, day, periodId: p.id }; S.db.timetable.push(t); }
      t.csId = pick.id; left[pick.id]--; filled++;
    });
  }
  return { filled, missing: Object.values(left).reduce((a, n) => a + Math.max(0, n), 0) };
}
function initTimetable() {
  const secs = yearSections();
  if (!tt.sec || !secs.some(s => s.id === tt.sec)) tt.sec = secs[0].id;
  if (!tt.teacher) tt.teacher = S.db.teachers[0].id;
  const tool = () => setTool(seg('ttMode', [['class', 'By class'], ['teacher', 'By teacher']], tt.mode)
    + (tt.mode === 'class'
      ? `<select class="ctl" id="ttSec" aria-label="Class">${opts(secs, tt.sec, S.sectionLabel)}</select>
         <div class="push"><button class="btn btn-primary btn-sm" type="button" data-a="fill">${ico('ic-sparkle', 16)} Auto-fill empty periods</button><button class="btn btn-soft btn-sm" type="button" data-a="clear">${ico('ic-trash', 16)} Clear week</button><button class="btn btn-soft btn-sm" type="button" data-a="periods">${ico('ic-clock', 16)} School day and periods</button></div>`
      : `<select class="ctl" id="ttTeacher" aria-label="Teacher">${opts(S.db.teachers, tt.teacher, t => t.name)}</select>`));
  const draw = () => { tool(); tt.mode === 'class' ? render() : renderTeacher(); };
  const renderTeacher = () => {
    const tid = tt.teacher;
    const mine = S.db.timetable.filter(t => t.csId && S.classSubject(t.csId) && S.classSubject(t.csId).teacherId === tid);
    const total = S.teachingPeriods().length * 6;
    const secsT = [...new Set(mine.map(t => t.sectionId))].map(S.sectionLabel);
    const need = S.db.classSubjects.filter(cs => cs.teacherId === tid && S.section(cs.sectionId) && S.section(cs.sectionId).yearId === S.currentYear().id).reduce((n, cs) => n + cs.perWeek, 0);
    setBody(`<div class="kpis k4"><div class="kpi"><span class="ic">${ico('ic-table')}</span><b>${mine.length}</b><span>Periods a week</span><small>${need} needed by their subjects</small></div>
      <div class="kpi"><span class="ic ok">${ico('ic-sparkle')}</span><b>${total - mine.length}</b><span>Free periods</span></div>
      <div class="kpi"><span class="ic mari">${ico('ic-users')}</span><b>${secsT.length}</b><span>Classes</span><small>${esc(secsT.join(', ') || '—')}</small></div>
      <div class="kpi"><span class="ic violet">${ico('ic-leave')}</span><b>${S.onLeave(tid, today()) ? 'Yes' : 'No'}</b><span>On leave today</span></div></div>
      <div class="panel-card" style="margin-top:16px"><div class="ph-head"><h3>${ico('ic-user')} ${esc(S.teacherName(tid))}'s week</h3><span class="push muted small">To change a period, open the class in "By class"</span></div>
      ${P.timetableHTML({ teacherId: tid })}</div>`);
  };
  const render = () => {
    const clashes = S.db.timetable.filter(t => t.sectionId === tt.sec && t.csId && S.classSubject(t.csId) && S.teacherBusy(S.classSubject(t.csId).teacherId, t.day, t.periodId, tt.sec)).length;
    const counts = S.classSubjectsOf(tt.sec).map(cs => { const n = S.db.timetable.filter(t => t.csId === cs.id).length; return `<span class="pillx ${n === cs.perWeek ? 'ok' : n < cs.perWeek ? 'warn' : 'info'}">${esc(S.subjectName(cs.subjectId))} ${n}/${cs.perWeek}</span>`; }).join('');
    setBody(`${clashes ? `<div class="alert bad">${ico('ic-bell')}<div><b>${clashes} clash${clashes === 1 ? '' : 'es'}</b>A teacher is in two classes at the same time. The cells in red need changing.</div></div>` : ''}
      <div class="panel-card"><div class="ph-head"><h3>${ico('ic-table')} ${esc(S.sectionLabel(tt.sec))}</h3><span class="push muted small">Click a period to change it</span></div>
      <div class="att-sum" style="margin-bottom:12px">${counts}<span class="muted small">periods placed / periods a week</span></div>
      ${P.timetableHTML({ sectionId: tt.sec, editable: true })}</div>`);
  };
  $('#scTool').addEventListener('change', e => {
    if (e.target.id === 'ttSec') { tt.sec = e.target.value; render(); }
    if (e.target.id === 'ttTeacher') { tt.teacher = e.target.value; renderTeacher(); }
  });
  onTool(async (a, k) => {
    if (k && ['class', 'teacher'].includes(k)) { tt.mode = k; draw(); return; }
    if (a === 'periods') periodsBox(render);
    if (a === 'fill') {
      const r = autoFill(tt.sec); save(); render();
      toast(`${r.filled} period${r.filled === 1 ? '' : 's'} filled|${r.missing ? `${r.missing} still to place — the teachers are busy in the free slots. Place them by hand or change a teacher.` : 'Every subject has its periods for the week.'}`, r.missing ? 'warn' : 'ok');
    }
    if (a === 'clear') {
      if (!(await P.confirmBox({ title: `Clear ${S.sectionLabel(tt.sec)}'s week?`, text: 'Every period becomes empty. You can then use Auto-fill or place periods by hand.', ok: 'Clear week', danger: true }))) return;
      S.db.timetable.filter(t => t.sectionId === tt.sec).forEach(t => { t.csId = null; });
      save(); render(); toast('Week cleared', 'info');
    }
  });
  $('#scBody').addEventListener('click', e => {
    const c = e.target.closest('[data-slot]'); if (!c) return;
    const [day, pid] = c.dataset.slot.split('|');
    slotBox(tt.sec, Number(day), pid, render);
  });
  draw();
}
function slotBox(secId, day, periodId, done) {
  const cur = S.ttEntry(secId, day, periodId);
  const p = S.byId('periods', periodId);
  const choices = S.classSubjectsOf(secId);
  P.openModal(`<div class="mhead"><h3 id="modalTitle">${esc(S.sectionLabel(secId))} · ${S.DAYS[day]} · ${esc(p.label)}</h3><p class="small muted" style="margin-top:.3rem">${p.start} – ${p.end}</p></div>
    <div class="mbody"><div class="lst" id="slotList">
      ${choices.map(cs => { const busy = S.teacherBusy(cs.teacherId, day, periodId, secId); return `<label class="li" style="cursor:pointer"><input type="radio" name="slot" value="${cs.id}"${cur && cur.csId === cs.id ? ' checked' : ''} style="margin-top:.3rem;accent-color:var(--mari)" />
        <div class="lb"><b>${esc(S.subjectName(cs.subjectId))}</b><span class="meta">${esc(S.teacherName(cs.teacherId))}${busy ? ` · <span style="color:var(--bad);font-weight:700">already teaching ${esc(S.sectionLabel(busy.sectionId))} now</span>` : ''}</span></div></label>`; }).join('')}
      <label class="li" style="cursor:pointer"><input type="radio" name="slot" value=""${!cur || !cur.csId ? ' checked' : ''} style="margin-top:.3rem;accent-color:var(--mari)" /><div class="lb"><b>Library / games</b><span class="meta">No subject teacher</span></div></label>
    </div>
    <div class="btn-row" style="margin-top:1rem"><button class="btn btn-primary" type="button" id="slotSave">Save</button><button class="btn btn-soft" type="button" data-close-modal>Cancel</button></div></div>`);
  $('#slotSave').addEventListener('click', () => {
    const v = ($('#slotList input:checked') || {}).value || '';
    if (v) {
      const busy = S.teacherBusy(S.classSubject(v).teacherId, day, periodId, secId);
      if (busy) { toast(`Not saved — ${S.teacherName(S.classSubject(v).teacherId)} is already in ${S.sectionLabel(busy.sectionId)}|Pick another subject or move the other class first.`, 'warn'); return; }
    }
    let t = cur;
    if (!t) { t = { id: S.newId('tt'), sectionId: secId, day, periodId }; S.db.timetable.push(t); }
    t.csId = v || null;
    save(); P.closeModal(); done();
    toast('Timetable saved|Teachers and parents see the change now.');
  });
}
function periodsBox(done) {
  const rows = () => S.allPeriods().map(p => `<div class="mk-row" style="grid-template-columns:minmax(0,1fr) 120px 120px 100px" data-pid="${p.id}">
      <input class="mk-in" style="text-align:left" value="${esc(p.label)}" data-k="label" aria-label="Name" />
      <input class="mk-in" type="time" value="${p.start}" data-k="start" aria-label="Starts" />
      <input class="mk-in" type="time" value="${p.end}" data-k="end" aria-label="Ends" />
      <span class="pillx ${p.isBreak ? 'draft' : 'info'}">${p.isBreak ? 'Break' : 'Period ' + p.no}</span></div>`).join('');
  P.openModal(`<div class="mhead"><h3 id="modalTitle">School day and periods</h3><p class="small muted" style="margin-top:.3rem">The same times for every class. Weekly days off are set on the School year screen.</p></div>
    <div class="mbody"><div class="mk-list" id="pdRows">${rows()}</div>
    <div class="btn-row" style="margin-top:1rem"><button class="btn btn-primary" type="button" id="pdSave">Save times</button><button class="btn btn-soft" type="button" data-close-modal>Cancel</button></div></div>`, 'wide');
  $('#pdSave').addEventListener('click', () => {
    const vals = $$('#pdRows .mk-row').map(r => ({ p: S.byId('periods', r.dataset.pid), label: $('[data-k=label]', r).value.trim(), start: $('[data-k=start]', r).value, end: $('[data-k=end]', r).value, r }));
    let bad = false, last = '';
    vals.sort((a, b) => a.start.localeCompare(b.start)).forEach(v => { const wrong = !v.label || !v.start || !v.end || v.end <= v.start || v.start < last; v.r.classList.toggle('bad', wrong); bad = bad || wrong; last = v.end; });
    if (bad) { toast('Check the rows in red|Each period must end after it starts and must not overlap the next.', 'warn'); return; }
    vals.forEach(v => Object.assign(v.p, { label: v.label, start: v.start, end: v.end }));
    save(); P.closeModal(); done(); toast('Times saved');
  });
}

/* ============================================================
   TEACHER LOGINS
   ============================================================ */
function initTeachers() {
  setTool(`<div class="alert" style="margin:0;flex:1">${ico('ic-key')}<div><b>Teacher logins</b>To add a new teacher, open Staff → Add staff member and choose “Staff type: Teacher” — the login is created with the staff record. Teachers already here can be given a login below.</div>
    <span class="push"><button class="btn btn-primary btn-sm" type="button" data-a="newteacher">${ico('ic-plus', 16)} Add a teacher</button></span></div>`);
  onTool(a => { if (a === 'newteacher') { window.Router.go('staff'); setTimeout(() => { const b = $('#addStaff'); if (b) b.click(); }, 350); } });
  const render = () => setBody(tbl(['Teacher', 'Class teacher of', 'Teaches', 'Login', 'Actions '], S.db.teachers.map(t => {
    const u = S.db.users.find(x => x.role === 'teacher' && x.refId === t.id);
    const cls = S.classOfTeacher(t.id);
    const subs = [...new Set(S.db.classSubjects.filter(cs => cs.teacherId === t.id && S.section(cs.sectionId) && S.section(cs.sectionId).yearId === S.currentYear().id).map(cs => S.subjectName(cs.subjectId)))];
    return `<tr><td data-col="Teacher"><div class="cellav"><span class="av">${av(t.name, t.id)}</span><span><b>${esc(t.name)}</b><span>${esc(t.designation)}</span></span></div></td>
      <td data-col="Class teacher of">${cls ? esc(S.sectionLabel(cls)) : '<span class="muted">—</span>'}</td>
      <td data-col="Teaches">${esc(subs.join(', ') || '—')} <span class="muted small">· ${S.sectionsTaughtBy(t.id).length} classes</span></td>
      <td data-col="Login">${!u ? '<span class="pillx grey">No login yet</span>' : u.active ? `<span class="pillx ok">Active</span><br><span class="muted small">${esc(u.loginId)}</span>` : '<span class="pillx off">Switched off</span>'}</td>
      <td data-col="Actions"><div class="rowacts">${!u ? mini('login', t.id, 'ic-key', 'Create login') : mini('reset', t.id, 'ic-key', 'Reset password') + mini('toggle', t.id, u.active ? 'ic-lock' : 'ic-check', u.active ? 'Switch login off' : 'Switch login on', u.active)}</div></td></tr>`;
  })));
  onBody(async (a, id) => {
    const t = S.teacher(id);
    let u = S.db.users.find(x => x.role === 'teacher' && x.refId === id);
    if (a === 'login' || a === 'reset') {
      loginBox({ title: u ? `Change ${t.name}'s login` : `Create a login for ${t.name}`, suggested: suggestLogin(t.name), user: u, role: 'teacher', refId: id, who: t.name, done: render });
    }
    if (a === 'toggle') { u.active = !u.active; save(); render(); toast(u.active ? 'Login switched on' : 'Login switched off|' + t.name + ' can no longer sign in.', 'info'); }
  });
  render();
}

/* ============================================================
   STAFF LEAVE
   ============================================================ */
const sl = { tab: 'pending' };
function initStaffLeave() {
  const draw = () => {
    setTool(seg('slTab', [['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All'], ['balance', 'Balances']], sl.tab)
      + (sl.tab === 'balance' ? `<div class="push"><button class="btn btn-soft btn-sm" type="button" data-a="allow">${ico('ic-cog', 16)} Days allowed a year</button></div>` : ''));
    if (sl.tab === 'balance') { drawBalances(); return; }
    const list = S.db.staffLeaves.filter(l => sl.tab === 'all' || l.status === sl.tab).sort((a, b) => sl.tab === 'pending' ? a.from.localeCompare(b.from) : b.from.localeCompare(a.from));
    const away = S.leavesOn(today());
    setBody((away.length ? `<div class="alert">${ico('ic-leave')}<div><b>On leave today</b>${away.map(l => `${esc(S.teacherName(l.teacherId))} — cover: ${l.coverId ? esc(S.teacherName(l.coverId)) : '<span style="color:var(--bad);font-weight:700">nobody yet</span>'}`).join(' · ')}</div></div>` : '')
      + tbl(['Teacher', 'Leave', 'Days', 'Reason', 'Cover', 'Status', 'Actions '], list.map(l => {
      const cls = S.classOfTeacher(l.teacherId);
      const bal = S.leaveBalance(l.teacherId).find(b => b.type === l.type);
      return `<tr><td data-col="Teacher"><div class="cellav"><span class="av">${av(S.teacherName(l.teacherId), l.teacherId)}</span><span><b>${esc(S.teacherName(l.teacherId))}</b><span>${cls ? 'Class teacher · ' + esc(S.sectionLabel(cls)) : 'Subject teacher'}</span></span></div></td>
        <td data-col="Leave">${esc(l.type)}<br><span class="muted small">${esc(dateRange(l.from, l.to))}</span>${bal ? `<br><span class="muted small">${bal.left} of ${bal.allowed} days left</span>` : ''}</td>
        <td data-col="Days">${daysBetween(l.from, l.to)}</td>
        <td data-col="Reason">${esc(l.reason)}${l.note ? `<br><span class="muted small">Note: ${esc(l.note)}</span>` : ''}</td>
        <td data-col="Cover">${l.coverId ? esc(S.teacherName(l.coverId)) : '<span class="muted">—</span>'}</td>
        <td data-col="Status">${leavePill(l.status)}</td>
        <td data-col="Actions"><div class="rowacts">${l.status === 'pending' ? `<button class="btn btn-primary btn-sm" type="button" data-a="approve" data-id="${l.id}">Approve</button><button class="btn btn-soft btn-sm" type="button" data-a="reject" data-id="${l.id}">Reject</button>`
          : l.status === 'approved' && l.to >= today() ? `<button class="btn btn-soft btn-sm" type="button" data-a="cover" data-id="${l.id}">Change cover</button>` : '<span class="muted small">—</span>'}</div></td></tr>`;
    }), sl.tab === 'pending' ? 'No leave requests waiting' : 'Nothing here'));
  };
  const drawBalances = () => {
    const allow = S.leaveAllowance();
    const types = Object.keys(allow);
    setBody(`<p class="muted small" style="margin:0 0 10px">School days of approved leave in ${esc(S.currentYear().name)}. "On duty" is not counted.</p>`
      + tbl(['Teacher'].concat(types).concat(['Waiting']), S.db.teachers.map(t => {
        const bal = S.leaveBalance(t.id);
        const waiting = S.db.staffLeaves.filter(l => l.teacherId === t.id && l.status === 'pending').length;
        return `<tr><td data-col="Teacher"><div class="cellav"><span class="av">${av(t.name, t.id)}</span><span><b>${esc(t.name)}</b><span>${esc(t.designation || '')}</span></span></div></td>
          ${bal.map(b => `<td data-col="${esc(b.type)}"><b${b.left < 0 ? ' style="color:var(--bad)"' : ''}>${b.used}</b> / ${b.allowed}<div class="meter ${b.used / b.allowed > .8 ? 'warn' : 'ok'}" style="min-width:80px"><i style="width:${Math.min(100, Math.round(b.used / b.allowed * 100))}%"></i></div></td>`).join('')}
          <td data-col="Waiting">${waiting ? `<span class="pillx warn">${waiting}</span>` : '<span class="muted">—</span>'}</td></tr>`;
      })));
  };
  const coverOptions = l => {
    const others = S.db.teachers.filter(t => t.id !== l.teacherId);
    return [['', 'No cover needed']].concat(others.map(t => {
      const busy = S.db.staffLeaves.some(x => x.teacherId === t.id && x.status === 'approved' && x.from <= l.to && x.to >= l.from);
      const cls = S.classOfTeacher(t.id);
      return [t.id, `${t.name}${cls ? ' · ' + S.sectionLabel(cls) : ' · no class of their own'}${busy ? ' (on leave then)' : ''}`];
    }));
  };
  onTool((a, k) => {
    if (k) { sl.tab = k; draw(); }
    if (a === 'allow') {
      const allow = S.leaveAllowance();
      form({
        title: 'Days allowed a year', sub: 'For every teacher, per school year.', rec: Object.fromEntries(Object.entries(allow).map(([k2, v2]) => [k2.replace(/\W/g, ''), v2])),
        fields: Object.keys(allow).map(t => ({ k: t.replace(/\W/g, ''), l: t, t: 'number', min: 0, max: 60, req: 1 })),
        onSave(v) {
          const out = {};
          for (const t of Object.keys(allow)) { const n = Number(v[t.replace(/\W/g, '')]); if (!(n >= 0 && n <= 60)) return { [t.replace(/\W/g, '')]: 'Use a number from 0 to 60.' }; out[t] = n; }
          S.db.settings.leaveAllowance = out; save(); draw(); toast('Leave allowance saved'); return true;
        }
      });
    }
  });
  onBody((a, id) => {
    const l = S.db.staffLeaves.find(x => x.id === id);
    if (!l) return;
    const cls = S.classOfTeacher(l.teacherId);
    const bal = S.leaveBalance(l.teacherId).find(b => b.type === l.type);
    const days = daysBetween(l.from, l.to);
    if (a === 'cover') {
      form({ title: `Cover for ${S.teacherName(l.teacherId)}`, sub: esc(dateRange(l.from, l.to)), rec: { coverId: l.coverId || '' },
        fields: [{ k: 'coverId', l: 'Covering teacher', t: 'select', full: 1, opts: coverOptions(l) }],
        onSave(v) { l.coverId = v.coverId || null; save(); draw(); toast('Cover saved|' + (l.coverId ? S.teacherName(l.coverId) + ' sees it on the teacher portal.' : 'No cover set.')); return true; } });
      return;
    }
    if (a !== 'approve' && a !== 'reject') return;
    const balance = bal ? `<div class="alert ${bal.left - days < 0 ? 'warn' : ''}" style="margin:.8rem 0 0">${ico('ic-chart')}<div><b>${esc(l.type)}: ${bal.used} of ${bal.allowed} days used</b>This request is ${days} school day${days === 1 ? '' : 's'} — ${bal.left - days < 0 ? `${days - bal.left} more than allowed` : `${bal.left - days} left afterwards`}.</div></div>` : '';
    form({
      title: `${a === 'approve' ? 'Approve' : 'Reject'} ${S.teacherName(l.teacherId)}'s leave`,
      sub: esc(l.type + ' · ' + dateRange(l.from, l.to) + ' · ' + l.reason) + balance,
      submit: a === 'approve' ? 'Approve' : 'Reject',
      rec: { coverId: '' },
      fields: (a === 'approve' ? [{ k: 'coverId', l: cls ? `Who covers ${S.sectionLabel(cls)}?` : 'Who covers their periods?', t: 'select', full: 1, opts: coverOptions(l), hint: 'The covering teacher sees it on their home page' }] : [])
        .concat([{ k: 'note', l: a === 'approve' ? 'Note for the teacher (optional)' : 'Why? (the teacher sees this)', t: 'textarea', full: 1, req: a === 'reject', max: 300 }]),
      onSave(v) {
        l.status = a === 'approve' ? 'approved' : 'rejected'; l.note = v.note; l.decidedAt = today();
        if (a === 'approve') l.coverId = v.coverId || null;
        save(); draw();
        toast(`Leave ${l.status}|${S.teacherName(l.teacherId)} sees it on the teacher portal${l.coverId ? '; ' + S.teacherName(l.coverId) + ' is covering' : ''}.`);
        return true;
      }
    });
  });
  draw();
}

/* ============================================================
   NOTICES AND DOCUMENTS FOR PARENTS AND TEACHERS
   ============================================================ */
const nt = { tab: 'notices' };
const CATS = Object.keys(window.App.CATS || { General: 1 });
function audienceFields(rec) {
  return [
    { k: 'audience', l: 'Who sees it', t: 'select', opts: Object.entries(S.AUDIENCES).map(([k, v]) => [k, v]) },
    { k: 'gradeId', l: 'Grade', t: 'select', opts: S.db.grades.map(g => [g.id, g.label]), hide: rec.audience !== 'grade' },
    { k: 'sectionId', l: 'Class', t: 'select', opts: yearSections().map(s => [s.id, S.sectionLabel(s)]), hide: rec.audience !== 'section' }
  ];
}
const syncAudience = () => {
  const a = $('#sf-audience');
  const sync = () => { $('[data-f="gradeId"]').hidden = a.value !== 'grade'; $('[data-f="sectionId"]').hidden = a.value !== 'section'; };
  a.addEventListener('change', sync); sync();
};
function initNotices() {
  const draw = () => {
    setTool(seg('ntTab', [['notices', 'Notices'], ['docs', 'Documents']], nt.tab) +
      `<div class="push"><button class="btn btn-primary btn-sm" type="button" data-a="add">${ico('ic-plus', 16)} ${nt.tab === 'notices' ? 'Post a notice' : 'Add a document'}</button></div>`);
    const list = (nt.tab === 'notices' ? S.db.notices : S.db.documents).slice().sort((a, b) => b.date.localeCompare(a.date));
    setBody(`<div class="alert">${ico('ic-mega')}<div><b>Choose who sees each item</b>All parents, one grade, one class or teachers only. "Website" items also appear on the public notice board in the live system.</div></div>` +
      (nt.tab === 'notices'
        ? tbl(['Notice', 'Who sees it', 'Category', 'Date', 'Actions '], list.map(n => `<tr><td data-col="Notice"><b>${n.pinned ? '📌 ' : ''}${esc(n.title)}</b><br><span class="muted small">${esc(n.body.slice(0, 90))}${n.body.length > 90 ? '…' : ''}</span></td>
            <td data-col="Who sees it"><span class="pillx info">${esc(S.audienceLabel(n))}</span></td><td data-col="Category">${esc(n.category)}</td><td data-col="Date">${esc(S.fmtShort(n.date))}</td>
            <td data-col="Actions"><div class="rowacts">${mini('edit', n.id, 'ic-pencil', 'Edit')}${mini('del', n.id, 'ic-trash', 'Delete', true)}</div></td></tr>`), 'No notices')
        : tbl(['Document', 'Who sees it', 'File', 'Date', 'Actions '], list.map(d => `<tr><td data-col="Document"><b>${esc(d.title)}</b></td>
            <td data-col="Who sees it"><span class="pillx info">${esc(S.audienceLabel(d))}</span></td><td data-col="File">${esc(d.file)} <span class="muted small">${esc(d.size || '')}</span></td><td data-col="Date">${esc(S.fmtShort(d.date))}</td>
            <td data-col="Actions"><div class="rowacts">${mini('edit', d.id, 'ic-pencil', 'Edit')}${mini('del', d.id, 'ic-trash', 'Delete', true)}</div></td></tr>`), 'No documents')));
  };
  const noticeForm = n => form({
    title: n ? 'Edit notice' : 'Post a notice', wide: true,
    rec: n || { audience: 'parents', category: 'General', date: today(), gradeId: S.db.grades[0].id, sectionId: yearSections()[0].id },
    fields: [{ k: 'title', l: 'Title', req: 1, full: 1, max: 255 }].concat(audienceFields(n || { audience: 'parents' }), [
      { k: 'category', l: 'Category', t: 'select', opts: CATS.map(c => [c, c]) },
      { k: 'date', l: 'Date', t: 'date', req: 1 },
      { k: 'pinned', l: 'Pin to the top', t: 'select', opts: [['no', 'No'], ['yes', 'Yes']] },
      { k: 'body', l: 'Notice', t: 'textarea', req: 1, full: 1, max: 2000 }
    ]),
    after: () => { if (n) $('#sf-pinned').value = n.pinned ? 'yes' : 'no'; syncAudience(); },
    onSave(v) {
      const rec = n || { id: S.newId('n') };
      Object.assign(rec, { title: v.title, body: v.body, category: v.category, date: v.date, pinned: v.pinned === 'yes', audience: v.audience, gradeId: v.audience === 'grade' ? v.gradeId : null, sectionId: v.audience === 'section' ? v.sectionId : null });
      if (!n) S.db.notices.push(rec);
      save(); draw(); toast(`Notice ${n ? 'saved' : 'posted'}|Seen by: ${S.audienceLabel(rec)}.`); return true;
    }
  });
  const docForm = d => form({
    title: d ? 'Edit document' : 'Add a document', wide: true,
    rec: d || { audience: 'parents', date: today(), gradeId: S.db.grades[0].id, sectionId: yearSections()[0].id },
    fields: [{ k: 'title', l: 'Title', req: 1, full: 1, max: 255 }].concat(audienceFields(d || { audience: 'parents' }), [
      { k: 'date', l: 'Date', t: 'date', req: 1 }
    ]),
    extra: `<div class="field full"><label for="sf-file">File${d ? ' (leave empty to keep ' + esc(d.file) + ')' : ''}</label><input type="file" id="sf-file" accept=".pdf,.doc,.docx,.jpg,.png" /><span class="err">Choose a file.</span></div>`,
    after: syncAudience,
    onSave(v) {
      const f = $('#sf-file').files[0];
      if (!d && !f) { $('#sf-file').closest('.field').classList.add('bad'); return {}; }
      const rec = d || { id: S.newId('d') };
      Object.assign(rec, { title: v.title, date: v.date, audience: v.audience, gradeId: v.audience === 'grade' ? v.gradeId : null, sectionId: v.audience === 'section' ? v.sectionId : null });
      if (f) { rec.file = f.name; rec.size = f.size > 1048576 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB'; }
      if (!d) S.db.documents.push(rec);
      save(); draw(); toast(`Document ${d ? 'saved' : 'added'}|Seen by: ${S.audienceLabel(rec)}.`); return true;
    }
  });
  onTool((a, k) => {
    if (k) { nt.tab = k; draw(); }
    if (a === 'add') nt.tab === 'notices' ? noticeForm(null) : docForm(null);
  });
  onBody(async (a, id) => {
    const store = nt.tab === 'notices' ? 'notices' : 'documents';
    const item = S.db[store].find(x => x.id === id);
    if (a === 'edit') nt.tab === 'notices' ? noticeForm(item) : docForm(item);
    if (a === 'del' && await P.confirmBox({ title: 'Delete this item?', text: `"${item.title}" is removed for everyone who could see it.`, ok: 'Delete', danger: true })) {
      S.db[store] = S.db[store].filter(x => x.id !== id); save(); draw(); toast('Deleted', 'info');
    }
  });
  draw();
}

/* ============================================================
   SCHOOL YEAR AND HOLIDAYS
   ============================================================ */
function initYear() {
  setTool(`<div class="push"><button class="btn btn-soft btn-sm" type="button" data-a="addyear">${ico('ic-plus', 16)} Add school year</button><button class="btn btn-primary btn-sm" type="button" data-a="addhol">${ico('ic-plus', 16)} Add holiday</button></div>`);
  const render = () => {
    const years = S.db.years.slice().sort((a, b) => a.start.localeCompare(b.start));
    const hols = S.db.holidays.slice().sort((a, b) => a.date.localeCompare(b.date));
    setBody(`<div class="apanels wide-left" style="margin-top:0">
      <div>${tbl(['School year', 'Dates', 'Classes', 'Students', 'Actions '], years.map(y => `<tr><td data-col="School year"><b>${esc(y.name)}</b> ${y.current ? '<span class="pillx ok">Current</span>' : ''}</td>
          <td data-col="Dates">${esc(S.fmtDate(y.start))} – ${esc(S.fmtDate(y.end))}</td><td data-col="Classes">${S.sectionsOfYear(y.id).length}</td>
          <td data-col="Students">${S.db.enrollments.filter(e => e.yearId === y.id).length}</td>
          <td data-col="Actions"><div class="rowacts">${mini('edityear', y.id, 'ic-pencil', 'Edit')}${y.current ? '' : `<button class="btn btn-soft btn-sm" type="button" data-a="current" data-id="${y.id}">Make current</button>`}</div></td></tr>`))}
        <div style="margin-top:16px">${tbl(['Holiday', 'Date', 'Day', 'Actions '], hols.map(h => `<tr class="${h.date < today() ? 'muted' : ''}"><td data-col="Holiday"><b>${esc(h.name)}</b></td><td data-col="Date">${esc(S.fmtDate(h.date))}</td><td data-col="Day">${S.DAYS[S.dayOfWeek(h.date)]}</td>
          <td data-col="Actions"><div class="rowacts">${mini('delhol', h.id, 'ic-trash', 'Delete', true)}</div></td></tr>`), 'No holidays')}</div></div>
      <div class="panel-card"><div class="ph-head"><h3>${ico('ic-cal')} Weekly days off</h3></div>
        <div style="display:grid;gap:8px">${S.DAYS.map((d, i) => `<label class="check"><input type="checkbox" data-off="${i}"${S.db.settings.weeklyOff.includes(i) ? ' checked' : ''} /> ${d}</label>`).join('')}</div>
        <p class="small-note">Attendance is not expected on days off and holidays, and they are left out of attendance percentages.</p></div></div>`);
  };
  onTool(a => {
    if (a === 'addhol') form({ title: 'Add a holiday', rec: { date: today() }, fields: [{ k: 'name', l: 'Name', req: 1, max: 80, full: 1 }, { k: 'date', l: 'Date', t: 'date', req: 1 }],
      onSave(v) { if (S.holidayOn(v.date)) return { date: 'There is already a holiday on this day.' }; S.db.holidays.push({ id: S.newId('h'), name: v.name, date: v.date }); save(); render(); toast('Holiday added|Parents and teachers see it in their calendars.'); return true; } });
    if (a === 'addyear') yearForm(null, render);
  });
  onBody(async (a, id) => {
    if (a === 'delhol') { S.db.holidays = S.db.holidays.filter(h => h.id !== id); save(); render(); toast('Holiday removed', 'info'); }
    if (a === 'edityear') yearForm(S.byId('years', id), render);
    if (a === 'current') {
      const y = S.byId('years', id);
      if (!(await P.confirmBox({ title: `Make ${y.name} the current year?`, text: 'Teachers and parents will see this year\'s classes, attendance and marks. Earlier years stay readable.', ok: 'Make current' }))) return;
      S.db.years.forEach(x => { x.current = x.id === id; }); save(); render(); toast(`${y.name} is now the current year`);
    }
  });
  $('#scBody').addEventListener('change', e => {
    const c = e.target.closest('[data-off]'); if (!c) return;
    const i = Number(c.dataset.off);
    S.db.settings.weeklyOff = c.checked ? [...new Set(S.db.settings.weeklyOff.concat(i))] : S.db.settings.weeklyOff.filter(x => x !== i);
    save(); toast('Weekly days off saved', 'info');
  });
  render();
}
function yearForm(y, done) {
  form({
    title: y ? 'Edit school year' : 'Add a school year', rec: y || {},
    fields: [{ k: 'name', l: 'Name', req: 1, max: 20, ph: '2027–28', full: 1 }, { k: 'start', l: 'Starts', t: 'date', req: 1 }, { k: 'end', l: 'Ends', t: 'date', req: 1 }],
    onSave(v) {
      if (v.end <= v.start) return { end: 'The end must be after the start.' };
      if (S.db.years.some(x => (!y || x.id !== y.id) && v.start <= x.end && v.end >= x.start)) return { start: 'These dates overlap another school year.' };
      const rec = y || { id: S.newId('y'), current: false };
      Object.assign(rec, v); if (!y) S.db.years.push(rec);
      save(); done(); toast('School year saved'); return true;
    }
  });
}

/* ============================================================
   PROMOTION TO THE NEXT YEAR
   ============================================================ */
const pr = { sec: null };
function initPromotion() {
  const ny = S.nextYear();
  const secs = yearSections();
  if (!pr.sec || !secs.some(s => s.id === pr.sec)) pr.sec = secs[0].id;
  if (!ny) { setTool(''); setBody(`<div class="panel-card">${emptyState('ic-swap', 'Add next school year first', 'Promotion moves children into classes of the next school year. Add it on the School year screen.')}</div>`); return; }
  setTool(`<select class="ctl" id="prSec" aria-label="Class">${opts(secs, pr.sec, S.sectionLabel)}</select><span class="muted small">→ ${esc(ny.name)}</span>`);
  const render = () => {
    const sec = S.section(pr.sec), g = S.grade(sec.gradeId);
    const nextG = S.db.grades.find(x => x.order === g.order + 1);
    const target = nextG && S.db.sections.find(s => s.yearId === ny.id && s.gradeId === nextG.id && s.name === sec.name);
    const same = S.db.sections.find(s => s.yearId === ny.id && s.gradeId === g.id && s.name === sec.name);
    const roster = S.rosterOf(sec.id);
    const done = roster.filter(s => S.enrollmentOf(s.id, ny.id) || s.status !== 'active');
    const needsClasses = (nextG && !target) || !same;
    setBody(`${needsClasses ? `<div class="alert warn">${ico('ic-layers')}<div><b>${esc(ny.name)} has no ${esc([nextG && !target ? nextG.label + ' ' + sec.name : null, !same ? g.label + ' ' + sec.name : null].filter(Boolean).join(' or '))} yet</b>Create next year's classes with the same names and class teachers. You can change teachers later.</div>
        <span class="push"><button class="btn btn-primary btn-sm" type="button" data-a="mkclasses">Create classes for ${esc(ny.name)}</button></span></div>` : ''}
      ${done.length === roster.length && roster.length ? `<div class="alert ok">${ico('ic-check-circle')}<div><b>Done</b>Every child in ${esc(S.sectionLabel(sec))} already has a place for ${esc(ny.name)}.</div></div>` : ''}
      <div class="panel-card"><div class="ph-head"><h3>${ico('ic-swap')} ${esc(S.sectionLabel(sec))} → ${esc(ny.name)}</h3><span class="push"><button class="btn btn-soft btn-sm" type="button" data-a="all">Promote everyone</button></span></div>
      <div class="lst">${roster.map(s => {
        const ne = S.enrollmentOf(s.id, ny.id);
        if (ne) return `<div class="li"><span class="lic ok">${ico('ic-check')}</span><div class="lb"><b>${esc(S.studentName(s))}</b><span class="meta">Placed in ${esc(S.sectionLabel(ne.sectionId))}</span></div></div>`;
        return `<div class="li"><span class="lic">${ico('ic-user')}</span><div class="lb"><b>${esc(S.studentName(s))}</b><span class="meta">Roll ${s.roll}</span></div>
          <div class="lr"><select class="ctl" data-pr="${s.id}" aria-label="Next year for ${esc(S.studentName(s))}">
            ${nextG ? `<option value="up"${target ? '' : ' disabled'}>Promote to ${esc(nextG.label + ' ' + sec.name)}</option>` : '<option value="out">Passed out (finished Grade 5)</option>'}
            <option value="stay"${same ? '' : ' disabled'}>Stays in ${esc(g.label)}</option><option value="leave">Leaving the school</option></select></div></div>`;
      }).join('')}</div>
      <div class="btn-row" style="margin-top:1rem"><button class="btn btn-primary" type="button" data-a="go">Save promotion</button><span class="muted small">Nothing changes in ${esc(S.currentYear().name)}; children get a new class for ${esc(ny.name)}.</span></div></div>`);
  };
  $('#prSec').addEventListener('change', e => { pr.sec = e.target.value; render(); });
  onBody(async a => {
    const sec = S.section(pr.sec);
    if (a === 'mkclasses') {
      let n = 0;
      yearSections().forEach(s => {
        if (!S.db.sections.some(x => x.yearId === ny.id && x.gradeId === s.gradeId && x.name === s.name)) {
          const c = { id: S.newId('c'), yearId: ny.id, gradeId: s.gradeId, name: s.name, classTeacherId: s.classTeacherId, room: s.room };
          S.db.sections.push(c);
          S.classSubjectsOf(s.id).forEach(cs => S.db.classSubjects.push({ id: S.newId('cs'), sectionId: c.id, subjectId: cs.subjectId, teacherId: cs.teacherId, perWeek: cs.perWeek }));
          n++;
        }
      });
      save(); render(); toast(`${n} classes created for ${ny.name}|Same names, teachers and subjects as this year.`);
    }
    if (a === 'all') $$('[data-pr]').forEach(s => { s.value = s.querySelector('option:not([disabled])').value; });
    if (a === 'go') {
      const g = S.grade(sec.gradeId), nextG = S.db.grades.find(x => x.order === g.order + 1);
      const target = nextG && S.db.sections.find(s => s.yearId === ny.id && s.gradeId === nextG.id && s.name === sec.name);
      const same = S.db.sections.find(s => s.yearId === ny.id && s.gradeId === g.id && s.name === sec.name);
      const picks = $$('[data-pr]');
      if (!picks.length) return;
      if (!(await P.confirmBox({ title: 'Save promotion?', text: `${picks.length} children in ${S.sectionLabel(sec)} get their ${ny.name} class. You can still change a child's class on the Students screen.`, ok: 'Save' }))) return;
      let up = 0, out = 0;
      picks.forEach(p => {
        const sid = p.dataset.pr, v = p.value;
        const to = v === 'up' ? target : v === 'stay' ? same : null;
        if (to) { S.db.enrollments.push({ id: S.newId('e'), studentId: sid, sectionId: to.id, yearId: ny.id, roll: nextRoll(to.id) }); up++; }
        else { S.db.promotions.push({ studentId: sid, yearId: ny.id, result: v }); out++; }
      });
      save(); render(); toast(`Promotion saved|${up} placed for ${ny.name}${out ? `, ${out} finishing or leaving` : ''}.`);
    }
  });
  render();
}

/* ============================================================
   IMPORT STUDENTS FROM A CSV FILE
   ============================================================ */
const COLS = ['admission_no', 'first_name', 'last_name', 'gender', 'date_of_birth', 'class', 'father_name', 'father_phone', 'mother_name', 'mother_phone'];
function sampleCsv(withError) {
  return [COLS.join(','),
    'CS2026301,Nila,Senthil,Girl,2021-04-12,UKG A,Senthil Kumar,9443012345,Revathi Senthil,9443012346',
    'CS2026302,Kabir,Ahmed,Boy,2019-11-02,Grade 1 A,Imran Ahmed,9443023456,Sameena Imran,9443023457',
    withError ? 'CS2026303,Tara,,Girl,2018-13-40,Grade 7 A,Joseph Mani,94430,Mary Joseph,9443034568'
              : 'CS2026303,Tara,Mani,Girl,2018-03-14,Grade 2 A,Joseph Mani,9443034567,Mary Joseph,9443034568',
    'CS2026304,Vikram,Krishnan,Boy,2017-07-21,Grade 3 A,Suresh Krishnan,9876543210,Divya Suresh,9876501234'
  ].join('\n');
}
function parseCsv(text) {
  return text.replace(/\r/g, '').split('\n').filter(l => l.trim()).map(l => {
    const out = []; let cur = '', q = false;
    for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; } else cur += ch; }
    out.push(cur.trim()); return out;
  });
}
let importRows = null;
function checkRows(text) {
  const rows = parseCsv(text);
  const head = (rows.shift() || []).map(h => h.toLowerCase());
  if (COLS.some((c, i) => head[i] !== c)) return { headError: `The first line must be: ${COLS.join(', ')}` };
  const secByLabel = {}; yearSections().forEach(s => { secByLabel[S.sectionLabel(s).toLowerCase()] = s; });
  const seen = new Set();
  return { rows: rows.map((r, i) => {
    const v = {}; COLS.forEach((c, j) => { v[c] = r[j] || ''; });
    const errs = [];
    ['admission_no', 'first_name', 'last_name', 'class'].forEach(c => { if (!v[c]) errs.push(`${c.replace('_', ' ')} is empty`); });
    if (v.admission_no && (S.db.students.some(s => s.admissionNo.toLowerCase() === v.admission_no.toLowerCase()) || seen.has(v.admission_no.toLowerCase()))) errs.push('admission no. already used');
    seen.add(v.admission_no.toLowerCase());
    if (!['boy', 'girl'].includes(v.gender.toLowerCase())) errs.push('gender must be Boy or Girl');
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v.date_of_birth) ? S.parse(v.date_of_birth) : null;
    if (!d || S.iso(d) !== v.date_of_birth || v.date_of_birth > today()) errs.push('date of birth must be a real date like 2019-06-30');
    if (v.class && !secByLabel[v.class.toLowerCase()]) errs.push(`no class called "${v.class}" this year`);
    if (!phoneOk(v.father_phone) && !phoneOk(v.mother_phone)) errs.push('needs at least one 10-digit mobile number');
    if (v.father_phone && !phoneOk(v.father_phone)) errs.push('father\'s phone is not 10 digits');
    if (v.mother_phone && !phoneOk(v.mother_phone)) errs.push('mother\'s phone is not 10 digits');
    const fam = S.db.families.find(f => (v.father_phone && cleanPhone(f.fatherPhone) === cleanPhone(v.father_phone)) || (v.mother_phone && cleanPhone(f.motherPhone) === cleanPhone(v.mother_phone)));
    return { line: i + 2, v, errs, section: secByLabel[v.class.toLowerCase()], family: fam };
  }) };
}
function initImport() {
  setTool(`<button class="btn btn-soft btn-sm" type="button" data-a="back">${ico('ic-chev-l', 16)} Students</button>
    <div class="push"><button class="btn btn-soft btn-sm" type="button" data-a="template">${ico('ic-doc', 16)} Download the template</button><button class="btn btn-soft btn-sm" type="button" data-a="sample">Try a sample file</button></div>`);
  const render = res => {
    importRows = res && res.rows ? res.rows : null;
    const bad = importRows ? importRows.filter(r => r.errs.length).length : 0;
    setBody(`<div class="panel-card">
        <div class="drop" id="impDrop" tabindex="0" role="button" aria-label="Choose a CSV file"><span class="up-ic">${ico('ic-upload', 24)}</span><b>Drop a CSV file here, or choose a file</b><span>One row per student. Families are matched by mobile number, so brothers and sisters share one family login.</span><input type="file" id="impFile" accept=".csv,text/csv" hidden /></div>
      </div>
      ${res && res.headError ? `<div class="alert bad" style="margin-top:16px">${ico('ic-bell')}<div><b>This is not the template</b>${esc(res.headError)}</div></div>` : ''}
      ${importRows ? `<div class="alert ${bad ? 'bad' : 'ok'}" style="margin-top:16px">${ico(bad ? 'ic-bell' : 'ic-check-circle')}<div><b>${bad ? `${bad} of ${importRows.length} rows need fixing — nothing has been saved` : `All ${importRows.length} rows are ready`}</b>${bad ? 'Fix the rows in red in your file and upload it again. Nothing is imported until every row is right.' : 'Check the list, then import.'}</div>
          <span class="push">${bad ? '<button class="btn btn-soft btn-sm" type="button" data-a="fixed">Load the corrected sample</button>' : '<button class="btn btn-primary btn-sm" type="button" data-a="import">Import ' + importRows.length + ' students</button>'}</span></div>
        ${tbl(['Line', 'Student', 'Class', 'Family', 'Check'], importRows.map(r => `<tr style="${r.errs.length ? 'background:var(--bad-bg)' : ''}"><td data-col="Line">${r.line}</td>
          <td data-col="Student"><b>${esc(r.v.first_name + ' ' + r.v.last_name)}</b><br><span class="muted small">${esc(r.v.admission_no)} · ${esc(r.v.gender)} · ${esc(r.v.date_of_birth)}</span></td>
          <td data-col="Class">${esc(r.v.class)}</td>
          <td data-col="Family">${esc(r.v.father_name || r.v.mother_name)}<br><span class="muted small">${r.family ? 'Existing family — ' + esc(r.family.fatherName) : 'New family'}</span></td>
          <td data-col="Check">${r.errs.length ? `<span style="color:var(--bad);font-weight:700">${r.errs.map(esc).join('; ')}</span>` : '<span class="pillx ok">Ready</span>'}</td></tr>`))}` : ''}`);
    const dz = $('#impDrop'), fi = $('#impFile');
    const read = f => { if (!f) return; const fr = new FileReader(); fr.onload = () => render(checkRows(String(fr.result))); fr.readAsText(f); };
    dz.addEventListener('click', () => fi.click());
    dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } });
    fi.addEventListener('change', e => read(e.target.files[0]));
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
    dz.addEventListener('drop', e => read(e.dataTransfer.files[0]));
  };
  onTool(a => {
    if (a === 'back') window.Router.go('s-students');
    if (a === 'sample') { render(checkRows(sampleCsv(true))); toast('Sample file loaded|It has one row with mistakes, to show how checking works.', 'info'); }
    if (a === 'template') {
      const url = URL.createObjectURL(new Blob([COLS.join(',') + '\n'], { type: 'text/csv' }));
      const link = document.createElement('a'); link.href = url; link.download = 'christina-students-template.csv'; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
  onBody(a => {
    if (a === 'fixed') render(checkRows(sampleCsv(false)));
    if (a === 'import' && importRows && !importRows.some(r => r.errs.length)) {
      let fams = 0;
      importRows.forEach(r => {
        let f = r.family;
        if (!f) {
          f = { id: S.newId('f'), surname: r.v.last_name, fatherName: r.v.father_name, fatherPhone: cleanPhone(r.v.father_phone), motherName: r.v.mother_name, motherPhone: cleanPhone(r.v.mother_phone), guardianName: '', guardianPhone: '', primary: phoneOk(r.v.father_phone) ? 'father' : 'mother', email: '', address: '' };
          S.db.families.push(f); fams++;
        }
        const s = { id: S.newId('st'), familyId: f.id, admissionNo: r.v.admission_no, firstName: r.v.first_name, lastName: r.v.last_name, dob: r.v.date_of_birth, gender: r.v.gender[0].toUpperCase() + r.v.gender.slice(1).toLowerCase(), bloodGroup: '', admissionDate: today(), medical: '', status: 'active', leftDate: null, ability: 70, punctual: .5 };
        S.db.students.push(s);
        S.db.enrollments.push({ id: S.newId('e'), studentId: s.id, sectionId: r.section.id, yearId: S.currentYear().id, roll: nextRoll(r.section.id) });
      });
      save();
      toast(`${importRows.length} students imported|${fams} new families. Create their logins on the Families screen.`);
      importRows = null;
      window.Router.go('s-students');
    }
  });
  render(null);
}

/* ============================================================
   ROUTES FOR admin.js
   ============================================================ */
const R = (onLoad) => ({ page: PAGE, onLoad: () => { onLoad(); refreshCounts(); } });
return {
  overview, refreshCounts, staffHook,
  routes: {
    's-students':   R(initStudents),
    's-families':   R(initFamilies),
    's-import':     R(initImport),
    's-classes':    R(initClasses),
    's-attendance': R(initAttendance),
    's-exams':      R(initExams),
    's-timetable':  R(initTimetable),
    's-teachers':   R(initTeachers),
    's-staffleave': R(initStaffLeave),
    's-notices':    R(initNotices),
    's-year':       R(initYear),
    's-promotion':  R(initPromotion)
  },
  titles: {
    's-students':   ['Students', 'Every child, their class and roll number this year'],
    's-families':   ['Families', 'Parents, phone numbers and the family login'],
    's-import':     ['Import students', 'Add many students at once from a CSV file'],
    's-classes':    ['Classes and subjects', 'Sections, class teachers, and who teaches each subject'],
    's-attendance': ['Attendance', 'Which classes have marked today, and corrections'],
    's-exams':      ['Exams and results', 'Papers, maximum marks, publishing results and the grade scale'],
    's-timetable':  ['Timetable', 'The weekly timetable for each class, with clash checks'],
    's-teachers':   ['Teacher logins', 'Who can sign in to the teacher portal'],
    's-staffleave': ['Staff leave', 'Approve or reject teachers\' leave'],
    's-notices':    ['Notices for parents and teachers', 'Send notices and documents to all parents, a grade, a class or teachers'],
    's-year':       ['School year and holidays', 'Years, the current year, holidays and weekly days off'],
    's-promotion':  ['Promotion', 'Move children into next year\'s classes']
  }
};
})();
