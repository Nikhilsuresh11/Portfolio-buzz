"""
News Database Service
Reads pre-fetched news from MongoDB (populated by cron scraper)
Fast, reliable alternative to live scraping
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from utils.db import get_news_collection
import logging

logger = logging.getLogger(__name__)


class NewsDBService:
    """Service for reading pre-fetched news from MongoDB"""
    
    @staticmethod
    def get_news_for_ticker(ticker: str, days: Optional[int] = None, max_articles: int = 20) -> Tuple[bool, str, Optional[List[Dict]]]:
        """
        Get pre-fetched news for a single ticker from MongoDB
        
        Args:
            ticker: Stock ticker symbol
            days: Filter articles from last N days (None = all articles)
            max_articles: Maximum number of articles to return
        
        Returns:
            tuple: (success: bool, message: str, data: list or None)
        """
        try:
            news_collection = get_news_collection()
            
            # Find news document for ticker
            news_doc = news_collection.find_one({'ticker': ticker.upper()})
            
            if not news_doc:
                return False, f"No pre-fetched news found for {ticker}", None
            
            # Get articles
            articles = news_doc.get('articles', [])
            
            logger.info(f"[NewsDBService] Found {len(articles)} articles in MongoDB for {ticker}")
            
            if not articles:
                return True, f"No articles available for {ticker}", []
            
            # Skip date filtering - articles are already fresh from recent scrape
            # The scraper only runs periodically, so all articles in MongoDB are recent
            # Date filtering was causing issues with RFC 2822 format dates
            
            # Limit articles
            articles = articles[:max_articles]
            
            # Add metadata
            metadata = {
                'last_updated': news_doc.get('last_updated'),
                'article_count': len(articles),
                'scrape_status': news_doc.get('scrape_status', 'unknown'),
                'data_age_minutes': NewsDBService._calculate_data_age(news_doc.get('last_updated'))
            }
            
            # Format response
            formatted_articles = []
            for article in articles:
                formatted_articles.append({
                    'title': article.get('title', ''),
                    'content': article.get('content', ''),
                    'source': article.get('source', ''),
                    'url': article.get('url', ''),
                    'published_at': article.get('published_date', ''),
                    'premium': False  # Pre-fetched news is free
                })
            
            return True, f"Found {len(formatted_articles)} articles", {
                'articles': formatted_articles,
                'metadata': metadata
            }
        
        except Exception as e:
            logger.error(f"Error fetching news for {ticker}: {e}")
            return False, f"Error fetching news: {str(e)}", None
    
    @staticmethod
    def get_news_for_multiple_tickers(tickers: List[str], days: Optional[int] = None, max_articles: int = 10) -> Dict[str, List[Dict]]:
        """
        Get pre-fetched news for multiple tickers (batch operation)
        
        Args:
            tickers: List of stock ticker symbols
            days: Filter articles from last N days (None = all articles)
            max_articles: Maximum number of articles per ticker
        
        Returns:
            dict: Dictionary mapping tickers to their news articles
        """
        news_data = {}
        
        try:
            news_collection = get_news_collection()
            
            # Batch fetch all tickers
            ticker_list = [t.upper() for t in tickers]
            news_docs = news_collection.find({'ticker': {'$in': ticker_list}})
            
            # Create lookup map
            news_map = {doc['ticker']: doc for doc in news_docs}
            
            # Process each ticker
            for ticker in ticker_list:
                news_doc = news_map.get(ticker)
                
                if not news_doc:
                    news_data[ticker] = []
                    continue
                
                articles = news_doc.get('articles', [])
                
                # Skip date filtering - return all cached articles
                # Articles are already fresh from recent scraper run
                
                # Limit and format articles
                articles = articles[:max_articles]
                formatted_articles = []
                
                for article in articles:
                    formatted_articles.append({
                        'title': article.get('title', ''),
                        'content': article.get('content', ''),
                        'source': article.get('source', ''),
                        'url': article.get('url', ''),
                        'published_at': article.get('published_date', ''),
                        'premium': False
                    })
                
                news_data[ticker] = formatted_articles
        
        except Exception as e:
            logger.error(f"Error fetching news for multiple tickers: {e}")
            # Return empty dict on error
            return {ticker: [] for ticker in tickers}
        
        return news_data
    
    @staticmethod
    def get_news_metadata(ticker: str) -> Optional[Dict]:
        """
        Get metadata about pre-fetched news (freshness, status, etc.)
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            dict: Metadata or None if not found
        """
        try:
            news_collection = get_news_collection()
            news_doc = news_collection.find_one(
                {'ticker': ticker.upper()},
                {'last_updated': 1, 'article_count': 1, 'scrape_status': 1, 'error_message': 1}
            )
            
            if not news_doc:
                return None
            
            return {
                'last_updated': news_doc.get('last_updated'),
                'article_count': news_doc.get('article_count', 0),
                'scrape_status': news_doc.get('scrape_status', 'unknown'),
                'data_age_minutes': NewsDBService._calculate_data_age(news_doc.get('last_updated')),
                'error_message': news_doc.get('error_message')
            }
        
        except Exception as e:
            logger.error(f"Error fetching metadata for {ticker}: {e}")
            return None
    
    @staticmethod
    def _calculate_data_age(last_updated) -> Optional[int]:
        """Calculate how old the data is in minutes"""
        if not last_updated:
            return None
        
        try:
            if isinstance(last_updated, str):
                last_updated = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
            
            age = datetime.utcnow() - last_updated.replace(tzinfo=None)
            return int(age.total_seconds() / 60)
        except:
            return None
    
    @staticmethod
    def is_data_stale(ticker: str, max_age_minutes: int = 60) -> bool:
        """
        Check if pre-fetched data is stale
        
        Args:
            ticker: Stock ticker symbol
            max_age_minutes: Maximum acceptable age in minutes (default: 60)
        
        Returns:
            bool: True if data is stale or missing
        """
        metadata = NewsDBService.get_news_metadata(ticker)
        
        if not metadata:
            return True  # No data = stale
        
        data_age = metadata.get('data_age_minutes')
        
        if data_age is None:
            return True  # Can't determine age = stale
        
        return data_age > max_age_minutes
