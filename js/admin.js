/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Admin Dashboard Logic
   ============================================================ */
'use strict';
(function() {
const { $, $$, REDUCED, esc, db, CATS, DEPTS, DOC_CATS, GAL_CATS, SCENES,
        TONES, fmt, dayOf, monOf, d2,
        scene, avatar, mountScenes,
        toast, countUp, revealer, watch, sortStores } = window.App;

const TITLES = {
  overview: ['Dashboard', 'Everything happening on the Christina School website today'],
  staff:    ['Staff', 'Add, edit and retire teacher profiles shown on the website'],
  ann:      ['Announcements', 'Post notices to the board, the ticker and the homepage'],
  gal:      ['Gallery', 'Albums and photographs shown in the public gallery'],
  ev:       ['Events', 'The calendar parents see on the homepage'],
  ach:      ['Achievements', 'Results your children brought home'],
  news:     ['News', 'Short updates written by staff'],
  doc:      ['Documents', 'Files for parents and students — admission forms, policies and more'],
  enq:      ['Admission enquiries', 'Every enquiry submitted through the website form'],
  set:      ['School settings', 'Details that appear across the public site']
};

function closeAdmin() { 
  window.location.href = 'index.html'; 
}

function syncBurger() { 
  const b = $('#aBurger');
  if (b) b.style.display = window.innerWidth <= 1000 ? 'block' : 'none'; 
}

function refreshAdminCounts() {
  const live = db.ann.filter(a => a.status === 'published').length;
  const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
  set('#cStaff', db.staff.length); set('#cAnn', db.ann.length); set('#cGal', db.gallery.length);
  set('#cEv', db.events.length); set('#cAch', db.ach.length); set('#cNews', db.news.length); set('#cEnq', db.enquiries.length);
  set('#cDoc', db.documents.length);
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
    const p = db.ann.find(a => a.pinned && a.status === 'published');
    pinnedAdmin.innerHTML = p
      ? `<div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--r-m);padding:1rem">
          <span class="cat" style="--cat:${CATS[p.cat].c};--catbg:${CATS[p.cat].bg}">${esc(p.cat)}</span>
          <h4 style="font-family:var(--serif);font-size:1.05rem;margin:.55rem 0 .3rem">${esc(p.title)}</h4>
          <p style="font-size:.85rem;color:var(--ink-50)">Pinned to the top of the notice board · Posted ${fmt(p.date)}</p>
          <button class="btn btn-soft btn-sm" style="margin-top:.9rem" type="button" data-edit="ann:${p.id}">Edit this notice</button>
        </div>`
      : `<div class="empty" style="padding:26px"><b>Nothing is pinned</b>Pin an announcement to feature it at the top of the board.</div>`;
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
      { k: 'grade', l: 'Grade', t: 'select', opts: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grades 7–8'] },
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
    ], file: 1 }
};
const STORE = { staff: 'staff', ann: 'ann', ev: 'events', ach: 'ach', news: 'news', gal: 'gallery', doc: 'documents' };
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
          <b>Drop a picture here, or choose a file</b><span>JPG or PNG, up to about 2 MB</span>
          <input type="file" id="fileIn" accept="image/*" hidden />
        </div>
        <div class="prev-grid" id="prevGrid">${r.photo || r.src ? `<div class="pv"><img src="${r.photo || r.src}" alt="Current picture" style="width:100%;height:100%;object-fit:cover" /><button type="button" data-rmpic aria-label="Remove picture"><svg class="i i-14"><use href="#ic-close"/></svg></button></div>` : ''}</div>` : ''}
      ${S.file ? `<div class="drop" id="docDropZone" tabindex="0" role="button" aria-label="Upload a document">
          <span class="up-ic"><svg class="i i-24"><use href="#ic-upload"/></svg></span>
          <b>Drop a file here, or choose a file</b><span>PDF, Word or Excel, up to about 5 MB</span>
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
      if (file.size > 5 * 1024 * 1024) { toast('That file is too large|Choose a file under 5 MB.', 'warn'); return; }
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
    if (kind === 'ann' && out.pinned) db.ann.forEach(a => { if (a !== out) a.pinned = false; });
    if (isNew) db[STORE[kind]].unshift(out);
    if (sortStores) sortStores();
    closeModal();
    // Re-render current route data based on hash
    const hash = window.location.hash.slice(2) || 'overview';
    const activeRoute = adminRouter.routes[hash];
    if (activeRoute && activeRoute.onLoad) activeRoute.onLoad();
    
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
    closeModal(); 
    
    const hash = window.location.hash.slice(2) || 'overview';
    const activeRoute = adminRouter.routes[hash];
    if (activeRoute && activeRoute.onLoad) activeRoute.onLoad();

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
        <td data-col="Qualification">${esc(s.qual || '—')}</td>
        <td data-col="Experience">${s.exp} yrs</td>
        <td data-col="Classes">${esc(s.classes || '—')}</td>
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
  const tbody = $('#aEnqBody');
  if (tbody) {
    tbody.innerHTML = db.enquiries.length ? db.enquiries.map(q2 => `
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
      </tr>`).join('') : blank(7, 'No enquiries yet');
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
  setTimeout(() => (f || $('#modal .x')).focus(), 60);
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
  $$('[data-quick]').forEach(b => b.addEventListener('click', () => {
    const map = { ann: addAnn, ev: addEv, staff: addStaff, gal: addPhoto, doc: addDoc };
    if (map[b.dataset.quick]) map[b.dataset.quick]();
  }));
}

function initAdminStaff() {
  renderAdminStaff();
  const search = $('#aStaffSearch');
  if (search) search.addEventListener('input', renderAdminStaff);
  const deptSel = $('#aStaffDept');
  if (deptSel) deptSel.addEventListener('change', renderAdminStaff);
  const addBtn = $('#addStaff');
  if (addBtn) addBtn.addEventListener('click', addStaff);
  
  const tbody = $('#aStaffBody');
  if (tbody) tbody.addEventListener('click', e => {
    const t = e.target.closest('[data-tog]');
    if (!t) return;
    const s = db.staff.find(x => x.id === +t.dataset.tog);
    if (!s) return;
    s.active = !s.active;
    t.classList.toggle('on', s.active);
    t.setAttribute('aria-pressed', String(s.active));
    refreshAdminCounts();
    toast(s.active ? 'Profile is live|' + s.name + ' now appears on the staff page.' : 'Profile hidden|' + s.name + ' has been taken off the staff page.', s.active ? 'ok' : 'info');
  });
}

function initAdminAnn() {
  renderAdminAnn();
  const seg = $('#annSeg');
  if (seg) seg.addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); 
    if (!b) return;
    annSeg = b.dataset.st;
    $$('#annSeg button').forEach(x => x.classList.toggle('on', x === b));
    renderAdminAnn();
  });
  
  const tbody = $('#aAnnBody');
  if (tbody) tbody.addEventListener('click', e => {
    const p = e.target.closest('[data-pin]'); 
    if (!p) return;
    const a = db.ann.find(x => x.id === +p.dataset.pin); 
    if (!a) return;
    const on = !a.pinned;
    db.ann.forEach(x => { x.pinned = false; });
    a.pinned = on;
    renderAdminAnn();
    toast(on ? 'Pinned|' + a.title + ' now sits at the top of the notice board.' : 'Unpinned|The notice board is back to date order.', on ? 'ok' : 'info');
  });

  const addBtn = $('#addAnn');
  if (addBtn) addBtn.addEventListener('click', addAnn);
}

function initAdminGal() {
  renderAdminGal();
  const btnAddPhoto = $('#addPhoto');
  if (btnAddPhoto) btnAddPhoto.addEventListener('click', addPhoto);
  
  const btnAddAlbum = $('#addAlbum');
  if (btnAddAlbum) btnAddAlbum.addEventListener('click', () => {
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
      closeModal(); 
      renderAdminGal();
      toast('Album created|' + n + ' is ready for photographs.');
    });
  });
}

function initAdminEv() {
  renderAdminEv();
  const addBtn = $('#addEv');
  if (addBtn) addBtn.addEventListener('click', addEv);
}

function initAdminAch() {
  renderAdminAch();
  const addBtn = $('#addAch');
  if (addBtn) addBtn.addEventListener('click', addAch);
}

function initAdminNews() {
  renderAdminNews();
  const addBtn = $('#addNews');
  if (addBtn) addBtn.addEventListener('click', addNews);
}

function initAdminDocs() {
  renderAdminDocs();
  const addBtn = $('#addDoc');
  if (addBtn) addBtn.addEventListener('click', addDoc);
}

function initAdminEnq() {
  renderAdminEnq();
  const tbody = $('#aEnqBody');
  if (tbody) {
    tbody.addEventListener('click', e => {
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
  const sadm = $('#s-adm');
  if (sadm) sadm.addEventListener('click', () => {
    const t = $('#s-adm'), on = t.classList.toggle('on');
    t.setAttribute('aria-pressed', String(on));
    $$('.badge, .adm-flag').forEach(el => { el.style.display = on ? '' : 'none'; });
  });

  const setForm = $('#setForm');
  if (setForm) setForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#s-name').value.trim() || 'Christina Nursery and Primary School';
    const tag = $('#s-tag').value.trim();
    const addr = $('#s-addr').value.trim();
    const hours = $('#s-hours').value.trim();
    const phone = $('#s-phone').value.trim();
    const mail = $('#s-mail').value.trim();
    db.settings = { name: name, tag: tag, addr: addr, hours: hours, phone: phone, mail: mail, ticker: $('#s-ticker').value.trim() };
    
    // In a real app this would reflect globally. For admin we just show toast.
    toast('Settings saved|The public website has been updated.');
  });
}


/* ---- ROUTER SETUP & BOOT ---- */
const adminRouter = window.Router.init({
  container: '#admin-app',
  routes: {
    'home':     { page: 'pages/admin-overview.html', onLoad: initOverview },
    'overview': { page: 'pages/admin-overview.html', onLoad: initOverview },
    'staff':    { page: 'pages/admin-staff.html', onLoad: initAdminStaff },
    'ann':      { page: 'pages/admin-announcements.html', onLoad: initAdminAnn },
    'gal':      { page: 'pages/admin-gallery.html', onLoad: initAdminGal },
    'ev':       { page: 'pages/admin-events.html', onLoad: initAdminEv },
    'ach':      { page: 'pages/admin-achievements.html', onLoad: initAdminAch },
    'news':     { page: 'pages/admin-news.html', onLoad: initAdminNews },
    'doc':      { page: 'pages/admin-documents.html', onLoad: initAdminDocs },
    'enq':      { page: 'pages/admin-enquiries.html', onLoad: initAdminEnq },
    'set':      { page: 'pages/admin-settings.html', onLoad: initAdminSettings }
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
if (logoutBtn) logoutBtn.addEventListener('click', () => { window.location.href = 'index.html'; });

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
