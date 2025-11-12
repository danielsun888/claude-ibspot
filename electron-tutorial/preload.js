// Electron 预加载脚本 - 安全地暴露 API 给渲染进程
// 这个脚本在渲染进程加载之前运行，可以访问 Node.js API
// 同时也可以访问浏览器环境

const { contextBridge, ipcRenderer } = require('electron');

// 使用 contextBridge 安全地暴露 API 到渲染进程
// 这样做比直接启用 nodeIntegration 更安全
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 获取系统信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // 保存数据
  saveData: (data) => ipcRenderer.invoke('save-data', data),

  // 加载数据
  loadData: () => ipcRenderer.invoke('load-data'),

  // 监听来自主进程的事件
  onMenuNew: (callback) => ipcRenderer.on('menu-new', callback),
  onMenuOpen: (callback) => ipcRenderer.on('menu-open', callback),
  onShowAbout: (callback) => ipcRenderer.on('show-about', callback),

  // 移除监听器（用于清理）
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),

  // Node.js 相关的实用工具
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// Supabase 集成的预加载配置
// 如果您使用 Supabase，可以在这里暴露相关的 API
contextBridge.exposeInMainWorld('supabaseAPI', {
  // 示例：暴露 Supabase 配置（实际使用时从环境变量获取）
  getConfig: () => ({
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  }),

  // 示例：数据库操作（需要在主进程中实现）
  query: (table, operation, data) =>
    ipcRenderer.invoke('supabase-query', { table, operation, data }),

  // 示例：认证操作
  signIn: (email, password) =>
    ipcRenderer.invoke('supabase-signin', { email, password }),

  signOut: () =>
    ipcRenderer.invoke('supabase-signout'),

  getUser: () =>
    ipcRenderer.invoke('supabase-get-user'),
});

// 在控制台输出日志，表示预加载脚本已加载
console.log('Preload script loaded successfully');
console.log('Platform:', process.platform);
console.log('Electron version:', process.versions.electron);
