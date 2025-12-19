"""
Configuration for standalone news scraper
Independent from backend - uses same MongoDB but separate execution
"""

import os
from dotenv import load_dotenv

# Load environment variables from parent directory's .env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)


class ScraperConfig:
    """Configuration for news scraper"""
    
    # MongoDB Settings
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    DB_NAME = 'portfolio_buzz'
    
    # Collections
    NEWS_COLLECTION = 'company_news'
    WATCHLIST_COLLECTION = 'watchlists'
    STOCK_MAPPINGS_COLLECTION = 'stock_mappings'
    
    # Scraping Parameters
    MAX_WORKERS = 4  # Parallel scraping threads
    REQUEST_DELAY = (1.5, 4.0)  # Random delay between requests (seconds)
    MAX_RETRIES = 2  # Retry attempts for failed requests
    TIMEOUT = 15  # Request timeout (seconds)
    MAX_ARTICLES_PER_TICKER = 20  # Maximum articles to store per ticker
    
    # Data Freshness
    INCREMENTAL_UPDATE = True  # Only fetch news newer than last scrape
    DATA_TTL_DAYS = 30  # Auto-delete articles older than 30 days (MongoDB TTL)
    
    # Error Handling
    PARTIAL_SUCCESS = True  # Continue scraping other tickers if one fails
    LOG_FAILED_TICKERS = True  # Log tickers that failed to scrape
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = 'news_scraper.log'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Performance
    BATCH_SIZE = 50  # Process tickers in batches
    SCRAPE_TIMEOUT = 300  # Total scraping timeout (5 minutes)


# Export config instance
config = ScraperConfig()
