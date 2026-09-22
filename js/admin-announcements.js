document.addEventListener('DOMContentLoaded', async () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  await DataStore.init();
  Modal.init();

  const tbody = document.getElementById('announcementsTableBody');
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('announcementsTable');
  
  const searchInput = document.getElementById('searchInput');
  const filterCat = document.getElementById('filterCategory');
  
  const form = document.getElementById('announcementForm');
  
  function renderTable() {
    const all = DataStore.getAll('announcements');
    const search = searchInput.value.toLowerCase();
    const cat = filterCat.value;
    
    const filtered = all.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(search);
      const matchCat = cat ? a.category === cat : true;
      return matchSearch && matchCat;
    });

    if (filtered.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      table.style.display = 'table';
      emptyState.style.display = 'none';
      
      const now = new Date();
      tbody.innerHTML = filtered.map(a => {
        let isActive = false;
        if (a.status === 'published' && a.startDate && a.startTime && a.endDate && a.endTime) {
          const start = new Date(`${a.startDate}T${a.startTime}`);
          const end = new Date(`${a.endDate}T${a.endTime}`);
          if (now >= start && now <= end) {
            isActive = true;
          }
        }

        return `
          <tr>
            <td>
              <strong>${a.title}</strong>
              ${a.pinned ? '<span title="Pinned">📌</span>' : ''}
            </td>
            <td><span class="badge badge--outline">${a.category}</span></td>
            <td>${a.startDate || '-'} ${a.startTime || ''} to<br>${a.endDate || '-'} ${a.endTime || ''}</td>
            <td>
              <span class="badge ${a.status === 'published' ? 'badge--success' : 'badge--warning'}">${a.status}</span>
            </td>
            <td>
              ${isActive ? '<span class="badge badge--royal">Active Now</span>' : '<span class="badge badge--outline">Inactive</span>'}
            </td>
            <td>
              <button class="btn btn--icon btn--ghost btn-edit" data-id="${a.id}">✏️</button>
              <button class="btn btn--icon btn--ghost btn-delete" data-id="${a.id}">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  renderTable();

  searchInput.addEventListener('input', renderTable);
  filterCat.addEventListener('change', renderTable);

  document.getElementById('btnAddAnnouncement').addEventListener('click', () => {
    FormValidator.resetForm(form);
    document.getElementById('annId').value = '';
    document.getElementById('annPinned').checked = false;
    document.getElementById('modalTitle').textContent = 'Add Announcement';
    Modal.open('announcementModal');
  });

  document.getElementById('btnCancelAnn').addEventListener('click', () => {
    Modal.close('announcementModal');
  });

  tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const ann = DataStore.getById('announcements', id);
      if (ann) {
        FormValidator.resetForm(form);
        document.getElementById('annId').value = ann.id;
        document.getElementById('annTitle').value = ann.title || '';
        document.getElementById('annCategory').value = ann.category || '';
        document.getElementById('annStatus').value = ann.status || 'draft';
        document.getElementById('annDescription').value = ann.description || '';
        document.getElementById('annStartDate').value = ann.startDate || '';
        document.getElementById('annStartTime').value = ann.startTime || '';
        document.getElementById('annEndDate').value = ann.endDate || '';
        document.getElementById('annEndTime').value = ann.endTime || '';
        document.getElementById('annPinned').checked = !!ann.pinned;
        document.getElementById('modalTitle').textContent = 'Edit Announcement';
        Modal.open('announcementModal');
      }
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('Are you sure you want to delete this announcement?')) {
        DataStore.delete('announcements', id);
        Toast.show({ message: 'Announcement deleted' });
        renderTable();
      }
    }
  });

  document.getElementById('btnSaveAnn').addEventListener('click', () => {
    const { isValid } = FormValidator.validate(form);
    if (!isValid) return;

    const id = document.getElementById('annId').value;
    const data = {
      title: document.getElementById('annTitle').value,
      category: document.getElementById('annCategory').value,
      status: document.getElementById('annStatus').value,
      description: document.getElementById('annDescription').value,
      startDate: document.getElementById('annStartDate').value,
      startTime: document.getElementById('annStartTime').value,
      endDate: document.getElementById('annEndDate').value,
      endTime: document.getElementById('annEndTime').value,
      pinned: document.getElementById('annPinned').checked
    };

    if (id) {
      DataStore.update('announcements', id, data);
      Toast.show({ message: 'Announcement updated' });
    } else {
      DataStore.create('announcements', data);
      Toast.show({ message: 'Announcement created' });
    }
    Modal.close('announcementModal');
    renderTable();
  });
});
