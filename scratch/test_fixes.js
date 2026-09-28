const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const homeHtml = fs.readFileSync(path.join(__dirname, '..', 'pages', 'main-home.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'admin.js'), 'utf8');
const mainJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');
const pagesCacheJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'pages-cache.js'), 'utf8');

const checks = [
  ['Index has Events in menu', indexHtml.includes('<a href="#/events">Events</a>')],
  ['Index has Events in drawer', indexHtml.includes('<a href="#/events" style="--i:6">Events <b>07</b></a>')],
  ['Index removed Testimonials in drawer', !indexHtml.includes('#/testimonials" style')],
  ['Index has Events in footer', indexHtml.includes('<a href="#/events">School events calendar</a>')],
  ['Index removed Parent reviews in footer', !indexHtml.includes('Parent reviews</a>')],
  ['Index has Fee policy button/link', indexHtml.includes('data-policy="fee"')],
  ['Index has Child policy button/link', indexHtml.includes('data-policy="child"')],
  ['Index has Privacy policy button/link', indexHtml.includes('data-policy="privacy"')],
  ['Index has announcement dialog nav bar', indexHtml.includes('id="annDialogNavBar"')],
  ['Home has hero news pill', homeHtml.includes('id="heroNewsPill"')],
  ['Home has hero news title', homeHtml.includes('id="heroNewsTitle"')],
  ['Home removed hero notice pill', !homeHtml.includes('id="heroAnnPill"')],
  ['Home has homePinnedCard', homeHtml.includes('id="homePinnedCard"')],
  ['Home removed parent reviews section', !homeHtml.includes('PARENT REVIEWS CAROUSEL')],
  ['Admin allows multiple pinned announcements on save', !adminJs.includes("if (kind === 'ann' && out.pinned) db.ann.forEach")],
  ['Admin allows multiple pinned announcements on pin click', !adminJs.includes("db.ann.forEach(x => { x.pinned = false; });")],
  ['Admin overview renders multiple pinned announcements', adminJs.includes("const pinnedList = db.ann.filter(a => a.pinned && a.status === 'published');")],
  ['Admin achievements grade options capped at Grade 5', adminJs.includes("'Grade 5', 'Grades 4–5'") && !adminJs.includes("'Grade 8'")],
  ['Main has getActivePopupAnnouncements', mainJs.includes('function getActivePopupAnnouncements()')],
  ['Main has openPolicyModal', mainJs.includes('function openPolicyModal(type)')],
  ['Main has openNewsModal', mainJs.includes('function openNewsModal(n)')],
  ['Pages cache updated with new home.html', pagesCacheJs.includes('heroNewsPill') && !pagesCacheJs.includes('PARENT REVIEWS CAROUSEL')]
];

let allPassed = true;
for (const [name, passed] of checks) {
  console.log((passed ? '✓ PASS: ' : '✗ FAIL: ') + name);
  if (!passed) allPassed = false;
}

if (!allPassed) {
  console.error('\nSome checks failed!');
  process.exit(1);
} else {
  console.log('\nALL 22 CHECKS PASSED PERFECTLY!');
}
