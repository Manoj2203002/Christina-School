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

  const tbody = document.getElementById('newsTableBody');
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('newsTable');
  
  const searchInput = document.getElementById('searchInput');
  const filterCat = document.getElementById('filterCategory');
  const form = document.getElementById('newsForm');
  
  const newsImage = document.getElementById('newsImage');
  const newsPreview = document.getElementById('newsPreview');
  newsImage.addEventListener('input', () => {
    newsPreview.src = newsImage.value || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  });
  
  function renderTable() {
    const all = DataStore.getAll('news');
    const search = searchInput.value.toLowerCase();
    const cat = filterCat.value;
    
    const filtered = all.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(search);
      const matchCat = cat ? n.category === cat : true;
      return matchSearch && matchCat;
    });

    if (filtered.length === 0) {
      table.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      table.style.display = 'table';
      emptyState.style.display = 'none';
      
      tbody.innerHTML = filtered.map(n => `
        <tr>
          <td>
            <strong>${n.title}</strong>
          </td>
          <td><span class="badge badge--outline">${n.category}</span></td>
          <td>${n.date}</td>
          <td>
            <span class="badge ${n.status === 'published' ? 'badge--success' : 'badge--warning'}">${n.status}</span>
          </td>
          <td>
            <button class="btn btn--icon btn--ghost btn-preview" data-id="${n.id}" title="Preview">👁️</button>
            <button class="btn btn--icon btn--ghost btn-edit" data-id="${n.id}" title="Edit">✏️</button>
            <button class="btn btn--icon btn--ghost btn-delete" data-id="${n.id}" title="Delete">🗑️</button>
          </td>
        </tr>
      `).join('');
    }
  }

  renderTable();

  searchInput.addEventListener('input', renderTable);
  filterCat.addEventListener('change', renderTable);

  document.getElementById('btnAddNews').addEventListener('click', () => {
    FormValidator.resetForm(form);
    document.getElementById('newsId').value = '';
    document.getElementById('newsStatus').value = 'draft';
    newsPreview.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    document.getElementById('modalTitle').textContent = 'Add Article';
    Modal.open('newsModal');
  });

  document.getElementById('btnCancelNews').addEventListener('click', () => {
    Modal.close('newsModal');
  });

  tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const n = DataStore.getById('news', id);
      if (n) {
        FormValidator.resetForm(form);
        document.getElementById('newsId').value = n.id;
        document.getElementById('newsTitle').value = n.title;
        document.getElementById('newsCategory').value = n.category;
        document.getElementById('newsDate').value = n.date;
        document.getElementById('newsStatus').value = n.status || 'draft';
        document.getElementById('newsShort').value = n.shortDescription;
        document.getElementById('newsContent').value = n.content;
        document.getElementById('newsImage').value = n.image || '';
        newsPreview.src = n.image || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        
        document.getElementById('modalTitle').textContent = 'Edit Article';
        Modal.open('newsModal');
      }
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('Are you sure you want to delete this article?')) {
        DataStore.delete('news', id);
        Toast.show({ message: 'Article deleted' });
        renderTable();
      }
    }
    
    const previewBtn = e.target.closest('.btn-preview');
    if (previewBtn) {
      const id = previewBtn.dataset.id;
      const n = DataStore.getById('news', id);
      if (n) {
        const previewContent = document.getElementById('previewContent');
        previewContent.innerHTML = `
          <div style="font-family: var(--font-sans);">
            <div class="text-caption text-gray" style="margin-bottom: var(--space-2);">${n.date} • ${n.category}</div>
            <h1 class="heading-2" style="margin-bottom: var(--space-4);">${n.title}</h1>
            ${n.image ? `<img src="${n.image}" style="width:100%; border-radius: var(--radius-md); margin-bottom: var(--space-6);">` : ''}
            <div class="text-lead" style="font-weight: 500; margin-bottom: var(--space-4);">${n.shortDescription}</div>
            <div class="text-body" style="white-space: pre-wrap;">${n.content}</div>
          </div>
        `;
        Modal.open('previewModal');
      }
    }
  });

  document.getElementById('btnSaveNews').addEventListener('click', () => {
    const { isValid } = FormValidator.validate(form);
    if (!isValid) return;

    const id = document.getElementById('newsId').value;
    const data = {
      title: document.getElementById('newsTitle').value,
      category: document.getElementById('newsCategory').value,
      date: document.getElementById('newsDate').value,
      status: document.getElementById('newsStatus').value,
      shortDescription: document.getElementById('newsShort').value,
      content: document.getElementById('newsContent').value,
      image: document.getElementById('newsImage').value,
      author: 'Admin'
    };

    if (id) {
      DataStore.update('news', id, data);
      Toast.show({ message: 'Article updated' });
    } else {
      DataStore.create('news', data);
      Toast.show({ message: 'Article created' });
    }
    Modal.close('newsModal');
    renderTable();
  });
});
