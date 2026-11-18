/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Phase 2 demo data
   Students, classes, attendance, homework, marks, timetable and
   leave for the teacher portal, the parent portal and the admin
   "School" screens. Kept apart from the website data (js/data.js):
   its own localStorage key, its own reset.
   Demo only — nothing here is sent anywhere.
   ============================================================ */
'use strict';
window.SchoolDB = (function () {

const KEY = 'christina_school_portal_v1';
const SESSION_KEY = 'christina_portal_session';

/* ---------- dates (local calendar dates as 'YYYY-MM-DD') ---------- */
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const todayISO = () => iso(new Date());
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmtDate = s => { if (!s) return ''; const d = parse(s); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
const fmtShort = s => { if (!s) return ''; const d = parse(s); return `${DAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MON[d.getMonth()]}`; };
const dayOfWeek = s => parse(s).getDay();

/* ---------- fixed values ---------- */
/* Attendance: present and late count as a full day, half day as half; absent and leave as not present. */
const STATUS = {
  P: { label: 'Present',  short: 'P', cls: 'p', value: 1 },
  A: { label: 'Absent',   short: 'A', cls: 'a', value: 0 },
  L: { label: 'Late',     short: 'L', cls: 'l', value: 1 },
  H: { label: 'Half day', short: 'H', cls: 'h', value: 0.5 },
  V: { label: 'On leave', short: 'LV', cls: 'v', value: 0 }
};
const STATUS_ORDER = ['P', 'A', 'L', 'H', 'V'];
const AUDIENCES = {
  public:   'Website (everyone)',
  parents:  'All parents',
  grade:    'One grade',
  section:  'One class',
  teachers: 'Teachers'
};
const REMARK_TYPES = { appreciation: 'Appreciation', concern: 'Concern', general: 'General' };
const STUDENT_LEAVE_STATES = { sent: 'Sent', ack: 'Acknowledged', cancelled: 'Cancelled' };
const STAFF_LEAVE_STATES = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' };
const STAFF_LEAVE_TYPES = ['Casual leave', 'Sick leave', 'Earned leave', 'On duty'];

/* ---------- seeded random so the demo looks the same everywhere ---------- */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
   SEED
   ============================================================ */
function seed() {
  const R = rng(20262027);
  const pick = arr => arr[Math.floor(R() * arr.length)];
  const now = new Date();
  const Y = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const today = todayISO();
  const stamp = new Date().toISOString();

  const years = [
    { id: 'y1', name: `${Y}–${String(Y + 1).slice(2)}`, start: `${Y}-06-01`, end: `${Y + 1}-04-30`, current: true },
    { id: 'y2', name: `${Y + 1}–${String(Y + 2).slice(2)}`, start: `${Y + 1}-06-01`, end: `${Y + 2}-04-30`, current: false }
  ];

  const grades = [
    { id: 'g1', label: 'Nursery', stage: 'early', order: 1 },
    { id: 'g2', label: 'LKG',     stage: 'early', order: 2 },
    { id: 'g3', label: 'UKG',     stage: 'early', order: 3 },
    { id: 'g4', label: 'Grade 1', stage: 'primary', order: 4 },
    { id: 'g5', label: 'Grade 2', stage: 'primary', order: 5 },
    { id: 'g6', label: 'Grade 3', stage: 'primary', order: 6 },
    { id: 'g7', label: 'Grade 4', stage: 'primary', order: 7 },
    { id: 'g8', label: 'Grade 5', stage: 'primary', order: 8 }
  ];

  const subjects = [
    { id: 's1', name: 'English', order: 1, active: true },
    { id: 's2', name: 'Tamil', order: 2, active: true },
    { id: 's3', name: 'Mathematics', order: 3, active: true },
    { id: 's4', name: 'EVS', order: 4, active: true },
    { id: 's5', name: 'Science', order: 5, active: true },
    { id: 's6', name: 'Social Studies', order: 6, active: true },
    { id: 's7', name: 'Computer', order: 7, active: true },
    { id: 's8', name: 'Art & Craft', order: 8, active: true }
  ];

  const teachers = [
    { id: 't1',  name: 'Ms. Priya Raman',     designation: 'Primary teacher',   department: 'Languages',          phone: '94430 11201', email: 'priya.raman@christinaschool.in' },
    { id: 't2',  name: 'Mr. Arun Kumar',      designation: 'Mathematics teacher', department: 'Mathematics',      phone: '94430 11202', email: 'arun.kumar@christinaschool.in' },
    { id: 't3',  name: 'Ms. Kavitha Sundar',  designation: 'Science teacher',   department: 'Science',            phone: '94430 11203', email: 'kavitha.sundar@christinaschool.in' },
    { id: 't4',  name: 'Ms. Meena Joseph',    designation: 'Tamil teacher',     department: 'Languages',          phone: '94430 11204', email: 'meena.joseph@christinaschool.in' },
    { id: 't5',  name: 'Mr. Joseph Mathew',   designation: 'Computer teacher',  department: 'Computer science',   phone: '94430 11205', email: 'joseph.mathew@christinaschool.in' },
    { id: 't6',  name: 'Ms. Anitha Paul',     designation: 'Primary teacher',   department: 'Primary years',      phone: '94430 11206', email: 'anitha.paul@christinaschool.in' },
    { id: 't7',  name: 'Ms. Revathi Mohan',   designation: 'Primary teacher',   department: 'Primary years',      phone: '94430 11207', email: 'revathi.mohan@christinaschool.in' },
    { id: 't8',  name: 'Ms. Sangeetha Ravi',  designation: 'Early years teacher', department: 'Primary years',    phone: '94430 11208', email: 'sangeetha.ravi@christinaschool.in' },
    { id: 't9',  name: 'Ms. Lakshmi Narayan', designation: 'Early years teacher', department: 'Primary years',    phone: '94430 11209', email: 'lakshmi.narayan@christinaschool.in' },
    { id: 't10', name: 'Ms. Deepa Varghese',  designation: 'Early years teacher', department: 'Primary years',    phone: '94430 11210', email: 'deepa.varghese@christinaschool.in' }
  ];

  const sections = [
    { id: 'c1', yearId: 'y1', gradeId: 'g1', name: 'A', classTeacherId: 't8',  room: 'Sunflower room' },
    { id: 'c2', yearId: 'y1', gradeId: 'g2', name: 'A', classTeacherId: 't9',  room: 'Rainbow room' },
    { id: 'c3', yearId: 'y1', gradeId: 'g3', name: 'A', classTeacherId: 't10', room: 'Butterfly room' },
    { id: 'c4', yearId: 'y1', gradeId: 'g4', name: 'A', classTeacherId: 't6',  room: 'Room 101' },
    { id: 'c5', yearId: 'y1', gradeId: 'g5', name: 'A', classTeacherId: 't7',  room: 'Room 102' },
    { id: 'c6', yearId: 'y1', gradeId: 'g6', name: 'A', classTeacherId: 't1',  room: 'Room 201' },
    { id: 'c7', yearId: 'y1', gradeId: 'g6', name: 'B', classTeacherId: 't4',  room: 'Room 202' },
    { id: 'c8', yearId: 'y1', gradeId: 'g7', name: 'A', classTeacherId: 't2',  room: 'Room 203' },
    { id: 'c9', yearId: 'y1', gradeId: 'g8', name: 'A', classTeacherId: 't3',  room: 'Room 204' }
  ];

  /* Subjects per stage, the teacher for each, and periods per week (for the timetable). */
  const classSubjects = [];
  let csN = 0;
  const addCs = (sectionId, subjectId, teacherId, perWeek) =>
    classSubjects.push({ id: 'cs' + (++csN), sectionId, subjectId, teacherId, perWeek });
  sections.forEach(sec => {
    const g = grades.find(x => x.id === sec.gradeId);
    const ct = sec.classTeacherId;
    if (g.stage === 'early') {
      addCs(sec.id, 's1', ct, 8); addCs(sec.id, 's2', ct, 6); addCs(sec.id, 's3', ct, 8);
      addCs(sec.id, 's4', ct, 5); addCs(sec.id, 's8', ct, 5);
    } else if (g.order <= 5) {
      addCs(sec.id, 's1', ct, 9); addCs(sec.id, 's2', 't4', 6); addCs(sec.id, 's3', ct, 9);
      addCs(sec.id, 's4', ct, 7); addCs(sec.id, 's7', 't5', 3);
    } else {
      addCs(sec.id, 's1', 't1', 8); addCs(sec.id, 's2', 't4', 6); addCs(sec.id, 's3', 't2', 8);
      addCs(sec.id, 's5', 't3', 5); addCs(sec.id, 's6', 't3', 4); addCs(sec.id, 's7', 't5', 3);
    }
  });

  /* ---------- the school day ---------- */
  const periods = [
    { id: 'p1', yearId: 'y1', no: 1, start: '09:00', end: '09:40', isBreak: false, label: 'Period 1' },
    { id: 'p2', yearId: 'y1', no: 2, start: '09:40', end: '10:20', isBreak: false, label: 'Period 2' },
    { id: 'pb1', yearId: 'y1', no: 0, start: '10:20', end: '10:35', isBreak: true, label: 'Short break' },
    { id: 'p3', yearId: 'y1', no: 3, start: '10:35', end: '11:15', isBreak: false, label: 'Period 3' },
    { id: 'p4', yearId: 'y1', no: 4, start: '11:15', end: '11:55', isBreak: false, label: 'Period 4' },
    { id: 'pb2', yearId: 'y1', no: 0, start: '11:55', end: '12:35', isBreak: true, label: 'Lunch' },
    { id: 'p5', yearId: 'y1', no: 5, start: '12:35', end: '13:15', isBreak: false, label: 'Period 5' },
    { id: 'p6', yearId: 'y1', no: 6, start: '13:15', end: '13:55', isBreak: false, label: 'Period 6' },
    { id: 'p7', yearId: 'y1', no: 7, start: '13:55', end: '14:35', isBreak: false, label: 'Period 7' }
  ];

  /* Timetable: fill day by day, period by period, never putting a teacher in two rooms at once.
     A slot nobody can take becomes "Library / games" (no subject). */
  const timetable = [];
  let ttN = 0;
  const left = {};
  classSubjects.forEach(cs => { left[cs.id] = cs.perWeek; });
  for (let day = 1; day <= 6; day++) {
    periods.filter(p => !p.isBreak).forEach(p => {
      const busy = new Set();
      sections.forEach(sec => {
        const options = classSubjects
          .filter(cs => cs.sectionId === sec.id && left[cs.id] > 0 && !busy.has(cs.teacherId))
          .sort((a, b) => (left[b.id] - left[a.id]) || (R() - .5));
        const lastSame = timetable.filter(t => t.sectionId === sec.id && t.day === day).map(t => t.csId);
        // Spread each subject across the six days: at most its weekly count ÷ 6 (rounded up) per day,
        // and only if nothing else fits, a second period of the same subject.
        const usedToday = o => lastSame.filter(x => x === o.id).length;
        // A class has at most its weekly total ÷ 6 teaching periods a day, so free periods are spread too.
        const dayCap = Math.ceil(classSubjects.filter(cs => cs.sectionId === sec.id).reduce((a, cs) => a + cs.perWeek, 0) / 6);
        const full = lastSame.filter(Boolean).length >= dayCap;
        const choice = full ? null : (options.find(o => usedToday(o) < Math.ceil(o.perWeek / 6))
          || options.find(o => usedToday(o) < 2) || null);
        if (choice) { left[choice.id]--; busy.add(choice.teacherId); }
        timetable.push({ id: 'tt' + (++ttN), sectionId: sec.id, day, periodId: p.id, csId: choice ? choice.id : null });
      });
    });
  }

  /* ---------- holidays ---------- */
  const holidays = [
    { id: 'h1', date: `${Y}-08-15`, name: 'Independence Day' },
    { id: 'h2', date: `${Y}-09-05`, name: 'Teachers’ Day (celebration, no classes)' },
    { id: 'h3', date: `${Y}-10-02`, name: 'Gandhi Jayanti' },
    { id: 'h4', date: `${Y}-10-20`, name: 'Ayudha Pooja' },
    { id: 'h5', date: `${Y}-11-09`, name: 'Deepavali' },
    { id: 'h6', date: `${Y}-12-25`, name: 'Christmas' },
    { id: 'h7', date: `${Y + 1}-01-14`, name: 'Pongal' },
    { id: 'h8', date: `${Y + 1}-01-15`, name: 'Thiruvalluvar Day' },
    { id: 'h9', date: `${Y + 1}-01-26`, name: 'Republic Day' }
  ];
  const settings = { weeklyOff: [0], schoolName: 'Christina Nursery & Primary School' };
  const isHol = d => holidays.some(h => h.date === d);
  const isSchool = d => !settings.weeklyOff.includes(dayOfWeek(d)) && !isHol(d) && d >= years[0].start && d <= years[0].end;
  const prevSchoolDays = (from, n) => {
    const out = []; let d = from;
    while (out.length < n) { d = addDays(d, -1); if (isSchool(d)) out.push(d); if (d < years[0].start) break; }
    return out;
  };
  const nextSchoolDay = from => { let d = addDays(from, 1); let i = 0; while (!isSchool(d) && i++ < 30) d = addDays(d, 1); return d; };

  /* ---------- families and students ---------- */
  const surnames = ['Krishnan', 'Subramanian', 'Fernandes', 'Rajendran', 'Natarajan', 'Thomas', 'Murugan', 'Balasubramaniam', 'Iyer', 'Pillai', 'Joseph', 'Selvaraj', 'Shankar', 'Anand', 'Prakash', 'Venkatesh', 'Ramesh', 'Mani', 'Chandran', 'Gopal', 'Kannan', 'Rao', 'Sebastian', 'Xavier', 'Hariharan', 'Paramasivam', 'Dorai', 'Arumugam', 'Sekar', 'Velu', 'Daniel', 'Francis', 'Gnanam', 'Jacob', 'Lawrence', 'Mathew', 'Nair', 'Pandian', 'Raja', 'Samuel', 'Thangaraj', 'Victor', 'Wilson', 'Yesudas', 'Zachariah', 'Babu', 'Charles', 'Devaraj', 'Elango', 'Fredrick', 'George', 'Henry', 'Ilango', 'Jeevan', 'Kumaran', 'Lingam'];
  const fathers = ['Suresh', 'Karthik', 'Vijay', 'Ramesh', 'Senthil', 'Prakash', 'Ganesh', 'Rajesh', 'Anand', 'Murali', 'Sathish', 'Arul', 'Dinesh', 'Mohan', 'Bala', 'Saravanan', 'Ravi', 'Kumar', 'Sunil', 'Manoj'];
  const mothers = ['Divya', 'Lakshmi', 'Priya', 'Deepa', 'Kavya', 'Anitha', 'Revathi', 'Sowmya', 'Nithya', 'Gayathri', 'Jaya', 'Meera', 'Radha', 'Shanthi', 'Uma', 'Vani', 'Bhavani', 'Chitra', 'Ezhil', 'Hema'];
  const boys = ['Aarav', 'Arjun', 'Kavin', 'Rohan', 'Nikhil', 'Pranav', 'Sai', 'Vishnu', 'Harish', 'Dhruv', 'Ashwin', 'Mithran', 'Yuvan', 'Jeeva', 'Tharun', 'Akash', 'Rithik', 'Surya', 'Naveen', 'Gautham', 'Kabilan', 'Ezhil', 'Abinav', 'Dev'];
  const girls = ['Diya', 'Ananya', 'Ishita', 'Kavya', 'Meghana', 'Nila', 'Oviya', 'Saanvi', 'Tanvi', 'Varsha', 'Yazhini', 'Aadhya', 'Harini', 'Janani', 'Keerthana', 'Lavanya', 'Mithra', 'Nivetha', 'Pooja', 'Riya', 'Sharon', 'Thanya', 'Vaishnavi', 'Anika'];
  const bloods = ['A+', 'B+', 'O+', 'AB+', 'O+', 'B+', 'A-', 'O-'];
  const medical = ['Mild asthma — inhaler kept in school bag', 'Allergic to peanuts', 'Wears spectacles — please seat in front', 'Lactose intolerant'];
  const streets = ['Rasipuram Main Road', 'Gandhi Nagar', 'Anna Street', 'Bharathi Nagar', 'Kamaraj Road', 'Church Street', 'Nehru Colony', 'Thillai Nagar'];

  const families = [];
  const students = [];
  const enrollments = [];
  let famN = 0, stuN = 0, admN = 100;
  const phone = () => '9' + String(Math.floor(R() * 9e8) + 1e8).slice(0, 9);
  const fmtPhone = p => p.slice(0, 5) + ' ' + p.slice(5);

  function newFamily(fixed) {
    const sn = fixed && fixed.surname || surnames[famN % surnames.length];
    const fa = fixed && fixed.father || pick(fathers);
    const mo = fixed && fixed.mother || pick(mothers);
    const fam = {
      id: 'f' + (++famN),
      surname: sn,
      fatherName: `${fa} ${sn}`,
      fatherPhone: fixed && fixed.phone || phone(),
      motherName: `${mo} ${fa}`,
      motherPhone: phone(),
      guardianName: '',
      guardianPhone: '',
      primary: R() < .7 ? 'father' : 'mother',
      email: `${fa.toLowerCase()}.${sn.toLowerCase()}@example.in`,
      address: `${Math.floor(R() * 90) + 3}, ${pick(streets)}, Attur, Salem 636102`
    };
    if (fixed && fixed.primary) fam.primary = fixed.primary;
    families.push(fam);
    return fam;
  }
  function newStudent(fam, sec, fixed) {
    const g = grades.find(x => x.id === sec.gradeId);
    const gender = fixed && fixed.gender || (R() < .5 ? 'Boy' : 'Girl');
    const first = fixed && fixed.first || (gender === 'Boy' ? pick(boys) : pick(girls));
    const age = g.order + 2; // Nursery ≈ 3 years old
    const dob = iso(new Date(Y - age, Math.floor(R() * 12), 1 + Math.floor(R() * 27)));
    const joinedYear = Y - Math.max(0, Math.floor(R() * (g.order)));
    const st = {
      id: 'st' + (++stuN),
      familyId: fam.id,
      admissionNo: `CS${joinedYear}${String(++admN).padStart(3, '0')}`,
      firstName: first,
      lastName: fam.surname,
      dob,
      gender,
      bloodGroup: pick(bloods),
      admissionDate: `${joinedYear}-06-0${1 + Math.floor(R() * 5)}`,
      medical: R() < .12 ? pick(medical) : '',
      status: 'active',
      leftDate: null,
      ability: fixed && fixed.ability || (52 + Math.floor(R() * 44)),
      punctual: R()
    };
    students.push(st);
    enrollments.push({ id: 'e' + stuN, studentId: st.id, sectionId: sec.id, yearId: 'y1', roll: 0 });
    return st;
  }

  // The demo family: two children, one in Grade 3 A (Ms. Priya's class), one in UKG A.
  const demo = newFamily({ surname: 'Krishnan', father: 'Suresh', mother: 'Divya', phone: '9876543210', primary: 'father' });
  newStudent(demo, sections[5], { first: 'Aarav', gender: 'Boy', ability: 84 });
  newStudent(demo, sections[2], { first: 'Diya', gender: 'Girl', ability: 90 });
  demo.motherPhone = '9876501234';

  const sizes = { c1: 6, c2: 6, c3: 6, c4: 7, c5: 7, c6: 14, c7: 8, c8: 8, c9: 8 };
  sections.forEach(sec => {
    const already = enrollments.filter(e => e.sectionId === sec.id).length;
    for (let i = already; i < sizes[sec.id]; i++) {
      // Every fifth family gets a sibling in a younger class.
      const fam = newFamily();
      newStudent(fam, sec);
      if (famN % 5 === 0) {
        const younger = sections.filter(s => grades.find(g => g.id === s.gradeId).order < grades.find(g => g.id === sec.gradeId).order);
        if (younger.length) newStudent(fam, pick(younger));
      }
    }
  });
  // Roll numbers: alphabetical within each class.
  sections.forEach(sec => {
    enrollments.filter(e => e.sectionId === sec.id)
      .sort((a, b) => {
        const sa = students.find(s => s.id === a.studentId), sb = students.find(s => s.id === b.studentId);
        return (sa.firstName + sa.lastName).localeCompare(sb.firstName + sb.lastName);
      })
      .forEach((e, i) => { e.roll = i + 1; });
  });
  // One student left mid-year (to show the "left" status).
  const leaver = students.find(s => s.id === 'st20');
  if (leaver) { leaver.status = 'left'; leaver.leftDate = addDays(today, -40); }

  /* ---------- logins ---------- */
  const users = [
    { id: 'u1', loginId: 'priya.t',   password: 'teacher123', role: 'teacher', refId: 't1', active: true, mustChange: false },
    { id: 'u2', loginId: 'arun.k',    password: 'teacher123', role: 'teacher', refId: 't2', active: true, mustChange: false },
    { id: 'u3', loginId: 'kavitha.s', password: 'teacher123', role: 'teacher', refId: 't3', active: true, mustChange: false },
    { id: 'u4', loginId: 'meena.j',   password: 'teacher123', role: 'teacher', refId: 't4', active: true, mustChange: false }
  ];
  let uN = users.length;
  families.forEach((f, i) => {
    if (i >= families.length - 3) return; // the last few families have no login yet — admin can create one
    users.push({ id: 'u' + (++uN), loginId: f.primary === 'father' ? f.fatherPhone : f.motherPhone, password: 'parent123', role: 'parent', refId: f.id, active: true, mustChange: false });
  });
  // Demo parent always signs in with 9876543210.
  users.find(u => u.refId === demo.id).loginId = '9876543210';

  /* ---------- leave (needed before attendance so leave days show as "on leave") ---------- */
  const past = prevSchoolDays(today, 40);
  // Early in the year there are fewer past school days; pad the list so the samples below still get dates.
  const pastAll = past.slice();
  while (past.length < 40) past.push(addDays(past[past.length - 1] || today, -1));
  const aarav = students.find(s => s.firstName === 'Aarav' && s.familyId === demo.id);
  const diya = students.find(s => s.firstName === 'Diya' && s.familyId === demo.id);
  const rosterIds = secId => enrollments.filter(e => e.sectionId === secId).map(e => e.studentId);
  const c6ids = rosterIds('c6');
  const otherC6 = students.find(s => s.id === c6ids.find(id => id !== aarav.id));
  const tomorrow = nextSchoolDay(today);
  const studentLeaves = [
    { id: 'sl1', studentId: aarav.id, from: past[11], to: past[10], reason: 'Family function in Coimbatore.', status: 'ack', createdAt: past[14], ackBy: 't1', ackAt: past[13] },
    { id: 'sl2', studentId: diya.id, from: past[4], to: past[4], reason: 'Fever — doctor advised rest.', status: 'ack', createdAt: past[4], ackBy: 't10', ackAt: past[4] },
    { id: 'sl3', studentId: otherC6.id, from: tomorrow, to: nextSchoolDay(tomorrow), reason: 'Travelling to our native place for a temple festival.', status: 'sent', createdAt: today, ackBy: null, ackAt: null },
    { id: 'sl4', studentId: students.find(s => s.id === rosterIds('c8')[2]).id, from: nextSchoolDay(tomorrow), to: nextSchoolDay(tomorrow), reason: 'Dental appointment in the morning.', status: 'sent', createdAt: today, ackBy: null, ackAt: null }
  ];
  const staffLeaves = [
    { id: 'tl1', teacherId: 't1', type: 'Casual leave', from: past[20], to: past[20], reason: 'Personal work at the bank.', status: 'approved', createdAt: past[24], decidedAt: past[23], note: 'Approved. Ms. Meena will cover Grade 3 A.', coverId: 't4' },
    { id: 'tl5', teacherId: 't6', type: 'Sick leave', from: today, to: today, reason: 'Fever.', status: 'approved', createdAt: today, decidedAt: today, note: 'Get well soon.', coverId: 't1' },
    { id: 'tl2', teacherId: 't2', type: 'Casual leave', from: addDays(tomorrow, 6), to: addDays(tomorrow, 7), reason: 'Sister’s wedding.', status: 'pending', createdAt: addDays(today, -1), decidedAt: null, note: '' },
    { id: 'tl3', teacherId: 't4', type: 'Earned leave', from: past[2], to: past[0], reason: 'Trip.', status: 'rejected', createdAt: past[8], decidedAt: past[7], note: 'Unit tests that week — please apply for dates after the tests.' },
    { id: 'tl4', teacherId: 't3', type: 'Sick leave', from: tomorrow, to: tomorrow, reason: 'Medical check-up.', status: 'pending', createdAt: today, decidedAt: null, note: '' }
  ];
  const onAckLeave = (sid, d) => studentLeaves.some(l => l.studentId === sid && l.status === 'ack' && d >= l.from && d <= l.to);

  /* ---------- attendance for the last ~40 school days ---------- */
  const attendance = {};
  sections.forEach(sec => { attendance[sec.id] = {}; });
  const markDay = (sec, d, at) => {
    const marks = {};
    enrollments.filter(e => e.sectionId === sec.id).forEach(e => {
      const st = students.find(s => s.id === e.studentId);
      if (st.status === 'left' && st.leftDate && d > st.leftDate) return;
      let code = 'P';
      const r = R();
      if (onAckLeave(st.id, d)) code = 'V';
      else if (r < .045) code = 'A';
      else if (r < .045 + .05 * st.punctual) code = 'L';
      else if (r < .045 + .05 * st.punctual + .012) code = 'H';
      marks[st.id] = code;
    });
    attendance[sec.id][d] = { by: sec.classTeacherId, at, marks };
  };
  pastAll.forEach(d => sections.forEach(sec => markDay(sec, d, d + 'T09:12:00')));
  // Today: some classes have already marked, Grade 3 A has not (for the teacher demo).
  if (isSchool(today)) ['c1', 'c2', 'c4', 'c8'].forEach(id => markDay(sections.find(s => s.id === id), today, stamp));

  /* ---------- homework and class diary ---------- */
  const hwIdeas = {
    s1: [['Reading: “The Thirsty Crow”', 'Read the story aloud twice and underline the action words.'], ['Spelling list 9', 'Learn the ten words in your notebook. Short test on Friday.'], ['Write five sentences', 'Write five sentences about your favourite festival.'], ['Nouns worksheet', 'Complete the worksheet on common and proper nouns.']],
    s2: [['எழுத்துப் பயிற்சி', 'Write the uyir ezhuthukal three times in the four-line notebook.'], ['Tamil poem', 'Learn the first two stanzas of the poem by heart.'], ['Word building', 'Make five words using the letter “க”.']],
    s3: [['Fractions — exercise 6.2', 'Questions 1 to 10 in the textbook. Show your working.'], ['Times tables 7 and 8', 'Practise both tables; oral test tomorrow.'], ['Word problems', 'Solve the five word problems on page 74.'], ['Shapes around us', 'Draw and name five shapes you find at home.']],
    s4: [['Plants around us', 'Collect three different leaves and paste them in your scrapbook.'], ['My family', 'Draw your family and write one line about each person.']],
    s5: [['Parts of a plant', 'Label the diagram and learn the functions of each part.'], ['States of matter', 'List five solids, five liquids and five gases found at home.'], ['Science project', 'Bring an empty plastic bottle for Thursday’s activity.']],
    s6: [['Our district', 'Mark Salem, Attur and Namakkal on the outline map.'], ['Landforms', 'Read pages 32–35 and answer the questions at the end.']],
    s7: [['Parts of a computer', 'Draw a computer and label the monitor, keyboard, mouse and CPU.'], ['Typing practice', 'Practise the home-row keys for 10 minutes.']],
    s8: [['Leaf printing', 'Bring two big leaves and a old newspaper on Monday.'], ['Colour the rainbow', 'Colour the rainbow sheet in your activity book.']]
  };
  const diaryIdeas = [
    'We read a new story in class today and the children acted it out. Please ask your child to tell you the story at home.',
    'Today we practised addition with carrying. Most children did very well — a little practice at home will help.',
    'Our class visited the school garden and watered the plants. Ask your child which plant they liked best.',
    'Reminder: Friday is “Show and Tell”. Your child can bring one small favourite object.',
    'We learnt a new rhyme today. The children loved the actions!',
    'Please send a named water bottle every day — the days are getting warm.',
    'Library day tomorrow. Please return last week’s book.'
  ];
  const homework = [];
  let hwN = 0;
  const files = ['worksheet.pdf', 'practice-sheet.pdf', 'reading-passage.pdf'];
  sections.forEach(sec => {
    const css = classSubjects.filter(cs => cs.sectionId === sec.id);
    past.slice(0, 9).forEach((d, i) => {
      const cs = css[(i + sec.id.length * 3) % css.length];
      const idea = pick(hwIdeas[cs.subjectId]);
      homework.push({
        id: 'hw' + (++hwN), sectionId: sec.id, subjectId: cs.subjectId, type: 'homework',
        title: idea[0], description: idea[1], assigned: d, due: nextSchoolDay(d),
        file: R() < .3 ? `${cs.subjectId === 's3' ? 'maths' : 'class'}-${pick(files)}` : '',
        createdBy: cs.teacherId, createdAt: d + 'T14:40:00'
      });
      if (i % 2 === 0) homework.push({
        id: 'hw' + (++hwN), sectionId: sec.id, subjectId: null, type: 'diary',
        title: 'Class diary', description: pick(diaryIdeas), assigned: d, due: null, file: '',
        createdBy: sec.classTeacherId, createdAt: d + 'T15:10:00'
      });
    });
  });

  /* ---------- exams, papers and marks ---------- */
  const t1Start = addDays(`${Y}-06-01`, 106);
  const ut2Start = past[9] || addDays(today, -12);
  const exams = [
    { id: 'ex1', yearId: 'y1', name: 'Term 1 assessment', start: t1Start, end: addDays(t1Start, 8), published: true, order: 1 },
    { id: 'ex2', yearId: 'y1', name: 'Unit test 2', start: ut2Start, end: addDays(ut2Start, 4), published: false, order: 2 },
    { id: 'ex3', yearId: 'y1', name: 'Term 2 assessment', start: `${Y}-12-08`, end: `${Y}-12-17`, published: false, order: 3 }
  ];
  const papers = [];
  let ppN = 0;
  [['ex1', 1, 100, 50], ['ex2', 0.5, 50, 25]].forEach(([exId, scale, maxP, maxE]) => {
    const ex = exams.find(e => e.id === exId);
    sections.forEach(sec => {
      const early = grades.find(g => g.id === sec.gradeId).stage === 'early';
      classSubjects.filter(cs => cs.sectionId === sec.id && cs.subjectId !== 's8').forEach((cs, i) => {
        const max = early ? maxE : maxP;
        papers.push({ id: 'pp' + (++ppN), examId: exId, csId: cs.id, max, pass: Math.round(max * .35), date: addDays(ex.start, i) });
      });
    });
  });
  const marks = {};
  const fillPaper = (pp, onlyFirst) => {
    const cs = classSubjects.find(c => c.id === pp.csId);
    marks[pp.id] = {};
    enrollments.filter(e => e.sectionId === cs.sectionId)
      .sort((a, b) => a.roll - b.roll)
      .slice(0, onlyFirst || 999)
      .forEach(e => {
        const st = students.find(s => s.id === e.studentId);
        if (R() < .02) { marks[pp.id][st.id] = { m: null, absent: true }; return; }
        const pct = Math.max(.18, Math.min(1, st.ability / 100 + (R() - .5) * .22));
        marks[pp.id][st.id] = { m: Math.round(pp.max * pct), absent: false };
      });
  };
  papers.filter(p => p.examId === 'ex1').forEach(p => fillPaper(p));
  // Unit test 2: being entered right now — Grade 4 A maths done, Grade 3 A English half done, rest empty.
  papers.filter(p => p.examId === 'ex2').forEach(p => {
    const cs = classSubjects.find(c => c.id === p.csId);
    if (cs.sectionId === 'c8' && cs.subjectId === 's3') fillPaper(p);
    else if (cs.sectionId === 'c6' && cs.subjectId === 's1') fillPaper(p, 6);
    else if (['c1', 'c2', 'c3', 'c9'].includes(cs.sectionId)) fillPaper(p);
  });

  const gradeBands = [
    { id: 'gb1', min: 91, label: 'A1' }, { id: 'gb2', min: 81, label: 'A2' },
    { id: 'gb3', min: 71, label: 'B1' }, { id: 'gb4', min: 61, label: 'B2' },
    { id: 'gb5', min: 51, label: 'C1' }, { id: 'gb6', min: 41, label: 'C2' },
    { id: 'gb7', min: 33, label: 'D' },  { id: 'gb8', min: 0,  label: 'E' }
  ];

  /* ---------- remarks ---------- */
  const remarkIdeas = {
    appreciation: ['Read the whole story aloud to the class with great confidence today.', 'Helped a classmate who was feeling unwell — very kind.', 'Excellent improvement in handwriting this month.', 'Solved every problem in the maths quiz correctly.', 'Led the morning assembly prayer beautifully.'],
    concern: ['Has not submitted homework three times this week. Please check the diary daily.', 'Seems tired in the morning — please make sure of an early bedtime.', 'Needs more practice with times tables at home.'],
    general: ['Has been chosen for the inter-school quiz team practice on Saturdays.', 'Please send a change of clothes for the art class on Friday.', 'Is settling in well with the new seating plan.']
  };
  const remarks = [];
  let rmN = 0;
  const addRemark = (sid, type, by, d, text) => remarks.push({ id: 'rm' + (++rmN), studentId: sid, type, text: text || pick(remarkIdeas[type]), by, date: d });
  addRemark(aarav.id, 'appreciation', 't1', past[1], 'Read the whole story aloud to the class with great confidence today. Well done, Aarav!');
  addRemark(aarav.id, 'general', 't2', past[6], 'Has been chosen for the inter-school maths quiz practice on Saturdays, 9–11 am.');
  addRemark(aarav.id, 'concern', 't1', past[15], 'Forgot his English notebook twice this week. Please check his bag the night before.');
  addRemark(diya.id, 'appreciation', 't10', past[2], 'Diya sang the new rhyme with all the actions in front of the class. Lovely!');
  addRemark(diya.id, 'general', 't10', past[9]);
  students.forEach((s, i) => {
    if (s.id === aarav.id || s.id === diya.id || i % 4) return;
    const e = enrollments.find(x => x.studentId === s.id);
    const sec = sections.find(x => x.id === e.sectionId);
    addRemark(s.id, pick(['appreciation', 'appreciation', 'concern', 'general']), sec.classTeacherId, pick(past.slice(0, 20)));
  });

  /* ---------- notices and documents for parents and teachers ---------- */
  const notices = [
    { id: 'n1', title: 'Term 2 parent–teacher meeting', body: 'Parents of all classes are invited to meet the class teacher on Saturday between 9:30 am and 12:30 pm. Report books for Unit test 2 will be shared.', category: 'Parent meeting', audience: 'parents', gradeId: null, sectionId: null, date: past[0], pinned: true },
    { id: 'n2', title: 'Grade 3 field trip to the Kolli Hills botanical garden', body: 'Grade 3 will visit the botanical garden next Friday. Please send the signed consent slip and a packed lunch. The bus leaves at 8:15 am.', category: 'Event', audience: 'grade', gradeId: 'g6', sectionId: null, date: past[1], pinned: false },
    { id: 'n3', title: 'Grade 3 A: craft materials on Friday', body: 'Please send glue, safety scissors and two old magazines for our collage activity.', category: 'General', audience: 'section', gradeId: null, sectionId: 'c6', date: past[0], pinned: false },
    { id: 'n4', title: 'Staff meeting on Saturday', body: 'All teachers: staff meeting in the library at 12:45 pm. Agenda — Term 2 assessment plan and the annual day programme.', category: 'Important notice', audience: 'teachers', gradeId: null, sectionId: null, date: past[0], pinned: true },
    { id: 'n5', title: 'Unit test 2 marks due this Friday', body: 'Please complete marks entry for every paper by Friday 4 pm so results can be published to parents on Monday.', category: 'Examination', audience: 'teachers', gradeId: null, sectionId: null, date: past[2], pinned: false },
    { id: 'n6', title: 'Winter uniform from 1 December', body: 'Children may wear the navy school sweater from 1 December. Sweaters are available at the school office.', category: 'General', audience: 'parents', gradeId: null, sectionId: null, date: past[3], pinned: false },
    { id: 'n7', title: 'UKG Rhymes Day', body: 'UKG children will present rhymes with actions next Wednesday. Parents are welcome at 10 am in the hall.', category: 'Event', audience: 'grade', gradeId: 'g3', sectionId: null, date: past[4], pinned: false },
    { id: 'n8', title: 'Deepavali holiday', body: 'School will remain closed for Deepavali. Classes resume the next working day.', category: 'Holiday', audience: 'parents', gradeId: null, sectionId: null, date: past[12], pinned: false }
  ];
  const documents = [
    { id: 'd1', title: 'Grade 3 syllabus — Term 2', file: 'grade3-term2-syllabus.pdf', size: '182 KB', audience: 'grade', gradeId: 'g6', sectionId: null, date: past[10] },
    { id: 'd2', title: 'Unit test 2 portions — Grade 3 A', file: 'g3a-unit-test-2-portions.pdf', size: '64 KB', audience: 'section', gradeId: null, sectionId: 'c6', date: past[12] },
    { id: 'd3', title: `Parent handbook ${years[0].name}`, file: 'parent-handbook.pdf', size: '1.2 MB', audience: 'parents', gradeId: null, sectionId: null, date: past[30] || past[past.length - 1] },
    { id: 'd4', title: 'Holiday list', file: 'holiday-list.pdf', size: '48 KB', audience: 'parents', gradeId: null, sectionId: null, date: past[30] || past[past.length - 1] },
    { id: 'd5', title: 'UKG rhymes booklet', file: 'ukg-rhymes.pdf', size: '540 KB', audience: 'grade', gradeId: 'g3', sectionId: null, date: past[8] },
    { id: 'd6', title: 'Teachers’ marks-entry guide', file: 'marks-entry-guide.pdf', size: '96 KB', audience: 'teachers', gradeId: null, sectionId: null, date: past[5] }
  ];

  return {
    version: 1, seededOn: today,
    years, grades, subjects, teachers, sections, classSubjects, periods, timetable, holidays, settings,
    families, students, enrollments, users,
    attendance, homework, exams, papers, marks, gradeBands,
    remarks, studentLeaves, staffLeaves, notices, documents,
    changeLog: [], promotions: []
  };
}

/* ============================================================
   STORE
   ============================================================ */
let db = null;
const listeners = [];
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.version === 1) { db = d; return; } }
  } catch (e) { console.warn('[SchoolDB] load failed, using fresh demo data', e); }
  db = seed();
  save();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { console.warn('[SchoolDB] save failed', e); }
}
function reset() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  db = seed();
  save();
}
load();
window.addEventListener('storage', e => {
  if (e.key !== KEY) return;
  load();
  listeners.forEach(fn => { try { fn(); } catch (err) { console.error(err); } });
});
const onChange = fn => listeners.push(fn);

let idN = Date.now() % 100000;
const newId = p => p + 'n' + (++idN).toString(36);

/* ============================================================
   LOOKUPS
   ============================================================ */
const byId = (list, id) => (db[list] || []).find(x => x.id === id) || null;
const currentYear = () => db.years.find(y => y.current) || db.years[0];
const nextYear = () => {
  const cur = currentYear();
  return db.years.filter(y => y.start > cur.start).sort((a, b) => a.start.localeCompare(b.start))[0] || null;
};
const grade = id => byId('grades', id);
const section = id => byId('sections', id);
const subject = id => byId('subjects', id);
const teacher = id => byId('teachers', id);
const student = id => byId('students', id);
const family = id => byId('families', id);
const exam = id => byId('exams', id);
const sectionLabel = sec => { if (typeof sec === 'string') sec = section(sec); if (!sec) return '—'; const g = grade(sec.gradeId); return `${g ? g.label : ''} ${sec.name}`.trim(); };
const studentName = s => { if (typeof s === 'string') s = student(s); return s ? `${s.firstName} ${s.lastName}` : '—'; };
const teacherName = id => { const t = teacher(id); return t ? t.name : '—'; };
const subjectName = id => { const s = subject(id); return s ? s.name : 'Class diary'; };
const initials = name => String(name).replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/i, '').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

const sectionsOfYear = (yearId) => db.sections
  .filter(s => s.yearId === (yearId || currentYear().id))
  .sort((a, b) => (grade(a.gradeId).order - grade(b.gradeId).order) || a.name.localeCompare(b.name));
const classSubjectsOf = sectionId => db.classSubjects
  .filter(cs => cs.sectionId === sectionId)
  .sort((a, b) => subject(a.subjectId).order - subject(b.subjectId).order);
const classSubject = id => byId('classSubjects', id);

function enrollmentOf(studentId, yearId) {
  return db.enrollments.find(e => e.studentId === studentId && e.yearId === (yearId || currentYear().id)) || null;
}
function sectionOfStudent(studentId, yearId) {
  const e = enrollmentOf(studentId, yearId);
  return e ? section(e.sectionId) : null;
}
/** Students of a class with their roll number. Left students are included only when asked. */
function rosterOf(sectionId, opts) {
  const o = opts || {};
  return db.enrollments.filter(e => e.sectionId === sectionId)
    .map(e => Object.assign({}, student(e.studentId), { roll: e.roll, enrollmentId: e.id }))
    .filter(s => s.id && (o.includeLeft || s.status === 'active'))
    .sort((a, b) => a.roll - b.roll);
}
/** A family's children, eldest class first. */
function childrenOfFamily(familyId) {
  const order = s => { const sec = sectionOfStudent(s.id); return sec ? grade(sec.gradeId).order : 0; };
  return db.students.filter(s => s.familyId === familyId).sort((a, b) => order(b) - order(a));
}
const familyOf = studentId => { const s = student(studentId); return s ? family(s.familyId) : null; };
const classOfTeacher = teacherId => sectionsOfYear().find(s => s.classTeacherId === teacherId) || null;
/** Every class a teacher teaches or is class teacher of, this year. */
function sectionsTaughtBy(teacherId) {
  const ids = new Set(db.classSubjects.filter(cs => cs.teacherId === teacherId).map(cs => cs.sectionId));
  return sectionsOfYear().filter(s => ids.has(s.id) || s.classTeacherId === teacherId);
}
const subjectsTaughtIn = (teacherId, sectionId) => classSubjectsOf(sectionId).filter(cs => cs.teacherId === teacherId);

/* ---------- calendar ---------- */
const holidayOn = d => db.holidays.find(h => h.date === d) || null;
const isWeeklyOff = d => db.settings.weeklyOff.includes(dayOfWeek(d));
function isSchoolDay(d) {
  const y = currentYear();
  return !isWeeklyOff(d) && !holidayOn(d) && d >= y.start && d <= y.end;
}
function nextSchoolDay(from) { let d = addDays(from, 1), i = 0; while (!isSchoolDay(d) && i++ < 60) d = addDays(d, 1); return d; }
function prevSchoolDay(from) { let d = addDays(from, -1), i = 0; while (!isSchoolDay(d) && i++ < 60) d = addDays(d, -1); return d; }

/* ---------- attendance ---------- */
const attendanceDay = (sectionId, d) => (db.attendance[sectionId] || {})[d] || null;
function statusOf(studentId, d) {
  const sec = sectionOfStudent(studentId);
  const day = sec && attendanceDay(sec.id, d);
  return day ? (day.marks[studentId] || null) : null;
}
const ackLeaveOn = (studentId, d) => db.studentLeaves.find(l => l.studentId === studentId && l.status === 'ack' && d >= l.from && d <= l.to) || null;
const pendingLeaveOn = (studentId, d) => db.studentLeaves.find(l => l.studentId === studentId && l.status === 'sent' && d >= l.from && d <= l.to) || null;
/** Counts and percentage between two dates. Days with no attendance taken are left out. */
function attendanceSummary(studentId, from, to) {
  const out = { P: 0, A: 0, L: 0, H: 0, V: 0, days: 0, present: 0, pct: null };
  const sec = sectionOfStudent(studentId);
  if (!sec) return out;
  Object.entries(db.attendance[sec.id] || {}).forEach(([d, day]) => {
    if (d < from || d > to) return;
    const c = day.marks[studentId];
    if (!c) return;
    out[c]++; out.days++; out.present += STATUS[c].value;
  });
  out.pct = out.days ? Math.round(out.present / out.days * 1000) / 10 : null;
  return out;
}
function sectionDaySummary(sectionId, d) {
  const day = attendanceDay(sectionId, d);
  if (!day) return null;
  const vals = Object.values(day.marks);
  const out = { P: 0, A: 0, L: 0, H: 0, V: 0, total: vals.length, present: 0 };
  vals.forEach(c => { out[c]++; out.present += STATUS[c].value; });
  out.pct = out.total ? Math.round(out.present / out.total * 1000) / 10 : null;
  return out;
}
function saveAttendance(sectionId, d, marks, by) {
  const prev = attendanceDay(sectionId, d);
  if (!db.attendance[sectionId]) db.attendance[sectionId] = {};
  if (prev && prev.at && prev.at.slice(0, 10) < todayISO() || prev && by === 'admin') {
    Object.keys(marks).forEach(sid => {
      if (prev.marks[sid] !== marks[sid]) logChange({ what: 'Attendance', sectionId, date: d, studentId: sid, from: prev.marks[sid] || '—', to: marks[sid], by });
    });
  }
  db.attendance[sectionId][d] = { by, at: new Date().toISOString(), marks: Object.assign({}, marks) };
  save();
}
function logChange(entry) {
  db.changeLog.unshift(Object.assign({ id: newId('cl'), at: new Date().toISOString() }, entry));
  db.changeLog = db.changeLog.slice(0, 300);
}

/* ---------- marks ---------- */
const gradeFor = pct => {
  if (pct == null || isNaN(pct)) return '—';
  const b = db.gradeBands.slice().sort((a, b2) => b2.min - a.min).find(x => pct >= x.min);
  return b ? b.label : '—';
};
const papersOf = (examId, sectionId) => db.papers
  .filter(p => p.examId === examId && (!sectionId || classSubject(p.csId) && classSubject(p.csId).sectionId === sectionId))
  .sort((a, b) => subject(classSubject(a.csId).subjectId).order - subject(classSubject(b.csId).subjectId).order);
const marksOf = paperId => db.marks[paperId] || {};
function paperStats(paperId) {
  const pp = byId('papers', paperId);
  const cs = classSubject(pp.csId);
  const roster = rosterOf(cs.sectionId);
  const m = marksOf(paperId);
  const entered = roster.filter(s => m[s.id] && (m[s.id].absent || m[s.id].m != null));
  const scored = entered.filter(s => !m[s.id].absent).map(s => m[s.id].m);
  const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
  return {
    total: roster.length, entered: entered.length,
    avg: avg == null ? null : Math.round(avg * 10) / 10,
    avgPct: avg == null ? null : Math.round(avg / pp.max * 1000) / 10,
    fails: scored.filter(x => x < pp.pass).length,
    absent: entered.length - scored.length
  };
}
/** One child's result in one exam, for the report card. */
function studentResult(studentId, examId) {
  const sec = sectionOfStudent(studentId);
  if (!sec) return null;
  const rows = papersOf(examId, sec.id).map(pp => {
    const cs = classSubject(pp.csId);
    const r = marksOf(pp.id)[studentId];
    const m = r && !r.absent ? r.m : null;
    const pct = m == null ? null : Math.round(m / pp.max * 1000) / 10;
    return { paperId: pp.id, subject: subjectName(cs.subjectId), teacher: teacherName(cs.teacherId), max: pp.max, pass: pp.pass, marks: m, absent: !!(r && r.absent), entered: !!r, pct, grade: gradeFor(pct), failed: m != null && m < pp.pass };
  });
  const counted = rows.filter(r => r.marks != null || r.absent);
  const total = counted.reduce((a, r) => a + (r.marks || 0), 0);
  const max = counted.reduce((a, r) => a + r.max, 0);
  const pct = max ? Math.round(total / max * 1000) / 10 : null;
  return { rows, total, max, pct, grade: gradeFor(pct), complete: rows.length > 0 && rows.every(r => r.entered) };
}

/* ---------- timetable ---------- */
const teachingPeriods = () => db.periods.filter(p => p.yearId === currentYear().id && !p.isBreak);
const allPeriods = () => db.periods.filter(p => p.yearId === currentYear().id).sort((a, b) => a.start.localeCompare(b.start));
const ttEntry = (sectionId, day, periodId) => db.timetable.find(t => t.sectionId === sectionId && t.day === day && t.periodId === periodId) || null;
/** Who teaches in a slot (if anyone else), for the clash check. */
function teacherBusy(teacherId, day, periodId, exceptSectionId) {
  return db.timetable.find(t => t.day === day && t.periodId === periodId && t.sectionId !== exceptSectionId && t.csId &&
    classSubject(t.csId) && classSubject(t.csId).teacherId === teacherId) || null;
}
function teacherSlot(teacherId, day, periodId) {
  const t = db.timetable.find(x => x.day === day && x.periodId === periodId && x.csId && classSubject(x.csId) && classSubject(x.csId).teacherId === teacherId);
  return t ? { sectionId: t.sectionId, subjectId: classSubject(t.csId).subjectId } : null;
}

/* ---------- staff leave: allowance, balance, cover ---------- */
const DEFAULT_ALLOWANCE = { 'Casual leave': 12, 'Sick leave': 10, 'Earned leave': 15 };
const leaveAllowance = () => Object.assign({}, DEFAULT_ALLOWANCE, db.settings.leaveAllowance || {});
const schoolDaysIn = (a, b) => { let n = 0, d = a, i = 0; while (d <= b && i++ < 400) { if (isSchoolDay(d)) n++; d = addDays(d, 1); } return n; };
/** School days of approved leave of one type this school year ("On duty" is not counted against any allowance). */
function leaveUsed(teacherId, type) {
  const y = currentYear();
  return db.staffLeaves.filter(l => l.teacherId === teacherId && l.type === type && l.status === 'approved' && l.to >= y.start && l.from <= y.end)
    .reduce((n, l) => n + schoolDaysIn(l.from, l.to), 0);
}
function leaveBalance(teacherId) {
  const allow = leaveAllowance();
  return Object.keys(allow).map(type => { const used = leaveUsed(teacherId, type); return { type, allowed: allow[type], used, left: allow[type] - used }; });
}
const onLeave = (teacherId, d) => db.staffLeaves.find(l => l.teacherId === teacherId && l.status === 'approved' && d >= l.from && d <= l.to) || null;
const leavesOn = d => db.staffLeaves.filter(l => l.status === 'approved' && d >= l.from && d <= l.to);
/** Leave where this teacher has been asked to cover, on a given day. */
const coverDutiesOn = (teacherId, d) => db.staffLeaves.filter(l => l.status === 'approved' && l.coverId === teacherId && d >= l.from && d <= l.to);

/* ---------- notices and documents by audience ---------- */
function visibleTo(item, who) {
  switch (item.audience) {
    case 'public': return true;
    case 'parents': return who.role === 'parent';
    case 'teachers': return who.role === 'teacher';
    case 'grade': return (who.gradeIds || []).includes(item.gradeId);
    case 'section': return (who.sectionIds || []).includes(item.sectionId);
    default: return false;
  }
}
const noticesFor = who => db.notices.filter(n => visibleTo(n, who)).sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date));
const documentsFor = who => db.documents.filter(d => visibleTo(d, who)).sort((a, b) => b.date.localeCompare(a.date));
const audienceLabel = item => {
  if (item.audience === 'grade') return 'Grade: ' + (grade(item.gradeId) ? grade(item.gradeId).label : '—');
  if (item.audience === 'section') return 'Class: ' + sectionLabel(item.sectionId);
  return AUDIENCES[item.audience] || item.audience;
};

/* ============================================================
   SIGN-IN (demo)
   ============================================================ */
function login(loginId, password) {
  const id = String(loginId || '').trim().toLowerCase().replace(/\s+/g, '');
  const u = db.users.find(x => x.loginId.toLowerCase().replace(/\s+/g, '') === id);
  if (!u || u.password !== password) return { ok: false, reason: 'bad' };
  if (!u.active) return { ok: false, reason: 'off' };
  return { ok: true, user: u };
}
function setSession(user, remember) {
  const s = JSON.stringify({ role: user.role, userId: user.id, refId: user.refId, at: Date.now() });
  try {
    sessionStorage.setItem(SESSION_KEY, s);
    if (remember) localStorage.setItem(SESSION_KEY, s); else localStorage.removeItem(SESSION_KEY);
  } catch (e) { /* storage blocked: the portal will send the user back to sign in */ }
}
function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
}
/** Send the visitor back to the website unless they are signed in with this role and the login is still active. */
function guard(role) {
  const s = getSession();
  const u = s && db.users.find(x => x.id === s.userId);
  if (!s || s.role !== role || !u || !u.active) {
    window.location.replace('index.html#/home?signin=' + role);
    return null;
  }
  return Object.assign({}, s, { user: u });
}

return {
  get db() { return db; },
  save, reset, onChange, newId,
  STATUS, STATUS_ORDER, AUDIENCES, REMARK_TYPES, STUDENT_LEAVE_STATES, STAFF_LEAVE_STATES, STAFF_LEAVE_TYPES,
  iso, parse, addDays, todayISO, fmtDate, fmtShort, dayOfWeek, MON, MONTHS, DAYS,
  byId, currentYear, nextYear, grade, section, subject, teacher, student, family, exam, classSubject,
  sectionLabel, studentName, teacherName, subjectName, initials,
  sectionsOfYear, classSubjectsOf, enrollmentOf, sectionOfStudent, rosterOf, childrenOfFamily, familyOf,
  classOfTeacher, sectionsTaughtBy, subjectsTaughtIn,
  holidayOn, isWeeklyOff, isSchoolDay, nextSchoolDay, prevSchoolDay,
  attendanceDay, statusOf, ackLeaveOn, pendingLeaveOn, attendanceSummary, sectionDaySummary, saveAttendance, logChange,
  gradeFor, papersOf, marksOf, paperStats, studentResult,
  teachingPeriods, allPeriods, ttEntry, teacherBusy, teacherSlot,
  noticesFor, documentsFor, audienceLabel,
  leaveAllowance, leaveUsed, leaveBalance, onLeave, leavesOn, coverDutiesOn, schoolDaysIn,
  login, setSession, getSession, clearSession, guard
};
})();
