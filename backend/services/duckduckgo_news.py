from ddgs import DDGS
from datetime import datetime
import sys
import os

# Add parent directory to path to import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.date_utils import parse_published_date

class DuckDuckGoNewsFetcher:
    """Fetch news using DuckDuckGo Search API"""
    
    @staticmethod
    def fetch_news(query, time_filter='w', max_articles=50):
        """
        Fetch news using DuckDuckGo
        
        Args:
            query: Search query
            time_filter: 'd' (day), 'w' (week), 'm' (month)
            max_articles: Maximum results
            
        Returns:
            list: List of formatted articles
        """
        results = []
        try:
            # Map common time filters to DDG format
            ddg_time = time_filter
            if time_filter == 'day': ddg_time = 'd'
            if time_filter == 'week': ddg_time = 'w'
            if time_filter == 'month': ddg_time = 'm'
            if time_filter == 'year': ddg_time = 'y'
            # 'recent' or unknown -> defaults to None/no filter, or 'd' if strict? Let's default to 'w' if unknown or allow empty
            if time_filter == 'recent': ddg_time = None 
            
            print(f"Searching DuckDuckGo News: {query} (time: {ddg_time})")
            
            with DDGS() as ddgs:
                ddg_results = ddgs.news(
                    query,
                    region="wt-wt",
                    safesearch="off",
                    timelimit=ddg_time,
                    max_results=max_articles
                )
                
                # Check if generator or list, DDGS usually returns generator
                if ddg_results:
                    for r in ddg_results:
                        # DDG returns: {date, title, body, url, source, image, ...}
                        
                        # Parse date
                        published_at = ""
                        try:
                            if 'date' in r:
                                # DDG dates are usually ISO or close to it
                                dt = parse_published_date(r['date'])
                                if dt:
                                    published_at = dt.isoformat()
                        except:
                            pass
                            
                        article = {
                            'title': r.get('title', ''),
                            'url': r.get('url', ''),
                            'source': r.get('source', 'DuckDuckGo'),
                            'content': r.get('body', ''),
                            'description': r.get('body', ''),
                            'published_at': published_at,
                            'premium': False, 
                            'search_engine': 'DuckDuckGo'
                        }
                        results.append(article)
                    
            print(f"Found {len(results)} articles via DuckDuckGo")
            return results

        except Exception as e:
            print(f"DuckDuckGo search error: {e}")
            return []

if __name__ == "__main__":
    # Test
    try:
        news = DuckDuckGoNewsFetcher.fetch_news("Apple", "d", 5)
        for n in news:
            print(f"- {n['title']} ({n['published_at']})")
    except Exception as e:
        print(f"Test failed: {e}")
