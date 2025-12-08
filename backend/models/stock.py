from utils.db import get_stock_mappings_collection
import re

class Stock:
    """Stock model for stock mappings and search using MongoDB"""
    
    @staticmethod
    def find_by_ticker(ticker):
        """
        Find stock by ticker
        """
        if not ticker:
            return None
            
        ticker = ticker.upper().strip()
        collection = get_stock_mappings_collection()
        
        # Try exact match first
        stock = collection.find_one({'ticker': ticker})
        
        # If not found, try without .NS if input had it, or with .NS if input didn't
        if not stock:
            if ticker.endswith('.NS'):
                stock = collection.find_one({'ticker': ticker[:-3]})
            else:
                stock = collection.find_one({'ticker': f"{ticker}.NS"})
                
        return stock
    
    @staticmethod
    def search_stocks(query, limit=10):
        """
        Search stocks using text search or regex
        """
        if not query or len(query.strip()) < 1:
            return []
        
        collection = get_stock_mappings_collection()
        
        # Create regex for case-insensitive partial match
        regex = re.compile(re.escape(query), re.IGNORECASE)
        
        # Search in ticker, company_name, search_terms
        cursor = collection.find({
            '$or': [
                {'ticker': regex},
                {'company_name': regex},
                {'search_terms': regex}
            ]
        }).limit(limit)
        
        return list(cursor)
    
    @staticmethod
    def fuzzy_search(query, limit=10, threshold=50):
        """
        Fuzzy search - for MongoDB, we'll rely on the regex search as it's robust enough for now
        or implement text index search if setup. 
        For now, we'll map fuzzy_search to search_stocks to simplify, 
        but we can add client-side fuzzy sorting if mapped results are too large.
        
        Actually, let's keep it simple: strict fuzzy implementation in Mongo is hard without Atlas Search.
        We will fetch a slightly larger set with Regex and filter/sort in Python if needed, 
        but standard regex is usually what users expect for autocomplete.
        """
        return Stock.search_stocks(query, limit)
    
    @staticmethod
    def get_popular_stocks(limit=10):
        """
        Get popular/default stocks. 
        Since we don't have a 'popular' flag, we'll return some Nifty 50 stocks hardcoded fallback or random.
        Better: Return first N stocks from DB.
        """
        collection = get_stock_mappings_collection()
        return list(collection.find().limit(limit))
    
    @staticmethod
    def validate_ticker(ticker):
        """
        Validate if ticker exists in database
        """
        return Stock.find_by_ticker(ticker) is not None
    
    @staticmethod
    def get_stock_info(ticker):
        """
        Get complete stock information
        """
        return Stock.find_by_ticker(ticker)
