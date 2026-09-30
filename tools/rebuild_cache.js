const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');
const outFile = path.join(__dirname, '..', 'js', 'pages-cache.js');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
const cache = {};

for (const file of files) {
  const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  cache['pages/' + file] = content;
}

const js = `/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Pages Cache
   ============================================================ */
window.PAGE_TEMPLATES = ${JSON.stringify(cache, null, 2)};
`;

fs.writeFileSync(outFile, js, 'utf8');
console.log('Cache updated successfully with', Object.keys(cache).length, 'pages');
