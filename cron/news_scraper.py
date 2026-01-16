"""
Standalone News Scraper for Portfolio Buzz
Periodically scrapes news for all company tickers and stores in MongoDB
Independent from backend API - can run as cron job
"""

import sys
import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, DuplicateKeyError
import logging
import time
import hashlib
from typing import List, Dict, Optional
import argparse

# Add parent directory to path to import scraper functions
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(parent_dir, 'backend'))

from config import config
from scraper import (
    scrape_google_news,
    scrape_yahoo_finance,
    scrape_economic_times,
    scrape_reuters,
    scrape_cnbc,
    scrape_bbc_business
)

# Setup logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class NewsScraperService:
    """Standalone news scraper service"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.news_collection = None
        self.stats = {
            'total_tickers': 0,
            'successful': 0,
            'failed': 0,
            'partial': 0,
            'total_articles': 0,
            'start_time': None,
            'end_time': None
        }
    
    def connect_to_mongodb(self) -> bool:
        """Connect to MongoDB"""
        try:
            logger.info(f"Connecting to MongoDB: {config.MONGODB_URI[:30]}...")
            self.client = MongoClient(
                config.MONGODB_URI,
                serverSelectionTimeoutMS=5000
            )
            
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[config.DB_NAME]
            self.news_collection = self.db[config.NEWS_COLLECTION]
            
            logger.info("[OK] Connected to MongoDB successfully")
            return True
            
        except ConnectionFailure as e:
            logger.error(f"[ERROR] Failed to connect to MongoDB: {e}")
            return False
    
    def get_all_tickers(self) -> List[Dict[str, str]]:
        """
        Get all unique tickers from watchlists and stock mappings
        Returns list of dicts with ticker and company_name
        """
        tickers_map = {}
        
        try:
            # 1. Get tickers from watchlists (actively tracked)
            # Schema: Each document has user_email, watchlist_id, ticker, created_at, updated_at
            watchlist_collection = self.db[config.WATCHLIST_COLLECTION]
            
            # Get unique tickers from all watchlist entries
            unique_tickers = watchlist_collection.distinct('ticker')
            
            for ticker in unique_tickers:
                if ticker and ticker not in tickers_map:
                    tickers_map[ticker] = {'ticker': ticker, 'company_name': ticker}
            
            logger.info(f"Found {len(tickers_map)} tickers from watchlists")
            
            # OPTIMIZATION: Only scrape watchlist tickers (actively tracked by users)
            # Skip stock_mappings to avoid scraping 500+ tickers
            # Uncomment below if you want to scrape ALL known tickers:
            
            # # 2. Get tickers from stock mappings (all known stocks)
            # mappings_collection = self.db[config.STOCK_MAPPINGS_COLLECTION]
            # mappings = mappings_collection.find({}, {'ticker': 1, 'official_name': 1, 'company_name': 1})
            # 
            # mapping_count = 0
            # for mapping in mappings:
            #     ticker = mapping.get('ticker')
            #     if ticker and ticker not in tickers_map:
            #         tickers_map[ticker] = {
            #             'ticker': ticker,
            #             'company_name': mapping.get('official_name') or mapping.get('company_name') or ticker
            #         }
            #         mapping_count += 1
            # 
            # logger.info(f"Found {mapping_count} additional tickers from stock mappings")
            
            tickers_list = list(tickers_map.values())
            logger.info(f"Total unique tickers to scrape: {len(tickers_list)}")
            
            return tickers_list
            
        except Exception as e:
            logger.error(f"Error fetching tickers: {e}")
            return []
    
    def scrape_news_for_ticker(self, ticker: str, company_name: str) -> Dict:
        """
        Scrape news for a single ticker from multiple sources
        Returns dict with articles and metadata
        """
        logger.info(f"Scraping news for {ticker} ({company_name})...")
        
        all_articles = []
        sources_tried = 0
        sources_succeeded = 0
        
        # Define scraping functions to try (fast and reliable sources)
        scraping_functions = [
            ('Google News', lambda: scrape_google_news(company_name)),
            ('Yahoo Finance', lambda: scrape_yahoo_finance(ticker)),
            ('Economic Times', lambda: scrape_economic_times(company_name)),
            ('Reuters', lambda: scrape_reuters(company_name)),
            ('CNBC', lambda: scrape_cnbc(company_name)),
            ('BBC Business', lambda: scrape_bbc_business(company_name)),
        ]
        
        for source_name, scrape_func in scraping_functions:
            sources_tried += 1
            try:
                articles = scrape_func()
                if articles:
                    all_articles.extend(articles)
                    sources_succeeded += 1
                    logger.debug(f"  ✓ {source_name}: {len(articles)} articles")
                else:
                    logger.debug(f"  - {source_name}: 0 articles")
            except Exception as e:
                logger.debug(f"  ✗ {source_name}: {str(e)}")
        
        # Deduplicate articles by URL and title
        unique_articles = self._deduplicate_articles(all_articles)
        
        # Limit to max articles
        unique_articles = unique_articles[:config.MAX_ARTICLES_PER_TICKER]
        
        # Determine scrape status
        if sources_succeeded == 0:
            status = 'failed'
        elif sources_succeeded < sources_tried / 2:
            status = 'partial'
        else:
            status = 'success'
        
        logger.info(f"  > {len(unique_articles)} unique articles from {sources_succeeded}/{sources_tried} sources ({status})")
        
        return {
            'ticker': ticker,
            'company_name': company_name,
            'articles': unique_articles,
            'last_updated': datetime.utcnow(),
            'scrape_status': status,
            'article_count': len(unique_articles),
            'sources_tried': sources_tried,
            'sources_succeeded': sources_succeeded,
            'error_message': None if status != 'failed' else 'All sources failed'
        }
    
    def _deduplicate_articles(self, articles: List[Dict]) -> List[Dict]:
        """Remove duplicate articles based on URL and title hash"""
        seen = set()
        unique = []
        
        for article in articles:
            # Create hash from URL (preferred) or title
            url = article.get('url', article.get('link', ''))
            title = article.get('title', '')
            
            # Use URL if available, otherwise use title
            key_string = url if url else title
            if not key_string:
                continue
            
            key = hashlib.md5(key_string.encode()).hexdigest()
            
            if key not in seen:
                seen.add(key)
                
                # Normalize article format
                normalized_article = {
                    'title': title,
                    'url': url,
                    'content': article.get('content') or article.get('description') or article.get('summary') or title,
                    'source': article.get('source', 'Unknown'),
                    'published_date': article.get('published_at') or article.get('published') or datetime.utcnow().isoformat(),
                    'scraped_at': datetime.utcnow().isoformat()
                }
                
                unique.append(normalized_article)
        
        return unique
    
    def save_to_mongodb(self, news_data: Dict) -> bool:
        """Save scraped news to MongoDB (upsert)"""
        try:
            # Use upsert to update existing or insert new
            result = self.news_collection.update_one(
                {'ticker': news_data['ticker']},
                {'$set': news_data},
                upsert=True
            )
            
            if result.upserted_id:
                logger.debug(f"  > Inserted new document for {news_data['ticker']}")
            else:
                logger.debug(f"  > Updated existing document for {news_data['ticker']}")
            
            return True
            
        except Exception as e:
            logger.error(f"  [ERROR] Failed to save {news_data['ticker']}: {e}")
            return False
    
    def scrape_all_tickers(self, tickers: List[Dict], test_mode: bool = False, max_workers: int = 3):
        """
        Scrape news for all tickers with parallel processing
        
        Args:
            tickers: List of ticker dictionaries
            test_mode: If True, only process first 3 tickers
            max_workers: Number of parallel workers (default: 3)
        """
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        self.stats['total_tickers'] = len(tickers)
        self.stats['start_time'] = datetime.utcnow()
        
        logger.info("=" * 70)
        logger.info(f"STARTING NEWS SCRAPING FOR {len(tickers)} TICKERS")
        logger.info(f"PARALLEL PROCESSING: {max_workers} workers")
        logger.info("=" * 70)
        
        # In test mode, only process first 3 tickers
        if test_mode:
            tickers = tickers[:3]
            logger.info(f"TEST MODE: Processing only {len(tickers)} tickers")
        
        # Process tickers in parallel
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all scraping tasks
            future_to_ticker = {
                executor.submit(self._scrape_and_save_ticker, idx, len(tickers), ticker_info): ticker_info
                for idx, ticker_info in enumerate(tickers, 1)
            }
            
            # Process completed tasks as they finish
            for future in as_completed(future_to_ticker):
                ticker_info = future_to_ticker[future]
                try:
                    result = future.result()
                    # Stats are updated in _scrape_and_save_ticker
                except Exception as e:
                    ticker = ticker_info['ticker']
                    logger.error(f"  ✗ Unexpected error for {ticker}: {e}")
                    self.stats['failed'] += 1
        
        # Ensure end_time is set even if loop completes normally
        self.stats['end_time'] = datetime.utcnow()
        self._print_summary()
    
    def _scrape_and_save_ticker(self, idx: int, total: int, ticker_info: Dict) -> bool:
        """
        Scrape and save news for a single ticker (used in parallel processing)
        
        Args:
            idx: Current ticker index
            total: Total number of tickers
            ticker_info: Ticker information dict
            
        Returns:
            bool: True if successful
        """
        ticker = ticker_info['ticker']
        company_name = ticker_info['company_name']
        
        logger.info(f"\n[{idx}/{total}] Processing {ticker}...")
        
        try:
            # Scrape news
            news_data = self.scrape_news_for_ticker(ticker, company_name)
            
            # Save to MongoDB
            if self.save_to_mongodb(news_data):
                if news_data['scrape_status'] == 'success':
                    self.stats['successful'] += 1
                elif news_data['scrape_status'] == 'partial':
                    self.stats['partial'] += 1
                else:
                    self.stats['failed'] += 1
                
                self.stats['total_articles'] += news_data['article_count']
                return True
            else:
                self.stats['failed'] += 1
                return False
                
        except Exception as e:
            logger.error(f"  ✗ Error processing {ticker}: {e}")
            self.stats['failed'] += 1
            return False

    
    def _print_summary(self):
        """Print scraping summary statistics"""
        duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
        
        logger.info("\n" + "=" * 70)
        logger.info("SCRAPING SUMMARY")
        logger.info("=" * 70)
        logger.info(f"Total Tickers:      {self.stats['total_tickers']}")
        logger.info(f"Successful:         {self.stats['successful']} ({self.stats['successful']/max(self.stats['total_tickers'],1)*100:.1f}%)")
        logger.info(f"Partial Success:    {self.stats['partial']} ({self.stats['partial']/max(self.stats['total_tickers'],1)*100:.1f}%)")
        logger.info(f"Failed:             {self.stats['failed']} ({self.stats['failed']/max(self.stats['total_tickers'],1)*100:.1f}%)")
        logger.info(f"Total Articles:     {self.stats['total_articles']}")
        logger.info(f"Duration:           {duration:.1f} seconds")
        logger.info(f"Avg per ticker:     {duration/max(self.stats['total_tickers'],1):.1f} seconds")
        logger.info("=" * 70)
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Scrape news for company tickers')
    parser.add_argument('--ticker', type=str, help='Scrape news for a specific ticker only')
    parser.add_argument('--test', action='store_true', help='Test mode: process only 3 tickers')
    parser.add_argument('--workers', type=int, default=3, help='Number of parallel workers (default: 3)')
    args = parser.parse_args()
    
    scraper = NewsScraperService()
    
    try:
        # Connect to MongoDB
        if not scraper.connect_to_mongodb():
            logger.error("Failed to connect to MongoDB. Exiting.")
            sys.exit(1)
        
        # Get tickers
        if args.ticker:
            # Single ticker mode
            tickers = [{'ticker': args.ticker.upper(), 'company_name': args.ticker.upper()}]
            logger.info(f"Single ticker mode: {args.ticker}")
        else:
            # Get all tickers
            tickers = scraper.get_all_tickers()
            
            if not tickers:
                logger.warning("No tickers found to scrape")
                sys.exit(0)
        
        # Scrape news with parallel processing
        scraper.scrape_all_tickers(tickers, test_mode=args.test, max_workers=args.workers)
        
        logger.info("\n[OK] News scraping completed successfully")
        
    except KeyboardInterrupt:
        logger.info("\n\nScraping interrupted by user")
        # Set end_time if not already set
        if scraper.stats['end_time'] is None:
            scraper.stats['end_time'] = datetime.utcnow()
        scraper._print_summary()
    except Exception as e:
        logger.error(f"\n[ERROR] Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        scraper.close()


if __name__ == "__main__":
    main()
