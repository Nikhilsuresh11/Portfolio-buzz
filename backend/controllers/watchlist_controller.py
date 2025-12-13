from flask import request
from services.watchlist_service import WatchlistService
from utils.response import success_response, error_response
from utils.jwt_helper import token_required


class WatchlistController:
    """Watchlist controller for managing user watchlists"""
    
    @staticmethod
    @token_required
    def get_watchlist(current_user_email):
        """
        GET /watchlist
        Get user's watchlist with stock details
        
        Headers:
        Authorization: Bearer <jwt_token>
        
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
            success, message, watchlist = WatchlistService.get_watchlist(current_user_email)
            
            if success:
                return success_response(watchlist, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error retrieving watchlist: {str(e)}", 500)
    
    @staticmethod
    @token_required
    def add_to_watchlist(current_user_email):
        """
        POST /watchlist
        Add stock to user's watchlist
        
        Headers:
        Authorization: Bearer <jwt_token>
        
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
            
            if not ticker:
                return error_response("Ticker cannot be empty", 400)
            
            success, message, watchlist = WatchlistService.add_to_watchlist(current_user_email, ticker)
            
            if success:
                return success_response(watchlist, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error adding to watchlist: {str(e)}", 500)
    
    @staticmethod
    @token_required
    def remove_from_watchlist(current_user_email, ticker):
        """
        DELETE /watchlist/<ticker>
        Remove stock from user's watchlist
        
        Headers:
        Authorization: Bearer <jwt_token>
        
        Response:
        {
            "success": true,
            "data": [...updated watchlist...],
            "error": null
        }
        """
        try:
            success, message, watchlist = WatchlistService.remove_from_watchlist(current_user_email, ticker)
            
            if success:
                return success_response(watchlist, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error removing from watchlist: {str(e)}", 500)
    
    @staticmethod
    @token_required
    def get_watchlist_news(current_user_email):
        """
        GET /watchlist/news?time_filter=day&sort_by=date
        Get news for all stocks in user's watchlist with time filtering
        
        Headers:
        Authorization: Bearer <jwt_token>
        
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
        try:
            # Get query parameters
            time_filter = request.args.get('time_filter', 'week')
            sort_by = request.args.get('sort_by', 'date')
            max_articles = request.args.get('max_articles', 10, type=int)
            
            # Validate parameters
            valid_filters = ['hour', 'day', 'week', 'month', 'year', 'recent']
            if time_filter not in valid_filters:
                return error_response(f"Invalid time_filter. Must be one of: {', '.join(valid_filters)}", 400)
            
            valid_sorts = ['date', 'relevance']
            if sort_by not in valid_sorts:
                return error_response(f"Invalid sort_by. Must be one of: {', '.join(valid_sorts)}", 400)
            
            success, message, news_data = WatchlistService.get_watchlist_news(
                current_user_email,
                time_filter=time_filter,
                sort_by=sort_by,
                max_articles=max_articles
            )
            
            if success:
                print(news_data)
                return success_response(news_data, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error fetching news: {str(e)}", 500)
    
    @staticmethod
    @token_required
    def get_watchlist_prices(current_user_email):
        """
        GET /watchlist/price
        Get current prices for all stocks in user's watchlist
        
        Headers:
        Authorization: Bearer <jwt_token>
        
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
            success, message, price_data = WatchlistService.get_watchlist_prices(current_user_email)
            
            if success:
                return success_response(price_data, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error fetching prices: {str(e)}", 500)
