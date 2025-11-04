# EPUB Reader - React Native

一个基于 React Native 和 WebView 的 EPUB 电子书阅读器应用。

## 功能特性

- 📚 **书籍管理**：导入和管理 EPUB 格式的电子书
- 📖 **WebView 阅读**：使用 WebView 渲染书籍内容，提供流畅的阅读体验
- 🔖 **阅读进度**：自动保存阅读进度，下次打开继续阅读
- 📑 **章节导航**：轻松在章节之间导航
- 🎨 **优雅界面**：现代化的 UI 设计，提供良好的用户体验
- 💾 **本地存储**：所有书籍和进度数据本地存储

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
    ├── components/             # 可复用组件（待扩展）
    └── utils/
        └── epubParser.js       # EPUB 解析工具
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

### 3. 删除书籍

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

### 数据持久化

使用 AsyncStorage 存储：

- 书籍列表和元数据
- 每本书的阅读进度（当前章节）

## 平台兼容性

- ✅ iOS
- ✅ Android

## 待改进功能

- [ ] 字体大小调节
- [ ] 夜间模式/主题切换
- [ ] 书签功能
- [ ] 目录导航（TOC）
- [ ] 搜索功能
- [ ] 高亮和笔记
- [ ] 书籍封面提取和显示
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
