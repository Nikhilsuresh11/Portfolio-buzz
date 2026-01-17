from models.stock import Stock


class SearchService:
    """Search service for stock search functionality"""
    
    @staticmethod
    def search_stocks(query, limit=10, use_fuzzy=True):
        """
        Search for stocks based on query
        
        Args:
            query: Search query string
            limit: Maximum number of results
            use_fuzzy: Whether to use fuzzy matching
        
        Returns:
            tuple: (success: bool, message: str, data: list or None)
        """
        try:
            if not query or len(query.strip()) < 1:
                return False, "Search query is required", None
            
            # Try regular search first
            results = Stock.search_stocks(query, limit)
            
            # If no results and fuzzy is enabled, try fuzzy search
            if not results and use_fuzzy:
                results = Stock.fuzzy_search(query, limit)
            
            # Format results
            formatted_results = []
            for stock in results:
                formatted_results.append({
                    'ticker': stock['ticker'],
                    'name': stock.get('official_name') or stock.get('company_name'),
                    'exchange': stock.get('exchange', ''),
                    'sector': stock.get('sector', ''),
                    'industry': stock.get('industry', ''),
                    'synonyms': stock.get('synonyms', [])
                })
            
            return True, f"Found {len(formatted_results)} results", formatted_results
        
        except Exception as e:
            return False, f"Search error: {str(e)}", None
    
    @staticmethod
    def get_default_stocks(limit=10):
        """
        Get popular/default stocks
        
        Args:
            limit: Maximum number of stocks to return
        
        Returns:
            tuple: (success: bool, message: str, data: list or None)
        """
        try:
            popular_stocks = Stock.get_popular_stocks(limit)
            
            # Format results
            formatted_results = []
            for stock in popular_stocks:
                formatted_results.append({
                    'ticker': stock['ticker'],
                    'name': stock.get('official_name') or stock.get('company_name'),
                    'exchange': stock.get('exchange', ''),
                    'sector': stock.get('sector', ''),
                    'industry': stock.get('industry', '')
                })
            
            return True, f"Retrieved {len(formatted_results)} popular stocks", formatted_results
        
        except Exception as e:
            return False, f"Error retrieving default stocks: {str(e)}", None
    
    @staticmethod
    def get_stock_details(ticker):
        """
        Get detailed information about a specific stock
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            stock = Stock.find_by_ticker(ticker)
            
            if not stock:
                return False, f"Stock '{ticker}' not found", None
            
            # Format stock details
            stock_details = {
                'ticker': stock['ticker'],
                'name': stock.get('official_name') or stock.get('company_name'),
                'exchange': stock.get('exchange', ''),
                'sector': stock.get('sector', ''),
                'industry': stock.get('industry', ''),
                'synonyms': stock.get('synonyms', []),
                'search_terms': stock.get('search_terms', [])
            }
            
            return True, "Stock details retrieved", stock_details
        
        except Exception as e:
            return False, f"Error retrieving stock details: {str(e)}", None
    
    @staticmethod
    def validate_stock(ticker):
        """
        Validate if a stock ticker exists using Yahoo Finance
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            tuple: (success: bool, message: str, is_valid: bool)
        """
        try:
            from services.price_service import PriceService
            price_data = PriceService.get_stock_price(ticker)
            is_valid = price_data is not None and price_data.get('price') is not None
            
            if is_valid:
                return True, f"Stock '{ticker}' is valid", True
            else:
                return True, f"Stock '{ticker}' not found", False
        
        except Exception as e:
            return False, f"Validation error: {str(e)}", False
    
    @staticmethod
    def autocomplete(query, limit=5):
        """
        Get autocomplete suggestions for stock search
        
        Args:
            query: Partial search query
            limit: Maximum number of suggestions
        
        Returns:
            tuple: (success: bool, message: str, data: list or None)
        """
        try:
            if not query or len(query.strip()) < 1:
                return True, "No query provided", []
            
            # Use fuzzy search for autocomplete
            results = Stock.fuzzy_search(query, limit, threshold=50)
            
            # Format as simple suggestions
            suggestions = []
            for stock in results:
                suggestions.append({
                    'ticker': stock['ticker'],
                    'name': stock.get('official_name') or stock.get('company_name'),
                    'display': f"{stock['ticker']} - {stock.get('official_name') or stock.get('company_name')}"
                })
            
            return True, f"Found {len(suggestions)} suggestions", suggestions
        
        except Exception as e:
            return False, f"Autocomplete error: {str(e)}", None
