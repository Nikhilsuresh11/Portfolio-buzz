from datetime import datetime
from utils.db import get_watchlist_collection

class Watchlist:
    """Watchlist model for managing user stock watchlists with multi-watchlist support"""
    
    @staticmethod
    def get_user_watchlist(email, watchlist_id='default'):
        """
        Get user's watchlist for a specific watchlist_id
        
        Args:
            email: User's email address
            watchlist_id: ID of the watchlist
        
        Returns:
            list: List of stock tickers in watchlist
        """
        watchlist_col = get_watchlist_collection()
        
        # New multi-watchlist schema: one document per ticker
        cursor = watchlist_col.find({
            'user_email': email.lower(),
            'watchlist_id': watchlist_id
        })
        
        tickers = []
        for doc in cursor:
            tickers.append(doc['ticker'])
            
        # Fallback for old schema (single document with list)
        if not tickers and watchlist_id == 'default':
            user_watchlist = watchlist_col.find_one({'email': email.lower()})
            if user_watchlist:
                return user_watchlist.get('watchlist', [])
        
        return tickers
    
    @staticmethod
    def add_stock(email, ticker, watchlist_id='default'):
        """
        Add stock to user's specific watchlist
        
        Args:
            email: User's email address
            ticker: Stock ticker to add
            watchlist_id: ID of the watchlist
        
        Returns:
            bool: True if added successfully, False if already exists
        """
        watchlist_col = get_watchlist_collection()
        ticker = ticker.upper().strip()
        
        # Check if already exists in new schema
        existing = watchlist_col.find_one({
            'user_email': email.lower(),
            'watchlist_id': watchlist_id,
            'ticker': ticker
        })
        
        if existing:
            return False
            
        # Insert new document
        doc = {
            'user_email': email.lower(),
            'watchlist_id': watchlist_id,
            'ticker': ticker,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        try:
            watchlist_col.insert_one(doc)
            return True
        except Exception as e:
            # Handle duplicate key error if race condition
            return False
    
    @staticmethod
    def remove_stock(email, ticker, watchlist_id='default'):
        """
        Remove stock from user's specific watchlist
        """
        watchlist_col = get_watchlist_collection()
        ticker = ticker.upper().strip()
        
        # Remove from new schema
        result = watchlist_col.delete_one({
            'user_email': email.lower(),
            'watchlist_id': watchlist_id,
            'ticker': ticker
        })
        
        # Fallback for old schema (remove from list)
        if result.deleted_count == 0 and watchlist_id == 'default':
            watchlist_col.update_one(
                {'email': email.lower()},
                {
                    '$pull': {'watchlist': ticker},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
            return True # Assume success for migration sake or if list was modified
            
        return result.deleted_count > 0
    
    @staticmethod
    def clear_watchlist(email, watchlist_id='default'):
        """
        Clear all stocks from user's specific watchlist
        """
        watchlist_col = get_watchlist_collection()
        
        # Clear new schema
        result = watchlist_col.delete_many({
            'user_email': email.lower(),
            'watchlist_id': watchlist_id
        })
        
        # Clear old schema
        if result.deleted_count == 0 and watchlist_id == 'default':
            watchlist_col.update_one(
                {'email': email.lower()},
                {
                    '$set': {
                        'watchlist': [],
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
        return True
    
    @staticmethod
    def get_watchlist_count(email, watchlist_id='default'):
        """
        Get count of stocks in user's watchlist
        """
        watchlist = Watchlist.get_user_watchlist(email, watchlist_id)
        return len(watchlist)
    
    @staticmethod
    def is_stock_in_watchlist(email, ticker, watchlist_id='default'):
        """
        Check if stock is in user's watchlist
        """
        ticker = ticker.upper().strip()
        watchlist_col = get_watchlist_collection()
        
        count = watchlist_col.count_documents({
            'user_email': email.lower(),
            'watchlist_id': watchlist_id,
            'ticker': ticker
        })
        
        if count > 0:
            return True
            
        # Fallback for old schema
        if watchlist_id == 'default':
            user_watchlist = watchlist_col.find_one({'email': email.lower()})
            if user_watchlist:
                return ticker in user_watchlist.get('watchlist', [])
                
        return False
