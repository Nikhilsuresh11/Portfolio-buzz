from models.watchlist import Watchlist
from models.stock import Stock
from utils.date_utils import map_time_filter_to_days
import logging

logger = logging.getLogger(__name__)


class WatchlistService:
    """Watchlist service for managing user stock watchlists"""
    
    @staticmethod
    def get_watchlist(email, watchlist_id='default'):
        """
        Get user's watchlist with stock details
        """
        try:
            from models.user_portfolio import UserWatchlist
            
            # If 'default', try to find the actual default watchlist ID for the user
            if watchlist_id == 'default':
                user_watchlists = UserWatchlist.get_user_watchlists(email)
                if user_watchlists:
                    # Find default one or just use the first one
                    default_w = next((w for w in user_watchlists if w.get('is_default')), user_watchlists[0])
                    watchlist_id = default_w['watchlist_id']
            
            tickers = Watchlist.get_user_watchlist(email, watchlist_id)
            
            # Get stock details for each ticker
            watchlist_with_details = []
            for ticker in tickers:
                stock_info = Stock.get_stock_info(ticker)
                if stock_info:
                    watchlist_with_details.append({
                        'ticker': ticker,
                        'name': stock_info.get('official_name') or stock_info.get('company_name'),
                        'exchange': stock_info.get('exchange', ''),
                        'sector': stock_info.get('sector', ''),
                        'industry': stock_info.get('industry', '')
                    })
                else:
                    # Stock not found in mappings, return basic info
                    watchlist_with_details.append({
                        'ticker': ticker,
                        'name': ticker,
                        'exchange': '',
                        'sector': '',
                        'industry': ''
                    })
            
            return True, "Watchlist retrieved successfully", watchlist_with_details
        
        except Exception as e:
            return False, f"Error retrieving watchlist: {str(e)}", None
    
    @staticmethod
    def get_all_stocks_for_user(email):
        """
        Get all stock tickers for a user across all their watchlists with details
        
        Args:
            email: User's email address
        
        Returns:
            tuple: (success: bool, message: str, data: list or None)
        """
        try:
            tickers = Watchlist.get_all_user_tickers(email)
            
            # Get stock details for each ticker
            stocks_with_details = []
            for ticker in tickers:
                stock_info = Stock.get_stock_info(ticker)
                if stock_info:
                    stocks_with_details.append({
                        'ticker': ticker,
                        'name': stock_info.get('official_name') or stock_info.get('company_name'),
                        'exchange': stock_info.get('exchange', ''),
                        'sector': stock_info.get('sector', ''),
                        'industry': stock_info.get('industry', '')
                    })
                else:
                    # Stock not found in mappings, return basic info
                    stocks_with_details.append({
                        'ticker': ticker,
                        'name': ticker,
                        'exchange': '',
                        'sector': '',
                        'industry': ''
                    })
            
            return True, "All user stocks retrieved successfully", stocks_with_details
        
        except Exception as e:
            return False, f"Error retrieving all user stocks: {str(e)}", None

    @staticmethod
    def add_to_watchlist(email, ticker, watchlist_id='default'):
        """
        Add stock to user's watchlist
        
        Args:
            email: User's email address
            ticker: Stock ticker to add
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            ticker = ticker.upper().strip()
            
            # Validate ticker exists
            if not Stock.validate_ticker(ticker):
                return False, f"Stock ticker '{ticker}' not found", None
            
            from models.user_portfolio import UserWatchlist
            
            # If 'default', resolve to actual default ID
            if watchlist_id == 'default':
                user_watchlists = UserWatchlist.get_user_watchlists(email)
                if user_watchlists:
                    default_w = next((w for w in user_watchlists if w.get('is_default')), user_watchlists[0])
                    watchlist_id = default_w['watchlist_id']
            
            # Add to watchlist
            added = Watchlist.add_stock(email, ticker, watchlist_id)
            
            if not added:
                return False, f"Stock '{ticker}' is already in your watchlist", None
            
            # Get updated watchlist
            success, message, watchlist = WatchlistService.get_watchlist(email, watchlist_id)
            
            return True, f"Stock '{ticker}' added to watchlist", watchlist
        
        except Exception as e:
            return False, f"Error adding to watchlist: {str(e)}", None
    
    @staticmethod
    def remove_from_watchlist(email, ticker, watchlist_id='default'):
        """
        Remove stock from user's watchlist
        
        Args:
            email: User's email address
            ticker: Stock ticker to remove
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            ticker = ticker.upper().strip()
            
            from models.user_portfolio import UserWatchlist
            
            # If 'default', resolve to actual default ID
            if watchlist_id == 'default':
                user_watchlists = UserWatchlist.get_user_watchlists(email)
                if user_watchlists:
                    default_w = next((w for w in user_watchlists if w.get('is_default')), user_watchlists[0])
                    watchlist_id = default_w['watchlist_id']
            
            # Remove from watchlist
            removed = Watchlist.remove_stock(email, ticker, watchlist_id)
            
            if not removed:
                return False, f"Stock '{ticker}' not found in watchlist", None
            
            # Get updated watchlist
            success, message, watchlist = WatchlistService.get_watchlist(email, watchlist_id)
            
            return True, f"Stock '{ticker}' removed from watchlist", watchlist
        
        except Exception as e:
            return False, f"Error removing from watchlist: {str(e)}", None
    
    @staticmethod
    def get_watchlist_news(email, watchlist_id='default', time_filter='week', sort_by='date', max_articles=10):
        """
        Get news for all stocks in user's watchlist using MongoDB cache
        OPTIMIZED: Uses pre-fetched news from MongoDB for sub-second response times
        
        Args:
            email: User's email address
            time_filter: Time filter (hour, day, week, month, year)
            sort_by: Sort option (date, relevance)
            max_articles: Maximum articles per stock
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        import time
        start_time = time.time()
        
        try:
            from services.news_db_service import NewsDBService
            from utils.date_utils import map_time_filter_to_days
            
            tickers = Watchlist.get_user_watchlist(email, watchlist_id)
            
            if not tickers:
                return True, "Watchlist is empty", {}
            
            # Map time_filter to days for consistent filtering
            days = map_time_filter_to_days(time_filter)
            
            logger.info(f"[WATCHLIST] Fetching news for {len(tickers)} tickers from MongoDB...")
            
            # Batch fetch from MongoDB (fast!)
            news_data = NewsDBService.get_news_for_multiple_tickers(
                tickers,
                days=days,
                max_articles=max_articles
            )
            
            total_elapsed = time.time() - start_time
            total_articles = sum(len(articles) for articles in news_data.values())
            
            logger.info(f"[WATCHLIST] Completed: {len(tickers)} stocks, {total_articles} articles in {total_elapsed:.2f}s")
            
            return True, "News retrieved successfully", news_data
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return False, f"Error fetching news: {str(e)}", None
    
    @staticmethod
    def get_watchlist_prices(email, watchlist_id='default'):
        """
        Get current prices for all stocks in user's watchlist
        
        Args:
            email: User's email address
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            from services.price_service import PriceService
            
            tickers = Watchlist.get_user_watchlist(email, watchlist_id)
            
            if not tickers:
                return True, "Watchlist is empty", {}
            
            # Fetch prices for all tickers
            price_data = {}
            for ticker in tickers:
                price_info = PriceService.get_stock_price(ticker)
                if price_info:
                    price_data[ticker] = price_info
            
            return True, "Prices retrieved successfully", price_data
        
        except Exception as e:
            return False, f"Error fetching prices: {str(e)}", None
    
    @staticmethod
    def clear_watchlist(email):
        """
        Clear all stocks from user's watchlist
        
        Args:
            email: User's email address
        
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            Watchlist.clear_watchlist(email)
            return True, "Watchlist cleared successfully"
        
        except Exception as e:
            return False, f"Error clearing watchlist: {str(e)}"
