/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Admin Dashboard Logic
   ============================================================ */
'use strict';
(function() {
const { $, $$, REDUCED, esc, db, CATS, DEPTS, DOC_CATS, GAL_CATS, SCENES,
        TONES, fmt, dayOf, monOf, d2,
        scene, avatar, mountScenes,
        toast, countUp, revealer, watch, sortStores, isAnnActive } = window.App;

const TITLES = {
  overview:   ['Dashboard', 'Everything happening on the Christina School website today'],
  staff:      ['Staff', 'Add, edit and retire teacher profiles shown on the website'],
  'teacher-reports': ['Teacher Work Reports', 'Live activity updates, student enrollments, and classroom attendance submitted by teachers'],
  ann:        ['Announcements', 'Post notices to the board, the ticker and the homepage'],
  gal:        ['Gallery', 'Albums and photographs shown in the public gallery'],
  ev:         ['Events', 'The calendar parents see on the homepage'],
  ach:        ['Achievements', 'Results your children brought home'],
  activities: ['Activity Settings', 'Manage student clubs, extracurriculars and sports programs'],
  news:       ['News', 'Short updates written by staff'],
  doc:        ['Documents', 'Files for parents and students — admission forms, policies and more'],
  enq:        ['Admission enquiries', 'Every enquiry submitted through the website form'],
  tst:        ['Testimonials', 'Parent testimonials shown on the public website'],
  alumni:     ['Alumni', 'Alumni profiles and testimonials — stories of Christina graduates'],
  set:        ['School settings', 'Details that appear across the public site']
};

function getCurrentAdminRoute() {
  const raw = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0].trim();
  return raw || 'overview';
}

function onOnce(el, evt, handler) {
  if (!el) return;
  const key = `_has_${evt}_listener`;
  if (el[key]) return;
  el[key] = true;
  el.addEventListener(evt, handler);
}

function closeAdmin() { 
  window.location.href = 'index.html'; 
}

function syncBurger() { 
  const b = $('#aBurger');
  if (b) b.style.display = window.innerWidth <= 1000 ? 'block' : 'none'; 
}

function refreshAdminCounts() {
  const isAct = typeof isAnnActive === 'function' ? isAnnActive : () => true;
  const live = db.ann.filter(a => a.status === 'published' && isAct(a)).length;
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  set('#cStaff', db.staff.length); set('#cAnn', db.ann.length); set('#cGal', db.gallery.length);
  set('#cTeacherReports', (db.teacherReports ? db.teacherReports.length : 0));
  set('#cEv', db.events.length); set('#cAch', db.ach.length); set('#cNews', db.news.length); set('#cEnq', db.enquiries.length);
  set('#cDoc', db.documents.length);
  set('#cTst', db.testimonials.length); set('#cAlumni', db.alumni.length);
  set('#cActivities', (db.clubs ? db.clubs.length : 0) + (db.sports ? db.sports.length : 0));
  set('#kStaff', db.staff.filter(s => s.active).length); set('#kAnn', live); set('#kGal', db.gallery.length);
  set('#kEv', db.events.length); set('#kEnq', db.enquiries.length);
}

function drawBars() {
  const bars = $('#bars');
  if (!bars) return;
  const data = [[ 'Apr', 18], ['May', 34], ['Jun', 41], ['Jul', 29], ['Aug', 37], ['Sep', db.enquiries.length + 26]];
  const max = Math.max.apply(null, data.map(d => d[1]));
  bars.innerHTML = data.map(d => `<div data-h="${Math.round(d[1] / max * 100)}"><b>${d[1]}</b><span>${d[0]}</span></div>`).join('');
  requestAnimationFrame(() => $$('#bars div').forEach((b, i) =>
    setTimeout(() => { b.style.height = b.dataset.h + '%'; }, REDUCED ? 0 : i * 90)));
}

function renderFeed() {
  const feed = $('#feed');
  if (!feed) return;
  const items = [
    ['Enquiry from ' + (db.enquiries[0] ? db.enquiries[0].parent : 'a parent'), 'Admission form, a few minutes ago'],
    ['Half-yearly timetable published', 'Announcements, 18 Sep'],
    ['12 photographs added to Sports Day 2025', 'Gallery, 17 Sep'],
    ['Ms Deepa Rangarajan updated her profile', 'Staff, 15 Sep'],
    ['Annual Day added to the calendar', 'Events, 14 Sep']
  ];
  feed.innerHTML = items.map(i => `<div><span class="fd"></span><span><b style="font-weight:600">${esc(i[0])}</b><span>${esc(i[1])}</span></span></div>`).join('');
  
  const pinnedAdmin = $('#pinnedAdmin');
  if (pinnedAdmin) {
    const isAct = typeof isAnnActive === 'function' ? isAnnActive : () => true;
    const pinnedList = db.ann.filter(a => a.pinned && a.status === 'published' && isAct(a));
    pinnedAdmin.innerHTML = pinnedList.length
      ? pinnedList.map(p => `
          <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--r-m);padding:1rem;margin-bottom:10px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <span class="cat" style="--cat:${CATS[p.cat].c};--catbg:${CATS[p.cat].bg}">${esc(p.cat)}</span>
              <span class="pillx ok" style="font-size:.68rem">Pinned</span>
            </div>
            <h4 style="font-family:var(--serif);font-size:1.05rem;margin:.55rem 0 .3rem">${esc(p.title)}</h4>
            <p style="font-size:.85rem;color:var(--ink-50)">Pinned notice · Posted ${fmt(p.date)}</p>
            <button class="btn btn-soft btn-sm" style="margin-top:.7rem" type="button" data-edit="ann:${p.id}">Edit this notice</button>
          </div>`).join('')
      : `<div class="empty" style="padding:26px"><b>Nothing is pinned</b>Pin announcements to feature them at the top of the board.</div>`;
  }
}

/* ---- generic entity editor ---- */
const SCHEMA = {
  staff: { title: 'staff member', fields: [
      { k: 'name', l: 'Full name', t: 'text', req: 1 },
      { k: 'desig', l: 'Designation', t: 'text', req: 1 },
      { k: 'dept', l: 'Department', t: 'select', opts: DEPTS },
      { k: 'qual', l: 'Qualification', t: 'text' },
      { k: 'exp', l: 'Years of experience', t: 'number' },
      { k: 'classes', l: 'Classes handled', t: 'text' },
      { k: 'subjects', l: 'Subjects', t: 'text', full: 1 },
      { k: 'username', l: 'Teacher Portal Username (e.g. deepa.r)', t: 'text' },
      { k: 'password', l: 'Teacher Portal Password', t: 'text' },
      { k: 'assignedGrade', l: 'Assigned Classroom Grade', t: 'select', opts: ['None', 'Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] },
      { k: 'assignedSection', l: 'Assigned Section', t: 'select', opts: ['A', 'B', 'C'] },
      { k: 'roomNo', l: 'Classroom Room No (e.g. Room 102)', t: 'text' },
      { k: 'phone', l: 'Contact Mobile Number', t: 'text' },
      { k: 'email', l: 'Official Email Address', t: 'text' },
      { k: 'bloodGroup', l: 'Blood Group', t: 'select', opts: ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'] },
      { k: 'note', l: 'Short profile', t: 'textarea', full: 1 }
    ], photo: 1, toggle: { k: 'active', l: 'Shown on the public website' } },
  ann: { title: 'announcement', fields: [
      { k: 'title', l: 'Title', t: 'text', req: 1, full: 1 },
      { k: 'cat', l: 'Category', t: 'select', opts: Object.keys(CATS) },
      { k: 'status', l: 'Status', t: 'select', opts: ['published', 'draft'] },
      { k: 'date', l: 'Publish date', t: 'date', req: 1 },
      { k: 'startDate', l: 'Active start (date & time)', t: 'datetime-local' },
      { k: 'endDate', l: 'Active end (date & time)', t: 'datetime-local' },
      { k: 'expiry', l: 'Expiry date', t: 'date' },
      { k: 'text', l: 'Short description (for pop-up & preview)', t: 'textarea', full: 1, req: 1 },
      { k: 'body', l: 'Full notice text', t: 'textarea', full: 1 }
    ], toggle: { k: 'pinned', l: 'Pin & show pop-up dialog on home landing' } },
  ev: { title: 'event', fields: [
      { k: 'title', l: 'Event name', t: 'text', req: 1, full: 1 },
      { k: 'date', l: 'Date', t: 'date', req: 1 },
      { k: 'time', l: 'Time', t: 'text' },
      { k: 'loc', l: 'Location', t: 'text', full: 1 },
      { k: 'desc', l: 'Description', t: 'textarea', full: 1 }
    ] },
  ach: { title: 'achievement', fields: [
      { k: 'student', l: 'Student or team', t: 'text', req: 1 },
      { k: 'grade', l: 'Grade', t: 'select', opts: ['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grades 4–5'] },
      { k: 'comp', l: 'Competition', t: 'text', req: 1, full: 1 },
      { k: 'result', l: 'Result', t: 'text' },
      { k: 'medal', l: 'Medal colour', t: 'select', opts: ['gold', 'silver', 'bronze'] },
      { k: 'date', l: 'Date', t: 'date', req: 1 }
    ] },
  news: { title: 'update', fields: [
      { k: 'title', l: 'Headline', t: 'text', req: 1, full: 1 },
      { k: 'date', l: 'Date', t: 'date', req: 1 },
      { k: 'by', l: 'Written by', t: 'text' },
      { k: 'theme', l: 'Picture style', t: 'select', opts: Object.keys(SCENES) },
      { k: 'text', l: 'The update', t: 'textarea', full: 1, req: 1 }
    ] },
  gal: { title: 'photograph', fields: [
      { k: 'cap', l: 'Caption', t: 'text', req: 1, full: 1 },
      { k: 'album', l: 'Album', t: 'select', opts: [] },
      { k: 'cat', l: 'Category', t: 'select', opts: GAL_CATS.slice(1) },
      { k: 'theme', l: 'Picture style', t: 'select', opts: Object.keys(SCENES) },
      { k: 'date', l: 'Date taken', t: 'date' }
    ], photo: 1 },
  doc: { title: 'document', fields: [
      { k: 'title', l: 'Document title', t: 'text', req: 1, full: 1 },
      { k: 'category', l: 'Category', t: 'select', opts: DOC_CATS.slice(1) },
      { k: 'audience', l: 'Who this is for', t: 'select', opts: ['Everyone', 'Parents', 'Students', 'Staff'] },
      { k: 'date', l: 'Date posted', t: 'date', req: 1 },
      { k: 'desc', l: 'Short description', t: 'textarea', full: 1 }
    ], file: 1 },
  tst: { title: 'testimonial', fields: [
      { k: 'name', l: 'Parent name', t: 'text', req: 1 },
      { k: 'child', l: 'Relation (e.g. Parent of a Grade 4 child)', t: 'text', req: 1, full: 1 },
      { k: 'text', l: 'Testimonial text', t: 'textarea', full: 1, req: 1 }
    ] },
  alumni: { title: 'alumni', fields: [
      { k: 'name', l: 'Full name', t: 'text', req: 1 },
      { k: 'batch', l: 'Batch / Passing year', t: 'text', req: 1 },
      { k: 'current', l: 'Current role and company', t: 'text', full: 1 },
      { k: 'text', l: 'Testimonial message', t: 'textarea', full: 1, req: 1 }
    ], photo: 1 },
  club: { title: 'club', fields: [
      { k: 'name', l: 'Club name', t: 'text', req: 1 },
      { k: 'icon', l: 'Icon symbol', t: 'select', opts: ['ic-palette', 'ic-music', 'ic-sparkle', 'ic-pencil', 'ic-book', 'ic-flask', 'ic-laptop', 'ic-mega', 'ic-heart', 'ic-trophy', 'ic-star', 'ic-chess', 'ic-run', 'ic-ball'] },
      { k: 'tone', l: 'Color theme tone', t: 'select', opts: ['a', 'b', 'c', 'd', 'e', 'f'] },
      { k: 'text', l: 'Description', t: 'textarea', full: 1, req: 1 }
    ] },
  sport: { title: 'sport', fields: [
      { k: 'name', l: 'Sport name', t: 'text', req: 1 },
      { k: 'lvl', l: 'Grades / Levels handled', t: 'text', req: 1 },
      { k: 'theme', l: 'Scene illustration theme', t: 'select', opts: ['football', 'cricket', 'volleyball', 'badminton', 'athletics', 'chess'] },
      { k: 'text', l: 'Description', t: 'textarea', full: 1, req: 1 }
    ] }
};
const STORE = { staff: 'staff', ann: 'ann', ev: 'events', ach: 'ach', news: 'news', gal: 'gallery', doc: 'documents', tst: 'testimonials', alumni: 'alumni', club: 'clubs', sport: 'sports' };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d2(d.getMonth() + 1)}-${d2(d.getDate())}`; };

function editor(kind, rec) {
  const S = SCHEMA[kind];
  if (kind === 'gal') S.fields[1].opts = db.albums.map(a => a.name);
  const isNew = !rec;
  const r = rec || {};
  const fieldHTML = f => {
    const v = r[f.k] != null ? r[f.k] : (f.t === 'date' ? today() : '');
    const id = 'f-' + kind + '-' + f.k;
    let input;
    if (f.t === 'select') input = `<select id="${id}">${f.opts.map(o => `<option${String(v) === String(o) ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    else if (f.t === 'textarea') input = `<textarea id="${id}">${esc(v)}</textarea>`;
    else input = `<input id="${id}" type="${f.t}" value="${esc(v)}" />`;
    return `<div class="field${f.full ? ' full' : ''}"><label for="${id}">${esc(f.l)}</label>${input}<span class="err">This field is needed.</span></div>`;
  };
  openModal(`
    <div class="mhead"><h3 id="modalTitle">${isNew ? 'Add a ' + S.title : 'Edit ' + S.title}</h3>
      <p class="small" style="color:var(--ink-50);margin-top:.35rem">Changes appear on the public website as soon as you save.</p></div>
    <div class="mbody">
      ${S.photo ? `<div class="drop" id="dropZone" tabindex="0" role="button" aria-label="Upload a picture">
          <span class="up-ic"><svg class="i i-24"><use href="#ic-upload"/></svg></span>
          <b>Drop a picture here, or choose a file</b><span>JPG or PNG, up to 800 KB</span>
          <input type="file" id="fileIn" accept="image/*" hidden />
        </div>
        <div class="prev-grid" id="prevGrid">${r.photo || r.src ? `<div class="pv"><img src="${r.photo || r.src}" alt="Current picture" style="width:100%;height:100%;object-fit:cover" /><button type="button" data-rmpic aria-label="Remove picture"><svg class="i i-14"><use href="#ic-close"/></svg></button></div>` : ''}</div>` : ''}
      ${S.file ? `<div class="drop" id="docDropZone" tabindex="0" role="button" aria-label="Upload a document">
          <span class="up-ic"><svg class="i i-24"><use href="#ic-upload"/></svg></span>
          <b>Drop a file here, or choose a file</b><span>PDF, Word or Excel, up to 800 KB</span>
          <input type="file" id="docFileIn" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden />
        </div>
        <div id="docPrevGrid">${r.file ? `<div class="filechip"><svg class="i i-20"><use href="#ic-doc"/></svg><span>${esc(r.fileName || 'Current file')}</span><button type="button" data-rmfile aria-label="Remove file"><svg class="i i-14"><use href="#ic-close"/></svg></button></div>` : ''}</div>` : ''}
      <form id="entForm" class="fgrid" style="margin-top:${S.photo || S.file ? '1rem' : '0'}">
        ${S.fields.map(fieldHTML).join('')}
        ${S.toggle ? `<div class="field full">
          <label style="display:flex;align-items:center;gap:.8rem;background:var(--paper);border:1px solid var(--line);border-radius:var(--r-m);padding:.85rem 1rem;cursor:pointer">
            <button type="button" class="toggle${r[S.toggle.k] !== false && r[S.toggle.k] ? ' on' : (isNew && S.toggle.k === 'active' ? ' on' : '')}" id="entToggle"
              aria-pressed="${!!r[S.toggle.k] || (isNew && S.toggle.k === 'active')}"></button>
            <span style="font-weight:600;font-size:.9rem">${esc(S.toggle.l)}</span></label></div>` : ''}
        <div class="field full" style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" type="submit">${isNew ? 'Add ' + S.title : 'Save changes'}</button>
          <button class="btn btn-soft" type="button" data-close-modal>Cancel</button>
          ${!isNew ? `<button class="btn btn-soft" type="button" id="delHere" style="margin-left:auto;color:#C62828;border-color:#F3C9C9">Delete</button>` : ''}
        </div>
      </form>
    </div>`, true);

  let pic = r.photo || r.src || '';
  if (S.photo) {
    const dz = $('#dropZone'), fi = $('#fileIn');
    const readFile = file => {
      if (!file || !file.type.startsWith('image/')) { toast('That file is not a picture|Choose a JPG or PNG.', 'warn'); return; }
      if (file.size > 800 * 1024) {
        toast('Image is too large|Please choose an image under 800 KB to fit browser storage.', 'warn');
        return;
      }
      const fr = new FileReader();
      fr.onload = () => {
        pic = fr.result;
        $('#prevGrid').innerHTML = `<div class="pv"><img src="${pic}" alt="Uploaded picture preview" style="width:100%;height:100%;object-fit:cover" /><button type="button" data-rmpic aria-label="Remove picture"><svg class="i i-14"><use href="#ic-close"/></svg></button></div>`;
        toast('Picture ready|It will be saved with this record.', 'info');
      };
      fr.readAsDataURL(file);
    };
    dz.addEventListener('click', () => fi.click());
    dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } });
    fi.addEventListener('change', e => readFile(e.target.files[0]));
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
    dz.addEventListener('drop', e => readFile(e.dataTransfer.files[0]));
    $('#prevGrid').addEventListener('click', e => {
      if (!e.target.closest('[data-rmpic]')) return;
      pic = ''; $('#prevGrid').innerHTML = '';
    });
  }
  let docFile = r.file || '', docFileName = r.fileName || '';
  if (S.file) {
    const dz2 = $('#docDropZone'), fi2 = $('#docFileIn');
    const readDoc = file => {
      if (!file) return;
      if (file.size > 800 * 1024) {
        toast('File is too large|Please choose a file under 800 KB to fit browser storage.', 'warn');
        return;
      }
      const fr2 = new FileReader();
      fr2.onload = () => {
        docFile = fr2.result; docFileName = file.name;
        $('#docPrevGrid').innerHTML = `<div class="filechip"><svg class="i i-20"><use href="#ic-doc"/></svg><span>${esc(docFileName)}</span><button type="button" data-rmfile aria-label="Remove file"><svg class="i i-14"><use href="#ic-close"/></svg></button></div>`;
        toast('File ready|It will be saved with this document.', 'info');
      };
      fr2.readAsDataURL(file);
    };
    dz2.addEventListener('click', () => fi2.click());
    dz2.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi2.click(); } });
    fi2.addEventListener('change', e => readDoc(e.target.files[0]));
    ['dragenter', 'dragover'].forEach(ev => dz2.addEventListener(ev, e => { e.preventDefault(); dz2.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => dz2.addEventListener(ev, e => { e.preventDefault(); dz2.classList.remove('over'); }));
    dz2.addEventListener('drop', e => readDoc(e.dataTransfer.files[0]));
    $('#docPrevGrid').addEventListener('click', e => {
      if (!e.target.closest('[data-rmfile]')) return;
      docFile = ''; docFileName = ''; $('#docPrevGrid').innerHTML = '';
    });
  }
  if (S.toggle) $('#entToggle').addEventListener('click', () => {
    const t = $('#entToggle'), on = t.classList.toggle('on');
    t.setAttribute('aria-pressed', String(on));
  });
  if (!isNew) $('#delHere').addEventListener('click', () => { closeModal(); confirmDelete(kind, r.id); });

  $('#entForm').addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    S.fields.forEach(f => {
      if (!f.req) return;
      const el = $('#f-' + kind + '-' + f.k), good = el.value.trim().length > 0;
      el.closest('.field').classList.toggle('bad', !good);
      if (!good) ok = false;
    });
    if (!ok) { toast('A required field is empty|Fill the highlighted boxes and try again.', 'warn'); return; }
    const out = isNew ? { id: Date.now() } : r;
    S.fields.forEach(f => {
      const v = $('#f-' + kind + '-' + f.k).value;
      out[f.k] = f.t === 'number' ? (parseInt(v, 10) || 0) : v;
    });
    if (S.toggle) out[S.toggle.k] = $('#entToggle').classList.contains('on');
    if (S.photo) { if (kind === 'gal') out.src = pic; else out.photo = pic; }
    if (S.file) { out.file = docFile; out.fileName = docFileName; }
    if (kind === 'gal' && !out.h) out.h = 230 + (Date.now() % 5) * 26;
    if (isNew) db[STORE[kind]].unshift(out);
    if (sortStores) sortStores();
    if (window.App && window.App.saveDb) window.App.saveDb();
    closeModal();
    // Re-render current route data based on hash
    const currentRoute = getCurrentAdminRoute();
    const activeRoute = adminRouter.routes[currentRoute] || adminRouter.routes['overview'];
    if (activeRoute && activeRoute.onLoad) activeRoute.onLoad();
    refreshAdminCounts();
    drawBars();
    
    toast((isNew ? 'Added' : 'Saved') + '|' + (out.title || out.name || out.cap || out.comp || 'The record') + ' is live on the website.');
  });
}

function confirmDelete(kind, id) {
  const store = db[STORE[kind]], rec = store.find(x => x.id === id);
  const label = rec ? (rec.title || rec.name || rec.cap || rec.comp || 'this record') : 'this record';
  openModal(`
    <div class="mhead"><h3 id="modalTitle">Delete ${esc(label)}?</h3></div>
    <div class="mbody">
      <p style="color:var(--ink-70)">It will be removed from the public website straight away. This demo cannot undo it.</p>
      <div style="display:flex;gap:10px;margin-top:1.4rem;flex-wrap:wrap">
        <button class="btn btn-primary" type="button" id="doDel" style="background:#C62828;box-shadow:none">Yes, delete it</button>
        <button class="btn btn-soft" type="button" data-close-modal>Keep it</button>
      </div>
    </div>`);
  $('#doDel').addEventListener('click', () => {
    const i = store.findIndex(x => x.id === id);
    if (i > -1) store.splice(i, 1);
    if (window.App && window.App.saveDb) window.App.saveDb();
    closeModal(); 
    
    const currentRoute = getCurrentAdminRoute();
    const activeRoute = adminRouter.routes[currentRoute] || adminRouter.routes['overview'];
    if (activeRoute && activeRoute.onLoad) activeRoute.onLoad();
    refreshAdminCounts();
    drawBars();

    toast('Deleted|' + label + ' is no longer on the website.', 'warn');
  });
}

const addStaff = () => editor('staff');
const addAnn = () => editor('ann');
const addEv = () => editor('ev');
const addAch = () => editor('ach');
const addNews = () => editor('news');
const addPhoto = () => editor('gal');
const addDoc = () => editor('doc');
const addTst = () => editor('tst');
const addAlumni = () => editor('alumni');

/* ------------------------------------------------------------
   ADMIN TABLES
   ------------------------------------------------------------ */
function staffPic(s) {
  return s.photo
    ? `<img src="${s.photo}" alt="${esc(s.name)}" style="width:100%;height:100%;object-fit:cover;display:block" />`
    : avatar(s.name);
}

const acts = (kind, id) => `
  <div class="rowacts">
    <button class="mini" type="button" data-edit="${kind}:${id}" aria-label="Edit"><svg class="i i-16"><use href="#ic-pencil"/></svg></button>
    <button class="mini del" type="button" data-del="${kind}:${id}" aria-label="Delete"><svg class="i i-16"><use href="#ic-trash"/></svg></button>
  </div>`;
const blank = (n, msg) => `<tr><td colspan="${n}"><div class="empty" style="margin:6px 0"><b>${msg}</b>Use the button above to add the first one.</div></td></tr>`;

function renderAdminStaff() {
  const sel = $('#aStaffDept');
  if (sel && (!sel.options || sel.options.length <= 1)) {
    sel.innerHTML = ['All departments'].concat(DEPTS).map(d => `<option>${esc(d)}</option>`).join('');
  }
  const searchInput = $('#aStaffSearch');
  const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const d = sel ? sel.value || 'All departments' : 'All departments';
  const list = db.staff
    .filter(s => d === 'All departments' || s.dept === d)
    .filter(s => !term || (s.name + ' ' + s.desig + ' ' + s.dept + ' ' + (s.subjects || '')).toLowerCase().includes(term));
  
  const tbody = $('#aStaffBody');
  if (tbody) {
    tbody.innerHTML = list.length ? list.map(s => `
      <tr>
        <td data-col="Staff"><span class="cellav"><span class="av">${staffPic(s)}</span><span><b>${esc(s.name)}</b><span>${esc(s.subjects || '')}</span></span></span></td>
        <td data-col="Designation">${esc(s.desig)}</td>
        <td data-col="Department"><span class="pillx">${esc(s.dept)}</span></td>
        <td data-col="Assigned Class">${s.assignedGrade && s.assignedGrade !== 'None' ? `<span class="pillx ok" style="font-weight:600">${esc(s.assignedGrade)} (${esc(s.assignedSection || 'A')})</span>${s.roomNo ? `<div style="font-size:.72rem;color:var(--ink-50);margin-top:2px">${esc(s.roomNo.split('(')[0].trim())}</div>` : ''}` : `<span style="color:var(--ink-50)">—</span>`}</td>
        <td data-col="Portal Login">${s.username ? `<span class="tag" style="background:#E7F1FF;color:#1D4ED8;font-size:.76rem;display:inline-flex;align-items:center;gap:4px"><svg class="i i-12"><use href="#ic-lock"/></svg> ${esc(s.username)}</span>${s.lastLogin ? `<div style="font-size:.72rem;color:#16A34A;margin-top:2px">● Signed in ${fmt(s.lastLogin)}</div>` : ''}` : `<span style="color:var(--ink-50);font-size:.78rem">No login</span>`}</td>
        <td data-col="Experience">${s.exp} yrs</td>
        <td data-col="Website Status"><button class="toggle${s.active ? ' on' : ''}" type="button" data-tog="${s.id}"
              aria-pressed="${!!s.active}" aria-label="Show ${esc(s.name)} on the website"></button></td>
        <td data-col="Actions">${acts('staff', s.id)}</td>
      </tr>`).join('') : blank(8, 'No staff member matches that');
  }
}

let annSeg = 'all';
function renderAdminAnn() {
  const list = db.ann.filter(a => annSeg === 'all' || a.status === annSeg);
  const tbody = $('#aAnnBody');
  const now = new Date().toISOString();
  if (tbody) {
    tbody.innerHTML = list.length ? list.map(a => {
      let schedText = 'Always active';
      let schedClass = 'ok';
      if (a.startDate || a.endDate) {
        const s = a.startDate ? a.startDate.replace('T', ' ') : 'Start';
        const e = a.endDate ? a.endDate.replace('T', ' ') : 'Open';
        schedText = `${s} to ${e}`;
        if (a.startDate && now < a.startDate) {
          schedClass = 'draft';
        } else if (a.endDate && now > a.endDate) {
          schedClass = 'bad';
        }
      } else if (a.expiry) {
        schedText = `Until ${fmt(a.expiry)}`;
        if (now.slice(0, 10) > a.expiry) schedClass = 'bad';
      }
      return `
        <tr>
          <td data-col="Announcement" style="max-width:280px"><b style="display:block;font-size:.92rem">${esc(a.title)}</b>
            <span style="font-size:.76rem;color:var(--ink-50)">${esc((a.text || '').slice(0, 64))}${(a.text || '').length > 64 ? '…' : ''}</span></td>
          <td data-col="Category"><span class="pillx" style="background:${CATS[a.cat] ? CATS[a.cat].bg : 'var(--mist)'};color:${CATS[a.cat] ? CATS[a.cat].c : 'var(--royal)'}">${esc(a.cat)}</span></td>
          <td data-col="Active Schedule"><span style="font-size:.82rem;font-weight:600;display:block">${schedText}</span>
              <span class="pillx ${schedClass}" style="margin-top:4px;font-size:.68rem">${schedClass === 'ok' ? 'Active now' : (schedClass === 'draft' ? 'Scheduled' : 'Expired')}</span></td>
          <td data-col="Popup Dialog"><button class="mini${a.pinned ? ' on' : ''}" type="button" data-pin="${a.id}" aria-label="Pin ${esc(a.title)}"
                style="${a.pinned ? 'background:var(--mari);color:#fff;border-color:var(--mari)' : ''}"><svg class="i i-16"><use href="#ic-pin"/></svg></button>
              ${a.pinned ? '<span class="pillx ok" style="margin-left:6px;font-size:.68rem">Popup</span>' : ''}</td>
          <td data-col="Status"><span class="pillx ${a.status === 'published' ? 'ok' : 'draft'}">${a.status === 'published' ? 'Published' : 'Draft'}</span></td>
          <td data-col="Actions">${acts('ann', a.id)}</td>
        </tr>`;
    }).join('') : blank(6, 'Nothing here yet');
  }
}

function renderAdminGal() {
  const albumGrid = $('#albumGrid');
  if (albumGrid) {
    albumGrid.innerHTML = db.albums.map(al => {
      const n = db.gallery.filter(g => g.album === al.name).length;
      const cover = db.gallery.find(g => g.album === al.name);
      return `<div class="album">
        <div class="ph" data-scene="${cover ? cover.theme : 'general'}" data-alt="${esc(al.name)}"${cover && cover.src ? ` data-src="${cover.src}"` : ''}></div>
        <div class="ab"><b>${esc(al.name)}</b><span>${esc(al.cat)} · ${n} photograph${n === 1 ? '' : 's'}</span></div>
      </div>`;
    }).join('');
    mountScenes(albumGrid);
  }
  const galCount = $('#galAdminCount');
  if (galCount) {
    galCount.textContent = `${db.gallery.length} images across ${db.albums.length} albums`;
  }
  const tbody = $('#aGalBody');
  if (tbody) {
    tbody.innerHTML = db.gallery.length ? db.gallery.map(g => `
      <tr>
        <td data-col="Photograph"><span class="cellav"><span class="av"><span class="ph" style="width:100%;height:100%;border-radius:0" data-scene="${g.theme}" data-alt="${esc(g.cap)}"${g.src ? ` data-src="${g.src}"` : ''}></span></span></span></td>
        <td data-col="Caption" style="max-width:280px">${esc(g.cap)}</td>
        <td data-col="Album">${esc(g.album || '—')}</td>
        <td data-col="Category"><span class="pillx">${esc(g.cat)}</span></td>
        <td data-col="Added Date">${g.date ? fmt(g.date) : '—'}</td>
        <td data-col="Actions">${acts('gal', g.id)}</td>
      </tr>`).join('') : blank(6, 'No photographs uploaded yet');
    mountScenes(tbody);
  }
}

function renderAdminEv() {
  const tbody = $('#aEvBody');
  if (tbody) {
    tbody.innerHTML = db.events.length ? db.events.map(ev => `
      <tr>
        <td data-col="Event" style="max-width:300px"><b style="display:block;font-size:.92rem">${esc(ev.title)}</b>
          <span style="font-size:.76rem;color:var(--ink-50)">${esc((ev.desc || '').slice(0, 70))}${(ev.desc || '').length > 70 ? '…' : ''}</span></td>
        <td data-col="Date"><b>${dayOf(ev.date)}</b> ${monOf(ev.date)}</td>
        <td data-col="Time">${esc(ev.time || '—')}</td>
        <td data-col="Location">${esc(ev.loc || '—')}</td>
        <td data-col="Actions">${acts('ev', ev.id)}</td>
      </tr>`).join('') : blank(5, 'The calendar is empty');
  }
}

function renderAdminAch() {
  const tbody = $('#aAchBody');
  if (tbody) {
    tbody.innerHTML = db.ach.length ? db.ach.map(a => `
      <tr>
        <td data-col="Student"><span class="cellav"><span class="av" style="background:var(--mari-soft);display:grid;place-items:center;color:var(--mari-deep)">
          <svg class="i i-18"><use href="#ic-trophy"/></svg></span><span><b>${esc(a.student)}</b><span>${esc(a.medal)} medal</span></span></span></td>
        <td data-col="Grade">${esc(a.grade)}</td>
        <td data-col="Competition" style="max-width:280px">${esc(a.comp)}</td>
        <td data-col="Result"><span class="pillx ok">${esc(a.result)}</span></td>
        <td data-col="Date">${fmt(a.date)}</td>
        <td data-col="Actions">${acts('ach', a.id)}</td>
      </tr>`).join('') : blank(6, 'No achievements recorded yet');
  }
}

function renderAdminNews() {
  const tbody = $('#aNewsBody');
  if (tbody) {
    tbody.innerHTML = db.news.length ? db.news.map(n => `
      <tr>
        <td data-col="Headline" style="max-width:360px"><b style="display:block;font-size:.92rem">${esc(n.title)}</b>
          <span style="font-size:.76rem;color:var(--ink-50)">${esc((n.text || '').slice(0, 76))}${(n.text || '').length > 76 ? '…' : ''}</span></td>
        <td data-col="Date">${fmt(n.date)}</td>
        <td data-col="Written By">${esc(n.by || 'School office')}</td>
        <td data-col="Actions">${acts('news', n.id)}</td>
      </tr>`).join('') : blank(4, 'No updates written yet');
  }
}

function renderAdminDocs() {
  const tbody = $('#aDocBody');
  if (tbody) {
    tbody.innerHTML = db.documents.length ? db.documents.map(d => `
      <tr>
        <td data-col="Document" style="max-width:300px"><b style="display:block;font-size:.92rem">${esc(d.title)}</b>
          <span style="font-size:.76rem;color:var(--ink-50)">${esc((d.desc || '').slice(0, 70))}${(d.desc || '').length > 70 ? '…' : ''}</span></td>
        <td data-col="Category"><span class="pillx">${esc(d.category)}</span></td>
        <td data-col="Audience">${esc(d.audience || 'Everyone')}</td>
        <td data-col="Date">${fmt(d.date)}</td>
        <td data-col="Status">${d.file ? `<span class="pillx ok">Uploaded</span>` : `<span class="pillx draft">Pending</span>`}</td>
        <td data-col="Actions">${acts('doc', d.id)}</td>
      </tr>`).join('') : blank(6, 'No documents uploaded yet');
  }
}

const ENQ_STATES = ['New', 'Called', 'Visit booked', 'Admitted'];
function renderAdminEnq() {
  const searchInput = $('#aEnqSearch');
  const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const filterSel = $('#aEnqFilter');
  const statusFilter = filterSel ? filterSel.value : 'All';

  const list = (db.enquiries || [])
    .filter(q => statusFilter === 'All' || q.status === statusFilter)
    .filter(q => !term || (
      (q.parent || '') + ' ' +
      (q.child || '') + ' ' +
      (q.email || '') + ' ' +
      (q.phone || '') + ' ' +
      (q.grade || '') + ' ' +
      (q.msg || '')
    ).toLowerCase().includes(term));

  const tbody = $('#aEnqBody');
  if (tbody) {
    tbody.innerHTML = list.length ? list.map(q2 => `
      <tr>
        <td data-col="Parent"><span class="cellav"><span class="av">${avatar(q2.parent, 'e' + q2.id)}</span><span><b>${esc(q2.parent)}</b><span>${esc(q2.email || '')}</span></span></span></td>
        <td data-col="Child">${esc(q2.child)}</td>
        <td data-col="Grade"><span class="pillx">${esc(q2.grade)}</span></td>
        <td data-col="Contact">${esc(q2.phone)}</td>
        <td data-col="Received">${fmt(q2.date)}</td>
        <td data-col="Status"><span class="pillx ${q2.status === 'Admitted' ? 'ok' : q2.status === 'New' ? 'draft' : ''}">${esc(q2.status)}</span></td>
        <td data-col="Actions"><div class="rowacts">
          <button class="mini" type="button" data-enq="${q2.id}" aria-label="Read enquiry"><svg class="i i-16"><use href="#ic-eye"/></svg></button>
          <button class="mini del" type="button" data-enqdel="${q2.id}" aria-label="Remove enquiry"><svg class="i i-16"><use href="#ic-trash"/></svg></button>
        </div></td>
      </tr>`).join('') : blank(7, term || statusFilter !== 'All' ? 'No enquiries match this filter' : 'No enquiries yet');
  }
}

function exportEnquiriesCsv() {
  const list = db.enquiries || [];
  if (!list.length) {
    toast('No enquiries to export|The enquiry list is currently empty.', 'warn');
    return;
  }
  const headers = ['ID', 'Date', 'Parent', 'Child', 'Grade', 'Phone', 'Email', 'Status', 'Message'];
  const rows = list.map(q => [
    q.id,
    q.date || '',
    `"${(q.parent || '').replace(/"/g, '""')}"`,
    `"${(q.child || '').replace(/"/g, '""')}"`,
    `"${(q.grade || '').replace(/"/g, '""')}"`,
    `"${(q.phone || '').replace(/"/g, '""')}"`,
    `"${(q.email || '').replace(/"/g, '""')}"`,
    `"${(q.status || '').replace(/"/g, '""')}"`,
    `"${(q.msg || '').replace(/"/g, '""')}"`
  ]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `christina_enquiries_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('CSV Exported|Enquiries downloaded successfully.', 'ok');
}

function renderAdminTst() {
  const tbody = $('#aTstBody');
  if (tbody) {
    tbody.innerHTML = db.testimonials.length ? db.testimonials.map(t => `
      <tr>
        <td data-col="Parent"><span class="cellav"><span class="av">${avatar(t.name, 't' + t.id)}</span><span><b>${esc(t.name)}</b></span></span></td>
        <td data-col="Relation">${esc(t.child)}</td>
        <td data-col="Testimonial" style="max-width:360px"><span style="font-size:.82rem;color:var(--ink-60)">${esc((t.text || '').slice(0, 90))}${(t.text || '').length > 90 ? '\u2026' : ''}</span></td>
        <td data-col="Actions">${acts('tst', t.id)}</td>
      </tr>`).join('') : blank(4, 'No testimonials yet');
  }
}

function renderAdminAlumni() {
  const searchInput = $('#aAlumniSearch');
  const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const list = db.alumni
    .filter(a => !term || (a.name + ' ' + a.batch + ' ' + (a.current || '')).toLowerCase().includes(term));
  const tbody = $('#aAlumniBody');
  if (tbody) {
    tbody.innerHTML = list.length ? list.map(a => `
      <tr>
        <td data-col="Alumni"><span class="cellav"><span class="av">${a.photo ? '<img src="' + a.photo + '" alt="' + esc(a.name) + '" style="width:100%;height:100%;object-fit:cover;display:block" />' : avatar(a.name, 'al' + a.id)}</span><span><b>${esc(a.name)}</b><span>Batch of ${esc(a.batch)}</span></span></span></td>
        <td data-col="Batch"><span class="pillx">${esc(a.batch)}</span></td>
        <td data-col="Current Role" style="max-width:240px">${esc(a.current || '\u2014')}</td>
        <td data-col="Testimonial" style="max-width:280px"><span style="font-size:.82rem;color:var(--ink-60)">${esc((a.text || '').slice(0, 80))}${(a.text || '').length > 80 ? '\u2026' : ''}</span></td>
        <td data-col="Actions">${acts('alumni', a.id)}</td>
      </tr>`).join('') : blank(5, 'No alumni profiles yet');
  }
}


/* ---- MODAL SYSTEM ---- */
let lastFocus = null;
function openModal(html, wide) {
  lastFocus = document.activeElement;
  $('#modalContent').innerHTML = html;
  $('#modalBox').className = 'box' + (wide ? ' wide' : '');
  $('#modal').classList.add('open');
  document.body.classList.add('locked');
  mountScenes($('#modalContent'));
  const f = $('#modalContent input, #modalContent select, #modalContent textarea, #modalContent button');
  setTimeout(() => {
    const target = f || $('#modal .x');
    if (target && typeof target.focus === 'function') target.focus();
  }, 60);
}
function closeModal() {
  $('#modal').classList.remove('open');
  document.body.classList.remove('locked');
  if (lastFocus) lastFocus.focus();
}


/* ---- PAGE INITIALIZERS ---- */

function initOverview() {
  refreshAdminCounts();
  renderFeed();
  setTimeout(drawBars, 240);
}

function initAdminStaff() {
  renderAdminStaff();
  const search = $('#aStaffSearch');
  if (search) onOnce(search, 'input', renderAdminStaff);
  const deptSel = $('#aStaffDept');
  if (deptSel) onOnce(deptSel, 'change', renderAdminStaff);
  const addBtn = $('#addStaff');
  if (addBtn) onOnce(addBtn, 'click', addStaff);
  
  const tbody = $('#aStaffBody');
  if (tbody) onOnce(tbody, 'click', e => {
    const t = e.target.closest('[data-tog]');
    if (!t) return;
    const s = db.staff.find(x => x.id === +t.dataset.tog);
    if (!s) return;
    s.active = !s.active;
    t.classList.toggle('on', s.active);
    t.setAttribute('aria-pressed', String(s.active));
    if (window.App && window.App.saveDb) window.App.saveDb();
    refreshAdminCounts();
    toast(s.active ? 'Profile is live|' + s.name + ' now appears on the staff page.' : 'Profile hidden|' + s.name + ' has been taken off the staff page.', s.active ? 'ok' : 'info');
  });
}

function initAdminAnn() {
  renderAdminAnn();
  const seg = $('#annSeg');
  if (seg) onOnce(seg, 'click', e => {
    const b = e.target.closest('[data-st]'); 
    if (!b) return;
    annSeg = b.dataset.st;
    $$('#annSeg button').forEach(x => x.classList.toggle('on', x === b));
    renderAdminAnn();
  });
  
  const tbody = $('#aAnnBody');
  if (tbody) onOnce(tbody, 'click', e => {
    const p = e.target.closest('[data-pin]'); 
    if (!p) return;
    const a = db.ann.find(x => x.id === +p.dataset.pin); 
    if (!a) return;
    const on = !a.pinned;
    a.pinned = on;
    if (window.App && window.App.saveDb) window.App.saveDb();
    renderAdminAnn();
    toast(on ? 'Pinned|' + a.title + ' is now pinned on the notice board.' : 'Unpinned|' + a.title + ' is unpinned.', on ? 'ok' : 'info');
  });

  const addBtn = $('#addAnn');
  if (addBtn) onOnce(addBtn, 'click', addAnn);
}

function initAdminGal() {
  renderAdminGal();
  const btnAddPhoto = $('#addPhoto');
  if (btnAddPhoto) onOnce(btnAddPhoto, 'click', addPhoto);
  
  const btnAddAlbum = $('#addAlbum');
  if (btnAddAlbum) onOnce(btnAddAlbum, 'click', () => {
    openModal(`
      <div class="mhead"><h3 id="modalTitle">Create an album</h3></div>
      <div class="mbody"><form id="albForm" class="fgrid" style="margin-top:0">
        <div class="field full"><label for="alb-n">Album name</label><input id="alb-n" placeholder="Sports Day 2026" /><span class="err">Give the album a name.</span></div>
        <div class="field full"><label for="alb-c">Category</label><select id="alb-c">${GAL_CATS.slice(1).map(c => `<option>${c}</option>`).join('')}</select></div>
        <div class="field full" style="display:flex;gap:10px">
          <button class="btn btn-primary" type="submit">Create album</button>
          <button class="btn btn-soft" type="button" data-close-modal>Cancel</button></div>
      </form></div>`);
    $('#albForm').addEventListener('submit', e => {
      e.preventDefault();
      const n = $('#alb-n').value.trim();
      if (!n) { $('#alb-n').closest('.field').classList.add('bad'); return; }
      db.albums.unshift({ id: Date.now(), name: n, cat: $('#alb-c').value });
      if (window.App && window.App.saveDb) window.App.saveDb();
      closeModal(); 
      renderAdminGal();
      toast('Album created|' + n + ' is ready for photographs.');
    });
  });
}

function initAdminEv() {
  renderAdminEv();
  const addBtn = $('#addEv');
  if (addBtn) onOnce(addBtn, 'click', addEv);
}

function initAdminAch() {
  renderAdminAch();
  const addBtn = $('#addAch');
  if (addBtn) onOnce(addBtn, 'click', addAch);
}

function initAdminNews() {
  renderAdminNews();
  const addBtn = $('#addNews');
  if (addBtn) onOnce(addBtn, 'click', addNews);
}

function initAdminDocs() {
  renderAdminDocs();
  const addBtn = $('#addDoc');
  if (addBtn) onOnce(addBtn, 'click', addDoc);
}

function initAdminEnq() {
  renderAdminEnq();
  onOnce($('#aEnqSearch'), 'input', renderAdminEnq);
  onOnce($('#aEnqFilter'), 'change', renderAdminEnq);
  onOnce($('#btnExportEnq'), 'click', exportEnquiriesCsv);

  const tbody = $('#aEnqBody');
  if (tbody) {
    onOnce(tbody, 'click', e => {
      const v = e.target.closest('[data-enq]');
      if (v) {
        const q2 = db.enquiries.find(x => x.id === +v.dataset.enq); 
        if (!q2) return;
        openModal(`
          <div class="mhead">
            <div class="prof">
              <div class="pic">${avatar(q2.parent, 'e' + q2.id)}</div>
              <div><span class="tag">${esc(q2.status)}</span>
                <h3 id="modalTitle" style="margin-top:.5rem">${esc(q2.parent)}</h3>
                <p style="color:var(--mari-deep);font-weight:600;font-size:.92rem">Enquiry for ${esc(q2.child)}, ${esc(q2.grade)}</p></div>
            </div>
          </div>
          <div class="mbody">
            <p style="color:var(--ink-70)">${esc(q2.msg || 'No message was left with this enquiry.')}</p>
            <div class="prof-facts">
              <div><b>Phone</b><span>${esc(q2.phone)}</span></div>
              <div><b>Email</b><span>${esc(q2.email || '—')}</span></div>
              <div><b>Received</b><span>${fmt(q2.date)}</span></div>
              <div><b>Grade wanted</b><span>${esc(q2.grade)}</span></div>
            </div>
            <p class="small" style="color:var(--ink-50);margin-top:1.4rem;font-weight:700">Move this enquiry along</p>
            <div class="seg" id="enqSeg" style="margin-top:.5rem;flex-wrap:wrap">
              ${ENQ_STATES.map(s => `<button type="button" class="${s === q2.status ? 'on' : ''}" data-es="${s}">${s}</button>`).join('')}
            </div>
            <div style="display:flex;gap:10px;margin-top:1.4rem;flex-wrap:wrap">
              <button class="btn btn-primary btn-sm" type="button" data-toast="Calling ${esc(q2.parent)}|The office phone is dialling ${esc(q2.phone)}.">Call the parent</button>
              <button class="btn btn-soft btn-sm" type="button" data-close-modal>Close</button>
            </div>
          </div>`);
        $('#enqSeg').addEventListener('click', ev => {
          const b = ev.target.closest('[data-es]'); if (!b) return;
          q2.status = b.dataset.es;
          $$('#enqSeg button').forEach(x => x.classList.toggle('on', x === b));
          if (window.App && window.App.saveDb) window.App.saveDb();
          renderAdminEnq();
          toast('Enquiry updated|' + q2.parent + ' is now marked “' + q2.status + '”.', 'info');
        });
        return;
      }
      
      const d = e.target.closest('[data-enqdel]');
      if (d) {
        const i = db.enquiries.findIndex(x => x.id === +d.dataset.enqdel);
        if (i > -1) {
          const name = db.enquiries[i].parent;
          db.enquiries.splice(i, 1);
          if (window.App && window.App.saveDb) window.App.saveDb();
          renderAdminEnq(); 
          refreshAdminCounts(); 
          drawBars();
          toast('Enquiry removed|The record from ' + name + ' has been cleared.', 'warn');
        }
      }
    });
  }
}

function initAdminSettings() {
  const s = db.settings || {};
  const sadm = $('#s-adm');
  if (sadm) {
    const isAdmOn = s.showAdmissionsBadge !== false;
    sadm.classList.toggle('on', isAdmOn);
    sadm.setAttribute('aria-pressed', String(isAdmOn));
    
    onOnce(sadm, 'click', () => {
      const on = sadm.classList.toggle('on');
      sadm.setAttribute('aria-pressed', String(on));
      $$('.badge, .adm-flag, #topAdmissionsBadge, [data-badge="admissions"]').forEach(el => {
        el.style.display = on ? '' : 'none';
      });
    });
  }

  if ($('#s-name') && s.name) $('#s-name').value = s.name;
  if ($('#s-tag') && s.tag) $('#s-tag').value = s.tag;
  if ($('#s-addr') && s.addr) $('#s-addr').value = s.addr;
  if ($('#s-hours') && s.hours) $('#s-hours').value = s.hours;
  if ($('#s-phone') && s.phone) $('#s-phone').value = s.phone;
  if ($('#s-mail') && s.mail) $('#s-mail').value = s.mail;
  if ($('#s-ticker') && s.ticker) $('#s-ticker').value = s.ticker;
  if ($('#s-statStudents')) $('#s-statStudents').value = s.statStudents != null ? s.statStudents : 412;
  if ($('#s-statTeachers')) $('#s-statTeachers').value = s.statTeachers != null ? s.statTeachers : 34;
  if ($('#s-statLevels')) $('#s-statLevels').value = s.statLevels != null ? s.statLevels : 8;
  if ($('#s-statLevelsLabel')) $('#s-statLevelsLabel').value = s.statLevelsLabel || 'Levels (Nur–Gr 5)';
  if ($('#s-statClubs')) $('#s-statClubs').value = s.statClubs != null ? s.statClubs : 26;
  if ($('#s-statYears')) $('#s-statYears').value = s.statYears != null ? s.statYears : 34;

  const setForm = $('#setForm');
  if (setForm) {
    onOnce(setForm, 'submit', e => {
      e.preventDefault();
      const name = $('#s-name').value.trim() || 'Christina Nursery and Primary School';
      const tag = $('#s-tag').value.trim();
      const addr = $('#s-addr').value.trim();
      const hours = $('#s-hours').value.trim();
      const phone = $('#s-phone').value.trim();
      const mail = $('#s-mail').value.trim();
      const ticker = $('#s-ticker').value.trim();
      const statStudents = parseInt($('#s-statStudents').value, 10) || 412;
      const statTeachers = parseInt($('#s-statTeachers').value, 10) || 34;
      const statLevels = parseInt($('#s-statLevels').value, 10) || 8;
      const statLevelsLabel = $('#s-statLevelsLabel').value.trim() || 'Levels (Nur–Gr 5)';
      const statClubs = parseInt($('#s-statClubs').value, 10) || 26;
      const statYears = parseInt($('#s-statYears').value, 10) || 34;
      const showAdmissionsBadge = $('#s-adm') ? $('#s-adm').classList.contains('on') : true;

      db.settings = {
        ...(db.settings || {}),
        name, tag, addr, hours, phone, mail, ticker,
        statStudents, statTeachers, statLevels, statLevelsLabel, statClubs, statYears,
        showAdmissionsBadge
      };
      if (window.App && window.App.saveDb) window.App.saveDb();
      
      toast('Settings saved|School details and key statistics have been updated.');
    });
  }
}

function renderAdminClubs() {
  const body = $('#aClubBody');
  if (!body) return;
  const q = ($('#aClubSearch') ? $('#aClubSearch').value.trim().toLowerCase() : '');
  const list = (db.clubs || []).filter(c => !q || c.name.toLowerCase().includes(q) || c.text.toLowerCase().includes(q));
  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--ink-50)">No clubs found. Click &quot;Add club&quot; to create one.</td></tr>`;
    return;
  }
  body.innerHTML = list.map(c => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="width:38px;height:38px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;${TONES[c.tone] || ''}">
            <svg class="i i-20"><use href="#${c.icon || 'ic-sparkle'}"/></svg>
          </span>
          <b>${esc(c.name)}</b>
        </div>
      </td>
      <td><span class="pillx" style="text-transform:uppercase;font-size:.76rem;font-weight:600">Tone ${esc(c.tone)}</span></td>
      <td><span class="small" style="color:var(--ink-70);max-width:380px;display:inline-block">${esc(c.text)}</span></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn btn-soft btn-sm" type="button" data-edit="club:${c.id}">Edit</button>
        <button class="btn btn-soft btn-sm" type="button" data-del="club:${c.id}" style="color:#C62828;border-color:#F3C9C9;margin-left:4px">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderAdminSports() {
  const body = $('#aSportBody');
  if (!body) return;
  const list = db.sports || [];
  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--ink-50)">No sports added. Click &quot;Add sport&quot; to create one.</td></tr>`;
    return;
  }
  body.innerHTML = list.map(s => `
    <tr>
      <td><b>${esc(s.name)}</b></td>
      <td><span class="tag" style="background:#E7F1FF;color:#1D4ED8">${esc(s.lvl)}</span></td>
      <td><span class="pillx" style="text-transform:capitalize;font-size:.78rem">${esc(s.theme)}</span></td>
      <td><span class="small" style="color:var(--ink-70);max-width:380px;display:inline-block">${esc(s.text)}</span></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn btn-soft btn-sm" type="button" data-edit="sport:${s.id}">Edit</button>
        <button class="btn btn-soft btn-sm" type="button" data-del="sport:${s.id}" style="color:#C62828;border-color:#F3C9C9;margin-left:4px">Delete</button>
      </td>
    </tr>
  `).join('');
}

function addClub() {
  editor('club');
}

function addSport() {
  editor('sport');
}

function initAdminActivities() {
  renderAdminClubs();
  renderAdminSports();
  const search = $('#aClubSearch');
  if (search) onOnce(search, 'input', renderAdminClubs);
  const addClubBtn = $('#addClub');
  if (addClubBtn) onOnce(addClubBtn, 'click', addClub);
  const addSportBtn = $('#addSport');
  if (addSportBtn) onOnce(addSportBtn, 'click', addSport);
}

function initAdminTst() {
  renderAdminTst();
  const addBtn = $('#addTst');
  if (addBtn) onOnce(addBtn, 'click', addTst);
}

function initAdminAlumni() {
  renderAdminAlumni();
  const search = $('#aAlumniSearch');
  if (search) onOnce(search, 'input', renderAdminAlumni);
  const addBtn = $('#addAlumni');
  if (addBtn) onOnce(addBtn, 'click', addAlumni);
}

function renderTeacherAuditFeed() {
  const tbody = $('#aTeacherAuditBody');
  if (!tbody) return;

  const actionFilter = ($('#aReportFilterAction') ? $('#aReportFilterAction').value : 'All');
  const gradeFilter = ($('#aReportFilterGrade') ? $('#aReportFilterGrade').value : 'All');

  let list = db.teacherReports || [];
  if (actionFilter !== 'All') list = list.filter(r => r.action === actionFilter);
  if (gradeFilter !== 'All') list = list.filter(r => r.grade === gradeFilter);

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--ink-50)">No teacher activity logs match the selected filter.</td></tr>`;
    return;
  }

  const actionBadge = act => {
    switch (act) {
      case 'attendance_marked':
        return '<span class="tag" style="background:#E8F5E9;color:#2E7D32">Attendance</span>';
      case 'student_added':
        return '<span class="tag" style="background:#E7F1FF;color:#1D4ED8">New Student</span>';
      case 'student_updated':
        return '<span class="tag" style="background:#EDE7F6;color:#5E35B1">Student Updated</span>';
      case 'student_deleted':
        return '<span class="tag" style="background:#FFEBEE;color:#C62828">Student Deleted</span>';
      case 'diary_posted':
        return '<span class="tag" style="background:#FFF3E0;color:#EF6C00">Class Diary</span>';
      case 'roster_exported':
        return '<span class="tag" style="background:#E0F7F4;color:#0B4A42">CSV Export</span>';
      default:
        return `<span class="tag">${esc(act)}</span>`;
    }
  };

  tbody.innerHTML = list.map(r => `
    <tr>
      <td>
        <b style="font-size:.85rem;color:var(--navy);display:block">${fmt(r.timestamp)}</b>
        <span style="font-size:.74rem;color:var(--ink-50)">${r.timestamp && r.timestamp.includes('T') ? r.timestamp.split('T')[1].slice(0, 5) : ''}</span>
      </td>
      <td>
        <b>${esc(r.teacherName)}</b>
        <span style="font-size:.74rem;color:var(--ink-50);display:block">@${esc(r.teacherUsername || '')}</span>
      </td>
      <td>${actionBadge(r.action)}</td>
      <td><span class="pillx">${esc(r.grade || '—')}</span></td>
      <td><span style="font-size:.88rem;color:var(--ink-80);line-height:1.4">${esc(r.summary)}</span></td>
    </tr>
  `).join('');
}

function exportTeacherReportsCsv() {
  const list = db.teacherReports || [];
  if (!list.length) {
    toast('No activity records|There are no teacher activity logs to export.', 'warn');
    return;
  }

  const headers = ['Report ID', 'Timestamp', 'Teacher Name', 'Username', 'Class / Grade', 'Action Type', 'Summary'];
  const rows = list.map(r => [
    `"${r.id || ''}"`,
    `"${r.timestamp || ''}"`,
    `"${(r.teacherName || '').replace(/"/g, '""')}"`,
    `"${r.teacherUsername || ''}"`,
    `"${r.grade || ''}"`,
    `"${r.action || ''}"`,
    `"${(r.summary || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Christina_School_Teacher_Activity_Audit_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast(`Audit log exported|Downloaded ${list.length} teacher activity records.`);
}

function renderAdminTeacherReports() {
  // Update KPIs
  const totalTeachers = db.staff.length;
  const activeLogins = db.staff.filter(s => s.username).length;
  const totalStudents = (db.students || []).length;
  const presentStudents = (db.students || []).filter(s => (s.attendanceToday || 'Present') === 'Present').length;
  const attRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

  const kTeachers = $('#kRepTeachers');
  if (kTeachers) kTeachers.textContent = totalTeachers;

  const kLogins = $('#kRepActiveLogins');
  if (kLogins) kLogins.textContent = activeLogins;

  const kStudents = $('#kRepStudents');
  if (kStudents) kStudents.textContent = totalStudents;

  const kRate = $('#kRepAttRate');
  if (kRate) kRate.textContent = `${attRate}%`;

  // Render Teacher Summary Table
  const sumBody = $('#aTeacherSummaryBody');
  if (sumBody) {
    const teachers = db.staff.filter(s => s.username || s.assignedGrade);
    if (!teachers.length) {
      sumBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--ink-50)">No teachers assigned with portal logins yet. Use Staff view to configure credentials.</td></tr>`;
    } else {
      sumBody.innerHTML = teachers.map(s => {
        const gradeStudents = (db.students || []).filter(st => st.grade === s.assignedGrade);
        const presentCount = gradeStudents.filter(st => (st.attendanceToday || 'Present') === 'Present').length;
        const totalCount = gradeStudents.length;
        const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

        // Last activity
        const lastAct = (db.teacherReports || []).find(r => r.teacherUsername === s.username || r.teacherName === s.name);

        return `
          <tr>
            <td>
              <span class="cellav">
                <span class="av">${staffPic(s)}</span>
                <span><b>${esc(s.name)}</b><span>${esc(s.desig)}</span></span>
              </span>
            </td>
            <td>
              ${s.username ? `<span class="tag" style="background:#E7F1FF;color:#1D4ED8;font-size:.78rem;display:inline-flex;align-items:center;gap:4px"><svg class="i i-12"><use href="#ic-lock"/></svg> ${esc(s.username)}</span>` : `<span style="color:var(--ink-50);font-size:.76rem">No login</span>`}
            </td>
            <td>
              ${s.assignedGrade ? `<span class="pillx ok" style="font-weight:600">${esc(s.assignedGrade)} (${esc(s.assignedSection || 'A')})</span>` : `<span style="color:var(--ink-50)">—</span>`}
            </td>
            <td>
              <b style="color:var(--navy);font-size:.88rem">${totalCount}</b> <span style="font-size:.76rem;color:var(--ink-50)">students</span>
            </td>
            <td>
              ${totalCount > 0 ? `<span class="pillx ok" style="font-size:.75rem">${presentCount}/${totalCount} Present (${pct}%)</span>` : `<span style="color:var(--ink-50);font-size:.78rem">No students</span>`}
            </td>
            <td>
              ${lastAct ? `
                <div style="font-size:.8rem;color:var(--navy);font-weight:600">${fmt(lastAct.timestamp)}</div>
                <div style="font-size:.74rem;color:var(--ink-50);max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(lastAct.summary)}</div>
              ` : `<span style="color:var(--ink-50);font-size:.76rem">No reports logged</span>`}
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Render Audit feed
  renderTeacherAuditFeed();
}

function initAdminTeacherReports() {
  renderAdminTeacherReports();

  const actionFilter = $('#aReportFilterAction');
  if (actionFilter) onOnce(actionFilter, 'change', renderTeacherAuditFeed);

  const gradeFilter = $('#aReportFilterGrade');
  if (gradeFilter) onOnce(gradeFilter, 'change', renderTeacherAuditFeed);

  const exportBtn = $('#btnExportAuditLog');
  if (exportBtn) onOnce(exportBtn, 'click', exportTeacherReportsCsv);
}


/* ---- ROUTER SETUP & BOOT ---- */
const adminRouter = window.Router.init({
  container: '#admin-app',
  routes: {
    'home':            { page: 'pages/admin-overview.html', onLoad: initOverview },
    'overview':        { page: 'pages/admin-overview.html', onLoad: initOverview },
    'staff':           { page: 'pages/admin-staff.html', onLoad: initAdminStaff },
    'teacher-reports': { page: 'pages/admin-teacher-reports.html', onLoad: initAdminTeacherReports },
    'ann':        { page: 'pages/admin-announcements.html', onLoad: initAdminAnn },
    'gal':        { page: 'pages/admin-gallery.html', onLoad: initAdminGal },
    'ev':         { page: 'pages/admin-events.html', onLoad: initAdminEv },
    'ach':        { page: 'pages/admin-achievements.html', onLoad: initAdminAch },
    'activities': { page: 'pages/admin-activities.html', onLoad: initAdminActivities },
    'news':       { page: 'pages/admin-news.html', onLoad: initAdminNews },
    'doc':        { page: 'pages/admin-documents.html', onLoad: initAdminDocs },
    'enq':        { page: 'pages/admin-enquiries.html', onLoad: initAdminEnq },
    'tst':        { page: 'pages/admin-testimonials.html', onLoad: initAdminTst },
    'alumni':     { page: 'pages/admin-alumni.html', onLoad: initAdminAlumni },
    'set':        { page: 'pages/admin-settings.html', onLoad: initAdminSettings }
  },
  onRouteChange: function(hash) {
    const view = $('#admin-app .aview');
    if (view) view.classList.add('on');
    const t = TITLES[hash] || TITLES['overview'];
    if (t) {
      const aTitle = $('#aTitle');
      const aSub = $('#aSub');
      if (aTitle) aTitle.textContent = t[0];
      if (aSub) aSub.textContent = t[1];
    }
    $$('#aside nav button').forEach(b => b.classList.toggle('on', b.dataset.view === hash || (hash === 'home' && b.dataset.view === 'overview')));
    const aside = $('#aside');
    if (aside) aside.classList.remove('show');
  }
});

// Sidebar nav
$$('#aside nav button').forEach(b => b.addEventListener('click', () => {
  const view = b.dataset.view;
  if (view) adminRouter.go(view);
}));

// Global click handlers
document.addEventListener('click', e => {
  const ed = e.target.closest('[data-edit]');
  if (ed) { const [k, id] = ed.dataset.edit.split(':'); editor(k, db[STORE[k]].find(x => x.id === +id)); return; }
  
  const dl = e.target.closest('[data-del]');
  if (dl) { const [k, id] = dl.dataset.del.split(':'); confirmDelete(k, +id); }
  
  // Close modal
  if (e.target.closest('[data-close-modal]')) closeModal();
  
  // Quick actions
  const q = e.target.closest('[data-quick]');
  if (q) {
    const map = { ann: addAnn, ev: addEv, staff: addStaff, gal: addPhoto, doc: addDoc, tst: addTst, alumni: addAlumni, club: addClub, sport: addSport };
    if (map[q.dataset.quick]) map[q.dataset.quick]();
    return;
  }
  
  // Toast
  const tst = e.target.closest('[data-toast]');
  if (tst) { const p = tst.dataset.toast.split('|'); toast(p[0], p[1] || 'info'); }
});

// Escape key
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#modal') && $('#modal').classList.contains('open')) closeModal();
});

// Logout and view site
const logoutBtn = $('#logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', e => {
    e.preventDefault();
    sessionStorage.removeItem('christina_admin_auth');
    window.location.href = 'index.html';
  });
}

const viewSiteBtn = $('#viewSite');
if (viewSiteBtn) viewSiteBtn.addEventListener('click', () => { window.location.href = 'index.html'; });

const burgerBtn = $('#aBurger');
if (burgerBtn) {
  burgerBtn.addEventListener('click', e => {
    e.stopPropagation();
    $('#aside').classList.toggle('show');
  });
}

// Auto-close mobile sidebar when clicking a nav item or outside
document.addEventListener('click', e => {
  const aside = $('#aside');
  if (aside && aside.classList.contains('show')) {
    if (!aside.contains(e.target) && !e.target.closest('#aBurger')) {
      aside.classList.remove('show');
    }
  }
});

$$('#aside nav button').forEach(b => {
  b.addEventListener('click', () => {
    if (window.innerWidth <= 1000) {
      const aside = $('#aside');
      if (aside) aside.classList.remove('show');
    }
  });
});

// Boot
syncBurger();
refreshAdminCounts();
window.addEventListener('resize', syncBurger);

})();
