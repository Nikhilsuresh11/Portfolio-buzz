from flask import request
from services.stock_search_service import StockSearchService
from utils.response import success_response, error_response

class StockSearchController:
    """Controller for stock search endpoints"""
    
    @staticmethod
    def search_stock():
        """
        GET /api/search-stock
        Search for stocks using Yahoo Finance API
        
        Query parameters:
        - q: Search query (company name or ticker)
        
        Response:
        {
            "success": true,
            "data": {
                "results": [
                    {
                        "symbol": "RELIANCE.NS",
                        "name": "Reliance Industries Limited",
                        "exchange": "NSE",
                        "type": "EQUITY"
                    }
                ]
            }
        }
        """
        try:
            query = request.args.get('q', '').strip()
            
            if not query or len(query) < 2:
                return success_response({'results': []}, 'Query too short', 200)
            
            results = StockSearchService.search_stocks(query)
            
            return success_response(
                {'results': results},
                f'Found {len(results)} results',
                200
            )
            
        except Exception as e:
            return error_response(f"Error searching stock: {str(e)}", 500)
