const ScrollAnimations = {
  init() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    this.setupRevealAnimations();
    this.setupCounters();
    this.setupParallax();
  },

  setupRevealAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    if (!('IntersectionObserver' in window)) {
      animatedElements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          
          const delay = el.getAttribute('data-delay');
          if (delay) {
            el.style.animationDelay = `${delay}ms`;
          }
          
          const duration = el.getAttribute('data-duration');
          if (duration) {
            el.style.animationDuration = `${duration}ms`;
          }
          
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => {
      el.classList.add('scroll-reveal');
      observer.observe(el);
    });
  },

  setupCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    if (!('IntersectionObserver' in window)) {
      counters.forEach(counter => {
        counter.textContent = counter.getAttribute('data-target');
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
      counter.textContent = '0';
      observer.observe(counter);
    });
  },

  animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target') || '0', 10);
    const duration = 2000;
    const fps = 60;
    const steps = duration / (1000 / fps);
    const increment = target / steps;
    
    let current = 0;
    
    const updateCounter = () => {
      current += increment;
      if (current < target) {
        el.textContent = Math.ceil(current).toString();
        requestAnimationFrame(updateCounter);
      } else {
        el.textContent = target.toString();
      }
    };
    
    requestAnimationFrame(updateCounter);
  },

  setupParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    if (parallaxElements.length === 0) return;
    
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      
      parallaxElements.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax') || '0.5');
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
    }, { passive: true });
  }
};
