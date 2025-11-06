# 更新日志

## [未发布] - 2025-01-06

### 新增功能 ✨

#### 1. 目录（Table of Contents）功能
- ✅ 添加目录按钮到工具栏（📑 图标）
- ✅ 全屏模态框显示所有章节列表
- ✅ 当前阅读章节高亮显示
- ✅ 点击章节快速跳转
- ✅ 显示章节编号和"正在阅读"徽章
- ✅ 优雅的 UI 设计，与现有界面风格一致

**使用方法**：
1. 打开任意书籍
2. 点击右上角菜单按钮（⋮）
3. 选择 "Table of Contents"
4. 浏览并点击任意章节跳转

**文件修改**：
- `src/screens/ReaderScreen.js`:
  - 新增 `showTOC` state
  - 新增目录模态框 UI
  - 新增目录样式（约 80 行）
  - 工具栏添加目录按钮

#### 2. 预置书籍自动导入
- ✅ 应用首次启动时自动导入 `src/data/` 中的 EPUB 文件
- ✅ 避免重复导入（使用 AsyncStorage 标记）
- ✅ 支持多个预置书籍
- ✅ 开发者功能：长按标题重新导入

**当前预置书籍**：
- Bible (bible.epub) - 14MB

**配置方式**：
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

**文件修改**：
- `src/screens/LibraryScreen.js`:
  - 新增 `PRELOADED_BOOKS` 配置
  - 新增 `importPreloadedBooks()` 函数
  - 新增 `initializeLibrary()` 函数
  - 新增 `reloadPreloadedBooks()` 开发者功能
  - 长按标题触发重新导入

#### 3. 调试日志增强
- ✅ 章节加载时输出详细日志
- ✅ 包括章节索引、内容长度、HTML 长度
- ✅ 错误时显示 Alert 提示
- ✅ 帮助诊断加载问题

**日志输出示例**：
```
Loading chapter: 0
Chapter loaded: success
Chapter content length: 15234
Generated HTML length: 16890
```

**文件修改**：
- `src/screens/ReaderScreen.js`:
  - `loadChapter()` 函数添加 console.log
  - 添加错误 Alert 提示

### 配置更新 🔧

#### 1. Hermes JavaScript 引擎
- ✅ 在 `app.json` 中启用 Hermes
- ✅ 更好的性能和启动速度
- ✅ 支持 React Native DevTools

**配置**：
```json
{
  "jsEngine": "hermes"
}
```

#### 2. Metro Bundler 配置
- ✅ 新建 `metro.config.js`
- ✅ 将 `.epub` 文件识别为资源文件
- ✅ 支持 `require()` 加载 EPUB

**配置**：
```javascript
config.resolver.assetExts.push('epub');
```

#### 3. Expo 资源配置
- ✅ 添加 `assetBundlePatterns` 到 `app.json`
- ✅ 确保所有文件被打包

**配置**：
```json
{
  "assetBundlePatterns": ["**/*"]
}
```

### 依赖更新 📦

#### 新增依赖
- `expo-asset` - 用于加载预置书籍资源

**安装命令**：
```bash
npm install expo-asset
```

### 文档更新 📚

#### 新建文档
1. **PRELOADED_BOOKS_SETUP.md**
   - 预置书籍功能详细说明
   - 工作原理和配置方法
   - 故障排查指南

2. **TROUBLESHOOTING.md**
   - 常见问题与解决方案
   - 调试技巧
   - 性能优化建议

3. **CHANGELOG.md** (本文件)
   - 完整的更新记录

#### 更新文档
1. **CLAUDE.md**
   - 添加预置书籍管理说明
   - 添加阅读器功能说明
   - 更新平台特性（Hermes）

2. **ARCHITECTURE.md**
   - 更新 Expo 配置部分
   - 添加 Hermes 说明

### 文件清单 📋

#### 新建文件
```
metro.config.js                  # Metro 配置
PRELOADED_BOOKS_SETUP.md        # 预置书籍文档
TROUBLESHOOTING.md              # 故障排查文档
CHANGELOG.md                    # 本文件
```

#### 修改文件
```
app.json                        # 添加 jsEngine 和 assetBundlePatterns
package.json                    # 添加 expo-asset
src/screens/LibraryScreen.js    # 预置书籍导入功能
src/screens/ReaderScreen.js     # 目录功能和调试日志
CLAUDE.md                       # 更新说明
ARCHITECTURE.md                 # 更新配置说明
```

#### 未修改文件
```
src/utils/epubParser.js         # 保持不变
src/utils/bookmarkManager.js    # 保持不变
src/components/BookmarkList.js  # 保持不变
src/components/AnnotationList.js # 保持不变
```

### 代码统计 📊

**新增代码行数**：
- ReaderScreen.js: +120 行（目录功能 + 样式）
- LibraryScreen.js: +110 行（预置书籍功能）
- 文档: +800 行

**总计**: ~1030 行新代码和文档

### 测试检查清单 ✓

#### 预置书籍导入
- [ ] 首次启动时 Bible 自动出现
- [ ] 不会重复导入
- [ ] 长按标题可重新导入
- [ ] 删除书籍后可重新导入

#### 目录功能
- [ ] 工具栏显示目录按钮
- [ ] 点击后显示所有章节
- [ ] 当前章节正确高亮
- [ ] 点击章节可跳转
- [ ] 章节编号正确显示
- [ ] "正在阅读"徽章显示

#### 章节加载
- [ ] 打开书籍后正常加载第一章
- [ ] 控制台输出调试日志
- [ ] 章节内容正确显示
- [ ] Previous/Next 按钮工作正常
- [ ] 阅读进度正确保存和恢复

#### 错误处理
- [ ] 章节加载失败时显示 Alert
- [ ] 日志包含错误信息
- [ ] 不会导致应用崩溃

### 已知问题 ⚠️

1. **标注高亮未实现**
   - 标注可保存但不会在阅读视图中显示
   - 需要实现 HTML 解析和高亮注入

2. **章节懒加载**
   - 当前一次性加载所有章节
   - 大文件可能导致启动慢
   - 建议实现按需加载

3. **Expo Go 警告**
   - 在 Expo Go 中可能看到 Hermes 警告
   - 使用开发构建可解决

### 下一步计划 🚀

#### 短期（v1.1）
- [ ] 实现标注高亮渲染
- [ ] 添加字体大小调整
- [ ] 添加夜间模式
- [ ] 优化大文件加载性能

#### 中期（v1.2）
- [ ] 全文搜索功能
- [ ] 阅读统计
- [ ] 书籍封面提取
- [ ] 翻页动画

#### 长期（v2.0）
- [ ] 云端同步
- [ ] 多设备进度同步
- [ ] 社交分享功能
- [ ] 语音朗读

### 迁移指南 📖

对于现有安装，更新步骤：

1. **拉取代码**
   ```bash
   git pull origin main
   ```

2. **安装新依赖**
   ```bash
   npm install
   ```

3. **清除缓存**
   ```bash
   npx expo start --clear
   ```

4. **测试功能**
   - 检查预置书籍是否出现
   - 测试目录功能
   - 验证章节加载

### 贡献者 👥

- Claude Code - 功能开发和文档编写

### 反馈 💬

如有问题或建议，请：
1. 查看 TROUBLESHOOTING.md
2. 在 GitHub 提交 Issue
3. 参考 CLAUDE.md 了解架构

---

**版本**: Unreleased
**日期**: 2025-01-06
**状态**: ✅ 功能完成，等待测试
