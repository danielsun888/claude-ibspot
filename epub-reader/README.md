# EPUB Reader - React Native

一个基于 React Native 和 WebView 的 EPUB 电子书阅读器应用。

## 功能特性

- 📚 **书籍管理**：导入和管理 EPUB 格式的电子书
- 📖 **WebView 阅读**：使用 WebView 渲染书籍内容，提供流畅的阅读体验
- 🔖 **书签功能**：快速添加书签，记录重要位置，支持添加备注
- ✨ **文本注释**：选中文本创建高亮注释，支持自定义颜色和笔记
- 📝 **阅读笔记**：为书签和注释添加个人笔记
- 💾 **阅读进度**：自动保存阅读进度，下次打开继续阅读
- 📑 **章节导航**：轻松在章节之间导航
- 🎨 **优雅界面**：现代化的 UI 设计，提供良好的用户体验
- 💾 **本地存储**：所有书籍、进度、书签和注释数据本地存储

## 技术栈

- **React Native** 0.73.0 - 跨平台移动应用框架
- **react-native-webview** - 渲染 EPUB 内容
- **react-native-document-picker** - 文件选择功能
- **react-native-fs** - 文件系统操作
- **jszip** - EPUB 文件解压和解析
- **@react-navigation** - 应用内导航
- **@react-native-async-storage/async-storage** - 本地数据存储

## 项目结构

```
epub-reader/
├── App.js                      # 主应用组件和导航配置
├── index.js                    # 应用入口
├── package.json                # 项目依赖
├── babel.config.js             # Babel 配置
├── metro.config.js             # Metro 打包配置
├── app.json                    # 应用配置
└── src/
    ├── screens/
    │   ├── LibraryScreen.js    # 书架界面（书籍列表）
    │   └── ReaderScreen.js     # 阅读器界面
    ├── components/
    │   ├── BookmarkList.js     # 书签列表组件
    │   └── AnnotationList.js   # 注释列表组件
    └── utils/
        ├── epubParser.js       # EPUB 解析工具
        └── bookmarkManager.js  # 书签和注释管理工具
```

## 安装和运行

### 前置要求

- Node.js >= 18
- React Native 开发环境（参考 [官方文档](https://reactnative.dev/docs/environment-setup)）
- iOS: Xcode 和 CocoaPods
- Android: Android Studio 和 Android SDK

### 安装依赖

```bash
cd epub-reader
npm install

# iOS 需要安装 pods
cd ios && pod install && cd ..
```

### 运行应用

```bash
# 启动 Metro bundler
npm start

# 运行 iOS
npm run ios

# 运行 Android
npm run android
```

## 使用说明

### 1. 导入书籍

1. 在书架界面点击 "Import EPUB" 按钮
2. 从设备中选择 `.epub` 格式的电子书文件
3. 书籍将自动添加到书架

### 2. 阅读书籍

1. 在书架界面点击任意书籍封面
2. 自动打开上次阅读的章节
3. 使用底部导航按钮切换章节：
   - "← Previous" - 上一章
   - "Next →" - 下一章
4. 点击 "← Back" 返回书架

### 3. 使用书签

1. 在阅读界面点击右上角菜单按钮（⋮）
2. 选择 "Add Bookmark" 添加当前位置的书签
3. 点击 "Bookmarks" 查看所有书签
4. 在书签列表中：
   - 点击书签可跳转到对应位置
   - 点击 "Edit" 可以为书签添加或编辑备注
   - 点击 "Delete" 可以删除书签

### 4. 创建文本注释

1. 在阅读界面长按选中文本
2. 自动弹出注释创建对话框
3. 选择高亮颜色（黄色、绿色、蓝色等）
4. 可选：添加个人笔记
5. 点击 "Save" 保存注释

### 5. 管理注释

1. 点击右上角菜单按钮（⋮）
2. 选择 "Annotations" 查看所有注释
3. 在注释列表中：
   - 查看高亮的文本和笔记
   - 点击注释可跳转到对应章节
   - 点击 "Edit" 可以修改颜色和笔记
   - 点击 "Delete" 可以删除注释

### 6. 删除书籍

- 长按书架中的书籍封面
- 确认删除操作

## 核心功能实现

### EPUB 解析

`src/utils/epubParser.js` 实现了完整的 EPUB 解析功能：

- 解压 EPUB 文件（本质是 ZIP 压缩包）
- 解析 `container.xml` 获取内容位置
- 解析 `content.opf` 获取元数据和章节列表
- 按照 spine 顺序加载章节内容

### WebView 渲染

阅读器使用 WebView 渲染 HTML 内容，包括：

- 响应式布局适配不同屏幕尺寸
- 自定义 CSS 样式提供良好的阅读体验
- 图片自动缩放适配屏幕
- 防止外部链接跳转

### 书签和注释系统

`src/utils/bookmarkManager.js` 提供完整的书签和注释管理：

**书签功能**：
- 添加、编辑、删除书签
- 为书签添加备注
- 记录章节位置和创建时间
- 支持快速跳转

**注释功能**：
- 文本选中创建注释
- 支持 6 种高亮颜色
- 添加个人笔记
- 管理和编辑已有注释

**WebView 交互**：
- JavaScript 监听文本选择事件
- 通过 `postMessage` 与 React Native 通信
- 自动弹出注释创建对话框

### 数据持久化

使用 AsyncStorage 存储：

- 书籍列表和元数据
- 每本书的阅读进度（当前章节）
- 书签数据（章节位置、备注、时间戳）
- 注释数据（选中文本、笔记、颜色、位置）

## 平台兼容性

- ✅ iOS
- ✅ Android

## 已实现功能

- ✅ 书签功能（添加、编辑、删除、备注）
- ✅ 文本高亮和注释
- ✅ 阅读笔记
- ✅ 多颜色高亮支持

## 待改进功能

- [ ] 字体大小调节
- [ ] 夜间模式/主题切换
- [ ] 目录导航（TOC）
- [ ] 搜索功能
- [ ] 书籍封面提取和显示
- [ ] 更精确的高亮位置定位（当前为简化版本）
- [ ] 导出书签和注释
- [ ] 更多格式支持（PDF, MOBI 等）

## 常见问题

### Q: 无法导入 EPUB 文件？

确保：
1. 文件格式确实是 `.epub`
2. 文件未损坏
3. 应用有文件访问权限

### Q: Android 上文件选择器无法打开？

在 `android/app/src/main/AndroidManifest.xml` 中添加存储权限：

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Q: iOS 上无法读取文件？

确保 `Info.plist` 中包含必要的权限说明。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
