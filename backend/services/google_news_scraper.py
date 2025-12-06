"""
Enhanced Google News Scraper with Advanced Search Features

This module provides advanced news scraping capabilities using Google News search
with time filters, sorting options, and intelligent article extraction.
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import quote_plus, urlencode
import time
import random
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor, as_completed
import re
from utils.date_utils import parse_published_date, sort_articles_by_date

# User agents for rotation
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
]

# Configuration
MAX_RETRIES = 3
TIMEOUT = 15
DELAY_MIN = 1
DELAY_MAX = 3


def random_headers():
    """Generate random headers to avoid detection"""
    return {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
    }


def smart_delay():
    """Add random delay to mimic human behavior"""
    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))


class GoogleNewsSearcher:
    """Advanced Google News search with filtering and sorting"""
    
    BASE_URL = "https://www.google.com/search"
    
    # Time filter mappings
    TIME_FILTERS = {
        'hour': 'qdr:h',      # Past hour
        'day': 'qdr:d',       # Past 24 hours
        'week': 'qdr:w',      # Past week
        'month': 'qdr:m',     # Past month
        'year': 'qdr:y',      # Past year
        'recent': '',         # Recent (default)
    }
    
    # Sort options
    SORT_OPTIONS = {
        'date': 'date',       # Sort by date
        'relevance': '',      # Sort by relevance (default)
    }
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(random_headers())
    
    def build_search_url(self, query, time_filter='week', sort_by='date', num_results=100):
        """
        Build Google News search URL with advanced parameters
        
        Args:
            query: Search query (stock name/ticker)
            time_filter: Time filter (hour, day, week, month, year, recent)
            sort_by: Sort option (date, relevance)
            num_results: Number of results to fetch
        
        Returns:
            str: Complete search URL
        """
        params = {
            'q': query,
            'tbm': 'nws',  # News search
            'num': num_results,
        }
        
        # Add time filter
        if time_filter in self.TIME_FILTERS:
            tbs_value = self.TIME_FILTERS[time_filter]
            if tbs_value:
                params['tbs'] = tbs_value
        
        # Add sort option
        if sort_by in self.SORT_OPTIONS:
            sort_value = self.SORT_OPTIONS[sort_by]
            if sort_value:
                params['tbs'] = params.get('tbs', '') + f',sbd:{sort_value}'
        
        url = f"{self.BASE_URL}?{urlencode(params)}"
        return url
    
    def search_news(self, query, time_filter='week', sort_by='date', max_articles=50):
        """
        Search Google News with advanced filters
        
        Args:
            query: Search query (stock name/ticker)
            time_filter: Time filter (hour, day, week, month, year)
            sort_by: Sort option (date, relevance)
            max_articles: Maximum articles to return
        
        Returns:
            list: List of article dictionaries
        """
        articles = []
        
        try:
            url = self.build_search_url(query, time_filter, sort_by)
            print(f"Searching Google News: {url}")
            
            smart_delay()
            
            # Use more sophisticated headers to avoid bot detection
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
            }
            
            response = self.session.get(
                url,
                headers=headers,
                timeout=TIMEOUT,
                allow_redirects=True
            )
            
            if response.status_code != 200:
                print(f"Google News search failed: {response.status_code}")
                return articles
            
            # Debug: Save HTML to file for inspection
            print(f"Response length: {len(response.content)} bytes")
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Debug: Check if we got a CAPTCHA or error page
            page_text = soup.get_text()[:500]
            if 'unusual traffic' in page_text.lower() or 'captcha' in page_text.lower():
                print("WARNING: Google detected bot activity. Using legacy scraper instead.")
                return articles
            
            # Try multiple selectors for news articles
            # Google News uses different structures, try them all
            news_items = []
            
            # Selector 1: Main news card container
            news_items = soup.find_all('div', class_='SoaBEf')
            
            if not news_items:
                # Selector 2: Alternative news container
                news_items = soup.find_all('div', class_='Gx5Zad')
            
            if not news_items:
                # Selector 3: Generic news result divs
                news_items = soup.find_all('div', {'jscontroller': True, 'data-hveid': True})
            
            if not news_items:
                # Selector 4: Try finding all article tags
                news_items = soup.find_all('article')
            
            if not news_items:
                # Selector 5: Find divs with links that look like news
                all_divs = soup.find_all('div')
                news_items = [div for div in all_divs if div.find('a', href=True) and div.find('h3')]
            
            print(f"Found {len(news_items)} news items")
            
            # Debug: Print HTML structure if no items found
            if len(news_items) == 0:
                print("DEBUG: No news items found. Checking page structure...")
                # Look for any h3 tags (usually titles)
                titles = soup.find_all('h3')
                print(f"Found {len(titles)} h3 tags on page")
                if titles:
                    print(f"Sample title: {titles[0].get_text()[:100]}")
                else:
                    # Save first 2000 chars of HTML for debugging
                    html_sample = str(soup)[:2000]
                    print(f"HTML sample: {html_sample}")
            
            for item in news_items[:max_articles]:
                try:
                    article = self._extract_article_data(item)
                    if article:
                        articles.append(article)
                except Exception as e:
                    print(f"Error extracting article: {e}")
                    continue
            
            print(f"Successfully extracted {len(articles)} articles")
            
        except Exception as e:
            print(f"Google News search error: {e}")
            import traceback
            traceback.print_exc()
        
        return articles
    
    def _extract_article_data(self, item):
        """Extract article data from search result item with enhanced content extraction"""
        try:
            # Method 1: Try standard Google News structure
            article = self._extract_standard_format(item)
            if article:
                return article
            
            # Method 2: Try alternative format
            article = self._extract_alternative_format(item)
            if article:
                return article
            
            return None
        
        except Exception as e:
            print(f"Error extracting article data: {e}")
            return None
    
    def _extract_standard_format(self, item):
        """Extract using standard Google News format"""
        try:
            # Find title - try multiple approaches
            title = None
            title_elem = (
                item.find('div', {'role': 'heading'}) or
                item.find('h3') or
                item.find('h4') or
                item.find('a', class_='JtKRv')
            )
            
            if title_elem:
                title = title_elem.get_text(strip=True)
            
            if not title:
                # Try finding any link with substantial text
                links = item.find_all('a', href=True)
                for link in links:
                    text = link.get_text(strip=True)
                    if len(text) > 20:  # Likely a title
                        title = text
                        break
            
            if not title:
                return None
            
            # Extract URL
            url = ''
            link_elem = item.find('a', href=True)
            if link_elem:
                url = link_elem['href']
                # Clean Google redirect URL
                if url.startswith('/url?q='):
                    url = url.split('/url?q=')[1].split('&')[0]
                elif url.startswith('/'):
                    url = f"https://www.google.com{url}"
            
            # Extract source - try multiple selectors
            source = 'Unknown'
            source_elem = (
                item.find('div', class_='CEMjEf') or
                item.find('span', class_='NUnG9d') or
                item.find('div', class_='UPmit') or
                item.find('span', class_='WG9SHc') or
                item.find('div', class_='XTjFC') or
                item.find('span', class_='vr1PYe')
            )
            
            if source_elem:
                source = source_elem.get_text(strip=True)
                # Clean source name
                source = source.split('·')[0].strip()
                source = source.split('-')[0].strip()
                source = source.split('...')[0].strip()
            
            # Extract snippet/description
            snippet = ''
            snippet_elem = (
                item.find('div', class_='GI74Re') or
                item.find('div', class_='Y3v8qd') or
                item.find('div', class_='st') or
                item.find('span', class_='st') or
                item.find('div', class_='lEBKkf')
            )
            
            if snippet_elem:
                snippet = snippet_elem.get_text(strip=True)
            
            # Extract date
            published_at = ''
            date_elem = (
                item.find('span', class_='OSrXXb') or
                item.find('span', class_='WG9SHc') or
                item.find('span', class_='f') or
                item.find('div', class_='OSrXXb') or
                item.find('time')
            )
            
            if date_elem:
                published_at = date_elem.get_text(strip=True)
                # If it's a time element, try to get datetime attribute
                if date_elem.name == 'time' and date_elem.get('datetime'):
                    published_at = date_elem.get('datetime')
            
            # Convert relative date to ISO format using shared utility
            published_iso = ''
            if published_at:
                try:
                    published_dt = parse_published_date(published_at)
                    published_iso = published_dt.isoformat()
                except:
                    published_iso = ''  # Empty string instead of current time
            
            # Determine if premium
            premium_sources = ['Bloomberg', 'WSJ', 'Financial Times', 'Barron\'s', 'Morningstar']
            is_premium = any(ps.lower() in source.lower() for ps in premium_sources)
            
            return {
                'title': title,
                'url': url,
                'source': source,
                'content': snippet,
                'description': snippet,
                'published_at': published_iso,
                'premium': is_premium,
                'search_engine': 'Google News'
            }
        
        except Exception as e:
            return None
    
    def _extract_alternative_format(self, item):
        """Extract using alternative format for different Google News layouts"""
        try:
            # Look for any h3 or h4 (common for titles)
            title_elem = item.find(['h3', 'h4'])
            if not title_elem:
                return None
            
            title = title_elem.get_text(strip=True)
            
            # Get the parent container
            container = title_elem.find_parent()
            if not container:
                container = item
            
            # Find link
            url = ''
            link = container.find('a', href=True)
            if link:
                url = link['href']
                if url.startswith('/url?q='):
                    url = url.split('/url?q=')[1].split('&')[0]
            
            # Find source - look for text near the title
            source = 'Unknown'
            # Try to find source in siblings or parent
            for elem in container.find_all(['span', 'div'], limit=10):
                text = elem.get_text(strip=True)
                # Source is usually short (< 50 chars) and doesn't contain the title
                if text and len(text) < 50 and text != title and not text.isdigit():
                    # Check if it looks like a source name
                    if any(word in text.lower() for word in ['finance', 'news', 'times', 'post', 'journal', 'bloomberg', 'reuters']):
                        source = text.split('·')[0].strip()
                        break
            
            # Find snippet
            snippet = ''
            for elem in container.find_all(['div', 'span'], limit=20):
                text = elem.get_text(strip=True)
                # Snippet is usually longer than title
                if text and len(text) > len(title) and text != title:
                    snippet = text
                    break
            
            # Find date
            published_at = ''
            for elem in container.find_all(['span', 'time'], limit=10):
                text = elem.get_text(strip=True)
                # Date usually contains time indicators
                if any(word in text.lower() for word in ['ago', 'hour', 'day', 'minute', 'week', 'month']):
                    published_at = text
                    break
            
            # Parse date using shared utility
            published_iso = ''
            if published_at:
                try:
                    published_dt = parse_published_date(published_at)
                    published_iso = published_dt.isoformat()
                except:
                    published_iso = ''
            
            premium_sources = ['Bloomberg', 'WSJ', 'Financial Times', 'Barron\'s', 'Morningstar']
            is_premium = any(ps.lower() in source.lower() for ps in premium_sources)
            
            return {
                'title': title,
                'url': url,
                'source': source,
                'content': snippet,
                'description': snippet,
                'published_at': published_iso,
                'premium': is_premium,
                'search_engine': 'Google News'
            }
        
        except Exception as e:
            return None
    



class EnhancedNewsAggregator:
    """Enhanced news aggregator combining Google News with existing scrapers"""
    
    def __init__(self):
        self.google_searcher = GoogleNewsSearcher()
    
    def fetch_comprehensive_news(self, stock_name, ticker=None, time_filter='week', 
                                  sort_by='date', max_articles=50, include_legacy=True):
        """
        Fetch comprehensive news from Google News and legacy scrapers
        
        Args:
            stock_name: Company name
            ticker: Stock ticker
            time_filter: Time filter (hour, day, week, month, year)
            sort_by: Sort option (date, relevance)
            max_articles: Maximum articles per source
            include_legacy: Include legacy scraper results
        
        Returns:
            list: Combined and deduplicated articles
        """
        all_articles = []
        
        # 1. Google News search (primary source)
        print(f"Fetching from Google News: {stock_name}")
        google_articles = self.google_searcher.search_news(
            stock_name,
            time_filter=time_filter,
            sort_by=sort_by,
            max_articles=max_articles
        )
        all_articles.extend(google_articles)
        
        # If ticker provided, search by ticker too
        if ticker and ticker != stock_name:
            print(f"Fetching from Google News: {ticker}")
            ticker_articles = self.google_searcher.search_news(
                ticker,
                time_filter=time_filter,
                sort_by=sort_by,
                max_articles=max_articles // 2
            )
            all_articles.extend(ticker_articles)
        
        # 2. Legacy scrapers (TRUE FALLBACK - only if Google News returned no results)
        if include_legacy and len(all_articles) == 0:
            print("Google News returned no articles, falling back to legacy scrapers...")
            try:
                from scraper import scrape_all_sources
                print("Fetching from legacy scrapers...")
                legacy_articles = scrape_all_sources(stock_name)
                all_articles.extend(legacy_articles[:max_articles])
                print(f"Legacy scraper returned {len(legacy_articles)} articles")
            except Exception as e:
                print(f"Legacy scraper error: {e}")
        
        # 3. Deduplicate articles
        unique_articles = self._deduplicate_articles(all_articles)
        
        # 4. Sort by date (most recent first) using shared utility
        unique_articles = sort_articles_by_date(unique_articles, reverse=True)
        
        print(f"Total unique articles: {len(unique_articles)}")
        
        return unique_articles[:max_articles]
    
    def _deduplicate_articles(self, articles):
        """Remove duplicate articles based on title similarity"""
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


# Convenience function for easy integration
def search_google_news(stock_name, ticker=None, time_filter='week', sort_by='date', max_articles=50):
    """
    Search Google News with advanced filters
    
    Args:
        stock_name: Company name
        ticker: Stock ticker (optional)
        time_filter: hour, day, week, month, year, recent
        sort_by: date, relevance
        max_articles: Maximum articles to return
    
    Returns:
        list: List of article dictionaries
    """
    aggregator = EnhancedNewsAggregator()
    return aggregator.fetch_comprehensive_news(
        stock_name=stock_name,
        ticker=ticker,
        time_filter=time_filter,
        sort_by=sort_by,
        max_articles=max_articles,
        include_legacy=True
    )


if __name__ == "__main__":
    # Test the scraper
    print("Testing Enhanced Google News Scraper...")
    articles = search_google_news("NATCO Pharma", ticker="NATCO", time_filter="week", sort_by="date")
    
    print(f"\nFound {len(articles)} articles:")
    for i, article in enumerate(articles[:5], 1):
        print(f"\n{i}. {article['title']}")
        print(f"   Source: {article['source']}")
        print(f"   Date: {article['published_at']}")
        print(f"   URL: {article['url'][:80]}...")
