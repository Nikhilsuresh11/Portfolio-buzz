from models.watchlist import Watchlist
from models.stock import Stock
from utils.date_utils import map_time_filter_to_days


class WatchlistService:
    """Watchlist service for managing user stock watchlists"""
    
    @staticmethod
    def get_watchlist(email):
        """
        Get user's watchlist with stock details
        
        Args:
            email: User's email address
        
        Returns:
            tuple: (success: bool, message: str, data: list or None)
        """
        try:
            tickers = Watchlist.get_user_watchlist(email)
            
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
    def add_to_watchlist(email, ticker):
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
            
            # Add to watchlist
            added = Watchlist.add_stock(email, ticker)
            
            if not added:
                return False, f"Stock '{ticker}' is already in your watchlist", None
            
            # Get updated watchlist
            success, message, watchlist = WatchlistService.get_watchlist(email)
            
            return True, f"Stock '{ticker}' added to watchlist", watchlist
        
        except Exception as e:
            return False, f"Error adding to watchlist: {str(e)}", None
    
    @staticmethod
    def remove_from_watchlist(email, ticker):
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
            
            # Remove from watchlist
            removed = Watchlist.remove_stock(email, ticker)
            
            if not removed:
                return False, f"Stock '{ticker}' not found in watchlist", None
            
            # Get updated watchlist
            success, message, watchlist = WatchlistService.get_watchlist(email)
            
            return True, f"Stock '{ticker}' removed from watchlist", watchlist
        
        except Exception as e:
            return False, f"Error removing from watchlist: {str(e)}", None
    
    @staticmethod
    def get_watchlist_news(email, time_filter='week', sort_by='date', max_articles=10):
        """
        Get news for all stocks in user's watchlist with time filtering
        
        Args:
            email: User's email address
            time_filter: Time filter (hour, day, week, month, year)
            sort_by: Sort option (date, relevance)
            max_articles: Maximum articles per stock
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            from services.news_service import NewsService
            from concurrent.futures import ThreadPoolExecutor, as_completed
            
            tickers = Watchlist.get_user_watchlist(email)
            
            if not tickers:
                return True, "Watchlist is empty", {}
            
            # Map time_filter to days for consistent filtering
            days = map_time_filter_to_days(time_filter)
            
            # Fetch news for all tickers with days-based filtering
            news_data = {}
            
            with ThreadPoolExecutor(max_workers=3) as executor:  # Reduced from 8 for Render free tier
                future_to_ticker = {
                    executor.submit(
                        NewsService.fetch_news_by_days,
                        ticker,
                        ticker,
                        days
                    ): ticker
                    for ticker in tickers
                }
                
                for future in as_completed(future_to_ticker, timeout=20):
                    ticker = future_to_ticker[future]
                    try:
                        # Add timeout to prevent hanging on slow requests
                        success, message, articles = future.result(timeout=10)
                        if success:
                            news_data[ticker] = articles
                            print(f"[WATCHLIST] Fetched {len(articles)} articles for {ticker}")
                        else:
                            print(f"[WATCHLIST] Failed to fetch news for {ticker}: {message}")
                            news_data[ticker] = []
                    except Exception as e:
                        print(f"[WATCHLIST] Error fetching news for {ticker}: {e}")
                        import traceback
                        traceback.print_exc()
                        news_data[ticker] = []
            
            return True, "News retrieved successfully", news_data
        
        except Exception as e:
            return False, f"Error fetching news: {str(e)}", None
    
    @staticmethod
    def get_watchlist_prices(email):
        """
        Get current prices for all stocks in user's watchlist
        
        Args:
            email: User's email address
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            from services.price_service import PriceService
            
            tickers = Watchlist.get_user_watchlist(email)
            
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
