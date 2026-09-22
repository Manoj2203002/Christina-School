document.addEventListener('DOMContentLoaded', async () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  await DataStore.init();
  
  // Show active announcements popup once per session
  const activeAnnouncements = DataStore.getActiveAnnouncements();
  if (activeAnnouncements.length > 0 && !sessionStorage.getItem('announcementDismissed')) {
    const popup = document.getElementById('announcementPopup');
    const listArea = document.getElementById('activeAnnouncementsList');
    if (popup && listArea) {
      listArea.innerHTML = activeAnnouncements.map(a => `
        <div style="margin-bottom: var(--space-2); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-2);">
          <strong>${a.title}</strong><br>
          <small class="text-gray">${a.startDate} to ${a.endDate}</small>
        </div>
      `).join('');
      
      popup.style.display = 'block';
      
      const dismissBtn = popup.querySelector('.btn-dismiss') || popup.querySelector('[data-modal-close]');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          popup.style.display = 'none';
          sessionStorage.setItem('announcementDismissed', 'true');
        });
      }
    }
  }

  const statsContainer = document.getElementById('statsContainer');
  if (statsContainer) {
    const stats = DataStore.getStats();
    statsContainer.innerHTML = `
      <div class="stat-card stat-card--royal card card--hover" style="padding: var(--space-4);">
        <div class="stat-card__number heading-2">${stats.staffCount || 0}</div>
        <div class="stat-card__label text-small text-gray">Total Staff</div>
      </div>
      <div class="stat-card stat-card--orange card card--hover" style="padding: var(--space-4);">
        <div class="stat-card__number heading-2">${stats.announcementsCount || 0}</div>
        <div class="stat-card__label text-small text-gray">Announcements</div>
      </div>
      <div class="stat-card stat-card--navy card card--hover" style="padding: var(--space-4);">
        <div class="stat-card__number heading-2">${stats.eventsCount || 0}</div>
        <div class="stat-card__label text-small text-gray">Events</div>
      </div>
      <div class="stat-card stat-card--sky card card--hover" style="padding: var(--space-4);">
        <div class="stat-card__number heading-2">${stats.admissionsCount || 0}</div>
        <div class="stat-card__label text-small text-gray">Admission Enquiries</div>
      </div>
      <div class="stat-card stat-card--orange card card--hover" style="padding: var(--space-4);">
        <div class="stat-card__number heading-2">${stats.galleryCount || 0}</div>
        <div class="stat-card__label text-small text-gray">Gallery Images</div>
      </div>
      <div class="stat-card stat-card--royal card card--hover" style="padding: var(--space-4);">
        <div class="stat-card__number heading-2">${stats.achievementsCount || 0}</div>
        <div class="stat-card__label text-small text-gray">Achievements</div>
      </div>
    `;
  }
});
