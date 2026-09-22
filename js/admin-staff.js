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

  const tbody = document.getElementById('staffTableBody');
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('staffTable');
  
  const searchInput = document.getElementById('searchInput');
  const filterDept = document.getElementById('filterDepartment');
  
  const form = document.getElementById('staffForm');
  
  function renderTable() {
    const allStaff = DataStore.getAll('staff');
    const search = searchInput.value.toLowerCase();
    const dept = filterDept.value;
    
    const filtered = allStaff.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search) || s.email.toLowerCase().includes(search);
      const matchDept = dept ? s.department === dept : true;
      return matchSearch && matchDept;
    });

    if (filtered.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      table.style.display = 'table';
      emptyState.style.display = 'none';
      
      tbody.innerHTML = filtered.map(s => `
        <tr>
          <td><img src="${s.photo || 'https://api.dicebear.com/7.x/lorelei/svg?seed=' + s.name}" class="avatar avatar--sm" alt="${s.name}"></td>
          <td><strong>${s.name}</strong><br><span class="text-caption text-gray">${s.email}</span></td>
          <td>${s.designation}</td>
          <td><span class="badge badge--outline">${s.department}</span></td>
          <td>
            <span class="badge ${s.status === 'active' ? 'badge--success' : (s.status === 'on-leave' ? 'badge--warning' : 'badge--danger')}">${s.status}</span>
          </td>
          <td>
            <button class="btn btn--icon btn--ghost btn-edit" data-id="${s.id}">✏️</button>
            <button class="btn btn--icon btn--ghost btn-delete" data-id="${s.id}">🗑️</button>
          </td>
        </tr>
      `).join('');
    }
  }

  renderTable();

  searchInput.addEventListener('input', renderTable);
  filterDept.addEventListener('change', renderTable);

  document.getElementById('btnAddStaff').addEventListener('click', () => {
    FormValidator.resetForm(form);
    document.getElementById('staffId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Staff';
    Modal.open('staffModal');
  });

  document.getElementById('btnCancelStaff').addEventListener('click', () => {
    Modal.close('staffModal');
  });

  tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const staff = DataStore.getById('staff', id);
      if (staff) {
        FormValidator.resetForm(form);
        document.getElementById('staffId').value = staff.id;
        document.getElementById('staffName').value = staff.name;
        document.getElementById('staffDesignation').value = staff.designation;
        document.getElementById('staffDepartment').value = staff.department;
        document.getElementById('staffStatus').value = staff.status || 'active';
        document.getElementById('staffEmail').value = staff.email;
        document.getElementById('staffPhone').value = staff.phone;
        document.getElementById('staffBio').value = staff.bio || '';
        document.getElementById('staffPhoto').value = staff.photo || '';
        document.getElementById('modalTitle').textContent = 'Edit Staff';
        Modal.open('staffModal');
      }
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('Are you sure you want to delete this staff member?')) {
        DataStore.delete('staff', id);
        Toast.show({ message: 'Staff deleted successfully' });
        renderTable();
      }
    }
  });

  document.getElementById('btnSaveStaff').addEventListener('click', () => {
    const { isValid } = FormValidator.validate(form);
    if (!isValid) return;

    const id = document.getElementById('staffId').value;
    const staffData = {
      name: document.getElementById('staffName').value,
      designation: document.getElementById('staffDesignation').value,
      department: document.getElementById('staffDepartment').value,
      status: document.getElementById('staffStatus').value,
      email: document.getElementById('staffEmail').value,
      phone: document.getElementById('staffPhone').value,
      bio: document.getElementById('staffBio').value,
      photo: document.getElementById('staffPhoto').value || 'https://api.dicebear.com/7.x/lorelei/svg?seed=' + document.getElementById('staffName').value,
    };

    if (id) {
      DataStore.update('staff', id, staffData);
      Toast.show({ message: 'Staff updated successfully' });
    } else {
      DataStore.create('staff', staffData);
      Toast.show({ message: 'Staff added successfully' });
    }
    Modal.close('staffModal');
    renderTable();
  });
});
