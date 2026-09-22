document.addEventListener('DOMContentLoaded', async () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  await DataStore.init();

  const form = document.getElementById('settingsForm');
  const logoInput = document.getElementById('setLogo');
  const logoPreview = document.getElementById('logoPreview');
  
  logoInput.addEventListener('input', () => {
    logoPreview.src = logoInput.value || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  });
  
  function loadSettings() {
    const s = DataStore.getSettings();
    if (s) {
      document.getElementById('setSchoolName').value = s.schoolName || 'Christina Nursery & Primary School';
      document.getElementById('setTagline').value = s.tagline || 'Where Every Child Shines';
      document.getElementById('setLogo').value = s.logo || '';
      logoPreview.src = s.logo || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
      
      document.getElementById('setAddress').value = s.address || 'Rasipuram Main Road, Gopalapuram, Attur, Salem, Tamil Nadu - 636102';
      document.getElementById('setPhone').value = s.phone || '+91 4282 123456';
      document.getElementById('setEmail').value = s.email || 'info@christinanps.edu.in';
      document.getElementById('setTimings').value = s.timings || 'Mon-Fri 9:00 AM - 4:00 PM, Sat 9:00 AM - 1:00 PM';
      
      if (document.getElementById('setBoard')) document.getElementById('setBoard').value = s.board || 'Tamil Nadu State Board';
      if (document.getElementById('setMedium')) document.getElementById('setMedium').value = s.medium || 'English';

      document.getElementById('setFacebook').value = s.socialMedia?.facebook || '';
      document.getElementById('setInstagram').value = s.socialMedia?.instagram || '';
      document.getElementById('setTwitter').value = s.socialMedia?.twitter || '';
      document.getElementById('setYoutube').value = s.socialMedia?.youtube || '';
      document.getElementById('setWhatsapp').value = s.whatsapp || '+91 4282 123456';
      
      document.getElementById('setAdmissionStatus').value = s.admissionStatus || 'open';
      document.getElementById('setAcademicYear').value = s.academicYear || '2026-2027 (April to March)';
    }
  }

  loadSettings();

  document.getElementById('btnResetSettings').addEventListener('click', () => {
    loadSettings();
    Toast.show({ message: 'Settings reset to last saved state', type: 'info' });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { isValid } = FormValidator.validate(form);
    if (!isValid) return;

    const btn = document.getElementById('btnSaveSettings');
    const originalText = btn.textContent;
    btn.classList.add('btn--loading');
    btn.textContent = 'Saving...';

    const updates = {
      schoolName: document.getElementById('setSchoolName').value,
      tagline: document.getElementById('setTagline').value,
      logo: document.getElementById('setLogo').value,
      board: document.getElementById('setBoard') ? document.getElementById('setBoard').value : '',
      medium: document.getElementById('setMedium') ? document.getElementById('setMedium').value : '',
      address: document.getElementById('setAddress').value,
      phone: document.getElementById('setPhone').value,
      email: document.getElementById('setEmail').value,
      timings: document.getElementById('setTimings').value,
      socialMedia: {
        facebook: document.getElementById('setFacebook').value,
        instagram: document.getElementById('setInstagram').value,
        twitter: document.getElementById('setTwitter').value,
        youtube: document.getElementById('setYoutube').value
      },
      whatsapp: document.getElementById('setWhatsapp').value,
      admissionStatus: document.getElementById('setAdmissionStatus').value,
      academicYear: document.getElementById('setAcademicYear').value
    };

    setTimeout(() => {
      DataStore.updateSettings(updates);
      btn.classList.remove('btn--loading');
      btn.textContent = originalText;
      Toast.show({ message: 'Settings saved successfully' });
    }, 500); // simulate network request delay for UX
  });
});
