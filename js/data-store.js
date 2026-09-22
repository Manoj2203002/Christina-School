const DataStore = {
  collections: ['staff', 'announcements', 'gallery', 'events', 'achievements', 'news', 'admissions'],
  
  async init() {
    // Check if we already have data
    const hasData = localStorage.getItem('cs_data_initialized');
    if (!hasData) {
      await this.loadSampleData();
    }
  },
  
  async loadSampleData() {
    try {
      let response = await fetch('data/sample-data.json');
      if (!response.ok) {
        response = await fetch('../data/sample-data.json');
      }
      
      if (response.ok) {
        const data = await response.json();
        this.collections.forEach(collection => {
          if (data[collection]) {
            localStorage.setItem(`cs_${collection}`, JSON.stringify(data[collection]));
          }
        });
        if (data.settings) {
          localStorage.setItem('cs_settings', JSON.stringify(data.settings));
        }
        localStorage.setItem('cs_data_initialized', 'true');
        this._dispatch('init', null);
      }
    } catch (error) {
      console.warn('Could not load sample data, initializing empty collections.', error);
      this.collections.forEach(collection => {
        localStorage.setItem(`cs_${collection}`, JSON.stringify([]));
      });
      localStorage.setItem('cs_settings', JSON.stringify({}));
      localStorage.setItem('cs_data_initialized', 'true');
    }
  },
  
  getAll(collection) {
    const data = localStorage.getItem(`cs_${collection}`);
    return data ? JSON.parse(data) : [];
  },
  
  getById(collection, id) {
    const items = this.getAll(collection);
    return items.find(item => item.id === id) || null;
  },
  
  create(collection, item) {
    const items = this.getAll(collection);
    const newItem = { ...item, id: this._generateId(collection) };
    items.push(newItem);
    this._save(collection, items);
    this._dispatch(collection, 'create', newItem);
    return newItem;
  },
  
  update(collection, id, updates) {
    const items = this.getAll(collection);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this._save(collection, items);
      this._dispatch(collection, 'update', items[index]);
      return items[index];
    }
    return null;
  },
  
  delete(collection, id) {
    const items = this.getAll(collection);
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length !== items.length) {
      this._save(collection, filtered);
      this._dispatch(collection, 'delete', { id });
      return true;
    }
    return false;
  },

  getActiveAnnouncements() {
    const all = this.getAll('announcements');
    const now = new Date();
    return all.filter(a => {
      if (a.status !== 'published') return false;
      if (!a.startDate || !a.startTime || !a.endDate || !a.endTime) return false;
      const start = new Date(`${a.startDate}T${a.startTime}`);
      const end = new Date(`${a.endDate}T${a.endTime}`);
      return now >= start && now <= end;
    });
  },
  
  getUpcomingEvents() {
    const all = this.getAll('events');
    const today = new Date();
    today.setHours(0,0,0,0);
    return all.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d >= today;
    }).sort((a,b) => new Date(a.date) - new Date(b.date));
  },
  
  getPastEvents() {
    const all = this.getAll('events');
    const today = new Date();
    today.setHours(0,0,0,0);
    return all.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d < today;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
  },
  
  getSettings() {
    const data = localStorage.getItem('cs_settings');
    return data ? JSON.parse(data) : {};
  },
  
  updateSettings(updates) {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem('cs_settings', JSON.stringify(updated));
    this._dispatch('settings', 'update', updated);
    return updated;
  },
  
  getStats() {
    const stats = {};
    this.collections.forEach(col => {
      stats[`${col}Count`] = this.getAll(col).length;
    });
    return stats;
  },
  
  async clearAll() {
    localStorage.removeItem('cs_data_initialized');
    this.collections.forEach(col => localStorage.removeItem(`cs_${col}`));
    localStorage.removeItem('cs_settings');
    await this.loadSampleData();
    this._dispatch('clearAll', 'clear', null);
  },
  
  _save(collection, items) {
    localStorage.setItem(`cs_${collection}`, JSON.stringify(items));
  },
  
  _generateId(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  _dispatch(collection, action, item) {
    const event = new CustomEvent('datastore:changed', {
      detail: { collection, action, item }
    });
    document.dispatchEvent(event);
  }
};
