const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\corpo\\Downloads\\New data\\admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');

    // Generic replacements
    content = content.replace(/Christina School Admin/g, 'Christina Nursery & Primary School Admin');
    content = content.replace(/<h2>Christina School<\/h2>/g, '<h2 style="font-size: 1.2rem;">Christina Nursery & Primary School</h2>');
    content = content.replace(/<h1 class="heading-3">Christina School<\/h1>/g, '<h1 class="heading-3">Christina Nursery & Primary School</h1>');
    content = content.replace(/Admin Portal/g, 'Where Every Child Shines');
    content = content.replace(/<p class="text-small">Where Every Child Shines<\/p>/g, '<p class="text-small">Where Every Child Shines</p>');
    
    // File-specific
    if (file === 'dashboard.html') {
        if (!content.includes('announcement-popup')) {
            const modalCode = `
<div class="modal announcement-popup" id="announcementPopup">
  <div class="modal__backdrop"></div>
  <div class="modal__container">
    <div class="modal__header">
      <h3>📢 Active Announcements</h3>
      <button class="modal__close" data-modal-close>&times;</button>
    </div>
    <div class="modal__body" id="activeAnnouncementsList">
      <!-- Dynamically populated -->
    </div>
    <div class="modal__footer">
      <button class="btn btn--primary" data-modal-close>Got It</button>
    </div>
  </div>
</div>
`;
            content = content.replace('  <script src="../js/data-store.js"', modalCode + '  <script src="../js/data-store.js"');
        }
    }

    if (file === 'staff.html') {
        const newDepts = `<option value="Administration">Administration</option>
              <option value="Tamil">Tamil</option>
              <option value="English">English</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Social Science">Social Science</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Physical Education">Physical Education</option>
              <option value="Arts">Arts</option>`;
              
        content = content.replace(/<option value="Administration">Administration<\/option>[\s\S]*?<option value="Technology">Technology<\/option>/g, newDepts);
    }

    if (file === 'announcements.html') {
        content = content.replace(/<th>Date<\/th>/, '<th>Date</th>\n                <th>Active</th>');
        
        const newCats = `<option value="Academic">Academic</option>
              <option value="Admissions">Admissions</option>
              <option value="Activities">Activities</option>
              <option value="Examination">Examination</option>
              <option value="Holiday">Holiday</option>
              <option value="General">General</option>`;
        
        content = content.replace(/<option value="Academic">Academic<\/option>[\s\S]*?<option value="General">General<\/option>/g, newCats);
              
        const oldDates = `<div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Publish Date</label>
              <input type="date" id="annPublishDate" class="form-input">
            </div>
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Expiry Date</label>
              <input type="date" id="annExpiryDate" class="form-input">
            </div>
          </div>`;
          
        const newDates = `<div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Start Date <span class="required-star">*</span></label>
              <input type="date" id="annStartDate" class="form-input" data-required="true">
            </div>
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Start Time <span class="required-star">*</span></label>
              <input type="time" id="annStartTime" class="form-input" data-required="true">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">End Date <span class="required-star">*</span></label>
              <input type="date" id="annEndDate" class="form-input" data-required="true">
            </div>
            <div class="form-group" style="flex: 1;">
              <label class="form-label">End Time <span class="required-star">*</span></label>
              <input type="time" id="annEndTime" class="form-input" data-required="true">
            </div>
          </div>`;
          
        content = content.replace(oldDates, newDates);
    }
    
    if (file === 'events.html') {
        const newCats = `<option value="Academic">Academic</option>
              <option value="Sports">Sports</option>
              <option value="Cultural">Cultural</option>
              <option value="Admissions">Admissions</option>
              <option value="Examination">Examination</option>
              <option value="General">General</option>`;
              
        content = content.replace(/<option value="Academic">Academic<\/option>[\s\S]*?<option value="General">General<\/option>/g, newCats);
    }

    if (file === 'achievements.html') {
        const newGrades = `<option value="Pre-KG">Pre-KG</option>
                <option value="LKG">LKG</option>
                <option value="UKG">UKG</option>
                <option value="1st Std">1st Std</option>
                <option value="2nd Std">2nd Std</option>
                <option value="3rd Std">3rd Std</option>
                <option value="4th Std">4th Std</option>
                <option value="5th Std">5th Std</option>
                <option value="6th Std">6th Std</option>
                <option value="7th Std">7th Std</option>
                <option value="8th Std">8th Std</option>`;
        content = content.replace(/<option value="Grade 1">Grade 1<\/option>[\s\S]*?<option value="All Grades">All Grades<\/option>/g, newGrades);
    }

    if (file === 'admissions.html') {
        const newStatus = `<option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="follow-up">Follow-up</option>
              <option value="registered">Registered</option>
              <option value="completed">Completed</option>`;
              
        content = content.replace(/<option value="new">New<\/option>[\s\S]*?<option value="completed">Completed<\/option>/g, newStatus);
              
        const newGrades = `<option value="Pre-KG">Pre-KG</option>
              <option value="LKG">LKG</option>
              <option value="UKG">UKG</option>
              <option value="1st Std">1st Std</option>
              <option value="2nd Std">2nd Std</option>
              <option value="3rd Std">3rd Std</option>
              <option value="4th Std">4th Std</option>
              <option value="5th Std">5th Std</option>
              <option value="6th Std">6th Std</option>
              <option value="7th Std">7th Std</option>
              <option value="8th Std">8th Std</option>`;
        content = content.replace(/<option value="Grade 1">Grade 1<\/option>[\s\S]*?<option value="Grade 8">Grade 8<\/option>/g, newGrades);
    }

    if (file === 'settings.html') {
        const addBoardMedium = `
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Board</label>
                <input type="text" id="setBoard" class="form-input">
              </div>
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Medium</label>
                <input type="text" id="setMedium" class="form-input">
              </div>
            </div>`;
            
        if (!content.includes('setBoard')) {
            content = content.replace(/<div class="form-group">\s*<label class="form-label">Logo URL<\/label>/, addBoardMedium + '\n            <div class="form-group">\n              <label class="form-label">Logo URL</label>');
        }
    }

    fs.writeFileSync(p, content, 'utf8');
});

console.log("HTML Updates done.");
