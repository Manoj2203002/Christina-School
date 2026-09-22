# Christina School — Design System Reference

## School Info
- **Name**: Christina School
- **Tagline**: "Where Curiosity Meets Confidence"
- **Grades**: 1–8 (Lower School 1–4, Middle School 5–8)
- **Address**: 125 Greenfield Avenue, Maplewood, NJ 07040
- **Phone**: (973) 555-0142
- **Email**: info@christinaschool.edu

---

## Color Tokens (CSS Custom Properties)

```css
:root {
  --navy-900: #0A192F;
  --navy-800: #132238;
  --royal-600: #1D4ED8;
  --royal-700: #1E40AF;
  --sky-500: #0284C7;
  --sky-100: #E0F2FE;
  --sky-50: #F0F9FF;
  --white: #FFFFFF;
  --slate-50: #F8FAFC;
  --orange-500: #FF5E1E;
  --orange-600: #EA580C;
  --orange-700: #C2410C;
  --orange-100: #FFEDD5;
  --orange-50: #FFF7ED;
  --orange-200: #FED7AA;
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
  --success-500: #059669;
  --success-50: #ECFDF5;
  --error-500: #DC2626;
  --error-50: #FEF2F2;
  --warning-500: #D97706;
  --warning-50: #FFFBEB;
  --info-500: #2563EB;
  --info-50: #EFF6FF;
}
```

60-30-10 rule: 60% white/slate-50, 30% navy/royal, 10% orange accents.

---

## Typography

```css
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

:root {
  --font-serif: 'Newsreader', Georgia, serif;
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}
```

| Class | Size | Font | Weight | Line Height | Letter Spacing |
|-------|------|------|--------|-------------|----------------|
| .heading-display | clamp(2.5rem, 5vw+1rem, 4.25rem) | serif | 700 | 1.08 | -0.025em |
| .heading-1 | clamp(2rem, 3.5vw+0.5rem, 3rem) | serif | 600 | 1.15 | -0.02em |
| .heading-2 | clamp(1.5rem, 2vw+0.5rem, 2.125rem) | serif | 600 | 1.25 | -0.015em |
| .heading-3 | 1.25rem | sans | 700 | 1.35 | -0.01em |
| .heading-4 | 1.125rem | sans | 600 | 1.4 | -0.01em |
| .text-lead | clamp(1.125rem, 1vw+0.5rem, 1.375rem) | sans | 400 | 1.6 | 0 |
| .text-body | 1rem | sans | 400 | 1.6 | 0 |
| .text-small | 0.875rem | sans | 500 | 1.5 | 0.01em |
| .text-caption | 0.75rem | sans | 500 | 1.4 | 0.01em |
| .eyebrow | 0.75rem | sans | 700 | 1.4 | 0.08em (uppercase) |

---

## Spacing

```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
  --space-24: 6rem;    /* 96px */
  --space-32: 8rem;    /* 128px */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## CSS Class Inventory

### Layout
- `.container` — max-width: 1200px; margin: 0 auto; padding: 0 var(--space-6);
- `.section` — padding: var(--space-24) 0; (mobile: var(--space-16) 0)
- `.section--dark` — bg navy-900, text white
- `.section--alt` — bg slate-50
- `.section--navy` — bg navy-800, text white
- `.section--orange-tint` — bg orange-50
- `.grid` — display: grid; gap: var(--space-8);
- `.grid--2` — grid-template-columns: repeat(2, 1fr); (mobile: 1fr)
- `.grid--3` — grid-template-columns: repeat(3, 1fr); (tablet: 2, mobile: 1)
- `.grid--4` — grid-template-columns: repeat(4, 1fr); (tablet: 2, mobile: 1)
- `.split` — display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-12); align-items: center; (mobile: 1 column)
- `.split--reverse` — reverses column order on desktop (image first visually)
- `.split--55-45` — 55% / 45% split
- `.flex` — display: flex; gap: var(--space-4);
- `.flex--center` — align-items: center; justify-content: center;
- `.flex--between` — justify-content: space-between; align-items: center;
- `.flex--column` — flex-direction: column;
- `.flex--wrap` — flex-wrap: wrap;

### Typography
- `.heading-display` through `.heading-4` — see table above
- `.text-lead`, `.text-body`, `.text-small`, `.text-caption`
- `.eyebrow` — uppercase, tracking, small, bold
- `.text-center`, `.text-left`, `.text-right`
- `.text-white`, `.text-navy`, `.text-royal`, `.text-orange`, `.text-gray`
- `.text-balance` — text-wrap: balance;

### Buttons
- `.btn` — base button styles (padding, border-radius, font, transition)
- `.btn--primary` — bg orange-500, text white, hover orange-600
- `.btn--secondary` — bg navy-900, text white, hover navy-800
- `.btn--outline` — border navy-900, text navy-900, hover filled
- `.btn--outline-white` — border white, text white, hover filled white
- `.btn--ghost` — no border, text royal-600, hover bg sky-50
- `.btn--sm` — smaller padding/font
- `.btn--lg` — larger padding/font
- `.btn--icon` — icon-only button (square)
- `.btn--loading` — shows spinner, disables

### Cards
- `.card` — bg white, border-radius-lg, shadow-sm, overflow hidden
- `.card--hover` — adds hover lift + shadow transition
- `.card__image` — top image container with object-fit cover
- `.card__body` — padding inside card
- `.card__title` — card heading
- `.card__text` — card body text
- `.card__meta` — date, category, etc (gray, small)
- `.card__footer` — bottom section with actions
- `.card--horizontal` — image left, content right (on desktop)
- `.card--featured` — larger, spans 2 columns

### Badges & Tags
- `.badge` — small rounded pill
- `.badge--primary` — bg royal-600, text white
- `.badge--success` — bg success
- `.badge--warning` — bg warning
- `.badge--danger` — bg error
- `.badge--info` — bg info
- `.badge--orange` — bg orange-500
- `.badge--outline` — bordered, no fill
- `.tag` — clickable filter tag
- `.tag--active` — active state (filled)

### Form Elements
- `.form-group` — margin-bottom var(--space-6)
- `.form-label` — font 500, mb space-2, display block
- `.form-input` — full width input, border gray-300, focus border royal-600
- `.form-textarea` — textarea with same styling
- `.form-select` — styled select dropdown
- `.form-checkbox`, `.form-radio` — custom styled
- `.form-error` — red error text below input
- `.form-hint` — gray hint text below input
- `.form-row` — horizontal layout for side-by-side fields
- `.form-actions` — flex row for save/cancel buttons
- `.input-icon` — wrapper for input with icon
- `.required-star` — red asterisk after label

### Avatar
- `.avatar` — 40px circle, object-fit cover
- `.avatar--sm` — 32px
- `.avatar--lg` — 64px
- `.avatar--xl` — 96px

### Stats
- `.stat-card` — number + label card
- `.stat-card__number` — large bold number
- `.stat-card__label` — small gray label
- `.stat-card__icon` — icon container
- `.stat-card--navy`, `--royal`, `--orange`, `--sky` — colored variants

### Empty States
- `.empty-state` — centered container
- `.empty-state__icon` — large icon/illustration
- `.empty-state__title` — "No items yet"
- `.empty-state__text` — description
- `.empty-state__action` — CTA button

### Skeleton Loaders
- `.skeleton` — animated placeholder
- `.skeleton--text` — text line placeholder
- `.skeleton--card` — card placeholder
- `.skeleton--avatar` — circle placeholder
- `.skeleton--image` — rectangle placeholder

### Tables (Admin)
- `.data-table` — full width table
- `.data-table__header` — sticky header row
- `.data-table__row` — table row with hover
- `.data-table__cell` — cell with padding
- `.data-table__actions` — action buttons cell
- `.data-table--responsive` — horizontal scroll wrapper on mobile

---

## Navigation Structure

### Top Bar (`.top-bar`)
```
Phone: (973) 555-0142 | Email: info@christinaschool.edu | [Facebook] [Instagram] [Twitter] [YouTube]
```

### Main Header (`.header`)
```
[Logo: Christina School] | Home | About | Academics | Campus Life▾ | Achievements | Admissions | News & Events▾ | Gallery | Contact | [Apply Now]
```

**Campus Life dropdown**: Student Life, Activities, Sports
**News & Events dropdown**: News, Announcements, Events

### Mobile: Hamburger → slide-out drawer with accordion items

### Footer (`.footer`)
```
Col 1: Logo + About text + Social icons
Col 2: Quick Links (Home, About, Academics, Staff, Gallery, Contact)
Col 3: Academics (Lower School, Middle School, Activities, Sports, Achievements)
Col 4: Contact Info (Address, Phone, Email, Hours)
Bottom bar: © 2026 Christina School | Privacy Policy | Terms of Use
```

---

## Page Templates

### Public Page HTML Boilerplate
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Page Title] — Christina School</title>
  <link rel="stylesheet" href="../css/variables.css">
  <link rel="stylesheet" href="../css/reset.css">
  <link rel="stylesheet" href="../css/global.css">
  <link rel="stylesheet" href="../css/components.css">
  <link rel="stylesheet" href="../css/navigation.css">
  <link rel="stylesheet" href="../css/modals.css">
  <link rel="stylesheet" href="../css/pages.css">
  <link rel="stylesheet" href="../css/responsive.css">
</head>
<body>
  <!-- Top Bar -->
  <!-- Header/Nav -->
  <!-- Page Hero / Breadcrumb -->
  <!-- Page Content -->
  <!-- Footer -->
  <script src="../js/app.js" defer></script>
  <script src="../js/navigation.js" defer></script>
  <script src="../js/animations.js" defer></script>
  <script src="../js/modals.js" defer></script>
  <script src="../js/toast.js" defer></script>
  <script src="../js/forms.js" defer></script>
</body>
</html>
```

**Note:** For index.html (root), CSS/JS paths have NO `../` prefix (e.g. `css/variables.css`, `js/app.js`).

### Admin Page HTML Boilerplate
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Page Title] — Christina School Admin</title>
  <link rel="stylesheet" href="../css/variables.css">
  <link rel="stylesheet" href="../css/reset.css">
  <link rel="stylesheet" href="../css/global.css">
  <link rel="stylesheet" href="../css/components.css">
  <link rel="stylesheet" href="../css/navigation.css">
  <link rel="stylesheet" href="../css/modals.css">
  <link rel="stylesheet" href="../css/pages.css">
  <link rel="stylesheet" href="../css/admin.css">
  <link rel="stylesheet" href="../css/responsive.css">
</head>
<body class="admin-body">
  <div class="admin-layout">
    <aside class="admin-sidebar"><!-- Nav --></aside>
    <main class="admin-main">
      <header class="admin-topbar"><!-- Search, Notifications, Profile --></header>
      <div class="admin-content">
        <!-- Page Content + Modals -->
      </div>
    </main>
  </div>
  <script src="../js/data-store.js" defer></script>
  <script src="../js/modals.js" defer></script>
  <script src="../js/toast.js" defer></script>
  <script src="../js/forms.js" defer></script>
  <script src="../js/admin-[module].js" defer></script>
</body>
</html>
```

---

## Admin Sidebar Navigation
```
Dashboard        → admin/dashboard.html
Staff            → admin/staff.html
Announcements    → admin/announcements.html
Gallery          → admin/gallery.html
Events           → admin/events.html
Achievements     → admin/achievements.html
News             → admin/news.html
Admissions       → admin/admissions.html
Settings         → admin/settings.html
─────────────
View Website     → ../index.html
Logout           → admin/login.html
```

---

## JavaScript APIs

### DataStore (js/data-store.js)
```javascript
// Loads sample data from data/sample-data.json on first run, then uses localStorage
const DataStore = {
  async init(),                              // Load sample data if localStorage empty
  getAll(collection),                        // Returns array
  getById(collection, id),                   // Returns item or null
  create(collection, item),                  // Returns item with generated id
  update(collection, id, updates),           // Returns updated item
  delete(collection, id),                    // Returns boolean
  getSettings(),                             // Returns settings object
  updateSettings(updates),                   // Returns updated settings
  getStats(),                                // Returns { staffCount, announcementCount, ... }
  clearAll(),                                // Reset to sample data
  _save(collection),                         // Internal: persist to localStorage
  _generateId(),                             // Internal: generate unique ID
};
// Collections: 'staff', 'announcements', 'gallery', 'events', 'achievements', 'news', 'admissions'
```

### Modal (js/modals.js)
```javascript
const Modal = {
  open(modalId),       // Add .modal--active, lock body scroll, trap focus
  close(modalId),      // Remove .modal--active, restore scroll
  closeAll(),          // Close all open modals
  init(),              // Setup backdrop click + ESC handlers
};
// HTML: <div class="modal" id="staffModal">
//         <div class="modal__backdrop"></div>
//         <div class="modal__container">
//           <div class="modal__header">...</div>
//           <div class="modal__body">...</div>
//           <div class="modal__footer">...</div>
//         </div>
//       </div>
```

### Toast (js/toast.js)
```javascript
const Toast = {
  show({ message, type = 'success', duration = 3000 }),
  // Types: 'success', 'error', 'warning', 'info'
  // Auto-creates .toast-container if not exists
};
```

### FormValidator (js/forms.js)
```javascript
const FormValidator = {
  validate(formElement),      // Returns { isValid, errors }
  showErrors(formElement, errors),
  clearErrors(formElement),
  resetForm(formElement),
};
// Uses data attributes: data-required, data-type="email|phone|number", data-min, data-max
```

### ScrollReveal (js/animations.js)
```javascript
// Auto-initializes on elements with [data-animate] attribute
// data-animate="fade-up|fade-in|slide-left|slide-right|scale"
// data-delay="100" (optional ms delay)
// data-duration="600" (optional ms duration)
// Respects prefers-reduced-motion
```

---

## Placeholder Images

| Key | URL | Use |
|-----|-----|-----|
| hero | https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1400&q=80 | Hero, main visuals |
| stem | https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80 | STEM, science |
| writing | https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80 | Literacy, classroom |
| science | https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1200&q=80 | Science lab |
| library | https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80 | Library, books |
| community | https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80 | Students, community |
| campus | https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80 | Campus, building |
| arts | https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80 | Arts, creative |
| sports | https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?auto=format&fit=crop&w=1200&q=80 | Sports, athletics |
| playground | https://images.unsplash.com/photo-1544776193-352d25ca82cd?auto=format&fit=crop&w=1200&q=80 | Play, outdoor |
| graduation | https://images.unsplash.com/photo-1523050854058-8df90110c476?auto=format&fit=crop&w=1200&q=80 | Achievement |
| teacher | https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80 | Staff profile |

Staff avatars: `https://api.dicebear.com/7.x/lorelei/svg?seed=[Name]`
Student avatars: `https://api.dicebear.com/7.x/adventurer/svg?seed=[Name]`
