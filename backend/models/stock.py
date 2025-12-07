from fuzzywuzzy import fuzz

# Hardcoded list of popular Indian stocks
INDIAN_STOCKS = [
    {"ticker": "RELIANCE", "name": "Reliance Industries Ltd", "sector": "Energy", "exchange": "NSE"},
    {"ticker": "TCS", "name": "Tata Consultancy Services", "sector": "Technology", "exchange": "NSE"},
    {"ticker": "HDFCBANK", "name": "HDFC Bank Ltd", "sector": "Financials", "exchange": "NSE"},
    {"ticker": "INFY", "name": "Infosys Ltd", "sector": "Technology", "exchange": "NSE"},
    {"ticker": "ICICIBANK", "name": "ICICI Bank Ltd", "sector": "Financials", "exchange": "NSE"},
    {"ticker": "HINDUNILVR", "name": "Hindustan Unilever Ltd", "sector": "Consumer Goods", "exchange": "NSE"},
    {"ticker": "ITC", "name": "ITC Ltd", "sector": "Consumer Goods", "exchange": "NSE"},
    {"ticker": "SBIN", "name": "State Bank of India", "sector": "Financials", "exchange": "NSE"},
    {"ticker": "BHARTIARTL", "name": "Bharti Airtel Ltd", "sector": "Telecom", "exchange": "NSE"},
    {"ticker": "KOTAKBANK", "name": "Kotak Mahindra Bank", "sector": "Financials", "exchange": "NSE"},
    {"ticker": "LICI", "name": "Life Insurance Corp", "sector": "Financials", "exchange": "NSE"},
    {"ticker": "LT", "name": "Larsen & Toubro Ltd", "sector": "Construction", "exchange": "NSE"},
    {"ticker": "BAJFINANCE", "name": "Bajaj Finance Ltd", "sector": "Financials", "exchange": "NSE"},
    {"ticker": "ASIANPAINT", "name": "Asian Paints Ltd", "sector": "Materials", "exchange": "NSE"},
    {"ticker": "MARUTI", "name": "Maruti Suzuki India", "sector": "Automotive", "exchange": "NSE"},
    {"ticker": "HCLTECH", "name": "HCL Technologies Ltd", "sector": "Technology", "exchange": "NSE"},
    {"ticker": "TITAN", "name": "Titan Company Ltd", "sector": "Consumer Goods", "exchange": "NSE"},
    {"ticker": "AXISBANK", "name": "Axis Bank Ltd", "sector": "Financials", "exchange": "NSE"},
    {"ticker": "SUNPHARMA", "name": "Sun Pharmaceutical", "sector": "Healthcare", "exchange": "NSE"},
    {"ticker": "ULTRACEMCO", "name": "UltraTech Cement Ltd", "sector": "Materials", "exchange": "NSE"},
    {"ticker": "WIPRO", "name": "Wipro Ltd", "sector": "Technology", "exchange": "NSE"},
    {"ticker": "ONGC", "name": "Oil & Natural Gas Corp", "sector": "Energy", "exchange": "NSE"},
    {"ticker": "NTPC", "name": "NTPC Ltd", "sector": "Utilities", "exchange": "NSE"},
    {"ticker": "POWERGRID", "name": "Power Grid Corp", "sector": "Utilities", "exchange": "NSE"},
    {"ticker": "TATAMOTORS", "name": "Tata Motors Ltd", "sector": "Automotive", "exchange": "NSE"},
    {"ticker": "ADANIENT", "name": "Adani Enterprises Ltd", "sector": "Conglomerate", "exchange": "NSE"},
    {"ticker": "ADANIGREEN", "name": "Adani Green Energy Ltd", "sector": "Utilities", "exchange": "NSE"},
    {"ticker": "ADANIPORTS", "name": "Adani Ports & SEZ", "sector": "Infrastructure", "exchange": "NSE"},
    {"ticker": "COALINDIA", "name": "Coal India Ltd", "sector": "Materials", "exchange": "NSE"},
    {"ticker": "BAJAJFINSV", "name": "Bajaj Finserv Ltd", "sector": "Financials", "exchange": "NSE"}
]

class Stock:
    """Stock model for stock mappings and search using hardcoded list"""
    
    @staticmethod
    def find_by_ticker(ticker):
        """
        Find stock by ticker
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            dict: Stock document or None
        """
        if not ticker:
            return None
            
        ticker = ticker.upper().strip()
        for stock in INDIAN_STOCKS:
            if stock['ticker'] == ticker:
                return stock
        return None
    
    @staticmethod
    def search_stocks(query, limit=10):
        """
        Search stocks using simple string matching
        
        Args:
            query: Search query string
            limit: Maximum number of results
        
        Returns:
            list: List of matching stock documents
        """
        if not query or len(query.strip()) < 1:
            return []
        
        query = query.lower().strip()
        matches = []
        
        for stock in INDIAN_STOCKS:
            if (query in stock['ticker'].lower() or 
                query in stock['name'].lower()):
                matches.append(stock)
                
            if len(matches) >= limit:
                break
                
        return matches
    
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
        if not query or len(query.strip()) < 1:
            return []
        
        query_lower = query.lower().strip()
        scored_stocks = []
        
        for stock in INDIAN_STOCKS:
            # Calculate fuzzy match scores
            ticker_score = fuzz.partial_ratio(query_lower, stock['ticker'].lower())
            name_score = fuzz.partial_ratio(query_lower, stock['name'].lower())
            
            # Take the highest score
            max_score = max(ticker_score, name_score)
            
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
        # Return top stocks from the list
        return INDIAN_STOCKS[:limit]
    
    @staticmethod
    def validate_ticker(ticker):
        """
        Validate if ticker exists in database
        
        Args:
            ticker: Stock ticker symbol
        
        Returns:
            bool: True if ticker exists
        """
        return Stock.find_by_ticker(ticker) is not None
    
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
            stock_doc: Stock document
        
        Returns:
            dict: Formatted stock data
        """
        if not stock_doc:
            return None
        
        return {
            'ticker': stock_doc['ticker'],
            'name': stock_doc['name'],
            'exchange': stock_doc.get('exchange', 'NSE'),
            'sector': stock_doc.get('sector', ''),
            'industry': stock_doc.get('industry', '')
        }
