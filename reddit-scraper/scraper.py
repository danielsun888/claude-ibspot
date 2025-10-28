#!/usr/bin/env python3
"""
Reddit Product Keyword Scraper
爬取 Reddit 上的产品关键词信息
"""

import praw
import json
import os
from datetime import datetime
from dotenv import load_dotenv
import csv

# 加载环境变量
load_dotenv()

class RedditScraper:
    def __init__(self):
        """初始化 Reddit API 客户端"""
        self.reddit = praw.Reddit(
            client_id=os.getenv('REDDIT_CLIENT_ID'),
            client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
            user_agent=os.getenv('REDDIT_USER_AGENT', 'Reddit Keyword Scraper v1.0')
        )

        # 加载配置
        self.load_config()

    def load_config(self):
        """加载关键词和子版块配置"""
        config_file = 'config.json'
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
                self.keywords = config.get('keywords', [])
                self.subreddits = config.get('subreddits', [])
                self.limit = config.get('limit', 100)
        else:
            # 默认配置
            self.keywords = ['skincare', 'kbeauty', 'korean beauty']
            self.subreddits = ['kbeauty', 'SkincareAddiction', 'AsianBeauty']
            self.limit = 100

    def search_keywords(self, keyword, subreddit_name, limit=None):
        """
        在指定子版块中搜索关键词

        Args:
            keyword: 搜索关键词
            subreddit_name: 子版块名称
            limit: 返回结果数量限制

        Returns:
            包含帖子信息的列表
        """
        if limit is None:
            limit = self.limit

        results = []

        try:
            subreddit = self.reddit.subreddit(subreddit_name)

            # 搜索帖子
            for submission in subreddit.search(keyword, limit=limit, sort='relevance'):
                post_data = {
                    'id': submission.id,
                    'title': submission.title,
                    'author': str(submission.author),
                    'created_utc': datetime.fromtimestamp(submission.created_utc).isoformat(),
                    'score': submission.score,
                    'upvote_ratio': submission.upvote_ratio,
                    'num_comments': submission.num_comments,
                    'url': submission.url,
                    'permalink': f"https://reddit.com{submission.permalink}",
                    'selftext': submission.selftext[:500],  # 限制文本长度
                    'subreddit': subreddit_name,
                    'keyword': keyword
                }
                results.append(post_data)

            print(f"✓ 在 r/{subreddit_name} 中找到 {len(results)} 个关于 '{keyword}' 的帖子")

        except Exception as e:
            print(f"✗ 搜索 r/{subreddit_name} 时出错: {str(e)}")

        return results

    def get_top_posts(self, subreddit_name, time_filter='week', limit=None):
        """
        获取子版块的热门帖子

        Args:
            subreddit_name: 子版块名称
            time_filter: 时间过滤 ('hour', 'day', 'week', 'month', 'year', 'all')
            limit: 返回结果数量限制

        Returns:
            包含帖子信息的列表
        """
        if limit is None:
            limit = self.limit

        results = []

        try:
            subreddit = self.reddit.subreddit(subreddit_name)

            for submission in subreddit.top(time_filter=time_filter, limit=limit):
                post_data = {
                    'id': submission.id,
                    'title': submission.title,
                    'author': str(submission.author),
                    'created_utc': datetime.fromtimestamp(submission.created_utc).isoformat(),
                    'score': submission.score,
                    'upvote_ratio': submission.upvote_ratio,
                    'num_comments': submission.num_comments,
                    'url': submission.url,
                    'permalink': f"https://reddit.com{submission.permalink}",
                    'selftext': submission.selftext[:500],
                    'subreddit': subreddit_name,
                }
                results.append(post_data)

            print(f"✓ 从 r/{subreddit_name} 获取了 {len(results)} 个热门帖子")

        except Exception as e:
            print(f"✗ 获取 r/{subreddit_name} 热门帖子时出错: {str(e)}")

        return results

    def scrape_all(self):
        """执行完整的爬取任务"""
        all_results = []

        print("=" * 50)
        print("开始爬取 Reddit 产品关键词信息")
        print("=" * 50)

        # 遍历所有关键词和子版块组合
        for keyword in self.keywords:
            for subreddit in self.subreddits:
                print(f"\n正在搜索: '{keyword}' in r/{subreddit}")
                results = self.search_keywords(keyword, subreddit)
                all_results.extend(results)

        print(f"\n总共找到 {len(all_results)} 个帖子")

        return all_results

    def save_results(self, results, format='json'):
        """
        保存结果到文件

        Args:
            results: 结果列表
            format: 保存格式 ('json' 或 'csv')
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        if format == 'json':
            filename = f'data/reddit_results_{timestamp}.json'
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            print(f"\n✓ 结果已保存到: {filename}")

        elif format == 'csv':
            filename = f'data/reddit_results_{timestamp}.csv'
            if results:
                keys = results[0].keys()
                with open(filename, 'w', encoding='utf-8', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=keys)
                    writer.writeheader()
                    writer.writerows(results)
                print(f"\n✓ 结果已保存到: {filename}")

        return filename

def main():
    """主函数"""
    print("\n" + "="*50)
    print("Reddit 产品关键词爬虫")
    print("="*50 + "\n")

    # 创建爬虫实例
    scraper = RedditScraper()

    # 执行爬取
    results = scraper.scrape_all()

    # 保存结果（同时保存 JSON 和 CSV 格式）
    if results:
        scraper.save_results(results, format='json')
        scraper.save_results(results, format='csv')
    else:
        print("\n⚠ 没有找到任何结果")

    print("\n" + "="*50)
    print("爬取完成！")
    print("="*50 + "\n")

if __name__ == '__main__':
    main()
