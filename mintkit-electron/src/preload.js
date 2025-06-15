const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  
  getPerformanceMetrics: () => {
    return {
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: Date.now()
    };
  },

  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (content) => ipcRenderer.invoke('save-file', content),

  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
  getTheme: () => ipcRenderer.invoke('get-theme'),

  isDev: () => ipcRenderer.invoke('is-dev'),
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),

  onWindowStateChange: (callback) => ipcRenderer.on('window-state-changed', callback),
  onThemeChange: (callback) => ipcRenderer.on('theme-changed', callback),

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('devTools', {
    log: (...args) => console.log('[Preload]', ...args),
    error: (...args) => console.error('[Preload]', ...args),
    warn: (...args) => console.warn('[Preload]', ...args),
    
    startProfile: (name) => console.profile(name),
    endProfile: (name) => console.profileEnd(name),
    
    getMemoryUsage: () => process.memoryUsage(),
    
    time: (label) => console.time(label),
    timeEnd: (label) => console.timeEnd(label)
  });
}

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

document.addEventListener('DOMContentLoaded', () => {
  const unusedStyleSheets = Array.from(document.styleSheets).filter(sheet => {
    try {
      return sheet.cssRules.length === 0;
    } catch (e) {
      return false;
    }
  });
  
  unusedStyleSheets.forEach(sheet => {
    if (sheet.ownerNode) {
      sheet.ownerNode.remove();
    }
  });

  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
});