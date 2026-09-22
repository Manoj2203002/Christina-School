const Modal = {
  activeModals: [],
  
  init() {
    // Setup open triggers
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-modal-open]');
      if (trigger) {
        e.preventDefault();
        const modalId = trigger.getAttribute('data-modal-open');
        this.open(modalId);
      }
      
      // Setup close triggers (buttons)
      const closeBtn = e.target.closest('[data-modal-close]');
      if (closeBtn) {
        e.preventDefault();
        const modal = closeBtn.closest('.modal');
        if (modal) {
          this.close(modal.id);
        } else {
          this.closeAll();
        }
      }
      
      // Setup backdrop clicks
      if (e.target.classList.contains('modal')) {
        this.close(e.target.id);
      }
    });
    
    // ESC key to close top modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModals.length > 0) {
        this.close(this.activeModals[this.activeModals.length - 1]);
      }
    });
  },
  
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.add('modal--active');
    this.activeModals.push(modalId);
    
    if (this.activeModals.length === 1) {
      document.body.style.overflow = 'hidden';
    }
    
    // Dispatch event
    const event = new CustomEvent('modal:open', { detail: { modalId } });
    document.dispatchEvent(event);
    
    // Focus management (trap focus)
    this.trapFocus(modal);
  },
  
  close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('modal--active');
    
    this.activeModals = this.activeModals.filter(id => id !== modalId);
    
    if (this.activeModals.length === 0) {
      document.body.style.overflow = '';
    }
    
    const event = new CustomEvent('modal:close', { detail: { modalId } });
    document.dispatchEvent(event);
  },
  
  closeAll() {
    while (this.activeModals.length > 0) {
      this.close(this.activeModals[this.activeModals.length - 1]);
    }
  },
  
  trapFocus(modal) {
    const focusableElements = modal.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled])');
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    firstElement.focus();
    
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    });
  }
};
