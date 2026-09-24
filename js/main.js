/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Public Site Logic
   ============================================================ */
'use strict';
(function() {
const { $, $$, REDUCED, esc, db, CATS, DEPTS, DOC_CATS, GAL_CATS, TONES,
        fmt, dayOf, monOf, scene, avatar, staffPic, mountScenes,
        toast, countUp, revealer, watch, sortStores, d2, hash, isAnnActive } = window.App;

/* ------------------------------------------------------------
   PRELOADER ANIMATION
   ------------------------------------------------------------ */
(function preload() {
  const bar = $('#preBar'), pre = $('#pre');
  if (!bar || !pre) return;
  let v = 0; let finished = false;
  const t = setInterval(() => {
    v = Math.min(100, v + 12 + Math.random() * 16);
    bar.style.width = v + '%';
  }, 75);
  const done = () => {
    if (finished) return;
    finished = true;
    clearInterval(t);
    bar.style.width = '100%';
    setTimeout(() => {
      pre.classList.add('gone');
      const h = $('.hero'); if (h) h.classList.add('go');
      setTimeout(() => { pre.remove(); }, 650);
    }, REDUCED ? 40 : 320);
  };
  if (document.readyState === 'complete') setTimeout(done, 120);
  else {
    window.addEventListener('load', done);
    setTimeout(done, 1500);
  }
})();

/* ------------------------------------------------------------
   NAVIGATION, SCROLL STATE, DRAWER
   ------------------------------------------------------------ */
const nav = $('#nav'), progress = $('#progress'), totop = $('#totop');
const ring = $('#totop .ring circle');
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? y / max : 0;
  if(nav) nav.classList.toggle('stuck', y > 12);
  if(progress) progress.style.transform = `scaleX(${p})`;
  if(totop) totop.classList.toggle('show', y > 620);
  if (ring) ring.style.strokeDashoffset = String(176 - 176 * p);
  $$('[data-parallax]').forEach(el => {
    if (REDUCED) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      el.style.transform = `translateY(${(r.top - innerHeight / 2) * (parseFloat(el.dataset.parallax) || .05)}px)`;
    }
  });
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

if(totop) totop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }));

function goto(sel) {
  if (!sel) return;
  const clean = sel.replace(/^#\/?/, '').split('?')[0].trim();
  if (sel.startsWith('#/')) {
    window.Router.go(clean);
    return;
  }
  try {
    const el = document.getElementById(clean) || $(sel);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - (window.innerWidth > 1000 ? 96 : 74);
      window.scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
      return;
    }
  } catch(e) {}
  if (clean) {
    window.Router.go(clean);
  }
}
/* drawer state handlers */
function openDrawer() {
  const d = $('#drawer'), b = $('#burger');
  if (d) d.classList.add('open');
  if (b) b.setAttribute('aria-expanded', 'true');
  document.body.classList.add('locked');
}

function closeDrawer() {
  const d = $('#drawer'), b = $('#burger');
  if (d) d.classList.remove('open');
  if (b) b.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('locked');
}

document.addEventListener('click', e => {
  // 1. Burger button toggle
  const b = e.target.closest('#burger');
  if (b) {
    e.preventDefault();
    e.stopPropagation();
    const d = $('#drawer');
    if (d && d.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
    return;
  }

  // 2. Drawer close button or backdrop veil
  if (e.target.closest('[data-close-drawer]') || (e.target.classList.contains('veil') && e.target.closest('#drawer'))) {
    e.preventDefault();
    closeDrawer();
    return;
  }

  // 3. Goto attributes
  const g = e.target.closest('[data-goto]');
  if (g) {
    e.preventDefault();
    closeDrawer();
    goto(g.dataset.goto);
    return;
  }

  // 4. Hash links
  const a = e.target.closest('a[href^="#"]');
  if (a && a.getAttribute('href').length > 1 && !a.closest('.lbox')) {
    const href = a.getAttribute('href');
    const clean = href.replace(/^#\/?/, '');
    const el = document.getElementById(clean);
    if (el && !href.startsWith('#/')) {
      e.preventDefault();
      closeDrawer();
      goto('#' + clean);
      history.replaceState(null, '', '#' + clean);
    } else {
      e.preventDefault();
      closeDrawer();
      window.Router.go(clean);
    }
  }

  const tst = e.target.closest('[data-toast]');
  if (tst) {
    const p = tst.dataset.toast.split('|');
    toast(p[0], p[1] || 'info');
  }
});

// Mobile touch listener for instant 0ms burger response
document.addEventListener('touchstart', e => {
  const b = e.target.closest('#burger');
  if (b) {
    e.preventDefault();
    e.stopPropagation();
    const d = $('#drawer');
    if (d && d.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }
}, { passive: false });

// Global escape key listener
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeDrawer();
    if (typeof closeModal === 'function') closeModal();
    if (typeof closeLogin === 'function') closeLogin();
    if (typeof closeAnnDialog === 'function') closeAnnDialog();
  }
});

/* button ripple */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn'); if (!b || REDUCED) return;
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
  const sp = document.createElement('span');
  sp.className = 'ripple';
  sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  b.appendChild(sp); setTimeout(() => sp.remove(), 700);
});

/* active navigation state updater */
function updateActiveNav(hash) {
  const aliasMap = {
    'life': 'activities',
    'sports': 'activities',
    'achievements': 'activities',
    'why': 'about',
    'campus': 'academics',
    'events': 'announcements',
    'voices': 'testimonials'
  };
  const primary = aliasMap[hash] || hash;
  $$('#menu a, #drawer nav a').forEach(a => {
    const raw = (a.getAttribute('href') || '').replace(/^#\/?/, '').split('?')[0];
    const isCurrent = raw === hash || raw === primary;
    a.setAttribute('aria-current', isCurrent ? 'true' : 'false');
  });
}

/* ------------------------------------------------------------
   TICKER
   ------------------------------------------------------------ */
function renderTicker() {
  const t = $('#ticker'); if(!t) return;
  const live = db.ann.filter(a => a.status === 'published').slice(0, 6).map(a => a.title);
  live.push('Campus tours run at 10 am and 2 pm on weekdays');
  const html = live.map(text => `<span>${esc(text)}</span>`).join('');
  t.innerHTML = html + html;
}

/* ------------------------------------------------------------
   ABOUT — vision / mission / values
   ------------------------------------------------------------ */
// Binders inside initAbout

/* ------------------------------------------------------------
   ACADEMICS
   ------------------------------------------------------------ */
let stage = 'early', gradeIx = 0;
function renderGrades() {
  const rail = $('#gradeRail'); if(!rail) return;
  // Ensure stage exists in db.academics
  if (!db.academics[stage]) {
    stage = Object.keys(db.academics)[0] || 'early';
  }
  const list = db.academics[stage];
  if (!list || !list.length) return;
  if (gradeIx >= list.length) gradeIx = 0;
  rail.innerHTML = list.map((g, i) =>
    `<button class="gbtn" role="tab" aria-selected="${i === gradeIx}" data-ix="${i}">
       <b>${esc(g.label || ('Grade ' + g.g))}</b><span>${g.subjects.length} subjects</span></button>`).join('');
  renderAcaPanel();
}
function renderAcaPanel() {
  const panel = $('#acaPanel'); if(!panel) return;
  const list = db.academics[stage];
  if (!list || !list[gradeIx]) return;
  const g = list[gradeIx];
  const stageName = stage === 'early' ? 'Early Years' : 'Primary';
  const gradeLabel = g.label || ('Grade ' + g.g);
  panel.innerHTML = `
    <div class="aca-panel swap">
      <div>
        <span class="tag">${stageName} · ${esc(gradeLabel)}</span>
        <h3 style="margin-top:.6rem">${esc(g.focus)}</h3>
        <div class="subj">${g.subjects.map(s => `<span>${esc(s)}</span>`).join('')}</div>
        <ul class="acts">${g.acts.map(a =>
          `<li><span class="tick"><svg class="i i-14"><use href="#ic-check"/></svg></span>${esc(a)}</li>`).join('')}</ul>
      </div>
      <div class="aca-visual">
        <div class="ph zoom" data-scene="${stage === 'early' ? 'art' : 'classroom'}"
             data-alt="${esc(gradeLabel)} learning at Christina Nursery and Primary School"></div>
        <div class="aca-facts">
          <div><b>${g.size}</b><span>Children per class</span></div>
          <div><b>${g.teachers}</b><span>Caring educators</span></div>
          <div><b>${esc(g.hw)}</b><span>Daily home activity</span></div>
        </div>
      </div>
    </div>`;
  mountScenes(panel);
}
function movePill() {
  const active = $('.aca-tabs button[aria-selected="true"]'), pill = $('#acaPill');
  if (!active || !pill) return;
  pill.style.width = active.offsetWidth + 'px';
  pill.style.transform = `translateX(${active.offsetLeft - 5}px)`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('.aca-tabs button');
  if(b) {
    $$('.aca-tabs button').forEach(x => x.setAttribute('aria-selected', 'false'));
    b.setAttribute('aria-selected', 'true');
    stage = b.dataset.stage; gradeIx = 0; movePill(); renderGrades();
  }
});
document.addEventListener('click', e => {
  const b = e.target.closest('#gradeRail .gbtn'); if (!b) return;
  gradeIx = +b.dataset.ix;
  $$('#gradeRail .gbtn').forEach(x => x.setAttribute('aria-selected', 'false'));
  b.setAttribute('aria-selected', 'true');
  renderAcaPanel();
});
document.addEventListener('keydown', e => {
  const rail = $('#gradeRail');
  if(rail && rail.contains(e.target)) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const list = db.academics[stage];
    gradeIx = (gradeIx + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length;
    renderGrades();
    const btns = $$('#gradeRail .gbtn');
    if(btns[gradeIx]) btns[gradeIx].focus();
  }
});

/* ------------------------------------------------------------
   STAFF
   ------------------------------------------------------------ */
let dept = 'All', q = '';
function renderDeptChips() {
  const dChips = $('#deptChips'); if(!dChips) return;
  const used = ['All'].concat(DEPTS.filter(d => db.staff.some(s => s.dept === d && s.active)));
  dChips.innerHTML = used.map(d =>
    `<button class="chip-btn${d === dept ? ' active' : ''}" data-dept="${esc(d)}">${esc(d)}</button>`).join('');
}
function renderStaff() {
  const sGrid = $('#staffGrid'); if(!sGrid) return;
  const list = db.staff.filter(s => s.active)
    .filter(s => dept === 'All' || s.dept === dept)
    .filter(s => !q || (s.name + ' ' + s.desig + ' ' + s.subjects + ' ' + s.classes + ' ' + s.dept).toLowerCase().includes(q));
  const sCount = $('#staffCount');
  if(sCount) sCount.textContent = `${list.length} of ${db.staff.filter(s => s.active).length} teachers shown`;
  sGrid.innerHTML = list.length ? list.map((s, i) => `
    <article class="staff-card tilt rv" data-d="${i % 4}" data-staff="${s.id}" tabindex="0" role="button"
      aria-label="View profile of ${esc(s.name)}">
      <div class="pic"><div class="ph">${staffPic ? staffPic(s) : avatar(s.name, 's'+s.id)}</div><span class="dept">${esc(s.dept)}</span></div>
      <div class="body">
        <h3>${esc(s.name)}</h3>
        <p class="desig">${esc(s.desig)}</p>
        <div class="meta">
          <span>${esc(s.qual)}</span>
          <span>${s.exp} years teaching · ${esc(s.classes)}</span>
        </div>
        <span class="view">View profile <svg class="i i-16 ico"><use href="#ic-arrow-r"/></svg></span>
      </div>
    </article>`).join('')
    : `<div class="empty" style="grid-column:1/-1"><b>No teacher matches that search</b>
        Try a subject like "science", or clear the filters to see everyone.</div>`;
  watch(sGrid);
  bindTilt(sGrid);
}
document.addEventListener('click', e => {
  const b = e.target.closest('#deptChips [data-dept]'); if (!b) return;
  dept = b.dataset.dept; renderDeptChips(); renderStaff();
});
document.addEventListener('input', e => {
  if(e.target.id === 'staffSearch') { q = e.target.value.trim().toLowerCase(); renderStaff(); }
});
document.addEventListener('click', e => {
  const c = e.target.closest('#staffGrid [data-staff]'); if (c) staffModal(+c.dataset.staff);
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const c = e.target.closest('#staffGrid [data-staff]'); if (c) { e.preventDefault(); staffModal(+c.dataset.staff); }
});
function staffModal(id) {
  const s = db.staff.find(x => x.id === id); if (!s) return;
  openModal(`
    <div class="mhead">
      <div class="prof">
        <div class="pic">${staffPic ? staffPic(s) : avatar(s.name, 's'+s.id)}</div>
        <div>
          <span class="tag">${esc(s.dept)}</span>
          <h3 id="modalTitle" style="margin-top:.5rem">${esc(s.name)}</h3>
          <p style="color:var(--mari-deep);font-weight:600;font-size:.92rem">${esc(s.desig)}</p>
        </div>
      </div>
    </div>
    <div class="mbody">
      <p style="color:var(--ink-70)">${esc(s.note)}</p>
      <div class="prof-facts">
        <div><b>Qualification</b><span>${esc(s.qual)}</span></div>
        <div><b>Experience</b><span>${s.exp} years</span></div>
        <div><b>Classes handled</b><span>${esc(s.classes)}</span></div>
        <div><b>Subjects</b><span>${esc(s.subjects)}</span></div>
      </div>
      <div style="display:flex;gap:10px;margin-top:1.4rem;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" type="button" data-toast="Message sent to the office.|We will pass it to ${esc(s.name)} today.">Message through the office</button>
        <button class="btn btn-soft btn-sm" type="button" data-close-modal>Close</button>
      </div>
    </div>`);
}

function bindTilt(root) {
  if (REDUCED || window.matchMedia('(hover: none)').matches) return;
  $$('.tilt', root || document).forEach(card => {
    if (card.dataset.tilt) return; card.dataset.tilt = '1';
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 6}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

/* ------------------------------------------------------------
   CLUBS / STUDENT LIFE
   ------------------------------------------------------------ */
function renderClubs() {
  const lg = $('#lifeGrid'); if(!lg) return;
  lg.innerHTML = db.clubs.map((c, i) => `
    <article class="life rv" data-d="${i % 3}" style="${TONES[c.tone]}">
      <span class="blobdeco" aria-hidden="true"></span>
      <span class="emoji-ic"><svg class="i i-24"><use href="#${c.icon}"/></svg></span>
      <div><h3>${esc(c.name)}</h3><p>${esc(c.text)}</p></div>
    </article>`).join('');
  watch(lg);
}

/* ------------------------------------------------------------
   SPORTS RAIL (drag + arrows)
   ------------------------------------------------------------ */
function renderSports() {
  const sr = $('#sportRail'); if(!sr) return;
  sr.innerHTML = db.sports.map(s => `
    <article class="sport zoom">
      <div class="ph" data-scene="${s.theme}" data-alt="${esc(s.name)} at Christina Nursery and Primary School"></div>
      <span class="lvl">${esc(s.lvl)}</span>
      <div class="inner"><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p></div>
    </article>`).join('');
  mountScenes(sr);
  
  // Drag handler
  let down = false, sx = 0, sl = 0, moved = 0;
  sr.addEventListener('pointerdown', e => { down = true; moved = 0; sx = e.clientX; sl = sr.scrollLeft; sr.classList.add('drag'); });
  sr.addEventListener('pointermove', e => { if (!down) return; moved = e.clientX - sx; sr.scrollLeft = sl - moved; });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
    sr.addEventListener(ev, () => { down = false; sr.classList.remove('drag'); }));
}
document.addEventListener('click', e => {
  const nxt = e.target.closest('#sportNext'), prv = e.target.closest('#sportPrev');
  const rail = $('#sportRail');
  if(!rail) return;
  const step = () => Math.min(rail.clientWidth * .8, 320);
  if(nxt) rail.scrollBy({ left: step(), behavior: 'smooth' });
  if(prv) rail.scrollBy({ left: -step(), behavior: 'smooth' });
});

/* ------------------------------------------------------------
   ACHIEVEMENTS
   ------------------------------------------------------------ */
function renderAch() {
  const al = $('#achList'); if(!al) return;
  al.innerHTML = db.ach.map((a, i) => `
    <article class="ach ${a.medal} rv" data-d="${i % 5}">
      <span class="trophy"><svg class="i i-24"><use href="#ic-trophy"/></svg></span>
      <div><h3>${esc(a.comp)}</h3><p class="who">${esc(a.student)} · ${esc(a.grade)} · ${fmt(a.date)}</p></div>
      <div class="res"><b>${esc(a.result)}</b><span>${esc(a.grade)}</span></div>
    </article>`).join('');
  watch(al);
}

/* ------------------------------------------------------------
   ANNOUNCEMENTS
   ------------------------------------------------------------ */
let annCat = 'All';
function renderAnnChips() {
  const ac = $('#annChips'); if(!ac) return;
  const cats = ['All'].concat(Object.keys(CATS));
  ac.innerHTML = cats.map(c =>
    `<button class="chip-btn${c === annCat ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
}
function renderPinned() {
  const pw = $('#pinnedWrap'); if(!pw) return;
  const p = db.ann.find(a => a.pinned && a.status === 'published');
  pw.innerHTML = !p ? '' : `
    <div class="pinned">
      <span class="deco-ring" aria-hidden="true"></span>
      <span class="pin-ic"><svg class="i i-28"><use href="#ic-pin"/></svg></span>
      <div>
        <span class="cat" style="--cat:${CATS[p.cat].c};--catbg:${CATS[p.cat].bg}">${esc(p.cat)}</span>
        <h3 style="margin-top:.5rem">${esc(p.title)}</h3>
        <p>${esc(p.text)}</p>
      </div>
      <button class="btn btn-primary" type="button" data-ann="${p.id}">Read the full notice</button>
    </div>`;
}
function renderAnn() {
  const ag = $('#annGrid'); if(!ag) return;
  const list = db.ann.filter(a => a.status === 'published' && !a.pinned).filter(a => annCat === 'All' || a.cat === annCat);
  ag.innerHTML = list.length ? list.map((a, i) => `
    <article class="ann rv" data-d="${i % 3}" style="--cat:${CATS[a.cat].c}">
      <div class="hd">
        <span class="cat" style="--cat:${CATS[a.cat].c};--catbg:${CATS[a.cat].bg}">${esc(a.cat)}</span>
        <span class="date">${fmt(a.date)}</span>
      </div>
      <h3>${esc(a.title)}</h3>
      <p>${esc(a.text)}</p>
      <button class="link-a" type="button" data-ann="${a.id}">Read more <svg class="i i-16 ico"><use href="#ic-arrow-r"/></svg></button>
    </article>`).join('')
    : `<div class="empty" style="grid-column:1/-1"><b>Nothing under this heading right now</b>
        Choose "All" to see every notice on the board.</div>`;
  watch(ag);
}
document.addEventListener('click', e => {
  const b = e.target.closest('#annChips [data-cat]'); if (!b) return;
  annCat = b.dataset.cat; renderAnnChips(); renderAnn();
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ann]'); if (!b) return;
  const a = db.ann.find(x => x.id === +b.dataset.ann); if (!a) return;
  openModal(`
    <div class="mhead">
      <span class="cat" style="--cat:${CATS[a.cat].c};--catbg:${CATS[a.cat].bg}">${esc(a.cat)}</span>
      <h3 id="modalTitle" style="margin-top:.7rem">${esc(a.title)}</h3>
      <p class="small" style="color:var(--ink-50);margin-top:.4rem">Posted ${fmt(a.date)}${a.expiry ? ' · Shown until ' + fmt(a.expiry) : ''}</p>
    </div>
    <div class="mbody">
      ${a.body.split('\n\n').map(p => `<p style="color:var(--ink-70);margin-bottom:.9rem">${esc(p)}</p>`).join('')}
      <div style="display:flex;gap:10px;margin-top:.6rem;flex-wrap:wrap">
        <button class="btn btn-soft btn-sm" type="button" data-toast="Notice copied.|Paste it into a message to another parent.">Copy this notice</button>
        <button class="btn btn-navy btn-sm" type="button" data-close-modal>Done</button>
      </div>
    </div>`);
});

/* ------------------------------------------------------------
   EVENTS
   ------------------------------------------------------------ */
function renderEvents() {
  const el = $('#evList'); if(!el) return;
  el.innerHTML = db.events.map((e, i) => `
    <article class="ev rv" data-d="${i % 4}">
      <span class="ev-date"><b>${dayOf(e.date)}</b><span>${monOf(e.date)}</span></span>
      <div>
        <h3>${esc(e.title)}</h3>
        <div class="ev-meta">
          <span><svg class="i i-14"><use href="#ic-clock"/></svg> ${esc(e.time)}</span>
          <span><svg class="i i-14"><use href="#ic-mappin"/></svg> ${esc(e.loc)}</span>
        </div>
        <p>${esc(e.desc)}</p>
      </div>
      <button class="btn btn-ghost on-navy btn-sm" type="button"
        data-toast="Added to your reminders.|${esc(e.title)}, ${fmt(e.date)}">Remind me</button>
    </article>`).join('');
  watch(el);
}

/* ------------------------------------------------------------
   GALLERY + LIGHTBOX
   ------------------------------------------------------------ */
let galCat = 'All', lbList = [], lbIx = 0;
function renderGalChips() {
  const gc = $('#galChips'); if(!gc) return;
  gc.innerHTML = GAL_CATS.map(c =>
    `<button class="chip-btn${c === galCat ? ' active' : ''}" data-gal="${esc(c)}">${esc(c)}</button>`).join('');
}
function renderGallery() {
  const gg = $('#galGrid'); if(!gg) return;
  const list = db.gallery.filter(g => galCat === 'All' || g.cat === galCat);
  const gc = $('#galCount'); if(gc) gc.textContent = `${list.length} photograph${list.length === 1 ? '' : 's'}`;
  gg.innerHTML = list.length ? list.map((g, i) => `
    <figure class="gitem" style="animation-delay:${Math.min(i * 45, 500)}ms" data-gix="${i}" tabindex="0" role="button"
      aria-label="Open photo: ${esc(g.cap)}">
      <div class="ph" style="height:${g.h}px" data-scene="${g.theme}" data-alt="${esc(g.cap)}"${g.src ? ` data-src="${g.src}"` : ''}></div>
      <span class="expand" aria-hidden="true"><svg class="i i-16"><use href="#ic-expand"/></svg></span>
      <figcaption class="gcap"><b>${esc(g.cap)}</b><span>${esc(g.cat)} · ${fmt(g.date)}</span></figcaption>
    </figure>`).join('')
    : `<div class="empty"><b>No photographs in this album yet</b>Pick another category to keep looking.</div>`;
  mountScenes(gg);
  gg.dataset.list = JSON.stringify(list.map(g => ({ theme: g.theme, cap: g.cap, src: g.src || '', sub: g.cat + ' · ' + fmt(g.date) })));
}
document.addEventListener('click', e => {
  const b = e.target.closest('#galChips [data-gal]'); if (!b) return;
  galCat = b.dataset.gal; renderGalChips(); renderGallery();
});
function openLightbox(list, ix) {
  lbList = list; lbIx = ix;
  $('#lbox').classList.add('open');
  document.body.classList.add('locked');
  paintLightbox();
  $('#lbClose').focus();
}
function paintLightbox() {
  const it = lbList[lbIx]; if (!it) return;
  $('#lbFrame').innerHTML = it.src
    ? `<img src="${it.src}" alt="${esc(it.cap)}" style="width:100%;height:100%;object-fit:contain;display:block" />`
    : scene(it.theme, it.cap);
  $('#lbCap').innerHTML = `<b>${esc(it.cap)}</b><span>${esc(it.sub || '')}</span>`;
  $('#lbCount').textContent = `${lbIx + 1} of ${lbList.length}`;
}
function moveLightbox(d) { lbIx = (lbIx + d + lbList.length) % lbList.length; paintLightbox(); }
function closeLightbox() { $('#lbox').classList.remove('open'); document.body.classList.remove('locked'); }
document.addEventListener('click', e => {
  if (e.target.closest('#lbNext')) moveLightbox(1);
  else if (e.target.closest('#lbPrev')) moveLightbox(-1);
  else if (e.target.closest('#lbClose')) closeLightbox();
  else if (e.target.id === 'lbox') closeLightbox();
  
  const f = e.target.closest('#galGrid [data-gix]');
  if(f) openLightbox(JSON.parse($('#galGrid').dataset.list || '[]'), +f.dataset.gix);
});
document.addEventListener('keydown', e => {
  const f = e.target.closest('#galGrid [data-gix]');
  if(f && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault(); openLightbox(JSON.parse($('#galGrid').dataset.list || '[]'), +f.dataset.gix);
  }
});
/* campus mosaic also opens the viewer */
document.addEventListener('click', e => {
  const fig = e.target.closest('.mosaic [data-lightbox]'); if (!fig) return;
  const figs = $$('.mosaic [data-lightbox]');
  const list = figs.map(f => ({
    theme: $('.ph', f).dataset.scene,
    cap: $('.cap b', f).textContent,
    sub: $('.badge2', f).textContent + ' · ' + $('.cap span', f).textContent
  }));
  openLightbox(list, figs.indexOf(fig));
});
addEventListener('keydown', e => {
  const lb = $('#lbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') moveLightbox(1);
  if (e.key === 'ArrowLeft') moveLightbox(-1);
});

/* ------------------------------------------------------------
   TESTIMONIALS
   ------------------------------------------------------------ */
let tIx = 0, tTimer = null;
function renderTst() {
  const tt = $('#tstTrack'); if(!tt) return;
  tt.innerHTML = db.testimonials.map(t => `
    <div class="tst"><div class="tst-in">
      <div class="av">${avatar(t.name, 'p' + t.id)}</div>
      <div>
        <span class="quote-mark" aria-hidden="true">&ldquo;</span>
        <blockquote>${esc(t.text)}</blockquote>
        <p class="by"><b>${esc(t.name)}</b> <span>— ${esc(t.child)}</span></p>
      </div>
    </div></div>`).join('');
  $('#tstDots').innerHTML = db.testimonials.map((t, i) =>
    `<button class="${i === 0 ? 'on' : ''}" data-t="${i}" role="tab" aria-label="Testimonial ${i + 1}"></button>`).join('');
  paintTst();
}
function paintTst() {
  const tt = $('#tstTrack'); if(!tt) return;
  tt.style.transform = `translateX(-${tIx * 100}%)`;
  $$('#tstDots button').forEach((d, i) => d.classList.toggle('on', i === tIx));
}
function moveTst(d) { tIx = (tIx + d + db.testimonials.length) % db.testimonials.length; paintTst(); resetTst(); }
function resetTst() {
  clearInterval(tTimer);
  if (REDUCED) return;
  tTimer = setInterval(() => { tIx = (tIx + 1) % db.testimonials.length; paintTst(); }, 6500);
}
document.addEventListener('click', e => {
  if (e.target.closest('#tstNext')) moveTst(1);
  else if (e.target.closest('#tstPrev')) moveTst(-1);
  
  const b = e.target.closest('#tstDots [data-t]');
  if(b) { tIx = +b.dataset.t; paintTst(); resetTst(); }
});
document.addEventListener('pointerdown', e => {
  const v = e.target.closest('.tst-view'); if(!v) return;
  let x0 = e.clientX;
  const up = ev => {
    v.removeEventListener('pointerup', up);
    if (x0 === null) return;
    const dx = ev.clientX - x0; x0 = null;
    if (Math.abs(dx) > 55) moveTst(dx < 0 ? 1 : -1);
  };
  v.addEventListener('pointerup', up);
});

/* ------------------------------------------------------------
   NEWS
   ------------------------------------------------------------ */
function renderNews() {
  const ng = $('#newsGrid'); if(!ng) return;
  ng.innerHTML = db.news.slice(0, 5).map((n, i) => `
    <article class="news${i === 0 ? ' feature' : ''} zoom rv" data-d="${i % 3}">
      <div class="ph" data-scene="${n.theme}" data-alt="${esc(n.title)}"></div>
      <div class="nb">
        <span class="dt">${fmt(n.date)} · ${esc(n.by)}</span>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.text)}</p>
        <button class="link-a" type="button" data-toast="Full story opens in the live site.|${esc(n.title)}">Read the update <svg class="i i-16 ico"><use href="#ic-arrow-r"/></svg></button>
      </div>
    </article>`).join('');
  mountScenes(ng);
  watch(ng);
}

/* ------------------------------------------------------------
   DOCUMENTS
   ------------------------------------------------------------ */
let docCat = 'All';
function renderDocChips() {
  const dc = $('#docChips'); if(!dc) return;
  dc.innerHTML = DOC_CATS.map(c =>
    `<button class="chip-btn${c === docCat ? ' active' : ''}" data-doc="${esc(c)}">${esc(c)}</button>`).join('');
}
function renderDocs() {
  const dg = $('#docGrid'); if(!dg) return;
  const list = db.documents.filter(d => docCat === 'All' || d.category === docCat);
  dg.innerHTML = list.length ? list.map((d, i) => `
    <div class="doc-card rv" data-d="${i % 4}">
      <span class="ic"><svg class="i i-20"><use href="#ic-doc"/></svg></span>
      <div class="db">
        <h3>${esc(d.title)}</h3>
        <span class="meta">${esc(d.category)} · For ${esc((d.audience || 'Everyone').toLowerCase())} · ${fmt(d.date)}</span>
        ${d.desc ? `<p>${esc(d.desc)}</p>` : ''}
        ${d.file
          ? `<a class="btn btn-soft btn-sm" href="${d.file}" download="${esc(d.fileName || d.title)}"><svg class="i i-16"><use href="#ic-arrow-u"/></svg> Download</a>`
          : `<button class="btn btn-soft btn-sm" type="button" data-toast="Coming soon|This document will be uploaded shortly. Please check back.">Download</button>`}
      </div>
    </div>`).join('')
    : `<div class="empty"><b>No documents in this category yet</b>Pick another category to keep looking.</div>`;
  watch(dg);
}
document.addEventListener('click', e => {
  const b = e.target.closest('#docChips [data-doc]'); if (!b) return;
  docCat = b.dataset.doc; renderDocChips(); renderDocs();
});

/* ------------------------------------------------------------
   MODAL SYSTEM
   ------------------------------------------------------------ */
let lastFocus = null;
function openModal(html, wide) {
  lastFocus = document.activeElement;
  const mc = $('#modalContent'); if(mc) mc.innerHTML = html;
  const mb = $('#modalBox'); if(mb) mb.className = 'box' + (wide ? ' wide' : '');
  const m = $('#modal'); if(m) m.classList.add('open');
  document.body.classList.add('locked');
  if(mc) mountScenes(mc);
  const f = $('#modalContent input, #modalContent select, #modalContent textarea, #modalContent button');
  setTimeout(() => (f || $('#modal .x')).focus(), 60);
}
function closeModal() {
  const m = $('#modal'); if(m) m.classList.remove('open');
  const a = $('#admin');
  if (!a || !a.classList.contains('open')) document.body.classList.remove('locked');
  if (lastFocus) lastFocus.focus();
}
document.addEventListener('click', e => { if (e.target.closest('[data-close-modal]')) closeModal(); });
addEventListener('keydown', e => {
  const m = $('#modal'), l = $('#login');
  if (e.key === 'Escape') {
    if (m && m.classList.contains('open')) closeModal();
    else if (l && l.classList.contains('open')) closeLogin();
    else if (drawer && drawer.classList.contains('open')) closeDrawer();
  }
  if (e.key === 'Tab' && m && m.classList.contains('open')) trap(e, $('#modalBox'));
  if (e.key === 'Tab' && l && l.classList.contains('open')) trap(e, $('#login .box'));
});
function trap(e, box) {
  const f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', box)
    .filter(el => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ------------------------------------------------------------
   PUBLIC FORMS
   ------------------------------------------------------------ */
function validate(form, rules) {
  let ok = true;
  rules.forEach(r => {
    const el = $(r.sel); if(!el) return;
    const wrap = el.closest('.field');
    const good = r.test(el.value.trim());
    wrap.classList.toggle('bad', !good);
    wrap.classList.toggle('ok', good && el.value.trim() !== '');
    if (!good && ok) { el.focus(); ok = false; }
  });
  return ok;
}
const notEmpty = v => v.length > 1;
const isPhone = v => /^[0-9+\s-]{10,15}$/.test(v);
const isMail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

document.addEventListener('submit', e => {
  if(e.target.id === 'enqForm') {
    e.preventDefault();
    const ok = validate(e.target, [
      { sel: '#e-parent', test: notEmpty }, { sel: '#e-child', test: notEmpty },
      { sel: '#e-phone', test: isPhone }, { sel: '#e-mail', test: isMail },
      { sel: '#e-grade', test: notEmpty }
    ]);
    if (!ok) { toast('Check the highlighted fields|Two or three details are still missing.', 'warn'); return; }
    const d = new Date();
    db.enquiries.unshift({
      id: Date.now(), parent: $('#e-parent').value.trim(), child: $('#e-child').value.trim(),
      grade: $('#e-grade').value, phone: $('#e-phone').value.trim(), email: $('#e-mail').value.trim(),
      date: `${d.getFullYear()}-${d2(d.getMonth() + 1)}-${d2(d.getDate())}`, status: 'New',
      msg: $('#e-msg').value.trim() || '—'
    });
    e.target.reset();
    $$('#enqForm .field').forEach(f => f.classList.remove('ok', 'bad'));
    openModal(`
      <div class="mhead" style="text-align:center;padding-top:34px">
        <div style="width:76px;height:76px;border-radius:50%;background:#E8F5E9;color:#2E7D32;display:grid;place-items:center;margin:0 auto 1rem">
          <svg class="i i-32"><use href="#ic-check"/></svg></div>
        <h3 id="modalTitle">Your enquiry is with the office</h3>
      </div>
      <div class="mbody" style="text-align:center">
        <p style="color:var(--ink-70)">Someone from admissions will call you on the number you gave, usually the same working day. If you would rather not wait, the office is on <b>+91 44 2855 3400</b>.</p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:1.4rem;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" type="button" data-visit>Book a campus visit too</button>
          <button class="btn btn-soft btn-sm" type="button" data-close-modal>Close</button>
        </div>
      </div>`);
    toast('Enquiry received|It now shows in the admin dashboard.');
  }
  else if(e.target.id === 'ctForm') {
    e.preventDefault();
    const ok = validate(e.target, [
      { sel: '#c-name', test: notEmpty }, { sel: '#c-phone', test: isPhone }, { sel: '#c-msg', test: notEmpty }
    ]);
    if (!ok) { toast('Check the highlighted fields|The office needs a name, number and message.', 'warn'); return; }
    e.target.reset();
    $$('#ctForm .field').forEach(f => f.classList.remove('ok', 'bad'));
    toast('Message sent to the office|Someone will reply within one working day.');
  }
  else if(e.target.id === 'visitForm') {
    e.preventDefault();
    const ok = validate(e.target, [
      { sel: '#v-name', test: notEmpty }, { sel: '#v-phone', test: isPhone }, { sel: '#v-date', test: notEmpty }
    ]);
    if (!ok) { toast('A few details are missing|Name, number and a date, please.', 'warn'); return; }
    const when = $('#v-date').value, slot = $('#v-slot').value;
    const d3 = new Date();
    db.enquiries.unshift({
      id: Date.now(), parent: $('#v-name').value.trim(), child: '—', grade: 'Not stated',
      phone: $('#v-phone').value.trim(), email: '',
      date: `${d3.getFullYear()}-${d2(d3.getMonth() + 1)}-${d2(d3.getDate())}`, status: 'Visit booked',
      msg: 'Campus tour requested for ' + fmt(when) + ', ' + slot + ' slot.'
    });
    closeModal();
    toast('Visit requested|' + fmt(when) + ' at ' + slot + '. The office will confirm by phone.');
  }
});

/* schedule a visit */
document.addEventListener('click', e => {
  if (!e.target.closest('[data-visit]')) return;
  openModal(`
    <div class="mhead"><h3 id="modalTitle">Schedule a campus visit</h3>
      <p class="small" style="color:var(--ink-50);margin-top:.4rem">Tours run at 10:00 am and 2:00 pm, Monday to Friday. A teacher walks with you; it takes about forty minutes.</p></div>
    <div class="mbody">
      <form id="visitForm" class="fgrid" style="margin-top:0">
        <div class="field"><label for="v-name">Your name</label><input id="v-name" required placeholder="Priya Raghavan" /><span class="err">Please enter your name.</span></div>
        <div class="field"><label for="v-phone">Phone</label><input id="v-phone" required placeholder="98400 00000" /><span class="err">Enter a 10-digit mobile number.</span></div>
        <div class="field"><label for="v-date">Preferred date</label><input id="v-date" type="date" required /><span class="err">Pick a date.</span></div>
        <div class="field"><label for="v-slot">Slot</label><select id="v-slot"><option>10:00 am</option><option>2:00 pm</option></select></div>
        <div class="field full"><button class="btn btn-primary" type="submit" style="width:100%">Request this visit</button></div>
      </form>
    </div>`);
});

/* ------------------------------------------------------------
   LOGIN
   ------------------------------------------------------------ */
function openLogin() {
  const l = $('#login'); if(!l) return;
  l.classList.add('open'); document.body.classList.add('locked');
  $('#forgotPane').style.display = 'none'; $('#loginForm').style.display = 'grid';
  setTimeout(() => $('#l-user').focus(), 80);
}
function closeLogin() {
  const l = $('#login'); if(!l) return;
  l.classList.remove('open');
  const a = $('#admin');
  if (!a || !a.classList.contains('open')) document.body.classList.remove('locked');
}
document.addEventListener('click', e => {
  if (e.target.closest('.login-open') || e.target.closest('.tb-login-js')) { e.preventDefault(); closeDrawer(); openLogin(); }
  if (e.target.closest('[data-close-login]')) closeLogin();
  if (e.target.closest('#pwToggle')) {
    const i = $('#l-pass'), show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    $('#pwToggle').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  }
  if (e.target.closest('#forgotBtn')) { $('#loginForm').style.display = 'none'; $('#forgotPane').style.display = 'block'; $('#f-mail').focus(); }
  if (e.target.closest('#backToLogin')) { $('#forgotPane').style.display = 'none'; $('#loginForm').style.display = 'grid'; }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'forgotForm') {
    e.preventDefault();
    if (!isMail($('#f-mail').value.trim())) { toast('Check the email address|It needs to be the address on your staff record.', 'warn'); return; }
    toast('Reset link sent|Check your inbox in the next few minutes.');
    $('#backToLogin').click();
  }
  else if (e.target.id === 'loginForm') {
    e.preventDefault();
    const u = $('#l-user').value.trim(), p = $('#l-pass').value;
    const ok = validate(e.target, [{ sel: '#l-user', test: notEmpty }, { sel: '#l-pass', test: v => v.length > 0 }]);
    if (!ok) { toast('Enter your username and password|Demo access: admin / christina.', 'warn'); return; }
    const validUsers = ['admin', 'admin@christinaschool.in'];
    const validPass = ['christina', 'admin'];
    if (validUsers.includes(u.toLowerCase()) && validPass.includes(p)) {
      closeLogin(); e.target.reset();
      $$('#loginForm .field').forEach(f => f.classList.remove('ok', 'bad'));
      window.location.href = 'admin-dashboard.html';
    } else {
      $('#l-pass').closest('.field').classList.add('bad');
      toast('Invalid credentials|Use admin / christina for this demo.', 'warn');
    }
  }
});

/* ------------------------------------------------------------
   ANNOUNCEMENT POP-UP DIALOG
   ------------------------------------------------------------ */
function findActivePopupAnnouncement() {
  if (!db.ann) return null;
  const now = new Date().toISOString();
  const list = db.ann.filter(a => a.status === 'published');
  // 1. Time-scheduled announcement whose window includes now
  const timed = list.find(a => {
    if (!a.startDate && !a.endDate) return false;
    const s = a.startDate || '1970-01-01';
    const e = a.endDate || '2099-12-31';
    return now >= s && now <= e;
  });
  if (timed) return timed;
  // 2. Pinned announcement with valid expiry
  const pinned = list.find(a => a.pinned && (!a.expiry || now.slice(0, 10) <= a.expiry));
  if (pinned) return pinned;
  // 3. Fallback active announcement
  return list.find(a => typeof isAnnActive === 'function' ? isAnnActive(a) : true);
}

function showAnnouncementDialog(ann) {
  if (!ann) return;
  const veil = $('#annDialogVeil');
  const title = $('#annDialogTitle');
  const text = $('#annDialogText');
  const cat = $('#annDialogCat');
  const dates = $('#annDialogDates');
  const sch = $('#annDialogSchedule');
  
  if (!veil || !title) return;
  
  title.textContent = ann.title;
  if (text) text.textContent = ann.text || (ann.body ? ann.body.slice(0, 180) + '...' : '');
  
  if (cat) {
    cat.textContent = ann.cat;
    const catStyle = (CATS && CATS[ann.cat]) ? CATS[ann.cat] : { c: '#FF7A1A', bg: '#FFF3E0' };
    cat.style.setProperty('--cat', catStyle.c);
    cat.style.setProperty('--catbg', catStyle.bg);
  }
  
  if (dates && sch) {
    if (ann.startDate || ann.endDate) {
      sch.style.display = 'inline-flex';
      const s = ann.startDate ? fmt(ann.startDate.slice(0, 10)) : 'Active now';
      const e = ann.endDate ? fmt(ann.endDate.slice(0, 10)) : 'Ongoing';
      dates.textContent = `Valid: ${s} to ${e}`;
    } else if (ann.expiry) {
      sch.style.display = 'inline-flex';
      dates.textContent = `Active until ${fmt(ann.expiry)}`;
    } else {
      sch.style.display = 'none';
    }
  }

  // Routing option button:
  const actionBtn = $('#annDialogAction');
  if (actionBtn) {
    actionBtn.onclick = () => {
      closeAnnouncementDialog();
      window.Router.go('announcements');
      setTimeout(() => {
        const full = db.ann.find(x => x.id === ann.id);
        if (full) {
          openModal(`
            <div class="mhead">
              <span class="cat" style="--cat:${CATS[full.cat].c};--catbg:${CATS[full.cat].bg}">${esc(full.cat)}</span>
              <h3 id="modalTitle" style="margin-top:.7rem">${esc(full.title)}</h3>
              <p class="small" style="color:var(--ink-50);margin-top:.4rem">Posted ${fmt(full.date)}${full.expiry ? ' · Shown until ' + fmt(full.expiry) : ''}</p>
            </div>
            <div class="mbody">
              ${full.body.split('\n\n').map(p => `<p style="color:var(--ink-70);margin-bottom:.9rem">${esc(p)}</p>`).join('')}
              <div style="display:flex;gap:10px;margin-top:.6rem;flex-wrap:wrap">
                <button class="btn btn-soft btn-sm" type="button" data-toast="Notice copied.|Paste it into a message to another parent.">Copy this notice</button>
                <button class="btn btn-navy btn-sm" type="button" data-close-modal>Done</button>
              </div>
            </div>`);
        }
      }, 300);
    };
  }

  veil.classList.add('show');
  veil.setAttribute('aria-hidden', 'false');
  document.body.classList.add('locked');
}

function closeAnnouncementDialog() {
  const veil = $('#annDialogVeil');
  if (veil) {
    veil.classList.remove('show');
    veil.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('locked');
}

document.addEventListener('click', e => {
  if (e.target.closest('#annDialogClose') || e.target.closest('#annDialogX') || e.target === $('#annDialogVeil')) {
    const activeAnn = findActivePopupAnnouncement();
    if (activeAnn) sessionStorage.setItem('ann_dismissed_' + activeAnn.id, '1');
    closeAnnouncementDialog();
  }
});

/* ------------------------------------------------------------
   ROUTER AND BOOT
   ------------------------------------------------------------ */
function initHome() {
  mountScenes(); watch(); bindTilt();
  const hero = $('.hero');
  if (hero) setTimeout(() => hero.classList.add('go'), 30);
  $$('.hero [data-count], .stats [data-count]').forEach(c => {
    c.dataset.done = '1';
    setTimeout(() => countUp(c), 150);
  });
  
  // 1. Update Announcement Pill in marked hero area with latest notice from db
  const annTitle = $('#heroAnnTitle');
  const activeAnn = findActivePopupAnnouncement();
  if (annTitle && activeAnn) {
    annTitle.textContent = activeAnn.title + (activeAnn.date ? ' — ' + fmt(activeAnn.date) : '');
  }

  // 2. Automatically show Announcement Dialog on home landing if active and not dismissed
  if (activeAnn && !sessionStorage.getItem('ann_dismissed_' + activeAnn.id)) {
    setTimeout(() => {
      showAnnouncementDialog(activeAnn);
    }, 600);
  }

  // Allow clicking announcement pill in hero to view the dialog
  const annPill = $('#heroAnnPill');
  if (annPill && activeAnn) {
    annPill.onclick = e => {
      e.preventDefault();
      showAnnouncementDialog(activeAnn);
    };
  }

  // 3. Populate Upcoming Events on home page
  const hEv = $('#homeEventsList');
  if (hEv && db.events && db.events.length) {
    hEv.innerHTML = db.events.slice(0, 3).map(e => `
      <div style="display:flex;gap:14px;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--ink-10)">
        <div style="background:#E7F1FF;color:#1D4ED8;padding:8px 14px;border-radius:10px;text-align:center;font-weight:700">
          <span style="font-size:.72rem;display:block">${monOf(e.date)}</span>
          <span style="font-size:1.2rem">${dayOf(e.date)}</span>
        </div>
        <div>
          <b style="font-size:.96rem;display:block">${esc(e.title)}</b>
          <span class="small" style="color:var(--ink-50)">${esc(e.time || '')}${e.time && e.loc ? ' · ' : ''}${esc(e.loc || '')}</span>
        </div>
      </div>`).join('');
  }

  // 4. Populate Faculty Spotlight on home page
  const hFac = $('#homeFacultyGrid');
  if (hFac && db.staff && db.staff.length) {
    hFac.innerHTML = db.staff.slice(0, 4).map(s => `
      <article class="staff-card tilt rv" data-staff="${s.id}" tabindex="0" role="button" aria-label="View profile of ${esc(s.name)}">
        <div class="pic"><div class="ph">${staffPic ? staffPic(s) : avatar(s.name, 's'+s.id)}</div><span class="dept">${esc(s.dept)}</span></div>
        <div class="body">
          <h3>${esc(s.name)}</h3>
          <p class="desig">${esc(s.desig)}</p>
          <div class="meta"><span>${esc(s.qual)}</span><span>${s.exp} years teaching · ${esc(s.classes)}</span></div>
          <span class="view">View profile <svg class="i i-16 ico"><use href="#ic-arrow-r"/></svg></span>
        </div>
      </article>`).join('');
    bindTilt(hFac);
    watch(hFac);
  }

  // 5. Populate Parent Reviews on home page
  const hTst = $('#tstTrackHome');
  if (hTst && db.testimonials && db.testimonials.length) {
    hTst.innerHTML = db.testimonials.slice(0, 3).map(t => `
      <div class="tst"><div class="tst-in">
        <div class="av">${avatar(t.name, 'p' + t.id)}</div>
        <div>
          <span class="quote-mark" aria-hidden="true">&ldquo;</span>
          <blockquote>${esc(t.text)}</blockquote>
          <p class="by"><b>${esc(t.name)}</b> <span>— ${esc(t.child)}</span></p>
        </div>
      </div></div>`).join('');
  }

  // 6. Populate News Dispatches on home page
  const hNews = $('#homeNewsGrid');
  if (hNews && db.news && db.news.length) {
    hNews.innerHTML = db.news.slice(0, 3).map((n, i) => `
      <article class="preview-card rv" data-d="${i % 3}">
        <span class="small" style="color:var(--ink-50)">${fmt(n.date)} · ${esc(n.by)}</span>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.text)}</p>
        <button class="btn btn-soft btn-sm" type="button" data-goto="#/news">Read story &rarr;</button>
      </article>`).join('');
    watch(hNews);
  }
}

function initAbout() {
  mountScenes(); watch(); bindTilt();
  $$('#vmv button').forEach(btn => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      $$('#vmv button').forEach(b => b.setAttribute('aria-expanded', 'false'));
      $$('#vmv .panel').forEach(p => p.classList.remove('open'));
      if (!open) { btn.setAttribute('aria-expanded', 'true'); btn.nextElementSibling.classList.add('open'); }
    });
  });
}

function initAcademics() {
  renderGrades(); movePill(); mountScenes(); watch();
}

function initStaff() {
  renderDeptChips(); renderStaff(); watch(); bindTilt();
}

function initActivities() {
  renderClubs(); renderSports(); renderAch(); mountScenes(); watch();
}

function initAnnouncements() {
  renderAnnChips(); renderPinned(); renderAnn(); renderEvents(); mountScenes(); watch();
}

function initGallery() {
  renderGalChips(); renderGallery(); mountScenes(); watch();
}

function initDocuments() {
  renderDocChips(); renderDocs(); watch();
}

function initAdmissions() {
  mountScenes(); watch();
}

function initContact() {
  mountScenes(); watch();
}

function initTestimonials() {
  renderTst(); resetTst(); watch();
}

let newsCat = 'All', newsQuery = '';
function renderFilteredNews() {
  const ng = $('#newsGrid'); if(!ng) return;
  const list = db.news
    .filter(n => newsCat === 'All' || (n.theme && n.theme.toLowerCase().includes(newsCat.toLowerCase())) || (n.by && n.by.toLowerCase().includes(newsCat.toLowerCase())) || (n.title && n.title.toLowerCase().includes(newsCat.toLowerCase())))
    .filter(n => !newsQuery || (n.title + ' ' + n.text + ' ' + n.by).toLowerCase().includes(newsQuery));
    
  ng.innerHTML = list.length ? list.map((n, i) => `
    <article class="news zoom rv" data-d="${i % 3}">
      <div class="ph" data-scene="${n.theme}" data-alt="${esc(n.title)}"></div>
      <div class="nb">
        <span class="dt">${fmt(n.date)} · ${esc(n.by)}</span>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.text)}</p>
        <button class="link-a" type="button" data-toast="Full story opens in the live site.|${esc(n.title)}">Read the update <svg class="i i-16 ico"><use href="#ic-arrow-r"/></svg></button>
      </div>
    </article>`).join('')
    : `<div class="empty" style="grid-column:1/-1"><b>No stories match your filter</b>
        Try clearing your search term or select "All Stories".</div>`;
  mountScenes(ng);
  watch(ng);
}

function initNews() {
  renderFilteredNews();
  mountScenes();
  watch();
  
  // Bind category chips
  const chips = $('#newsChips');
  if (chips) {
    chips.addEventListener('click', e => {
      const b = e.target.closest('[data-ncat]');
      if (!b) return;
      newsCat = b.dataset.ncat;
      $$('#newsChips button').forEach(x => x.classList.toggle('active', x === b));
      renderFilteredNews();
    });
  }
  
  // Bind search input
  const sBox = $('#newsSearch');
  if (sBox) {
    sBox.addEventListener('input', e => {
      newsQuery = e.target.value.trim().toLowerCase();
      renderFilteredNews();
    });
  }
}

const router = window.Router.init({
  container: '#app',
  routes: {
    'home':          { page: 'pages/main-home.html', onLoad: initHome },
    'about':         { page: 'pages/main-about.html', onLoad: initAbout },
    'why':           { page: 'pages/main-about.html', onLoad: initAbout },
    'academics':     { page: 'pages/main-academics.html', onLoad: initAcademics },
    'campus':        { page: 'pages/main-academics.html', onLoad: initAcademics },
    'staff':         { page: 'pages/main-staff.html', onLoad: initStaff },
    'activities':    { page: 'pages/main-activities.html', onLoad: initActivities },
    'life':          { page: 'pages/main-activities.html', onLoad: initActivities },
    'sports':        { page: 'pages/main-activities.html', onLoad: initActivities },
    'achievements':  { page: 'pages/main-activities.html', onLoad: initActivities },
    'announcements': { page: 'pages/main-announcements.html', onLoad: initAnnouncements },
    'events':        { page: 'pages/main-announcements.html', onLoad: initAnnouncements },
    'gallery':       { page: 'pages/main-gallery.html', onLoad: initGallery },
    'documents':     { page: 'pages/main-documents.html', onLoad: initDocuments },
    'admissions':    { page: 'pages/main-admissions.html', onLoad: initAdmissions },
    'contact':       { page: 'pages/main-contact.html', onLoad: initContact },
    'testimonials':  { page: 'pages/main-testimonials.html', onLoad: initTestimonials },
    'voices':        { page: 'pages/main-testimonials.html', onLoad: initTestimonials },
    'news':          { page: 'pages/main-news.html', onLoad: initNews }
  },
  onRouteChange: function(hash, route) {
    updateActiveNav(hash);
    closeDrawer();
  }
});

// Boot
const yr = document.getElementById('yr');
if(yr) yr.textContent = new Date().getFullYear();
if (sortStores) sortStores();
renderTicker();
onScroll();

})();
