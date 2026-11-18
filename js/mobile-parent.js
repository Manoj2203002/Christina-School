/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Parent app (phone)
   Same rules as the parent web portal: one family login, only this
   family's children, published results only, and the one thing a
   parent sends is a leave request.
   ============================================================ */
'use strict';
(function () {
const { $, $$, esc, toast } = window.App;
const S = window.SchoolDB;
const P = window.Portal;
const M = window.MApp;
const { av, ico, chip, leavePill, remarkIcon, dateRange, daysBetween, pct } = P;
const KID_KEY = 'christina_portal_child';

let famId = null;
const fam = () => S.family(famId);
const kids = () => S.childrenOfFamily(famId).filter(k => k.status === 'active');
function kid() {
  let id = null; try { id = sessionStorage.getItem(KID_KEY); } catch (e) { /* ignore */ }
  const list = kids(); return list.find(k => k.id === id) || list[0] || null;
}
function setKid(id) { if (kids().some(k => k.id === id)) { try { sessionStorage.setItem(KID_KEY, id); } catch (e) { /* ignore */ } } }
const sec = () => { const k = kid(); return k ? S.sectionOfStudent(k.id) : null; };
const audience = () => { const s = sec(); return { role: 'parent', sectionIds: s ? [s.id] : [], gradeIds: s ? [s.gradeId] : [] }; };
const today = () => S.todayISO();
const ui = { month: null, hwType: 'all', exam: null, ttDay: null };
const noKid = el => { el.innerHTML = M.empty('ic-user', 'No child linked to this login', 'Please contact the school office.'); };

function kidSwitch() {
  const list = kids(), k = kid();
  if (list.length < 2) return '';
  return `<div class="m-kids" id="kidSw" role="tablist" aria-label="Choose your child">${list.map(c => `<button type="button" data-kid="${c.id}" class="${c.id === k.id ? 'on' : ''}" role="tab" aria-selected="${c.id === k.id}"><span class="k">${av(S.studentName(c), c.id)}</span><span>${esc(c.firstName)}<small>${esc(S.sectionLabel(S.sectionOfStudent(c.id)))}</small></span></button>`).join('')}</div>`;
}
function bindKids(el) {
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-kid]'); if (!b) return;
    setKid(b.dataset.kid); M.render();
    toast(`Showing ${S.student(b.dataset.kid).firstName}`, 'info');
  });
}
function hwCard(h) {
  const diary = h.type === 'diary';
  return `<article class="hw-card${diary ? ' diary' : ''}"><div class="hw-top">${diary ? '<span class="pillx draft">Class diary</span>' : `<span class="pillx">${esc(S.subjectName(h.subjectId))}</span>`}
    ${!diary && h.due ? `<span class="pillx ${h.due < today() ? '' : 'ok'}">${h.due < today() ? 'Was due' : 'Due'} ${esc(S.fmtShort(h.due))}</span>` : ''}</div>
    ${diary ? '' : `<h4>${esc(h.title)}</h4>`}<p>${esc(h.description)}</p>
    ${h.file ? `<button class="file-chip" type="button" data-toast="Opens the file in the live app|${esc(h.file)}">${ico('ic-doc', 16)} ${esc(h.file)}</button>` : ''}
    <div class="hw-meta"><span>${esc(S.teacherName(h.createdBy))}</span><span>${esc(S.fmtShort(h.assigned))}</span></div></article>`;
}
const classHw = () => { const s = sec(); return s ? S.db.homework.filter(h => h.sectionId === s.id).sort((a, b) => b.assigned.localeCompare(a.assigned) || b.createdAt.localeCompare(a.createdAt)) : []; };
const published = () => S.db.exams.filter(x => x.yearId === S.currentYear().id && x.published).sort((a, b) => a.order - b.order);
function remarkRow(r) {
  const [i, c] = remarkIcon(r.type);
  return `<div class="m-row"><span class="ic ${c}">${ico(i)}</span><div class="tx"><b>${esc(S.REMARK_TYPES[r.type])} · ${esc(S.teacherName(r.by))}</b><p>${esc(r.text)}</p><span>${esc(S.fmtShort(r.date))}</span></div></div>`;
}

/* ============================================================
   HOME
   ============================================================ */
function pageHome(el) {
  const k = kid(); if (!k) return noKid(el);
  const s = sec(), d = today(), code = S.statusOf(k.id, d);
  const month = S.attendanceSummary(k.id, d.slice(0, 8) + '01', d);
  const due = classHw().filter(h => h.type === 'homework' && h.due >= d);
  const pub = published(), last = pub.length ? S.studentResult(k.id, pub[pub.length - 1].id) : null;
  let todayCard;
  if (!S.isSchoolDay(d)) { const h = S.holidayOn(d); todayCard = `<div class="m-card soft" style="margin:0"><b style="color:var(--navy)">No school today</b><span style="display:block;font-size:.8rem;color:var(--ink-70)">${esc(h ? h.name : 'Weekly holiday')} · back on ${esc(S.fmtShort(S.nextSchoolDay(d)))}</span></div>`; }
  else if (code) { const st = S.STATUS[code]; todayCard = `<div class="m-card ${code === 'A' ? 'bad' : code === 'V' ? 'soft' : 'ok'}" style="margin:0"><b style="color:var(--${code === 'A' ? 'bad' : code === 'V' ? 'navy' : 'ok'})">${esc(k.firstName)} is ${esc(st.label.toLowerCase())} today</b><span style="display:block;font-size:.8rem;color:var(--ink-70)">${code === 'A' ? 'If this is unexpected, please call the school office.' : 'Marked by the class teacher at ' + esc(P.timeAgo(S.attendanceDay(s.id, d).at))}</span></div>`; }
  else todayCard = `<div class="m-card" style="margin:0"><b style="color:var(--navy)">Today's attendance is not marked yet</b><span style="display:block;font-size:.8rem;color:var(--ink-50)">The class teacher marks it in the first period.</span></div>`;
  const nextExam = S.db.exams.filter(x => x.yearId === S.currentYear().id && x.start >= d).sort((a, b) => a.start.localeCompare(b.start))[0];
  const hol = S.db.holidays.filter(h => h.date >= d).sort((a, b) => a.date.localeCompare(b.date))[0];
  const rm = S.db.remarks.filter(r => r.studentId === k.id).sort((a, b) => b.date.localeCompare(a.date))[0];
  el.innerHTML = `<div class="m-hero"><h2>Hello, ${esc(fam().fatherName.split(' ')[0] || fam().motherName.split(' ')[0])}</h2><p>${esc(S.studentName(k))} · ${esc(S.sectionLabel(s))} · ${esc(S.fmtShort(d))}</p>${kidSwitch()}<div class="m-hero-card">${todayCard}</div></div>
    <div class="m-card">${M.ring(month.pct, `Attendance in ${S.MONTHS[Number(d.slice(5, 7)) - 1]}`)}</div>
    <div class="m-stats">
      <button class="m-stat" type="button" data-gotab="homework">${ico('ic-book')}<b>${due.length}</b><span>Homework due</span></button>
      <button class="m-stat" type="button" data-gotab="results">${ico('ic-chart')}<b>${last && last.pct != null ? esc(last.grade) : '—'}</b><span>${last ? esc(pub[pub.length - 1].name) : 'No results yet'}</span></button>
    </div>
    ${rm ? `<div class="m-sec">From the teachers<button class="push" type="button" data-go="remarks">All</button></div><div class="m-card tight">${remarkRow(rm)}</div>` : ''}
    <div class="m-sec">Latest homework<button class="push" type="button" data-gotab="homework">All</button></div>
    <div class="hw-list">${classHw().slice(0, 2).map(hwCard).join('') || M.empty('ic-book', 'Nothing posted yet', '')}</div>
    <div class="m-sec">Coming up</div><div class="m-card tight">
      ${nextExam ? `<div class="m-row"><span class="ic violet">${ico('ic-chart')}</span><div class="tx"><b>${esc(nextExam.name)}</b><span>${esc(dateRange(nextExam.start, nextExam.end))}</span></div></div>` : ''}
      ${hol ? `<div class="m-row"><span class="ic mari">${ico('ic-sparkle')}</span><div class="tx"><b>${esc(hol.name)}</b><span>${esc(S.fmtShort(hol.date))} · school closed</span></div></div>` : ''}
      ${S.noticesFor(audience()).slice(0, 2).map(n => `<button class="m-row" type="button" data-go="notices"><span class="ic">${ico('ic-mega')}</span><div class="tx"><b>${esc(n.title)}</b><span>${esc(S.fmtShort(n.date))} · ${esc(S.audienceLabel(n))}</span></div></button>`).join('')}</div>`;
  bindKids(el);
}

/* ============================================================
   ATTENDANCE
   ============================================================ */
function pageAttendance(el) {
  const k = kid(); if (!k) return noKid(el);
  const y = S.currentYear(), maxM = (today() < y.end ? today() : y.end).slice(0, 7), minM = y.start.slice(0, 7);
  if (!ui.month || ui.month < minM || ui.month > maxM) ui.month = maxM;
  const [yy, mm] = ui.month.split('-').map(Number);
  const m = S.attendanceSummary(k.id, ui.month + '-01', ui.month + '-31'), yr = S.attendanceSummary(k.id, y.start, today());
  const step = n => { let a = yy, b = mm + n; if (b > 12) { b = 1; a++; } if (b < 1) { b = 12; a--; } return `${a}-${String(b).padStart(2, '0')}`; };
  el.innerHTML = kidSwitch().replace('m-kids', 'm-kids m-kids-light') + `
    <div class="m-card"><h3>${esc(S.MONTHS[mm - 1])} ${yy}<span class="push" style="display:flex;gap:6px"><button class="m-icon" style="width:34px;height:34px" type="button" id="cPrev"${ui.month <= minM ? ' disabled' : ''} aria-label="Previous month">${ico('ic-chev-l', 16)}</button><button class="m-icon" style="width:34px;height:34px" type="button" id="cNext"${ui.month >= maxM ? ' disabled' : ''} aria-label="Next month">${ico('ic-chev-r', 16)}</button></span></h3>
      ${P.calendarHTML(k.id, yy, mm - 1)}${P.legendHTML()}</div>
    <div class="m-card">${M.ring(m.pct, 'This month')}<div class="m-sum" style="margin-top:12px">${S.STATUS_ORDER.map(c => `<span class="att-chip ${S.STATUS[c].cls}">${m[c]} ${S.STATUS[c].label}</span>`).join('')}</div></div>
    <div class="m-card"><b style="color:var(--navy)">This school year: ${pct(yr.pct)}</b><div class="m-bar ${yr.pct >= 90 ? 'ok' : 'warn'}"><i style="width:${yr.pct || 0}%"></i></div><span style="display:block;font-size:.76rem;color:var(--ink-50);margin-top:6px">${yr.days} days counted · ${yr.A} absent · ${yr.V} on leave. Late counts as present; half day as half.</span></div>`;
  $('#cPrev').addEventListener('click', () => { ui.month = step(-1); M.render(); });
  $('#cNext').addEventListener('click', () => { ui.month = step(1); M.render(); });
  bindKids(el);
}

/* ============================================================
   HOMEWORK
   ============================================================ */
function pageHomework(el) {
  const k = kid(); if (!k) return noKid(el);
  const d = today();
  const list = classHw().filter(h => ui.hwType === 'all' ? true : ui.hwType === 'due' ? (h.type === 'homework' && h.due >= d) : h.type === ui.hwType);
  const dueN = classHw().filter(h => h.type === 'homework' && h.due >= d).length;
  let last = '';
  el.innerHTML = kidSwitch().replace('m-kids', 'm-kids m-kids-light') + M.chips('phT', [['all', 'All'], ['due', 'Still due', dueN], ['homework', 'Homework'], ['diary', 'Diary']], ui.hwType)
    + `<div class="hw-list">${list.length ? list.map(h => { const hd = h.assigned !== last ? `<div class="day-head">${h.assigned === d ? 'Today' : esc(S.fmtShort(h.assigned))}</div>` : ''; last = h.assigned; return hd + hwCard(h); }).join('') : M.empty('ic-book', 'Nothing here', '')}</div>`;
  $('#phT').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { ui.hwType = b.dataset.k; M.render(); } });
  bindKids(el);
}

/* ============================================================
   RESULTS (published only)
   ============================================================ */
function pageResults(el) {
  const k = kid(); if (!k) return noKid(el);
  const pub = published();
  const waiting = S.db.exams.filter(x => x.yearId === S.currentYear().id && !x.published && x.start <= today());
  const note = waiting.length ? `<div class="m-card soft"><b style="color:var(--navy)">${waiting.map(x => esc(x.name)).join(', ')}: not published yet</b><span style="display:block;font-size:.78rem;color:var(--ink-70)">Marks appear here once the school publishes them.</span></div>` : '';
  if (!pub.length) { el.innerHTML = kidSwitch().replace('m-kids', 'm-kids m-kids-light') + note + M.empty('ic-chart', 'No results yet', ''); bindKids(el); return; }
  if (!pub.some(x => x.id === ui.exam)) ui.exam = pub[pub.length - 1].id;
  const ex = S.exam(ui.exam), r = S.studentResult(k.id, ex.id);
  el.innerHTML = kidSwitch().replace('m-kids', 'm-kids m-kids-light') + M.chips('rsE', pub.map(x => [x.id, x.name]), ui.exam) + note
    + `<div class="m-card accent" style="background:linear-gradient(150deg,var(--navy),var(--navy-3));display:flex;align-items:center;gap:14px">
        <div style="flex:1"><span style="font-size:.76rem;color:#B6CBEB;font-weight:700">${esc(ex.name)} · ${esc(S.sectionLabel(sec()))}</span><b style="display:block;font-size:1.1rem;margin-top:4px">${r.total} / ${r.max} · ${pct(r.pct)}</b><span style="font-size:.76rem;color:#B6CBEB">Overall grade</span></div>
        <span class="m-grade">${esc(r.grade)}</span></div>
    <div class="m-card">${r.rows.map(x => `<div class="m-subj"><div class="top"><b>${esc(x.subject)}</b><span${x.failed ? ' style="color:var(--bad)"' : ''}>${x.absent ? 'Absent' : x.marks == null ? '—' : x.marks + ' / ' + x.max}</span><span class="pillx ${x.pct >= 71 ? 'ok' : ''}">${esc(x.grade)}</span></div>
        <div class="m-bar ${x.pct >= 71 ? 'ok' : x.pct >= 41 ? '' : 'warn'}"><i style="width:${x.pct || 0}%"></i></div><small>${esc(x.teacher)}</small></div>`).join('')}</div>
    <p style="font-size:.74rem;color:var(--ink-50);text-align:center">Grades: ${S.db.gradeBands.slice().sort((a, b) => b.min - a.min).map(b => `${esc(b.label)} ${b.min}+`).join(' · ')} · pass mark 35%</p>`;
  $('#rsE').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { ui.exam = b.dataset.k; M.render(); } });
  bindKids(el);
}

/* ============================================================
   MORE
   ============================================================ */
function pageMore(el) {
  const k = kid(), f = fam();
  const waiting = k ? S.db.studentLeaves.filter(l => l.studentId === k.id && l.status === 'sent').length : 0;
  const item = (go, icon, cls, label, sub, badge) => `<button class="m-row" type="button" data-go="${go}"><span class="ic ${cls}">${ico(icon)}</span><div class="tx"><b>${esc(label)}</b><span>${esc(sub)}</span></div><span class="end">${badge ? `<span class="pillx draft">${badge}</span>` : ''}${ico('ic-chev-r', 16)}</span></button>`;
  el.innerHTML = `<div class="m-card" style="display:flex;gap:12px;align-items:center"><span class="m-av" style="width:56px;height:56px;border-radius:18px;font-size:1rem">${esc(S.initials(f.fatherName || f.motherName))}</span>
      <div><b style="color:var(--navy)">The ${esc(f.surname)} family</b><span style="display:block;font-size:.78rem;color:var(--ink-50)">${kids().map(c => esc(c.firstName)).join(', ')}</span></div></div>
    <div class="m-sec">${k ? esc(k.firstName) : 'My child'}</div><div class="m-card tight">
      ${item('leave', 'ic-leave', 'warn', 'Ask for leave', 'Goes to the class teacher', waiting ? waiting + ' sent' : '')}
      ${item('timetable', 'ic-table', 'violet', 'Timetable', 'The week by day')}
      ${item('remarks', 'ic-msg', 'ok', 'Teacher remarks', 'Notes about your child')}
      ${item('profile', 'ic-user', '', 'Child profile', 'Details the school has')}</div>
    <div class="m-sec">School</div><div class="m-card tight">
      ${item('notices', 'ic-mega', 'mari', 'Notices & documents', 'For parents, the grade and the class')}
      ${item('account', 'ic-key', '', 'Account & password', M.session.user.loginId)}</div>
    <button class="m-btn ghost" type="button" data-signout style="margin-top:6px">${ico('ic-logout')} Sign out</button>`;
}
function pageLeave(el) {
  const k = kid(); if (!k) return noKid(el);
  const list = S.db.studentLeaves.filter(l => l.studentId === k.id).sort((a, b) => b.from.localeCompare(a.from));
  el.innerHTML = kidSwitch().replace('m-kids', 'm-kids m-kids-light') + `<div class="m-card soft"><span style="font-size:.82rem;color:var(--ink-70)">Requests for <b>${esc(S.studentName(k))}</b> go to ${esc(S.teacherName(sec().classTeacherId))}, class teacher of ${esc(S.sectionLabel(sec()))}.</span></div>
    <div class="m-card tight">${list.length ? list.map(l => `<div class="m-row"><span class="ic ${l.status === 'ack' ? 'ok' : l.status === 'sent' ? 'warn' : ''}">${ico('ic-leave')}</span><div class="tx"><b>${esc(dateRange(l.from, l.to))}</b><p>${esc(l.reason)}</p><span>${daysBetween(l.from, l.to)} school day(s)${l.ackAt ? ' · seen by ' + esc(S.teacherName(l.ackBy)) : ''}</span>
      ${l.status !== 'cancelled' && l.from > today() ? `<button class="m-btn sm soft" type="button" data-cancel="${l.id}" style="margin-top:8px">Cancel</button>` : ''}</div><span class="end">${leavePill(l.status)}</span></div>`).join('') : M.empty('ic-leave', 'No requests yet', 'Tap + to ask for leave.')}</div>`;
  bindKids(el);
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-cancel]'); if (!b) return;
    if (!(await M.confirm({ title: 'Cancel this request?', text: 'The class teacher will see it as cancelled.', ok: 'Cancel request', danger: true }))) return;
    S.db.studentLeaves.find(l => l.id === b.dataset.cancel).status = 'cancelled'; S.save(); M.render();
  });
}
function leaveSheet() {
  const k = kid(); if (!k) return;
  const start = S.isSchoolDay(today()) ? today() : S.nextSchoolDay(today());
  M.sheet(`<h3>Ask for leave</h3><p class="sub">For ${esc(S.studentName(k))} · ${esc(S.sectionLabel(sec()))}</p>
    <div class="m-two"><div class="m-field"><label for="pl-from">From</label><input id="pl-from" type="date" min="${today()}" value="${start}" /><span class="err">From today on.</span></div>
    <div class="m-field"><label for="pl-to">To</label><input id="pl-to" type="date" min="${today()}" value="${start}" /><span class="err">Not before the start.</span></div></div>
    <div class="m-field"><label for="pl-reason">Reason</label><textarea id="pl-reason" maxlength="300" placeholder="Fever — the doctor advised rest."></textarea><span class="err">Please give a short reason.</span></div>
    <button class="m-btn" type="button" id="plSend">Send to the class teacher</button>`);
  $('#plSend').addEventListener('click', () => {
    const from = $('#pl-from').value, to = $('#pl-to').value, reason = $('#pl-reason').value.trim();
    if (![M.fieldBad('#pl-from', !from || from < today()), M.fieldBad('#pl-to', !to || to < from), M.fieldBad('#pl-reason', !reason)].every(Boolean)) return;
    if (S.db.studentLeaves.some(l => l.studentId === k.id && l.status !== 'cancelled' && from <= l.to && to >= l.from)) { M.fieldBad('#pl-from', true, 'You already asked for leave on these days.'); return; }
    S.db.studentLeaves.push({ id: S.newId('sl'), studentId: k.id, from, to, reason, status: 'sent', createdAt: today(), ackBy: null, ackAt: null });
    S.save(); M.closeSheet(); M.render();
    toast(`Leave request sent|${S.teacherName(sec().classTeacherId)} will see it in the teacher app.`);
  });
}
function pageTimetable(el) {
  const s = sec(); if (!s) return noKid(el);
  const dow = S.dayOfWeek(today());
  if (!ui.ttDay) ui.ttDay = dow >= 1 && dow <= 6 ? dow : 1;
  el.innerHTML = kidSwitch().replace('m-kids', 'm-kids m-kids-light') + M.chips('ptD', [1, 2, 3, 4, 5, 6].map(d => [String(d), S.DAYS[d].slice(0, 3) + (d === dow ? ' •' : '')]), String(ui.ttDay))
    + `<div class="m-card">${S.allPeriods().map(p => {
      if (p.isBreak) return `<div class="m-period"><span class="t">${p.start}</span><span class="s brk">${esc(p.label)}</span></div>`;
      const t = S.ttEntry(s.id, ui.ttDay, p.id), cs = t && t.csId && S.classSubject(t.csId);
      return `<div class="m-period"><span class="t"><b>P${p.no}</b>${p.start}</span><span class="s${cs ? '' : ' free'}"><b>${cs ? esc(S.subjectName(cs.subjectId)) : 'Library / games'}</b>${cs ? `<span>${esc(S.teacherName(cs.teacherId))}</span>` : ''}</span></div>`;
    }).join('')}</div>`;
  $('#ptD').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) { ui.ttDay = Number(b.dataset.k); M.render(); } });
  bindKids(el);
}
function pageRemarks(el) {
  const k = kid(); if (!k) return noKid(el);
  const list = S.db.remarks.filter(r => r.studentId === k.id).sort((a, b) => b.date.localeCompare(a.date));
  el.innerHTML = kidSwitch().replace('m-kids', 'm-kids m-kids-light') + `<div class="m-card tight">${list.length ? list.map(remarkRow).join('') : M.empty('ic-msg', 'No remarks yet', '')}</div>
    <p style="font-size:.74rem;color:var(--ink-50);text-align:center">To reply, write in your child's diary or call the office.</p>`;
  bindKids(el);
}
function pageNotices(el) {
  const docs = S.documentsFor(audience()), ns = S.noticesFor(audience());
  el.innerHTML = `<div class="m-card tight">${ns.length ? ns.map(n => `<div class="m-row"><span class="ic mari">${ico(n.pinned ? 'ic-pin' : 'ic-mega')}</span><div class="tx"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><span>${esc(S.fmtShort(n.date))} · ${esc(S.audienceLabel(n))}</span></div></div>`).join('') : M.empty('ic-bell', 'Nothing new', '')}</div>
    <div class="m-sec">Documents</div><div class="m-card tight">${docs.length ? docs.map(d => `<button class="m-row" type="button" data-toast="Download starts in the live app|${esc(d.file)}"><span class="ic">${ico('ic-doc')}</span><div class="tx"><b>${esc(d.title)}</b><span>${esc(d.file)} · ${esc(d.size)}</span></div><span class="end">${ico('ic-arrow-u', 16)}</span></button>`).join('') : M.empty('ic-doc', 'No documents', '')}</div>`;
}
function pageProfile(el) {
  const k = kid(); if (!k) return noKid(el);
  const s = sec(), f = fam();
  const row = (a, b) => `<div class="m-row"><div class="tx"><span>${esc(a)}</span><b>${esc(b || '—')}</b></div></div>`;
  el.innerHTML = kidSwitch().replace('m-kids', 'm-kids m-kids-light') + `<div class="m-card" style="text-align:center"><span class="m-av" style="width:76px;height:76px;border-radius:24px;margin:0 auto 8px">${av(S.studentName(k), k.id)}</span><b style="font-size:1.1rem;color:var(--navy)">${esc(S.studentName(k))}</b><span style="display:block;font-size:.8rem;color:var(--ink-50)">${esc(S.sectionLabel(s))} · Roll ${S.enrollmentOf(k.id).roll}</span></div>
    <div class="m-card tight">${row('Admission no.', k.admissionNo)}${row('Date of birth', S.fmtDate(k.dob))}${row('Blood group', k.bloodGroup)}${row('Class teacher', S.teacherName(s.classTeacherId))}${row('Medical notes', k.medical || 'None recorded')}</div>
    <div class="m-sec">Family</div><div class="m-card tight">${row('Father', f.fatherName + (f.fatherPhone ? ' · ' + f.fatherPhone : ''))}${row('Mother', f.motherName + (f.motherPhone ? ' · ' + f.motherPhone : ''))}${row('Address', f.address)}</div>
    <div class="m-card soft"><span style="font-size:.8rem;color:var(--ink-70)">Something out of date? Please tell the school office — parents cannot change these details in the app.</span></div>`;
  bindKids(el);
}

M.define('parent', {
  cls: 'm-parent',
  init(s) { famId = s.refId; },
  tabs: [{ key: 'home', label: 'Home', icon: 'ic-home' }, { key: 'attendance', label: 'Attendance', icon: 'ic-clipboard' }, { key: 'homework', label: 'Homework', icon: 'ic-book' }, { key: 'results', label: 'Results', icon: 'ic-chart' }, { key: 'more', label: 'More', icon: 'ic-grid' }],
  headRight: () => `<button class="m-icon" type="button" data-go="notices" aria-label="Notices">${ico('ic-bell')}</button><button class="m-av" type="button" data-go="account" aria-label="My account">${esc(S.initials(fam().fatherName || fam().motherName))}</button>`,
  badges: () => { const s = sec(); return { homework: s ? S.db.homework.filter(h => h.sectionId === s.id && h.assigned === today()).length : 0 }; },
  pages: {
    home: { title: 'Christina', sub: 'Parent', dark: true, render: pageHome },
    attendance: { title: 'Attendance', sub: () => kid() ? S.studentName(kid()) : '', render: pageAttendance },
    homework: { title: 'Homework & diary', sub: () => sec() ? S.sectionLabel(sec()) : '', render: pageHomework },
    results: { title: 'Results', sub: () => kid() ? S.studentName(kid()) + ' · published only' : '', render: pageResults },
    more: { title: 'More', render: pageMore },
    leave: { title: 'Leave request', tab: 'more', render: pageLeave, fab: { label: 'Ask for leave', onClick: leaveSheet } },
    timetable: { title: 'Timetable', tab: 'more', render: pageTimetable },
    remarks: { title: 'Teacher remarks', tab: 'more', render: pageRemarks },
    profile: { title: 'Child profile', tab: 'more', render: pageProfile },
    notices: { title: 'Notices', tab: 'more', render: pageNotices },
    account: { title: 'My account', tab: 'more', render: el => window.MAccountPage(el, [['Family', fam().fatherName + ' & ' + fam().motherName], ['Login name', M.session.user.loginId], ['Children', kids().map(c => c.firstName).join(', ')], ['Shared login', 'Both parents use this one login']]) }
  }
});
})();
