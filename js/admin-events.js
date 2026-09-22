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

  const tbody = document.getElementById('eventsTableBody');
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('eventsTable');
  
  const searchInput = document.getElementById('searchInput');
  const filterCat = document.getElementById('filterCategory');
  const filterStatus = document.getElementById('filterStatus');
  
  const form = document.getElementById('eventForm');
  
  function renderTable() {
    const all = DataStore.getAll('events');
    const search = searchInput.value.toLowerCase();
    const cat = filterCat.value;
    const status = filterStatus.value;
    
    const filtered = all.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(search);
      const matchCat = cat ? e.category === cat : true;
      const matchStatus = status ? e.status === status : true;
      return matchSearch && matchCat && matchStatus;
    });

    if (filtered.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      table.style.display = 'table';
      emptyState.style.display = 'none';
      
      tbody.innerHTML = filtered.map(e => `
        <tr>
          <td>
            <strong>${e.name}</strong><br>
            <span class="badge badge--outline" style="margin-top: 4px;">${e.category}</span>
          </td>
          <td>
            ${e.date}<br>
            <span class="text-caption text-gray">${e.startTime} - ${e.endTime}</span>
          </td>
          <td>${e.location}</td>
          <td>
            <span class="badge ${
              e.status === 'upcoming' ? 'badge--info' : 
              e.status === 'ongoing' ? 'badge--success' : 
              e.status === 'completed' ? 'badge--primary' : 'badge--warning'
            }">${e.status}</span>
          </td>
          <td>
            <button class="btn btn--icon btn--ghost btn-edit" data-id="${e.id}">✏️</button>
            <button class="btn btn--icon btn--ghost btn-delete" data-id="${e.id}">🗑️</button>
          </td>
        </tr>
      `).join('');
    }
  }

  renderTable();

  searchInput.addEventListener('input', renderTable);
  filterCat.addEventListener('change', renderTable);
  filterStatus.addEventListener('change', renderTable);

  document.getElementById('btnAddEvent').addEventListener('click', () => {
    FormValidator.resetForm(form);
    document.getElementById('eventId').value = '';
    document.getElementById('eventStatus').value = 'upcoming';
    document.getElementById('modalTitle').textContent = 'Add Event';
    Modal.open('eventModal');
  });

  document.getElementById('btnCancelEvent').addEventListener('click', () => {
    Modal.close('eventModal');
  });

  tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const ev = DataStore.getById('events', id);
      if (ev) {
        FormValidator.resetForm(form);
        document.getElementById('eventId').value = ev.id;
        document.getElementById('eventName').value = ev.name;
        document.getElementById('eventDate').value = ev.date;
        document.getElementById('eventStartTime').value = ev.startTime;
        document.getElementById('eventEndTime').value = ev.endTime;
        document.getElementById('eventLocation').value = ev.location;
        document.getElementById('eventCategory').value = ev.category || 'General';
        document.getElementById('eventStatus').value = ev.status || 'upcoming';
        document.getElementById('eventDescription').value = ev.description;
        document.getElementById('eventImage').value = ev.image || '';
        document.getElementById('modalTitle').textContent = 'Edit Event';
        Modal.open('eventModal');
      }
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('Are you sure you want to delete this event?')) {
        DataStore.delete('events', id);
        Toast.show({ message: 'Event deleted' });
        renderTable();
      }
    }
  });

  document.getElementById('btnSaveEvent').addEventListener('click', () => {
    const { isValid } = FormValidator.validate(form);
    if (!isValid) return;

    const id = document.getElementById('eventId').value;
    const data = {
      name: document.getElementById('eventName').value,
      date: document.getElementById('eventDate').value,
      startTime: document.getElementById('eventStartTime').value,
      endTime: document.getElementById('eventEndTime').value,
      location: document.getElementById('eventLocation').value,
      category: document.getElementById('eventCategory').value,
      status: document.getElementById('eventStatus').value,
      description: document.getElementById('eventDescription').value,
      image: document.getElementById('eventImage').value
    };

    if (id) {
      DataStore.update('events', id, data);
      Toast.show({ message: 'Event updated' });
    } else {
      DataStore.create('events', data);
      Toast.show({ message: 'Event added' });
    }
    Modal.close('eventModal');
    renderTable();
  });
});
