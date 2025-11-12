// Electron 主进程 - 控制应用生命周期和创建窗口
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;

// 创建浏览器窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 启用预加载脚本，用于安全地暴露 API 到渲染进程
      preload: path.join(__dirname, 'preload.js'),
      // 禁用 Node.js 集成以提高安全性
      nodeIntegration: false,
      // 启用上下文隔离
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets/icon.png'), // 应用图标（可选）
  });

  // 加载应用的 index.html
  mainWindow.loadFile('index.html');

  // 打开开发者工具（调试时使用）
  // mainWindow.webContents.openDevTools();

  // 当窗口关闭时触发
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // 创建菜单
  createMenu();
}

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new');
          }
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open');
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用
app.whenReady().then(() => {
  createWindow();

  // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，
  // 通常会在应用中重新创建一个窗口
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', function () {
  // 在 macOS 上，应用通常会保持活动状态，直到用户使用 Cmd + Q 明确退出
  if (process.platform !== 'darwin') app.quit();
});

// IPC 通信示例：处理来自渲染进程的消息
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
  };
});

// 处理文件操作的 IPC
ipcMain.handle('save-data', async (event, data) => {
  console.log('保存数据:', data);
  // 这里可以添加实际的文件保存逻辑
  return { success: true, message: '数据已保存' };
});

ipcMain.handle('load-data', async () => {
  console.log('加载数据');
  // 这里可以添加实际的文件加载逻辑
  return { success: true, data: '示例数据' };
});
