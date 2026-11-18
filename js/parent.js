/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Parent portal
   One login per family. Everything shown is for the child picked in
   the switcher, and only for children of the signed-in family.
   Parents read; the only thing they send is a leave request.
   ============================================================ */
'use strict';
(function () {
const { $, $$, esc, toast } = window.App;
const S = window.SchoolDB;
const P = window.Portal;
const { av, ico, chip, leavePill, remarkIcon, emptyState, dateRange, daysBetween, pct } = P;
const KID_KEY = 'christina_portal_child';

/* ---------- the family and the chosen child ---------- */
const fam = () => S.family(P.session.refId);
const kids = () => S.childrenOfFamily(P.session.refId).filter(k => k.status === 'active');
function kid() {
  const list = kids();
  let id = null;
  try { id = sessionStorage.getItem(KID_KEY); } catch (e) { /* ignore */ }
  return list.find(k => k.id === id) || list[0] || null;
}
function setKid(id) {
  // Only a child of this family can be chosen.
  if (!kids().some(k => k.id === id)) return;
  try { sessionStorage.setItem(KID_KEY, id); } catch (e) { /* ignore */ }
}
const sec = () => { const k = kid(); return k ? S.sectionOfStudent(k.id) : null; };
const audience = () => { const s = sec(); return { role: 'parent', sectionIds: s ? [s.id] : [], gradeIds: s ? [s.gradeId] : [] }; };
const today = () => S.todayISO();
const first = k => k ? k.firstName : 'your child';

const ui = { month: null, hwType: 'all', hwDue: false, exam: null };

/* ---------- homework card (read-only) ---------- */
function hwCard(h) {
  const diary = h.type === 'diary';
  const due = !diary && h.due;
  const dueCls = !due ? '' : h.due < today() ? 'grey' : (h.due === today() || h.due === S.nextSchoolDay(today())) ? 'warn' : 'ok';
  return `<article class="hw-card${diary ? ' diary' : ''}">
    <div class="hw-top">${diary ? '<span class="pillx draft">Class diary</span>' : `<span class="pillx info">${esc(S.subjectName(h.subjectId))}</span>`}
      ${due ? `<span class="pillx ${dueCls}">${h.due < today() ? 'Was due' : 'Due'} ${esc(S.fmtShort(h.due))}</span>` : ''}</div>
    ${diary ? '' : `<h4>${esc(h.title)}</h4>`}
    <p>${esc(h.description)}</p>
    ${h.file ? `<button class="file-chip" type="button" data-toast="Opens the file in the live portal|${esc(h.file)}">${ico('ic-doc', 16)} ${esc(h.file)}</button>` : ''}
    <div class="hw-meta"><span>${ico('ic-user', 14)} ${esc(S.teacherName(h.createdBy))}</span><span>${ico('ic-clock', 14)} ${esc(S.fmtShort(h.assigned))}</span></div>
  </article>`;
}
const classHomework = () => { const s = sec(); return s ? S.db.homework.filter(h => h.sectionId === s.id).sort((a, b) => b.assigned.localeCompare(a.assigned) || b.createdAt.localeCompare(a.createdAt)) : []; };
const publishedExams = () => S.db.exams.filter(x => x.yearId === S.currentYear().id && x.published).sort((a, b) => a.order - b.order);
function remarkRow(r) {
  const [icn, cls] = remarkIcon(r.type);
  return `<div class="li"><span class="lic ${cls}">${ico(icn)}</span>
    <div class="lb"><b>${esc(S.REMARK_TYPES[r.type])} · ${esc(S.teacherName(r.by))}</b><p>${esc(r.text)}</p><span class="meta">${esc(S.fmtDate(r.date))}</span></div></div>`;
}
const noChild = () => `<div class="panel-card">${emptyState('ic-user', 'No child linked to this login', 'Please contact the school office.')}</div>`;

/* ============================================================
   HOME
   ============================================================ */
function initHome() {
  const k = kid();
  if (!k) { $('#portal-app').innerHTML = noChild(); return; }
  const s = sec(), d = today();
  const code = S.statusOf(k.id, d);
  const mStart = d.slice(0, 8) + '01';
  const month = S.attendanceSummary(k.id, mStart, d);
  const hw = classHomework();
  const dueSoon = hw.filter(h => h.type === 'homework' && h.due && h.due >= d);
  const pub = publishedExams();
  const lastRes = pub.length ? S.studentResult(k.id, pub[pub.length - 1].id) : null;

  // today's status line
  let alert = '';
  if (!S.isSchoolDay(d)) {
    const h = S.holidayOn(d);
    alert = `<div class="alert">${ico('ic-cal')}<div><b>No school today</b>${esc(h ? h.name : 'Weekly holiday')}. School is open again on ${esc(S.fmtShort(S.nextSchoolDay(d)))}.</div></div>`;
  } else if (code) {
    const st = S.STATUS[code];
    const kind = code === 'A' ? 'bad' : code === 'V' ? '' : 'ok';
    alert = `<div class="alert ${kind}">${ico(code === 'A' ? 'ic-bell' : 'ic-check-circle')}<div><b>${esc(first(k))} is marked “${st.label}” today</b>${code === 'A' ? 'If this is unexpected, please call the school office.' : 'Marked by the class teacher at ' + esc(P.timeAgo(S.attendanceDay(s.id, d).at)) + '.'}</div></div>`;
  } else {
    alert = `<div class="alert">${ico('ic-clock')}<div><b>Today's attendance is not marked yet</b>The class teacher marks it during the first period.</div></div>`;
  }
  $('#pAlert').innerHTML = alert;

  $('#pKpis').innerHTML = `
    <div class="kpi"><span class="ic ok">${ico('ic-check-circle')}</span><b>${pct(month.pct)}</b><span>Attendance this month</span><div class="meter ${month.pct != null && month.pct < 85 ? 'warn' : 'ok'}"><i style="width:${month.pct || 0}%"></i></div></div>
    <div class="kpi"><span class="ic">${ico('ic-clipboard')}</span><b style="font-size:1.4rem;margin-top:1rem">${code ? S.STATUS[code].label : S.isSchoolDay(d) ? 'Not marked' : 'No school'}</b><span>Today</span></div>
    <div class="kpi"><span class="ic mari">${ico('ic-book')}</span><b>${dueSoon.length}</b><span>Homework still due</span></div>
    <div class="kpi"><span class="ic violet">${ico('ic-chart')}</span><b>${lastRes && lastRes.pct != null ? esc(lastRes.grade) : '—'}</b><span>${lastRes ? esc(pub[pub.length - 1].name) : 'No results yet'}</span>${lastRes && lastRes.pct != null ? `<small>${pct(lastRes.pct)} overall</small>` : ''}</div>`;

  $('#pHw').innerHTML = hw.length ? hw.slice(0, 3).map(hwCard).join('') : emptyState('ic-book', 'Nothing posted yet', '');

  // coming up: next exam, leave in progress, next holidays
  const items = [];
  const nextExam = S.db.exams.filter(x => x.yearId === S.currentYear().id && x.start >= d).sort((a, b) => a.start.localeCompare(b.start))[0];
  if (nextExam) items.push(`<div class="li"><span class="lic violet" style="background:var(--att-h-bg);color:var(--att-h)">${ico('ic-chart')}</span><div class="lb"><b>${esc(nextExam.name)}</b><span class="meta">${esc(dateRange(nextExam.start, nextExam.end))}</span></div></div>`);
  S.db.studentLeaves.filter(l => l.studentId === k.id && l.to >= d && l.status !== 'cancelled').forEach(l => items.push(
    `<div class="li"><span class="lic ${l.status === 'ack' ? 'ok' : 'warn'}">${ico('ic-leave')}</span><div class="lb"><b>Leave · ${esc(dateRange(l.from, l.to))}</b><span class="meta">${esc(l.reason)}</span></div><div class="lr">${leavePill(l.status)}</div></div>`));
  S.db.holidays.filter(h => h.date >= d).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2).forEach(h => items.push(
    `<div class="li"><span class="lic mari">${ico('ic-sparkle')}</span><div class="lb"><b>${esc(h.name)}</b><span class="meta">${esc(S.fmtShort(h.date))} · school closed</span></div></div>`));
  $('#pUpcoming').innerHTML = items.length ? `<div class="lst">${items.join('')}</div>` : emptyState('ic-cal', 'Nothing coming up', '');

  const rms = S.db.remarks.filter(r => r.studentId === k.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
  $('#pRemarks').innerHTML = rms.length ? `<div class="lst">${rms.map(remarkRow).join('')}</div>` : emptyState('ic-msg', 'No remarks yet', '');
  $('#pNotices').innerHTML = P.noticeList(S.noticesFor(audience()), 3);
}

/* ============================================================
   ATTENDANCE
   ============================================================ */
function initAttendance() {
  const k = kid();
  if (!k) { $('#portal-app').innerHTML = noChild(); return; }
  const y = S.currentYear();
  const minM = y.start.slice(0, 7), maxM = (today() < y.end ? today() : y.end).slice(0, 7);
  ui.month = ui.month && ui.month >= minM && ui.month <= maxM ? ui.month : maxM;
  const step = (m, n) => { let [yy, mm] = m.split('-').map(Number); mm += n; if (mm > 12) { mm = 1; yy++; } if (mm < 1) { mm = 12; yy--; } return `${yy}-${String(mm).padStart(2, '0')}`; };
  const draw = () => {
    const [yy, mm] = ui.month.split('-').map(Number);
    $('#calTitle').textContent = `${S.MONTHS[mm - 1]} ${yy}`;
    $('#calPrev').disabled = ui.month <= minM;
    $('#calNext').disabled = ui.month >= maxM;
    $('#calGrid').innerHTML = P.calendarHTML(k.id, yy, mm - 1) + P.legendHTML();
    const m = S.attendanceSummary(k.id, `${ui.month}-01`, `${ui.month}-31`);
    const yr = S.attendanceSummary(k.id, y.start, today());
    const absentDays = Object.entries(S.db.attendance[sec().id] || {}).filter(([d, day]) => day.marks[k.id] === 'A').map(([d]) => d).sort().reverse();
    $('#calSum').innerHTML = `
      <span class="ctl-label">${S.MONTHS[mm - 1]}</span>
      <b style="display:block;font-family:var(--serif);font-size:2rem;color:var(--navy);line-height:1.1">${pct(m.pct)}</b>
      <div class="meter ok"><i style="width:${m.pct || 0}%"></i></div>
      <div class="att-sum" style="margin-top:.9rem">${S.STATUS_ORDER.map(c => `<span class="att-chip ${S.STATUS[c].cls}">${m[c]} ${S.STATUS[c].label}</span>`).join('')}</div>
      <p class="small-note">${m.days} school day${m.days === 1 ? '' : 's'} with attendance taken. Late counts as present; half day counts as half.</p>
      <hr style="border:0;border-top:1px solid var(--line);margin:1.2rem 0" />
      <span class="ctl-label">This school year (${esc(y.name)})</span>
      <b style="display:block;font-family:var(--serif);font-size:1.6rem;color:var(--navy);line-height:1.1">${pct(yr.pct)}</b>
      <div class="meter"><i style="width:${yr.pct || 0}%"></i></div>
      <p class="small-note">${yr.days} days counted · ${yr.A} absent · ${yr.V} on leave</p>
      ${absentDays.length ? `<p class="small-note"><b style="color:var(--navy)">Absent on:</b> ${absentDays.slice(0, 6).map(d => esc(S.fmtShort(d))).join(', ')}${absentDays.length > 6 ? '…' : ''}</p>` : ''}`;
  };
  $('#calPrev').addEventListener('click', () => { ui.month = step(ui.month, -1); draw(); });
  $('#calNext').addEventListener('click', () => { ui.month = step(ui.month, 1); draw(); });
  draw();
}

/* ============================================================
   HOMEWORK
   ============================================================ */
function initHomework() {
  if (!kid()) { $('#portal-app').innerHTML = noChild(); return; }
  $$('#phType button').forEach(b => b.classList.toggle('on', b.dataset.type === ui.hwType));
  $('#phDue').checked = ui.hwDue;
  const render = () => {
    const d = today();
    const list = classHomework().filter(h => (ui.hwType === 'all' || h.type === ui.hwType) && (!ui.hwDue || (h.type === 'homework' && h.due >= d)));
    if (!list.length) { $('#phList').innerHTML = `<div class="panel-card">${emptyState('ic-book', ui.hwDue ? 'Nothing due' : 'Nothing posted yet', ui.hwDue ? 'All homework is done or past its due date.' : '')}</div>`; return; }
    let last = '';
    $('#phList').innerHTML = list.map(h => {
      const head = h.assigned !== last ? `<div class="day-head">${h.assigned === d ? 'Today' : esc(S.fmtShort(h.assigned))}</div>` : '';
      last = h.assigned;
      return head + hwCard(h);
    }).join('');
  };
  $('#phType').addEventListener('click', e => {
    const b = e.target.closest('[data-type]'); if (!b) return;
    ui.hwType = b.dataset.type;
    $$('#phType button').forEach(x => x.classList.toggle('on', x === b));
    render();
  });
  $('#phDue').addEventListener('change', e => { ui.hwDue = e.target.checked; render(); });
  render();
}

/* ============================================================
   MARKS AND REPORT CARD
   ============================================================ */
function initMarks() {
  const k = kid();
  if (!k) { $('#portal-app').innerHTML = noChild(); return; }
  const pub = publishedExams();
  const waiting = S.db.exams.filter(x => x.yearId === S.currentYear().id && !x.published && x.start <= today());
  $('#pmNote').innerHTML = waiting.length ? `<div class="alert">${ico('ic-clock')}<div><b>${waiting.map(x => esc(x.name)).join(', ')}: results not published yet</b>Marks appear here as soon as the school publishes them.</div></div>` : '';
  if (!pub.length) {
    $('#pmTabs').hidden = true; $('#pmPrint').hidden = true;
    $('#pmCard').innerHTML = `<div class="panel-card">${emptyState('ic-chart', 'No results yet', 'Results appear here once the school publishes them.')}</div>`;
    return;
  }
  if (!pub.some(x => x.id === ui.exam)) ui.exam = pub[pub.length - 1].id;
  $('#pmTabs').innerHTML = pub.map(x => `<button type="button" data-exam="${x.id}" class="${x.id === ui.exam ? 'on' : ''}">${esc(x.name)}</button>`).join('');
  const draw = () => {
    const ex = S.exam(ui.exam), s = sec(), e = S.enrollmentOf(k.id);
    const r = S.studentResult(k.id, ex.id);
    const yr = S.attendanceSummary(k.id, S.currentYear().start, today());
    $('#pmCard').innerHTML = `<div class="rc">
      <div class="rc-head"><img src="assets/logo.png" alt="" />
        <div><h3>Christina Nursery &amp; Primary School</h3><span>Report card · ${esc(ex.name)} · ${esc(S.currentYear().name)}</span></div>
        <div class="push"><span>Overall grade</span><b>${esc(r.grade)}</b><span>${pct(r.pct)}</span></div></div>
      <div class="rc-info">
        <div><span>Student</span><b>${esc(S.studentName(k))}</b></div>
        <div><span>Class and roll</span><b>${esc(S.sectionLabel(s))} · ${e.roll}</b></div>
        <div><span>Admission no.</span><b>${esc(k.admissionNo)}</b></div>
        <div><span>Attendance this year</span><b>${pct(yr.pct)}</b></div>
      </div>
      <div class="tbl-scroll"><table>
        <thead><tr><th>Subject</th><th>Teacher</th><th class="num">Marks</th><th class="num">Out of</th><th class="num">%</th><th class="num">Grade</th></tr></thead>
        <tbody>${r.rows.map(x => `<tr>
          <td data-col="Subject"><b>${esc(x.subject)}</b></td>
          <td data-col="Teacher">${esc(x.teacher)}</td>
          <td data-col="Marks" class="num">${x.absent ? '<span class="pillx off">Absent</span>' : x.marks == null ? '—' : `<b${x.failed ? ' style="color:var(--bad)"' : ''}>${x.marks}</b>`}</td>
          <td data-col="Out of" class="num">${x.max}</td>
          <td data-col="%" class="num">${pct(x.pct)}</td>
          <td data-col="Grade" class="num"><span class="pillx ${x.pct == null ? 'grey' : x.pct >= 71 ? 'ok' : x.pct >= 41 ? 'info' : 'warn'}">${esc(x.grade)}</span></td></tr>`).join('')}</tbody>
        <tfoot><tr><td>Total</td><td></td><td class="num">${r.total}</td><td class="num">${r.max}</td><td class="num">${pct(r.pct)}</td><td class="num">${esc(r.grade)}</td></tr></tfoot>
      </table></div>
      <div class="rc-foot"><div><b style="color:var(--navy)">Grades:</b> ${S.db.gradeBands.slice().sort((a, b) => b.min - a.min).map(b => `${esc(b.label)} ${b.min}+`).join(' · ')}<br>Pass mark is 35% in each subject.</div>
        <div class="sig">${esc(S.teacherName(s.classTeacherId))}<br><span class="muted">Class teacher</span></div></div>
    </div>`;
  };
  $('#pmTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-exam]'); if (!b) return;
    ui.exam = b.dataset.exam;
    $$('#pmTabs button').forEach(x => x.classList.toggle('on', x === b));
    draw();
  });
  $('#pmPrint').addEventListener('click', () => window.print());
  draw();
}

/* ============================================================
   TIMETABLE, REMARKS, NOTICES
   ============================================================ */
function initTimetable() {
  const s = sec();
  if (!s) { $('#portal-app').innerHTML = noChild(); return; }
  $('#ptTitle').textContent = `${first(kid())}'s week · ${S.sectionLabel(s)}`;
  $('#ptGrid').innerHTML = P.timetableHTML({ sectionId: s.id });
}
function initRemarks() {
  const k = kid();
  if (!k) { $('#portal-app').innerHTML = noChild(); return; }
  const list = S.db.remarks.filter(r => r.studentId === k.id).sort((a, b) => b.date.localeCompare(a.date));
  $('#prList').innerHTML = list.length ? `<div class="lst">${list.map(remarkRow).join('')}</div>` : emptyState('ic-msg', 'No remarks yet', `Notes from ${first(k)}'s teachers will appear here.`);
}
function initNotices() {
  $('#pnList').innerHTML = P.noticeList(S.noticesFor(audience()));
  $('#pnDocs').innerHTML = P.documentList(S.documentsFor(audience()));
}

/* ============================================================
   LEAVE REQUEST (the one thing parents send)
   ============================================================ */
function initLeave() {
  const k = kid();
  if (!k) { $('#portal-app').innerHTML = noChild(); return; }
  const s = sec();
  $('#plTo').innerHTML = `For <b>${esc(S.studentName(k))}</b> · goes to ${esc(S.teacherName(s.classTeacherId))}, class teacher of ${esc(S.sectionLabel(s))}.`;
  const start = S.isSchoolDay(today()) ? today() : S.nextSchoolDay(today());
  $('#pl-from').min = today(); $('#pl-to').min = today();
  $('#pl-from').value = start; $('#pl-to').value = start;
  const days = () => {
    const a = $('#pl-from').value, b = $('#pl-to').value;
    $('#pl-days').textContent = a && b && b >= a ? `${daysBetween(a, b)} school day(s) — ${dateRange(a, b)}` : '';
  };
  ['#pl-from', '#pl-to'].forEach(x => $(x).addEventListener('change', () => { if ($('#pl-to').value < $('#pl-from').value) $('#pl-to').value = $('#pl-from').value; days(); }));
  days();
  const render = () => {
    const list = S.db.studentLeaves.filter(l => l.studentId === k.id).sort((a, b) => b.from.localeCompare(a.from));
    $('#plList').innerHTML = list.length ? `<div class="lst">${list.map(l => {
      const canCancel = l.status !== 'cancelled' && l.from > today();
      return `<div class="li"><span class="lic ${l.status === 'ack' ? 'ok' : l.status === 'sent' ? 'warn' : ''}">${ico('ic-leave')}</span>
        <div class="lb"><b>${esc(dateRange(l.from, l.to))} · ${daysBetween(l.from, l.to)} school day(s)</b><p>${esc(l.reason)}</p>
        <span class="meta">Sent ${esc(S.fmtShort(l.createdAt.slice(0, 10)))}${l.ackAt ? ' · seen by ' + esc(S.teacherName(l.ackBy)) + ' on ' + esc(S.fmtShort(l.ackAt.slice(0, 10))) : ''}</span></div>
        <div class="lr">${leavePill(l.status)}${canCancel ? `<button class="btn btn-soft btn-sm" type="button" data-cancel="${l.id}">Cancel</button>` : ''}</div></div>`;
    }).join('')}</div>` : emptyState('ic-leave', 'No leave requests', `Requests you send for ${first(k)} appear here.`);
  };
  $('#plList').addEventListener('click', async e => {
    const b = e.target.closest('[data-cancel]'); if (!b) return;
    const yes = await P.confirmBox({ title: 'Cancel this leave request?', text: 'The class teacher will see it as cancelled.', ok: 'Cancel request', danger: true });
    if (!yes) return;
    S.db.studentLeaves.find(l => l.id === b.dataset.cancel).status = 'cancelled';
    S.save(); render(); P.refreshCounts();
    toast('Request cancelled', 'info');
  });
  $('#plForm').addEventListener('submit', e => {
    e.preventDefault();
    const from = $('#pl-from').value, to = $('#pl-to').value, reason = $('#pl-reason').value.trim();
    const overlap = S.db.studentLeaves.some(l => l.studentId === k.id && l.status !== 'cancelled' && from <= l.to && to >= l.from);
    const ok = [P.fieldBad('#pl-from', !from || from < today()), P.fieldBad('#pl-to', !to || to < from), P.fieldBad('#pl-reason', !reason)].every(Boolean);
    if (!ok) return;
    if (overlap) { toast('You already asked for leave on these days|Cancel the earlier request first if the dates have changed.', 'warn'); return; }
    S.db.studentLeaves.push({ id: S.newId('sl'), studentId: k.id, from, to, reason, status: 'sent', createdAt: today(), ackBy: null, ackAt: null });
    S.save();
    e.target.reset();
    $('#pl-from').value = start; $('#pl-to').value = start; days();
    toast(`Leave request sent|${S.teacherName(s.classTeacherId)} will see it on the teacher portal.`);
    render(); P.refreshCounts();
  });
  render();
}

/* ============================================================
   PROFILE AND ACCOUNT
   ============================================================ */
function initProfile() {
  const k = kid(), f = fam();
  if (!k) { $('#portal-app').innerHTML = noChild(); return; }
  const s = sec(), e = S.enrollmentOf(k.id);
  $('#ppChild').innerHTML = `<div class="prof-top"><span class="pav">${av(S.studentName(k), k.id)}</span>
      <div><h3>${esc(S.studentName(k))}</h3><span class="muted">${esc(S.sectionLabel(s))} · Roll ${e.roll}</span></div></div>
    <div class="prof-grid">
      <div><span>Admission no.</span><b>${esc(k.admissionNo)}</b></div>
      <div><span>Joined</span><b>${esc(S.fmtDate(k.admissionDate))}</b></div>
      <div><span>Date of birth</span><b>${esc(S.fmtDate(k.dob))}</b></div>
      <div><span>Gender</span><b>${esc(k.gender)}</b></div>
      <div><span>Blood group</span><b>${esc(k.bloodGroup)}</b></div>
      <div><span>Class teacher</span><b>${esc(S.teacherName(s.classTeacherId))}</b></div>
      <div style="grid-column:1/-1"><span>Medical notes</span><b>${esc(k.medical || 'None recorded')}</b></div>
    </div>`;
  const prim = { father: 'Father', mother: 'Mother', guardian: 'Guardian' }[f.primary];
  $('#ppFamily').innerHTML = `<div class="prof-grid">
      <div><span>Father</span><b>${esc(f.fatherName || '—')}</b></div><div><span>Father's phone</span><b>${esc(f.fatherPhone || '—')}</b></div>
      <div><span>Mother</span><b>${esc(f.motherName || '—')}</b></div><div><span>Mother's phone</span><b>${esc(f.motherPhone || '—')}</b></div>
      ${f.guardianName ? `<div><span>Guardian</span><b>${esc(f.guardianName)}</b></div><div><span>Guardian's phone</span><b>${esc(f.guardianPhone)}</b></div>` : ''}
      <div><span>School contacts first</span><b>${esc(prim)}</b></div><div><span>E-mail</span><b>${esc(f.email || '—')}</b></div>
      <div style="grid-column:1/-1"><span>Address</span><b>${esc(f.address || '—')}</b></div>
      <div style="grid-column:1/-1"><span>Children at Christina</span><b>${kids().map(c => esc(c.firstName) + ' (' + esc(S.sectionLabel(S.sectionOfStudent(c.id))) + ')').join(', ')}</b></div>
    </div>`;
}
function initAccount() {
  const f = fam(), u = P.session.user;
  P.accountPage([
    ['Family', f.fatherName + ' & ' + f.motherName.split(' ')[0]],
    ['Login (mobile number)', u.loginId],
    ['Children', kids().map(c => c.firstName).join(', ')],
    ['E-mail', f.email],
    ['Shared login', 'Both parents use this one login']
  ]);
}

/* ============================================================
   BOOT
   ============================================================ */
const sub = fn => () => { const k = kid(); return k ? fn(k) : ''; };
const childTitle = (k, text) => `${esc(S.studentName(k))} · ${esc(S.sectionLabel(S.sectionOfStudent(k.id)))}${text ? ' · ' + esc(text) : ''}`;
P.init({
  role: 'parent',
  order: ['home', 'attendance', 'homework', 'marks', 'timetable', 'remarks', 'leave', 'notices', 'profile', 'account'],
  routes: {
    home:       { page: 'pages/parent-home.html', onLoad: initHome, label: 'Home', icon: 'ic-home', bar: true, title: () => `Hello, ${fam().fatherName.split(' ')[0]} & ${fam().motherName.split(' ')[0]}`, sub: sub(k => childTitle(k, S.fmtShort(today()))) },
    attendance: { page: 'pages/parent-attendance.html', onLoad: initAttendance, label: 'Attendance', icon: 'ic-clipboard', bar: true, group: 'My child', title: 'Attendance', sub: sub(k => childTitle(k)) },
    homework:   { page: 'pages/parent-homework.html', onLoad: initHomework, label: 'Homework & diary', short: 'Homework', icon: 'ic-book', bar: true, group: 'My child', title: 'Homework and class diary', sub: sub(k => childTitle(k)) },
    marks:      { page: 'pages/parent-marks.html', onLoad: initMarks, label: 'Marks & report card', short: 'Marks', icon: 'ic-chart', bar: true, group: 'My child', title: 'Marks and report card', sub: sub(k => childTitle(k, 'published results only')) },
    timetable:  { page: 'pages/parent-timetable.html', onLoad: initTimetable, label: 'Timetable', icon: 'ic-table', group: 'My child', title: 'Timetable', sub: sub(k => childTitle(k)) },
    remarks:    { page: 'pages/parent-remarks.html', onLoad: initRemarks, label: 'Teacher remarks', icon: 'ic-msg', group: 'My child', title: 'Teacher remarks', sub: sub(k => childTitle(k)) },
    leave:      { page: 'pages/parent-leave.html', onLoad: initLeave, label: 'Leave request', icon: 'ic-leave', group: 'My child', title: 'Leave request', sub: sub(k => childTitle(k)) },
    notices:    { page: 'pages/parent-notices.html', onLoad: initNotices, label: 'Notices & documents', icon: 'ic-mega', group: 'School', title: 'Notices and documents', sub: sub(k => 'For all parents, ' + esc(S.grade(S.sectionOfStudent(k.id).gradeId).label) + ' and ' + esc(S.sectionLabel(S.sectionOfStudent(k.id)))) },
    profile:    { page: 'pages/parent-profile.html', onLoad: initProfile, label: 'Child profile', icon: 'ic-user', group: 'School', title: 'Child profile', sub: sub(k => childTitle(k, 'read only')) },
    account:    { page: 'pages/parent-account.html', onLoad: initAccount, label: 'My account', icon: 'ic-key', group: 'School', title: 'My account', sub: () => 'Login and password' }
  },
  who: () => { const f = fam(); return { name: f.fatherName.split(' ')[0] + ' & ' + f.motherName.split(' ')[0] + ' ' + f.surname, sub: 'Parents' }; },
  topExtra: () => {
    const list = kids(), k = kid();
    if (list.length < 2) return '';
    return `<div class="kids" role="tablist" aria-label="Choose your child">${list.map(c => `<button type="button" role="tab" data-kid="${c.id}" class="${k && c.id === k.id ? 'on' : ''}" aria-selected="${k && c.id === k.id}">
      <span class="kav">${av(S.studentName(c), c.id)}</span><span>${esc(c.firstName)}<small>${esc(S.sectionLabel(S.sectionOfStudent(c.id)))}</small></span></button>`).join('')}</div>`;
  },
  onTopClick: e => {
    const b = e.target.closest('[data-kid]');
    if (!b) return;
    setKid(b.dataset.kid);
    P.renderTop();
    P.reload();
    toast(`Showing ${S.student(b.dataset.kid).firstName}|Every page now shows this child.`, 'info');
  },
  counts: () => {
    const k = kid();
    if (!k) return {};
    const d = today(), weekAgo = S.addDays(d, -7);
    const s = sec();
    return {
      homework: { n: s ? S.db.homework.filter(h => h.sectionId === s.id && h.assigned === d).length : 0, hot: true },
      remarks: { n: S.db.remarks.filter(r => r.studentId === k.id && r.date > weekAgo).length, hot: true },
      leave: { n: S.db.studentLeaves.filter(l => l.studentId === k.id && l.status === 'sent').length },
      notices: { n: S.noticesFor(audience()).filter(n => n.date > weekAgo).length }
    };
  }
});
})();
