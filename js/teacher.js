/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Teacher portal
   A class teacher marks daily attendance for their own class.
   Subject teachers post homework, enter marks and write remarks for
   the classes they teach. Medical notes and family phone numbers are
   shown only for the teacher's own class.
   ============================================================ */
'use strict';
(function () {
const { $, $$, esc, toast } = window.App;
const S = window.SchoolDB;
const P = window.Portal;
const { av, ico, chip, leavePill, remarkIcon, emptyState, dateRange, daysBetween, pct } = P;

/* ---------- who is signed in ---------- */
const me = () => S.teacher(P.session.refId);
const myClass = () => S.classOfTeacher(me().id);
const taught = () => S.sectionsTaughtBy(me().id);
const audience = () => {
  const secs = taught();
  return { role: 'teacher', sectionIds: secs.map(s => s.id), gradeIds: [...new Set(secs.map(s => s.gradeId))] };
};
const today = () => S.todayISO();
const opts = (list, val, label, value) => list.map(x => {
  const v = value ? value(x) : x.id;
  return `<option value="${esc(v)}"${v === val ? ' selected' : ''}>${esc(label(x))}</option>`;
}).join('');
const pendingLeaves = () => {
  const cls = myClass();
  if (!cls) return [];
  const ids = new Set(S.rosterOf(cls.id).map(s => s.id));
  return S.db.studentLeaves.filter(l => ids.has(l.studentId) && l.status === 'sent');
};

/* UI choices kept while moving between screens */
const ui = {
  cls: null,                                   // classes screen
  att: { tab: 'mark', date: null, month: null, draft: null, key: null },
  hw: { sec: null, type: 'all' },
  mk: { exam: null, sec: null, paper: null },
  rm: { sec: null, type: 'all' },
  sl: 'sent'
};

/* ============================================================
   HOME
   ============================================================ */
function initHome() {
  const T = me(), cls = myClass(), d = today(), school = S.isSchoolDay(d);

  // what needs doing today
  let alert = '';
  if (!school) {
    const h = S.holidayOn(d);
    alert = `<div class="alert">${ico('ic-cal')}<div><b>No school today</b>${esc(h ? h.name : 'Weekly holiday')}. The next school day is ${esc(S.fmtShort(S.nextSchoolDay(d)))}.</div></div>`;
  } else if (cls && !S.attendanceDay(cls.id, d)) {
    alert = `<div class="alert warn">${ico('ic-clipboard')}<div><b>Attendance for ${esc(S.sectionLabel(cls))} is not marked yet</b>Mark it before 10 am so the office can follow up absences.</div>
      <span class="push"><button class="btn btn-primary btn-sm" type="button" data-go="attendance">Mark attendance</button></span></div>`;
  } else if (cls) {
    const sm = S.sectionDaySummary(cls.id, d), day = S.attendanceDay(cls.id, d);
    alert = `<div class="alert ok">${ico('ic-check-circle')}<div><b>Attendance marked at ${esc(P.timeAgo(day.at))}</b>${sm.P + sm.L + sm.H} of ${sm.total} children are in school today.</div>
      <span class="push"><button class="btn btn-soft btn-sm" type="button" data-go="attendance">Review</button></span></div>`;
  }
  const covers = school ? S.coverDutiesOn(T.id, d) : [];
  covers.forEach(l => {
    const c = S.classOfTeacher(l.teacherId);
    alert += `<div class="alert">${ico('ic-swap')}<div><b>Cover duty today</b>${esc(S.teacherName(l.teacherId))} is on leave. The office has asked you to cover ${c ? esc(S.sectionLabel(c)) + ' and their periods' : 'their periods'}${c && !S.attendanceDay(c.id, d) ? ' — including attendance' : ''}.</div></div>`;
  });
  $('#tAlert').innerHTML = alert;

  // numbers
  const sm = cls && S.sectionDaySummary(cls.id, d);
  const weekAgo = S.addDays(d, -7);
  const posted = S.db.homework.filter(h => h.createdBy === T.id && h.assigned > weekAgo).length;
  const waiting = pendingLeaves().length;
  $('#tKpis').innerHTML = `
    <div class="kpi"><span class="ic">${ico('ic-users')}</span><b>${cls ? S.rosterOf(cls.id).length : taught().length}</b><span>${cls ? 'Children in ' + esc(S.sectionLabel(cls)) : 'Classes you teach'}</span></div>
    <div class="kpi"><span class="ic ok">${ico('ic-check-circle')}</span><b>${sm ? pct(sm.pct) : '—'}</b><span>Present today</span>${sm ? '' : `<small>${school ? 'Not marked yet' : 'No school today'}</small>`}</div>
    <div class="kpi"><span class="ic mari">${ico('ic-book')}</span><b>${posted}</b><span>Homework posted this week</span></div>
    <div class="kpi"><span class="ic warn">${ico('ic-leave')}</span><b>${waiting}</b><span>Leave requests waiting</span></div>`;

  // today's periods
  const dow = S.dayOfWeek(d);
  $('#tTodayLbl').textContent = S.fmtShort(d);
  if (dow === 0 || !school) {
    $('#tPeriods').innerHTML = emptyState('ic-sparkle', 'No periods today', 'Enjoy the day off.');
  } else {
    const now = new Date(), hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    $('#tPeriods').innerHTML = `<div class="lst">${S.allPeriods().map(p => {
      const isNow = hm >= p.start && hm < p.end;
      if (p.isBreak) return `<div class="li${isNow ? ' now' : ''}"><span class="lic mari">${ico('ic-clock')}</span><div class="lb"><b>${esc(p.label)}</b><span class="meta">${p.start} – ${p.end}</span></div></div>`;
      const slot = S.teacherSlot(T.id, dow, p.id);
      return `<div class="li${isNow ? ' now' : ''}"><span class="lic${slot ? '' : ' ok'}">${slot ? ico('ic-book') : ico('ic-sparkle')}</span>
        <div class="lb"><b>${slot ? esc(S.subjectName(slot.subjectId)) + ' · ' + esc(S.sectionLabel(slot.sectionId)) : 'Free period'}</b><span class="meta">Period ${p.no} · ${p.start} – ${p.end}</span></div>
        ${isNow ? '<div class="lr"><span class="pillx info">Now</span></div>' : ''}</div>`;
    }).join('')}</div>`;
  }

  // leave from parents
  const lv = pendingLeaves().sort((a, b) => a.from.localeCompare(b.from)).slice(0, 4);
  $('#tLeaves').innerHTML = !cls
    ? emptyState('ic-leave', 'Only for class teachers', 'Leave requests go to the class teacher.')
    : lv.length ? `<div class="lst">${lv.map(leaveRow).join('')}</div>` : emptyState('ic-check-circle', 'All caught up', 'No leave requests are waiting.');

  $('#tNotices').innerHTML = P.noticeList(S.noticesFor(audience()), 3);

  const mine = S.db.staffLeaves.filter(l => l.teacherId === T.id).sort((a, b) => b.from.localeCompare(a.from)).slice(0, 3);
  $('#tMyLeave').innerHTML = mine.length ? `<div class="lst">${mine.map(l => `<div class="li"><span class="lic">${ico('ic-leave')}</span>
    <div class="lb"><b>${esc(l.type)}</b><span class="meta">${esc(dateRange(l.from, l.to))}${l.note ? ' · ' + esc(l.note) : ''}</span></div><div class="lr">${leavePill(l.status)}</div></div>`).join('')}</div>`
    : emptyState('ic-leave', 'No leave requested', '');
  $('#tLeaves').addEventListener('click', onLeaveClick);
}

/* ============================================================
   STUDENT LEAVE (from parents)
   ============================================================ */
function leaveRow(l) {
  const st = S.student(l.studentId);
  const e = S.enrollmentOf(l.studentId);
  const days = daysBetween(l.from, l.to);
  return `<div class="li"><span class="lic ${l.status === 'sent' ? 'warn' : l.status === 'ack' ? 'ok' : ''}">${ico('ic-leave')}</span>
    <div class="lb"><b>${esc(S.studentName(st))} <span class="muted" style="font-weight:600">· Roll ${e ? e.roll : '—'}</span></b>
      <p>${esc(l.reason)}</p>
      <span class="meta">${esc(dateRange(l.from, l.to))} · ${days} school day${days === 1 ? '' : 's'} · sent ${esc(S.fmtShort(l.createdAt.slice(0, 10)))}${l.ackAt ? ' · acknowledged ' + esc(S.fmtShort(l.ackAt.slice(0, 10))) : ''}</span></div>
    <div class="lr">${leavePill(l.status)}${l.status === 'sent' ? `<button class="btn btn-primary btn-sm" type="button" data-ack="${l.id}">${ico('ic-check', 16)} Acknowledge</button>` : ''}</div></div>`;
}
function onLeaveClick(e) {
  const b = e.target.closest('[data-ack]');
  if (!b) return;
  const l = S.db.studentLeaves.find(x => x.id === b.dataset.ack);
  if (!l) return;
  l.status = 'ack'; l.ackBy = me().id; l.ackAt = new Date().toISOString();
  S.save();
  toast(`Leave acknowledged|${S.student(l.studentId).firstName} will be filled in as "On leave" for ${dateRange(l.from, l.to)}.`);
  P.refreshCounts();
  P.reload();
}
function initStudentLeave() {
  const cls = myClass();
  const seg = $('#slSeg');
  $$('#slSeg button').forEach(b => b.classList.toggle('on', b.dataset.st === ui.sl));
  const render = () => {
    if (!cls) { $('#slList').innerHTML = emptyState('ic-leave', 'Only for class teachers', 'Parents send leave requests to their child\'s class teacher.'); return; }
    const ids = new Set(S.rosterOf(cls.id, { includeLeft: true }).map(s => s.id));
    const list = S.db.studentLeaves.filter(l => ids.has(l.studentId) && (ui.sl === 'all' || l.status === ui.sl))
      .sort((a, b) => ui.sl === 'sent' ? a.from.localeCompare(b.from) : b.from.localeCompare(a.from));
    $('#slList').innerHTML = list.length ? `<div class="lst">${list.map(leaveRow).join('')}</div>`
      : emptyState('ic-check-circle', ui.sl === 'sent' ? 'No requests waiting' : 'Nothing here yet', '');
  };
  seg.addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    ui.sl = b.dataset.st;
    $$('#slSeg button').forEach(x => x.classList.toggle('on', x === b));
    render();
  });
  $('#slList').addEventListener('click', onLeaveClick);
  render();
}

/* ============================================================
   MY CLASSES
   ============================================================ */
function initClasses() {
  const secs = taught();
  if (!secs.length) { $('#clsInfo').innerHTML = emptyState('ic-users', 'No classes yet', 'The office has not given you any classes this year.'); return; }
  if (!ui.cls || !secs.some(s => s.id === ui.cls)) ui.cls = (myClass() || secs[0]).id;
  $('#clsSeg').innerHTML = secs.map(s => `<button type="button" data-sec="${s.id}" class="${s.id === ui.cls ? 'on' : ''}">${esc(S.sectionLabel(s))}${myClass() && myClass().id === s.id ? ' ★' : ''}</button>`).join('');

  const render = () => {
    const sec = S.section(ui.cls);
    const own = sec.classTeacherId === me().id;
    const roster = S.rosterOf(sec.id);
    const q = ($('#clsSearch').value || '').trim().toLowerCase();
    const list = roster.filter(s => !q || (s.firstName + ' ' + s.lastName + ' ' + s.admissionNo).toLowerCase().includes(q));
    const subs = S.classSubjectsOf(sec.id);
    const sm = S.sectionDaySummary(sec.id, today());
    $('#clsInfo').innerHTML = `
      <div class="ph-head"><h3>${ico('ic-users')} ${esc(S.sectionLabel(sec))} <span class="muted" style="font-weight:600;font-size:.9rem">· ${esc(sec.room || '')}</span></h3>
        <span class="push">${own ? '<span class="pillx ok">Your class</span>' : '<span class="pillx info">You teach a subject here</span>'}</span></div>
      <div class="prof-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        <div><span>Class teacher</span><b>${esc(S.teacherName(sec.classTeacherId))}</b></div>
        <div><span>Children</span><b>${roster.length}</b></div>
        <div><span>Present today</span><b>${sm ? pct(sm.pct) : 'Not marked'}</b></div>
      </div>
      <div class="att-sum" style="margin-top:1rem">${subs.map(cs => `<span class="pillx ${cs.teacherId === me().id ? 'ok' : 'grey'}" title="${esc(S.teacherName(cs.teacherId))}">${esc(S.subjectName(cs.subjectId))} · ${esc(S.teacherName(cs.teacherId).replace(/^(Mr|Ms|Mrs)\.\s*/, ''))}</span>`).join('')}</div>
      ${own ? '' : '<p class="small-note">Phone numbers and medical notes are shown only to the class teacher.</p>'}`;
    const mStart = today().slice(0, 8) + '01';
    $('#clsHead').innerHTML = `<tr><th>Student</th><th>Roll</th><th>Gender</th><th>Date of birth</th><th>Attendance this month</th>${own ? '<th>Parent phone</th><th>Medical notes</th>' : ''}<th style="text-align:right">Details</th></tr>`;
    $('#clsBody').innerHTML = list.length ? list.map(s => {
      const a = S.attendanceSummary(s.id, mStart, today());
      const f = S.family(s.familyId);
      const ph = f ? (f.primary === 'mother' ? f.motherPhone : f.fatherPhone) : '';
      return `<tr>
        <td data-col="Student"><div class="cellav"><span class="av">${av(S.studentName(s), s.id)}</span><span><b>${esc(S.studentName(s))}</b><span>${esc(s.admissionNo)}</span></span></div></td>
        <td data-col="Roll">${s.roll}</td>
        <td data-col="Gender">${esc(s.gender)}</td>
        <td data-col="Date of birth">${esc(S.fmtDate(s.dob))}</td>
        <td data-col="Attendance this month">${a.pct == null ? '—' : `<span class="pillx ${a.pct >= 90 ? 'ok' : a.pct >= 75 ? 'warn' : 'off'}">${pct(a.pct)}</span>`}</td>
        ${own ? `<td data-col="Parent phone">${esc(ph)}</td><td data-col="Medical notes">${s.medical ? `<span class="pillx warn">${esc(s.medical)}</span>` : '<span class="muted">—</span>'}</td>` : ''}
        <td data-col="Details"><div class="rowacts"><button class="mini" type="button" data-stu="${s.id}" aria-label="Open ${esc(S.studentName(s))}">${ico('ic-eye', 16)}</button></div></td>
      </tr>`;
    }).join('') : `<tr><td colspan="8">${emptyState('ic-search', 'No students match', '')}</td></tr>`;
  };

  $('#clsSeg').addEventListener('click', e => {
    const b = e.target.closest('[data-sec]'); if (!b) return;
    ui.cls = b.dataset.sec;
    $$('#clsSeg button').forEach(x => x.classList.toggle('on', x === b));
    render();
  });
  $('#clsSearch').addEventListener('input', render);
  $('#clsBody').addEventListener('click', e => { const b = e.target.closest('[data-stu]'); if (b) studentCard(b.dataset.stu); });
  render();
}

function studentCard(sid) {
  const s = S.student(sid), sec = S.sectionOfStudent(sid), e = S.enrollmentOf(sid);
  const own = sec && sec.classTeacherId === me().id;
  const f = S.family(s.familyId);
  const month = S.attendanceSummary(sid, today().slice(0, 8) + '01', today());
  const year = S.attendanceSummary(sid, S.currentYear().start, today());
  const rms = S.db.remarks.filter(r => r.studentId === sid).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  P.openModal(`
    <div class="mhead"><div class="prof-top"><span class="pav">${av(S.studentName(s), s.id)}</span>
      <div><h3 id="modalTitle">${esc(S.studentName(s))}</h3><span class="muted">${esc(S.sectionLabel(sec))} · Roll ${e.roll} · ${esc(s.admissionNo)}</span></div></div></div>
    <div class="mbody">
      <div class="prof-grid">
        <div><span>Date of birth</span><b>${esc(S.fmtDate(s.dob))}</b></div>
        <div><span>Gender</span><b>${esc(s.gender)}</b></div>
        <div><span>Blood group</span><b>${esc(s.bloodGroup)}</b></div>
        <div><span>Joined</span><b>${esc(S.fmtDate(s.admissionDate))}</b></div>
        ${own ? `<div><span>Father</span><b>${esc(f.fatherName)} · ${esc(f.fatherPhone)}</b></div>
        <div><span>Mother</span><b>${esc(f.motherName)} · ${esc(f.motherPhone)}</b></div>
        <div style="grid-column:1/-1"><span>Medical notes</span><b>${esc(s.medical || 'None')}</b></div>` : ''}
      </div>
      <div class="apanels even" style="margin-top:1.2rem">
        <div><span class="ctl-label">This month</span><b style="display:block;font-size:1.3rem;color:var(--navy)">${pct(month.pct)}</b><div class="meter ok"><i style="width:${month.pct || 0}%"></i></div></div>
        <div><span class="ctl-label">This year</span><b style="display:block;font-size:1.3rem;color:var(--navy)">${pct(year.pct)}</b><div class="meter"><i style="width:${year.pct || 0}%"></i></div></div>
      </div>
      <h4 style="margin:1.4rem 0 .6rem;font-size:1rem">Recent remarks</h4>
      ${rms.length ? `<div class="lst">${rms.map(r => remarkRow(r, false)).join('')}</div>` : '<p class="muted">No remarks yet.</p>'}
      <div class="btn-row" style="margin-top:1.2rem">
        <button class="btn btn-primary btn-sm" type="button" id="scRemark">${ico('ic-msg', 16)} Write a remark</button>
        <button class="btn btn-soft btn-sm" type="button" data-close-modal>Close</button>
      </div>
    </div>`, 'wide');
  $('#scRemark').addEventListener('click', () => remarkForm(sec.id, sid));
}

/* ============================================================
   ATTENDANCE (class teacher only)
   ============================================================ */
function initAttendance() {
  const cls = myClass();
  if (!cls) {
    $('#attSeg').hidden = true;
    $('#attBody').innerHTML = `<div class="panel-card">${emptyState('ic-clipboard', 'Attendance is marked by the class teacher', 'You are not a class teacher this year, so there is no class to mark.')}</div>`;
    return;
  }
  ui.att.date = ui.att.date || today();
  ui.att.month = ui.att.month || today().slice(0, 7);
  $$('#attSeg button').forEach(b => b.classList.toggle('on', b.dataset.tab === ui.att.tab));
  $('#attSeg').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    ui.att.tab = b.dataset.tab;
    $$('#attSeg button').forEach(x => x.classList.toggle('on', x === b));
    draw();
  });
  const draw = () => (ui.att.tab === 'mark' ? drawMark(cls) : drawRegister(cls));
  $('#attCtl').addEventListener('change', e => {
    if (e.target.id === 'attDate') { ui.att.date = e.target.value || today(); ui.att.draft = null; draw(); }
    if (e.target.id === 'attMonth') { ui.att.month = e.target.value; draw(); }
  });
  $('#attBody').addEventListener('click', e => onMarkClick(e, cls));
  draw();
}

function drawMark(cls) {
  const d = ui.att.date, t = today();
  $('#attCtl').innerHTML = `<label class="ctl-label" for="attDate">Date</label><input type="date" class="ctl" id="attDate" value="${d}" max="${t}" min="${S.currentYear().start}" />`;
  if (!S.isSchoolDay(d)) {
    const h = S.holidayOn(d);
    $('#attBody').innerHTML = `<div class="panel-card">${emptyState('ic-cal', 'No school on ' + S.fmtShort(d), h ? h.name : 'Weekly holiday')}</div>`;
    return;
  }
  const saved = S.attendanceDay(cls.id, d);
  const editable = d === t;
  if (!saved && !editable) {
    $('#attBody').innerHTML = `<div class="panel-card">${emptyState('ic-clipboard', 'Attendance was not taken on ' + S.fmtShort(d), 'Only the office can add attendance for an earlier day.')}</div>`;
    return;
  }
  const roster = S.rosterOf(cls.id);
  const key = cls.id + '|' + d;
  if (ui.att.key !== key || !ui.att.draft) {
    ui.att.key = key;
    ui.att.draft = {};
    roster.forEach(s => { ui.att.draft[s.id] = saved && saved.marks[s.id] ? saved.marks[s.id] : (S.ackLeaveOn(s.id, d) ? 'V' : 'P'); });
  }
  const note = saved
    ? `<div class="alert ${editable ? 'ok' : ''}">${ico(editable ? 'ic-check-circle' : 'ic-lock')}<div><b>Saved at ${esc(P.timeAgo(saved.at))} by ${esc(S.teacherName(saved.by) === '—' ? 'the office' : S.teacherName(saved.by))}</b>${editable ? 'You can change it until the end of today. After that only the office can correct it.' : 'Earlier days are read-only. Ask the office if something needs correcting.'}</div></div>`
    : `<div class="alert">${ico('ic-clipboard')}<div><b>Everyone starts as present</b>Tap a child's status to change it, then save once. Children on acknowledged leave are already filled in.</div></div>`;
  $('#attBody').innerHTML = `${note}
    <div class="panel-card">
      <div class="ph-head"><h3>${ico('ic-users')} ${esc(S.sectionLabel(cls))} · ${esc(S.fmtShort(d))}</h3>
        <span class="push">${editable ? '<button class="btn btn-soft btn-sm" type="button" id="attAllP">Mark everyone present</button>' : ''}</span></div>
      <div class="att-sum" id="attSum"></div>
    </div>
    <div class="roster" id="attRoster" style="margin-top:12px">${roster.map(s => rosterRow(s, d, editable, saved)).join('')}</div>
    ${editable ? `<div class="sticky-save"><span class="muted small" id="attCount"></span><span class="push"><button class="btn btn-primary" type="button" id="attSave">${ico('ic-check', 18)} ${saved ? 'Save changes' : 'Save attendance'}</button></span></div>` : ''}`;
  drawSummary();
}

function rosterRow(s, d, editable, saved) {
  const code = ui.att.draft[s.id];
  const ack = S.ackLeaveOn(s.id, d), pend = S.pendingLeaveOn(s.id, d);
  const flag = ack ? `<span class="flag">Leave acknowledged: ${esc(ack.reason)}</span>` : pend ? `<span class="flag">Leave requested — waiting for you</span>` : s.medical ? `<span>${esc(s.medical)}</span>` : `<span>${esc(s.admissionNo)}</span>`;
  const changed = saved && saved.marks[s.id] && saved.marks[s.id] !== code;
  return `<div class="rrow${changed ? ' changed' : ''}" data-row="${s.id}">
    <span class="roll">${av(S.studentName(s), s.id)}<em>${s.roll}</em></span>
    <span class="nm"><b>${esc(S.studentName(s))}</b>${flag}</span>
    <span class="stgroup" role="radiogroup" aria-label="Status for ${esc(S.studentName(s))}">${S.STATUS_ORDER.map(c => {
      const st = S.STATUS[c], on = c === code;
      return `<button type="button" class="stbtn ${st.cls}${on ? ' on' : ''}" data-sid="${s.id}" data-code="${c}" role="radio" aria-checked="${on}" title="${st.label}"${editable ? '' : ' disabled'}>${st.short}</button>`;
    }).join('')}</span></div>`;
}
function drawSummary() {
  const c = { P: 0, A: 0, L: 0, H: 0, V: 0 };
  Object.values(ui.att.draft).forEach(x => { c[x]++; });
  const total = Object.keys(ui.att.draft).length;
  $('#attSum').innerHTML = S.STATUS_ORDER.map(k => `<span class="att-chip ${S.STATUS[k].cls}">${c[k]} ${S.STATUS[k].label}</span>`).join('') + `<span class="muted small">of ${total} children</span>`;
  const cnt = $('#attCount');
  if (cnt) cnt.textContent = `${c.P + c.L + c.H} in school · ${c.A} absent · ${c.V} on leave`;
}
function onMarkClick(e, cls) {
  const b = e.target.closest('.stbtn[data-sid]');
  if (b && !b.disabled) {
    ui.att.draft[b.dataset.sid] = b.dataset.code;
    const row = b.closest('.rrow');
    $$('.stbtn', row).forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
    const saved = S.attendanceDay(cls.id, ui.att.date);
    row.classList.toggle('changed', !!(saved && saved.marks[b.dataset.sid] && saved.marks[b.dataset.sid] !== b.dataset.code));
    drawSummary();
    return;
  }
  if (e.target.closest('#attAllP')) {
    Object.keys(ui.att.draft).forEach(sid => { if (ui.att.draft[sid] !== 'V') ui.att.draft[sid] = 'P'; });
    drawMark(cls);
    return;
  }
  if (e.target.closest('#attSave')) {
    S.saveAttendance(cls.id, ui.att.date, ui.att.draft, me().id);
    const c = Object.values(ui.att.draft);
    toast(`Attendance saved|${c.filter(x => x !== 'A' && x !== 'V').length} of ${c.length} children in school in ${S.sectionLabel(cls)}. Parents can see it now.`);
    P.refreshCounts();
    drawMark(cls);
  }
}

function drawRegister(cls) {
  const y = S.currentYear();
  const months = [];
  let m = y.start.slice(0, 7);
  while (m <= today().slice(0, 7) && m <= y.end.slice(0, 7)) { months.push(m); const [yy, mm] = m.split('-').map(Number); m = mm === 12 ? `${yy + 1}-01` : `${yy}-${String(mm + 1).padStart(2, '0')}`; }
  if (!months.includes(ui.att.month)) ui.att.month = months[months.length - 1];
  $('#attCtl').innerHTML = `<label class="ctl-label" for="attMonth">Month</label><select class="ctl" id="attMonth">${months.map(x => { const [yy, mm] = x.split('-').map(Number); return `<option value="${x}"${x === ui.att.month ? ' selected' : ''}>${S.MONTHS[mm - 1]} ${yy}</option>`; }).join('')}</select>`;
  const [yy, mm] = ui.att.month.split('-').map(Number);
  const days = [];
  for (let dd = 1; dd <= new Date(yy, mm, 0).getDate(); dd++) {
    const d = S.iso(new Date(yy, mm - 1, dd));
    if (d > today()) break;
    if (S.isSchoolDay(d)) days.push(d);
  }
  const roster = S.rosterOf(cls.id);
  const from = `${ui.att.month}-01`, to = `${ui.att.month}-31`;
  $('#attBody').innerHTML = `<div class="tbl-wrap keep" style="margin-top:0"><div class="tbl-scroll"><table class="keep compact">
    <thead><tr><th>Student</th>${days.map(d => `<th title="${esc(S.fmtShort(d))}">${S.parse(d).getDate()}<br><span style="font-weight:600">${S.DAYS[S.dayOfWeek(d)].slice(0, 2)}</span></th>`).join('')}<th>%</th></tr></thead>
    <tbody>${roster.map(s => {
      const a = S.attendanceSummary(s.id, from, to);
      return `<tr><td><b style="font-size:.84rem">${s.roll}. ${esc(S.studentName(s))}</b></td>${days.map(d => `<td>${chip(S.statusOf(s.id, d))}</td>`).join('')}<td><b>${pct(a.pct)}</b></td></tr>`;
    }).join('')}</tbody>
    <tfoot><tr><td>In school</td>${days.map(d => { const sm = S.sectionDaySummary(cls.id, d); return `<td>${sm ? sm.P + sm.L + sm.H : '—'}</td>`; }).join('')}<td></td></tr></tfoot>
  </table></div></div>${P.legendHTML()}`;
}

/* ============================================================
   HOMEWORK AND CLASS DIARY
   ============================================================ */
function initHomework() {
  const secs = taught();
  if (!secs.length) { $('#hwList').innerHTML = emptyState('ic-book', 'No classes yet', ''); return; }
  if (!ui.hw.sec || !secs.some(s => s.id === ui.hw.sec)) ui.hw.sec = (myClass() || secs[0]).id;
  $('#hwClass').innerHTML = opts(secs, ui.hw.sec, S.sectionLabel);
  $$('#hwType button').forEach(b => b.classList.toggle('on', b.dataset.type === ui.hw.type));

  const render = () => {
    const T = me();
    const list = S.db.homework.filter(h => h.sectionId === ui.hw.sec && (ui.hw.type === 'all' || h.type === ui.hw.type))
      .sort((a, b) => b.assigned.localeCompare(a.assigned) || b.createdAt.localeCompare(a.createdAt));
    if (!list.length) { $('#hwList').innerHTML = `<div class="panel-card">${emptyState('ic-book', 'Nothing posted yet', 'Homework and diary entries for this class will appear here.')}</div>`; return; }
    let last = '';
    $('#hwList').innerHTML = list.map(h => {
      const head = h.assigned !== last ? `<div class="day-head">${h.assigned === today() ? 'Today' : esc(S.fmtShort(h.assigned))}</div>` : '';
      last = h.assigned;
      return head + hwCard(h, h.createdBy === T.id);
    }).join('');
  };
  $('#hwClass').addEventListener('change', e => { ui.hw.sec = e.target.value; render(); });
  $('#hwType').addEventListener('click', e => {
    const b = e.target.closest('[data-type]'); if (!b) return;
    ui.hw.type = b.dataset.type;
    $$('#hwType button').forEach(x => x.classList.toggle('on', x === b));
    render();
  });
  $('#hwAdd').addEventListener('click', () => homeworkForm(null));
  $('#hwList').addEventListener('click', async e => {
    const ed = e.target.closest('[data-hw-edit]');
    if (ed) { homeworkForm(S.db.homework.find(h => h.id === ed.dataset.hwEdit)); return; }
    const del = e.target.closest('[data-hw-del]');
    if (del) {
      const h = S.db.homework.find(x => x.id === del.dataset.hwDel);
      const yes = await P.confirmBox({ title: 'Delete this post?', text: `"${h.title}" will be removed for parents too.`, ok: 'Delete', danger: true });
      if (!yes) return;
      S.db.homework = S.db.homework.filter(x => x.id !== h.id);
      S.save(); render();
      toast('Post deleted|Parents no longer see it.', 'info');
    }
  });
  render();
}

function hwCard(h, mine) {
  const diary = h.type === 'diary';
  return `<article class="hw-card${diary ? ' diary' : ''}">
    <div class="hw-top">${diary ? '<span class="pillx draft">Class diary</span>' : `<span class="pillx info">${esc(S.subjectName(h.subjectId))}</span>`}
      ${!diary && h.due ? `<span class="pillx ${h.due < today() ? 'grey' : h.due === today() || h.due === S.nextSchoolDay(today()) ? 'warn' : 'ok'}">Due ${esc(S.fmtShort(h.due))}</span>` : ''}
      ${mine ? `<span class="push"><button class="mini" type="button" data-hw-edit="${h.id}" aria-label="Edit">${ico('ic-pencil', 16)}</button><button class="mini del" type="button" data-hw-del="${h.id}" aria-label="Delete">${ico('ic-trash', 16)}</button></span>` : ''}</div>
    ${diary ? '' : `<h4>${esc(h.title)}</h4>`}
    <p>${esc(h.description)}</p>
    ${h.file ? `<button class="file-chip" type="button" data-toast="Opens the file in the live portal|${esc(h.file)}">${ico('ic-doc', 16)} ${esc(h.file)}</button>` : ''}
    <div class="hw-meta"><span>${ico('ic-user', 14)} ${esc(S.teacherName(h.createdBy))}</span><span>${ico('ic-clock', 14)} ${esc(S.fmtShort(h.assigned))}, ${esc(P.timeAgo(h.createdAt))}</span></div>
  </article>`;
}

function homeworkForm(h) {
  const T = me(), secs = taught();
  const editing = !!h;
  const secId = h ? h.sectionId : ui.hw.sec;
  P.openModal(`
    <div class="mhead"><h3 id="modalTitle">${editing ? 'Edit post' : 'Post homework or a diary entry'}</h3>
      <p class="small muted" style="margin-top:.3rem">Parents of the class see it straight away.</p></div>
    <div class="mbody"><form id="hwForm" class="fgrid" novalidate style="margin-top:0">
      <div class="field"><label for="hw-sec">Class</label><select id="hw-sec"${editing ? ' disabled' : ''}>${opts(secs, secId, S.sectionLabel)}</select></div>
      <div class="field"><label for="hw-type">Type</label><select id="hw-type"${editing ? ' disabled' : ''}></select></div>
      <div class="field full" id="hw-sub-f"><label for="hw-sub">Subject</label><select id="hw-sub"></select></div>
      <div class="field full" id="hw-title-f"><label for="hw-title">Title</label><input id="hw-title" maxlength="120" placeholder="Fractions — exercise 6.2" value="${h ? esc(h.title) : ''}" /><span class="err">Give the homework a short title.</span></div>
      <div class="field full"><label for="hw-desc">Details for parents</label><textarea id="hw-desc" maxlength="800" placeholder="What the children should do, and anything to bring">${h ? esc(h.description) : ''}</textarea><span class="err">Please write the details.</span></div>
      <div class="field" id="hw-due-f"><label for="hw-due">Due on</label><input type="date" id="hw-due" min="${today()}" value="${h && h.due ? h.due : S.nextSchoolDay(today())}" /><span class="err">The due date must be today or later.</span></div>
      <div class="field" id="hw-file-f"><label for="hw-file">Attachment (optional)</label><input type="file" id="hw-file" accept=".pdf,.jpg,.jpeg,.png" /><span class="hint" id="hw-file-name">${h && h.file ? 'Current file: ' + esc(h.file) : 'PDF or photo, up to 5 MB'}</span></div>
      <div class="field full btn-row"><button class="btn btn-primary" type="submit">${editing ? 'Save changes' : 'Post'}</button><button class="btn btn-soft" type="button" data-close-modal>Cancel</button></div>
    </form></div>`, 'wide');

  const syncOptions = () => {
    const sid = $('#hw-sec').value;
    const sec = S.section(sid);
    const isCT = sec.classTeacherId === T.id;
    const typeSel = $('#hw-type');
    const curType = h ? h.type : (typeSel.value || 'homework');
    typeSel.innerHTML = `<option value="homework">Homework</option>${isCT ? '<option value="diary">Class diary</option>' : ''}`;
    typeSel.value = isCT || curType === 'homework' ? curType : 'homework';
    const subs = isCT ? S.classSubjectsOf(sid) : S.subjectsTaughtIn(T.id, sid);
    $('#hw-sub').innerHTML = subs.map(cs => `<option value="${cs.subjectId}"${h && h.subjectId === cs.subjectId ? ' selected' : ''}>${esc(S.subjectName(cs.subjectId))}</option>`).join('');
    const diary = typeSel.value === 'diary';
    ['#hw-sub-f', '#hw-title-f', '#hw-due-f'].forEach(s => { $(s).hidden = diary; });
  };
  syncOptions();
  $('#hw-sec').addEventListener('change', syncOptions);
  $('#hw-type').addEventListener('change', syncOptions);
  $('#hw-file').addEventListener('change', e => { const f = e.target.files[0]; $('#hw-file-name').textContent = f ? 'Chosen: ' + f.name : 'PDF or photo, up to 5 MB'; });
  $('#hwForm').addEventListener('submit', e => {
    e.preventDefault();
    const type = $('#hw-type').value, diary = type === 'diary';
    const title = $('#hw-title').value.trim(), desc = $('#hw-desc').value.trim(), due = $('#hw-due').value;
    const ok = [
      P.fieldBad('#hw-title', !diary && !title),
      P.fieldBad('#hw-desc', !desc),
      P.fieldBad('#hw-due', !diary && (!due || due < (h ? h.assigned : today())))
    ].every(Boolean);
    if (!ok) return;
    const file = $('#hw-file').files[0];
    const rec = h || { id: S.newId('hw'), createdBy: T.id, createdAt: new Date().toISOString(), assigned: today(), sectionId: $('#hw-sec').value, type };
    Object.assign(rec, {
      subjectId: diary ? null : $('#hw-sub').value,
      title: diary ? 'Class diary' : title,
      description: desc,
      due: diary ? null : due,
      file: file ? file.name : (h ? h.file : '')
    });
    if (!h) S.db.homework.push(rec);
    S.save();
    P.closeModal();
    ui.hw.sec = rec.sectionId;
    toast(`${editing ? 'Changes saved' : diary ? 'Diary entry posted' : 'Homework posted'}|Parents of ${S.sectionLabel(rec.sectionId)} can see it now.`);
    P.reload();
  });
}

/* ============================================================
   MARKS (subject teacher, own subjects only)
   ============================================================ */
function myPapers(examId, sectionId) {
  return S.papersOf(examId, sectionId).filter(pp => S.classSubject(pp.csId).teacherId === me().id);
}
function initMarks() {
  const exams = S.db.exams.filter(x => x.yearId === S.currentYear().id && myPapers(x.id).length).sort((a, b) => a.order - b.order);
  if (!exams.length) {
    $('#mkInfo').innerHTML = `<div class="panel-card">${emptyState('ic-chart', 'No papers to mark', 'When the office sets up an exam for your subjects, it appears here.')}</div>`;
    return;
  }
  if (!ui.mk.exam || !exams.some(x => x.id === ui.mk.exam)) ui.mk.exam = (exams.find(x => !x.published) || exams[exams.length - 1]).id;
  const fill = () => {
    $('#mkExam').innerHTML = opts(exams, ui.mk.exam, x => x.name + (x.published ? ' (published)' : ''));
    const secs = taught().filter(s => myPapers(ui.mk.exam, s.id).length);
    if (!secs.some(s => s.id === ui.mk.sec)) ui.mk.sec = (secs.find(s => s.id === (myClass() || {}).id) || secs[0]).id;
    $('#mkClass').innerHTML = opts(secs, ui.mk.sec, S.sectionLabel);
    const pps = myPapers(ui.mk.exam, ui.mk.sec);
    if (!pps.some(p => p.id === ui.mk.paper)) ui.mk.paper = pps[0].id;
    $('#mkPaper').innerHTML = opts(pps, ui.mk.paper, p => S.subjectName(S.classSubject(p.csId).subjectId));
    drawMarks();
  };
  $('#mkExam').addEventListener('change', e => { ui.mk.exam = e.target.value; ui.mk.paper = null; fill(); });
  $('#mkClass').addEventListener('change', e => { ui.mk.sec = e.target.value; ui.mk.paper = null; fill(); });
  $('#mkPaper').addEventListener('change', e => { ui.mk.paper = e.target.value; drawMarks(); });
  $('#mkBody').addEventListener('input', onMarkInput);
  $('#mkBody').addEventListener('change', onMarkInput);
  $('#mkBody').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.classList.contains('mk-in')) return;
    e.preventDefault();
    const all = $$('#mkBody .mk-in:not(:disabled)');
    const nx = all[all.indexOf(e.target) + 1];
    if (nx) nx.focus(); else $('#mkSave') && $('#mkSave').focus();
  });
  $('#mkBody').addEventListener('click', e => { if (e.target.closest('#mkSave')) saveMarks(); });
  fill();
}

function drawMarks() {
  const pp = S.byId('papers', ui.mk.paper);
  const ex = S.exam(pp.examId);
  const cs = S.classSubject(pp.csId);
  const st = S.paperStats(pp.id);
  const locked = ex.published;
  $('#mkInfo').innerHTML = `
    ${locked ? `<div class="alert">${ico('ic-lock')}<div><b>Results are published to parents</b>Marks can't be changed now. Ask the office to unpublish the exam if a mark is wrong.</div></div>` : ''}
    <div class="kpis k4">
      <div class="kpi"><span class="ic">${ico('ic-doc')}</span><b>${pp.max}</b><span>Maximum marks</span><small>Pass mark ${pp.pass} · ${esc(S.fmtShort(pp.date))}</small></div>
      <div class="kpi"><span class="ic ok">${ico('ic-check-circle')}</span><b>${st.entered}/${st.total}</b><span>Entered</span></div>
      <div class="kpi"><span class="ic mari">${ico('ic-chart')}</span><b>${st.avgPct == null ? '—' : pct(st.avgPct)}</b><span>Class average</span>${st.avg != null ? `<small>${st.avg} out of ${pp.max}</small>` : ''}</div>
      <div class="kpi"><span class="ic warn">${ico('ic-bell')}</span><b>${st.fails}</b><span>Below the pass mark</span>${st.absent ? `<small>${st.absent} absent</small>` : ''}</div>
    </div>`;
  const marks = S.marksOf(pp.id);
  const roster = S.rosterOf(cs.sectionId);
  $('#mkBody').innerHTML = `
    <div class="panel-card" style="margin-top:16px">
      <div class="ph-head"><h3>${ico('ic-chart')} ${esc(S.subjectName(cs.subjectId))} · ${esc(S.sectionLabel(cs.sectionId))} · ${esc(ex.name)}</h3></div>
      <div class="mk-head"><span></span><span>Student</span><span>Marks (out of ${pp.max})</span><span>Absent</span><span style="text-align:right">Grade</span></div>
      <div class="mk-list">${roster.map(s => {
        const r = marks[s.id];
        const v = r && !r.absent && r.m != null ? r.m : '';
        return `<div class="mk-row" data-sid="${s.id}">
          <span class="roll">${av(S.studentName(s), s.id)}</span>
          <span><b>${esc(S.studentName(s))}</b><small>Roll ${s.roll}</small></span>
          <input class="mk-in" type="number" inputmode="numeric" min="0" max="${pp.max}" step="1" value="${v}" aria-label="Marks for ${esc(S.studentName(s))}"${locked || (r && r.absent) ? ' disabled' : ''} />
          <label class="mk-abs"><input type="checkbox" class="mk-ab"${r && r.absent ? ' checked' : ''}${locked ? ' disabled' : ''} /> Absent</label>
          <span class="mk-grade"></span></div>`;
      }).join('')}</div>
    </div>
    ${locked ? '' : `<div class="sticky-save"><span class="muted small" id="mkCount"></span><span class="push"><button class="btn btn-primary" type="button" id="mkSave">${ico('ic-check', 18)} Save marks</button></span></div>`}`;
  $$('#mkBody .mk-row').forEach(updateRow);
  countMarks();
}
function updateRow(row) {
  const pp = S.byId('papers', ui.mk.paper);
  const inp = $('.mk-in', row), ab = $('.mk-ab', row), g = $('.mk-grade', row);
  inp.disabled = ab.checked || S.exam(pp.examId).published;
  if (ab.checked) inp.value = '';
  const raw = inp.value.trim();
  const n = Number(raw);
  const bad = raw !== '' && (!Number.isInteger(n) || n < 0 || n > pp.max);
  row.classList.toggle('bad', bad);
  if (ab.checked) { g.textContent = 'Absent'; g.className = 'mk-grade fail'; return; }
  if (raw === '' || bad) { g.textContent = bad ? `0–${pp.max}` : '—'; g.className = 'mk-grade' + (bad ? ' fail' : ''); return; }
  const p = Math.round(n / pp.max * 1000) / 10;
  g.textContent = `${p}% · ${S.gradeFor(p)}`;
  g.className = 'mk-grade' + (n < pp.pass ? ' fail' : '');
}
function countMarks() {
  const rows = $$('#mkBody .mk-row');
  const done = rows.filter(r => $('.mk-ab', r).checked || $('.mk-in', r).value.trim() !== '').length;
  const c = $('#mkCount');
  if (c) c.textContent = `${done} of ${rows.length} entered`;
}
function onMarkInput(e) {
  const row = e.target.closest('.mk-row');
  if (!row) return;
  updateRow(row);
  countMarks();
}
function saveMarks() {
  const pp = S.byId('papers', ui.mk.paper);
  const rows = $$('#mkBody .mk-row');
  if (rows.some(r => r.classList.contains('bad'))) { toast(`Check the marks in red|Each mark must be a whole number from 0 to ${pp.max}.`, 'warn'); return; }
  const out = {};
  rows.forEach(r => {
    const sid = r.dataset.sid, ab = $('.mk-ab', r).checked, raw = $('.mk-in', r).value.trim();
    if (ab) out[sid] = { m: null, absent: true };
    else if (raw !== '') out[sid] = { m: Number(raw), absent: false };
  });
  const prev = S.marksOf(pp.id);
  Object.keys(out).forEach(sid => {
    const a = prev[sid], b = out[sid];
    if (a && (a.m !== b.m || a.absent !== b.absent)) S.logChange({ what: 'Marks', paperId: pp.id, studentId: sid, from: a.absent ? 'Absent' : a.m, to: b.absent ? 'Absent' : b.m, by: me().id });
  });
  S.db.marks[pp.id] = out;
  S.save();
  const cs = S.classSubject(pp.csId);
  toast(`Marks saved|${S.subjectName(cs.subjectId)}, ${S.sectionLabel(cs.sectionId)}: ${Object.keys(out).length} of ${rows.length} entered. Parents see them once the office publishes the results.`);
  drawMarks();
}

/* ============================================================
   REMARKS
   ============================================================ */
function remarkRow(r, canDelete) {
  const [icn, cls] = remarkIcon(r.type);
  return `<div class="li"><span class="lic ${cls}">${ico(icn)}</span>
    <div class="lb"><b>${esc(S.studentName(r.studentId))} · ${esc(S.REMARK_TYPES[r.type])}</b><p>${esc(r.text)}</p>
    <span class="meta">${esc(S.fmtDate(r.date))} · ${esc(S.teacherName(r.by))}</span></div>
    ${canDelete ? `<div class="lr"><button class="mini del" type="button" data-rm-del="${r.id}" aria-label="Delete remark">${ico('ic-trash', 16)}</button></div>` : ''}</div>`;
}
function initRemarks() {
  const secs = taught();
  if (!secs.length) { $('#rmList').innerHTML = emptyState('ic-msg', 'No classes yet', ''); return; }
  if (!ui.rm.sec || !secs.some(s => s.id === ui.rm.sec)) ui.rm.sec = (myClass() || secs[0]).id;
  $('#rmClass').innerHTML = opts(secs, ui.rm.sec, S.sectionLabel);
  $$('#rmType button').forEach(b => b.classList.toggle('on', b.dataset.type === ui.rm.type));
  const render = () => {
    const sec = S.section(ui.rm.sec), own = sec.classTeacherId === me().id;
    const ids = new Set(S.rosterOf(sec.id).map(s => s.id));
    const list = S.db.remarks.filter(r => ids.has(r.studentId) && (own || r.by === me().id) && (ui.rm.type === 'all' || r.type === ui.rm.type))
      .sort((a, b) => b.date.localeCompare(a.date));
    $('#rmList').innerHTML = list.length ? `<div class="lst">${list.map(r => remarkRow(r, r.by === me().id)).join('')}</div>`
      : emptyState('ic-msg', 'No remarks yet', own ? 'Remarks for your class appear here.' : 'Remarks you write for this class appear here.');
  };
  $('#rmClass').addEventListener('change', e => { ui.rm.sec = e.target.value; render(); });
  $('#rmType').addEventListener('click', e => {
    const b = e.target.closest('[data-type]'); if (!b) return;
    ui.rm.type = b.dataset.type;
    $$('#rmType button').forEach(x => x.classList.toggle('on', x === b));
    render();
  });
  $('#rmAdd').addEventListener('click', () => remarkForm(ui.rm.sec));
  $('#rmList').addEventListener('click', async e => {
    const b = e.target.closest('[data-rm-del]'); if (!b) return;
    const yes = await P.confirmBox({ title: 'Delete this remark?', text: 'Parents will no longer see it.', ok: 'Delete', danger: true });
    if (!yes) return;
    S.db.remarks = S.db.remarks.filter(r => r.id !== b.dataset.rmDel);
    S.save(); render();
    toast('Remark deleted', 'info');
  });
  render();
}
function remarkForm(sectionId, studentId) {
  const roster = S.rosterOf(sectionId);
  P.openModal(`
    <div class="mhead"><h3 id="modalTitle">Write a remark</h3><p class="small muted" style="margin-top:.3rem">${esc(S.sectionLabel(sectionId))} · the child's parents will see this.</p></div>
    <div class="mbody"><form id="rmForm" class="fgrid" novalidate style="margin-top:0">
      <div class="field full"><label for="rm-stu">Student</label><select id="rm-stu">${roster.map(s => `<option value="${s.id}"${s.id === studentId ? ' selected' : ''}>${s.roll}. ${esc(S.studentName(s))}</option>`).join('')}</select></div>
      <div class="field full"><label>Type</label><div class="seg" id="rm-type">${Object.entries(S.REMARK_TYPES).map(([k, v], i) => `<button type="button" data-v="${k}" class="${i === 0 ? 'on' : ''}">${v}</button>`).join('')}</div></div>
      <div class="field full"><label for="rm-text">Remark</label><textarea id="rm-text" maxlength="500" placeholder="Read the whole story aloud with great confidence today."></textarea><span class="hint" id="rm-cnt">0 / 500</span><span class="err">Please write the remark.</span></div>
      <div class="field full btn-row"><button class="btn btn-primary" type="submit">Save remark</button><button class="btn btn-soft" type="button" data-close-modal>Cancel</button></div>
    </form></div>`);
  let type = 'appreciation';
  $('#rm-type').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; type = b.dataset.v; $$('#rm-type button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#rm-text').addEventListener('input', e => { $('#rm-cnt').textContent = `${e.target.value.length} / 500`; });
  $('#rmForm').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('#rm-text').value.trim();
    if (!P.fieldBad('#rm-text', !text)) return;
    const sid = $('#rm-stu').value;
    S.db.remarks.push({ id: S.newId('rm'), studentId: sid, type, text, by: me().id, date: today() });
    S.save();
    P.closeModal();
    toast(`Remark saved|${S.student(sid).firstName}'s parents can read it now.`);
    if (window.Router.current() === 'remarks') P.reload();
  });
}

/* ============================================================
   MY LEAVE
   ============================================================ */
function initMyLeave() {
  const T = me();
  $('#ml-type').innerHTML = S.STAFF_LEAVE_TYPES.map(t => `<option>${esc(t)}</option>`).join('');
  $('#ml-from').min = today(); $('#ml-to').min = today();
  $('#ml-from').value = S.nextSchoolDay(today()); $('#ml-to').value = $('#ml-from').value;
  const days = () => {
    const a = $('#ml-from').value, b = $('#ml-to').value;
    $('#ml-days').textContent = a && b && b >= a ? `${daysBetween(a, b)} school day(s) — ${dateRange(a, b)}` : '';
  };
  ['#ml-from', '#ml-to'].forEach(s => $(s).addEventListener('change', () => { if ($('#ml-to').value < $('#ml-from').value) $('#ml-to').value = $('#ml-from').value; days(); }));
  days();
  const render = () => {
    const list = S.db.staffLeaves.filter(l => l.teacherId === T.id).sort((a, b) => b.from.localeCompare(a.from));
    const bal = `<div class="att-sum" style="margin-bottom:1rem">${S.leaveBalance(T.id).map(b => `<span class="pillx ${b.left <= 2 ? 'warn' : 'ok'}">${esc(b.type)}: ${b.left} of ${b.allowed} left</span>`).join('')}</div>`;
    $('#mlList').innerHTML = bal + (list.length ? `<div class="lst">${list.map(l => `<div class="li"><span class="lic ${l.status === 'approved' ? 'ok' : l.status === 'rejected' ? 'bad' : l.status === 'pending' ? 'warn' : ''}">${ico('ic-leave')}</span>
      <div class="lb"><b>${esc(l.type)} · ${esc(dateRange(l.from, l.to))}</b><p>${esc(l.reason)}</p>
        <span class="meta">${daysBetween(l.from, l.to)} school day(s) · sent ${esc(S.fmtShort(l.createdAt.slice(0, 10)))}${l.note ? ' · Office: ' + esc(l.note) : ''}</span></div>
      <div class="lr">${leavePill(l.status)}${l.status === 'pending' ? `<button class="btn btn-soft btn-sm" type="button" data-ml-cancel="${l.id}">Cancel</button>` : ''}</div></div>`).join('')}</div>`
      : emptyState('ic-leave', 'No leave requested yet', ''));
  };
  $('#mlList').addEventListener('click', async e => {
    const b = e.target.closest('[data-ml-cancel]'); if (!b) return;
    const yes = await P.confirmBox({ title: 'Cancel this request?', text: 'The office will see it as cancelled.', ok: 'Cancel request', danger: true });
    if (!yes) return;
    S.db.staffLeaves.find(l => l.id === b.dataset.mlCancel).status = 'cancelled';
    S.save(); render();
    toast('Request cancelled', 'info');
  });
  $('#mlForm').addEventListener('submit', e => {
    e.preventDefault();
    const from = $('#ml-from').value, to = $('#ml-to').value, reason = $('#ml-reason').value.trim();
    const ok = [P.fieldBad('#ml-from', !from || from < today()), P.fieldBad('#ml-to', !to || to < from), P.fieldBad('#ml-reason', !reason)].every(Boolean);
    if (!ok) return;
    S.db.staffLeaves.push({ id: S.newId('tl'), teacherId: T.id, type: $('#ml-type').value, from, to, reason, status: 'pending', createdAt: today(), decidedAt: null, note: '' });
    S.save();
    e.target.reset(); $('#ml-type').value = S.STAFF_LEAVE_TYPES[0];
    toast(`Leave request sent|The office will reply here. ${dateRange(from, to)}.`);
    render();
  });
  render();
}

/* ============================================================
   TIMETABLE, NOTICES, ACCOUNT
   ============================================================ */
function initTimetable() {
  const T = me(), cls = myClass();
  const n = S.db.timetable.filter(t => t.csId && S.classSubject(t.csId) && S.classSubject(t.csId).teacherId === T.id).length;
  $('#ttMeta').textContent = `${n} periods a week`;
  $('#ttMine').innerHTML = P.timetableHTML({ teacherId: T.id });
  if (cls) {
    $('#ttClassCard').hidden = false;
    $('#ttClassTitle').textContent = `${S.sectionLabel(cls)} — class timetable`;
    $('#ttClass').innerHTML = P.timetableHTML({ sectionId: cls.id });
  }
}
function initNotices() {
  $('#ntList').innerHTML = P.noticeList(S.noticesFor(audience()));
  $('#ntDocs').innerHTML = P.documentList(S.documentsFor(audience()));
}
function initAccount() {
  const T = me(), cls = myClass(), u = P.session.user;
  P.accountPage([
    ['Name', T.name], ['Designation', T.designation], ['Department', T.department],
    ['Class teacher of', cls ? S.sectionLabel(cls) : 'No class'],
    ['Classes taught', taught().map(S.sectionLabel).join(', ')],
    ['Phone', T.phone], ['E-mail', T.email], ['Login name', u.loginId]
  ]);
}

/* ============================================================
   BOOT
   ============================================================ */
const sub = text => () => esc(text);
P.init({
  role: 'teacher',
  order: ['home', 'classes', 'attendance', 'homework', 'marks', 'remarks', 'student-leave', 'timetable', 'my-leave', 'notices', 'account'],
  routes: {
    home:            { page: 'pages/teacher-home.html', onLoad: initHome, label: 'Home', icon: 'ic-home', bar: true, title: () => `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${me().name.replace(/^(Mr|Ms|Mrs)\.\s*/, '').split(' ')[0]}`, sub: () => esc(S.fmtShort(today())) + ' · ' + esc(S.currentYear().name) },
    classes:         { page: 'pages/teacher-classes.html', onLoad: initClasses, label: 'My classes', icon: 'ic-users', group: 'Teaching', title: 'My classes', sub: sub('Children in the classes you teach') },
    attendance:      { page: 'pages/teacher-attendance.html', onLoad: initAttendance, label: 'Attendance', short: 'Attendance', icon: 'ic-clipboard', bar: true, group: 'Teaching', title: 'Attendance', sub: () => myClass() ? `${esc(S.sectionLabel(myClass()))} · ${S.rosterOf(myClass().id).length} children · once a day` : 'Marked by the class teacher' },
    homework:        { page: 'pages/teacher-homework.html', onLoad: initHomework, label: 'Homework & diary', short: 'Homework', icon: 'ic-book', bar: true, group: 'Teaching', title: 'Homework and class diary', sub: sub('What parents see in the homework feed') },
    marks:           { page: 'pages/teacher-marks.html', onLoad: initMarks, label: 'Marks', icon: 'ic-chart', bar: true, group: 'Teaching', title: 'Marks entry', sub: sub('Your subjects only · parents see marks after the office publishes them') },
    remarks:         { page: 'pages/teacher-remarks.html', onLoad: initRemarks, label: 'Remarks', icon: 'ic-msg', group: 'Teaching', title: 'Remarks', sub: sub('Short notes about a child for the parents') },
    'student-leave': { page: 'pages/teacher-student-leave.html', onLoad: initStudentLeave, label: 'Leave from parents', icon: 'ic-leave', group: 'Teaching', title: 'Leave from parents', sub: () => myClass() ? `Requests for ${esc(S.sectionLabel(myClass()))}` : 'For class teachers' },
    timetable:       { page: 'pages/teacher-timetable.html', onLoad: initTimetable, label: 'Timetable', icon: 'ic-table', group: 'Me', title: 'Timetable', sub: sub('Your periods for the week') },
    'my-leave':      { page: 'pages/teacher-my-leave.html', onLoad: initMyLeave, label: 'My leave', icon: 'ic-cal', group: 'Me', title: 'My leave', sub: sub('Requests to the office') },
    notices:         { page: 'pages/teacher-notices.html', onLoad: initNotices, label: 'Notices', icon: 'ic-mega', group: 'Me', title: 'Notices and documents', sub: sub('For teachers and the classes you teach') },
    account:         { page: 'pages/teacher-account.html', onLoad: initAccount, label: 'My account', icon: 'ic-user', group: 'Me', title: 'My account', sub: sub('Your details and password') }
  },
  who: () => { const T = me(), cls = myClass(); return { name: T.name, sub: cls ? 'Class teacher · ' + S.sectionLabel(cls) : T.designation }; },
  counts: () => {
    const cls = myClass(), d = today();
    const weekAgo = S.addDays(d, -7);
    return {
      attendance: { n: cls && S.isSchoolDay(d) && !S.attendanceDay(cls.id, d) ? '!' : 0, hot: true },
      'student-leave': { n: pendingLeaves().length, hot: true },
      notices: { n: S.noticesFor(audience()).filter(n => n.date > weekAgo).length }
    };
  }
});
})();
