document.addEventListener('DOMContentLoaded', async () => {
  console.log('Christina School - App Initializing...');
  
  // Initialize core modules
  Navigation.init();
  ScrollAnimations.init();
  Modal.init();
  
  // Initialize datastore (loads sample data if needed)
  if (typeof DataStore !== 'undefined') {
    await DataStore.init();
  }
  
  // Initialize page-specific modules if they exist in DOM
  if (document.querySelector('.gallery-grid')) {
    if (typeof Gallery !== 'undefined') Gallery.init();
  }
  
  // Custom Events listener examples (if you need to react to changes)
  document.addEventListener('datastore:changed', (e) => {
    // console.log('Data changed:', e.detail);
  });
  
  console.log('Christina School - App Ready');
});
