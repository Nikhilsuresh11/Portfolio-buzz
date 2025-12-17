"""
Google News RSS Feed Scraper - Bot-Friendly Alternative

This module uses Google News RSS feeds instead of web scraping to avoid bot detection.
RSS feeds are official, reliable, and don't trigger Google's anti-bot measures.
"""

import feedparser
import time
import random
import requests  # For direct HTTP calls with custom headers
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
    def fetch_news(query, time_filter='week', max_articles=15, language='en-US', region='US'):
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
            
            # ANTI-BOT: Try multiple User-Agents to bypass Render IP blocking
            # Render's shared IPs are often flagged, so we rotate through different profiles
            user_agents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
                'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
            ]
            
            response = None
            for attempt, ua in enumerate(user_agents):
                try:
                    headers = {
                        'User-Agent': ua,
                        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                    }
                    
                    response = requests.get(rss_url, headers=headers, timeout=10, verify=True)
                    
                    if response.status_code == 200:
                        print(f"✓ RSS fetch succeeded with User-Agent {attempt + 1}")
                        break
                    else:
                        print(f"✗ RSS fetch failed (status {response.status_code}), trying next User-Agent...")
                        response = None
                        time.sleep(1)  # Brief delay before retry
                        
                except Exception as e:
                    print(f"✗ RSS fetch error with User-Agent {attempt + 1}: {e}")
                    response = None
                    if attempt < len(user_agents) - 1:
                        time.sleep(1)
            
            if not response or response.status_code != 200:
                print(f"Failed to fetch RSS after {len(user_agents)} attempts (likely bot detection)")
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
def fetch_google_news_rss(stock_name, ticker=None, time_filter='week', max_articles=15):
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
    
    # Skip ticker-based secondary query for speed on Render free tier
    # This reduces requests by 50% and prevents timeout issues
    # The stock_name query usually captures ticker-related news anyway
    
    # OLD CODE (disabled for performance):
    # if ticker and ticker != stock_name:
    #     ticker_articles = GoogleNewsRSSFetcher.fetch_news(ticker, time_filter, max_articles // 2)
    #     all_articles.extend(ticker_articles)
    
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
