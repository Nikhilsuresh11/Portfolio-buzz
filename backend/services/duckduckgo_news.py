"""
DuckDuckGo News Scraper - Render-Friendly Alternative

DuckDuckGo doesn't block server IPs and works reliably on Render's free tier.
No API key required, good coverage for Indian stocks.
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from urllib.parse import quote_plus
import time
import re


class DuckDuckGoNewsFetcher:
    """Fetch news from DuckDuckGo News (no bot detection, works on Render)"""
    
    BASE_URL = "https://duckduckgo.com/html/"
    
    @staticmethod
    def fetch_news(query, max_articles=20, days=7):
        """
        Fetch news from DuckDuckGo
        
        Args:
            query: Search query (stock name/ticker)
            max_articles: Maximum articles to return
            days: Number of days to look back
        
        Returns:
            list: List of article dictionaries
        """
        articles = []
        
        try:
            # Build search query
            search_query = f"{query} stock news"
            
            # DuckDuckGo HTML search (no JavaScript required, no bot detection)
            params = {
                'q': search_query,
                'kl': 'us-en',  # Region
                'df': f'{days}d',  # Date filter (last N days)
            }
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://duckduckgo.com/',
            }
            
            print(f"Fetching DuckDuckGo news: {search_query}")
            
            response = requests.post(
                DuckDuckGoNewsFetcher.BASE_URL,
                data=params,
                headers=headers,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"DuckDuckGo returned status {response.status_code}")
                return articles
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Parse results
            results = soup.find_all('div', class_='result')
            
            for result in results[:max_articles]:
                try:
                    # Extract title
                    title_elem = result.find('a', class_='result__a')
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    url = title_elem.get('href', '')
                    
                    # Extract snippet
                    snippet_elem = result.find('a', class_='result__snippet')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ''
                    
                    # Extract source (from URL domain)
                    source = 'Unknown'
                    if url:
                        try:
                            from urllib.parse import urlparse
                            domain = urlparse(url).netloc
                            source = domain.replace('www.', '').split('.')[0].title()
                        except:
                            pass
                    
                    # Determine if premium
                    premium_sources = ['Bloomberg', 'WSJ', 'Financial Times', 'Barrons', 'Morningstar']
                    is_premium = any(ps.lower() in source.lower() for ps in premium_sources)
                    
                    articles.append({
                        'title': title,
                        'url': url,
                        'source': source,
                        'content': snippet,
                        'description': snippet,
                        'published_at': datetime.now().isoformat(),  # DDG doesn't provide dates
                        'premium': is_premium,
                        'search_engine': 'DuckDuckGo'
                    })
                    
                except Exception as e:
                    print(f"Error parsing DuckDuckGo result: {e}")
                    continue
            
            print(f"DuckDuckGo returned {len(articles)} articles")
            
        except Exception as e:
            print(f"DuckDuckGo error: {e}")
            import traceback
            traceback.print_exc()
        
        return articles


def fetch_duckduckgo_news(stock_name, ticker=None, max_articles=20, days=7):
    """
    Convenience function to fetch news from DuckDuckGo
    
    Args:
        stock_name: Company name
        ticker: Stock ticker (optional)
        max_articles: Maximum articles to return
        days: Number of days to look back
    
    Returns:
        list: List of article dictionaries
    """
    query = ticker if ticker else stock_name
    return DuckDuckGoNewsFetcher.fetch_news(query, max_articles, days)


if __name__ == "__main__":
    # Test
    print("Testing DuckDuckGo News Fetcher...")
    articles = fetch_duckduckgo_news("Reliance Industries", "RELIANCE", max_articles=10)
    
    print(f"\nFound {len(articles)} articles:")
    for i, article in enumerate(articles[:5], 1):
        print(f"\n{i}. {article['title']}")
        print(f"   Source: {article['source']}")
        print(f"   URL: {article['url'][:80]}...")
