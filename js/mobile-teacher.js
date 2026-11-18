/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Teacher app (phone)
   Same rules as the teacher web portal: attendance for the
   teacher's own class only, homework / marks / remarks for the
   classes and subjects they teach, phone numbers and medical notes
   only for their own class.
   ============================================================ */
'use strict';
(function () {
const { $, $$, esc, toast } = window.App;
const S = window.SchoolDB;
const P = window.Portal;
const M = window.MApp;
const { av, ico, chip, leavePill, remarkIcon, dateRange, daysBetween, pct } = P;

let T = null;
const me = () => T;
const myClass = () => S.classOfTeacher(T.id);
const taught = () => S.sectionsTaughtBy(T.id);
const today = () => S.todayISO();
const short = n => String(n).replace(/^(Mr|Ms|Mrs)\.\s*/, '');
const audience = () => { const s = taught(); return { role: 'teacher', sectionIds: s.map(x => x.id), gradeIds: [...new Set(s.map(x => x.gradeId))] }; };
const pendingLeaves = () => {
  const c = myClass(); if (!c) return [];
  const ids = new Set(S.rosterOf(c.id).map(s => s.id));
  return S.db.studentLeaves.filter(l => ids.has(l.studentId) && l.status === 'sent');
};
const ui = { att: null, attView: 'today', hwSec: null, hwType: 'all', mk: { exam: null, sec: null, paper: null }, ttDay: null, ttWhose: 'mine', clsSec: null, rmSec: null, slTab: 'sent' };

/* ============================================================
   TODAY
   ============================================================ */
function pageToday(el) {
  const c = myClass(), d = today(), school = S.isSchoolDay(d);
  const day = c && S.attendanceDay(c.id, d);
  const sm = c && S.sectionDaySummary(c.id, d);
  const now = new Date(), hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dow = S.dayOfWeek(d);
  const periods = S.allPeriods().filter(p => !p.isBreak);
  const cur = periods.find(p => hm >= p.start && hm < p.end);
  const next = periods.find(p => p.start > hm && S.teacherSlot(T.id, dow, p.id));
  const slot = p => p && S.teacherSlot(T.id, dow, p.id);
  const covers = school ? S.coverDutiesOn(T.id, d) : [];
  const waiting = pendingLeaves();
  let attCard = '';
  if (!school) { const h = S.holidayOn(d); attCard = `<div class="m-card soft"><h3>${ico('ic-cal')} No school today</h3><p style="margin:0;font-size:.86rem;color:var(--ink-70)">${esc(h ? h.name : 'Weekly holiday')} · back on ${esc(S.fmtShort(S.nextSchoolDay(d)))}</p></div>`; }
  else if (c && !day) attCard = `<div class="m-card warn"><h3 style="color:var(--warn)">${ico('ic-clipboard')} Attendance not marked</h3><p style="margin:0 0 10px;font-size:.86rem;color:var(--warn)">${esc(S.sectionLabel(c))} · ${S.rosterOf(c.id).length} children</p><button class="m-btn" type="button" data-gotab="attendance">Mark attendance now</button></div>`;
  else if (c) attCard = `<div class="m-card ok"><h3 style="color:var(--ok)">${ico('ic-check-circle')} Attendance done · ${esc(P.timeAgo(day.at))}</h3><div class="m-sum">${['P', 'A', 'L', 'H', 'V'].map(k => `<span class="att-chip ${S.STATUS[k].cls}">${sm[k]} ${S.STATUS[k].label}</span>`).join('')}</div></div>`;
  el.innerHTML = `
    <div class="m-hero"><h2>${new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, ${esc(short(T.name).split(' ')[0])}</h2>
      <p>${esc(S.fmtShort(d))} · ${c ? 'Class teacher of ' + esc(S.sectionLabel(c)) : esc(T.designation || 'Teacher')}</p>
      ${school && dow ? `<div class="m-hero-card m-card" style="margin-bottom:0;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.14);color:#fff">
        ${cur && slot(cur) ? `<span class="pillx" style="background:var(--amber);color:var(--navy)">Now · P${cur.no}</span><b style="display:block;margin-top:6px;font-size:1.05rem;color:#fff">${esc(S.subjectName(slot(cur).subjectId))} · ${esc(S.sectionLabel(slot(cur).sectionId))}</b><span style="font-size:.78rem;color:#B6CBEB">${cur.start} – ${cur.end}</span>`
          : next ? `<span class="pillx" style="background:rgba(255,255,255,.16);color:#fff">Next · P${next.no} at ${next.start}</span><b style="display:block;margin-top:6px;font-size:1.05rem;color:#fff">${esc(S.subjectName(slot(next).subjectId))} · ${esc(S.sectionLabel(slot(next).sectionId))}</b>`
          : `<b style="color:#fff">No more periods today</b><span style="display:block;font-size:.78rem;color:#B6CBEB">See you tomorrow</span>`}</div>` : ''}
    </div>
    ${attCard}
    ${covers.map(l => { const cc = S.classOfTeacher(l.teacherId); return `<div class="m-card soft"><h3>${ico('ic-swap')} Cover duty today</h3><p style="margin:0;font-size:.86rem;color:var(--ink-70)">${esc(S.teacherName(l.teacherId))} is on leave. Please cover ${cc ? esc(S.sectionLabel(cc)) + ' and their periods' : 'their periods'}.</p></div>`; }).join('')}
    <div class="m-stats">
      <button class="m-stat" type="button" data-go="sleave">${ico('ic-leave')}<b>${waiting.length}</b><span>Leave requests</span></button>
      <button class="m-stat" type="button" data-gotab="homework">${ico('ic-book')}<b>${S.db.homework.filter(h => h.createdBy === T.id && h.assigned > S.addDays(d, -7)).length}</b><span>Posts this week</span></button>
    </div>
    ${school && dow ? `<div class="m-sec">Today's periods<button class="push" type="button" data-go="timetable">Week</button></div>
    <div class="m-card tight">${S.allPeriods().map(p => {
      if (p.isBreak) return '';
      const s = slot(p), isNow = hm >= p.start && hm < p.end;
      return `<div class="m-row${isNow ? ' now' : ''}"><span class="ic${s ? '' : ' ok'}">${ico(s ? 'ic-book' : 'ic-sparkle')}</span><div class="tx"><b>${s ? esc(S.subjectName(s.subjectId)) + ' · ' + esc(S.sectionLabel(s.sectionId)) : 'Free period'}</b><span>P${p.no} · ${p.start} – ${p.end}</span></div></div>`;
    }).join('')}</div>` : ''}
    <div class="m-sec">Notices<button class="push" type="button" data-go="notices">All</button></div>
    <div class="m-card tight">${noticeRows(S.noticesFor(audience()).slice(0, 3))}</div>`;
}
function noticeRows(list) {
  if (!list.length) return M.empty('ic-bell', 'Nothing new', '');
  return list.map(n => `<div class="m-row"><span class="ic mari">${ico(n.pinned ? 'ic-pin' : 'ic-mega')}</span><div class="tx"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><span>${esc(S.fmtShort(n.date))} · ${esc(S.audienceLabel(n))}</span></div></div>`).join('');
}

/* ============================================================
   ATTENDANCE (class teacher only)
   ============================================================ */
function pageAttendance(el) {
  const c = myClass();
  if (!c) { el.innerHTML = M.empty('ic-clipboard', 'Marked by the class teacher', 'You are not a class teacher this year.'); return; }
  el.innerHTML = `<div class="m-seg" id="atSeg"><button type="button" data-v="today" class="${ui.attView === 'today' ? 'on' : ''}">Today</button><button type="button" data-v="month" class="${ui.attView === 'month' ? 'on' : ''}">This month</button></div><div id="atBody"></div>`;
  $('#atSeg').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; ui.attView = b.dataset.v; M.render(); });
  ui.attView === 'today' ? attToday(c) : attMonth(c);
}
function attToday(c) {
  const d = today(), box = $('#atBody');
  if (!S.isSchoolDay(d)) { box.innerHTML = M.empty('ic-cal', 'No school today', 'Attendance opens on the next school day.'); return; }
  const saved = S.attendanceDay(c.id, d);
  const roster = S.rosterOf(c.id);
  if (!ui.att || ui.att.key !== c.id + d) {
    ui.att = { key: c.id + d, marks: {} };
    roster.forEach(s => { ui.att.marks[s.id] = saved && saved.marks[s.id] ? saved.marks[s.id] : (S.ackLeaveOn(s.id, d) ? 'V' : 'P'); });
  }
  const sum = () => { const n = { P: 0, A: 0, L: 0, H: 0, V: 0 }; Object.values(ui.att.marks).forEach(x => n[x]++); return n; };
  const drawSum = () => {
    const n = sum();
    $('#atSum').innerHTML = S.STATUS_ORDER.map(k => `<span class="att-chip ${S.STATUS[k].cls}">${n[k]} ${S.STATUS[k].label}</span>`).join('');
    $('#atDockTxt').textContent = `${n.P + n.L + n.H} of ${roster.length} in school · ${n.A} absent`;
  };
  box.innerHTML = `<div class="m-card"><h3>${ico('ic-users')} ${esc(S.sectionLabel(c))}<button class="push" type="button" id="atAll">All present</button></h3>
      <div class="m-sum" id="atSum"></div>
      ${saved ? `<p style="margin:.6rem 0 0;font-size:.76rem;color:var(--ok);font-weight:700">Saved at ${esc(P.timeAgo(saved.at))} — you can change it until the end of today.</p>` : ''}</div>
    <div class="m-card tight" style="margin-bottom:70px">${roster.map(s => {
      const ack = S.ackLeaveOn(s.id, d), pend = S.pendingLeaveOn(s.id, d);
      return `<div class="m-att" data-sid="${s.id}"><span class="av">${av(S.studentName(s), s.id)}<em>${s.roll}</em></span>
        <span class="nm"><b>${esc(S.studentName(s))}</b>${ack ? `<span class="flag">On leave: ${esc(ack.reason)}</span>` : pend ? '<span class="flag">Leave asked — not acknowledged</span>' : `<span>${esc(s.medical || s.admissionNo)}</span>`}</span>
        <span class="m-st">${S.STATUS_ORDER.map(k => `<button type="button" class="${S.STATUS[k].cls}${ui.att.marks[s.id] === k ? ' on' : ''}" data-code="${k}" aria-pressed="${ui.att.marks[s.id] === k}" title="${S.STATUS[k].label}">${S.STATUS[k].short}</button>`).join('')}</span></div>`;
    }).join('')}</div>`;
  M.dock(`<small id="atDockTxt"></small><button class="m-btn" type="button" id="atSave">${ico('ic-check')} ${saved ? 'Save changes' : 'Save attendance'}</button>`);
  drawSum();
  box.addEventListener('click', e => {
    const b = e.target.closest('.m-st button');
    if (b) {
      const row = b.closest('[data-sid]');
      ui.att.marks[row.dataset.sid] = b.dataset.code;
      $$('.m-st button', row).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      drawSum(); return;
    }
    if (e.target.closest('#atAll')) { Object.keys(ui.att.marks).forEach(k => { if (ui.att.marks[k] !== 'V') ui.att.marks[k] = 'P'; }); M.render(); }
  });
  $('#atSave').addEventListener('click', () => {
    S.saveAttendance(c.id, d, ui.att.marks, T.id);
    const n = sum();
    toast(`Attendance saved|${n.P + n.L + n.H} of ${roster.length} in school. Parents can see it now.`);
    M.render();
  });
}
function attMonth(c) {
  const from = today().slice(0, 8) + '01', to = today();
  const roster = S.rosterOf(c.id);
  $('#atBody').innerHTML = `<p style="font-size:.8rem;color:var(--ink-50);margin:0 4px 10px">${S.MONTHS[Number(to.slice(5, 7)) - 1]} · tap a child to see their month</p>
    <div class="m-card tight">${roster.map(s => {
      const a = S.attendanceSummary(s.id, from, to);
      return `<button class="m-row" type="button" data-cal="${s.id}"><span class="ic">${av(S.studentName(s), s.id)}</span><div class="tx"><b>${s.roll}. ${esc(S.studentName(s))}</b>
        <span>${a.A} absent · ${a.L} late · ${a.V} leave</span><div class="m-bar ${a.pct >= 90 ? 'ok' : a.pct >= 75 ? 'warn' : 'bad'}"><i style="width:${a.pct || 0}%"></i></div></div><span class="end"><b style="color:var(--navy)">${pct(a.pct)}</b></span></button>`;
    }).join('')}</div>`;
  $('#atBody').addEventListener('click', e => {
    const b = e.target.closest('[data-cal]'); if (!b) return;
    const s = S.student(b.dataset.cal), now = new Date();
    M.sheet(`<h3>${esc(S.studentName(s))}</h3><p class="sub">${S.MONTHS[now.getMonth()]} ${now.getFullYear()}</p>${P.calendarHTML(s.id, now.getFullYear(), now.getMonth())}${P.legendHTML()}
      <button class="m-btn soft" type="button" data-sheet-close style="margin-top:14px">Close</button>`);
  });
}

/* ============================================================
   HOMEWORK AND DIARY
   ============================================================ */
function hwCard(h) {
  const mine = h.createdBy === T.id, diary = h.type === 'diary';
  return `<article class="hw-card${diary ? ' diary' : ''}"><div class="hw-top">${diary ? '<span class="pillx draft">Class diary</span>' : `<span class="pillx">${esc(S.subjectName(h.subjectId))}</span>`}
    ${!diary && h.due ? `<span class="pillx ${h.due < today() ? '' : 'ok'}">Due ${esc(S.fmtShort(h.due))}</span>` : ''}
    ${mine ? `<span class="push"><button class="m-icon" style="width:32px;height:32px;border-radius:10px" type="button" data-hw-del="${h.id}" aria-label="Delete">${ico('ic-trash', 16)}</button></span>` : ''}</div>
    ${diary ? '' : `<h4>${esc(h.title)}</h4>`}<p>${esc(h.description)}</p>
    ${h.file ? `<button class="file-chip" type="button" data-toast="Opens the file in the live app|${esc(h.file)}">${ico('ic-doc', 16)} ${esc(h.file)}</button>` : ''}
    <div class="hw-meta"><span>${esc(S.teacherName(h.createdBy))}</span><span>${esc(S.fmtShort(h.assigned))}</span></div></article>`;
}
function pageHomework(el) {
  const secs = taught();
  if (!secs.length) { el.innerHTML = M.empty('ic-book', 'No classes yet', ''); return; }
  if (!secs.some(s => s.id === ui.hwSec)) ui.hwSec = (myClass() || secs[0]).id;
  const list = S.db.homework.filter(h => h.sectionId === ui.hwSec && (ui.hwType === 'all' || h.type === ui.hwType)).sort((a, b) => b.assigned.localeCompare(a.assigned) || b.createdAt.localeCompare(a.createdAt));
  let last = '';
  el.innerHTML = M.chips('hwSecs', secs.map(s => [s.id, S.sectionLabel(s)]), ui.hwSec) + M.chips('hwTypes', [['all', 'All'], ['homework', 'Homework'], ['diary', 'Diary']], ui.hwType)
    + `<div class="hw-list">${list.length ? list.map(h => { const hd = h.assigned !== last ? `<div class="day-head">${h.assigned === today() ? 'Today' : esc(S.fmtShort(h.assigned))}</div>` : ''; last = h.assigned; return hd + hwCard(h); }).join('') : M.empty('ic-book', 'Nothing posted yet', 'Tap + to post homework.')}</div>`;
  $('#hwSecs').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { ui.hwSec = b.dataset.k; M.render(); } });
  $('#hwTypes').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { ui.hwType = b.dataset.k; M.render(); } });
  el.addEventListener('click', async e => {
    const d = e.target.closest('[data-hw-del]'); if (!d) return;
    if (!(await M.confirm({ title: 'Delete this post?', text: 'Parents will no longer see it.', ok: 'Delete', danger: true }))) return;
    S.db.homework = S.db.homework.filter(h => h.id !== d.dataset.hwDel); S.save(); M.render(); toast('Post deleted', 'info');
  });
}
function homeworkSheet() {
  const secs = taught();
  M.sheet(`<h3>Post to parents</h3><p class="sub">Parents of the class see it straight away.</p>
    <div class="m-field"><label for="hs-sec">Class</label><select id="hs-sec">${secs.map(s => `<option value="${s.id}"${s.id === ui.hwSec ? ' selected' : ''}>${esc(S.sectionLabel(s))}</option>`).join('')}</select></div>
    <div class="m-seg" id="hs-type"><button type="button" data-v="homework" class="on">Homework</button><button type="button" data-v="diary">Class diary</button></div>
    <div id="hs-hw"><div class="m-field"><label for="hs-sub">Subject</label><select id="hs-sub"></select></div>
      <div class="m-field"><label for="hs-title">Title</label><input id="hs-title" maxlength="120" placeholder="Fractions — exercise 6.2" /><span class="err">Give it a short title.</span></div></div>
    <div class="m-field"><label for="hs-desc">Details for parents</label><textarea id="hs-desc" maxlength="800"></textarea><span class="err">Please write the details.</span></div>
    <div class="m-two" id="hs-more"><div class="m-field"><label for="hs-due">Due on</label><input id="hs-due" type="date" min="${today()}" value="${S.nextSchoolDay(today())}" /><span class="err">Today or later.</span></div>
      <div class="m-field"><label for="hs-file">Attach</label><input id="hs-file" type="file" accept=".pdf,image/*" style="padding:.6rem .5rem;font-size:.75rem" /></div></div>
    <button class="m-btn" type="button" id="hsSave">Post</button>`);
  let type = 'homework';
  const sync = () => {
    const sid = $('#hs-sec').value, isCT = S.section(sid).classTeacherId === T.id;
    $('#hs-type').hidden = !isCT; if (!isCT) type = 'homework';
    $$('#hs-type button').forEach(b => b.classList.toggle('on', b.dataset.v === type));
    const subs = isCT ? S.classSubjectsOf(sid) : S.subjectsTaughtIn(T.id, sid);
    $('#hs-sub').innerHTML = subs.map(cs => `<option value="${cs.subjectId}">${esc(S.subjectName(cs.subjectId))}</option>`).join('');
    $('#hs-hw').hidden = type === 'diary'; $('#hs-more').hidden = type === 'diary';
  };
  sync();
  $('#hs-sec').addEventListener('change', sync);
  $('#hs-type').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { type = b.dataset.v; sync(); } });
  $('#hsSave').addEventListener('click', () => {
    const diary = type === 'diary', title = $('#hs-title').value.trim(), desc = $('#hs-desc').value.trim(), due = $('#hs-due').value;
    if (![M.fieldBad('#hs-title', !diary && !title), M.fieldBad('#hs-desc', !desc), M.fieldBad('#hs-due', !diary && (!due || due < today()))].every(Boolean)) return;
    const f = $('#hs-file').files[0];
    const rec = { id: S.newId('hw'), sectionId: $('#hs-sec').value, type, subjectId: diary ? null : $('#hs-sub').value, title: diary ? 'Class diary' : title, description: desc, assigned: today(), due: diary ? null : due, file: f ? f.name : '', createdBy: T.id, createdAt: new Date().toISOString() };
    S.db.homework.push(rec); S.save(); M.closeSheet();
    ui.hwSec = rec.sectionId; M.render();
    toast(`${diary ? 'Diary entry' : 'Homework'} posted|Parents of ${S.sectionLabel(rec.sectionId)} can see it now.`);
  });
}

/* ============================================================
   MARKS (own subjects only)
   ============================================================ */
const myPapers = (examId, secId) => S.papersOf(examId, secId).filter(pp => S.classSubject(pp.csId).teacherId === T.id);
function pageMarks(el) {
  const exams = S.db.exams.filter(x => x.yearId === S.currentYear().id && myPapers(x.id).length).sort((a, b) => a.order - b.order);
  if (!exams.length) { el.innerHTML = M.empty('ic-chart', 'No papers to mark', 'Exams for your subjects appear here.'); return; }
  const mk = ui.mk;
  if (!exams.some(x => x.id === mk.exam)) mk.exam = (exams.find(x => !x.published) || exams[exams.length - 1]).id;
  const secs = taught().filter(s => myPapers(mk.exam, s.id).length);
  if (!secs.some(s => s.id === mk.sec)) mk.sec = secs[0].id;
  const pps = myPapers(mk.exam, mk.sec);
  if (!pps.some(p => p.id === mk.paper)) mk.paper = pps[0].id;
  const pp = S.byId('papers', mk.paper), ex = S.exam(mk.exam), locked = ex.published;
  const marks = S.marksOf(pp.id), st = S.paperStats(pp.id);
  const roster = S.rosterOf(S.classSubject(pp.csId).sectionId);
  el.innerHTML = M.chips('mkEx', exams.map(x => [x.id, x.name + (x.published ? ' ✓' : '')]), mk.exam) + M.chips('mkSec', secs.map(s => [s.id, S.sectionLabel(s)]), mk.sec)
    + (pps.length > 1 ? M.chips('mkPp', pps.map(p => [p.id, S.subjectName(S.classSubject(p.csId).subjectId)]), mk.paper) : '')
    + `<div class="m-stats"><div class="m-stat"><b>${st.entered}/${st.total}</b><span>Entered · out of ${pp.max}</span></div><div class="m-stat"><b>${st.avgPct == null ? '—' : pct(st.avgPct)}</b><span>Class average · ${st.fails} below pass</span></div></div>
    ${locked ? `<div class="m-card soft"><h3>${ico('ic-lock')} Published to parents</h3><p style="margin:0;font-size:.84rem;color:var(--ink-70)">Marks can't be changed now. Ask the office to unpublish if a mark is wrong.</p></div>` : ''}
    <div class="m-card tight" style="margin-bottom:${locked ? 12 : 80}px" id="mkList">${roster.map(s => {
      const r = marks[s.id];
      return `<div class="m-mark" data-sid="${s.id}"><span class="av">${av(S.studentName(s), s.id)}</span>
        <div><b>${s.roll}. ${esc(S.studentName(s))}</b><small><label><input type="checkbox" class="ab"${r && r.absent ? ' checked' : ''}${locked ? ' disabled' : ''} /> Absent</label><span class="g"></span></small></div>
        <input class="num" type="number" inputmode="numeric" min="0" max="${pp.max}" value="${r && !r.absent && r.m != null ? r.m : ''}" aria-label="Marks for ${esc(S.studentName(s))}"${locked || (r && r.absent) ? ' disabled' : ''} /></div>`;
    }).join('')}</div>`;
  const row = rw => {
    const inp = $('.num', rw), ab = $('.ab', rw), g = $('.g', rw);
    inp.disabled = ab.checked || locked; if (ab.checked) inp.value = '';
    const v = inp.value.trim(), n = Number(v), bad = v !== '' && (!Number.isInteger(n) || n < 0 || n > pp.max);
    rw.classList.toggle('bad', bad);
    if (ab.checked) { g.textContent = 'Absent'; g.className = 'g fail'; return; }
    if (v === '' || bad) { g.textContent = bad ? `0–${pp.max}` : ''; g.className = 'g' + (bad ? ' fail' : ''); return; }
    const p = Math.round(n / pp.max * 1000) / 10;
    g.textContent = `${p}% · ${S.gradeFor(p)}`; g.className = 'g' + (n < pp.pass ? ' fail' : '');
  };
  $$('#mkList .m-mark').forEach(row);
  ['mkEx', 'mkSec', 'mkPp'].forEach(id => { const c = $('#' + id); if (c) c.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; if (id === 'mkEx') { mk.exam = b.dataset.k; mk.paper = null; } if (id === 'mkSec') { mk.sec = b.dataset.k; mk.paper = null; } if (id === 'mkPp') mk.paper = b.dataset.k; M.render(); }); });
  $('#mkList').addEventListener('input', e => { const r = e.target.closest('.m-mark'); if (r) row(r); });
  $('#mkList').addEventListener('change', e => { const r = e.target.closest('.m-mark'); if (r) row(r); });
  if (locked) return;
  M.dock(`<button class="m-btn" type="button" id="mkSave">${ico('ic-check')} Save marks</button>`);
  $('#mkSave').addEventListener('click', () => {
    const rows = $$('#mkList .m-mark');
    if (rows.some(r => r.classList.contains('bad'))) { toast(`Check the marks in red|Whole numbers from 0 to ${pp.max}.`, 'warn'); return; }
    const out = {};
    rows.forEach(r => { const ab = $('.ab', r).checked, v = $('.num', r).value.trim(); if (ab) out[r.dataset.sid] = { m: null, absent: true }; else if (v !== '') out[r.dataset.sid] = { m: Number(v), absent: false }; });
    S.db.marks[pp.id] = out; S.save();
    toast(`Marks saved|${Object.keys(out).length} of ${rows.length} entered. Parents see them after the office publishes.`);
    M.render();
  });
}

/* ============================================================
   MORE
   ============================================================ */
function pageMore(el) {
  const c = myClass(), w = pendingLeaves().length;
  const item = (go, icon, cls, label, sub, badge) => `<button class="m-row" type="button" data-go="${go}"><span class="ic ${cls}">${ico(icon)}</span><div class="tx"><b>${esc(label)}</b><span>${esc(sub)}</span></div><span class="end">${badge ? `<span class="pillx draft">${badge}</span>` : ''}${ico('ic-chev-r', 16)}</span></button>`;
  el.innerHTML = `<div class="m-card" style="display:flex;gap:12px;align-items:center"><span class="m-av" style="width:56px;height:56px;border-radius:18px;font-size:1rem">${esc(S.initials(T.name))}</span>
      <div><b style="color:var(--navy)">${esc(T.name)}</b><span style="display:block;font-size:.78rem;color:var(--ink-50)">${c ? 'Class teacher · ' + esc(S.sectionLabel(c)) : esc(T.designation || '')}</span></div></div>
    <div class="m-sec">Teaching</div><div class="m-card tight">
      ${item('classes', 'ic-users', '', 'My classes', taught().map(S.sectionLabel).join(', '))}
      ${item('remarks', 'ic-msg', 'ok', 'Remarks', 'Notes about a child for the parents')}
      ${item('sleave', 'ic-leave', 'warn', 'Leave from parents', c ? 'For ' + S.sectionLabel(c) : 'For class teachers', w || '')}
      ${item('timetable', 'ic-table', 'violet', 'Timetable', 'Your week')}</div>
    <div class="m-sec">Me</div><div class="m-card tight">
      ${item('myleave', 'ic-cal', 'mari', 'My leave', S.leaveBalance(T.id).map(b => `${b.type.split(' ')[0]} ${b.left}`).join(' · '))}
      ${item('notices', 'ic-mega', '', 'Notices & documents', 'For teachers and your classes')}
      ${item('account', 'ic-key', '', 'Account & password', session().user.loginId)}</div>
    <button class="m-btn ghost" type="button" data-signout style="margin-top:6px">${ico('ic-logout')} Sign out</button>
    <p style="text-align:center;font-size:.74rem;color:var(--ink-50);margin-top:12px">Christina School app · prototype</p>`;
}
const session = () => M.session;

function pageClasses(el) {
  const secs = taught();
  if (!secs.some(s => s.id === ui.clsSec)) ui.clsSec = (myClass() || secs[0]).id;
  const sec = S.section(ui.clsSec), own = sec.classTeacherId === T.id;
  el.innerHTML = M.chips('clsC', secs.map(s => [s.id, S.sectionLabel(s) + (s.classTeacherId === T.id ? ' ★' : '')]), ui.clsSec)
    + `<div class="m-card soft"><b style="color:var(--navy)">${esc(S.sectionLabel(sec))} · ${esc(sec.room || '')}</b><span style="display:block;font-size:.78rem;color:var(--ink-70)">Class teacher: ${esc(S.teacherName(sec.classTeacherId))} · ${own ? 'your class' : 'you teach ' + S.subjectsTaughtIn(T.id, sec.id).map(cs => S.subjectName(cs.subjectId)).join(', ')}</span></div>
    <div class="m-card tight">${S.rosterOf(sec.id).map(s => `<button class="m-row" type="button" data-go="student|${s.id}"><span class="ic">${av(S.studentName(s), s.id)}</span><div class="tx"><b>${s.roll}. ${esc(S.studentName(s))}</b><span>${esc(s.admissionNo)}${own && s.medical ? ' · ⚕ ' + esc(s.medical) : ''}</span></div><span class="end">${ico('ic-chev-r', 16)}</span></button>`).join('')}</div>`;
  $('#clsC').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { ui.clsSec = b.dataset.k; M.render(); } });
}
function pageStudent(el, p) {
  const s = S.student(p.id), sec = S.sectionOfStudent(s.id);
  // Only students in a class this teacher teaches.
  if (!sec || !taught().some(x => x.id === sec.id)) { el.innerHTML = M.empty('ic-lock', 'Not your class', ''); return; }
  const own = sec.classTeacherId === T.id, f = S.family(s.familyId);
  const m = S.attendanceSummary(s.id, today().slice(0, 8) + '01', today()), y = S.attendanceSummary(s.id, S.currentYear().start, today());
  const rms = S.db.remarks.filter(r => r.studentId === s.id && (own || r.by === T.id)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  el.innerHTML = `<div class="m-card" style="text-align:center"><span class="m-av" style="width:76px;height:76px;border-radius:24px;margin:0 auto 8px">${av(S.studentName(s), s.id)}</span>
      <b style="font-size:1.1rem;color:var(--navy)">${esc(S.studentName(s))}</b><span style="display:block;font-size:.8rem;color:var(--ink-50)">${esc(S.sectionLabel(sec))} · Roll ${S.enrollmentOf(s.id).roll} · ${esc(s.admissionNo)}</span></div>
    <div class="m-stats"><div class="m-stat"><b>${pct(m.pct)}</b><span>This month</span></div><div class="m-stat"><b>${pct(y.pct)}</b><span>This year</span></div></div>
    <div class="m-card tight">
      <div class="m-row"><div class="tx"><span>Date of birth</span><b>${esc(S.fmtDate(s.dob))} · ${esc(s.gender)} · ${esc(s.bloodGroup || '')}</b></div></div>
      ${own ? `<div class="m-row"><div class="tx"><span>Father</span><b>${esc(f.fatherName)}</b></div><span class="end"><a class="m-btn sm soft" href="tel:${esc(f.fatherPhone)}">${ico('ic-phone', 16)} Call</a></span></div>
      <div class="m-row"><div class="tx"><span>Mother</span><b>${esc(f.motherName)}</b></div><span class="end"><a class="m-btn sm soft" href="tel:${esc(f.motherPhone)}">${ico('ic-phone', 16)} Call</a></span></div>
      <div class="m-row"><div class="tx"><span>Medical notes</span><b>${esc(s.medical || 'None')}</b></div></div>` : '<div class="m-row"><div class="tx"><span>Phone numbers and medical notes are shown to the class teacher only.</span></div></div>'}</div>
    <div class="m-sec">Remarks<button class="push" type="button" id="stRm">+ Write</button></div>
    <div class="m-card tight">${rms.length ? rms.map(remarkRow).join('') : M.empty('ic-msg', 'No remarks yet', '')}</div>`;
  $('#stRm').addEventListener('click', () => remarkSheet(sec.id, s.id));
}
function remarkRow(r) {
  const [i, c] = remarkIcon(r.type);
  return `<div class="m-row"><span class="ic ${c}">${ico(i)}</span><div class="tx"><b>${esc(S.studentName(r.studentId))} · ${esc(S.REMARK_TYPES[r.type])}</b><p>${esc(r.text)}</p><span>${esc(S.fmtShort(r.date))} · ${esc(S.teacherName(r.by))}</span></div></div>`;
}
function pageRemarks(el) {
  const secs = taught();
  if (!secs.some(s => s.id === ui.rmSec)) ui.rmSec = (myClass() || secs[0]).id;
  const sec = S.section(ui.rmSec), own = sec.classTeacherId === T.id;
  const ids = new Set(S.rosterOf(sec.id).map(s => s.id));
  const list = S.db.remarks.filter(r => ids.has(r.studentId) && (own || r.by === T.id)).sort((a, b) => b.date.localeCompare(a.date));
  el.innerHTML = M.chips('rmC', secs.map(s => [s.id, S.sectionLabel(s)]), ui.rmSec) + `<div class="m-card tight">${list.length ? list.map(remarkRow).join('') : M.empty('ic-msg', 'No remarks yet', 'Tap + to write one.')}</div>`;
  $('#rmC').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { ui.rmSec = b.dataset.k; M.render(); } });
}
function remarkSheet(secId, sid) {
  M.sheet(`<h3>Write a remark</h3><p class="sub">${esc(S.sectionLabel(secId))} · the child's parents will see it.</p>
    <div class="m-field"><label for="rs-stu">Student</label><select id="rs-stu">${S.rosterOf(secId).map(s => `<option value="${s.id}"${s.id === sid ? ' selected' : ''}>${s.roll}. ${esc(S.studentName(s))}</option>`).join('')}</select></div>
    <div class="m-seg" id="rs-type">${Object.entries(S.REMARK_TYPES).map(([k, v], i) => `<button type="button" data-v="${k}" class="${i ? '' : 'on'}">${v}</button>`).join('')}</div>
    <div class="m-field"><label for="rs-text">Remark</label><textarea id="rs-text" maxlength="500"></textarea><span class="err">Please write the remark.</span></div>
    <button class="m-btn" type="button" id="rsSave">Save remark</button>`);
  let type = 'appreciation';
  $('#rs-type').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; type = b.dataset.v; $$('#rs-type button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#rsSave').addEventListener('click', () => {
    const text = $('#rs-text').value.trim();
    if (!M.fieldBad('#rs-text', !text)) return;
    const st = $('#rs-stu').value;
    S.db.remarks.push({ id: S.newId('rm'), studentId: st, type, text, by: T.id, date: today() }); S.save();
    M.closeSheet(); M.render(); toast(`Remark saved|${S.student(st).firstName}'s parents can read it now.`);
  });
}
function pageStudentLeave(el) {
  const c = myClass();
  if (!c) { el.innerHTML = M.empty('ic-leave', 'For class teachers', 'Parents send leave requests to the class teacher.'); return; }
  const ids = new Set(S.rosterOf(c.id).map(s => s.id));
  const list = S.db.studentLeaves.filter(l => ids.has(l.studentId) && (ui.slTab === 'all' || l.status === ui.slTab)).sort((a, b) => b.from.localeCompare(a.from));
  el.innerHTML = `<div class="m-seg" id="slSeg"><button type="button" data-v="sent" class="${ui.slTab === 'sent' ? 'on' : ''}">Waiting</button><button type="button" data-v="ack" class="${ui.slTab === 'ack' ? 'on' : ''}">Seen</button><button type="button" data-v="all" class="${ui.slTab === 'all' ? 'on' : ''}">All</button></div>
    <div class="m-card tight">${list.length ? list.map(l => `<div class="m-row"><span class="ic ${l.status === 'sent' ? 'warn' : 'ok'}">${ico('ic-leave')}</span><div class="tx"><b>${esc(S.studentName(l.studentId))}</b><p>${esc(l.reason)}</p><span>${esc(dateRange(l.from, l.to))} · ${daysBetween(l.from, l.to)} day(s)</span>
      ${l.status === 'sent' ? `<button class="m-btn sm" type="button" data-ack="${l.id}" style="margin-top:8px">${ico('ic-check', 16)} Acknowledge</button>` : ''}</div><span class="end">${leavePill(l.status)}</span></div>`).join('') : M.empty('ic-check-circle', 'All caught up', '')}</div>`;
  $('#slSeg').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { ui.slTab = b.dataset.v; M.render(); } });
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-ack]'); if (!b) return;
    const l = S.db.studentLeaves.find(x => x.id === b.dataset.ack);
    l.status = 'ack'; l.ackBy = T.id; l.ackAt = new Date().toISOString(); S.save();
    toast(`Leave acknowledged|${S.student(l.studentId).firstName} is filled in as "On leave".`); M.render();
  });
}
function pageTimetable(el) {
  const dow = S.dayOfWeek(today());
  if (!ui.ttDay) ui.ttDay = dow >= 1 && dow <= 6 ? dow : 1;
  const c = myClass();
  el.innerHTML = (c ? `<div class="m-seg" id="ttW"><button type="button" data-v="mine" class="${ui.ttWhose === 'mine' ? 'on' : ''}">My periods</button><button type="button" data-v="class" class="${ui.ttWhose === 'class' ? 'on' : ''}">${esc(S.sectionLabel(c))}</button></div>` : '')
    + M.chips('ttD', [1, 2, 3, 4, 5, 6].map(d => [String(d), S.DAYS[d].slice(0, 3) + (d === dow ? ' •' : '')]), String(ui.ttDay))
    + `<div class="m-card">${S.allPeriods().map(p => {
      if (p.isBreak) return `<div class="m-period"><span class="t">${p.start}</span><span class="s brk">${esc(p.label)}</span></div>`;
      let b = '', sp = '', free = false;
      if (ui.ttWhose === 'class' && c) { const t = S.ttEntry(c.id, ui.ttDay, p.id), cs = t && t.csId && S.classSubject(t.csId); if (cs) { b = S.subjectName(cs.subjectId); sp = S.teacherName(cs.teacherId); } else { b = 'Library / games'; free = true; } }
      else { const s = S.teacherSlot(T.id, ui.ttDay, p.id); if (s) { b = S.subjectName(s.subjectId); sp = S.sectionLabel(s.sectionId); } else { b = 'Free'; free = true; } }
      return `<div class="m-period"><span class="t"><b>P${p.no}</b>${p.start}</span><span class="s${free ? ' free' : ''}"><b>${esc(b)}</b>${sp ? `<span>${esc(sp)}</span>` : ''}</span></div>`;
    }).join('')}</div>`;
  $('#ttD').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { ui.ttDay = Number(b.dataset.k); M.render(); } });
  if ($('#ttW')) $('#ttW').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { ui.ttWhose = b.dataset.v; M.render(); } });
}
function pageMyLeave(el) {
  const list = S.db.staffLeaves.filter(l => l.teacherId === T.id).sort((a, b) => b.from.localeCompare(a.from));
  el.innerHTML = `<div class="m-stats">${S.leaveBalance(T.id).map(b => `<div class="m-stat"><b>${b.left}</b><span>${esc(b.type)} left of ${b.allowed}</span></div>`).join('')}</div>
    <div class="m-card tight">${list.length ? list.map(l => `<div class="m-row"><span class="ic ${l.status === 'approved' ? 'ok' : l.status === 'rejected' ? 'bad' : 'warn'}">${ico('ic-leave')}</span><div class="tx"><b>${esc(l.type)}</b><p>${esc(l.reason)}</p><span>${esc(dateRange(l.from, l.to))}${l.note ? ' · Office: ' + esc(l.note) : ''}${l.coverId ? ' · Cover: ' + esc(S.teacherName(l.coverId)) : ''}</span>
      ${l.status === 'pending' ? `<button class="m-btn sm soft" type="button" data-cancel="${l.id}" style="margin-top:8px">Cancel request</button>` : ''}</div><span class="end">${leavePill(l.status)}</span></div>`).join('') : M.empty('ic-leave', 'No leave requested', 'Tap + to ask for leave.')}</div>`;
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-cancel]'); if (!b) return;
    if (!(await M.confirm({ title: 'Cancel this request?', ok: 'Cancel request', danger: true }))) return;
    S.db.staffLeaves.find(l => l.id === b.dataset.cancel).status = 'cancelled'; S.save(); M.render();
  });
}
function leaveSheet() {
  const start = S.nextSchoolDay(today());
  M.sheet(`<h3>Ask for leave</h3><p class="sub">The office approves it and arranges cover.</p>
    <div class="m-field"><label for="ls-type">Type</label><select id="ls-type">${S.STAFF_LEAVE_TYPES.map(t => { const b = S.leaveBalance(T.id).find(x => x.type === t); return `<option value="${esc(t)}">${esc(t)}${b ? ` (${b.left} left)` : ''}</option>`; }).join('')}</select></div>
    <div class="m-two"><div class="m-field"><label for="ls-from">From</label><input id="ls-from" type="date" min="${today()}" value="${start}" /><span class="err">From today on.</span></div>
    <div class="m-field"><label for="ls-to">To</label><input id="ls-to" type="date" min="${today()}" value="${start}" /><span class="err">Not before the start.</span></div></div>
    <div class="m-field"><label for="ls-reason">Reason</label><textarea id="ls-reason" maxlength="300"></textarea><span class="err">Please give a reason.</span></div>
    <button class="m-btn" type="button" id="lsSave">Send to the office</button>`);
  $('#lsSave').addEventListener('click', () => {
    const from = $('#ls-from').value, to = $('#ls-to').value, reason = $('#ls-reason').value.trim();
    if (![M.fieldBad('#ls-from', !from || from < today()), M.fieldBad('#ls-to', !to || to < from), M.fieldBad('#ls-reason', !reason)].every(Boolean)) return;
    S.db.staffLeaves.push({ id: S.newId('tl'), teacherId: T.id, type: $('#ls-type').value, from, to, reason, status: 'pending', createdAt: today(), decidedAt: null, note: '' });
    S.save(); M.closeSheet(); M.render(); toast(`Leave request sent|${dateRange(from, to)} · the office will reply here.`);
  });
}
function pageNotices(el) {
  const docs = S.documentsFor(audience());
  el.innerHTML = `<div class="m-card tight">${noticeRows(S.noticesFor(audience()))}</div><div class="m-sec">Documents</div>
    <div class="m-card tight">${docs.length ? docs.map(d => `<button class="m-row" type="button" data-toast="Download starts in the live app|${esc(d.file)}"><span class="ic mari">${ico('ic-doc')}</span><div class="tx"><b>${esc(d.title)}</b><span>${esc(d.file)} · ${esc(d.size)}</span></div><span class="end">${ico('ic-arrow-u', 16)}</span></button>`).join('') : M.empty('ic-doc', 'No documents', '')}</div>`;
}
function accountPage(el, rows) {
  el.innerHTML = `<div class="m-card tight">${rows.map(([k, v]) => `<div class="m-row"><div class="tx"><span>${esc(k)}</span><b>${esc(v || '—')}</b></div></div>`).join('')}</div>
    <button class="m-btn" type="button" id="acPw">${ico('ic-key')} Change password</button>
    <button class="m-btn ghost" type="button" id="acReset" style="margin-top:8px">${ico('ic-refresh')} Reset demo data</button>
    <button class="m-btn ghost" type="button" data-signout style="margin-top:8px">${ico('ic-logout')} Sign out</button>`;
  $('#acPw').addEventListener('click', () => {
    const u = M.session.user;
    M.sheet(`<h3>Change password</h3>
      <div class="m-field"><label for="cp0">Current password</label><input id="cp0" type="password" autocomplete="current-password" /><span class="err">That is not your current password.</span></div>
      <div class="m-field"><label for="cp1">New password</label><input id="cp1" type="password" autocomplete="new-password" /><span class="err">At least 8 characters, different from your login name.</span></div>
      <div class="m-field"><label for="cp2">Type it again</label><input id="cp2" type="password" autocomplete="new-password" /><span class="err">The two passwords do not match.</span></div>
      <button class="m-btn" type="button" id="cpSave">Save</button>`);
    $('#cpSave').addEventListener('click', () => {
      const a = $('#cp1').value;
      if (![M.fieldBad('#cp0', $('#cp0').value !== u.password), M.fieldBad('#cp1', a.length < 8 || a.toLowerCase() === u.loginId.toLowerCase()), M.fieldBad('#cp2', a !== $('#cp2').value)].every(Boolean)) return;
      u.password = a; S.save(); M.closeSheet(); toast('Password changed');
    });
  });
  $('#acReset').addEventListener('click', async () => {
    if (!(await M.confirm({ title: 'Reset the demo data?', text: 'All changes in the app, portals and office screens go back to the sample data.', ok: 'Reset', danger: true }))) return;
    S.reset(); window.location.reload();
  });
}
window.MAccountPage = accountPage;   // the parent app uses the same account screen

M.define('teacher', {
  cls: 'm-teacher',
  init(s) { T = S.teacher(s.refId); ui.att = null; },
  tabs: [{ key: 'today', label: 'Today', icon: 'ic-home' }, { key: 'attendance', label: 'Attendance', icon: 'ic-clipboard' }, { key: 'homework', label: 'Homework', icon: 'ic-book' }, { key: 'marks', label: 'Marks', icon: 'ic-chart' }, { key: 'more', label: 'More', icon: 'ic-grid' }],
  headRight: () => `<button class="m-icon" type="button" data-go="notices" aria-label="Notices">${ico('ic-bell')}</button><button class="m-av" type="button" data-go="account" aria-label="My account">${esc(S.initials(T.name))}</button>`,
  badges: () => { const c = myClass(), d = today(); return { attendance: c && S.isSchoolDay(d) && !S.attendanceDay(c.id, d) ? '!' : 0, more: pendingLeaves().length }; },
  pages: {
    today: { title: 'Christina', sub: 'Teacher', dark: true, render: pageToday },
    attendance: { title: 'Attendance', sub: () => myClass() ? S.sectionLabel(myClass()) + ' · ' + S.fmtShort(today()) : '', render: pageAttendance },
    homework: { title: 'Homework & diary', render: pageHomework, fab: { label: 'Post homework', onClick: homeworkSheet } },
    marks: { title: 'Marks', sub: 'Your subjects only', render: pageMarks },
    more: { title: 'More', render: pageMore },
    classes: { title: 'My classes', tab: 'more', render: pageClasses },
    student: { title: 'Student', tab: 'more', render: pageStudent },
    remarks: { title: 'Remarks', tab: 'more', render: pageRemarks, fab: { label: 'Write a remark', onClick: () => remarkSheet(ui.rmSec || (myClass() || taught()[0]).id) } },
    sleave: { title: 'Leave from parents', tab: 'more', render: pageStudentLeave },
    timetable: { title: 'Timetable', tab: 'more', render: pageTimetable },
    myleave: { title: 'My leave', tab: 'more', render: pageMyLeave, fab: { label: 'Ask for leave', onClick: leaveSheet } },
    notices: { title: 'Notices', tab: 'more', render: pageNotices },
    account: { title: 'My account', tab: 'more', render: el => accountPage(el, [['Name', T.name], ['Designation', T.designation], ['Class teacher of', myClass() ? S.sectionLabel(myClass()) : 'No class'], ['Login name', M.session.user.loginId], ['Phone', T.phone]]) }
  }
});
})();
