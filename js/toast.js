const Toast = {
  container: null,
  
  init() {
    this.container = document.querySelector('.toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  
  show({ message, type = 'success', duration = 3000 }) {
    if (!this.container) this.init();
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    
    let icon = '';
    switch (type) {
      case 'success': icon = '✓'; break;
      case 'error': icon = '✕'; break;
      case 'warning': icon = '⚠'; break;
      case 'info': icon = 'ℹ'; break;
    }
    
    toast.innerHTML = `
      <div class="toast__icon" style="font-weight: bold; font-size: 1.25rem;">${icon}</div>
      <div class="toast__content">
        <p class="text-small" style="margin: 0; color: var(--navy-900); font-weight: 600;">${message}</p>
      </div>
      <button class="toast__close" aria-label="Close toast">✕</button>
      <div class="toast__progress"></div>
    `;
    
    this.container.appendChild(toast);
    
    // Animate progress bar
    const progress = toast.querySelector('.toast__progress');
    progress.style.transition = `width ${duration}ms linear`;
    
    // Trigger reflow to ensure animation runs
    toast.offsetHeight;
    progress.style.width = '0%';
    
    // Setup close
    const closeBtn = toast.querySelector('.toast__close');
    let timeout;
    
    const closeToast = () => {
      toast.style.animation = 'slideInRight 0.3s reverse forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    };
    
    closeBtn.addEventListener('click', () => {
      clearTimeout(timeout);
      closeToast();
    });
    
    timeout = setTimeout(closeToast, duration);
  }
};
