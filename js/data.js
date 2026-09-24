/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — Shared Data & Utilities
   ============================================================ */
'use strict';
window.App = (function() {

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h; };
let uid = 0;

const CATS = {
  'Holiday':          { c: '#2E7D32', bg: '#E8F5E9' },
  'Important notice': { c: '#C62828', bg: '#FFEBEE' },
  'Examination':      { c: '#5E35B1', bg: '#EDE7F6' },
  'Event':            { c: '#EF6C00', bg: '#FFF3E0' },
  'Parent meeting':   { c: '#0277BD', bg: '#E1F5FE' },
  'General':          { c: '#1D4ED8', bg: '#E7F1FF' }
};
const DEPTS = ['Primary years', 'Mathematics', 'Science', 'Languages', 'Social studies', 'Computer science', 'Arts and music', 'Physical education', 'Student support'];
const DOC_CATS = ['All', 'Admission forms', 'Academic', 'Circulars & notices', 'Policies', 'Fee related', 'Other'];
const GAL_CATS = ['All', 'Campus', 'Sports', 'Events', 'Cultural', 'Science', 'Trips', 'Students'];
const TONES = {
  a: 'background:linear-gradient(150deg,#FFE8D6,#FFD2AE);color:#6B2E00',
  b: 'background:linear-gradient(150deg,#E7F1FF,#C7E3FF);color:#0A1B3D',
  c: 'background:linear-gradient(150deg,#FFF3E0,#FFE1B5);color:#6B3A00',
  d: 'background:linear-gradient(150deg,#E8F5E9,#C8E8CC);color:#14421A',
  e: 'background:linear-gradient(150deg,#EDE7F6,#D5C9F5);color:#33146B',
  f: 'background:linear-gradient(150deg,#E0F7F4,#B8ECE3);color:#0B4A42'
};
const ENQ_STATES = ['New', 'Called', 'Visit booked', 'Admitted'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SCENES = {
  campus:     {a:'#1B3E77',b:'#4EA8FF',tint:'#FFC24A',icon:'ic-grad',   kind:'outdoor'},
  classroom:  {a:'#2F6BEA',b:'#8CC8FF',tint:'#FF9B45',icon:'ic-book',   kind:'indoor'},
  smartclass: {a:'#123C86',b:'#4EA8FF',tint:'#FFC24A',icon:'ic-laptop', kind:'indoor'},
  library:    {a:'#B74A00',b:'#FFB547',tint:'#4EA8FF',icon:'ic-book',   kind:'indoor'},
  computer:   {a:'#16407F',b:'#6FB6FF',tint:'#FF7A1A',icon:'ic-laptop', kind:'indoor'},
  lab:        {a:'#0E6B5E',b:'#63D6BE',tint:'#FFC24A',icon:'ic-flask',  kind:'indoor'},
  playground: {a:'#2C7A3F',b:'#9BE08A',tint:'#FF7A1A',icon:'ic-ball',   kind:'outdoor'},
  art:        {a:'#8E2C7A',b:'#F79BE0',tint:'#FFC24A',icon:'ic-palette',kind:'indoor'},
  music:      {a:'#5E35B1',b:'#B39DFF',tint:'#FFC24A',icon:'ic-music',  kind:'indoor'},
  dance:      {a:'#C2185B',b:'#FF9BC0',tint:'#FFC24A',icon:'ic-sparkle',kind:'indoor'},
  bus:        {a:'#D14C00',b:'#FFB547',tint:'#1D4ED8',icon:'ic-bus',    kind:'outdoor'},
  trip:       {a:'#1F6F8B',b:'#8ED6E8',tint:'#FF7A1A',icon:'ic-mappin', kind:'outdoor'},
  reading:    {a:'#0A1B3D',b:'#5E7FC0',tint:'#FFC24A',icon:'ic-book',   kind:'indoor'},
  science:    {a:'#00695C',b:'#7ED8C4',tint:'#FF7A1A',icon:'ic-flask',  kind:'indoor'},
  culture:    {a:'#AD1457',b:'#FFAFCF',tint:'#FFC24A',icon:'ic-music',  kind:'outdoor'},
  students:   {a:'#1D4ED8',b:'#9CCDFF',tint:'#FF7A1A',icon:'ic-users',  kind:'outdoor'},
  football:   {a:'#1B5E20',b:'#8BD68F',tint:'#FFFFFF',icon:'ic-ball',   kind:'outdoor'},
  cricket:    {a:'#2E7D32',b:'#BFE58C',tint:'#FF7A1A',icon:'ic-ball',   kind:'outdoor'},
  volleyball: {a:'#0277BD',b:'#8FD4FF',tint:'#FFC24A',icon:'ic-ball',   kind:'outdoor'},
  badminton:  {a:'#4527A0',b:'#B6A6FF',tint:'#FFC24A',icon:'ic-ball',   kind:'indoor'},
  athletics:  {a:'#D84315',b:'#FFAB80',tint:'#FFFFFF',icon:'ic-run',    kind:'outdoor'},
  chess:      {a:'#263238',b:'#8FA7B3',tint:'#FFC24A',icon:'ic-chess',  kind:'indoor'},
  trophy:     {a:'#B26A00',b:'#FFD277',tint:'#FFFFFF',icon:'ic-trophy', kind:'flat'},
  stage:      {a:'#4A148C',b:'#CE93D8',tint:'#FFC24A',icon:'ic-mega',   kind:'indoor'},
  map:        {a:'#DCEAF8',b:'#F3F8FF',tint:'#1D4ED8',icon:'',          kind:'map'},
  general:    {a:'#12305F',b:'#6FA8F0',tint:'#FF7A1A',icon:'ic-sparkle',kind:'flat'}
};

const db = {
  staff: [
    { id: 1, name: 'Radhika Krishnan', desig: 'Principal', dept: 'Student support', qual: 'M.A. English, M.Ed.', exp: 24, classes: 'Nursery to Grade 5', subjects: 'School leadership, English', note: 'Joined Christina in its second year and has guided generations of primary learners with care and dedication.', active: true },
    { id: 2, name: 'Anand Subramanian', desig: 'Vice Principal and Mathematics lead', dept: 'Mathematics', qual: 'M.Sc. Mathematics, B.Ed.', exp: 18, classes: 'Grades 3, 4, 5', subjects: 'Mathematics, Mental Math', note: 'Believes early number sense should be joyful and intuitive, not rushed through worksheets.', active: true },
    { id: 3, name: 'Fatima Sheikh', desig: 'Senior teacher, Primary', dept: 'Primary years', qual: 'B.El.Ed., Montessori diploma', exp: 13, classes: 'Grades 1, 2', subjects: 'Early literacy, Environmental studies', note: 'Built the phonics programme used across early years and Grades 1 and 2. Keeps a reading nest in her classroom.', active: true },
    { id: 4, name: 'Joseph Mathew', desig: 'Science teacher', dept: 'Science', qual: 'M.Sc. Physics, B.Ed.', exp: 11, classes: 'Grades 3, 4, 5', subjects: 'General Science, Nature Studies', note: 'Directs the campus nature club and rooftop plant nursery, helping kids explore living science.', active: true },
    { id: 5, name: 'Lakshmi Venkatesan', desig: 'Tamil language teacher', dept: 'Languages', qual: 'M.A. Tamil, B.Ed.', exp: 16, classes: 'Nursery to Grade 5', subjects: 'Tamil, Rhymes & Literature', note: 'Directs the Tamil drama for Cultural Day and has coached three state-level recitation winners.', active: true },
    { id: 6, name: 'Deepa Rangarajan', desig: 'Computer science teacher', dept: 'Computer science', qual: 'B.E. Computer Science, PGDE', exp: 9, classes: 'Grades 1 to 5', subjects: 'Computing, Scratch & Block Coding', note: 'Started the junior robotics club and builds coding curiosity through story-based logic.', active: true },
    { id: 7, name: 'Samuel Peter', desig: 'Physical education instructor', dept: 'Physical education', qual: 'B.P.Ed., NIS football certification', exp: 14, classes: 'Nursery to Grade 5', subjects: 'Games, Athletics, Junior Football', note: 'Former district-level footballer. Runs the morning sports exercises before assembly.', active: true },
    { id: 8, name: 'Meenakshi Iyer', desig: 'Art and craft teacher', dept: 'Arts and music', qual: 'B.F.A., Diploma in Art Education', exp: 8, classes: 'Nursery to Grade 5', subjects: 'Drawing, Craft, Clay modeling', note: 'Turned the corridor outside the activity room into a rotating gallery of children\u2019s artwork.', active: true },
    { id: 9, name: 'Nikhil Bhaskar', desig: 'Social studies teacher', dept: 'Social studies', qual: 'M.A. History, B.Ed.', exp: 10, classes: 'Grades 3, 4, 5', subjects: 'Social Studies, Community Awareness', note: 'Plans every field trip. Believes our neighbourhood is a textbook children can walk through.', active: true },
    { id: 10, name: 'Sunita Rao', desig: 'School counsellor & Early Childcare', dept: 'Student support', qual: 'M.Phil. Child Psychology', exp: 12, classes: 'Nursery to Grade 5', subjects: 'Wellbeing, Circle time, Emotional literacy', note: 'Available to any child or parent without an appointment. Trains staff in child protection every August.', active: true },
    { id: 11, name: 'Arjun Nair', desig: 'Music teacher', dept: 'Arts and music', qual: 'B.A. Music, Trinity Grade 8 piano', exp: 7, classes: 'Nursery to Grade 5', subjects: 'Choir, Keyboard, Rhymes & Rhythm', note: 'Conducts the junior school choir and writes original songs for the Annual Day.', active: true },
    { id: 12, name: 'Priya Chandrasekar', desig: 'Primary teacher', dept: 'Primary years', qual: 'B.Ed., Diploma in Early Childhood', exp: 6, classes: 'Grades 3, 4, 5', subjects: 'English, Mathematics', note: 'Runs the junior newsletter, printed on real newsprint four times a year.', active: false }
  ],
  ann: [
    { id: 1, cat: 'Parent meeting', title: 'Term 1 parent–teacher meeting, Nursery to Grade 5', date: '2026-10-03', expiry: '2026-10-31', startDate: '2026-09-01T08:00', endDate: '2026-10-31T23:59', pinned: true, popup: true, status: 'published', text: 'Slots of fifteen minutes, booked through the class teacher. Report cards will be handed over in person.', body: 'The Term 1 parent–teacher meeting will be held on Saturday, 3 October, from 9:00 am to 1:00 pm.\n\nEach family gets a fifteen-minute slot with the class teacher. Subject teachers will be available in the assembly hall through the morning, without appointment.\n\nReport cards are handed over in person and are not sent home in advance. If you cannot attend, please write to the class teacher before 30 September and we will arrange a call during the following week.\n\nChildren are welcome to accompany their parents and share their classroom portfolio.' },
    { id: 2, cat: 'Holiday', title: 'School closed for Ayudha Puja and Vijayadashami', date: '2026-09-28', expiry: '2026-10-21', startDate: '2026-09-25T08:00', endDate: '2026-10-22T23:59', pinned: false, popup: true, status: 'published', text: 'The campus will be closed from 19 to 21 October. Buses do not run on these days.', body: 'The school will remain closed from Monday, 19 October to Wednesday, 21 October for Ayudha Puja and Vijayadashami.\n\nSchool buses will not operate on these days. Classes resume as normal on Thursday, 22 October at 8:15 am.\n\nThe library will stay open on 21 October from 10:00 am to 1:00 pm for Grade 5 children preparing for their assessments.' },
    { id: 3, cat: 'Examination', title: 'Assessment timetable published', date: '2026-09-18', expiry: '2026-11-20', startDate: '2026-09-18T08:00', endDate: '2026-11-20T23:59', pinned: false, popup: false, status: 'published', text: 'Grades 1 to 5 term assessments begin 9 November. Continuous evaluations for Nursery & Kindergarten.', body: 'Assessment week for Grades 1 to 5 runs from Monday, 9 November to Wednesday, 18 November.\n\nPapers begin at 9:00 am and children may leave at 12:00 pm. Buses will run on the shortened timing on all assessment days.\n\nNursery, LKG, and UKG have no written exams. Their progress is assessed through playful observation and fun activities.\n\nThe detailed subject-wise timetable has been pasted into every child\u2019s diary and is also available at the office.' },
    { id: 4, cat: 'Event', title: 'Science and Craft exhibition entries open for Grades 1 to 5', date: '2026-09-15', expiry: '2026-11-28', pinned: false, status: 'published', text: 'Teams of two or three. Register with your science teacher before 24 October.', body: 'The annual science and creative projects exhibition will be held on Saturday, 28 November in the assembly hall.\n\nChildren in Grades 1 to 5 may enter in teams of two or three. Projects should explore hands-on wonder and nature questions.\n\nRegister with your science teacher before Friday, 24 October. Materials up to ₹500 per team will be reimbursed by the school.\n\nParents are welcome from 10:00 am. Showcase closes at noon.' },
    { id: 5, cat: 'Important notice', title: 'Bus route 7 timing changes from 1 October', date: '2026-09-12', expiry: '2026-10-15', pinned: false, status: 'published', text: 'The Mogappair leg now starts eight minutes earlier because of the flyover work on 100 Feet Road.', body: 'Because of the ongoing flyover work on 100 Feet Road, bus route 7 will start its Mogappair leg eight minutes earlier from Thursday, 1 October.\n\nNew pick-up times have been messaged to affected families. The evening drop will run roughly ten minutes late until the work is complete, expected by mid-November.\n\nIf your child is not at the stop at the new time, the bus will wait two minutes and then continue. Please contact the transport desk on 044 2855 3402 with any difficulty.' },
    { id: 6, cat: 'General', title: 'Library open from 7:45 am through the term', date: '2026-09-08', expiry: '2026-12-20', pinned: false, status: 'published', text: 'Children arriving early on the first bus can read or finish work in the library instead of waiting outside.', body: 'The library will open at 7:45 am on all working days for the rest of the term.\n\nChildren who arrive on the first bus are welcome to read picture books or finish drawing there instead of waiting in the corridor. A teacher is on duty throughout.\n\nBorrowing limits stay at two books for Nursery to Grade 2 and three books for Grades 3 to 5.' },
    { id: 7, cat: 'Event', title: 'Annual Day rehearsals begin 5 November', date: '2026-09-05', expiry: '2026-12-13', pinned: false, status: 'published', text: 'Every class performs. Rehearsals run in the last period twice a week, no extra hours after school.', body: 'Annual Day falls on Saturday, 12 December this year. Rehearsals begin on Thursday, 5 November.\n\nEvery class in the school performs, and every child has a part. Rehearsals are held during the last period twice a week so that no child stays back after school hours.\n\nCostume requirements will be shared by class teachers in the third week of November. The school provides all props and any costume a family would rather not buy — please just tell the class teacher.' },
    { id: 8, cat: 'Holiday', title: 'Deepavali break, 6 to 10 November', date: '2026-09-02', expiry: '2026-11-11', pinned: false, status: 'draft', text: 'Five days including the weekend. Classes resume on 11 November.', body: 'The school will be closed for Deepavali from Friday, 6 November to Tuesday, 10 November. Classes resume on Wednesday, 11 November.' },
    { id: 9, cat: 'General', title: 'New after-school reading club for Grades 2 and 3', date: '2026-08-28', expiry: '2026-12-20', pinned: false, status: 'published', text: 'Tuesdays and Thursdays, 3:40 to 4:30 pm. Twenty places, no fee.', body: 'A new reading club for Grades 2 and 3 starts on Tuesday, 6 October.\n\nIt meets on Tuesdays and Thursdays from 3:40 pm to 4:30 pm in the junior library with Ms Fatima Sheikh. There are twenty places and no fee.\n\nA late bus leaves at 4:45 pm on club days covering routes 2, 5 and 9 only. Families on other routes will need to arrange pick-up.' }
  ],
  events: [
    { id: 1, title: 'Half-yearly examinations begin', date: '2026-11-09', time: '9:00 am – 12:00 pm', loc: 'All classrooms', desc: 'Grades 1 to 5. Shortened school day, buses leave at 12:15 pm.' },
    { id: 2, title: 'Science & Craft Exhibition', date: '2026-11-28', time: '9:30 am – 1:00 pm', loc: 'Assembly hall and classrooms', desc: 'Projects from Nursery to Grade 5. Parents welcome from 10:00 am.' },
    { id: 3, title: 'Annual Day Celebrations', date: '2026-12-12', time: '5:00 pm – 8:30 pm', loc: 'School grounds, open-air stage', desc: 'Every class from Nursery to Grade 5 performs. Passes available at reception.' },
    { id: 4, title: 'Annual Sports Day', date: '2026-12-19', time: '8:00 am – 1:00 pm', loc: 'School ground and track', desc: 'Four houses, track and field events for all grades. Parents\u2019 fun relay at 12:30 pm.' },
    { id: 5, title: 'Cultural Heritage Day', date: '2027-01-23', time: '9:00 am – 2:00 pm', loc: 'Assembly hall', desc: 'Music, dance and drama in Tamil, English and Hindi. Food stalls run by parent volunteers.' },
    { id: 6, title: 'Educational Field Trip, Grades 3 to 5', date: '2027-02-06', time: '8:00 am – 4:00 pm', loc: 'DakshinaChitra Heritage & Craft Center', desc: 'Traditional crafts and folk arts workshop. Consent forms due by 25 January.' }
  ],
  ach: [
    { id: 1, student: 'Ishaan Verma', grade: 'Grade 5', comp: 'Chennai Inter-School Junior Chess Championship', result: 'Gold', date: '2026-08-22', medal: 'gold' },
    { id: 2, student: 'Grade 5 Junior Robotics Team', grade: 'Grade 5', comp: 'Tamil Nadu Junior Robotics Challenge', result: 'State finalist', date: '2026-07-30', medal: 'silver' },
    { id: 3, student: 'Ananya Pillai', grade: 'Grade 4', comp: 'District Bharatanatyam Competition', result: 'First place', date: '2026-07-11', medal: 'gold' },
    { id: 4, student: 'Christina Junior Football Squad', grade: 'Grades 4–5', comp: 'Anna Nagar Schools Junior League', result: 'Runners-up', date: '2026-06-18', medal: 'silver' },
    { id: 5, student: 'Kavya Balan', grade: 'Grade 5', comp: 'State-level Tamil Recitation', result: 'Gold', date: '2026-04-09', medal: 'gold' },
    { id: 6, student: 'Rehan Ahmed', grade: 'Grade 5', comp: 'National Primary Science Olympiad', result: 'Zonal rank 14', date: '2026-03-14', medal: 'bronze' },
    { id: 7, student: 'Grade 4 Choir', grade: 'Grade 4', comp: 'Inter-School Junior Choir Festival', result: 'Best ensemble', date: '2026-02-21', medal: 'gold' }
  ],
  albums: [
    { id: 1, name: 'Sports Day 2025', cat: 'Sports', count: 0 },
    { id: 2, name: 'Around the campus', cat: 'Campus', count: 0 },
    { id: 3, name: 'Annual Day', cat: 'Events', count: 0 },
    { id: 4, name: 'Cultural Day', cat: 'Cultural', count: 0 },
    { id: 5, name: 'Science week', cat: 'Science', count: 0 },
    { id: 6, name: 'Field trips', cat: 'Trips', count: 0 }
  ],
  gallery: [
    { id: 1,  cat: 'Campus',   album: 'Around the campus', theme: 'campus',     cap: 'The main courtyard at morning assembly',      date: '2026-09-02', h: 320 },
    { id: 2,  cat: 'Sports',   album: 'Sports Day 2025',   theme: 'football',   cap: 'Junior house final, decided in the last four minutes', date: '2026-08-29', h: 240 },
    { id: 3,  cat: 'Events',   album: 'Annual Day',        theme: 'stage',      cap: 'Grade 5 taking the stage on Annual Day',      date: '2025-12-13', h: 300 },
    { id: 4,  cat: 'Science',  album: 'Science week',      theme: 'lab',        cap: 'First look through a microscope, Grade 5',     date: '2026-07-18', h: 260 },
    { id: 5,  cat: 'Cultural', album: 'Cultural Day',      theme: 'dance',      cap: 'Bharatanatyam, Cultural Day morning',         date: '2026-01-24', h: 340 },
    { id: 6,  cat: 'Trips',    album: 'Field trips',       theme: 'trip',       cap: 'Grade 4 at the printing press in Chintadripet', date: '2026-02-07', h: 230 },
    { id: 7,  cat: 'Students', album: 'Around the campus', theme: 'students',   cap: 'Buddy reading, Grade 5 with Nursery children', date: '2026-08-12', h: 290 },
    { id: 8,  cat: 'Campus',   album: 'Around the campus', theme: 'library',    cap: 'The junior library, open from 7:45 am',       date: '2026-06-24', h: 250 },
    { id: 9,  cat: 'Sports',   album: 'Sports Day 2025',   theme: 'athletics',  cap: 'The 50 metres, under-10 heats',               date: '2025-12-20', h: 320 },
    { id: 10, cat: 'Science',  album: 'Science week',      theme: 'science',    cap: 'Building a working water filter, Grade 5',     date: '2026-07-19', h: 270 },
    { id: 11, cat: 'Events',   album: 'Annual Day',        theme: 'music',      cap: 'The choir rehearsing in the activity room',    date: '2025-11-28', h: 230 },
    { id: 12, cat: 'Students', album: 'Around the campus', theme: 'art',        cap: 'Clay work drying on the art room shelf',       date: '2026-05-16', h: 300 },
    { id: 13, cat: 'Campus',   album: 'Around the campus', theme: 'computer',   cap: 'Children exploring code in the computer lab',  date: '2026-04-02', h: 240 },
    { id: 14, cat: 'Sports',   album: 'Sports Day 2025',   theme: 'cricket',    cap: 'Junior cricket nets practice',                 date: '2026-06-11', h: 280 },
    { id: 15, cat: 'Cultural', album: 'Cultural Day',      theme: 'culture',    cap: 'Kolam competition, parents and children',      date: '2026-01-23', h: 260 },
    { id: 16, cat: 'Trips',    album: 'Field trips',       theme: 'trip',       cap: 'Grade 5 at the DakshinaChitra heritage centre', date: '2026-02-08', h: 330 },
    { id: 17, cat: 'Students', album: 'Around the campus', theme: 'reading',    cap: 'Silent reading, last period on Friday',        date: '2026-08-21', h: 240 },
    { id: 18, cat: 'Events',   album: 'Annual Day',        theme: 'stage',      cap: 'Backstage, minutes before the curtain',        date: '2025-12-13', h: 290 }
  ],
  news: [
    { id: 1, title: 'Grade 5 junior robotics team reaches the state finals', date: '2026-08-02', by: 'Ms Deepa Rangarajan', theme: 'computer', text: 'Four children, one line-following robot built from sensors and Scratch block logic. They placed fourth out of ninety-one schools in the junior division.' },
    { id: 2, title: 'The library crossed nine thousand books this month', date: '2026-07-14', by: 'Mrs Sujatha Menon', theme: 'library', text: 'Book number 9,000 was a Tamil translation of a Roald Dahl title, chosen by the Grade 4 class that raised half the money for the new shelf.' },
    { id: 3, title: 'A rooftop garden, planted entirely by Grade 5', date: '2026-06-28', by: 'Mr Joseph Mathew', theme: 'science', text: 'Twelve troughs of spinach, tomato and curry leaf. The science club is measuring growth against watering schedules and arguing about the results.' },
    { id: 4, title: 'New phonics programme shows up in Grade 2 reading', date: '2026-05-30', by: 'Ms Fatima Sheikh', theme: 'reading', text: 'Two years after we rebuilt how reading is taught in early years and Grades 1-2, the end-of-year reading profile is the strongest the school has recorded.' },
    { id: 5, title: 'Parents\u2019 committee repaints the junior corridor', date: '2026-04-19', by: 'School office', theme: 'art', text: 'Eleven families, one Sunday, forty litres of paint. The Grade 3 children designed the mural and supervised the adults closely.' }
  ],
  documents: [
    { id: 1, title: 'Admission form 2026\u201327', category: 'Admission forms', audience: 'Parents', date: '2026-06-01', desc: 'The main application form for Nursery to Grade 5. Print, fill and submit at the office along with the checklist below.', file: '', fileName: '' },
    { id: 2, title: 'Admission document checklist', category: 'Admission forms', audience: 'Parents', date: '2026-06-01', desc: 'Everything to bring with the completed application form \u2014 birth certificate, immunisation records, address proof.', file: '', fileName: '' },
    { id: 3, title: 'Fee structure 2026\u201327', category: 'Fee related', audience: 'Parents', date: '2026-06-10', desc: 'Grade-wise tuition, transport and activity fees for the academic year, with the instalment schedule.', file: '', fileName: '' },
    { id: 4, title: 'School holiday calendar', category: 'Academic', audience: 'Everyone', date: '2026-06-15', desc: 'All declared holidays, exam windows and term breaks for the current academic year.', file: '', fileName: '' },
    { id: 5, title: 'Uniform and code of conduct policy', category: 'Policies', audience: 'Everyone', date: '2026-06-05', desc: 'Dress code, comfort guidelines and general conduct expectations for young students.', file: '', fileName: '' }
  ],
  testimonials: [
    { id: 1, name: 'Priya Raghavan', child: 'Parent of a Grade 4 child', text: 'We moved Aarav here in Grade 2 because he had stopped talking about school. Six months later he was explaining the water cycle to his grandmother at dinner. That is the whole review.' },
    { id: 2, name: 'Mohammed Irfan', child: 'Parent of children in LKG and Grade 4', text: 'What I did not expect was how quickly they call. Not once has a problem reached us late. When my child was having trouble blending sounds, the teacher rang before I even knew there was a difficulty.' },
    { id: 3, name: 'Sujatha Menon', child: 'Parent of a Grade 5 graduate', text: 'Seven wonderful years from Nursery to Grade 5. She had loving teachers, a caring principal who still knows her name, and a joyful foundation. You cannot buy that kind of warmth.' },
    { id: 4, name: 'Karthik Ramanathan', child: 'Parent of a Grade 1 child', text: 'The first week of Grade 1 was harder for me than for him. The class teacher sent one photograph on the second day of him laughing at lunch. I still have it.' },
    { id: 5, name: 'Anita Dsouza', child: 'Parent of a Grade 3 child', text: 'No donation, no capitation, a transparent fee schedule and no surprise charges in three years. For a Chennai school that is worth saying out loud.' }
  ],
  enquiries: [
    { id: 1, parent: 'Vidya Shankar', child: 'Nila Shankar', grade: 'Grade 1', phone: '98401 22110', email: 'vidya.s@email.com', date: '2026-09-19', status: 'New', msg: 'Nila turns six in March. We live in Mogappair — is route 7 still running?' },
    { id: 2, parent: 'Rajesh Kumar', child: 'Advik Kumar', grade: 'Grade 5', phone: '99620 45178', email: 'rajesh.k@email.com', date: '2026-09-18', status: 'Called', msg: 'Transferring from Bengaluru in December. Is a mid-year seat possible?' },
    { id: 3, parent: 'Farida Basheer', child: 'Zoya Basheer', grade: 'Grade 3', phone: '94440 71203', email: 'farida.b@email.com', date: '2026-09-17', status: 'Visit booked', msg: 'Would like to see the school on a working day, preferably a Tuesday.' },
    { id: 4, parent: 'Ganesh Iyer', child: 'Tara Iyer', grade: 'Grade 4', phone: '90030 88214', email: 'ganesh.i@email.com', date: '2026-09-15', status: 'New', msg: 'Does the school offer Hindi from Grade 3?' },
    { id: 5, parent: 'Sneha Prabhu', child: 'Vivaan Prabhu', grade: 'LKG', phone: '87540 30119', email: 'sneha.p@email.com', date: '2026-09-11', status: 'Admitted', msg: 'Completed the interaction last week. Sending documents on Monday.' }
  ],
  clubs: [
    { name: 'Art and craft', icon: 'ic-palette', tone: 'a', text: 'Clay, finger painting, print-making and a corridor gallery that changes every month.' },
    { name: 'Choir and keyboard', icon: 'ic-music', tone: 'b', text: 'Junior voices, two keyboards and percussion instruments kids love to explore.' },
    { name: 'Bharatanatyam', icon: 'ic-sparkle', tone: 'c', text: 'Classical dance foundation from UKG up, with a visiting master on Wednesdays.' },
    { name: 'Drawing and sketching', icon: 'ic-pencil', tone: 'd', text: 'Observational drawing sessions in the garden and on the lawn.' },
    { name: 'Reading & story club', icon: 'ic-book', tone: 'e', text: 'Picture books, storytelling circles, and early dramatisation.' },
    { name: 'Little scientists club', icon: 'ic-flask', tone: 'f', text: 'The rooftop garden, nature logs, magnifying glasses, and seed experiments.' },
    { name: 'Coding & digital literacy', icon: 'ic-laptop', tone: 'a', text: 'Visual block puzzles from Grade 1, Scratch by Grade 3, junior robotics in Grade 5.' },
    { name: 'Drama and speech', icon: 'ic-mega', tone: 'b', text: 'Tamil and English skits, rhymes, and public expression circles.' },
    { name: 'Nature and gardening', icon: 'ic-heart', tone: 'c', text: 'Twelve troughs, a butterfly patch and hands-on caring for green plants.' }
  ],
  sports: [
    { name: 'Junior Football', theme: 'football', lvl: 'Grades 2–5', text: 'Two squads, foundational footwork and passing, and friendly weekend fixtures.' },
    { name: 'Cricket Nets', theme: 'cricket', lvl: 'Grades 3–5', text: 'Morning coaching sessions and an inter-house cup every February.' },
    { name: 'Throwball & Volleyball', theme: 'volleyball', lvl: 'Grades 3–5', text: 'Court behind the lawn. Builds team spirit, hand-eye coordination and agility.' },
    { name: 'Badminton', theme: 'badminton', lvl: 'Grades 2–5', text: 'Two indoor courts in the activity hall, open during recreation periods.' },
    { name: 'Athletics & Fun Track', theme: 'athletics', lvl: 'Nursery to Grade 5', text: 'Sprint fun runs, obstacle races, sack race, and relay. Everyone runs on Sports Day.' },
    { name: 'Chess & Board Games', theme: 'chess', lvl: 'Grades 1–5', text: 'Friday club ladder and friendly coaching for tactical young minds.' }
  ],
  academics: {
    early: [
      { g: 'Nursery', label: 'Nursery', focus: 'Sensory discovery, language play & social bonding', subjects: ['Pre-Reading & Phonics Sounds', 'Sensory Play', 'Art & Craft', 'Music & Rhymes', 'Outdoor Motor Play'], acts: ['Sensory tables with sand, water, and building blocks', 'Interactive story circles with puppets and big picture books', 'Motor skill development through play dough and ribbon dance', 'Healthy snack time habits and self-care skills'], size: 20, hw: 'None', teachers: 2 },
      { g: 'LKG', label: 'LKG', focus: 'Early phonics, number awareness & structured curiosity', subjects: ['Foundational English', 'Tamil Songs & Words', 'Number Readiness', 'Environmental Exploration', 'Art & Movement'], acts: ['Jolly Phonics letter recognition and sound blending', 'Counting with natural counters and beads', 'Weekly nature discovery in the campus garden', 'Show-and-tell circles to encourage clear expression'], size: 22, hw: '10 min', teachers: 2 },
      { g: 'UKG', label: 'UKG', focus: 'Sentence formation, addition basics & school confidence', subjects: ['English Literacy', 'Tamil / Hindi Basics', 'Mathematics Foundation', 'General Science', 'Creative Arts', 'Physical Play'], acts: ['Sight word mastery and early sentence writing', 'Simple addition and subtraction through market games', 'Scientific observation: planting seeds and weather tracking', 'Stage confidence during Friday morning assemblies'], size: 24, hw: '15 min', teachers: 2 }
    ],
    primary: [
      { g: 1, label: 'Grade 1', focus: 'Learning to read, learning to school', subjects: ['English', 'Tamil', 'Mathematics', 'Environmental Studies', 'Art & Craft', 'Physical Education', 'Music'], acts: ['Daily phonics in small reading groups of six', 'Number sense with counters, not worksheets', 'One outdoor lesson a week in the garden', 'Show-and-tell every Friday to build speaking confidence'], size: 26, hw: '15 min', teachers: 3 },
      { g: 2, label: 'Grade 2', focus: 'Reading on their own, writing their first stories', subjects: ['English', 'Tamil', 'Mathematics', 'Environmental Studies', 'Art & Craft', 'Physical Education', 'Music'], acts: ['Independent reading for twenty minutes daily', 'Story writing with a picture prompt each week', 'Addition and subtraction through shop games', 'Seed-to-plant observation diary over a term'], size: 27, hw: '20 min', teachers: 3 },
      { g: 3, label: 'Grade 3', focus: 'Adding Hindi and the first real projects', subjects: ['English', 'Tamil', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computing & Coding', 'Art', 'Games'], acts: ['First visual coding lessons in Scratch', 'Group project exploring our neighbourhood and community', 'Multiplication tables through rhythm and clapping', 'Library borrowing begins, two books at a time'], size: 28, hw: '30 min', teachers: 5 },
      { g: 4, label: 'Grade 4', focus: 'Writing to explain, not just to describe', subjects: ['English', 'Tamil', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computing & Coding', 'Art', 'Games'], acts: ['The Grade 4 junior newspaper, published each term', 'Fractions with paper folding and measuring tools', 'First science experiments with written observations', 'Map reading and a walking survey of the school campus'], size: 28, hw: '35 min', teachers: 6 },
      { g: 5, label: 'Grade 5', focus: 'Foundational mastery and primary graduation', subjects: ['English', 'Tamil', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computing & Coding', 'Art', 'Games'], acts: ['Rooftop garden project with weekly measurements', 'Debate and presentation practice on everyday topics', 'Mathematics mastery and problem solving before graduation', 'Full-day educational trip to historical and nature reserves'], size: 28, hw: '40 min', teachers: 6 }
    ]
  }
};

const d2 = n => String(n).padStart(2, '0');
function fmt(iso) { const d = new Date(iso + 'T00:00'); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; }
function dayOf(iso) { return d2(new Date(iso + 'T00:00').getDate()); }
function monOf(iso) { return MON[new Date(iso + 'T00:00').getMonth()].toUpperCase(); }
function scene(theme, alt) {
  const t = SCENES[theme] || SCENES.general, h = hash(theme + (alt || '')), id = 'sc' + (++uid);
  const r = n => (h * (n + 3) % 100) / 100;
  let art = '';

  if (t.kind === 'map') {
    art += `<rect width="800" height="600" fill="#EAF2FF"/>`;
    for (let i = 0; i < 7; i++) art += `<rect x="${-40 + i * 128}" y="0" width="34" height="600" fill="#fff" opacity=".85" transform="skewX(-6)"/>`;
    for (let i = 0; i < 5; i++) art += `<rect x="0" y="${40 + i * 128}" width="800" height="28" fill="#fff" opacity=".85"/>`;
    art += `<rect x="286" y="150" width="230" height="170" rx="18" fill="#C7E3FF"/>
            <rect x="60" y="360" width="180" height="120" rx="16" fill="#D8ECD6"/>
            <rect x="560" y="80" width="170" height="110" rx="16" fill="#D8ECD6"/>
            <circle cx="400" cy="270" r="54" fill="#FF7A1A" opacity=".16"/>`;
    return wrap(art, alt, id);
  }

  art += `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.b}"/><stop offset="1" stop-color="${t.a}"/></linearGradient>
      <radialGradient id="${id}r" cx=".3" cy=".2"><stop offset="0" stop-color="#fff" stop-opacity=".35"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <rect width="800" height="600" fill="url(#${id}g)"/><rect width="800" height="600" fill="url(#${id}r)"/>`;

  /* soft organic blob, unique per scene */
  const bx = 120 + r(1) * 360, by = 90 + r(2) * 200;
  art += `<path transform="translate(${bx} ${by}) scale(${1.4 + r(3) * .7})" fill="#fff" opacity=".12"
     d="M90 0c34 22 78 14 96 48s-8 72-22 108-16 74-52 84-74-24-112-34S-64 186-70 148s40-58 58-90S56-22 90 0z"/>`;

  if (t.kind === 'outdoor') {
    art += `<circle cx="${640 + r(4) * 60}" cy="${92 + r(5) * 40}" r="54" fill="${t.tint}" opacity=".95"/>`;
    art += `<path d="M0 470c120-46 210 18 320-10s180-70 300-36 180 40 180 40v136H0z" fill="#fff" opacity=".22"/>`;
    art += `<path d="M0 512c140-34 240 26 380 6s220-52 420-22v104H0z" fill="#0B1730" opacity=".22"/>`;
    for (let i = 0; i < 4; i++) {
      const x = 70 + i * 190 + r(i + 6) * 50;
      art += `<g opacity=".3"><rect x="${x - 6}" y="470" width="12" height="70" rx="6" fill="#0B1730"/>
        <circle cx="${x}" cy="452" r="${34 + r(i) * 14}" fill="#0B1730"/></g>`;
    }
  } else if (t.kind === 'indoor') {
    art += `<rect x="${96 + r(7) * 60}" y="86" width="260" height="190" rx="18" fill="#fff" opacity=".24"/>`;
    art += `<rect x="${118 + r(7) * 60}" y="108" width="216" height="146" rx="10" fill="#fff" opacity=".2"/>`;
    art += `<rect x="0" y="466" width="800" height="134" fill="#0B1730" opacity=".2"/>`;
    for (let i = 0; i < 3; i++) art += `<rect x="${80 + i * 240}" y="392" width="170" height="20" rx="10" fill="#fff" opacity=".3"/>`;
  } else {
    for (let i = 0; i < 3; i++) art += `<circle cx="${100 + i * 280 + r(i) * 80}" cy="${120 + r(i + 2) * 320}" r="${30 + r(i + 4) * 50}" fill="#fff" opacity=".14"/>`;
  }

  /* confetti */
  const cs = [[110, 160], [690, 400], [250, 470], [600, 130], [430, 90]];
  cs.forEach((c, i) => {
    const s = 12 + r(i) * 16, op = .55 + r(i) * .35;
    art += i % 2
      ? `<circle cx="${c[0]}" cy="${c[1]}" r="${s * .7}" fill="${t.tint}" opacity="${op * .8}"/>`
      : `<rect x="${c[0]}" y="${c[1]}" width="${s * 1.6}" height="${s * 1.6}" rx="${s * .5}" fill="#fff" opacity="${op * .55}" transform="rotate(${r(i) * 60} ${c[0]} ${c[1]})"/>`;
  });

  if (t.icon) {
    art += `<g transform="translate(400 300) scale(${9 + r(9) * 2})"><g transform="translate(-12 -12)">
      <use href="#${t.icon}" width="24" height="24" fill="none" stroke="#fff" stroke-width="1.3"
        stroke-linecap="round" stroke-linejoin="round" opacity=".9"/></g></g>`;
  }
  return wrap(art, alt, id);
}
function wrap(art, alt, id) {
  return `<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby="${id}t">
    <title id="${id}t">${esc(alt || 'Christina Nursery and Primary School')}</title>${art}</svg>`;
}
function avatar(name, seedKey) {
  const initials = name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const pals = [['#1D4ED8', '#7CC4FB'], ['#D14C00', '#FFC24A'], ['#0E6B5E', '#7ED8C4'], ['#5E35B1', '#B39DFF'],
                ['#0A1B3D', '#5E7FC0'], ['#AD1457', '#FFAFCF'], ['#B26A00', '#FFD277'], ['#0277BD', '#8FD4FF']];
  const h = hash(seedKey || name), p = pals[h % pals.length], id = 'av' + (++uid);
  return `<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby="${id}t">
    <title id="${id}t">Portrait placeholder for ${esc(name)}</title>
    <defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[0]}"/></linearGradient></defs>
    <rect width="200" height="200" fill="url(#${id}g)"/>
    <circle cx="${40 + h % 40}" cy="${34 + h % 26}" r="52" fill="#fff" opacity=".13"/>
    <path d="M0 152c44-22 74 10 112-6s52-34 88-28v82H0z" fill="#fff" opacity=".12"/>
    <text x="100" y="118" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="70" font-weight="600" fill="#fff" opacity=".96">${esc(initials)}</text>
  </svg>`;
}
function staffPic(s) {
  return s.photo
    ? `<img src="${s.photo}" alt="${esc(s.name)}" style="width:100%;height:100%;object-fit:cover;display:block" />`
    : avatar(s.name);
}
function mountScenes(root) {
  $$('[data-scene]', root || document).forEach(el => {
    if (el.dataset.mounted) return;
    el.dataset.mounted = '1';
    el.insertAdjacentHTML('afterbegin', el.dataset.src
      ? `<img src="${el.dataset.src}" alt="${el.dataset.alt || ''}" style="width:100%;height:100%;object-fit:cover;display:block" />`
      : scene(el.dataset.scene, el.dataset.alt));
  });
}
function toast(msg, kind) {
  const icons = { ok: 'ic-check', warn: 'ic-bell', info: 'ic-sparkle' };
  const k = kind || 'ok';
  const el = document.createElement('div');
  el.className = 'toast ' + (k === 'ok' ? '' : k);
  const parts = String(msg).split('|');
  el.innerHTML = `<span class="tic"><svg class="i i-16"><use href="#${icons[k] || 'ic-check'}"/></svg></span>
    <span><b>${esc(parts[0])}</b>${parts[1] ? `<span>${esc(parts[1])}</span>` : ''}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 4200);
}
function countUp(el) {
  const target = parseInt(el.dataset.count, 10);
  if (REDUCED) { el.textContent = target; return; }
  const dur = 850, t0 = performance.now();
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const revealer = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('[data-count]', en.target).forEach(c => { if (!c.dataset.done) { c.dataset.done = '1'; countUp(c); } });
        if (en.target.dataset.bars) drawBars();
        revealer.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 })
  : null;
function watch(root) {
  $$('.rv', root || document).forEach(el => { if (revealer) revealer.observe(el); else el.classList.add('in'); });
  $$('[data-count]').forEach(c => { if (!revealer && !c.dataset.done) { c.dataset.done = '1'; c.textContent = c.dataset.count; } });
}
function sortStores() {
  db.ann.sort((a, b) => b.date.localeCompare(a.date));
  db.events.sort((a, b) => a.date.localeCompare(b.date));
  db.ach.sort((a, b) => b.date.localeCompare(a.date));
  db.news.sort((a, b) => b.date.localeCompare(a.date));
  db.documents.sort((a, b) => b.date.localeCompare(a.date));
}
(function petals() {
  const mk = (n, r1, r2, colA, colB) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = (360 / n) * i;
      s += `<ellipse cx="32" cy="${32 - r1}" rx="${r2}" ry="${r1 * .72}" fill="${i % 2 ? colB : colA}" transform="rotate(${a} 32 32)"/>`;
    }
    return s;
  };
  ['logoPetals', 'logoPetals2', 'logoPetals3', 'logoPetals4'].forEach(id => {
    const g = document.getElementById(id);
    if (g) g.innerHTML = mk(8, 16, 7.5, '#FF7A1A', '#FFC24A');
  });
  const p = $('#petals');
  if (p) { let s = ''; for (let i = 0; i < 8; i++) s += `<i style="--rot:${i * 45}deg;animation-delay:${i * .07}s"></i>`; p.innerHTML = s; }
})();

function isAnnActive(a) {
  if (!a || a.status !== 'published') return false;
  const now = new Date().toISOString();
  if (a.startDate && now < a.startDate) return false;
  if (a.endDate && now > a.endDate) return false;
  if (a.expiry && now.slice(0, 10) > a.expiry) return false;
  return true;
}

return {
  $, $$, REDUCED, esc, hash,
  db, CATS, DEPTS, DOC_CATS, GAL_CATS, TONES, ENQ_STATES, MON, SCENES,
  d2, fmt, dayOf, monOf,
  scene, avatar, staffPic, mountScenes,
  toast, countUp, revealer, watch, sortStores,
  isAnnActive,
  uid: () => ++uid
};
})();
