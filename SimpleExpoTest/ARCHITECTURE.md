# EPUB 阅读器技术架构文档

## 1. 项目概述

### 1.1 项目简介
这是一个基于 React Native 和 Expo 开发的跨平台 EPUB 电子书阅读器应用，支持 iOS、Android 和 Web 平台。应用提供完整的阅读体验，包括图书导入、阅读、书签管理和文本标注功能。

### 1.2 技术栈
- **框架**: React Native 0.81.5 + Expo SDK 54
- **UI**: React 19.1.0 + React Native Components
- **导航**: React Navigation 7.x (Stack Navigator)
- **数据存储**: AsyncStorage
- **文件处理**: JSZip (EPUB 解压)
- **文档选择**: expo-document-picker
- **文件系统**: expo-file-system
- **内容渲染**: react-native-webview

### 1.3 核心特性
- EPUB 文件导入和管理
- 章节导航和阅读进度保存
- 书签功能
- 文本高亮标注（6种颜色）
- 笔记功能
- 跨平台支持（iOS/Android/Web）

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                             │
├─────────────────────────────────────────────────────────────┤
│  LibraryScreen          │         ReaderScreen               │
│  - 图书列表              │         - WebView 渲染             │
│  - 导入功能              │         - 导航控制                 │
│  - 删除管理              │         - 工具栏                   │
│                         │         - 书签/标注面板             │
├─────────────────────────────────────────────────────────────┤
│                       组件层                                 │
├─────────────────────────────────────────────────────────────┤
│  BookmarkList           │         AnnotationList             │
│  - 书签列表展示          │         - 标注列表展示              │
│  - 编辑/删除             │         - 颜色选择                 │
│                         │         - 编辑/删除                │
├─────────────────────────────────────────────────────────────┤
│                       业务逻辑层                              │
├─────────────────────────────────────────────────────────────┤
│  EpubParser             │  BookmarkManager  │ AnnotationMgr  │
│  - EPUB 解析            │  - 书签 CRUD      │ - 标注 CRUD     │
│  - 元数据提取            │  - 数据持久化      │ - 数据持久化    │
│  - 章节加载              │                   │                │
├─────────────────────────────────────────────────────────────┤
│                       数据存储层                              │
├─────────────────────────────────────────────────────────────┤
│  AsyncStorage           │         FileSystem                 │
│  - 图书列表              │         - EPUB 文件存储             │
│  - 阅读进度              │         - 文档目录管理              │
│  - 书签数据              │                                    │
│  - 标注数据              │                                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
SimpleExpoTest/
├── App.js                          # 应用入口，导航配置
├── index.js                        # Expo 注册入口
├── app.json                        # Expo 配置文件
├── package.json                    # 依赖配置
├── src/
│   ├── screens/                    # 页面组件
│   │   ├── LibraryScreen.js       # 图书馆页面
│   │   └── ReaderScreen.js        # 阅读器页面
│   ├── components/                 # 可复用组件
│   │   ├── BookmarkList.js        # 书签列表组件
│   │   └── AnnotationList.js      # 标注列表组件
│   └── utils/                      # 工具类
│       ├── epubParser.js          # EPUB 解析器
│       └── bookmarkManager.js     # 书签和标注管理器
└── assets/                         # 静态资源
```

---

## 3. 核心模块设计

### 3.1 EPUB 解析模块 (EpubParser)

#### 3.1.1 职责
- 解析 EPUB 文件格式（ZIP 压缩包）
- 提取图书元数据（标题、作者）
- 解析目录结构和阅读顺序
- 加载章节内容

#### 3.1.2 工作流程

```
EPUB 文件
    ↓
[读取为 Base64]
    ↓
[JSZip 解压]
    ↓
[解析 META-INF/container.xml] → 获取 content.opf 路径
    ↓
[解析 content.opf]
    ↓
    ├─→ [提取元数据] → metadata { title, author }
    ├─→ [解析 manifest] → 文件映射表
    └─→ [解析 spine] → 章节阅读顺序
    ↓
[加载所有章节内容] → chapters[]
```

#### 3.1.3 关键数据结构

```javascript
class EpubParser {
  filePath: string        // EPUB 文件路径
  zip: JSZip              // 解压后的 ZIP 对象
  metadata: {             // 元数据
    title: string,
    author: string
  }
  chapters: [{            // 章节数组
    index: number,
    path: string,
    content: string       // HTML 内容
  }]
  spine: string[]         // 章节路径列表（阅读顺序）
}
```

### 3.2 数据持久化模块

#### 3.2.1 存储架构

```
AsyncStorage (Key-Value 存储)
│
├── @epub_reader_books
│   └── [{ id, title, author, filePath, addedDate }, ...]
│
├── @epub_reader_progress_{bookId}
│   └── "3"  (当前章节索引)
│
├── @epub_reader_bookmarks_{bookId}
│   └── [{
│         id: "1234567890",
│         chapterIndex: 2,
│         chapterTitle: "Chapter 3",
│         note: "重要段落",
│         createdAt: "2024-01-01T10:00:00.000Z"
│       }, ...]
│
└── @epub_reader_annotations_{bookId}
    └── [{
          id: "1234567891",
          chapterIndex: 2,
          selectedText: "这是一段重要的文字",
          note: "需要记住",
          color: "#FFEB3B",
          startOffset: 0,
          endOffset: 10,
          createdAt: "2024-01-01T11:00:00.000Z"
        }, ...]
```

#### 3.2.2 BookmarkManager

```javascript
// 书签管理器 - 静态方法类
BookmarkManager.addBookmark(bookId, bookmark)     // 添加书签
BookmarkManager.getBookmarks(bookId)              // 获取所有书签
BookmarkManager.deleteBookmark(bookId, bookmarkId) // 删除书签
BookmarkManager.updateBookmark(bookId, bookmarkId, updates) // 更新书签
```

#### 3.2.3 AnnotationManager

```javascript
// 标注管理器 - 静态方法类
AnnotationManager.addAnnotation(bookId, annotation)    // 添加标注
AnnotationManager.getAnnotations(bookId, chapterIndex) // 获取标注
AnnotationManager.deleteAnnotation(bookId, annotationId) // 删除标注
AnnotationManager.updateAnnotation(bookId, annotationId, updates) // 更新标注
AnnotationManager.changeAnnotationColor(bookId, annotationId, color) // 更改颜色
```

### 3.3 内容渲染模块

#### 3.3.1 WebView 渲染架构

```
React Native (ReaderScreen)
        ↓
   [生成 HTML 模板]
        ↓
    WebView 组件
        ↓
   渲染 EPUB 内容
        ↓
   用户选择文本
        ↓
   JavaScript 监听 selectionchange
        ↓
   window.ReactNativeWebView.postMessage()
        ↓
   React Native 接收消息
        ↓
   显示标注创建面板
```

#### 3.3.2 HTML 模板结构

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* 响应式排版样式 */
    body { font-size: 18px; line-height: 1.6; padding: 20px; }
    p { margin-bottom: 1em; text-align: justify; }
    .highlight { background-color: #FFEB3B; }
  </style>
  <script>
    // 文本选择监听
    document.addEventListener('selectionchange', function() {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText.length > 0) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'textSelected',
          text: selectedText
        }));
      }
    });
  </script>
</head>
<body>
  <div class="chapter-content">
    <!-- EPUB 章节 HTML 内容 -->
  </div>
</body>
</html>
```

### 3.4 导航模块

#### 3.4.1 路由配置

```javascript
Stack Navigator
│
├── Library (LibraryScreen)
│   - 初始路由
│   - 显示图书列表
│   - 导入新书
│   │
│   └─→ [点击图书] → navigate('Reader', { book })
│
└── Reader (ReaderScreen)
    - 接收 book 参数
    - 显示阅读界面
    - 章节导航
    └─→ [返回] → goBack()
```

#### 3.4.2 页面间数据传递

```javascript
// LibraryScreen → ReaderScreen
navigation.navigate('Reader', {
  book: {
    id: "1234567890",
    title: "书名",
    author: "作者",
    filePath: "/path/to/book.epub",
    addedDate: "2024-01-01T10:00:00.000Z"
  }
});

// ReaderScreen 接收
const { book } = route.params;
```

---

## 4. 数据流设计

### 4.1 图书导入流程

```
用户点击 "Import EPUB"
    ↓
DocumentPicker.getDocumentAsync()  // 选择文件
    ↓
验证文件扩展名 (.epub)
    ↓
FileSystem.copyAsync()  // 复制到应用目录
    ↓
创建 book 对象 {
  id: Date.now().toString(),
  title: filename,
  filePath: destPath,
  ...
}
    ↓
更新 books 数组
    ↓
AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books))
    ↓
显示成功提示
```

### 4.2 阅读流程

```
用户点击图书
    ↓
导航到 ReaderScreen (传递 book 对象)
    ↓
创建 EpubParser 实例
    ↓
parser.load()  // 解析 EPUB
    ↓
从 AsyncStorage 读取上次阅读进度
    ↓
加载对应章节内容
    ↓
generateHtmlContent()  // 生成 HTML
    ↓
WebView 渲染内容
    ↓
用户阅读 / 翻页 / 添加书签 / 创建标注
    ↓
章节切换时保存进度到 AsyncStorage
```

### 4.3 标注创建流程

```
用户在 WebView 中选择文本
    ↓
JavaScript selectionchange 事件触发
    ↓
postMessage({ type: 'textSelected', text: '...' })
    ↓
React Native onMessage 接收
    ↓
setSelectedText() + setShowAnnotationModal(true)
    ↓
用户选择颜色、输入笔记
    ↓
点击 "Save"
    ↓
AnnotationManager.addAnnotation()
    ↓
AsyncStorage 保存数据
    ↓
重新加载章节（应用高亮 - 当前未实现）
    ↓
关闭模态框 + 显示成功提示
```

---

## 5. 关键技术实现

### 5.1 EPUB 文件格式解析

EPUB 是基于 ZIP 的开放格式，标准结构：

```
book.epub (ZIP 文件)
│
├── META-INF/
│   └── container.xml          # 指向 content.opf 位置
│
├── OEBPS/                     # 内容目录（可能不同名称）
│   ├── content.opf            # 核心配置文件
│   │   ├── <metadata>         # 元数据（标题、作者）
│   │   ├── <manifest>         # 文件清单
│   │   └── <spine>            # 阅读顺序
│   │
│   ├── chapter1.xhtml         # 章节文件
│   ├── chapter2.xhtml
│   ├── styles/
│   └── images/
│
└── mimetype                   # 文件类型标识
```

解析步骤：
1. 读取 `META-INF/container.xml`，提取 `content.opf` 路径
2. 解析 `content.opf`：
   - `<dc:title>`: 书名
   - `<dc:creator>`: 作者
   - `<manifest>`: 建立 id → 文件路径映射
   - `<spine>`: 按 `<itemref idref="...">` 顺序确定章节
3. 根据 spine 顺序加载所有章节 HTML

### 5.2 React Native 与 WebView 通信

#### 5.2.1 React Native → WebView

```javascript
// 通过 source 属性传递 HTML
<WebView source={{ html: chapterContent }} />
```

#### 5.2.2 WebView → React Native

```javascript
// WebView 内部
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: 'textSelected',
  text: selectedText
}));

// React Native 接收
<WebView
  onMessage={(event) => {
    const message = JSON.parse(event.nativeEvent.data);
    if (message.type === 'textSelected') {
      // 处理文本选择
    }
  }}
/>
```

### 5.3 AsyncStorage 数据管理

#### 5.3.1 数据隔离策略
- 使用前缀 + bookId 确保不同图书数据独立
- 例：`@epub_reader_bookmarks_1234567890`

#### 5.3.2 性能优化
- 书签和标注按章节索引过滤，避免加载全部数据
- 使用 `JSON.parse()` / `JSON.stringify()` 序列化

---

## 6. 已知限制和改进方向

### 6.1 当前限制

#### 6.1.1 标注高亮未实现
**问题**: `generateHtmlContent()` 中标注数据未应用到 HTML
**位置**: `ReaderScreen.js:127`
**影响**: 用户创建的高亮标注无法在阅读视图中显示

**实现思路**:
```javascript
// 需要实现的逻辑
function applyAnnotationsToHtml(htmlContent, annotations) {
  // 1. 解析 HTML DOM
  // 2. 根据 startOffset/endOffset 定位文本节点
  // 3. 用 <span style="background: color"> 包裹选中文本
  // 4. 返回修改后的 HTML
}
```

#### 6.1.2 文本偏移量计算简化
**问题**: 当前 `startOffset` 始终为 0，`endOffset` 为文本长度
**影响**: 无法精确定位标注在章节中的位置

**改进方案**:
- 在 WebView 中计算选中文本相对于章节起始的字符偏移
- 使用 `window.getSelection().getRangeAt(0)` 获取精确位置

#### 6.1.3 滚动位置未保存
**问题**: 书签的 `scrollPosition` 字段未使用
**影响**: 跳转到书签时无法恢复精确的滚动位置

### 6.2 未来改进方向

1. **性能优化**
   - 章节懒加载（当前一次性加载所有章节）
   - 缓存已渲染的章节 HTML

2. **功能增强**
   - 字体大小/行距调整
   - 夜间模式
   - 全文搜索
   - 目录导航（TOC）
   - 阅读统计

3. **用户体验**
   - 书籍封面提取和显示
   - 翻页动画
   - 手势控制（左右滑动翻页）
   - 进度条拖拽跳转

4. **数据同步**
   - 云端备份（书签、标注、进度）
   - 多设备同步

---

## 7. 安全和性能考虑

### 7.1 安全措施

#### 7.1.1 WebView 安全
```javascript
<WebView
  onNavigationStateChange={(navState) => {
    // 阻止外部链接跳转
    if (navState.url !== 'about:blank' && !navState.url.startsWith('file://')) {
      webViewRef.current?.stopLoading();
    }
  }}
/>
```

#### 7.1.2 文件访问控制
- EPUB 文件仅存储在应用沙盒目录
- 使用 `FileSystem.documentDirectory` 限制访问范围

### 7.2 性能优化

#### 7.2.1 内存管理
- WebView 每次只渲染当前章节，避免内存溢出
- 图片使用 base64 内联（可改进为文件 URL）

#### 7.2.2 渲染优化
- FlatList 用于图书列表和书签/标注列表（虚拟化）
- 使用 `numberOfLines` 限制文本行数

---

## 8. 部署和配置

### 8.1 Expo 配置 (app.json)

```json
{
  "expo": {
    "name": "SimpleExpoTest",
    "slug": "SimpleExpoTest",
    "version": "1.0.0",
    "orientation": "portrait",
    "jsEngine": "hermes",       // 使用 Hermes JavaScript 引擎
    "newArchEnabled": true,     // 启用 React Native 新架构
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anonymous.SimpleExpoTest"
    },
    "android": {
      "edgeToEdgeEnabled": true  // 全面屏支持
    }
  }
}
```

### 8.2 关键依赖版本

```json
{
  "expo": "~54.0.22",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "@react-navigation/native": "^7.1.19",
  "@react-navigation/stack": "^7.6.2",
  "react-native-webview": "13.15.0",
  "jszip": "^3.10.1"
}
```

### 8.3 构建命令

```bash
# 开发环境
npx expo start

# iOS 构建
npx expo run:ios

# Android 构建
npx expo run:android

# 生产构建
eas build --platform ios
eas build --platform android
```

---

## 9. 测试指南

### 9.1 测试 EPUB 文件要求
- 符合 EPUB 2.0 或 3.0 标准
- 包含有效的 `container.xml` 和 `content.opf`
- 章节文件为 XHTML 或 HTML 格式

### 9.2 推荐测试场景
1. 导入多种格式的 EPUB 文件
2. 大文件处理（100+ 章节）
3. 包含图片的 EPUB
4. 书签的增删改查
5. 标注的颜色切换和笔记编辑
6. 跨章节阅读和进度保存
7. 应用重启后数据恢复

---

## 10. 故障排查

### 10.1 常见问题

#### 问题 1: EPUB 文件无法解析
**原因**: 文件格式不符合标准或损坏
**解决**: 检查 `container.xml` 和 `content.opf` 是否存在

#### 问题 2: WebView 不显示内容
**原因**: HTML 格式错误或 CSS 冲突
**解决**: 在 Chrome DevTools 中检查 WebView 渲染（启用远程调试）

#### 问题 3: AsyncStorage 数据丢失
**原因**: 应用卸载或缓存清理
**解决**: 提醒用户导出数据或实现云同步

### 10.2 调试技巧

```javascript
// 启用 EPUB 解析日志
console.log('Chapters:', parser.getAllChapters());
console.log('Metadata:', parser.getMetadata());

// 查看 AsyncStorage 数据
AsyncStorage.getAllKeys().then(keys => {
  console.log('Storage keys:', keys);
});

// WebView 调试
<WebView
  onError={(error) => console.log('WebView error:', error)}
  onLoad={() => console.log('WebView loaded')}
/>
```

---

## 11. 贡献指南

### 11.1 代码规范
- 使用 ES6+ 语法
- 组件使用函数式组件 + Hooks
- 注释使用中文（业务逻辑）+ JSDoc（API）

### 11.2 提交规范
```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
perf: 性能优化
test: 测试相关
```

---

## 12. 参考资料

- [EPUB 3.3 规范](https://www.w3.org/TR/epub-33/)
- [Expo 文档](https://docs.expo.dev/)
- [React Navigation 文档](https://reactnavigation.org/)
- [react-native-webview](https://github.com/react-native-webview/react-native-webview)
- [JSZip 文档](https://stuk.github.io/jszip/)

---

**文档版本**: 1.0
**最后更新**: 2025-01-06
**维护者**: Development Team
