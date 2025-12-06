from utils.db import get_stock_mappings_collection
from fuzzywuzzy import fuzz


class Stock:
    """Stock model for stock mappings and search"""
    
    @staticmethod
    def find_by_ticker(ticker):
        """
        Find stock by ticker
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            dict: Stock document or None
        """
        stocks_col = get_stock_mappings_collection()
        return stocks_col.find_one({'ticker': ticker.upper().strip()}, {'_id': 0})
    
    @staticmethod
    def search_stocks(query, limit=10):
        """
        Search stocks using MongoDB text search and fuzzy matching
        
        Args:
            query: Search query string
            limit: Maximum number of results
        
        Returns:
            list: List of matching stock documents
        """
        if not query or len(query.strip()) < 1:
            return []
        
        query = query.lower().strip()
        stocks_col = get_stock_mappings_collection()
        
        try:
            # MongoDB regex search
            matches = list(stocks_col.find({
                '$or': [
                    {'ticker': {'$regex': f'^{query}', '$options': 'i'}},
                    {'company_name': {'$regex': f'^{query}', '$options': 'i'}},
                    {'official_name': {'$regex': f'^{query}', '$options': 'i'}},
                    {'search_terms': {'$regex': query, '$options': 'i'}},
                    {'synonyms': {'$regex': query, '$options': 'i'}}
                ]
            }, {'_id': 0}).limit(limit))
            
            # Deduplicate by ticker
            seen_tickers = set()
            unique_matches = []
            for match in matches:
                if match['ticker'] not in seen_tickers:
                    seen_tickers.add(match['ticker'])
                    unique_matches.append(match)
            
            return unique_matches[:limit]
        
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    @staticmethod
    def fuzzy_search(query, limit=10, threshold=60):
        """
        Fuzzy search for stocks using fuzzywuzzy
        
        Args:
            query: Search query string
            limit: Maximum number of results
            threshold: Minimum fuzzy match score (0-100)
        
        Returns:
            list: List of matching stock documents sorted by relevance
        """
        if not query or len(query.strip()) < 2:
            return []
        
        query_lower = query.lower().strip()
        stocks_col = get_stock_mappings_collection()
        
        # Get all stocks (cached in production with Redis/Memcached)
        all_stocks = list(stocks_col.find({}, {'_id': 0}))
        
        scored_stocks = []
        
        for stock in all_stocks:
            # Calculate fuzzy match scores
            ticker_score = fuzz.partial_ratio(query_lower, stock['ticker'].lower())
            
            company_name = stock.get('company_name', '') or stock.get('official_name', '')
            name_score = fuzz.partial_ratio(query_lower, company_name.lower())
            
            # Check synonyms
            synonym_scores = [
                fuzz.partial_ratio(query_lower, syn.lower())
                for syn in stock.get('synonyms', [])
            ]
            max_synonym_score = max(synonym_scores) if synonym_scores else 0
            
            # Take the highest score
            max_score = max(ticker_score, name_score, max_synonym_score)
            
            if max_score > threshold:
                scored_stocks.append((stock, max_score))
        
        # Sort by score (descending)
        scored_stocks.sort(key=lambda x: x[1], reverse=True)
        
        return [stock for stock, _ in scored_stocks[:limit]]
    
    @staticmethod
    def get_popular_stocks(limit=10):
        """
        Get popular/default stocks
        
        Args:
            limit: Maximum number of stocks to return
        
        Returns:
            list: List of popular stock documents
        """
        stocks_col = get_stock_mappings_collection()
        
        # Define popular tickers (can be made dynamic based on user activity)
        popular_tickers = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
            'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'
        ]
        
        popular_stocks = []
        for ticker in popular_tickers[:limit]:
            stock = Stock.find_by_ticker(ticker)
            if stock:
                popular_stocks.append(stock)
        
        return popular_stocks
    
    @staticmethod
    def validate_ticker(ticker):
        """
        Validate if ticker exists in database
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            bool: True if ticker exists
        """
        stock = Stock.find_by_ticker(ticker)
        return stock is not None
    
    @staticmethod
    def get_stock_info(ticker):
        """
        Get complete stock information
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            dict: Stock information or None
        """
        return Stock.find_by_ticker(ticker)
    
    @staticmethod
    def to_dict(stock_doc):
        """
        Convert stock document to clean dictionary
        
        Args:
            stock_doc: Stock document from MongoDB
        
        Returns:
            dict: Formatted stock data
        """
        if not stock_doc:
            return None
        
        return {
            'ticker': stock_doc['ticker'],
            'name': stock_doc.get('official_name') or stock_doc.get('company_name'),
            'exchange': stock_doc.get('exchange', ''),
            'sector': stock_doc.get('sector', ''),
            'industry': stock_doc.get('industry', '')
        }
