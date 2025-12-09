import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.news_service import NewsService

def test_news_fetching():
    print("Testing News Service with DuckDuckGo...")
    
    # Test popular stock
    stock = "Tesla"
    ticker = "TSLA"
    
    print(f"\nFetching news for {stock} ({ticker})...")
    success, msg, articles = NewsService.fetch_news(stock, ticker, time_filter='week', sort_by='date')
    
    print(f"Success: {success}")
    print(f"Message: {msg}")
    
    if articles:
        print(f"Found {len(articles)} articles")
        print("\nTop 3 Articles:")
        for i, article in enumerate(articles[:3], 1):
            print(f"\n--- Article {i} ---")
            print(f"Title: {article['title']}")
            print(f"Source: {article['source']}")
            print(f"Date: {article['published_at']}")
            print(f"URL: {article['url']}")
            print(f"Search Engine: {article.get('search_engine', 'Unknown')}")
    else:
        print("No articles found.")

if __name__ == "__main__":
    test_news_fetching()
