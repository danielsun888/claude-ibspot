# 预置书籍自动加载功能说明

## 功能概述

应用现在支持自动加载 `src/data/` 文件夹中的预置 EPUB 书籍。这些书籍会在应用首次启动时自动导入到图书馆。

## 已完成的更改

### 1. 安装新依赖
- 添加了 `expo-asset` 包用于处理资源文件

### 2. 配置文件更改

**app.json**:
- 添加了 `assetBundlePatterns` 配置以包含所有资源文件

**metro.config.js** (新建):
- 配置 Metro bundler 将 `.epub` 文件识别为资源文件
- 这确保了 EPUB 文件可以通过 `require()` 加载

### 3. LibraryScreen 功能增强

**新增功能**:
- 预置书籍配置数组 `PRELOADED_BOOKS`
- 首次启动时自动导入预置书籍
- 使用 AsyncStorage 标记避免重复导入
- 开发者功能：长按标题可重新导入预置书籍

**工作流程**:
```
应用启动
  ↓
检查是否已导入预置书籍
  ↓
如果未导入：
  ↓
遍历 PRELOADED_BOOKS 配置
  ↓
使用 expo-asset 加载每个 EPUB 文件
  ↓
复制到应用文档目录
  ↓
添加到图书馆列表
  ↓
保存到 AsyncStorage
  ↓
标记为已导入
```

## 当前预置书籍

- **bible.epub** - Bible (Various Authors)

## 如何添加新的预置书籍

### 步骤 1: 添加 EPUB 文件
将 EPUB 文件放入 `src/data/` 文件夹

### 步骤 2: 更新配置
编辑 `src/screens/LibraryScreen.js`，在 `PRELOADED_BOOKS` 数组中添加：

```javascript
const PRELOADED_BOOKS = [
  {
    fileName: 'bible.epub',
    title: 'Bible',
    author: 'Various Authors',
    asset: require('../data/bible.epub'),
  },
  // 添加新书籍
  {
    fileName: 'your-book.epub',
    title: '你的书名',
    author: '作者名',
    asset: require('../data/your-book.epub'),
  },
];
```

### 步骤 3: 重启应用
```bash
# 清除缓存并重启
npx expo start --clear
```

## 测试功能

### 测试自动导入
1. 删除应用（清除所有数据）
2. 重新运行应用
3. 打开应用，预置书籍应自动出现在图书馆

### 测试重新导入（不删除应用）
1. 长按 "My Library" 标题
2. 选择 "确定" 重新导入
3. 预置书籍会被重新添加（如果已删除）

## 技术细节

### 资源加载机制
- 使用 `expo-asset` 的 `Asset.fromModule()` 加载 EPUB 文件
- 文件首先被下载到临时位置（asset.localUri）
- 然后复制到应用的文档目录
- 路径格式：`${FileSystem.documentDirectory}${fileName}`

### 避免重复导入
- 使用 AsyncStorage 键 `@epub_reader_preloaded_imported` 标记
- 检查文件是否已存在于文档目录
- 检查书籍是否已在图书列表中

### 数据结构
每个预置书籍在图书列表中的结构：
```javascript
{
  id: string,              // 唯一 ID (时间戳 + 随机数)
  title: string,           // 书名
  author: string,          // 作者
  filePath: string,        // 文件路径
  addedDate: string,       // 添加日期 (ISO)
  isPreloaded: true        // 标记为预置书籍
}
```

## 故障排查

### 问题：预置书籍没有出现
**解决方案**：
1. 检查 Metro bundler 日志，确认 .epub 文件被正确打包
2. 清除缓存：`npx expo start --clear`
3. 检查 `PRELOADED_BOOKS` 配置是否正确
4. 使用长按标题功能手动触发重新导入

### 问题：导入失败
**检查**：
1. 确认 EPUB 文件在 `src/data/` 目录中
2. 确认文件名在 `require()` 中正确
3. 查看控制台错误信息

### 问题：重复导入书籍
**原因**：AsyncStorage 标记被清除
**解决**：
- 正常情况下不会发生
- 如需清除，使用应用内的长按功能手动控制

## 与手动导入的区别

| 特性 | 预置书籍 | 手动导入 |
|-----|---------|---------|
| 来源 | 应用 bundle | 用户文件系统 |
| 导入时机 | 首次启动自动 | 用户手动触发 |
| 文件位置 | 复制到文档目录 | 复制到文档目录 |
| 可删除 | 是 | 是 |
| 重新添加 | 长按标题重新导入 | 重新选择文件 |
| 标记字段 | `isPreloaded: true` | 无 |

## 性能考虑

- 预置书籍只在首次启动时导入，后续启动不受影响
- 大文件（如 bible.epub 约 14MB）导入可能需要几秒钟
- 导入过程中显示加载指示器
- 文件复制使用 FileSystem API，性能良好

## 未来改进方向

1. **进度指示**：显示导入进度百分比
2. **批量管理**：允许批量删除/重新导入预置书籍
3. **版本控制**：检测预置书籍更新并重新导入
4. **按需下载**：预置书籍不打包在应用中，首次使用时下载
5. **书籍元数据**：从 EPUB 文件中提取完整的元数据（封面、描述等）

## 相关文件

- `src/screens/LibraryScreen.js` - 主要实现
- `src/data/` - 预置书籍存储目录
- `metro.config.js` - Metro bundler 配置
- `app.json` - Expo 配置
- `package.json` - 依赖配置

---

**创建日期**: 2025-01-06
**最后更新**: 2025-01-06
