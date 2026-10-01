/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Teacher Portal Logic
   ============================================================ */
'use strict';

(function() {
  const { $, $$, esc, db, toast, saveDb, fmt } = window.App || {};

  // Auth check
  const authRaw = sessionStorage.getItem('christina_teacher_auth');
  if (!authRaw) {
    window.location.replace('index.html');
    return;
  }

  let auth;
  try {
    auth = JSON.parse(authRaw);
  } catch (e) {
    sessionStorage.removeItem('christina_teacher_auth');
    window.location.replace('index.html');
    return;
  }

  // Ensure default teacher settings
  auth.assignedGrade = auth.assignedGrade || 'Grade 1';
  auth.assignedSection = auth.assignedSection || 'A';
  auth.name = auth.name || 'Staff Teacher';
  auth.desig = auth.desig || 'Class Teacher';

  // State
  let activeClass = auth.assignedGrade;
  let activeGender = 'All';
  let searchQuery = '';
  let activeView = 'cards'; // 'cards' | 'table'
  let attendanceDraft = {};

  const GRADE_DESCRIPTIONS = {
    'Nursery': 'Building playful curiosity, sensory wonder, and gentle social interactions in our youngest learners.',
    'LKG': 'Fostering joyful phonics, natural number awareness, and joyful classroom confidence.',
    'UKG': 'Encouraging sight word mastery, creative expression, and early mathematical discovery.',
    'Grade 1': 'Nurturing young minds through curiosity, foundational numeracy, and joyful phonics.',
    'Grade 2': 'Independent reading, budding storytellers, and hands-on environmental exploration.',
    'Grade 3': 'Introducing bilingual reading, creative science experiments, and Scratch block coding.',
    'Grade 4': 'Analytical inquiry, junior journalism, fraction manipulatives, and campus surveys.',
    'Grade 5': 'Primary graduation prep, foundational mastery, rooftop ecology, and public speaking.'
  };

  // Helper: Initials
  function getInitials(name) {
    if (!name) return 'CS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Helper: Clean phone for dial/wa
  function cleanPhoneDigits(phone) {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  }

  // Helper: Get greeting
  function getTimeGreeting() {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // Helper: Open / Close Modal
  let lastFocus = null;
  function openModal(html, wide) {
    lastFocus = document.activeElement;
    const mc = $('#modalContent');
    const mb = $('#modalBox');
    const m = $('#modal');
    if (mc) mc.innerHTML = html;
    if (mb) mb.className = 'box' + (wide ? ' wide' : '');
    if (m) m.classList.add('open');
    document.body.classList.add('locked');

    setTimeout(() => {
      const f = $('#modalContent input, #modalContent select, #modalContent textarea, #modalContent button');
      if (f && typeof f.focus === 'function') f.focus();
    }, 60);
  }

  function closeModal() {
    const m = $('#modal');
    if (m) m.classList.remove('open');
    document.body.classList.remove('locked');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  // Helper: Log teacher work report
  function logTeacherReport(action, summary, targetGrade) {
    db.teacherReports = db.teacherReports || [];
    const reportItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      teacherName: auth.name,
      teacherUsername: auth.username,
      grade: targetGrade || activeClass,
      action: action,
      summary: summary
    };
    db.teacherReports.unshift(reportItem);
    if (db.teacherReports.length > 100) db.teacherReports.pop();
    if (saveDb) saveDb();
  }

  // Hydrate Teacher Profile
  function initProfile() {
    const teacherRecord = (db.staff || []).find(s => s.username === auth.username) || auth;

    const nameEl = $('#tTeacherName');
    if (nameEl) nameEl.textContent = teacherRecord.name || auth.name;

    const desigEl = $('#tTeacherDesig');
    if (desigEl) desigEl.textContent = teacherRecord.desig || auth.desig;

    const avEl = $('#tAvatar');
    if (avEl) {
      avEl.textContent = getInitials(teacherRecord.name || auth.name);
      if (teacherRecord.avatarColor) avEl.style.background = teacherRecord.avatarColor;
    }

    const pillEl = $('#tAssignedGradePill');
    if (pillEl) pillEl.textContent = `${auth.assignedGrade} - Sec ${auth.assignedSection}`;

    const roomPill = $('#tRoomNoPill');
    if (roomPill) {
      const rm = teacherRecord.roomNo || auth.roomNo || 'Room 102';
      roomPill.textContent = rm.split('(')[0].trim();
      roomPill.title = rm;
    }

    // Setup class selector options
    const selectEl = $('#tClassSelect');
    if (selectEl) {
      const assignedOpt = selectEl.querySelector('option[value="assigned"]');
      if (assignedOpt) {
        assignedOpt.textContent = `My Class: ${auth.assignedGrade} (Sec ${auth.assignedSection})`;
      }
      selectEl.value = 'assigned';
    }

    // Profile Card click listener
    const pCard = $('#tProfileCard');
    if (pCard) {
      pCard.addEventListener('click', () => openTeacherProfileModal());
      pCard.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTeacherProfileModal(); }
      });
    }

    updateBanner();
  }

  // Open Full Teacher Profile & Schedule Modal
  function openTeacherProfileModal() {
    const teacher = (db.staff || []).find(s => s.username === auth.username) || auth;
    const initials = getInitials(teacher.name || auth.name);
    const avBg = teacher.avatarColor || '#1D4ED8';
    const schedule = teacher.schedule || [];
    const studentsInClass = (db.students || []).filter(s => s.grade === (teacher.assignedGrade || auth.assignedGrade));
    const presentToday = studentsInClass.filter(s => (s.attendanceToday || 'Present') === 'Present').length;
    const turnoutRate = studentsInClass.length ? Math.round((presentToday / studentsInClass.length) * 100) : 0;

    const html = `
      <div class="mhead" style="border-bottom:1px solid #E2E8F0;padding-bottom:16px">
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div style="width:52px;height:52px;border-radius:16px;background:${avBg};color:#fff;font-weight:800;font-size:1.25rem;display:grid;place-items:center;box-shadow:0 4px 12px rgba(10,27,61,0.15)">
            ${initials}
          </div>
          <div style="min-width:0;flex:1">
            <h3 id="modalTitle" style="font-size:1.25rem;color:var(--navy);margin:0 0 2px">${esc(teacher.name || auth.name)}</h3>
            <span style="font-size:.82rem;color:#64748B">${esc(teacher.desig || 'Class Teacher')} · ${esc(teacher.dept || 'Primary years')}</span>
          </div>
          <span class="pillx ok" style="font-size:.74rem">● Active Educator</span>
        </div>
      </div>
      <div class="mbody" style="padding-top:16px">
        <!-- Highlights Strip -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;margin-bottom:18px">
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:10px 14px">
            <span style="font-size:.72rem;color:#64748B;font-weight:700;text-transform:uppercase">Classroom</span>
            <b style="display:block;font-size:.95rem;color:#0A1B3D;margin-top:2px">${esc(teacher.assignedGrade || auth.assignedGrade)} - Sec ${esc(teacher.assignedSection || auth.assignedSection || 'A')}</b>
          </div>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:10px 14px">
            <span style="font-size:.72rem;color:#64748B;font-weight:700;text-transform:uppercase">Room Number</span>
            <b style="display:block;font-size:.95rem;color:#0A1B3D;margin-top:2px">${esc(teacher.roomNo || 'Room 102')}</b>
          </div>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:10px 14px">
            <span style="font-size:.72rem;color:#64748B;font-weight:700;text-transform:uppercase">Students Under Care</span>
            <b style="display:block;font-size:.95rem;color:#0A1B3D;margin-top:2px">${studentsInClass.length} Enrolled</b>
          </div>
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:10px 14px">
            <span style="font-size:.72rem;color:#64748B;font-weight:700;text-transform:uppercase">Today's Turnout</span>
            <b style="display:block;font-size:.95rem;color:#16A34A;margin-top:2px">${turnoutRate}% Present</b>
          </div>
        </div>

        <!-- Two Column Details -->
        <div style="background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:14px 18px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.84rem">
          <div><span style="color:#64748B">Academic Qualification:</span> <b style="color:#0A1B3D">${esc(teacher.qual || 'B.Ed.')}</b></div>
          <div><span style="color:#64748B">Teaching Experience:</span> <b style="color:#0A1B3D">${teacher.exp || 8} Years</b></div>
          <div><span style="color:#64748B">Official Email:</span> <b style="color:#0A1B3D">${esc(teacher.email || 'office@christinaschool.edu.in')}</b></div>
          <div><span style="color:#64748B">Contact Mobile:</span> <b style="color:#0A1B3D">${esc(teacher.phone || '+91 98401 22334')}</b></div>
          <div><span style="color:#64748B">Blood Group:</span> <b style="color:#B91C1C">${esc(teacher.bloodGroup || 'O+')}</b></div>
          <div><span style="color:#64748B">Service Since:</span> <b style="color:#0A1B3D">${teacher.joinDate ? fmt(teacher.joinDate) : '2017'}</b></div>
          <div style="grid-column:1/-1;border-top:1px dashed #E2E8F0;padding-top:8px">
            <span style="color:#64748B">Core Subjects:</span> <b style="color:#0A1B3D">${esc(teacher.subjects || 'General Curriculum')}</b>
          </div>
        </div>

        <!-- Daily Classroom Timetable -->
        <div style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <b style="font-size:.92rem;color:var(--navy);display:flex;align-items:center;gap:6px">
              <svg class="i i-16" style="color:#2563EB"><use href="#ic-clock"/></svg> Daily Classroom Period Schedule
            </b>
            <span style="font-size:.76rem;color:#64748B">7 Periods · 2026–27 Academic Year</span>
          </div>

          <div style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse;font-size:.82rem">
              <thead>
                <tr style="background:#F8FAFC;border-bottom:1px solid #E2E8F0;color:#64748B;text-align:left">
                  <th style="padding:8px 12px;width:70px">Period</th>
                  <th style="padding:8px 12px;width:120px">Timing</th>
                  <th style="padding:8px 12px">Subject / Activity</th>
                  <th style="padding:8px 12px">Location</th>
                </tr>
              </thead>
              <tbody>
                ${schedule.length ? schedule.map(p => `
                  <tr style="border-bottom:1px solid #F1F5F9">
                    <td style="padding:8px 12px;font-weight:700;color:var(--navy)">P${p.period}</td>
                    <td style="padding:8px 12px;color:#64748B">${esc(p.time)}</td>
                    <td style="padding:8px 12px;font-weight:600;color:#0A1B3D">${esc(p.subject)}</td>
                    <td style="padding:8px 12px"><span class="pillx" style="font-size:.72rem">${esc(p.room)}</span></td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="4" style="padding:16px;text-align:center;color:#64748B">Schedule will be updated for the new term.</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
          <button type="button" class="btn btn-primary btn-sm" data-close-modal>Close Profile</button>
        </div>
      </div>
    `;

    openModal(html);
  }

  // Update Classroom Welcome Banner
  function updateBanner() {
    const bannerTag = $('#bannerGradeTag');
    const bannerTitle = $('#bannerTitle');
    const bannerSub = $('#bannerSubtitle');
    const greeting = getTimeGreeting();
    const shortName = auth.name.split(' ')[0];

    if (activeClass === 'All') {
      if (bannerTag) bannerTag.textContent = `${greeting}, ${shortName}! · Whole School`;
      if (bannerTitle) bannerTitle.textContent = 'All Grades (Nursery – Grade 5)';
      if (bannerSub) bannerSub.textContent = 'Unified student records, school-wide contact registry, and master directory.';
    } else {
      const sec = (activeClass === auth.assignedGrade) ? auth.assignedSection : 'A';
      if (bannerTag) bannerTag.textContent = `${greeting}, ${shortName}! · Classroom Hub`;
      if (bannerTitle) bannerTitle.textContent = `${activeClass} — Section ${sec}`;
      if (bannerSub) bannerSub.textContent = GRADE_DESCRIPTIONS[activeClass] || 'Dedicated learning space nurturing curiosity, phonics, and joyful foundational education.';
    }
  }

  // Students filtering
  function getFilteredStudents() {
    let list = db.students || [];

    // Filter by class
    if (activeClass !== 'All') {
      list = list.filter(s => s.grade === activeClass);
    }

    // Filter by gender
    if (activeGender !== 'All') {
      list = list.filter(s => s.gender === activeGender);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
        (s.admNo && s.admNo.toLowerCase().includes(q)) ||
        (s.parentName && s.parentName.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      );
    }

    // Sort by roll number
    return list.slice().sort((a, b) => {
      const rA = parseInt(a.rollNo, 10) || 0;
      const rB = parseInt(b.rollNo, 10) || 0;
      if (rA !== rB) return rA - rB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  // Update KPI counters
  function updateKpis() {
    const allInClass = (db.students || []).filter(s => activeClass === 'All' || s.grade === activeClass);
    const total = allInClass.length;
    const present = allInClass.filter(s => (s.attendanceToday || 'Present') === 'Present').length;
    const boys = allInClass.filter(s => s.gender === 'Male').length;
    const girls = allInClass.filter(s => s.gender === 'Female').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    const kTotal = $('#kTotalStudents');
    if (kTotal) kTotal.textContent = total;

    const kPresent = $('#kPresentToday');
    if (kPresent) kPresent.textContent = present;

    const kRate = $('#kPresentRate');
    if (kRate) kRate.textContent = `Present Today (${rate}%)`;

    const kBoys = $('#kBoysCount');
    if (kBoys) kBoys.textContent = boys;

    const kGirls = $('#kGirlsCount');
    if (kGirls) kGirls.textContent = girls;

    const cntStudents = $('#cntStudents');
    if (cntStudents) cntStudents.textContent = total;
  }

  // Render Student Cards and Table
  function renderStudents() {
    const list = getFilteredStudents();
    const cardsGrid = $('#studentCardsGrid');
    const tableBody = $('#studentTableBody');

    updateKpis();

    if (!list.length) {
      const emptyHtml = `
        <div class="empty" style="grid-column:1/-1;background:#fff;border:1px solid #E2E8F0;border-radius:20px;padding:48px 24px;text-align:center;box-shadow:0 2px 10px rgba(10,27,61,0.04)">
          <div style="width:54px;height:54px;border-radius:16px;background:#EFF6FF;color:#2563EB;display:grid;place-items:center;margin:0 auto 16px">
            <svg class="i i-24" style="width:28px;height:28px"><use href="#ic-users"/></svg>
          </div>
          <h3 style="font-size:1.2rem;margin:0 0 8px;color:#0A1B3D;font-weight:700">No students found</h3>
          <p style="color:#64748B;font-size:.9rem;margin:0 0 20px;max-width:400px;margin-left:auto;margin-right:auto">No student records match the active grade or search filters. You can register a new pupil below.</p>
          <button class="btn btn-primary" type="button" id="btnEmptyAdd">
            <svg class="i i-16"><use href="#ic-plus"/></svg> Add First Student
          </button>
        </div>`;
      if (cardsGrid) cardsGrid.innerHTML = emptyHtml;
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:36px;color:#64748B">No students match the current criteria.</td></tr>`;
      
      const emptyAdd = $('#btnEmptyAdd');
      if (emptyAdd) emptyAdd.addEventListener('click', () => openAddStudentModal());
      return;
    }

    // Render Cards View
    if (cardsGrid) {
      cardsGrid.innerHTML = list.map(s => {
        const initials = getInitials(s.name);
        const isBoy = s.gender === 'Male';
        const avBg = isBoy ? 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)' : 'linear-gradient(135deg, #BE185D 0%, #F43F5E 100%)';
        const rawPhone = cleanPhoneDigits(s.phone);
        const waPhone = rawPhone.replace(/^\+/, '');
        const att = s.attendanceToday || 'Present';
        const attClass = att === 'Present' ? 'att-present' : (att === 'Absent' ? 'att-absent' : 'att-late');

        const photoHtml = s.photo
          ? `<img src="${s.photo}" alt="${esc(s.name)}" class="student-photo" />`
          : `<div class="student-av" style="background:${avBg}">${initials}</div>`;

        return `
          <div class="student-card" data-student-card="${s.id}">
            <!-- Card Header -->
            <div class="student-card-head">
              <div class="student-photo-wrap" data-edit-student="${s.id}" title="Click to view or edit student portrait">
                ${photoHtml}
              </div>
              <div class="student-head-meta">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span class="pill-roll">Roll ${esc(s.rollNo || '—')}</span>
                  <span class="pill-adm">${esc(s.admNo || 'CS-ADM')}</span>
                </div>
                <h4 class="student-name" title="${esc(s.name)}">${esc(s.name)}</h4>
                <div class="student-grade-badge">
                  <span>${esc(s.grade)} · Sec ${esc(s.section || 'A')}</span>
                  <span>·</span>
                  <span>${esc(s.gender)}</span>
                  ${s.bloodGroup ? `<span class="pill-blood">${esc(s.bloodGroup)}</span>` : ''}
                </div>
              </div>
              <div class="card-top-actions">
                <button type="button" class="btn-card-icon edit" data-edit-student="${s.id}" title="Edit student details & photo">
                  <svg class="i i-14"><use href="#ic-pencil"/></svg>
                </button>
                <button type="button" class="btn-card-icon delete" data-del-student="${s.id}" title="Remove student">
                  <svg class="i i-14"><use href="#ic-trash"/></svg>
                </button>
              </div>
            </div>

            <!-- Student Details -->
            <div class="student-details">
              <div class="s-detail-row">
                <span class="lbl">Parents</span>
                <span class="val" title="${esc(s.parentName || '—')}">${esc(s.parentName || '—')}</span>
              </div>
              <div class="s-detail-row">
                <span class="lbl">Contact</span>
                <div class="contact-inline-wrap">
                  <span class="val" style="max-width:none"><b>${esc(s.phone || '—')}</b></span>
                  ${rawPhone ? `
                  <a href="https://wa.me/${waPhone}?text=${encodeURIComponent('Hello from Christina School regarding ' + s.name)}" target="_blank" rel="noopener noreferrer" class="contact-icon-chip wa" title="WhatsApp Parent">
                    <svg class="i i-14"><use href="#ic-wa"/></svg>
                  </a>
                  <a href="tel:${rawPhone}" class="contact-icon-chip phone" title="Call Parent">
                    <svg class="i i-14"><use href="#ic-phone"/></svg>
                  </a>` : ''}
                </div>
              </div>
              <div class="s-detail-row">
                <span class="lbl">DOB</span>
                <span class="val">${s.dob ? fmt(s.dob) : '—'}</span>
              </div>
              <div class="med-box-slot ${s.medicalNotes && s.medicalNotes !== 'None' ? 'alert' : 'none'}">
                ${s.medicalNotes && s.medicalNotes !== 'None' 
                  ? `<svg class="i i-14" style="flex-shrink:0;margin-right:6px"><use href="#ic-sparkle"/></svg> <span title="${esc(s.medicalNotes)}">${esc(s.medicalNotes)}</span>`
                  : `<span>No medical alerts</span>`
                }
              </div>
            </div>

            <!-- Single Unified Attendance Control (Instant 1-Click Roll-Call) -->
            <div class="card-att-control">
              <span class="card-att-label">Attendance</span>
              <div class="att-segmented-bar">
                <button type="button" class="att-seg-item present ${att === 'Present' ? 'active' : ''}" data-card-att="${s.id}:Present" title="Mark Present">
                  <span class="dot"></span> Present
                </button>
                <button type="button" class="att-seg-item absent ${att === 'Absent' ? 'active' : ''}" data-card-att="${s.id}:Absent" title="Mark Absent">
                  <span class="dot"></span> Absent
                </button>
                <button type="button" class="att-seg-item late ${att === 'Late' ? 'active' : ''}" data-card-att="${s.id}:Late" title="Mark Late">
                  <span class="dot"></span> Late
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Table View
    if (tableBody) {
      tableBody.innerHTML = list.map(s => {
        const initials = getInitials(s.name);
        const isBoy = s.gender === 'Male';
        const avBg = isBoy ? 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)' : 'linear-gradient(135deg, #BE185D 0%, #F43F5E 100%)';
        const rawPhone = cleanPhoneDigits(s.phone);
        const waPhone = rawPhone.replace(/^\+/, '');
        const att = s.attendanceToday || 'Present';
        const attClass = att === 'Present' ? 'att-present' : (att === 'Absent' ? 'att-absent' : 'att-late');

        return `
          <tr>
            <td><b style="font-size:.9rem;color:var(--navy)">${esc(s.rollNo || '—')}</b></td>
            <td>
              <div style="display:flex;align-items:center;gap:12px">
                ${s.photo 
                  ? `<img src="${s.photo}" alt="${esc(s.name)}" style="width:38px;height:38px;border-radius:10px;object-fit:cover;border:1px solid #CBD5E1;flex-shrink:0" />` 
                  : `<div style="width:38px;height:38px;border-radius:10px;background:${avBg};color:#fff;font-weight:700;display:grid;place-items:center;font-size:.85rem;flex-shrink:0">${initials}</div>`
                }
                <div style="min-width:0">
                  <b style="color:var(--navy);font-size:.92rem;display:block">${esc(s.name)}</b>
                  <span style="font-size:.74rem;color:#64748B">${s.gender} · Blood ${esc(s.bloodGroup || '—')}</span>
                  ${s.medicalNotes && s.medicalNotes !== 'None' ? `<div style="font-size:.72rem;color:#DC2626;font-weight:600">Med: ${esc(s.medicalNotes)}</div>` : ''}
                </div>
              </div>
            </td>
            <td><span class="pillx">${esc(s.admNo || 'CS-ADM')}</span></td>
            <td>${esc(s.gender)}</td>
            <td><span class="tag" style="background:#E7F1FF;color:#1D4ED8;font-size:.76rem;font-weight:600">${esc(s.grade)} - ${esc(s.section || 'A')}</span></td>
            <td><span class="small" style="font-weight:600;color:#0A1B3D">${esc(s.parentName || '—')}</span></td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <a href="tel:${rawPhone}" style="color:#0A1B3D;font-weight:600;font-size:.85rem">${esc(s.phone || '—')}</a>
                ${rawPhone ? `<a href="https://wa.me/${waPhone}" target="_blank" rel="noopener noreferrer" style="color:#10B981" title="WhatsApp"><svg class="i i-16"><use href="#ic-wa"/></svg></a>` : ''}
              </div>
            </td>
            <td><span class="att-status-chip ${attClass}">${att}</span></td>
            <td style="text-align:right;white-space:nowrap">
              <button class="btn btn-soft btn-sm" type="button" data-edit-student="${s.id}" style="padding:4px 8px">Edit</button>
              <button class="btn btn-soft btn-sm" type="button" data-del-student="${s.id}" style="padding:4px 8px;color:#DC2626;border-color:#FEE2E2;margin-left:4px">Delete</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Render Daily Attendance Sheet
  function renderAttendanceSheet() {
    const list = (db.students || []).filter(s => activeClass === 'All' || s.grade === activeClass);
    const tbody = $('#attendanceTableBody');
    const dateLabel = $('#attDateLabel');

    if (dateLabel) {
      const now = new Date();
      dateLabel.textContent = `Date: Today, ${now.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]} ${now.getFullYear()} · Class: ${activeClass === 'All' ? 'All Grades' : activeClass}`;
    }

    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:36px;color:#64748B">No students enrolled in ${esc(activeClass)}.</td></tr>`;
      return;
    }

    // Populate draft status if not set
    let pCount = 0, aCount = 0, lCount = 0;
    list.forEach(s => {
      if (!attendanceDraft[s.id]) {
        attendanceDraft[s.id] = s.attendanceToday || 'Present';
      }
      const st = attendanceDraft[s.id];
      if (st === 'Present') pCount++;
      else if (st === 'Absent') aCount++;
      else if (st === 'Late') lCount++;
    });

    // Update live attendance summary strip
    const sumP = $('#attLivePresent'), sumA = $('#attLiveAbsent'), sumL = $('#attLiveLate'), sumRate = $('#attLiveRate');
    if (sumP) sumP.textContent = `${pCount} Present`;
    if (sumA) sumA.textContent = `${aCount} Absent`;
    if (sumL) sumL.textContent = `${lCount} Late`;
    if (sumRate) {
      const rate = list.length > 0 ? Math.round((pCount / list.length) * 100) : 0;
      sumRate.textContent = `Turnout: ${rate}% (${pCount}/${list.length})`;
    }

    tbody.innerHTML = list.map(s => {
      const current = attendanceDraft[s.id] || 'Present';
      const indicatorClass = current === 'Present' ? 'att-present' : (current === 'Absent' ? 'att-absent' : 'att-late');
      const initials = getInitials(s.name);
      const isBoy = s.gender === 'Male';

      return `
        <tr data-student-row="${s.id}">
          <td><b style="color:var(--navy);font-size:.9rem">${esc(s.rollNo || '—')}</b></td>
          <td>
            <div style="display:flex;align-items:center;gap:12px">
              ${s.photo 
                ? `<img src="${s.photo}" alt="${esc(s.name)}" style="width:40px;height:40px;border-radius:12px;object-fit:cover;border:1px solid #CBD5E1;flex-shrink:0" />` 
                : `<div style="width:40px;height:40px;border-radius:12px;background:${isBoy ? '#1D4ED8' : '#BE185D'};color:#fff;font-weight:700;display:grid;place-items:center;font-size:.85rem;flex-shrink:0">${initials}</div>`
              }
              <div>
                <b style="color:var(--navy);font-size:.92rem;display:block">${esc(s.name)}</b>
                <span style="font-size:.76rem;color:#64748B">Adm: ${esc(s.admNo || '—')}</span>
              </div>
            </div>
          </td>
          <td><span class="pillx" style="font-weight:600">${esc(s.grade)} - ${esc(s.section || 'A')}</span></td>
          <td><span class="att-status-chip ${indicatorClass}" id="chip-${s.id}">${current}</span></td>
          <td style="text-align:right">
            <div class="att-toggle-group" style="justify-content:flex-end">
              <button type="button" class="att-btn present ${current === 'Present' ? 'active' : ''}" data-att-set="${s.id}:Present">Present</button>
              <button type="button" class="att-btn absent ${current === 'Absent' ? 'active' : ''}" data-att-set="${s.id}:Absent">Absent</button>
              <button type="button" class="att-btn late ${current === 'Late' ? 'active' : ''}" data-att-set="${s.id}:Late">Late</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Classroom Diary List
  function renderDiary() {
    const listEl = $('#diaryList');
    if (!listEl) return;

    const entries = (db.diary || []).filter(d => activeClass === 'All' || d.grade === activeClass);

    if (!entries.length) {
      listEl.innerHTML = `<div class="empty" style="padding:28px;text-align:center;color:#64748B">No diary notes posted yet for ${esc(activeClass)}. Use the form on the left to write one.</div>`;
      return;
    }

    const typeColors = {
      'Workbook Exercise': { bg: '#EFF6FF', c: '#1D4ED8', b: '#DBEAFE' },
      'Reading & Phonics': { bg: '#FDF2F8', c: '#BE185D', b: '#FCE7F3' },
      'Art & Craft Activity': { bg: '#ECFDF5', c: '#059669', b: '#A7F3D0' },
      'Practice Worksheet': { bg: '#FFFBEB', c: '#B45309', b: '#FDE68A' },
      'Project / Scrapbook': { bg: '#F5F3FF', c: '#6D28D9', b: '#DDD6FE' },
      'General Classroom Notice': { bg: '#F1F5F9', c: '#475569', b: '#E2E8F0' }
    };

    listEl.innerHTML = entries.map(e => {
      const hw = e.homeworkType || 'Workbook Exercise';
      const col = typeColors[hw] || typeColors['General Classroom Notice'];

      return `
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:16px;box-shadow:0 1px 4px rgba(10,27,61,0.03);position:relative">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span class="tag" style="background:#E7F1FF;color:#1D4ED8;font-size:.74rem;font-weight:700">${esc(e.grade)} · ${esc(e.subject || 'Notice')}</span>
              <span style="background:${col.bg};color:${col.c};border:1px solid ${col.b};padding:2px 8px;border-radius:999px;font-size:.7rem;font-weight:700">${esc(hw)}</span>
            </div>
            <span style="font-size:.76rem;color:#64748B;font-weight:500">${fmt(e.date)}</span>
          </div>
          <p style="margin:6px 0 10px;font-size:.9rem;color:#0A1B3D;line-height:1.5;white-space:pre-line">${esc(e.notes)}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px dashed #E2E8F0;padding-top:8px;margin-top:8px;flex-wrap:wrap;gap:8px">
            <span style="font-size:.76rem;color:#64748B">Teacher: <b>${esc(e.teacher || 'Class Teacher')}</b></span>
            ${e.dueDate ? `<span style="font-size:.74rem;color:#DC2626;font-weight:700;display:inline-flex;align-items:center;gap:4px"><svg class="i i-12"><use href="#ic-cal"/></svg> Due: ${fmt(e.dueDate)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Modal: Add / Edit Student (WITH PHOTO UPLOAD)
  function openAddStudentModal(studentId) {
    const isEdit = typeof studentId === 'number';
    const s = isEdit ? (db.students || []).find(x => x.id === studentId) : null;
    const defaultGrade = activeClass !== 'All' ? activeClass : auth.assignedGrade;
    const grades = ['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

    const nextAdm = isEdit ? s.admNo : `CS-2026-${String(((db.students || []).length || 0) + 1).padStart(3, '0')}`;
    const nextRoll = isEdit ? s.rollNo : String(((db.students || []).filter(x => x.grade === defaultGrade).length || 0) + 1).padStart(2, '0');

    let studentPic = (s && s.photo) ? s.photo : '';

    const html = `
      <div class="mhead">
        <h3 id="modalTitle">${isEdit ? 'Edit Student Details' : 'Add New Student'}</h3>
        <p class="small" style="color:var(--ink-50);margin-top:.35rem">
          ${isEdit ? `Update records, picture, and emergency details for ${esc(s.name)}.` : `Register a new child into ${esc(defaultGrade)} with photo.`}
        </p>
      </div>
      <div class="mbody">
        <!-- Student Photo Upload Zone -->
        <div class="student-upload-banner">
          <div class="student-upload-preview">
            <div class="preview-box" id="studentPhotoPreview">
              ${studentPic 
                ? `<img src="${studentPic}" alt="Student photo preview" />` 
                : `<svg class="i i-24" style="color:#94A3B8;width:34px;height:34px"><use href="#ic-user"/></svg>`
              }
            </div>
            <button type="button" class="rm-btn" id="btnRmStudentPhoto" style="${studentPic ? 'display:grid' : 'display:none'}" aria-label="Remove photo">
              <svg class="i i-12"><use href="#ic-close"/></svg>
            </button>
          </div>
          <div style="flex:1;min-width:0">
            <b style="font-size:.95rem;color:var(--navy);display:block;margin-bottom:3px">Student Photograph</b>
            <span style="font-size:.8rem;color:var(--ink-50);display:block;margin-bottom:10px">Upload student portrait for school ID card, registry, and attendance (JPG or PNG up to 800 KB).</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn btn-soft btn-sm" id="btnChooseStudentPhoto" style="display:inline-flex;align-items:center;gap:6px">
                <svg class="i i-16"><use href="#ic-upload"/></svg> ${studentPic ? 'Change Photo' : 'Upload Student Photo'}
              </button>
              <input type="file" id="studentPhotoInput" accept="image/*" style="display:none" />
            </div>
          </div>
        </div>

        <form id="studentForm" class="fgrid">
          <!-- Student Full Name -->
          <div class="field full" id="fld-sName">
            <label for="sName">Student Full Name *</label>
            <input id="sName" value="${esc(s ? s.name : '')}" placeholder="e.g. Aadhya Rajesh" required />
            <span class="err">Student name is required.</span>
          </div>

          <!-- Gender & DOB -->
          <div class="field">
            <label for="sGender">Gender *</label>
            <select id="sGender" required>
              <option value="Female" ${s && s.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option value="Male" ${s && s.gender === 'Male' ? 'selected' : ''}>Male</option>
            </select>
          </div>

          <div class="field">
            <label for="sDob">Date of Birth</label>
            <input id="sDob" type="date" value="${esc(s ? s.dob : '2020-05-15')}" />
          </div>

          <!-- Grade & Section -->
          <div class="field">
            <label for="sGrade">Assigned Grade *</label>
            <select id="sGrade" required>
              ${grades.map(g => `<option value="${g}" ${(s ? s.grade : defaultGrade) === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>

          <div class="field">
            <label for="sSection">Section</label>
            <select id="sSection">
              <option value="A" ${s && s.section === 'A' ? 'selected' : 'selected'}>Section A</option>
              <option value="B" ${s && s.section === 'B' ? 'selected' : ''}>Section B</option>
              <option value="C" ${s && s.section === 'C' ? 'selected' : ''}>Section C</option>
            </select>
          </div>

          <!-- Roll No & Admission No -->
          <div class="field">
            <label for="sRollNo">Class Roll Number *</label>
            <input id="sRollNo" value="${esc(s ? s.rollNo : nextRoll)}" placeholder="e.g. 05" required />
          </div>

          <div class="field">
            <label for="sAdmNo">Admission Number</label>
            <input id="sAdmNo" value="${esc(s ? s.admNo : nextAdm)}" placeholder="e.g. CS-2026-026" />
          </div>

          <!-- Parent Contact Info -->
          <div class="field full" id="fld-sParentName">
            <label for="sParentName">Parent / Guardian Names *</label>
            <input id="sParentName" value="${esc(s ? s.parentName : '')}" placeholder="e.g. Rajesh Kumar & Meena Rajesh" required />
            <span class="err">Parent or guardian name is required.</span>
          </div>

          <div class="field" id="fld-sPhone">
            <label for="sPhone">Primary Contact Phone *</label>
            <input id="sPhone" type="tel" value="${esc(s ? s.phone : '+91 ')}" placeholder="+91 98400 00000" required />
            <span class="err">Valid 10-digit phone number is required.</span>
          </div>

          <div class="field">
            <label for="sAltPhone">Alternate Phone / WhatsApp</label>
            <input id="sAltPhone" type="tel" value="${esc(s ? (s.altPhone || '') : '')}" placeholder="+91 98400 00000" />
          </div>

          <div class="field">
            <label for="sEmail">Parent Email Address</label>
            <input id="sEmail" type="email" value="${esc(s ? (s.email || '') : '')}" placeholder="parent@example.com" />
          </div>

          <div class="field">
            <label for="sBloodGroup">Blood Group</label>
            <select id="sBloodGroup">
              <option value="O+" ${s && s.bloodGroup === 'O+' ? 'selected' : ''}>O+</option>
              <option value="A+" ${s && s.bloodGroup === 'A+' ? 'selected' : ''}>A+</option>
              <option value="B+" ${s && s.bloodGroup === 'B+' ? 'selected' : ''}>B+</option>
              <option value="AB+" ${s && s.bloodGroup === 'AB+' ? 'selected' : ''}>AB+</option>
              <option value="O-" ${s && s.bloodGroup === 'O-' ? 'selected' : ''}>O-</option>
              <option value="A-" ${s && s.bloodGroup === 'A-' ? 'selected' : ''}>A-</option>
              <option value="B-" ${s && s.bloodGroup === 'B-' ? 'selected' : ''}>B-</option>
              <option value="AB-" ${s && s.bloodGroup === 'AB-' ? 'selected' : ''}>AB-</option>
            </select>
          </div>

          <!-- Address -->
          <div class="field full">
            <label for="sAddress">Residential Address</label>
            <input id="sAddress" value="${esc(s ? (s.address || '') : '')}" placeholder="Door no, street name, Attur – 636102" />
          </div>

          <!-- Medical Notes -->
          <div class="field full">
            <label for="sMedical">Medical Notes / Allergies</label>
            <textarea id="sMedical" placeholder="e.g. None, Mild pollen allergy, wears spectacles...">${esc(s ? (s.medicalNotes || 'None') : 'None')}</textarea>
          </div>

          <!-- Actions -->
          <div class="field full" style="display:flex;gap:10px;margin-top:.8rem;flex-wrap:wrap">
            <button class="btn btn-primary" type="submit">${isEdit ? 'Save Changes' : 'Register Student'}</button>
            <button class="btn btn-soft" type="button" data-close-modal>Cancel</button>
            ${isEdit ? `<button class="btn btn-soft" type="button" id="btnDelInEdit" style="margin-left:auto;color:#DC2626;border-color:#FEE2E2">Delete Student</button>` : ''}
          </div>
        </form>
      </div>
    `;

    openModal(html, true);

    // Wire live input validation dismissal
    ['sName', 'sParentName', 'sPhone'].forEach(fId => {
      const inp = $(`#${fId}`);
      if (inp) {
        inp.addEventListener('input', () => {
          const wrapper = inp.closest('.field');
          if (wrapper) wrapper.classList.remove('bad');
        });
      }
    });

    // Wire student photo uploader
    const photoInput = $('#studentPhotoInput');
    const btnChoose = $('#btnChooseStudentPhoto');
    const previewBox = $('#studentPhotoPreview');
    const rmBtn = $('#btnRmStudentPhoto');

    if (btnChoose && photoInput) {
      btnChoose.addEventListener('click', () => photoInput.click());
    }

    if (photoInput) {
      photoInput.addEventListener('change', e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (file.size > 800 * 1024) {
          if (toast) toast('Photo is too large|Please choose an image under 800 KB to fit browser storage.', 'warn');
          return;
        }
        const reader = new FileReader();
        reader.onload = ev => {
          studentPic = ev.target.result;
          if (previewBox) {
            previewBox.innerHTML = `<img src="${studentPic}" alt="Uploaded student photo" />`;
          }
          if (rmBtn) rmBtn.style.display = 'grid';
          if (btnChoose) btnChoose.innerHTML = `<svg class="i i-16"><use href="#ic-upload"/></svg> Change Photo`;
          if (toast) toast('Photo loaded|Student portrait ready to save.');
        };
        reader.readAsDataURL(file);
      });
    }

    if (rmBtn) {
      rmBtn.addEventListener('click', () => {
        studentPic = '';
        if (previewBox) {
          previewBox.innerHTML = `<svg class="i i-24" style="color:#94A3B8;width:34px;height:34px"><use href="#ic-user"/></svg>`;
        }
        rmBtn.style.display = 'none';
        if (btnChoose) btnChoose.innerHTML = `<svg class="i i-16"><use href="#ic-upload"/></svg> Upload Student Photo`;
        if (photoInput) photoInput.value = '';
      });
    }

    const form = $('#studentForm');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const name = $('#sName').value.trim();
        const gender = $('#sGender').value;
        const dob = $('#sDob').value;
        const grade = $('#sGrade').value;
        const section = $('#sSection').value || 'A';
        const rollNo = $('#sRollNo').value.trim();
        const admNo = $('#sAdmNo').value.trim() || `CS-2026-${String(Date.now()).slice(-3)}`;
        const parentName = $('#sParentName').value.trim();
        const phone = $('#sPhone').value.trim();
        const altPhone = $('#sAltPhone').value.trim() || phone;
        const email = $('#sEmail').value.trim();
        const bloodGroup = $('#sBloodGroup').value;
        const address = $('#sAddress').value.trim();
        const medicalNotes = $('#sMedical').value.trim() || 'None';

        let formHasError = false;
        const fName = $('#fld-sName');
        const fParent = $('#fld-sParentName');
        const fPhone = $('#fld-sPhone');

        if (!name) {
          if (fName) fName.classList.add('bad');
          formHasError = true;
        } else if (fName) {
          fName.classList.remove('bad');
          fName.classList.add('ok');
        }

        if (!parentName) {
          if (fParent) fParent.classList.add('bad');
          formHasError = true;
        } else if (fParent) {
          fParent.classList.remove('bad');
          fParent.classList.add('ok');
        }

        if (!phone || phone.replace(/\D/g, '').length < 6) {
          if (fPhone) fPhone.classList.add('bad');
          formHasError = true;
        } else if (fPhone) {
          fPhone.classList.remove('bad');
          fPhone.classList.add('ok');
        }

        if (formHasError) {
          if (toast) toast('Please fill in required fields|Check student name, parent name, and phone.', 'warn');
          return;
        }

        db.students = db.students || [];

        if (isEdit) {
          s.name = name;
          s.gender = gender;
          s.dob = dob;
          s.grade = grade;
          s.section = section;
          s.rollNo = rollNo;
          s.admNo = admNo;
          s.parentName = parentName;
          s.phone = phone;
          s.altPhone = altPhone;
          s.email = email;
          s.bloodGroup = bloodGroup;
          s.address = address;
          s.medicalNotes = medicalNotes;
          s.photo = studentPic;

          logTeacherReport('student_updated', `Updated details & photo for student ${name} (${grade} - Sec ${section})`, grade);
          if (saveDb) saveDb();
          closeModal();
          renderStudents();
          renderAttendanceSheet();
          if (toast) toast(`Saved changes|Student records for ${name} updated successfully.`);
        } else {
          const maxId = db.students.reduce((m, x) => Math.max(m, x.id || 0), 100);
          const newStudent = {
            id: maxId + 1,
            admNo,
            rollNo,
            name,
            gender,
            grade,
            section,
            dob,
            bloodGroup,
            parentName,
            phone,
            altPhone,
            email,
            address,
            medicalNotes,
            photo: studentPic,
            dateEnrolled: new Date().toISOString().split('T')[0],
            attendanceToday: 'Present'
          };
          db.students.push(newStudent);

          logTeacherReport('student_added', `Enrolled new student ${name} in ${grade} - Section ${section}`, grade);
          if (saveDb) saveDb();
          closeModal();
          renderStudents();
          renderAttendanceSheet();
          if (toast) toast(`Student registered|${name} enrolled in ${grade}.`);
        }
      });
    }

    if (isEdit) {
      const delInEdit = $('#btnDelInEdit');
      if (delInEdit) {
        delInEdit.addEventListener('click', () => {
          closeModal();
          confirmDeleteStudent(studentId);
        });
      }
    }
  }

  // Modal: Delete Student
  function confirmDeleteStudent(studentId) {
    const s = (db.students || []).find(x => x.id === studentId);
    if (!s) return;

    const html = `
      <div class="mhead">
        <h3 id="modalTitle">Delete ${esc(s.name)}?</h3>
      </div>
      <div class="mbody">
        <p style="color:var(--ink-70)">
          Are you sure you want to remove <b>${esc(s.name)}</b> (Roll No: ${esc(s.rollNo)}, ${esc(s.grade)}) from the active classroom register?
        </p>
        <div style="display:flex;gap:10px;margin-top:1.4rem;flex-wrap:wrap">
          <button class="btn btn-primary" type="button" id="doDelStudent" style="background:#DC2626;box-shadow:none">Yes, remove student</button>
          <button class="btn btn-soft" type="button" data-close-modal>Keep student</button>
        </div>
      </div>
    `;

    openModal(html);

    const doDel = $('#doDelStudent');
    if (doDel) {
      doDel.addEventListener('click', () => {
        const idx = db.students.findIndex(x => x.id === studentId);
        if (idx > -1) {
          const removed = db.students.splice(idx, 1)[0];
          logTeacherReport('student_deleted', `Removed student ${removed.name} from ${removed.grade}`, removed.grade);
          if (saveDb) saveDb();
          closeModal();
          renderStudents();
          renderAttendanceSheet();
          if (toast) toast(`Student removed|${removed.name} is no longer in the register.`, 'warn');
        }
      });
    }
  }

  // Export Students to CSV
  function exportStudentsCsv() {
    const list = getFilteredStudents();
    if (!list.length) {
      if (toast) toast('No data to export|The current class filter contains no students.', 'warn');
      return;
    }

    const headers = [
      'Roll No',
      'Admission No',
      'Student Name',
      'Gender',
      'Grade',
      'Section',
      'Date of Birth',
      'Blood Group',
      'Parent / Guardian',
      'Contact Phone',
      'Alternate Phone',
      'Email Address',
      'Residential Address',
      'Medical Notes',
      'Attendance Today'
    ];

    const rows = list.map(s => [
      `"${s.rollNo || ''}"`,
      `"${s.admNo || ''}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${s.gender || ''}"`,
      `"${s.grade || ''}"`,
      `"${s.section || 'A'}"`,
      `"${s.dob || ''}"`,
      `"${s.bloodGroup || ''}"`,
      `"${(s.parentName || '').replace(/"/g, '""')}"`,
      `"${s.phone || ''}"`,
      `"${s.altPhone || ''}"`,
      `"${s.email || ''}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`,
      `"${(s.medicalNotes || 'None').replace(/"/g, '""')}"`,
      `"${s.attendanceToday || 'Present'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanClass = activeClass.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `Christina_School_${cleanClass}_Students_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logTeacherReport('roster_exported', `Exported student directory for ${activeClass} to CSV (${list.length} students)`, activeClass);
    if (toast) toast(`Roster exported|Downloaded ${list.length} student records for ${activeClass}.`);
  }

  // Save attendance sheet
  function saveAttendance() {
    const list = (db.students || []).filter(s => activeClass === 'All' || s.grade === activeClass);
    if (!list.length) return;

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    list.forEach(s => {
      const status = attendanceDraft[s.id] || 'Present';
      s.attendanceToday = status;
      if (status === 'Present') presentCount++;
      else if (status === 'Absent') absentCount++;
      else if (status === 'Late') lateCount++;
    });

    const total = list.length;
    const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;
    const summary = `Marked ${activeClass} daily roll-call: ${presentCount} Present, ${absentCount} Absent, ${lateCount} Late (${pct}% turnout)`;

    logTeacherReport('attendance_marked', summary, activeClass);
    if (saveDb) saveDb();

    updateKpis();
    renderStudents();
    renderAttendanceSheet();

    if (toast) toast(`Attendance recorded|${summary}`);
  }

  // Switch tabs
  function switchTab(tabId) {
    const tabs = ['students', 'attendance', 'diary'];
    tabs.forEach(t => {
      const pane = $(`#pane${t.charAt(0).toUpperCase() + t.slice(1)}`);
      const nav = $(`#nav${t.charAt(0).toUpperCase() + t.slice(1)}`);
      if (pane) pane.style.display = (t === tabId) ? 'block' : 'none';
      if (nav) nav.classList.toggle('active', t === tabId);
    });

    const topTitle = $('#topTitle');
    const banner = $('.t-banner');
    const kpis = $('.t-kpis');

    if (topTitle) {
      if (tabId === 'students') topTitle.textContent = 'Student Directory';
      else if (tabId === 'attendance') topTitle.textContent = 'Daily Attendance Roll-Call';
      else if (tabId === 'diary') topTitle.textContent = 'Classroom Diary';
    }

    if (tabId === 'students') {
      if (banner) banner.style.display = 'flex';
      if (kpis) kpis.style.display = 'grid';
    } else if (tabId === 'attendance') {
      if (banner) banner.style.display = 'none';
      if (kpis) kpis.style.display = 'grid';
    } else if (tabId === 'diary') {
      if (banner) banner.style.display = 'none';
      if (kpis) kpis.style.display = 'none';
    }

    // Smooth scroll to top of workspace
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Auto-close mobile drawer if open
    const aside = $('#tAside');
    const veil = $('#tAsideVeil');
    if (aside && aside.classList.contains('show')) aside.classList.remove('show');
    if (veil && veil.classList.contains('show')) veil.classList.remove('show');

    if (tabId === 'attendance') {
      renderAttendanceSheet();
    } else if (tabId === 'diary') {
      renderDiary();
    }
  }

  // Event Listeners Initialization
  function initListeners() {
    // Navigation Tabs
    const navStudents = $('#navStudents');
    if (navStudents) navStudents.addEventListener('click', () => switchTab('students'));

    const navAttendance = $('#navAttendance');
    if (navAttendance) navAttendance.addEventListener('click', () => switchTab('attendance'));

    const navDiary = $('#navDiary');
    if (navDiary) navDiary.addEventListener('click', () => switchTab('diary'));

    const btnQuickAtt = $('#btnQuickAttendance');
    if (btnQuickAtt) btnQuickAtt.addEventListener('click', () => switchTab('attendance'));

    // Class selector dropdown
    const classSelect = $('#tClassSelect');
    if (classSelect) {
      classSelect.addEventListener('change', e => {
        const val = e.target.value;
        activeClass = (val === 'assigned') ? auth.assignedGrade : val;
        updateBanner();
        renderStudents();
        renderAttendanceSheet();
        renderDiary();
      });
    }

    // Gender filter
    const genderSelect = $('#tGenderFilter');
    if (genderSelect) {
      genderSelect.addEventListener('change', e => {
        activeGender = e.target.value;
        renderStudents();
      });
    }

    // Search bar
    const searchInput = $('#tStudentSearch');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchQuery = e.target.value.trim();
        renderStudents();
      });
    }

    // View switcher (Cards vs Table)
    const btnCards = $('#btnViewCards');
    const btnTable = $('#btnViewTable');
    const gridEl = $('#studentCardsGrid');
    const tableWrap = $('#studentTableWrap');

    if (btnCards && btnTable) {
      btnCards.addEventListener('click', () => {
        activeView = 'cards';
        btnCards.className = 'view-seg-btn active';
        btnTable.className = 'view-seg-btn';
        if (gridEl) gridEl.style.display = 'grid';
        if (tableWrap) tableWrap.style.display = 'none';
      });

      btnTable.addEventListener('click', () => {
        activeView = 'table';
        btnTable.className = 'view-seg-btn active';
        btnCards.className = 'view-seg-btn';
        if (gridEl) gridEl.style.display = 'none';
        if (tableWrap) tableWrap.style.display = 'block';
      });
    }

    // Add Student buttons
    const btnQuickAdd = $('#btnQuickAdd');
    if (btnQuickAdd) btnQuickAdd.addEventListener('click', () => openAddStudentModal());

    const btnMainAdd = $('#btnAddStudentMain');
    if (btnMainAdd) btnMainAdd.addEventListener('click', () => openAddStudentModal());

    // Export CSV
    const btnExport = $('#btnExportStudents');
    if (btnExport) btnExport.addEventListener('click', exportStudentsCsv);

    // Attendance buttons
    const btnMarkAll = $('#btnMarkAllPresent');
    if (btnMarkAll) {
      btnMarkAll.addEventListener('click', () => {
        const list = (db.students || []).filter(s => activeClass === 'All' || s.grade === activeClass);
        list.forEach(s => {
          attendanceDraft[s.id] = 'Present';
        });
        renderAttendanceSheet();
        if (toast) toast('All marked present|Ready to submit daily attendance.');
      });
    }

    const btnSaveAtt = $('#btnSaveAttendance');
    if (btnSaveAtt) btnSaveAtt.addEventListener('click', saveAttendance);

    // Diary Form submit
    const diaryForm = $('#diaryForm');
    if (diaryForm) {
      // Set default tomorrow date on diaryDueDate
      const dueInput = $('#diaryDueDate');
      if (dueInput && !dueInput.value) {
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        dueInput.value = tmrw.toISOString().split('T')[0];
      }

      diaryForm.addEventListener('submit', e => {
        e.preventDefault();
        const subj = ($('#diarySubject').value || '').trim();
        const notes = ($('#diaryNotes').value || '').trim();
        const hwType = $('#diaryHwType') ? $('#diaryHwType').value : 'Workbook Exercise';
        const dueDate = $('#diaryDueDate') ? $('#diaryDueDate').value : '';
        if (!subj || !notes) return;

        db.diary = db.diary || [];
        const entryGrade = (activeClass === 'All') ? auth.assignedGrade : activeClass;
        const newEntry = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          grade: entryGrade,
          teacher: auth.name,
          subject: subj,
          homeworkType: hwType,
          dueDate: dueDate,
          notes: notes
        };
        db.diary.unshift(newEntry);

        logTeacherReport('diary_posted', `Posted ${hwType} in ${subj} for ${entryGrade}`, entryGrade);
        if (saveDb) saveDb();

        $('#diarySubject').value = '';
        $('#diaryNotes').value = '';
        renderDiary();
        if (toast) toast(`Diary note posted|Published ${hwType} for ${entryGrade}.`);
      });
    }

    // Global click delegate for dynamic actions
    document.addEventListener('click', e => {
      // Direct Card Quick Attendance Toggle
      const cardAttBtn = e.target.closest('[data-card-att]');
      if (cardAttBtn) {
        const [sIdStr, status] = cardAttBtn.dataset.cardAtt.split(':');
        const sId = parseInt(sIdStr, 10);
        const student = (db.students || []).find(x => x.id === sId);
        if (student) {
          student.attendanceToday = status;
          attendanceDraft[sId] = status;
          if (saveDb) saveDb();

          // Update active segmented buttons on the card
          const card = cardAttBtn.closest('.student-card');
          if (card) {
            card.querySelectorAll('.att-seg-item').forEach(b => b.classList.remove('active'));
            cardAttBtn.classList.add('active');
          }

          logTeacherReport('attendance_marked', `Marked ${student.name} (${student.grade}) as ${status}`, student.grade);
          updateKpis();
          if (toast) toast(`Attendance updated|${student.name} marked ${status}.`);
        }
        return;
      }

      // Edit student
      const editBtn = e.target.closest('[data-edit-student]');
      if (editBtn) {
        const id = parseInt(editBtn.dataset.editStudent, 10);
        openAddStudentModal(id);
        return;
      }

      // Delete student
      const delBtn = e.target.closest('[data-del-student]');
      if (delBtn) {
        const id = parseInt(delBtn.dataset.delStudent, 10);
        confirmDeleteStudent(id);
        return;
      }

      // Close modal
      if (e.target.closest('[data-close-modal]')) {
        closeModal();
        return;
      }

      // Attendance roll-call quick button click in table
      const attBtn = e.target.closest('[data-att-set]');
      if (attBtn) {
        const [studentId, status] = attBtn.dataset.attSet.split(':');
        const sId = parseInt(studentId, 10);
        attendanceDraft[sId] = status;

        // Update button active state
        const row = attBtn.closest('tr');
        if (row) {
          row.querySelectorAll('.att-btn').forEach(b => b.classList.remove('active'));
          attBtn.classList.add('active');

          const chip = $(`#chip-${sId}`);
          if (chip) {
            chip.textContent = status;
            chip.className = 'att-status-chip ' + (status === 'Present' ? 'att-present' : (status === 'Absent' ? 'att-absent' : 'att-late'));
          }
        }

        // Update live roll-call counter strip
        const list = (db.students || []).filter(s => activeClass === 'All' || s.grade === activeClass);
        let pCount = 0, aCount = 0, lCount = 0;
        list.forEach(s => {
          const st = attendanceDraft[s.id] || 'Present';
          if (st === 'Present') pCount++;
          else if (st === 'Absent') aCount++;
          else if (st === 'Late') lCount++;
        });
        const sumP = $('#attLivePresent'), sumA = $('#attLiveAbsent'), sumL = $('#attLiveLate'), sumRate = $('#attLiveRate');
        if (sumP) sumP.textContent = `${pCount} Present`;
        if (sumA) sumA.textContent = `${aCount} Absent`;
        if (sumL) sumL.textContent = `${lCount} Late`;
        if (sumRate) {
          const rate = list.length > 0 ? Math.round((pCount / list.length) * 100) : 0;
          sumRate.textContent = `Turnout: ${rate}% (${pCount}/${list.length})`;
        }
      }
    });

    // Escape key modal close
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    // Logout
    const btnLogout = $('#btnLogoutTeacher');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('christina_teacher_auth');
        window.location.replace('index.html');
      });
    }

    // Mobile burger toggle
    const burgerBtn = $('#tBurger');
    const aside = $('#tAside');
    const veil = $('#tAsideVeil');
    if (burgerBtn && aside) {
      burgerBtn.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = aside.classList.toggle('show');
        if (veil) veil.classList.toggle('show', isOpen);
      });

      if (veil) {
        veil.addEventListener('click', () => {
          aside.classList.remove('show');
          veil.classList.remove('show');
        });
      }

      document.addEventListener('click', e => {
        if (aside.classList.contains('show') && !aside.contains(e.target) && !e.target.closest('#tBurger')) {
          aside.classList.remove('show');
          if (veil) veil.classList.remove('show');
        }
      });
    }

    // Window resize burger check
    const syncTeacherBurger = () => {
      const isMobile = window.innerWidth <= 860;
      if (burgerBtn) burgerBtn.style.display = isMobile ? 'flex' : 'none';
      if (!isMobile) {
        if (aside) aside.classList.remove('show');
        if (veil) veil.classList.remove('show');
      }
    };
    syncTeacherBurger();
    window.addEventListener('resize', syncTeacherBurger);
  }

  // Initialize teacher portal
  initProfile();
  renderStudents();
  renderAttendanceSheet();
  renderDiary();
  initListeners();

})();
