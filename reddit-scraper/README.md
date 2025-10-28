# Reddit 产品关键词爬虫

一个用于爬取 Reddit 上产品相关讨论和关键词的 Python 工具。

## 功能特点

- 🔍 按关键词搜索多个 subreddit
- 📊 获取帖子详细信息（标题、内容、评分、评论数等）
- 💾 支持导出为 JSON 和 CSV 格式
- ⚙️ 灵活的配置系统
- 🔒 使用官方 Reddit API，安全稳定

## 项目结构

```
reddit-scraper/
├── scraper.py          # 主爬虫脚本
├── config.json         # 配置文件（关键词、子版块等）
├── requirements.txt    # Python 依赖
├── .env.example        # 环境变量示例
├── .env                # 环境变量（需自行创建）
├── README.md           # 本文件
└── data/               # 数据输出目录
    ├── reddit_results_*.json
    └── reddit_results_*.csv
```

## 快速开始

### 1. 安装依赖

```bash
cd reddit-scraper
pip install -r requirements.txt
```

### 2. 获取 Reddit API 凭证

1. 访问 [Reddit Apps](https://www.reddit.com/prefs/apps)
2. 点击 "Create App" 或 "Create Another App"
3. 填写信息：
   - **name**: 应用名称（例如：Product Keyword Scraper）
   - **App type**: 选择 "script"
   - **description**: 应用描述（可选）
   - **about url**: 留空
   - **redirect uri**: 填写 `http://localhost:8080`
4. 点击 "Create app"
5. 记下以下信息：
   - **Client ID**: 在应用名称下方的一串字符
   - **Client Secret**: "secret" 字段的值

### 3. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Reddit API 凭证：

```env
REDDIT_CLIENT_ID=你的_client_id
REDDIT_CLIENT_SECRET=你的_client_secret
REDDIT_USER_AGENT=python:reddit-keyword-scraper:v1.0 (by /u/你的Reddit用户名)
```

### 4. 配置搜索参数

编辑 `config.json` 自定义搜索关键词和子版块：

```json
{
  "keywords": [
    "kbeauty",
    "korean beauty",
    "skincare"
  ],
  "subreddits": [
    "kbeauty",
    "AsianBeauty",
    "SkincareAddiction"
  ],
  "limit": 50
}
```

### 5. 运行爬虫

```bash
python scraper.py
```

## 配置说明

### config.json 参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `keywords` | 要搜索的关键词列表 | `["kbeauty", "skincare"]` |
| `subreddits` | 要搜索的子版块列表 | `["kbeauty", "AsianBeauty"]` |
| `limit` | 每次搜索返回的最大结果数 | `50` |
| `time_filter` | 时间过滤（可选） | `"week"` / `"month"` / `"year"` |

### 推荐的美妆相关 Subreddits

- `kbeauty` - 韩国美妆
- `AsianBeauty` - 亚洲美妆
- `SkincareAddiction` - 护肤讨论
- `beauty` - 一般美妆
- `MakeupAddiction` - 彩妆
- `koreanbeauty` - 韩国美妆产品

## 输出数据格式

### JSON 格式示例

```json
[
  {
    "id": "abc123",
    "title": "Best Korean Sunscreen 2024",
    "author": "username",
    "created_utc": "2024-01-15T10:30:00",
    "score": 245,
    "upvote_ratio": 0.95,
    "num_comments": 42,
    "url": "https://reddit.com/...",
    "permalink": "https://reddit.com/r/kbeauty/...",
    "selftext": "帖子内容...",
    "subreddit": "kbeauty",
    "keyword": "korean beauty"
  }
]
```

### CSV 格式

包含相同的字段，便于在 Excel 或 Google Sheets 中分析。

## 使用场景

- 📈 产品市场调研
- 💬 用户反馈收集
- 🔥 热门话题追踪
- 🎯 竞品分析
- 📝 内容创作灵感

## 注意事项

1. **API 限制**: Reddit API 有速率限制，建议不要频繁运行
2. **合规使用**: 遵守 Reddit API 使用条款和社区规则
3. **数据隐私**: 不要爬取和存储个人隐私信息
4. **备份 .env**: 不要将 `.env` 文件提交到 git 仓库

## 常见问题

### Q: 显示 "401 Unauthorized" 错误？
A: 检查 `.env` 文件中的 API 凭证是否正确。

### Q: 没有找到任何结果？
A: 检查关键词是否正确，或尝试更通用的关键词。

### Q: 如何搜索更多结果？
A: 在 `config.json` 中增加 `limit` 参数的值。

### Q: 可以搜索中文关键词吗？
A: 可以，但 Reddit 上英文内容较多，中文关键词可能结果较少。

## 高级用法

### 自定义搜索

直接在 Python 中使用 RedditScraper 类：

```python
from scraper import RedditScraper

scraper = RedditScraper()

# 搜索特定关键词
results = scraper.search_keywords('kbeauty', 'SkincareAddiction', limit=100)

# 获取热门帖子
top_posts = scraper.get_top_posts('kbeauty', time_filter='month', limit=50)

# 保存结果
scraper.save_results(results, format='json')
```

## 技术栈

- Python 3.7+
- PRAW (Python Reddit API Wrapper)
- python-dotenv
- pandas (可选)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关资源

- [PRAW 文档](https://praw.readthedocs.io/)
- [Reddit API 文档](https://www.reddit.com/dev/api/)
- [Reddit API 使用条款](https://www.redditinc.com/policies/data-api-terms)
