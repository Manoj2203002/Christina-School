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

  const tbody = document.getElementById('admTableBody');
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('admTable');
  
  const searchInput = document.getElementById('searchInput');
  const filterStatus = document.getElementById('filterStatus');
  const filterGrade = document.getElementById('filterGrade');
  
  function updateStats(all) {
    const statsContainer = document.getElementById('admStats');
    if (!statsContainer) return;
    
    let n = 0, c = 0, f = 0, co = 0;
    all.forEach(a => {
      if (a.status === 'new') n++;
      if (a.status === 'contacted') c++;
      if (a.status === 'follow-up') f++;
      if (a.status === 'completed') co++;
    });
    
    statsContainer.innerHTML = `
      <div class="stat-card stat-card--royal card card--hover" style="padding: var(--space-4);">
        <div class="stat-card__number heading-2">${n}</div>
        <div class="stat-card__label text-small text-gray">New</div>
      </div>
      <div class="stat-card stat-card--orange card card--hover" style="padding: var(--space-4);">
        <div class="stat-card__number heading-2">${c}</div>
        <div class="stat-card__label text-small text-gray">Contacted</div>
      </div>
      <div class="stat-card stat-card--sky card card--hover" style="padding: var(--space-4);">
        <div class="stat-card__number heading-2">${f}</div>
        <div class="stat-card__label text-small text-gray">Follow-up</div>
      </div>
      <div class="stat-card stat-card--navy card card--hover" style="padding: var(--space-4);">
        <div class="stat-card__number heading-2">${co}</div>
        <div class="stat-card__label text-small text-gray">Completed</div>
      </div>
    `;
  }
  
  function getBadgeClass(status) {
    switch(status) {
      case 'new': return 'badge--info';
      case 'contacted': return 'badge--orange';
      case 'follow-up': return 'badge--warning';
      case 'registered': return 'badge--primary';
      case 'completed': return 'badge--success';
      default: return 'badge--outline';
    }
  }

  function renderTable() {
    const all = DataStore.getAll('admissions');
    updateStats(all);
    
    const search = searchInput.value.toLowerCase();
    const st = filterStatus.value;
    const grd = filterGrade.value;
    
    const filtered = all.filter(a => {
      const matchSearch = a.studentName.toLowerCase().includes(search) || a.parentName.toLowerCase().includes(search) || a.email.toLowerCase().includes(search);
      const matchStatus = st ? a.status === st : true;
      const matchGrade = grd ? a.grade === grd : true;
      return matchSearch && matchStatus && matchGrade;
    });

    if (filtered.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      table.style.display = 'table';
      emptyState.style.display = 'none';
      
      tbody.innerHTML = filtered.map(a => `
        <tr>
          <td><strong>${a.studentName}</strong></td>
          <td>
            ${a.parentName}<br>
            <span class="text-caption text-gray">${a.phone}</span><br>
            <span class="text-caption text-gray">${a.email}</span>
          </td>
          <td><span class="badge badge--outline">${a.grade}</span></td>
          <td>${a.date}</td>
          <td>
            <span class="badge ${getBadgeClass(a.status)}">${a.status}</span>
          </td>
          <td>
            <button class="btn btn--icon btn--ghost btn-view" data-id="${a.id}" title="View Details">👁️</button>
            <button class="btn btn--icon btn--ghost btn-status" data-id="${a.id}" title="Update Status">📝</button>
            <button class="btn btn--icon btn--ghost btn-delete" data-id="${a.id}" title="Delete">🗑️</button>
          </td>
        </tr>
      `).join('');
    }
  }

  renderTable();

  searchInput.addEventListener('input', renderTable);
  filterStatus.addEventListener('change', renderTable);
  filterGrade.addEventListener('change', renderTable);

  tbody.addEventListener('click', (e) => {
    const statusBtn = e.target.closest('.btn-status');
    if (statusBtn) {
      const id = statusBtn.dataset.id;
      const a = DataStore.getById('admissions', id);
      if (a) {
        document.getElementById('statusId').value = a.id;
        document.getElementById('updateStatus').value = a.status;
        document.getElementById('updateNotes').value = a.notes || '';
        Modal.open('statusModal');
      }
    }
    
    const viewBtn = e.target.closest('.btn-view');
    if (viewBtn) {
      const id = viewBtn.dataset.id;
      const a = DataStore.getById('admissions', id);
      if (a) {
        document.getElementById('detailsContent').innerHTML = `
          <div class="grid grid--2" style="gap: var(--space-4);">
            <div>
              <p class="text-caption text-gray">Student Name</p>
              <p class="text-body" style="font-weight: 500;">${a.studentName}</p>
            </div>
            <div>
              <p class="text-caption text-gray">Applying for Grade</p>
              <p class="text-body" style="font-weight: 500;">${a.grade}</p>
            </div>
            <div>
              <p class="text-caption text-gray">Parent Name</p>
              <p class="text-body" style="font-weight: 500;">${a.parentName}</p>
            </div>
            <div>
              <p class="text-caption text-gray">Enquiry Date</p>
              <p class="text-body" style="font-weight: 500;">${a.date}</p>
            </div>
            <div>
              <p class="text-caption text-gray">Email</p>
              <p class="text-body" style="font-weight: 500;">${a.email}</p>
            </div>
            <div>
              <p class="text-caption text-gray">Phone</p>
              <p class="text-body" style="font-weight: 500;">${a.phone}</p>
            </div>
            <div style="grid-column: 1 / -1;">
              <p class="text-caption text-gray">Status</p>
              <p><span class="badge ${getBadgeClass(a.status)}">${a.status}</span></p>
            </div>
            <div style="grid-column: 1 / -1;">
              <p class="text-caption text-gray">Notes / Background</p>
              <p class="text-body" style="background: var(--gray-50); padding: var(--space-3); border-radius: var(--radius-sm);">${a.notes || 'No notes provided.'}</p>
            </div>
          </div>
        `;
        Modal.open('detailsModal');
      }
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('Are you sure you want to delete this enquiry?')) {
        DataStore.delete('admissions', id);
        Toast.show({ message: 'Enquiry deleted' });
        renderTable();
      }
    }
  });

  document.getElementById('btnCancelStatus').addEventListener('click', () => {
    Modal.close('statusModal');
  });
  
  document.getElementById('btnCloseDetails').addEventListener('click', () => {
    Modal.close('detailsModal');
  });

  document.getElementById('btnSaveStatus').addEventListener('click', () => {
    const id = document.getElementById('statusId').value;
    const a = DataStore.getById('admissions', id);
    if (a) {
      const data = {
        ...a,
        status: document.getElementById('updateStatus').value,
        notes: document.getElementById('updateNotes').value
      };
      DataStore.update('admissions', id, data);
      Toast.show({ message: 'Status updated' });
      Modal.close('statusModal');
      renderTable();
    }
  });
});
