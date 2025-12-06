from datetime import datetime
from utils.db import get_watchlist_collection


class Watchlist:
    """Watchlist model for managing user stock watchlists"""
    
    @staticmethod
    def get_user_watchlist(email):
        """
        Get user's watchlist
        
        Args:
            email: User's email address
        
        Returns:
            list: List of stock tickers in watchlist
        """
        watchlist_col = get_watchlist_collection()
        user_watchlist = watchlist_col.find_one({'email': email.lower()})
        
        if user_watchlist:
            return user_watchlist.get('watchlist', [])
        
        return []
    
    @staticmethod
    def create_watchlist(email):
        """
        Create a new watchlist for user
        
        Args:
            email: User's email address
        
        Returns:
            dict: Created watchlist document
        """
        watchlist_col = get_watchlist_collection()
        
        # Check if watchlist already exists
        existing = watchlist_col.find_one({'email': email.lower()})
        if existing:
            return existing
        
        watchlist_doc = {
            'email': email.lower(),
            'watchlist': [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = watchlist_col.insert_one(watchlist_doc)
        watchlist_doc['_id'] = result.inserted_id
        
        return watchlist_doc
    
    @staticmethod
    def add_stock(email, ticker):
        """
        Add stock to user's watchlist
        
        Args:
            email: User's email address
            ticker: Stock ticker to add
        
        Returns:
            bool: True if added successfully, False if already exists
        """
        watchlist_col = get_watchlist_collection()
        ticker = ticker.upper().strip()
        
        # Ensure watchlist exists
        user_watchlist = watchlist_col.find_one({'email': email.lower()})
        if not user_watchlist:
            Watchlist.create_watchlist(email)
            user_watchlist = watchlist_col.find_one({'email': email.lower()})
        
        # Check if ticker already in watchlist
        if ticker in user_watchlist.get('watchlist', []):
            return False
        
        # Add ticker to watchlist
        result = watchlist_col.update_one(
            {'email': email.lower()},
            {
                '$push': {'watchlist': ticker},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def remove_stock(email, ticker):
        """
        Remove stock from user's watchlist
        
        Args:
            email: User's email address
            ticker: Stock ticker to remove
        
        Returns:
            bool: True if removed successfully
        """
        watchlist_col = get_watchlist_collection()
        ticker = ticker.upper().strip()
        
        result = watchlist_col.update_one(
            {'email': email.lower()},
            {
                '$pull': {'watchlist': ticker},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def clear_watchlist(email):
        """
        Clear all stocks from user's watchlist
        
        Args:
            email: User's email address
        
        Returns:
            bool: True if cleared successfully
        """
        watchlist_col = get_watchlist_collection()
        
        result = watchlist_col.update_one(
            {'email': email.lower()},
            {
                '$set': {
                    'watchlist': [],
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def get_watchlist_count(email):
        """
        Get count of stocks in user's watchlist
        
        Args:
            email: User's email address
        
        Returns:
            int: Number of stocks in watchlist
        """
        watchlist = Watchlist.get_user_watchlist(email)
        return len(watchlist)
    
    @staticmethod
    def is_stock_in_watchlist(email, ticker):
        """
        Check if stock is in user's watchlist
        
        Args:
            email: User's email address
            ticker: Stock ticker to check
        
        Returns:
            bool: True if stock is in watchlist
        """
        watchlist = Watchlist.get_user_watchlist(email)
        return ticker.upper().strip() in watchlist
