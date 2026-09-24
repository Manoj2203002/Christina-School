/* ============================================================
   CHRISTINA NURSERY AND PRIMARY SCHOOL — SPA Hash Router
   ============================================================ */
'use strict';
window.Router = (function() {
  const { $ } = window.App;
  
  const cache = {};
  let currentRoute = '';
  let onRouteChange = null;
  let container = null;
  let basePath = '';
  
  // Determine base path for page loading
  function detectBasePath() {
    const loc = window.location;
    const path = loc.pathname.substring(0, loc.pathname.lastIndexOf('/') + 1);
    basePath = loc.protocol + '//' + loc.host + path;
    // For file:// protocol, we may need adjustments
    if (loc.protocol === 'file:') {
      basePath = path;
    }
  }
  
  async function loadPage(pagePath) {
    if (cache[pagePath]) return cache[pagePath];
    
    // Prioritize in-memory templates for 0ms instantaneous loading and offline/file:// support
    if (window.PAGE_TEMPLATES && window.PAGE_TEMPLATES[pagePath]) {
      cache[pagePath] = window.PAGE_TEMPLATES[pagePath];
      return cache[pagePath];
    }
    
    try {
      const resp = await fetch(pagePath);
      if (!resp.ok) throw new Error(resp.status);
      const html = await resp.text();
      cache[pagePath] = html;
      return html;
    } catch(e) {
      try {
        const url = basePath + pagePath;
        const resp2 = await fetch(url);
        if (!resp2.ok) throw new Error(resp2.status);
        const html2 = await resp2.text();
        cache[pagePath] = html2;
        return html2;
      } catch(e2) {
        if (window.PAGE_TEMPLATES && window.PAGE_TEMPLATES[pagePath]) {
          cache[pagePath] = window.PAGE_TEMPLATES[pagePath];
          return cache[pagePath];
        }
        console.warn('Router: could not load', pagePath, e, e2);
        return '<div class="wrap" style="padding:4rem 0;text-align:center"><h2 class="d3">Page not found</h2><p class="lede">The page you requested could not be loaded.</p></div>';
      }
    }
  }
  
  function getHash() {
    return (window.location.hash || '').replace(/^#\/?/, '').split('?')[0].trim() || 'home';
  }
  
  async function navigate(routes, force) {
    const hash = getHash();
    if (!force && hash === currentRoute) return;
    currentRoute = hash;
    
    // Resolve route or aliases
    const route = routes[hash] || routes['home'];
    if (!route) return;
    
    // Load page content
    if (route.page) {
      const html = await loadPage(route.page);
      if (container) {
        container.innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    
    // Call route callback
    if (route.onLoad) {
      try { route.onLoad(); } catch(err) { console.error('Route onLoad error:', err); }
    }
    
    // Notify
    if (onRouteChange) {
      try { onRouteChange(hash, route); } catch(err) { console.error('onRouteChange error:', err); }
    }
  }
  
  function init(config) {
    container = $(config.container);
    onRouteChange = config.onRouteChange || null;
    detectBasePath();
    
    const routes = config.routes;
    
    // Listen for hash and history changes
    window.addEventListener('hashchange', () => navigate(routes));
    window.addEventListener('popstate', () => navigate(routes));
    
    // Handle initial route
    let routesMap = routes;
    
    function doGo(hash) {
      const clean = (hash || '').replace(/^#\/?/, '').split('?')[0].trim() || 'home';
      const targetHash = '#/' + clean;
      try {
        if (window.location.hash !== targetHash) {
          history.pushState(null, '', targetHash);
        }
      } catch(e) {
        window.location.hash = targetHash;
      }
      currentRoute = '';
      navigate(routesMap, true);
    }

    const inst = {
      go: doGo,
      current: function() {
        return currentRoute;
      },
      reload: function() {
        currentRoute = '';
        navigate(routesMap, true);
      },
      clearCache: function() {
        Object.keys(cache).forEach(k => delete cache[k]);
      }
    };

    activeInstance = inst;
    window.Router.go = doGo;
    window.Router.reload = inst.reload;
    window.Router.current = inst.current;
    window.Router.clearCache = inst.clearCache;

    // Immediately trigger initial route navigation on startup
    const initialHash = getHash();
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      try {
        history.replaceState(null, '', '#/' + initialHash);
      } catch(e) {
        window.location.hash = '#/' + initialHash;
      }
    }
    navigate(routesMap, true);

    return inst;
  }
  
  let activeInstance = null;
  function defaultGo(hash) {
    if (activeInstance) {
      activeInstance.go(hash);
    } else {
      const clean = (hash || '').replace(/^#\/?/, '').split('?')[0].trim() || 'home';
      window.location.hash = '#/' + clean;
    }
  }

  return {
    init,
    getHash,
    loadPage,
    go: defaultGo,
    reload: () => activeInstance && activeInstance.reload(),
    current: () => currentRoute,
    clearCache: () => { Object.keys(cache).forEach(k => delete cache[k]); }
  };
})();
