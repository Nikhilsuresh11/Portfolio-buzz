import sys
import os

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper import scrape_all_sources
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from utils.date_utils import (
    filter_articles_by_date,
    sort_articles_by_date,
    get_default_days,
    map_time_filter_to_days
)


class NewsService:
    """Enhanced news aggregation service with Google News integration"""
    
    @staticmethod
    def fetch_news(stock_name, ticker=None, include_global=True, include_indian=True, 
                   max_articles=20, use_google_news=True, time_filter='week', sort_by='date'):
        """
        Fetch news for a single stock with enhanced Google News search
        
        Args:
            stock_name: Company name or ticker
            ticker: Stock ticker (optional)
            include_global: Include global news sources
            include_indian: Include Indian news sources
            max_articles: Maximum number of articles to return
            use_google_news: Use Google News search (recommended)
            time_filter: Time filter (hour, day, week, month, year, recent)
            sort_by: Sort option (date, relevance)
        
        Returns:
            tuple: (success: bool, message: str, data: list or None)
        """
        try:
            all_articles = []
            
            # 1. DuckDuckGo News (PRIMARY - works on Render, no bot detection)
            # DuckDuckGo doesn't block server IPs like Google does
            if use_google_news:  # Reusing this flag for "use web sources"
                try:
                    from services.duckduckgo_news import fetch_duckduckgo_news
                    
                    # Map time_filter to days
                    days_map = {'hour': 1, 'day': 1, 'week': 7, 'month': 30, 'year': 365}
                    days = days_map.get(time_filter, 7)
                    
                    print(f"Fetching from DuckDuckGo: {stock_name} (last {days} days)")
                    ddg_articles = fetch_duckduckgo_news(stock_name, ticker, max_articles, days)
                    all_articles.extend(ddg_articles)
                    print(f"DuckDuckGo returned {len(ddg_articles)} articles")
                except Exception as e:
                    print(f"DuckDuckGo error: {e}")
            
            # 2. Google News RSS (FALLBACK - may be blocked on Render)
            # Only try if DuckDuckGo returned few/no results
            if len(all_articles) < 5:
                try:
                    from services.google_news_rss import fetch_google_news_rss
                    print(f"DuckDuckGo returned few results, trying Google News RSS...")
                    google_articles = fetch_google_news_rss(
                        stock_name=stock_name,
                        ticker=ticker,
                        time_filter=time_filter,
                        max_articles=max_articles
                    )
                    all_articles.extend(google_articles)
                    print(f"Google News RSS returned {len(google_articles)} articles")
                except Exception as e:
                    print(f"Google News RSS error: {e}")
            
            # 2. Legacy scraper FALLBACK (strict limits for Render free tier)
            # Only runs if Google News RSS returned 0 articles
            # Uses minimal sources and strict timeout to prevent 504 errors
            if len(all_articles) == 0:
                print("Google News RSS returned no articles, trying limited legacy scraper...")
                try:
                    import signal
                    from functools import wraps
                    
                    def timeout_handler(signum, frame):
                        raise TimeoutError("Legacy scraper timeout")
                    
                    # Set 10-second timeout for entire legacy scraper operation
                    if hasattr(signal, 'SIGALRM'):  # Unix only
                        signal.signal(signal.SIGALRM, timeout_handler)
                        signal.alarm(10)
                    
                    try:
                        query = ticker if ticker else stock_name
                        # Only use 3 fastest sources to prevent timeout
                        from scraper import scrape_google_news, scrape_yahoo_finance, scrape_economic_times
                        
                        legacy_articles = []
                        legacy_articles.extend(scrape_google_news(query)[:5])
                        legacy_articles.extend(scrape_yahoo_finance(query)[:3])
                        legacy_articles.extend(scrape_economic_times(query)[:2])
                        
                        all_articles.extend(legacy_articles[:10])  # Max 10 articles
                        print(f"Limited legacy scraper returned {len(legacy_articles)} articles")
                    finally:
                        if hasattr(signal, 'SIGALRM'):
                            signal.alarm(0)  # Cancel alarm
                            
                except TimeoutError:
                    print("Legacy scraper timed out after 10 seconds")
                except Exception as e:
                    print(f"Legacy scraper error: {e}")
            
            # Limit and deduplicate
            unique_articles = NewsService._deduplicate_articles(all_articles)
            unique_articles = unique_articles[:max_articles]
            
            # Format articles
            formatted_articles = []
            for article in unique_articles:
                formatted_articles.append({
                    'title': article.get('title', ''),
                    'content': article.get('content', '') or article.get('description', ''),
                    'source': article.get('source', ''),
                    'premium': article.get('premium', False),
                    'url': article.get('url', ''),
                    'published_at': article.get('published_at', '')  # Use article timestamp, not current time
                })
            
            return True, f"Found {len(formatted_articles)} articles", formatted_articles
        
        except Exception as e:
            return False, f"Error fetching news: {str(e)}", None
    
    @staticmethod
    def _deduplicate_articles(articles):
        """Remove duplicate articles based on title similarity"""
        import re
        
        unique_articles = []
        seen_titles = set()
        
        for article in articles:
            title = article.get('title', '').lower().strip()
            
            # Create a normalized title for comparison
            normalized_title = re.sub(r'[^\w\s]', '', title)
            normalized_title = ' '.join(normalized_title.split())
            
            if normalized_title and normalized_title not in seen_titles:
                seen_titles.add(normalized_title)
                unique_articles.append(article)
        
        return unique_articles
    
    @staticmethod
    def fetch_news_for_multiple_stocks(tickers, max_workers=1):
        """
        Fetch news for multiple stocks SEQUENTIALLY for memory safety
        
        Args:
            tickers: List of stock tickers
            max_workers: Number of parallel workers (default 1 = sequential for Render free tier)
        
        Returns:
            dict: Dictionary mapping tickers to their news articles
        """
        news_data = {}
        
        # Sequential processing to minimize memory usage and prevent timeouts
        # Each stock gets max 15 articles to limit memory
        for ticker in tickers[:10]:  # Limit to 10 tickers max
            try:
                success, message, articles = NewsService.fetch_news(ticker, ticker, max_articles=15)
                if success:
                    news_data[ticker] = articles[:15]  # Hard limit per ticker
                else:
                    news_data[ticker] = []
            except Exception as e:
                print(f"Error fetching news for {ticker}: {e}")
                news_data[ticker] = []
        
        return news_data
    
    @staticmethod
    def fetch_news_by_days(stock_name, ticker=None, days=None):
        """
        Fetch news for the last N days using article published timestamps
        
        Args:
            stock_name: Company name or ticker
            ticker: Stock ticker (optional)
            days: Number of days to fetch news for (default: 2 days)
        
        Returns:
            tuple: (success: bool, message: str, data: list or None)
        """
        try:
            # Use default days if not provided
            if days is None:
                days = get_default_days()
            
            # Fetch all available news
            success, message, articles = NewsService.fetch_news(stock_name, ticker)
            
            if not success:
                return success, message, articles
            
            # Filter articles by their published_at timestamp (not current time)
            filtered_articles = filter_articles_by_date(articles, days)
            
            # Sort by date (latest first)
            filtered_articles = sort_articles_by_date(filtered_articles, reverse=True)
            
            return True, f"Found {len(filtered_articles)} articles from last {days} days", filtered_articles
        
        except Exception as e:
            return False, f"Error fetching news: {str(e)}", None
    
    @staticmethod
    def get_news_summary(articles):
        """
        Get a summary of news articles (count by source, sentiment, etc.)
        
        Args:
            articles: List of news articles
        
        Returns:
            dict: Summary statistics
        """
        if not articles:
            return {
                'total_articles': 0,
                'sources': [],
                'premium_count': 0,
                'free_count': 0
            }
        
        sources = {}
        premium_count = 0
        free_count = 0
        
        for article in articles:
            source = article.get('source', 'Unknown')
            sources[source] = sources.get(source, 0) + 1
            
            if article.get('premium'):
                premium_count += 1
            else:
                free_count += 1
        
        return {
            'total_articles': len(articles),
            'sources': [{'name': name, 'count': count} for name, count in sources.items()],
            'premium_count': premium_count,
            'free_count': free_count
        }
