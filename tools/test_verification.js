const fs = require('fs');
const assert = require('assert');

console.log('Starting verification tests...');

// 1. Check data.js
const dataContent = fs.readFileSync('js/data.js', 'utf8');
assert(dataContent.includes('statStudents: 412'), 'data.js missing statStudents default');
assert(dataContent.includes('statTeachers: 34'), 'data.js missing statTeachers default');
assert(dataContent.includes("id: 1, name: 'Art and craft'"), 'data.js clubs missing IDs');
assert(dataContent.includes("id: 1, name: 'Junior Football'"), 'data.js sports missing IDs');
assert(dataContent.includes("'clubs', 'sports', 'settings'"), 'data.js loadDb missing clubs/sports hydration');
console.log('✓ data.js verified');

// 2. Check admin-dashboard.html
const adminDash = fs.readFileSync('admin-dashboard.html', 'utf8');
assert(adminDash.includes('data-view="activities"'), 'admin-dashboard.html missing activities button');
assert(adminDash.includes('id="cActivities"'), 'admin-dashboard.html missing cActivities count span');
console.log('✓ admin-dashboard.html verified');

// 3. Check pages/admin-activities.html
const adminAct = fs.readFileSync('pages/admin-activities.html', 'utf8');
assert(adminAct.includes('id="aClubBody"'), 'admin-activities.html missing aClubBody');
assert(adminAct.includes('id="aSportBody"'), 'admin-activities.html missing aSportBody');
assert(adminAct.includes('id="addClub"'), 'admin-activities.html missing addClub button');
assert(adminAct.includes('id="addSport"'), 'admin-activities.html missing addSport button');
console.log('✓ pages/admin-activities.html verified');

// 4. Check pages/admin-settings.html
const adminSet = fs.readFileSync('pages/admin-settings.html', 'utf8');
assert(adminSet.includes('id="s-statStudents"'), 'admin-settings.html missing s-statStudents');
assert(adminSet.includes('id="s-statTeachers"'), 'admin-settings.html missing s-statTeachers');
assert(adminSet.includes('id="s-statLevels"'), 'admin-settings.html missing s-statLevels');
assert(adminSet.includes('id="s-statLevelsLabel"'), 'admin-settings.html missing s-statLevelsLabel');
assert(adminSet.includes('id="s-statClubs"'), 'admin-settings.html missing s-statClubs');
assert(adminSet.includes('id="s-statYears"'), 'admin-settings.html missing s-statYears');
console.log('✓ pages/admin-settings.html verified');

// 5. Check js/admin.js
const adminJs = fs.readFileSync('js/admin.js', 'utf8');
assert(adminJs.includes("club: { title: 'club'"), 'admin.js missing club schema');
assert(adminJs.includes("sport: { title: 'sport'"), 'admin.js missing sport schema');
assert(adminJs.includes("club: 'clubs', sport: 'sports'"), 'admin.js missing club and sport STORE mapping');
assert(adminJs.includes("'activities': { page: 'pages/admin-activities.html'"), 'admin.js missing activities route');
assert(adminJs.includes("set('#cActivities'"), 'admin.js missing cActivities counter update');
assert(adminJs.includes('statStudents'), 'admin.js missing statStudents in initAdminSettings');
console.log('✓ js/admin.js verified');

// 6. Check pages/main-home.html
const mainHome = fs.readFileSync('pages/main-home.html', 'utf8');
assert(mainHome.includes('id="homeStatStudents"'), 'main-home.html missing homeStatStudents');
assert(mainHome.includes('id="homeStatTeachers"'), 'main-home.html missing homeStatTeachers');
assert(mainHome.includes('id="homeStatLevels"'), 'main-home.html missing homeStatLevels');
assert(mainHome.includes('id="homeStatLevelsLabel"'), 'main-home.html missing homeStatLevelsLabel');
assert(mainHome.includes('id="homeStatClubs"'), 'main-home.html missing homeStatClubs');
assert(mainHome.includes('id="homeStatYears"'), 'main-home.html missing homeStatYears');
console.log('✓ pages/main-home.html verified');

// 7. Check js/main.js
const mainJs = fs.readFileSync('js/main.js', 'utf8');
assert(mainJs.includes('elStudents.dataset.count = statStudents'), 'main.js missing dynamic stats in initHome');
assert(mainJs.includes('function openAlumniModal'), 'main.js missing openAlumniModal');
assert(mainJs.includes('data-alumni'), 'main.js missing data-alumni attribute on alumni cards');
console.log('✓ js/main.js verified');

// 8. Check js/pages-cache.js
const cacheJs = fs.readFileSync('js/pages-cache.js', 'utf8');
assert(cacheJs.includes('pages/admin-activities.html'), 'pages-cache.js missing pages/admin-activities.html');
console.log('✓ js/pages-cache.js verified');

console.log('ALL 8 VERIFICATION SUITES PASSED PERFECTLY!');
