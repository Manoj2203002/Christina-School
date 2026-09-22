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

  const tbody = document.getElementById('achTableBody');
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('achTable');
  
  const searchInput = document.getElementById('searchInput');
  const form = document.getElementById('achForm');
  
  function renderTable() {
    const all = DataStore.getAll('achievements');
    const search = searchInput.value.toLowerCase();
    
    const filtered = all.filter(a => {
      return a.studentName.toLowerCase().includes(search) || 
             a.competition.toLowerCase().includes(search) || 
             a.achievement.toLowerCase().includes(search);
    });

    if (filtered.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      table.style.display = 'table';
      emptyState.style.display = 'none';
      
      tbody.innerHTML = filtered.map(a => `
        <tr>
          <td>
            <div class="flex" style="align-items: center; gap: var(--space-3);">
              <img src="${a.image || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + a.studentName}" class="avatar avatar--sm" alt="">
              <div>
                <strong>${a.studentName}</strong><br>
                <span class="text-caption text-gray">${a.grade}</span>
              </div>
            </div>
          </td>
          <td>
            ${a.competition}<br>
            <span class="badge badge--outline" style="margin-top: 4px;">${a.achievement}</span>
          </td>
          <td><span class="badge badge--success">${a.result}</span></td>
          <td>${a.date}</td>
          <td>
            <button class="btn btn--icon btn--ghost btn-edit" data-id="${a.id}">✏️</button>
            <button class="btn btn--icon btn--ghost btn-delete" data-id="${a.id}">🗑️</button>
          </td>
        </tr>
      `).join('');
    }
  }

  renderTable();

  searchInput.addEventListener('input', renderTable);

  document.getElementById('btnAddAch').addEventListener('click', () => {
    FormValidator.resetForm(form);
    document.getElementById('achId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Achievement';
    Modal.open('achModal');
  });

  document.getElementById('btnCancelAch').addEventListener('click', () => {
    Modal.close('achModal');
  });

  tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const a = DataStore.getById('achievements', id);
      if (a) {
        FormValidator.resetForm(form);
        document.getElementById('achId').value = a.id;
        document.getElementById('achName').value = a.studentName;
        document.getElementById('achGrade').value = a.grade;
        document.getElementById('achComp').value = a.competition;
        document.getElementById('achTitle').value = a.achievement;
        document.getElementById('achResult').value = a.result;
        document.getElementById('achDate').value = a.date;
        document.getElementById('achDesc').value = a.description || '';
        document.getElementById('achImg').value = a.image || '';
        document.getElementById('modalTitle').textContent = 'Edit Achievement';
        Modal.open('achModal');
      }
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('Are you sure you want to delete this achievement?')) {
        DataStore.delete('achievements', id);
        Toast.show({ message: 'Achievement deleted' });
        renderTable();
      }
    }
  });

  document.getElementById('btnSaveAch').addEventListener('click', () => {
    const { isValid } = FormValidator.validate(form);
    if (!isValid) return;

    const id = document.getElementById('achId').value;
    const data = {
      studentName: document.getElementById('achName').value,
      grade: document.getElementById('achGrade').value,
      competition: document.getElementById('achComp').value,
      achievement: document.getElementById('achTitle').value,
      result: document.getElementById('achResult').value,
      date: document.getElementById('achDate').value,
      description: document.getElementById('achDesc').value,
      image: document.getElementById('achImg').value || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + document.getElementById('achName').value
    };

    if (id) {
      DataStore.update('achievements', id, data);
      Toast.show({ message: 'Achievement updated' });
    } else {
      DataStore.create('achievements', data);
      Toast.show({ message: 'Achievement added' });
    }
    Modal.close('achModal');
    renderTable();
  });
});
