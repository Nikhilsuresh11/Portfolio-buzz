"""
Mutual Fund Watchlist Model
MongoDB model for storing user's mutual fund watchlists
"""

from utils.db import get_mf_watchlist_collection
from typing import List

class MFWatchlist:
    """Model for mutual fund watchlist operations"""
    
    @staticmethod
    def get_user_watchlist(email: str, watchlist_id: str = 'default') -> List[str]:
        """
        Get all mutual fund scheme codes in user's watchlist
        
        Args:
            email: User's email address
            watchlist_id: Watchlist ID
            
        Returns:
            List of scheme codes
        """
        collection = get_mf_watchlist_collection()
        
        # Find all funds for this user and watchlist
        cursor = collection.find({
            'user_email': email,
            'watchlist_id': watchlist_id
        })
        
        scheme_codes = [doc['scheme_code'] for doc in cursor]
        
        # If not found and watchlist_id is 'default', try finding ANY funds for this user
        if not scheme_codes and watchlist_id == 'default':
            cursor = collection.find({'user_email': email})
            scheme_codes = list(set([doc['scheme_code'] for doc in cursor]))
        
        return scheme_codes
    
    @staticmethod
    def add_fund(email: str, scheme_code: str, watchlist_id: str = 'default') -> bool:
        """
        Add a mutual fund to user's watchlist
        
        Args:
            email: User's email address
            scheme_code: Mutual fund scheme code
            watchlist_id: Watchlist ID
            
        Returns:
            True if added, False if already exists
        """
        collection = get_mf_watchlist_collection()
        
        # Check if already exists
        existing = collection.find_one({
            'user_email': email,
            'scheme_code': scheme_code,
            'watchlist_id': watchlist_id
        })
        
        if existing:
            return False
        
        # Add new fund
        from datetime import datetime
        collection.insert_one({
            'user_email': email,
            'scheme_code': scheme_code,
            'watchlist_id': watchlist_id,
            'added_at': datetime.utcnow()
        })
        
        return True
    
    @staticmethod
    def remove_fund(email: str, scheme_code: str, watchlist_id: str = 'default') -> bool:
        """
        Remove a mutual fund from user's watchlist
        
        Args:
            email: User's email address
            scheme_code: Mutual fund scheme code
            watchlist_id: Watchlist ID
            
        Returns:
            True if removed, False if not found
        """
        collection = get_mf_watchlist_collection()
        
        result = collection.delete_one({
            'user_email': email,
            'scheme_code': scheme_code,
            'watchlist_id': watchlist_id
        })
        
        return result.deleted_count > 0
    
    @staticmethod
    def clear_watchlist(email: str, watchlist_id: str = 'default'):
        """
        Clear all funds from user's watchlist
        
        Args:
            email: User's email address
            watchlist_id: Watchlist ID
        """
        collection = get_mf_watchlist_collection()
        
        collection.delete_many({
            'user_email': email,
            'watchlist_id': watchlist_id
        })
    
    @staticmethod
    def get_all_user_funds(email: str) -> List[str]:
        """
        Get all mutual fund scheme codes for a user across all watchlists
        
        Args:
            email: User's email address
            
        Returns:
            List of unique scheme codes
        """
        collection = get_mf_watchlist_collection()
        
        cursor = collection.find({'user_email': email})
        scheme_codes = list(set([doc['scheme_code'] for doc in cursor]))
        
        return scheme_codes
