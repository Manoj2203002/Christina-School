const Gallery = {
  init() {
    this.grid = document.querySelector('.gallery-grid');
    this.tags = document.querySelectorAll('.tag[data-filter]');
    this.lightbox = document.querySelector('.lightbox');
    
    if (!this.grid) return;
    
    this.setupFilters();
    this.setupLightbox();
  },
  
  setupFilters() {
    this.tags.forEach(tag => {
      tag.addEventListener('click', () => {
        // Update active class
        this.tags.forEach(t => t.classList.remove('tag--active'));
        tag.classList.add('tag--active');
        
        const filter = tag.getAttribute('data-filter');
        this.filterItems(filter);
      });
    });
  },
  
  filterItems(category) {
    const items = this.grid.querySelectorAll('.gallery-item');
    
    items.forEach(item => {
      const itemCategory = item.getAttribute('data-category');
      
      if (category === 'all' || itemCategory === category) {
        item.style.display = '';
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
        }, 10);
      } else {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.8)';
        setTimeout(() => {
          item.style.display = 'none';
        }, 300);
      }
    });
  },
  
  setupLightbox() {
    if (!this.lightbox) return;
    
    const img = this.lightbox.querySelector('img');
    const caption = this.lightbox.querySelector('.lightbox__caption');
    const closeBtn = this.lightbox.querySelector('.lightbox__close');
    
    let currentIndex = -1;
    let items = [];
    
    const updateLightbox = () => {
      if (currentIndex >= 0 && currentIndex < items.length) {
        const item = items[currentIndex];
        const sourceImg = item.querySelector('img');
        if (sourceImg && img) {
          img.src = sourceImg.src;
          img.alt = sourceImg.alt;
        }
        if (caption) {
          caption.textContent = sourceImg ? sourceImg.alt : '';
        }
      }
    };
    
    this.grid.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery-item');
      if (item) {
        items = Array.from(this.grid.querySelectorAll('.gallery-item')).filter(i => i.style.display !== 'none');
        currentIndex = items.indexOf(item);
        
        updateLightbox();
        this.lightbox.classList.add('lightbox--active');
        document.body.style.overflow = 'hidden';
      }
    });
    
    const closeLightbox = () => {
      this.lightbox.classList.remove('lightbox--active');
      document.body.style.overflow = '';
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) closeLightbox();
    });
    
    document.addEventListener('keydown', (e) => {
      if (!this.lightbox.classList.contains('lightbox--active')) return;
      
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : items.length - 1;
        updateLightbox();
      } else if (e.key === 'ArrowRight') {
        currentIndex = (currentIndex < items.length - 1) ? currentIndex + 1 : 0;
        updateLightbox();
      }
    });
  }
};
