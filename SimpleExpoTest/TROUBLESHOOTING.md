# 故障排查指南

## 常见问题与解决方案

### 问题 1: 章节加载后没有内容显示

#### 症状
- 打开书籍后显示"Loading chapter..."
- 加载完成后 WebView 显示空白
- 控制台没有错误信息

#### 可能原因与解决方案

**原因 1: EPUB 文件格式不标准**
```bash
# 检查控制台日志
# 查找以下信息：
- "Loading chapter: X"
- "Chapter loaded: success/null"
- "Chapter content length: X"
- "Generated HTML length: X"
```

如果看到 "Chapter content length: 0"，说明章节内容为空：
- 检查 EPUB 文件是否损坏
- 尝试使用其他 EPUB 阅读器验证文件
- 使用标准的 EPUB 2.0/3.0 格式文件

**原因 2: EPUB 解析失败**
```bash
# 查看解析日志
console.log 输出：
- "Chapters: [...]"  # 应该显示章节数组
- "Metadata: {...}"  # 应该显示书籍信息
```

如果章节数组为空：
- 检查 EPUB 的 container.xml 文件
- 确认 content.opf 文件存在且格式正确
- 验证 spine 元素包含章节引用

**原因 3: WebView 渲染问题**

检查 WebView 配置：
```javascript
// 在 ReaderScreen.js 中确认以下设置
<WebView
  source={{ html: chapterContent }}  // 确保 chapterContent 不为空
  onError={(error) => console.log('WebView error:', error)}
  onLoad={() => console.log('WebView loaded')}
/>
```

启用远程调试查看 WebView 内容：
1. 在 iOS：Safari > Develop > Simulator
2. 在 Android：Chrome > chrome://inspect

**原因 4: HTML 生成问题**

检查生成的 HTML：
```javascript
// 在 loadChapter 函数中添加日志
console.log('Generated HTML preview:', html.substring(0, 200));
```

确认 HTML 包含：
- DOCTYPE 声明
- 完整的 head 和 body 标签
- 实际的章节内容

### 问题 2: 没有显示目录

#### 症状
- 工具栏中看不到"Table of Contents"按钮
- 或点击按钮后没有反应

#### 解决方案

**步骤 1: 确认代码已更新**
```bash
# 清除缓存并重启
npx expo start --clear
```

**步骤 2: 检查导入**
确认 ReaderScreen.js 包含：
```javascript
import { FlatList } from 'react-native';
```

**步骤 3: 检查状态**
确认存在以下 state：
```javascript
const [showTOC, setShowTOC] = useState(false);
```

**步骤 4: 检查章节数据**
```javascript
// 在控制台查看
console.log('All chapters:', epubParser?.getAllChapters());
```

如果返回空数组，说明 EPUB 解析未成功加载章节。

### 问题 3: 预置书籍没有自动导入

#### 症状
- 首次启动应用
- "My Library"是空的
- bible.epub 没有出现

#### 解决方案

**步骤 1: 检查文件存在**
```bash
ls -la ./src/data/
# 应该看到 bible.epub
```

**步骤 2: 检查配置**
在 LibraryScreen.js 中确认：
```javascript
const PRELOADED_BOOKS = [
  {
    fileName: 'bible.epub',
    title: 'Bible',
    author: 'Various Authors',
    asset: require('../data/bible.epub'),
  },
];
```

**步骤 3: 检查 Metro 配置**
确认 metro.config.js 存在且包含：
```javascript
config.resolver.assetExts.push('epub');
```

**步骤 4: 清除缓存**
```bash
# 完全清除
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

**步骤 5: 手动触发导入**
- 长按 "My Library" 标题
- 选择"确定"重新导入

**步骤 6: 查看日志**
```bash
# 检查控制台输出
# 查找 "Error importing" 相关消息
```

### 问题 4: 应用崩溃或性能问题

#### 症状
- 应用启动缓慢
- 打开书籍时卡顿
- 内存占用过高

#### 解决方案

**大文件处理**:
```javascript
// bible.epub 约 14MB，包含大量章节
// 首次加载可能需要 5-10 秒
```

优化建议：
1. 使用开发构建而非 Expo Go
2. 在真机上测试性能
3. 考虑实现章节懒加载

**内存管理**:
- 每次只加载当前章节到 WebView
- 关闭书籍时清理 epubParser
- 避免在内存中保留过多章节

### 问题 5: Hermes 相关警告

#### 症状
```
Debug: No compatible apps connected, React Native DevTools can only be used with Hermes.
```

#### 解决方案

**已修复**: app.json 已添加 `"jsEngine": "hermes"`

如仍有问题：
```bash
# 重新构建应用
npx expo run:ios
# 或
npx expo run:android
```

注意：Expo Go 可能仍显示此警告，这是正常的。使用开发构建可解决。

## 调试技巧

### 启用详细日志

在需要调试的文件中添加：
```javascript
console.log('DEBUG:', variableName);
```

已添加的调试点：
- LibraryScreen: 书籍导入流程
- ReaderScreen: 章节加载流程
- EpubParser: EPUB 解析过程

### 检查 AsyncStorage 数据

```javascript
// 在任意组件中临时添加
AsyncStorage.getAllKeys().then(keys => {
  console.log('All storage keys:', keys);
  keys.forEach(key => {
    AsyncStorage.getItem(key).then(value => {
      console.log(key, ':', value);
    });
  });
});
```

### 清除所有应用数据

```javascript
// 添加到 LibraryScreen 或任意位置
const clearAllData = async () => {
  await AsyncStorage.clear();
  Alert.alert('Success', 'All data cleared');
};
```

或者：
- iOS：删除应用重新安装
- Android：设置 > 应用 > SimpleExpoTest > 清除数据

### React DevTools

```bash
# 启动 DevTools
npx react-devtools

# 在应用中启用
# 摇动设备 > 打开开发菜单 > Debug
```

### 网络请求调试

如果预置书籍加载失败：
```javascript
// 检查 Asset 加载
console.log('Asset URI:', asset.localUri);
console.log('Asset downloaded:', asset.downloaded);
```

## 性能优化建议

### 1. 使用开发构建

```bash
# 代替 Expo Go
npx expo run:ios
npx expo run:android
```

优势：
- 完整的 Hermes 支持
- 更好的性能
- 更准确的生产环境模拟

### 2. 优化 EPUB 解析

当前实现一次性加载所有章节：
```javascript
// src/utils/epubParser.js
await this.loadChapters(); // 加载全部
```

可改进为按需加载：
```javascript
async getChapter(index) {
  if (!this.chapters[index]) {
    await this.loadChapter(index);
  }
  return this.chapters[index];
}
```

### 3. WebView 优化

```javascript
<WebView
  cacheEnabled={true}
  cacheMode="LOAD_CACHE_ELSE_NETWORK"
/>
```

## 联系支持

如果问题仍未解决：

1. 查看 GitHub Issues
2. 提供以下信息：
   - 完整的错误信息
   - 控制台日志
   - EPUB 文件信息（大小、章节数）
   - 设备/模拟器信息
   - 重现步骤

---

**创建日期**: 2025-01-06
**最后更新**: 2025-01-06
