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

  const container = document.getElementById('galleryContainer');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterAlbum = document.getElementById('filterAlbum');
  const form = document.getElementById('galleryForm');
  const urlInput = document.getElementById('galUrl');
  const preview = document.getElementById('galPreview');
  
  urlInput.addEventListener('input', () => {
    preview.src = urlInput.value || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  });
  
  function renderGallery() {
    const all = DataStore.getAll('gallery');
    const search = searchInput.value.toLowerCase();
    const album = filterAlbum.value;
    
    const filtered = all.filter(g => {
      const matchSearch = g.caption?.toLowerCase().includes(search) || g.album?.toLowerCase().includes(search);
      const matchAlbum = album ? g.album === album : true;
      return matchSearch && matchAlbum;
    });

    if (filtered.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      container.style.display = 'grid';
      emptyState.style.display = 'none';
      
      container.innerHTML = filtered.map(g => `
        <div class="gallery-item">
          <img src="${g.src}" alt="${g.alt || 'Gallery image'}" class="gallery-item__img">
          <div class="gallery-item__actions">
            <button class="btn btn--icon btn--ghost btn-edit" data-id="${g.id}">✏️</button>
            <button class="btn btn--icon btn--ghost btn-delete" data-id="${g.id}">🗑️</button>
          </div>
          <div class="gallery-item__content">
            <div class="text-small text-gray">${g.album} • ${g.category}</div>
            <div class="text-small" style="margin-top: 4px; font-weight: 500;">${g.caption}</div>
            <div class="text-caption text-gray" style="margin-top: 4px;">Status: ${g.status}</div>
          </div>
        </div>
      `).join('');
    }
  }

  renderGallery();

  searchInput.addEventListener('input', renderGallery);
  filterAlbum.addEventListener('change', renderGallery);

  document.getElementById('btnAddImage').addEventListener('click', () => {
    FormValidator.resetForm(form);
    document.getElementById('galId').value = '';
    document.getElementById('galStatus').value = 'published';
    preview.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    document.getElementById('modalTitle').textContent = 'Add Image';
    Modal.open('galleryModal');
  });

  document.getElementById('btnCancelGal').addEventListener('click', () => {
    Modal.close('galleryModal');
  });

  container.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const g = DataStore.getById('gallery', id);
      if (g) {
        FormValidator.resetForm(form);
        document.getElementById('galId').value = g.id;
        document.getElementById('galUrl').value = g.src;
        document.getElementById('galAlbum').value = g.album;
        document.getElementById('galCategory').value = g.category || 'Academics';
        document.getElementById('galCaption').value = g.caption;
        document.getElementById('galAlt').value = g.alt;
        document.getElementById('galStatus').value = g.status || 'published';
        preview.src = g.src;
        document.getElementById('modalTitle').textContent = 'Edit Image';
        Modal.open('galleryModal');
      }
    }

    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('Are you sure you want to delete this image?')) {
        DataStore.delete('gallery', id);
        Toast.show({ message: 'Image deleted' });
        renderGallery();
      }
    }
  });

  document.getElementById('btnSaveGal').addEventListener('click', () => {
    const { isValid } = FormValidator.validate(form);
    if (!isValid) return;

    const id = document.getElementById('galId').value;
    const data = {
      src: document.getElementById('galUrl').value,
      album: document.getElementById('galAlbum').value,
      category: document.getElementById('galCategory').value,
      caption: document.getElementById('galCaption').value,
      alt: document.getElementById('galAlt').value,
      status: document.getElementById('galStatus').value,
      date: new Date().toISOString().split('T')[0]
    };

    if (id) {
      DataStore.update('gallery', id, data);
      Toast.show({ message: 'Image updated' });
    } else {
      DataStore.create('gallery', data);
      Toast.show({ message: 'Image added' });
    }
    Modal.close('galleryModal');
    renderGallery();
  });
});
