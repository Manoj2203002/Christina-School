const Navigation = {
  init() {
    this.header = document.querySelector('.header');
    this.hamburger = document.querySelector('.nav__hamburger');
    this.mobileMenu = document.querySelector('.mobile-menu');
    this.sidebarToggle = document.querySelector('.sidebar-toggle');
    this.adminSidebar = document.querySelector('.admin-sidebar');
    
    this.setupScrollListener();
    this.setupActiveLinks();
    this.setupMobileMenu();
    this.setupDropdowns();
    this.setupSmoothScroll();
    
    if (this.sidebarToggle && this.adminSidebar) {
      this.setupAdminSidebar();
    }
  },
  
  setupScrollListener() {
    if (!this.header) return;
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        this.header.classList.add('header--scrolled');
      } else {
        this.header.classList.remove('header--scrolled');
      }
    }, { passive: true });
  },
  
  setupActiveLinks() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav__link, .admin-nav a');
    
    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href');
      // Simple matching for demo purposes
      if (linkPath && currentPath.includes(linkPath.replace('../', '').replace('./', ''))) {
        if (link.classList.contains('nav__link')) {
          link.classList.add('nav__link--active');
        } else {
          link.classList.add('active');
        }
      }
    });
  },
  
  setupMobileMenu() {
    if (!this.hamburger || !this.mobileMenu) return;
    
    this.hamburger.addEventListener('click', () => {
      const isActive = this.mobileMenu.classList.contains('mobile-menu--active');
      this.toggleMobileMenu(!isActive);
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileMenu.classList.contains('mobile-menu--active')) {
        this.toggleMobileMenu(false);
      }
    });
    
    // Close on link click
    const mobileLinks = this.mobileMenu.querySelectorAll('a:not(.nav__dropdown-toggle)');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.toggleMobileMenu(false);
      });
    });
  },
  
  toggleMobileMenu(show) {
    if (show) {
      this.mobileMenu.classList.add('mobile-menu--active');
      this.hamburger.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    } else {
      this.mobileMenu.classList.remove('mobile-menu--active');
      this.hamburger.classList.remove('is-active');
      document.body.style.overflow = '';
      
      // Close all accordions
      const openItems = this.mobileMenu.querySelectorAll('.nav__item.is-open');
      openItems.forEach(item => item.classList.remove('is-open'));
    }
  },
  
  setupDropdowns() {
    // For mobile menu accordions
    if (!this.mobileMenu) return;
    
    const dropdownItems = this.mobileMenu.querySelectorAll('.nav__item');
    dropdownItems.forEach(item => {
      const dropdown = item.querySelector('.nav__dropdown-menu');
      if (dropdown) {
        const link = item.querySelector('.nav__link');
        link.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Close others
          dropdownItems.forEach(other => {
            if (other !== item) other.classList.remove('is-open');
          });
          
          item.classList.toggle('is-open');
        });
      }
    });
  },
  
  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });
  },
  
  setupAdminSidebar() {
    this.sidebarToggle.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        this.adminSidebar.classList.toggle('admin-sidebar--mobile-open');
      } else {
        this.adminSidebar.classList.toggle('admin-sidebar--collapsed');
      }
    });
  }
};
