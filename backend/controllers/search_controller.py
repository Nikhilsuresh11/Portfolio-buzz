from flask import request
from services.search_service import SearchService
from utils.response import success_response, error_response
from utils.jwt_helper import optional_token


class SearchController:
    """Search controller for stock search functionality"""
    
    @staticmethod
    @optional_token
    def search_stocks(current_user_email=None):
        """
        GET /search?q=<query>&limit=<limit>
        Search for stocks
        
        Query parameters:
        - q: Search query (required)
        - limit: Maximum results (optional, default: 10)
        
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
            query = request.args.get('q', '').strip()
            limit = request.args.get('limit', 10, type=int)
            
            if not query:
                return error_response("Search query is required", 400)
            
            if limit < 1 or limit > 50:
                return error_response("Limit must be between 1 and 50", 400)
            
            success, message, results = SearchService.search_stocks(query, limit)
            
            if success:
                return success_response(results, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Search error: {str(e)}", 500)
    
    @staticmethod
    @optional_token
    def get_default_stocks(current_user_email=None):
        """
        GET /search/default?limit=<limit>
        Get popular/default stocks
        
        Query parameters:
        - limit: Maximum results (optional, default: 10)
        
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
            limit = request.args.get('limit', 10, type=int)
            
            if limit < 1 or limit > 50:
                return error_response("Limit must be between 1 and 50", 400)
            
            success, message, results = SearchService.get_default_stocks(limit)
            
            if success:
                return success_response(results, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error retrieving default stocks: {str(e)}", 500)
    
    @staticmethod
    @optional_token
    def autocomplete(current_user_email=None):
        """
        GET /search/autocomplete?q=<query>&limit=<limit>
        Get autocomplete suggestions
        
        Query parameters:
        - q: Search query (required)
        - limit: Maximum results (optional, default: 5)
        
        Response:
        {
            "success": true,
            "data": [
                {
                    "ticker": "AAPL",
                    "name": "Apple Inc.",
                    "display": "AAPL - Apple Inc."
                }
            ],
            "error": null
        }
        """
        try:
            query = request.args.get('q', '').strip()
            limit = request.args.get('limit', 5, type=int)
            
            if not query:
                return success_response([], "No query provided", 200)
            
            if limit < 1 or limit > 20:
                return error_response("Limit must be between 1 and 20", 400)
            
            success, message, results = SearchService.autocomplete(query, limit)
            
            if success:
                return success_response(results, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Autocomplete error: {str(e)}", 500)
