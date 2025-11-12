# Electron 教程应用

这是一个完整的 Electron 入门教程项目，展示如何使用 Electron 构建跨平台桌面应用，并集成 Supabase 作为后端服务。

## 目录

- [简介](#简介)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [核心概念](#核心概念)
- [Supabase 集成](#supabase-集成)
- [开发指南](#开发指南)
- [打包部署](#打包部署)
- [常见问题](#常见问题)

## 简介

Electron 是一个使用 JavaScript、HTML 和 CSS 构建跨平台桌面应用的框架。使用 Electron，你可以使用 Web 技术创建可在 Windows、macOS 和 Linux 上运行的原生应用。

**本教程包含：**
- 完整的 Electron 应用架构
- 主进程与渲染进程通信
- 安全的 API 暴露机制
- 应用菜单和窗口管理
- Supabase 后端集成示例
- 现代化的 UI 设计

## 快速开始

### 前置要求

- Node.js (推荐 v16 或更高版本)
- npm 或 yarn
- 代码编辑器 (推荐 VS Code)

### 安装依赖

```bash
cd electron-tutorial
npm install
```

### 运行应用

```bash
npm start
```

### 开发模式（启用调试）

```bash
npm run dev
```

## 项目结构

```
electron-tutorial/
├── main.js              # 主进程 - 控制应用生命周期
├── preload.js           # 预加载脚本 - 安全桥梁
├── renderer.js          # 渲染进程 - UI 逻辑
├── index.html           # 应用界面
├── styles.css           # 样式文件
├── package.json         # 项目配置
└── README.md            # 本文档
```

### 文件说明

#### 1. main.js (主进程)

主进程是 Electron 应用的入口点，负责：
- 创建和管理窗口
- 应用生命周期管理
- 菜单创建
- IPC 通信处理

```javascript
// 创建窗口示例
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
```

#### 2. preload.js (预加载脚本)

预加载脚本在渲染进程加载前运行，用于安全地暴露 API：

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
});
```

#### 3. renderer.js (渲染进程)

渲染进程处理用户界面和交互：

```javascript
// 调用主进程 API
const version = await window.electronAPI.getAppVersion();
console.log('App version:', version);
```

## 核心概念

### 1. 进程模型

Electron 使用多进程架构：

- **主进程 (Main Process)**: 一个 Node.js 进程，管理应用生命周期
- **渲染进程 (Renderer Process)**: Chromium 进程，显示 Web 页面

### 2. 进程间通信 (IPC)

使用 `ipcMain` 和 `ipcRenderer` 在进程间通信：

**主进程 (main.js):**
```javascript
ipcMain.handle('get-data', async () => {
  return { message: 'Hello from main process' };
});
```

**渲染进程 (renderer.js):**
```javascript
const data = await window.electronAPI.getData();
```

### 3. 安全性

遵循 Electron 安全最佳实践：

- ✅ `nodeIntegration: false` - 禁用 Node.js 集成
- ✅ `contextIsolation: true` - 启用上下文隔离
- ✅ 使用 `contextBridge` 暴露 API
- ✅ 验证所有 IPC 消息
- ✅ 使用 CSP (内容安全策略)

## Supabase 集成

Supabase 是一个开源的 Firebase 替代品，提供数据库、认证、存储等服务。

### 安装 Supabase 客户端

```bash
npm install @supabase/supabase-js
```

### 配置 Supabase

1. 访问 [Supabase](https://supabase.com/) 创建项目
2. 获取项目 URL 和 API Key
3. 创建 `.env` 文件：

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

### 在主进程中集成 Supabase

**main.js:**
```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 处理数据库查询
ipcMain.handle('supabase-query', async (event, { table, operation, data }) => {
  try {
    let result;

    switch(operation) {
      case 'select':
        result = await supabase.from(table).select('*');
        break;
      case 'insert':
        result = await supabase.from(table).insert(data);
        break;
      case 'update':
        result = await supabase.from(table).update(data).eq('id', data.id);
        break;
      case 'delete':
        result = await supabase.from(table).delete().eq('id', data.id);
        break;
    }

    return { success: true, data: result.data, error: result.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### 在渲染进程中使用 Supabase

**renderer.js:**
```javascript
// 查询数据
async function fetchUsers() {
  const result = await window.supabaseAPI.query('users', 'select', null);

  if (result.success) {
    console.log('Users:', result.data);
  } else {
    console.error('Error:', result.error);
  }
}

// 插入数据
async function createUser(userData) {
  const result = await window.supabaseAPI.query('users', 'insert', userData);

  if (result.success) {
    console.log('User created:', result.data);
  }
}
```

### Supabase 认证示例

**main.js:**
```javascript
// 登录
ipcMain.handle('supabase-signin', async (event, { email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  return { data, error };
});

// 登出
ipcMain.handle('supabase-signout', async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
});

// 获取当前用户
ipcMain.handle('supabase-get-user', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return { user };
});
```

### 实时订阅

```javascript
// 在主进程中设置实时订阅
const channel = supabase
  .channel('db-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'users' },
    (payload) => {
      // 发送更新到渲染进程
      mainWindow.webContents.send('db-update', payload);
    }
  )
  .subscribe();

// 在渲染进程中监听
window.electronAPI.onDbUpdate((event, payload) => {
  console.log('Database updated:', payload);
  // 更新 UI
});
```

## 开发指南

### 调试技巧

1. **打开开发者工具**
   - 在应用中按 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Option+I` (macOS)
   - 或在菜单中选择: 视图 -> 开发者工具

2. **主进程调试**
   ```bash
   npm run dev
   # 然后在 Chrome 中打开 chrome://inspect
   ```

3. **日志输出**
   ```javascript
   console.log('Debug info:', data);
   ```

### 环境变量

创建 `.env` 文件管理环境变量：

```env
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
NODE_ENV=development
```

使用 `dotenv` 包加载：
```javascript
require('dotenv').config();
```

### 最佳实践

1. **安全性**
   - 永远不要在渲染进程中暴露完整的 Node.js API
   - 使用 `contextBridge` 限制 API 访问
   - 验证所有来自渲染进程的输入

2. **性能优化**
   - 使用 `webPreferences.preload` 提前加载脚本
   - 避免在渲染进程中进行重计算
   - 使用 `BrowserWindow.webContents.send()` 批量发送数据

3. **代码组织**
   - 将业务逻辑放在主进程
   - 保持渲染进程轻量化
   - 使用模块化代码结构

## 打包部署

### 安装打包工具

```bash
npm install --save-dev electron-builder
```

### 配置 package.json

```json
{
  "build": {
    "appId": "com.example.electron-tutorial",
    "productName": "Electron Tutorial",
    "directories": {
      "output": "dist"
    },
    "files": [
      "**/*",
      "!**/node_modules/**/*",
      "!**/*.md"
    ],
    "mac": {
      "category": "public.app-category.developer-tools",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  },
  "scripts": {
    "build": "electron-builder",
    "build:mac": "electron-builder --mac",
    "build:win": "electron-builder --win",
    "build:linux": "electron-builder --linux"
  }
}
```

### 构建应用

```bash
# 构建当前平台
npm run build

# 构建特定平台
npm run build:mac
npm run build:win
npm run build:linux
```

## 常见问题

### Q: 如何访问文件系统？

A: 在主进程中使用 Node.js 的 `fs` 模块，通过 IPC 暴露给渲染进程：

```javascript
// main.js
const fs = require('fs').promises;

ipcMain.handle('read-file', async (event, filePath) => {
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
});
```

### Q: 如何处理应用更新？

A: 使用 `electron-updater` 实现自动更新：

```bash
npm install electron-updater
```

```javascript
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

### Q: 如何创建系统托盘？

A: 使用 `Tray` API：

```javascript
const { Tray, Menu } = require('electron');

let tray = new Tray('/path/to/icon.png');
const contextMenu = Menu.buildFromTemplate([
  { label: '显示', click: () => { mainWindow.show(); } },
  { label: '退出', click: () => { app.quit(); } }
]);
tray.setContextMenu(contextMenu);
```

### Q: Supabase 连接失败怎么办？

A: 检查以下几点：
1. 确认 Supabase URL 和 API Key 正确
2. 检查网络连接
3. 确认项目配置正确
4. 查看控制台错误信息

```javascript
// 添加错误处理
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  console.log('Data:', data);
} catch (error) {
  console.error('Supabase error:', error.message);
}
```

## 学习资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [Electron API 参考](https://www.electronjs.org/docs/api)
- [Supabase 文档](https://supabase.com/docs)
- [Electron 安全指南](https://www.electronjs.org/docs/tutorial/security)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**祝你学习愉快！** 🚀

如果这个教程对你有帮助，请给个 ⭐️ Star！
