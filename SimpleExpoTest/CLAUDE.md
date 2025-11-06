# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个基于 Expo 构建的 React Native EPUB 阅读器应用。应用允许用户导入、阅读和标注 EPUB 电子书，功能包括书签、可自定义颜色的文本高亮和笔记记录。

## 开发命令

### 运行应用
```bash
# 启动开发服务器
npm start

# 在 iOS 模拟器中运行
npm run ios

# 在 Android 模拟器中运行
npm run android

# 在浏览器中运行
npm run web
```

### 包管理
```bash
# 安装依赖
npm install

# 如需清除 Expo 缓存（推荐在首次运行或更改配置后使用）
npx expo start --clear
```

### 预置书籍管理

应用会在首次启动时自动导入 `src/data/` 文件夹中的 EPUB 文件到图书馆。

**添加新的预置书籍**：
1. 将 EPUB 文件放入 `src/data/` 文件夹
2. 在 `src/screens/LibraryScreen.js` 的 `PRELOADED_BOOKS` 数组中添加配置：
   ```javascript
   {
     fileName: 'book.epub',
     title: '书名',
     author: '作者',
     asset: require('../data/book.epub'),
   }
   ```
3. 清除缓存并重启：`npx expo start --clear`

**重新导入预置书籍**（测试用）：
- 长按应用中的 "My Library" 标题，选择重新导入

## 架构

### 导航结构
应用使用 React Navigation 的 Stack Navigator：
- **LibraryScreen**：入口页面，显示用户的图书收藏
- **ReaderScreen**：EPUB 阅读界面，包含导航和标注工具

导航流程：LibraryScreen → ReaderScreen（通过 route params 传递 book 对象）

### 核心数据流

**EPUB 导入与存储**：
1. 用户通过 `expo-document-picker` 选择 EPUB 文件
2. 文件通过 `expo-file-system` 复制到应用的文档目录
3. 图书元数据存储在 AsyncStorage 中，键名模式为 `@epub_reader_books`
4. 单个 EPUB 文件保留在文档目录中以供访问

**EPUB 解析**：
- `EpubParser` 类使用 `jszip` 解压 EPUB 文件
- 解析 `META-INF/container.xml` 以定位 `content.opf`
- 从 `content.opf` 提取元数据（标题、作者）和 spine（阅读顺序）
- 将所有章节内容作为 HTML 字符串加载到内存中
- 章节存储在 `chapters` 数组中，包含索引、路径和内容

**阅读进度**：
- 当前章节索引存储在 AsyncStorage：`@epub_reader_progress_{bookId}`
- 章节切换时自动保存进度
- 用户返回图书时恢复进度

**内容渲染**：
- 章节 HTML 包裹在带响应式 CSS 的样式模板中
- 在 WebView 组件中渲染以支持完整的 HTML/CSS
- 向 WebView 注入 JavaScript 以捕获文本选择事件
- WebView 通过 `window.ReactNativeWebView.postMessage()` 将消息传回 React Native

### 数据持久化

所有数据使用 AsyncStorage 存储，键名模式如下：
- `@epub_reader_books`：图书馆图书列表（数组）
- `@epub_reader_progress_{bookId}`：每本书的阅读位置（章节索引）
- `@epub_reader_bookmarks_{bookId}`：每本书的书签（对象数组）
- `@epub_reader_annotations_{bookId}`：每本书的标注/高亮（对象数组）

**书签数据结构**：
```javascript
{
  id: string,              // 基于时间戳的唯一 ID
  chapterIndex: number,    // 所在章节
  chapterTitle: string,    // 显示名称
  scrollPosition: number,  // 当前未使用
  note: string,           // 可选的用户备注
  createdAt: ISO string
}
```

**标注数据结构**：
```javascript
{
  id: string,              // 基于时间戳的唯一 ID
  chapterIndex: number,    // 所在章节
  selectedText: string,    // 高亮文本内容
  note: string,           // 可选的用户备注
  color: string,          // 高亮颜色（十六进制）
  startOffset: number,    // 文本位置（简化实现，始终为 0）
  endOffset: number,      // 文本位置（简化实现，为文本长度）
  createdAt: ISO string
}
```

### 阅读器功能

**目录导航**:
- 点击工具栏中的"Table of Contents"按钮查看所有章节
- 当前正在阅读的章节会高亮显示
- 点击任意章节可快速跳转

**章节导航**:
- 使用底部的"Previous"和"Next"按钮在章节间导航
- 阅读进度自动保存
- 重新打开书籍时恢复上次阅读位置

**调试日志**:
- 章节加载时会在控制台输出详细日志
- 帮助诊断内容加载问题
- 包括章节索引、内容长度等信息

### 已知限制

**标注渲染**：ReaderScreen 中的 `generateHtmlContent()` 函数当前未将高亮应用到渲染的 HTML。TODO 注释表明实际实现需要解析 HTML 并基于文本偏移应用高亮。标注已保存但不会在阅读视图中显示。

**文本选择偏移**：当前使用简化的偏移计算（起始位置始终为 0）。生产环境实现需要计算章节 HTML 内的实际字符偏移，以实现精确的高亮定位和渲染。

## 文件结构

```
src/
├── components/
│   ├── AnnotationList.js    # 查看/编辑标注的模态框
│   └── BookmarkList.js       # 查看/编辑书签的模态框
├── screens/
│   ├── LibraryScreen.js      # 图书馆和导入界面
│   └── ReaderScreen.js       # 带 WebView 的 EPUB 阅读器
└── utils/
    ├── bookmarkManager.js    # BookmarkManager 和 AnnotationManager 类
    └── epubParser.js         # 用于处理 EPUB 文件的 EpubParser 类
```

## 平台特性

**Expo 配置** (app.json)：
- JavaScript 引擎：Hermes（`jsEngine: "hermes"`）
- 启用新架构（`newArchEnabled: true`）
- iOS：启用平板支持
- Android：启用全面屏显示

**旧版 Expo API**：使用 `expo-file-system/legacy` 以兼容当前 Expo 版本。

## 测试 EPUB 文件

测试时请使用标准 EPUB 文件。解析器期望：
- 有效的 ZIP 结构，包含 `META-INF/container.xml`
- 在 container 中指定 Content OPF 文件位置
- 标准 EPUB 2.0/3.0 结构，包含 manifest 和 spine
