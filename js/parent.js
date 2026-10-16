/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Parent Portal Logic
   ============================================================ */
'use strict';

(function() {
  const { $, $$, esc, db, toast, saveDb, fmt } = window.App || {};

  // Auth check
  const authRaw = sessionStorage.getItem('christina_parent_auth');
  if (!authRaw) {
    window.location.replace('index.html?login=parent');
    return;
  }

  let auth;
  try {
    auth = JSON.parse(authRaw);
  } catch (e) {
    sessionStorage.removeItem('christina_parent_auth');
    window.location.replace('index.html?login=parent');
    return;
  }

  // Ensure database fallback schemas exist
  function ensureParentData() {
    if (!db.examTypes || !db.examTypes.length) {
      db.examTypes = ['Term 1', 'Term 2', 'Half Yearly', 'Annual'];
    }

    if (!db.gradeScale || !db.gradeScale.length) {
      db.gradeScale = [
        { min: 90, max: 100, grade: 'A+', label: 'Outstanding', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
        { min: 80, max: 89,  grade: 'A',  label: 'Excellent',   color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
        { min: 70, max: 79,  grade: 'B+', label: 'Very Good',   color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
        { min: 60, max: 69,  grade: 'B',  label: 'Good',        color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
        { min: 50, max: 59,  grade: 'C',  label: 'Satisfactory', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
        { min: 40, max: 49,  grade: 'D',  label: 'Needs Improvement', color: '#EA580C', bg: '#FFF7ED', border: '#FFEDD5' },
        { min: 0,  max: 39,  grade: 'F',  label: 'Unsatisfactory', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' }
      ];
    }

    if (!db.subjectsByGrade) {
      db.subjectsByGrade = {
        'Nursery': ['Pre-Reading & Phonics', 'Sensory Play', 'Art & Craft', 'Music & Rhymes', 'Outdoor Motor Play'],
        'LKG': ['Foundational English', 'Tamil Songs & Words', 'Number Readiness', 'Environmental Exploration', 'Art & Movement'],
        'UKG': ['English Literacy', 'Tamil / Hindi Basics', 'Mathematics Foundation', 'General Science', 'Creative Arts', 'Physical Play'],
        'Grade 1': ['English', 'Tamil', 'Mathematics', 'Environmental Studies', 'Art & Craft', 'Music'],
        'Grade 2': ['English', 'Tamil', 'Mathematics', 'Environmental Studies', 'Art & Craft', 'Physical Education', 'Music'],
        'Grade 3': ['English', 'Tamil', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computing & Coding'],
        'Grade 4': ['English', 'Tamil', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computing & Coding'],
        'Grade 5': ['English', 'Tamil', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computing & Coding']
      };
    }

    if (!Array.isArray(db.marks)) {
      db.marks = [];
    }

    // Ensure sample marks for active demo students if missing
    const sampleStudents = db.students || [];
    if (db.marks.length === 0 && sampleStudents.length > 0) {
      sampleStudents.forEach(st => {
        const subs = db.subjectsByGrade[st.grade] || ['English', 'Tamil', 'Mathematics', 'Environmental Studies', 'Art & Craft', 'Music'];
        // Term 1 marks
        subs.forEach((sub, idx) => {
          const score = 88 + ((st.id * 7 + idx * 13) % 11); // deterministic realistic 88-98 score
          db.marks.push({
            id: db.marks.length + 1,
            studentId: st.id,
            examType: 'Term 1',
            subject: sub,
            maxMarks: 100,
            obtained: Math.min(100, score),
            grade: score >= 90 ? 'A+' : 'A',
            enteredBy: 'Class Teacher',
            date: '2026-09-25'
          });
        });

        // Half Yearly marks
        subs.forEach((sub, idx) => {
          const score = 86 + ((st.id * 5 + idx * 17) % 13);
          db.marks.push({
            id: db.marks.length + 1,
            studentId: st.id,
            examType: 'Half Yearly',
            subject: sub,
            maxMarks: 100,
            obtained: Math.min(100, score),
            grade: score >= 90 ? 'A+' : 'A',
            enteredBy: 'Class Teacher',
            date: '2026-12-18'
          });
        });
      });
      saveDb();
    }

    // Ensure diary homework submissions structure
    if (Array.isArray(db.diary)) {
      // Add more rich diary entries if fewer than 4 exist
      if (db.diary.length < 5) {
        db.diary.push(
          {
            id: 101,
            date: '2026-10-02',
            grade: 'Grade 1',
            teacher: 'Deepa Rangarajan',
            subject: 'English Literacy',
            homeworkType: 'Reading & Phonics',
            dueDate: '2026-10-04',
            notes: 'Read reader story "The Jolly Elephant" pages 14-18. Practice 5 new rhyming words in rough notebook.'
          },
          {
            id: 102,
            date: '2026-10-02',
            grade: 'Grade 1',
            teacher: 'Deepa Rangarajan',
            subject: 'Environmental Studies',
            homeworkType: 'Art & Craft Activity',
            dueDate: '2026-10-05',
            notes: 'Identify and draw 3 living and 3 non-living things observed in home garden.'
          },
          {
            id: 103,
            date: '2026-09-29',
            grade: 'Grade 1',
            teacher: 'Deepa Rangarajan',
            subject: 'Tamil Language',
            homeworkType: 'Workbook Exercise',
            dueDate: '2026-09-30',
            notes: 'Recite Tamil vowel rhymes (Uyir Ezhuthukkal). Complete handwriting workbook page 8.'
          }
        );
      }

      db.diary.forEach(entry => {
        if (!entry.submissions || typeof entry.submissions !== 'object') {
          entry.submissions = {};
        }
        // Ensure student has a submission status
        sampleStudents.forEach((st, idx) => {
          if (!entry.submissions[st.id]) {
            // Realistic distribution: mostly Completed, some Pending
            entry.submissions[st.id] = (idx % 4 === 0) ? 'Pending' : (idx % 7 === 0 ? 'Late' : 'Completed');
          }
        });
      });
      saveDb();
    }
  }

  ensureParentData();

  // Resolve Linked Students
  let myStudents = (db.students || []).filter(s => (auth.studentIds || []).includes(s.id));
  if (myStudents.length === 0) {
    // Fallback: match by parent name or first student
    const matched = (db.students || []).filter(s => s.parentName && auth.parentName && s.parentName.toLowerCase().includes(auth.parentName.toLowerCase().split(' ')[0]));
    myStudents = matched.length > 0 ? matched : [(db.students || [])[0]].filter(Boolean);
  }

  let activeStudent = myStudents[0] || null;

  // Active state
  let currentTab = 'overview';
  let activeExam = 'Term 1';
  let activeHwFilter = 'all';
  let currentCalDate = new Date(2026, 9, 1); // October 2026

  // Helper: Initials
  function getInitials(name) {
    if (!name) return 'CS';
    const clean = name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Helper: Get Grade Info from score
  function getGradeInfo(obtained, maxMarks = 100) {
    const pct = Math.round((obtained / maxMarks) * 100);
    const scale = db.gradeScale || [
      { min: 90, max: 100, grade: 'A+', label: 'Outstanding', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
      { min: 80, max: 89,  grade: 'A',  label: 'Excellent',   color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
      { min: 70, max: 79,  grade: 'B+', label: 'Very Good',   color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { min: 60, max: 69,  grade: 'B',  label: 'Good',        color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
      { min: 50, max: 59,  grade: 'C',  label: 'Satisfactory', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
      { min: 40, max: 49,  grade: 'D',  label: 'Needs Improvement', color: '#EA580C', bg: '#FFF7ED', border: '#FFEDD5' },
      { min: 0,  max: 39,  grade: 'F',  label: 'Unsatisfactory', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' }
    ];

    const match = scale.find(s => pct >= s.min && pct <= s.max);
    if (match) {
      let badgeClass = 'c';
      if (match.grade === 'A+') badgeClass = 'aplus';
      else if (match.grade === 'A') badgeClass = 'a';
      else if (match.grade === 'B+') badgeClass = 'bplus';
      else if (match.grade === 'B') badgeClass = 'b';
      else if (match.grade === 'C') badgeClass = 'c';
      else if (match.grade === 'D') badgeClass = 'd';
      else if (match.grade === 'F') badgeClass = 'f';

      return {
        percentage: pct,
        grade: match.grade,
        label: match.label,
        color: match.color,
        bg: match.bg,
        border: match.border,
        badgeClass: badgeClass
      };
    }
    return { percentage: pct, grade: 'B', label: 'Good', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', badgeClass: 'b' };
  }

  // Helper: Get student marks for exam
  function getStudentMarks(studentId, examType) {
    if (!studentId) return [];
    return (db.marks || []).filter(m => m.studentId === studentId && m.examType === examType);
  }

  // Helper: Get homework entries for student
  function getHomeworkForStudent(studentId) {
    if (!activeStudent) return [];
    const gradeDiary = (db.diary || []).filter(d => d.grade === activeStudent.grade);
    return gradeDiary.map(d => {
      const submissions = d.submissions || {};
      const status = submissions[studentId] || 'Pending';
      return {
        ...d,
        studentStatus: status
      };
    });
  }

  // Helper: Find class teacher for active student
  function getClassTeacher(grade, section) {
    const list = db.staff || [];
    let t = list.find(s => s.assignedGrade === grade && (!section || s.assignedSection === section));
    if (!t) t = list.find(s => s.assignedGrade === grade);
    if (!t) {
      t = {
        name: 'Ms. Deepa Rangarajan',
        roomNo: 'Room 102 (East Wing)',
        phone: '+91 98401 22334',
        email: 'deepa.r@christinaschool.edu.in'
      };
    }
    return t;
  }

  // ============================================================
  // PANE 1: OVERVIEW RENDERER
  // ============================================================
  function renderOverview() {
    if (!activeStudent) return;

    const parentDisplayName = auth.parentName || 'Parent';
    $('#bannerGreeting').textContent = `Welcome back, ${parentDisplayName}!`;
    $('#bannerStudentSummary').textContent = `Viewing academic progress, attendance records, and classroom diary for ${activeStudent.name}.`;

    // Child hero card
    $('#overviewChildAvatar').textContent = getInitials(activeStudent.name);
    $('#overviewChildName').textContent = activeStudent.name;
    $('#overviewChildGrade').textContent = `${activeStudent.grade} — Section ${activeStudent.section || 'A'}`;
    $('#overviewChildRoll').textContent = `Roll No: ${activeStudent.rollNo || '01'}`;
    $('#overviewChildAdm').textContent = `Adm: ${activeStudent.admNo || 'CS-2026-001'}`;
    $('#overviewChildBlood').textContent = `Blood: ${activeStudent.bloodGroup || 'O+'}`;

    const teacher = getClassTeacher(activeStudent.grade, activeStudent.section);
    $('#overviewTeacherName').textContent = teacher.name;
    $('#overviewTeacherRoom').textContent = teacher.roomNo || 'Staff Room';

    // KPI 1: Today's Attendance
    const todayStatus = activeStudent.attendanceToday || 'Present';
    const kpiTodayEl = $('#kpiTodayStatus');
    const kpiIc = $('#kpiTodayIc');
    const kpiSub = $('#kpiTodaySub');

    kpiTodayEl.textContent = todayStatus;
    if (todayStatus === 'Present') {
      kpiTodayEl.style.color = '#16A34A';
      kpiIc.style.background = '#DCFCE7';
      kpiIc.style.color = '#16A34A';
      kpiIc.innerHTML = `<svg class="i i-20"><use href="#ic-check"/></svg>`;
      kpiSub.textContent = 'Morning roll-call verified';
    } else if (todayStatus === 'Late') {
      kpiTodayEl.style.color = '#D97706';
      kpiIc.style.background = '#FEF3C7';
      kpiIc.style.color = '#D97706';
      kpiIc.innerHTML = `<svg class="i i-20"><use href="#ic-clock"/></svg>`;
      kpiSub.textContent = 'Admitted after 09:15 AM';
    } else {
      kpiTodayEl.style.color = '#DC2626';
      kpiIc.style.background = '#FEE2E2';
      kpiIc.style.color = '#DC2626';
      kpiIc.innerHTML = `<svg class="i i-20"><use href="#ic-close"/></svg>`;
      kpiSub.textContent = 'Absence reported to office';
    }

    // KPI 2: Overall Attendance %
    const workingDays = 44;
    const attendedDays = todayStatus === 'Absent' ? 41 : 42;
    const attPct = ((attendedDays / workingDays) * 100).toFixed(1);
    $('#kpiAttRate').textContent = `${attPct}%`;
    $('#kpiAttRatio').textContent = `${attendedDays} of ${workingDays} working days`;

    // KPI 3: Latest Exam Grade
    const term1Marks = getStudentMarks(activeStudent.id, 'Term 1');
    if (term1Marks.length > 0) {
      const totalMax = term1Marks.reduce((acc, m) => acc + (m.maxMarks || 100), 0);
      const totalObt = term1Marks.reduce((acc, m) => acc + (m.obtained || 0), 0);
      const overallGrade = getGradeInfo(totalObt, totalMax);
      $('#kpiExamGrade').textContent = overallGrade.grade;
      $('#kpiExamSub').textContent = `Term 1 Assessment (${overallGrade.percentage}%)`;
    } else {
      $('#kpiExamGrade').textContent = '—';
      $('#kpiExamSub').textContent = 'Assessments in progress';
    }

    // KPI 4: Homework Completion
    const hwList = getHomeworkForStudent(activeStudent.id);
    const completedCount = hwList.filter(h => h.studentStatus === 'Completed').length;
    const totalHw = hwList.length || 1;
    const hwPct = Math.round((completedCount / totalHw) * 100);
    $('#kpiHwRate').textContent = `${hwPct}%`;
    $('#kpiHwSub').textContent = `${completedCount} of ${totalHw} tasks submitted`;

    // Recent Homework Activity (Last 3)
    const recentHw = hwList.slice(0, 3);
    const recentHwListEl = $('#recentHwList');
    if (recentHw.length === 0) {
      recentHwListEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--ink-50);font-size:.86rem">No recent classroom notes posted.</div>`;
    } else {
      recentHwListEl.innerHTML = recentHw.map(h => {
        let statusBadge = `<span class="hw-status-badge pending" style="font-size:.72rem">Pending ⏳</span>`;
        if (h.studentStatus === 'Completed') {
          statusBadge = `<span class="hw-status-badge completed" style="font-size:.72rem">Completed ✅</span>`;
        } else if (h.studentStatus === 'Late') {
          statusBadge = `<span class="hw-status-badge late" style="font-size:.72rem">Late ⚠️</span>`;
        }
        return `
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px">
            <div style="min-width:0;flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span class="pillx" style="font-size:.68rem;background:#EDE9FE;color:#6D28D9;padding:1px 6px">${esc(h.subject)}</span>
                <span style="font-size:.72rem;color:var(--ink-50)">Due: ${esc(h.dueDate || 'Tomorrow')}</span>
              </div>
              <div style="font-size:.84rem;font-weight:600;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${esc(h.notes || h.homeworkType || 'Classroom Exercise')}
              </div>
            </div>
            ${statusBadge}
          </div>
        `;
      }).join('');
    }

    // Recent Marks Activity
    const recentMarksListEl = $('#recentMarksList');
    if (term1Marks.length === 0) {
      recentMarksListEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--ink-50);font-size:.86rem">No examination marks published yet.</div>`;
    } else {
      recentMarksListEl.innerHTML = term1Marks.slice(0, 4).map(m => {
        const g = getGradeInfo(m.obtained, m.maxMarks);
        return `
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;font-size:.84rem;margin-bottom:4px">
              <span style="font-weight:600;color:var(--navy)">${esc(m.subject)}</span>
              <span style="font-weight:700;color:${g.color}">${m.obtained} / ${m.maxMarks} (${g.grade})</span>
            </div>
            <div class="p-prog-bar" style="width:100%;height:6px">
              <div class="p-prog-fill" style="width:${g.percentage}%;background:${g.color}"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // ============================================================
  // PANE 2: ACADEMIC MARKS RENDERER
  // ============================================================
  function renderMarks() {
    if (!activeStudent) return;

    // Update active segment button
    $$('#examSegmentBar .exam-seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.exam === activeExam);
    });

    const marks = getStudentMarks(activeStudent.id, activeExam);
    const tbody = $('#marksTableBody');
    const totalScoredEl = $('#marksTotalScored');
    const pctPill = $('#marksPercentagePill');
    const gradeBadge = $('#marksGradeBadge');

    if (marks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:36px;color:var(--ink-50)">
            <svg class="i i-24" style="margin:0 auto 8px;display:block;color:#94A3B8"><use href="#ic-doc"/></svg>
            No examination marks recorded for <b>${esc(activeExam)}</b> yet.<br />
            <span style="font-size:.8rem;color:#64748B">Results will appear here as soon as evaluated by the subject teachers.</span>
          </td>
        </tr>
      `;
      totalScoredEl.textContent = '0 / 0';
      pctPill.textContent = '—';
      gradeBadge.textContent = 'Pending';
      gradeBadge.className = 'grade-badge c';

      $('#footMaxMarks').textContent = '—';
      $('#footObtained').textContent = '—';
      $('#footPercentage').textContent = '—';
      $('#footGrade').innerHTML = '—';
      $('#footSummary').textContent = 'Awaiting assessment publishing';
      return;
    }

    let totalMax = 0;
    let totalObtained = 0;

    tbody.innerHTML = marks.map((m, idx) => {
      totalMax += m.maxMarks || 100;
      totalObtained += m.obtained || 0;
      const g = getGradeInfo(m.obtained, m.maxMarks);
      // Realistic class average benchmark
      const classAvg = Math.round(m.obtained * 0.92 + (idx * 3 % 5));

      return `
        <tr>
          <td>
            <b style="color:var(--navy);display:block">${esc(m.subject)}</b>
            <span style="font-size:.76rem;color:var(--ink-50)">Evaluated by ${esc(m.enteredBy || 'Subject Lead')}</span>
          </td>
          <td style="text-align:center;font-weight:600">${m.maxMarks || 100}</td>
          <td style="text-align:center;font-weight:700;font-size:1.02rem;color:var(--navy)">${m.obtained}</td>
          <td style="text-align:center;font-weight:600;color:var(--ink-70)">${g.percentage}%</td>
          <td style="text-align:center">
            <span class="grade-badge ${g.badgeClass}">${g.grade}</span>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="p-prog-bar" style="flex:1">
                <div class="p-prog-fill" style="width:${g.percentage}%;background:${g.color}"></div>
              </div>
              <span style="font-size:.78rem;font-weight:700;color:${g.color};min-width:75px">${g.label}</span>
            </div>
          </td>
          <td style="text-align:center;color:var(--ink-50);font-weight:600">${classAvg}%</td>
        </tr>
      `;
    }).join('');

    const overall = getGradeInfo(totalObtained, totalMax);
    totalScoredEl.textContent = `${totalObtained} / ${totalMax}`;
    pctPill.textContent = `${overall.percentage}%`;
    gradeBadge.textContent = `${overall.grade} · ${overall.label}`;
    gradeBadge.className = `grade-badge ${overall.badgeClass}`;

    $('#footMaxMarks').textContent = totalMax;
    $('#footObtained').textContent = totalObtained;
    $('#footPercentage').textContent = `${overall.percentage}%`;
    $('#footGrade').innerHTML = `<span class="grade-badge ${overall.badgeClass}">${overall.grade}</span>`;
    $('#footSummary').textContent = `${overall.label} Overall Academic Performance`;
  }

  // ============================================================
  // PANE 3: ATTENDANCE RENDERER
  // ============================================================
  function renderAttendance() {
    if (!activeStudent) return;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    $('#calMonthLabel').textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    let calHtml = '';

    // Empty cells before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      calHtml += `<div class="p-cal-cell empty"></div>`;
    }

    // Days cells
    let workingDaysCount = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = (dayOfWeek === 0) || (dayOfWeek === 6 && (day > 7 && day <= 14)); // Sunday or 2nd Saturday

      let status = '';
      let statusLabel = '';
      let isToday = false;

      // October 2026 simulation
      if (year === 2026 && month === 9 && day === 16) {
        isToday = true;
        status = activeStudent.attendanceToday ? activeStudent.attendanceToday.toLowerCase() : 'present';
        statusLabel = activeStudent.attendanceToday || 'Present';
      } else if (isWeekend) {
        status = 'holiday';
        statusLabel = 'Weekend';
      } else if (year === 2026 && month === 9 && day === 2) {
        status = 'holiday';
        statusLabel = 'Holiday (Gandhi Jayanti)';
      } else if (day > 16 && year === 2026 && month === 9) {
        // Future days in current month
        status = '';
        statusLabel = 'Upcoming';
      } else {
        // Deterministic realistic attendance simulation
        const seed = (activeStudent.id * 11 + day * 7) % 31;
        if (seed === 3) {
          status = 'absent';
          statusLabel = 'Absent';
          absentCount++;
          workingDaysCount++;
        } else if (seed === 9) {
          status = 'late';
          statusLabel = 'Late (09:20)';
          lateCount++;
          workingDaysCount++;
        } else {
          status = 'present';
          statusLabel = 'Present';
          presentCount++;
          workingDaysCount++;
        }
      }

      if (isToday) {
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;
        workingDaysCount++;
      }

      let cellClass = 'p-cal-cell';
      if (isToday) cellClass += ' is-today';
      if (status) cellClass += ` status-${status}`;

      calHtml += `
        <div class="${cellClass}">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="day-num">${day}</span>
            ${isToday ? `<span style="font-size:.64rem;background:#6D28D9;color:#fff;padding:1px 5px;border-radius:4px;font-weight:700">TODAY</span>` : ''}
          </div>
          ${statusLabel ? `<span class="day-status-pill">${statusLabel}</span>` : ''}
        </div>
      `;
    }

    $('#calDaysGrid').innerHTML = calHtml;

    // Attendance stats strip
    const totalWorking = workingDaysCount || 1;
    const rate = ((presentCount + lateCount * 0.5) / totalWorking * 100).toFixed(1);

    $('#attSummaryTotal').textContent = totalWorking;
    $('#attSummaryPresent').textContent = presentCount;
    $('#attSummaryAbsent').textContent = absentCount;
    $('#attSummaryLate').textContent = lateCount;
    $('#attSummaryRate').textContent = `${rate}%`;
    $('#attOverallBadge').textContent = `Monthly Turnout: ${rate}%`;
  }

  // ============================================================
  // PANE 4: HOMEWORK RENDERER
  // ============================================================
  function renderHomework() {
    if (!activeStudent) return;

    // Filter homework for active student's grade
    const allHomework = getHomeworkForStudent(activeStudent.id);

    // Update summary counters
    const totalCnt = allHomework.length;
    const completedCnt = allHomework.filter(h => h.studentStatus === 'Completed').length;
    const pendingCnt = allHomework.filter(h => h.studentStatus === 'Pending').length;
    const lateCnt = allHomework.filter(h => h.studentStatus === 'Late').length;

    $('#hwCountTotal').textContent = `${totalCnt} Total`;
    $('#hwCountCompleted').textContent = `${completedCnt} Completed`;
    $('#hwCountPending').textContent = `${pendingCnt} Pending`;
    $('#hwCountLate').textContent = `${lateCnt} Late`;

    $('#cntHomeworkPending').textContent = pendingCnt;

    // Update active filter button state
    $$('.hw-filter-bar button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === activeHwFilter);
    });

    // Filter displayed homework items
    const filtered = allHomework.filter(h => {
      if (activeHwFilter === 'all') return true;
      return h.studentStatus.toLowerCase() === activeHwFilter.toLowerCase();
    });

    const listEl = $('#homeworkList');
    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="background:#ffffff;border:1px dashed #CBD5E1;border-radius:16px;padding:48px 24px;text-align:center;color:var(--ink-50)">
          <svg class="i i-24" style="margin:0 auto 10px;color:#94A3B8;display:block"><use href="#ic-book"/></svg>
          <b style="color:var(--navy);display:block;font-size:1.05rem;margin-bottom:4px">No homework matching this filter</b>
          <span>All caught up! There are no ${esc(activeHwFilter)} assignments for this category.</span>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(h => {
      const statusClass = h.studentStatus.toLowerCase();
      let statusIcon = '⏳';
      if (h.studentStatus === 'Completed') statusIcon = '✅';
      else if (h.studentStatus === 'Late') statusIcon = '⚠️';

      const isCompleted = h.studentStatus === 'Completed';

      return `
        <div class="hw-card ${statusClass}" data-hw-id="${h.id}">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
              <span class="pillx" style="font-size:.76rem;background:#F5F3FF;color:#6D28D9;border:1px solid #DDD6FE;font-weight:800">
                ${esc(h.subject)}
              </span>
              <span style="font-size:.78rem;background:#F1F5F9;color:var(--ink-70);padding:2px 8px;border-radius:6px;font-weight:600">
                ${esc(h.homeworkType || 'Class Exercise')}
              </span>
              <span style="font-size:.76rem;color:var(--ink-50);display:flex;align-items:center;gap:4px">
                <svg class="i i-12"><use href="#ic-clock"/></svg> Due: <b>${esc(h.dueDate || 'Tomorrow')}</b>
              </span>
            </div>

            <h4 style="margin:0 0 6px;font-size:1.05rem;color:var(--navy);font-family:var(--sans)">
              ${esc(h.notes || 'Please complete assigned exercises.')}
            </h4>

            <div style="font-size:.78rem;color:var(--ink-50);display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:8px">
              <span>Teacher: <b>${esc(h.teacher || 'Class Teacher')}</b></span>
              <span>Assigned: <b>${esc(h.date || 'Today')}</b></span>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex-shrink:0">
            <span class="hw-status-badge ${statusClass}">
              ${statusIcon} ${esc(h.studentStatus)}
            </span>
            <button type="button" class="hw-toggle-btn" data-toggle-hw="${h.id}">
              ${isCompleted ? 'Mark as Incomplete' : 'Mark Completed ✅'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ============================================================
  // PANE 5: REPORT CARD RENDERER
  // ============================================================
  function renderReport() {
    if (!activeStudent) return;

    const selectedExam = $('#reportExamSelect').value || 'Term 1';
    $('#rcExamBanner').textContent = `STUDENT PROGRESS & EVALUATION REPORT — ${selectedExam.toUpperCase()}`;

    $('#rcStudentName').textContent = activeStudent.name;
    $('#rcAdmNo').textContent = activeStudent.admNo || 'CS-2026-001';
    $('#rcGradeSec').textContent = `${activeStudent.grade} - Section ${activeStudent.section || 'A'}`;
    $('#rcRollNo').textContent = activeStudent.rollNo || '01';

    const teacher = getClassTeacher(activeStudent.grade, activeStudent.section);
    $('#rcClassTeacher').textContent = teacher.name;

    const workingDays = 44;
    const attendedDays = activeStudent.attendanceToday === 'Absent' ? 41 : 42;
    const attPct = ((attendedDays / workingDays) * 100).toFixed(1);
    $('#rcAttendance').textContent = `${attendedDays} / ${workingDays} Days (${attPct}%)`;

    const marks = getStudentMarks(activeStudent.id, selectedExam);
    const tbody = $('#rcTableBody');

    if (marks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:36px;color:#64748B">
            Official evaluation records for <b>${esc(selectedExam)}</b> have not yet been finalised.<br />
            <span style="font-size:.82rem">Please select "Term 1" from the dropdown above to view published results.</span>
          </td>
        </tr>
      `;
      $('#rcFootMax').textContent = '—';
      $('#rcFootScored').textContent = '—';
      $('#rcFootGrade').innerHTML = '—';
      $('#rcFootResult').innerHTML = '<b>Result: PENDING</b>';
      $('#rcSummaryPercentage').textContent = '—';
      $('#rcSummaryGrade').textContent = 'Awaiting Evaluation';
      $('#rcTeacherRemark').textContent = 'Academic evaluation for this examination term is currently underway.';
      return;
    }

    let totalMax = 0;
    let totalScored = 0;

    tbody.innerHTML = marks.map((m, idx) => {
      totalMax += m.maxMarks || 100;
      totalScored += m.obtained || 0;
      const g = getGradeInfo(m.obtained, m.maxMarks);

      let remark = 'Consistent grasping and cheerful curiosity.';
      if (m.obtained >= 95) remark = 'Exemplary grasp of core concepts and foundational mastery.';
      else if (m.obtained >= 90) remark = 'Thorough understanding and active classroom engagement.';
      else if (m.obtained >= 80) remark = 'Very good work with steady, eager application.';
      else if (m.obtained >= 70) remark = 'Good effort; responds warmly to interactive practice.';

      return `
        <tr>
          <td style="text-align:center;font-weight:700">${idx + 1}</td>
          <td><b>${esc(m.subject)}</b></td>
          <td style="text-align:center">${m.maxMarks || 100}</td>
          <td style="text-align:center">35</td>
          <td style="text-align:center;font-weight:700;font-size:.95rem">${m.obtained}</td>
          <td style="text-align:center">
            <span class="grade-badge ${g.badgeClass}">${g.grade}</span>
          </td>
          <td style="font-size:.82rem;color:#334155">${remark}</td>
        </tr>
      `;
    }).join('');

    const overall = getGradeInfo(totalScored, totalMax);
    $('#rcFootMax').textContent = totalMax;
    $('#rcFootScored').textContent = totalScored;
    $('#rcFootGrade').innerHTML = `<span class="grade-badge ${overall.badgeClass}">${overall.grade}</span>`;
    $('#rcFootResult').innerHTML = `<b>Result: PASSED WITH DISTINCTION</b>`;

    $('#rcSummaryPercentage').textContent = `${overall.percentage}%`;
    $('#rcSummaryGrade').textContent = `${overall.grade} (${overall.label})`;

    // Tailored teacher remark
    $('#rcTeacherRemark').textContent = `${activeStudent.name.split(' ')[0]} displays joyful curiosity, excellent listening skills, and consistent focus across all subjects. A pleasure to have in class!`;
  }

  // ============================================================
  // TAB SWITCHER
  // ============================================================
  function switchTab(tabId) {
    currentTab = tabId;

    // Update navigation button active state
    $$('.p-nav button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Toggle panes
    const panes = ['overview', 'marks', 'attendance', 'homework', 'report'];
    panes.forEach(p => {
      const paneEl = $(`#pane${p.charAt(0).toUpperCase() + p.slice(1)}`);
      if (paneEl) {
        paneEl.style.display = (p === tabId) ? 'block' : 'none';
      }
    });

    // Update top header title and subtitle
    const titles = {
      overview: { title: 'Overview', sub: 'Monitoring academic journey and student development' },
      marks: { title: 'Academic Marks & Evaluations', sub: 'Subject scores, assessment breakdowns, and term performance' },
      attendance: { title: 'Attendance Tracker', sub: 'Daily roll-call history and classroom turnout statistics' },
      homework: { title: 'Homework & Classroom Diary', sub: 'Daily assignments, practice work, and submission tracking' },
      report: { title: 'Official Progress Report', sub: 'Official evaluation, subject marks, and teacher endorsements' }
    };

    const cur = titles[tabId] || titles.overview;
    $('#topTitle').textContent = cur.title;
    $('#topSubtitle').textContent = cur.sub;

    // Render corresponding pane
    if (tabId === 'overview') renderOverview();
    else if (tabId === 'marks') renderMarks();
    else if (tabId === 'attendance') renderAttendance();
    else if (tabId === 'homework') renderHomework();
    else if (tabId === 'report') renderReport();

    // Close mobile drawer if open
    closeMobileDrawer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================================
  // INITIALIZE PROFILE & CHILD SELECTOR
  // ============================================================
  function initProfile() {
    const parentName = auth.parentName || 'Parent';
    $('#pParentName').textContent = parentName;
    $('#pParentAvatar').textContent = getInitials(parentName);

    const container = $('#childSelectorContainer');
    if (!container) return;

    if (myStudents.length > 1) {
      // Multiple children dropdown
      let selectHtml = `<select id="pChildSelect" class="p-child-select-input">`;
      myStudents.forEach(st => {
        const isSelected = activeStudent && st.id === activeStudent.id ? 'selected' : '';
        selectHtml += `<option value="${st.id}" ${isSelected}>${esc(st.name)} (${esc(st.grade)})</option>`;
      });
      selectHtml += `</select>`;
      container.innerHTML = selectHtml;

      $('#pChildSelect').addEventListener('change', e => {
        const selectedId = parseInt(e.target.value, 10);
        activeStudent = myStudents.find(s => s.id === selectedId) || myStudents[0];
        updateTopBadge();
        switchTab(currentTab);
        toast(`Switched student profile to ${activeStudent.name}`, 'ok');
      });
    } else if (activeStudent) {
      // Single child view
      container.innerHTML = `
        <div class="p-child-single-info">
          <div>
            <b style="color:#fff;display:block;font-size:.86rem">${esc(activeStudent.name)}</b>
            <span style="font-size:.72rem;color:#A5B4FC">${esc(activeStudent.grade)} — Sec ${esc(activeStudent.section || 'A')}</span>
          </div>
          <span style="font-size:.7rem;background:rgba(255,255,255,.16);color:#fff;padding:2px 6px;border-radius:4px">
            Roll ${esc(activeStudent.rollNo || '01')}
          </span>
        </div>
      `;
    }

    updateTopBadge();
  }

  function updateTopBadge() {
    if (!activeStudent) return;
    $('#topChildName').textContent = activeStudent.name;
    $('#topChildGrade').textContent = `${activeStudent.grade}-${activeStudent.section || 'A'}`;
    $('#topChildAvatar').textContent = getInitials(activeStudent.name);
  }

  // ============================================================
  // MOBILE DRAWER HANDLERS
  // ============================================================
  function openMobileDrawer() {
    $('#pAside').classList.add('show');
    $('#pAsideVeil').classList.add('show');
  }

  function closeMobileDrawer() {
    $('#pAside').classList.remove('show');
    $('#pAsideVeil').classList.remove('show');
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  function initListeners() {
    // Navigation tabs
    $$('.p-nav button').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        window.location.hash = `#/${tab}`;
      });
    });

    // Hash change routing
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace(/^#\//, '');
      if (['overview', 'marks', 'attendance', 'homework', 'report'].includes(hash)) {
        switchTab(hash);
      }
    });

    // Quick action buttons in Overview
    const btnQuickReport = $('#btnQuickReport');
    if (btnQuickReport) {
      btnQuickReport.addEventListener('click', () => {
        window.location.hash = '#/report';
      });
    }

    const btnQuickHomework = $('#btnQuickHomework');
    if (btnQuickHomework) {
      btnQuickHomework.addEventListener('click', () => {
        window.location.hash = '#/homework';
      });
    }

    // Exam segment selector buttons in Marks pane
    $$('#examSegmentBar .exam-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeExam = btn.dataset.exam;
        renderMarks();
      });
    });

    // Month navigator in Attendance pane
    $('#btnPrevMonth').addEventListener('click', () => {
      currentCalDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1);
      renderAttendance();
    });

    $('#btnNextMonth').addEventListener('click', () => {
      currentCalDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1);
      renderAttendance();
    });

    // Homework filter buttons
    $$('.hw-filter-bar button').forEach(btn => {
      btn.addEventListener('click', () => {
        activeHwFilter = btn.dataset.filter;
        renderHomework();
      });
    });

    // Homework interactive submission toggle
    $('#homeworkList').addEventListener('click', e => {
      const toggleBtn = e.target.closest('[data-toggle-hw]');
      if (!toggleBtn) return;

      const hwId = parseInt(toggleBtn.dataset.toggleHw, 10);
      const diaryItem = (db.diary || []).find(d => d.id === hwId);
      if (!diaryItem || !activeStudent) return;

      if (!diaryItem.submissions) diaryItem.submissions = {};
      const curStatus = diaryItem.submissions[activeStudent.id] || 'Pending';
      const newStatus = (curStatus === 'Completed') ? 'Pending' : 'Completed';
      diaryItem.submissions[activeStudent.id] = newStatus;

      saveDb();
      renderHomework();
      renderOverview();
      toast(`Updated: marked as ${newStatus} for ${activeStudent.name}`, 'ok');
    });

    // Report exam selector dropdown
    $('#reportExamSelect').addEventListener('change', () => {
      renderReport();
    });

    // Print report card button
    $('#btnPrintReport').addEventListener('click', () => {
      window.print();
    });

    // Mobile burger & veil
    $('#pBurger').addEventListener('click', openMobileDrawer);
    $('#pAsideVeil').addEventListener('click', closeMobileDrawer);

    // Logout button
    $('#btnLogoutParent').addEventListener('click', () => {
      sessionStorage.removeItem('christina_parent_auth');
      toast('Signed out successfully|Returning to homepage', 'ok');
      setTimeout(() => {
        window.location.replace('index.html');
      }, 400);
    });

    // Modal close listeners
    $$('[data-close-modal]').forEach(el => {
      el.addEventListener('click', () => {
        $('#modal').classList.remove('open');
      });
    });
  }

  // ============================================================
  // BOOTSTRAP APPLICATION
  // ============================================================
  function init() {
    initProfile();
    initListeners();

    // Check initial hash route
    const hash = window.location.hash.replace(/^#\//, '');
    if (['overview', 'marks', 'attendance', 'homework', 'report'].includes(hash)) {
      switchTab(hash);
    } else {
      switchTab('overview');
    }
  }

  // Run on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
