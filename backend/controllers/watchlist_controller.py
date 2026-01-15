from flask import request
from services.watchlist_service import WatchlistService
from utils.response import success_response, error_response


class WatchlistController:
    """Watchlist controller for managing user watchlists"""
    
    @staticmethod
    def get_watchlist(user_email):
        """
        GET /{user_email}/watchlist
        Get user's watchlist with stock details
        
        Response:
        {
            "success": true,
            "data": [
                {
                    "ticker": "AAPL",
                    "name": "Apple Inc.",
                    "exchange": "NASDAQ",
                    "sector": "Technology",
                    "industry": "Consumer Electronics"
                }
            ],
            "error": null
        }
        """
        try:
            # Get watchlist_id from query parameter (optional)
            watchlist_id = request.args.get('watchlist_id', 'default')
            
            success, message, watchlist = WatchlistService.get_watchlist(user_email, watchlist_id)
            
            if success:
                return success_response(watchlist, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error retrieving watchlist: {str(e)}", 500)
    
    @staticmethod
    def add_to_watchlist(user_email):
        """
        POST /{user_email}/watchlist
        Add stock to user's watchlist
        
        Request body:
        {
            "ticker": "AAPL"
        }
        
        Response:
        {
            "success": true,
            "data": [...updated watchlist...],
            "error": null
        }
        """
        try:
            data = request.get_json()
            
            if not data or 'ticker' not in data:
                return error_response("Ticker is required", 400)
            
            ticker = data.get('ticker', '').strip()
            watchlist_id = data.get('watchlist_id', 'default')
            
            if not ticker:
                return error_response("Ticker cannot be empty", 400)
            
            success, message, watchlist = WatchlistService.add_to_watchlist(user_email, ticker, watchlist_id)
            
            if success:
                return success_response(watchlist, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error adding to watchlist: {str(e)}", 500)
    
    @staticmethod
    def remove_from_watchlist(user_email, ticker):
        """
        DELETE /{user_email}/watchlist/<ticker>
        Remove stock from user's watchlist
        
        Response:
        {
            "success": true,
            "data": [...updated watchlist...],
            "error": null
        }
        """
        try:
            # Get watchlist_id from query parameter (optional)
            watchlist_id = request.args.get('watchlist_id', 'default')
            
            success, message, watchlist = WatchlistService.remove_from_watchlist(user_email, ticker, watchlist_id)
            
            if success:
                return success_response(watchlist, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error removing from watchlist: {str(e)}", 500)
    
    @staticmethod
    def get_watchlist_news(user_email):
        """
        GET /{user_email}/watchlist/news?time_filter=day&sort_by=date
        Get news for all stocks in user's watchlist with time filtering
        
        Query Parameters:
        - time_filter (optional): hour, day, week, month, year (default: week)
        - sort_by (optional): date, relevance (default: date)
        - max_articles (optional): Max articles per stock (default: 10)
        
        Response:
        {
            "success": true,
            "data": {
                "AAPL": [...articles...],
                "MSFT": [...articles...]
            },
            "error": null
        }
        """
        import time
        start_time = time.time()
        
        try:
            # Get query parameters
            watchlist_id = request.args.get('watchlist_id', 'default')
            time_filter = request.args.get('time_filter', 'week')
            sort_by = request.args.get('sort_by', 'date')
            max_articles = request.args.get('max_articles', 10, type=int)
            
            print(f"\n[WATCHLIST_NEWS] 📋 Request from {user_email} for watchlist {watchlist_id}")
            print(f"[WATCHLIST_NEWS] ⚙️  Parameters: time_filter={time_filter}, sort_by={sort_by}, max_articles={max_articles}")
            
            # Validate parameters
            valid_filters = ['hour', 'day', 'week', 'month', 'year', 'recent']
            if time_filter not in valid_filters:
                return error_response(f"Invalid time_filter. Must be one of: {', '.join(valid_filters)}", 400)
            
            valid_sorts = ['date', 'relevance']
            if sort_by not in valid_sorts:
                return error_response(f"Invalid sort_by. Must be one of: {', '.join(valid_sorts)}", 400)
            
            success, message, news_data = WatchlistService.get_watchlist_news(
                user_email,
                watchlist_id=watchlist_id,
                time_filter=time_filter,
                sort_by=sort_by,
                max_articles=max_articles
            )
            
            elapsed_time = time.time() - start_time
            
            if success:
                total_articles = sum(len(articles) for articles in news_data.values())
                print(f"[WATCHLIST_NEWS] ✅ Success: {total_articles} total articles for {len(news_data)} tickers in {elapsed_time:.2f}s")
                return success_response(news_data, message, 200)
            else:
                print(f"[WATCHLIST_NEWS] ❌ Failed: {message} in {elapsed_time:.2f}s")
                return error_response(message, 400)
        
        except Exception as e:
            elapsed_time = time.time() - start_time
            print(f"[WATCHLIST_NEWS] ❌ Exception after {elapsed_time:.2f}s: {str(e)}")
            import traceback
            traceback.print_exc()
            return error_response(f"Error fetching news: {str(e)}", 500)
    
    @staticmethod
    def get_watchlist_prices(user_email):
        """
        GET /{user_email}/watchlist/price
        Get current prices for all stocks in user's watchlist
        
        Response:
        {
            "success": true,
            "data": {
                "AAPL": {
                    "price": 150.25,
                    "change": 2.50,
                    "change_percent": 1.69,
                    ...
                }
            },
            "error": null
        }
        """
        try:
            watchlist_id = request.args.get('watchlist_id', 'default')
            success, message, price_data = WatchlistService.get_watchlist_prices(user_email, watchlist_id)
            
            if success:
                return success_response(price_data, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error fetching prices: {str(e)}", 500)
