"""
Google News RSS Feed Scraper - Bot-Friendly Alternative

This module uses Google News RSS feeds instead of web scraping to avoid bot detection.
RSS feeds are official, reliable, and don't trigger Google's anti-bot measures.
"""

import feedparser
import time
import random
from datetime import datetime
from urllib.parse import quote_plus
import re
from scraper import fetch_url  # Import the robust fetcher with headers
from utils.date_utils import parse_published_date, sort_articles_by_date


class GoogleNewsRSSFetcher:
    """Fetch news from Google News RSS feeds"""
    
    BASE_URL = "https://news.google.com/rss/search"
    
    # Time filter mappings for RSS (matches Google News UI exactly)
    # These correspond to the tbs=qdr: parameter in Google News web UI
    TIME_FILTERS = {
        'hour': 'when:1h',      # Past hour (qdr:h in web UI)
        'day': 'when:1d',       # Past 24 hours (qdr:d in web UI)
        'week': 'when:7d',      # Past week (qdr:w in web UI)
        'month': 'when:1m',     # Past month (qdr:m in web UI)
        'year': 'when:1y',      # Past year (qdr:y in web UI)
        'recent': '',           # Recent/default
    }
    
    # Supported languages and regions (matching Google News UI)
    LANGUAGES = {
        'en-US': 'US:en',
        'en-IN': 'IN:en',
        'en-GB': 'GB:en',
    }
    
    @staticmethod
    def fetch_news(query, time_filter='week', max_articles=50, language='en-US', region='US'):
        """
        Fetch news from Google News RSS feed using exact URL structure from Google News UI
        
        Args:
            query: Search query (stock name/ticker)
            time_filter: Time filter (hour, day, week, month, year)
            max_articles: Maximum articles to return
            language: Language code (default: en-US)
            region: Region code (default: US)
        
        Returns:
            list: List of article dictionaries
        """
        articles = []
        
        try:
            # Build search query with time filter (matches Google News UI behavior)
            search_query = query
            if time_filter in GoogleNewsRSSFetcher.TIME_FILTERS:
                time_param = GoogleNewsRSSFetcher.TIME_FILTERS[time_filter]
                if time_param:
                    search_query = f"{query} {time_param}"
            
            # Get language/region code
            ceid = GoogleNewsRSSFetcher.LANGUAGES.get(language, 'US:en')
            
            # Build RSS URL with exact parameters matching Google News web UI
            # This ensures we get the same results as the UI filters
            rss_url = (
                f"{GoogleNewsRSSFetcher.BASE_URL}"
                f"?q={quote_plus(search_query)}"
                f"&hl={language}"
                f"&gl={region}"
                f"&ceid={ceid}"
            )
            
            print(f"Fetching Google News RSS: {rss_url}")
            print(f"Time filter: {time_filter} (matches Google News UI filter)")
            
            # Parse RSS feed with timeout AND custom headers using fetch_url
            # feedparser.parse(url) uses generic User-Agent which gets blocked
            # Use skip_delay=True for RSS feeds since they don't need rate limiting
            response = fetch_url(rss_url, skip_delay=True)
            if not response:
                print(f"Failed to fetch RSS URL (blocked?): {rss_url}")
                return articles
                
            feed = feedparser.parse(response.content)
            
            if not feed.entries:
                print(f"No RSS entries found for query: {query}")
                return articles
            
            print(f"Found {len(feed.entries)} RSS entries")
            
            for entry in feed.entries[:max_articles]:
                try:
                    article = GoogleNewsRSSFetcher._parse_entry(entry)
                    if article:
                        articles.append(article)
                except Exception as e:
                    print(f"Error parsing RSS entry: {e}")
                    continue
            
            print(f"Successfully parsed {len(articles)} articles from RSS")
            
        except Exception as e:
            print(f"Google News RSS error: {e}")
            import traceback
            traceback.print_exc()
        
        return articles
    
    @staticmethod
    def _parse_entry(entry):
        """Parse a single RSS entry"""
        try:
            # Extract title
            title = entry.title if hasattr(entry, 'title') else ''
            
            # Extract URL
            url = entry.link if hasattr(entry, 'link') else ''
            
            # Extract source
            source = 'Google News'
            if hasattr(entry, 'source') and hasattr(entry.source, 'title'):
                source = entry.source.title
            
            # Extract content/summary
            content = ''
            if hasattr(entry, 'summary'):
                content = entry.summary
                # Clean HTML tags from summary
                content = re.sub(r'<[^>]+>', '', content)
            
            # Extract published date using shared utility
            published_at = ''
            if hasattr(entry, 'published'):
                published_at = entry.published
            elif hasattr(entry, 'published_parsed'):
                try:
                    published_dt = datetime(*entry.published_parsed[:6])
                    published_at = published_dt.isoformat()
                except:
                    pass
            
            # Parse to ensure consistent format (don't use datetime.now() as fallback)
            if published_at:
                try:
                    published_dt = parse_published_date(published_at)
                    published_at = published_dt.isoformat()
                except:
                    published_at = ''  # Empty string instead of current time
            
            # Determine if premium
            premium_sources = ['Bloomberg', 'WSJ', 'Wall Street Journal', 'Financial Times', 'Barron\'s', 'Morningstar']
            is_premium = any(ps.lower() in source.lower() for ps in premium_sources)
            
            return {
                'title': title,
                'url': url,
                'source': source,
                'content': content,
                'description': content,
                'published_at': published_at,
                'premium': is_premium,
                'search_engine': 'Google News RSS'
            }
        
        except Exception as e:
            print(f"Error parsing entry: {e}")
            return None


# Convenience function
def fetch_google_news_rss(stock_name, ticker=None, time_filter='week', max_articles=50):
    """
    Fetch news from Google News RSS feed
    
    Args:
        stock_name: Company name
        ticker: Stock ticker (optional)
        time_filter: hour, day, week, month, year
        max_articles: Maximum articles to return
    
    Returns:
        list: List of article dictionaries
    """
    all_articles = []
    
    # Fetch by stock name
    articles = GoogleNewsRSSFetcher.fetch_news(stock_name, time_filter, max_articles)
    all_articles.extend(articles)
    
    # If ticker provided and different from name, fetch by ticker too
    if ticker and ticker != stock_name:
        ticker_articles = GoogleNewsRSSFetcher.fetch_news(ticker, time_filter, max_articles // 2)
        all_articles.extend(ticker_articles)
    
    # Deduplicate
    seen_titles = set()
    unique_articles = []
    for article in all_articles:
        title_normalized = re.sub(r'[^\w\s]', '', article['title'].lower())
        if title_normalized and title_normalized not in seen_titles:
            seen_titles.add(title_normalized)
            unique_articles.append(article)
    
    # Sort by date (newest first) using shared utility
    unique_articles = sort_articles_by_date(unique_articles, reverse=True)
    
    return unique_articles[:max_articles]


if __name__ == "__main__":
    # Test the RSS fetcher
    print("Testing Google News RSS Fetcher...")
    articles = fetch_google_news_rss("Apple", ticker="AAPL", time_filter="day", max_articles=10)
    
    print(f"\nFound {len(articles)} articles:")
    for i, article in enumerate(articles[:5], 1):
        print(f"\n{i}. {article['title']}")
        print(f"   Source: {article['source']}")
        print(f"   Date: {article['published_at']}")
        print(f"   URL: {article['url'][:80]}...")
