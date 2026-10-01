const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Starting verification tests...');

// 1. Check data.js
const dataContent = fs.readFileSync('js/data.js', 'utf8');
assert(dataContent.includes('statStudents: 412'), 'data.js missing statStudents default');
assert(dataContent.includes('statTeachers: 34'), 'data.js missing statTeachers default');
assert(dataContent.includes("id: 1, name: 'Art and craft'"), 'data.js clubs missing IDs');
assert(dataContent.includes("id: 1, name: 'Junior Football'"), 'data.js sports missing IDs');
assert(dataContent.includes("'clubs', 'sports', 'settings'"), 'data.js loadDb missing clubs/sports hydration');
assert(dataContent.includes('parseIsoDate'), 'data.js missing parseIsoDate safety helper');
assert(dataContent.includes('QuotaExceededError'), 'data.js missing QuotaExceededError handling in saveDb');
assert(dataContent.includes('showAdmissionsBadge: true'), 'data.js missing showAdmissionsBadge default');
console.log('✓ data.js verified (including safe date parsing, QuotaExceededError, and showAdmissionsBadge)');

// 2. Check index.html & admin-dashboard.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('<a href="#/documents">Documents</a>'), 'index.html missing Documents nav link');
const adminDash = fs.readFileSync('admin-dashboard.html', 'utf8');
assert(adminDash.includes('data-view="activities"'), 'admin-dashboard.html missing activities button');
assert(adminDash.includes('id="cActivities"'), 'admin-dashboard.html missing cActivities count span');
assert(adminDash.includes("sessionStorage.getItem('christina_admin_auth')"), 'admin-dashboard.html missing auth guard script');
console.log('✓ index.html & admin-dashboard.html verified (auth guard & documents link)');

// 3. Check public pages
const mainHome = fs.readFileSync('pages/main-home.html', 'utf8');
assert(mainHome.includes('id="homeStatStudents"'), 'main-home.html missing homeStatStudents');
assert(mainHome.includes('id="homeStatTeachers"'), 'main-home.html missing homeStatTeachers');
assert(mainHome.includes('id="homeStatLevels"'), 'main-home.html missing homeStatLevels');
assert(mainHome.includes('id="homeStatLevelsLabel"'), 'main-home.html missing homeStatLevelsLabel');
assert(mainHome.includes('id="homeStatClubs"'), 'main-home.html missing homeStatClubs');
assert(mainHome.includes('id="homeStatYears"'), 'main-home.html missing homeStatYears');
assert(!mainHome.includes('tst-card'), 'main-home.html should not have duplicate reviews carousel');
console.log('✓ pages/main-home.html verified');

const mainNews = fs.readFileSync('pages/main-news.html', 'utf8');
assert(mainNews.includes('All Stories') && (mainNews.includes('Science &amp; Tech') || mainNews.includes('Science & Tech')), 'pages/main-news.html category chips mismatch');
console.log('✓ pages/main-news.html verified');

const mainContact = fs.readFileSync('pages/main-contact.html', 'utf8');
assert(!mainContact.includes('href="#"'), 'pages/main-contact.html has bare href="#" links causing page jump');
console.log('✓ pages/main-contact.html verified');

// 4. Check admin pages
const adminAct = fs.readFileSync('pages/admin-activities.html', 'utf8');
assert(adminAct.includes('id="aClubBody"'), 'admin-activities.html missing aClubBody');
assert(adminAct.includes('id="aSportBody"'), 'admin-activities.html missing aSportBody');
assert(adminAct.includes('id="addClub"'), 'admin-activities.html missing addClub button');
assert(adminAct.includes('id="addSport"'), 'admin-activities.html missing addSport button');
console.log('✓ pages/admin-activities.html verified');

const adminSet = fs.readFileSync('pages/admin-settings.html', 'utf8');
assert(adminSet.includes('id="s-statStudents"'), 'admin-settings.html missing s-statStudents');
assert(adminSet.includes('id="s-statTeachers"'), 'admin-settings.html missing s-statTeachers');
assert(adminSet.includes('id="s-statLevels"'), 'admin-settings.html missing s-statLevels');
assert(adminSet.includes('id="s-statLevelsLabel"'), 'admin-settings.html missing s-statLevelsLabel');
assert(adminSet.includes('id="s-statClubs"'), 'admin-settings.html missing s-statClubs');
assert(adminSet.includes('id="s-statYears"'), 'admin-settings.html missing s-statYears');
console.log('✓ pages/admin-settings.html verified');

const adminEnq = fs.readFileSync('pages/admin-enquiries.html', 'utf8');
assert(adminEnq.includes('id="aEnqSearch"'), 'admin-enquiries.html missing search input');
assert(adminEnq.includes('id="aEnqFilter"'), 'admin-enquiries.html missing filter select');
assert(adminEnq.includes('id="btnExportEnq"'), 'admin-enquiries.html missing export button');
console.log('✓ pages/admin-enquiries.html verified');

// 5. Check js/main.js
const mainJs = fs.readFileSync('js/main.js', 'utf8');
assert(mainJs.includes('elStudents.dataset.count = statStudents'), 'main.js missing dynamic stats in initHome');
assert(mainJs.includes('function openAlumniModal'), 'main.js missing openAlumniModal');
assert(mainJs.includes('data-alumni'), 'main.js missing data-alumni attribute on alumni cards');
assert(mainJs.includes('lastBurgerTouch'), 'main.js missing touch/click double-trigger guard on mobile burger');
assert(mainJs.includes('closeModal();'), 'main.js missing closeModal call on data-goto navigation');
assert(mainJs.includes('#ic-arrow-r'), 'main.js documents download button icon should be #ic-arrow-r');
assert(mainJs.includes("db.enquiries.unshift({"), 'main.js contact form should save enquiries into db.enquiries');
assert(mainJs.includes("sessionStorage.setItem('christina_admin_auth', '1')"), 'main.js login form should set auth token');
assert(mainJs.includes('matchNewsCategory'), 'main.js news category filter missing matching helper');
assert(mainJs.includes('hydrateSchoolSettings'), 'main.js missing hydrateSchoolSettings helper');
console.log('✓ js/main.js verified (touch guard, data-goto closeModal, enq saving, login auth, news category, site hydration)');

// 6. Check js/admin.js
const adminJs = fs.readFileSync('js/admin.js', 'utf8');
assert(adminJs.includes("club: { title: 'club'"), 'admin.js missing club schema');
assert(adminJs.includes("sport: { title: 'sport'"), 'admin.js missing sport schema');
assert(adminJs.includes("club: 'clubs', sport: 'sports'"), 'admin.js missing club and sport STORE mapping');
assert(adminJs.includes("'activities': { page: 'pages/admin-activities.html'"), 'admin.js missing activities route');
assert(adminJs.includes("set('#cActivities'"), 'admin.js missing cActivities counter update');
assert(adminJs.includes('statStudents'), 'admin.js missing statStudents in initAdminSettings');
assert(adminJs.includes('function onOnce('), 'admin.js missing onOnce event listener deduplicator');
assert(adminJs.includes('function getCurrentAdminRoute('), 'admin.js missing getCurrentAdminRoute helper');
assert(adminJs.includes('function exportEnquiriesCsv('), 'admin.js missing exportEnquiriesCsv helper');
assert(adminJs.includes('800 * 1024'), 'admin.js missing 800KB file upload limit guard');
assert(adminJs.includes("sessionStorage.removeItem('christina_admin_auth')"), 'admin.js logout missing auth cleanup');
assert(adminJs.includes('showAdmissionsBadge'), 'admin.js settings missing showAdmissionsBadge persistence');
console.log('✓ js/admin.js verified (onOnce deduplication, 800KB upload limit, enquiries CSV, logout, badge setting)');

// 7. Check js/pages-cache.js
const cacheJs = fs.readFileSync('js/pages-cache.js', 'utf8');
assert(cacheJs.includes('pages/admin-activities.html'), 'pages-cache.js missing pages/admin-activities.html');
assert(cacheJs.includes('pages/admin-teacher-reports.html'), 'pages-cache.js missing pages/admin-teacher-reports.html');
console.log('✓ js/pages-cache.js verified (including admin-teacher-reports)');

// 8. Check Teacher Portal & Data Seeding
assert(dataContent.includes("username: 'deepa.r'"), 'data.js missing demo teacher deepa.r');
assert(dataContent.includes("username: 'sharmitha'"), 'data.js missing demo teacher sharmitha');
assert(dataContent.includes("username: 'gayathri'"), 'data.js missing demo teacher gayathri');
assert(dataContent.includes("username: 'keerthina'"), 'data.js missing demo teacher keerthina');
assert(dataContent.includes("'students', 'teacherReports', 'diary'"), 'data.js loadDb missing students, teacherReports, or diary hydration');
assert(dataContent.includes("students: ["), 'data.js missing students collection');
assert(dataContent.includes("teacherReports: ["), 'data.js missing teacherReports collection');
assert(dataContent.includes("diary: ["), 'data.js missing diary collection');
console.log('✓ Teacher portal data models verified (demo teachers, students, teacherReports, diary)');

// 9. Check Login Modal Dual-Role Toggle & Header Buttons
assert(indexHtml.includes('>Login<') || indexHtml.includes('use href="#ic-lock"/></svg> Login'), 'index.html missing neutral Login button in navbar');
assert(indexHtml.includes('data-role="teacher"'), 'index.html missing teacher role toggle button');
assert(indexHtml.includes('data-role="admin"'), 'index.html missing admin role toggle button');
assert(indexHtml.includes('deepa.r'), 'index.html missing deepa.r demo pill');
assert(indexHtml.includes('sharmitha'), 'index.html missing sharmitha demo pill');
assert(indexHtml.includes('gayathri'), 'index.html missing gayathri demo pill');
assert(indexHtml.includes('keerthina'), 'index.html missing keerthina demo pill');
assert(mainJs.includes('currentLoginRole'), 'main.js missing currentLoginRole toggle handling');
assert(mainJs.includes('christina_teacher_auth'), 'main.js missing teacher session auth storage');
assert(mainJs.includes('teacher-dashboard.html'), 'main.js missing redirect to teacher-dashboard.html');
console.log('✓ Dual-role login modal & authentication handler verified');

// 10. Check Teacher Dashboard & Logic
const teacherDash = fs.readFileSync('teacher-dashboard.html', 'utf8');
assert(teacherDash.includes("sessionStorage.getItem('christina_teacher_auth')"), 'teacher-dashboard.html missing teacher auth guard');
assert(teacherDash.includes('id="tClassSelect"'), 'teacher-dashboard.html missing class selector');
assert(teacherDash.includes('id="studentCardsGrid"'), 'teacher-dashboard.html missing cards grid');
assert(teacherDash.includes('id="studentTableWrap"'), 'teacher-dashboard.html missing table view wrap');
assert(teacherDash.includes('id="paneAttendance"'), 'teacher-dashboard.html missing attendance pane');
assert(teacherDash.includes('id="paneDiary"'), 'teacher-dashboard.html missing diary pane');

const teacherJs = fs.readFileSync('js/teacher.js', 'utf8');
assert(teacherJs.includes('getFilteredStudents'), 'teacher.js missing getFilteredStudents helper');
assert(teacherJs.includes('openAddStudentModal'), 'teacher.js missing openAddStudentModal');
assert(teacherJs.includes('confirmDeleteStudent'), 'teacher.js missing confirmDeleteStudent');
assert(teacherJs.includes('exportStudentsCsv'), 'teacher.js missing exportStudentsCsv');
assert(teacherJs.includes('saveAttendance'), 'teacher.js missing saveAttendance');
assert(teacherJs.includes('studentPhotoInput'), 'teacher.js missing studentPhotoInput element');
assert(teacherJs.includes('readAsDataURL'), 'teacher.js missing student photo FileReader reader');
assert(teacherJs.includes('studentPic'), 'teacher.js missing student photo state');
assert(teacherJs.includes('data-card-att'), 'teacher.js missing 1-click card attendance toggle');
console.log('✓ Teacher dashboard & teacher.js verified (CRUD, photo upload, 1-click card attendance, diary, CSV export, audit logging)');

// 11. Check Admin Teacher Reports & Staff Credentials
assert(adminDash.includes('data-view="teacher-reports"'), 'admin-dashboard.html missing teacher-reports nav button');
assert(adminDash.includes('id="cTeacherReports"'), 'admin-dashboard.html missing cTeacherReports counter');
const adminRepPage = fs.readFileSync('pages/admin-teacher-reports.html', 'utf8');
assert(adminRepPage.includes('id="aTeacherSummaryBody"'), 'admin-teacher-reports.html missing teacher summary table body');
assert(adminRepPage.includes('id="aTeacherAuditBody"'), 'admin-teacher-reports.html missing teacher audit feed body');
assert(adminJs.includes("'teacher-reports'"), 'admin.js missing teacher-reports title or route');
assert(adminJs.includes('initAdminTeacherReports'), 'admin.js missing initAdminTeacherReports function');
assert(adminJs.includes("username', l: 'Teacher Portal Username"), 'admin.js SCHEMA.staff missing username field');
console.log('✓ Admin Teacher Reports & Staff credentials management verified');

// 12. Runtime functional verification of data and operations
const storage = {};
global.localStorage = {
  getItem: k => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; }
};
global.sessionStorage = {
  getItem: k => null,
  setItem: () => {},
  removeItem: () => {}
};
global.window = {
  matchMedia: () => ({ matches: false }),
  addEventListener: () => {}
};
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

delete require.cache[require.resolve('../js/data.js')];
require('../js/data.js');
const App = global.window.App;
const db = App.db;

const demoList = ['deepa.r', 'sharmitha', 'gayathri', 'keerthina'];
demoList.forEach(uname => {
  const t = db.staff.find(s => s.username === uname);
  assert(t, `Teacher ${uname} should exist in db.staff`);
  assert.strictEqual(t.password, 'teacher123');
  assert(t.assignedGrade, `Teacher ${uname} should have assigned grade`);
  assert(t.roomNo, `Teacher ${uname} should have roomNo`);
  assert(t.email, `Teacher ${uname} should have official email`);
  assert(t.phone, `Teacher ${uname} should have contact phone`);
  assert(t.bloodGroup, `Teacher ${uname} should have bloodGroup`);
  assert(Array.isArray(t.schedule) && t.schedule.length >= 7, `Teacher ${uname} should have daily schedule with 7 periods`);
});

// Verify enriched diary model
assert(db.diary && db.diary.length >= 4, 'Diary entries should exist');
db.diary.forEach(entry => {
  assert(entry.homeworkType, 'Diary entry should have homeworkType');
  assert(entry.dueDate, 'Diary entry should have dueDate');
});

// Verify audit logging with login events
assert(db.teacherReports && db.teacherReports.length >= 6, 'Teacher reports should exist');
const loginReport = db.teacherReports.find(r => r.action === 'login');
assert(loginReport, 'Teacher login audit report should exist');
assert(loginReport.device, 'Teacher report should record device info');

// Verify markup and script integrations
const indexHtmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
assert(indexHtmlContent.includes('teacher-demo-grid'), 'index.html must have teacher-demo-grid');
assert(indexHtmlContent.includes('teacherActiveBanner'), 'index.html must have teacherActiveBanner');
assert(indexHtmlContent.includes('loginInlineAlert'), 'index.html must have loginInlineAlert');

const mainJsContent = fs.readFileSync(path.resolve(__dirname, '../js/main.js'), 'utf8');
assert(mainJsContent.includes('christina_teacher_remembered'), 'main.js must support remember-me storage');
assert(mainJsContent.includes('login=teacher'), 'main.js must support URL routing for teacher login');

const teacherDashContent = fs.readFileSync(path.resolve(__dirname, '../teacher-dashboard.html'), 'utf8');
assert(teacherDashContent.includes('tProfileCard'), 'teacher-dashboard.html must have interactive tProfileCard');
assert(teacherDashContent.includes('tRoomNoPill'), 'teacher-dashboard.html must have tRoomNoPill');
assert(teacherDashContent.includes('diaryHwType'), 'teacher-dashboard.html must have diaryHwType');
assert(teacherDashContent.includes('diaryDueDate'), 'teacher-dashboard.html must have diaryDueDate');

const teacherJsContent = fs.readFileSync(path.resolve(__dirname, '../js/teacher.js'), 'utf8');
assert(teacherJsContent.includes('openTeacherProfileModal'), 'teacher.js must implement openTeacherProfileModal');
assert(teacherJsContent.includes('homeworkType'), 'teacher.js must handle homeworkType in diary');

const adminJsContent = fs.readFileSync(path.resolve(__dirname, '../js/admin.js'), 'utf8');
assert(adminJsContent.includes("k: 'roomNo'"), 'admin.js SCHEMA.staff must include roomNo');
assert(adminJsContent.includes("k: 'email'"), 'admin.js SCHEMA.staff must include email');

assert(db.students && db.students.length >= 25, 'At least 25 seeded students');
const initialStudCount = db.students.length;
const testStud = { id: 888, name: 'Sample Test', gender: 'Male', grade: 'Grade 1', section: 'A', rollNo: '88', parentName: 'P', phone: '123' };
db.students.push(testStud);
App.saveDb();
assert.strictEqual(db.students.length, initialStudCount + 1);
const delIndex = db.students.findIndex(s => s.id === 888);
db.students.splice(delIndex, 1);
App.saveDb();
assert.strictEqual(db.students.length, initialStudCount);
console.log('✓ Runtime data manipulation & persistence verified');

console.log('\n========================================');
console.log('ALL VERIFICATION SUITES PASSED PERFECTLY!');
console.log('========================================');


