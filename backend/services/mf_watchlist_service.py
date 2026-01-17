"""
Mutual Fund Watchlist Service
Manage user's mutual fund watchlists
"""

from models.mf_watchlist import MFWatchlist
from services.mf_price_service import MutualFundPriceService
import logging

logger = logging.getLogger(__name__)

class MFWatchlistService:
    """Service for managing mutual fund watchlists"""
    
    @staticmethod
    def get_watchlist(email: str, watchlist_id: str = 'default'):
        """
        Get user's mutual fund watchlist with NAV details
        
        Args:
            email: User's email
            watchlist_id: Watchlist ID
            
        Returns:
            tuple: (success, message, data)
        """
        try:
            from models.mf_user_watchlist import MFUserWatchlist
            
            # If 'default', try to find the actual default watchlist ID for the user
            if watchlist_id == 'default':
                user_watchlists = MFUserWatchlist.get_user_watchlists(email)
                if user_watchlists:
                    default_w = next((w for w in user_watchlists if w.get('is_default')), user_watchlists[0] if user_watchlists else None)
                    if default_w:
                        watchlist_id = default_w['watchlist_id']
                    else:
                        return True, "No watchlists found", []
                else:
                    return True, "No watchlists found", []
            
            scheme_codes = MFWatchlist.get_user_watchlist(email, watchlist_id)
            
            # Get fund details for each scheme
            watchlist_with_details = []
            for code in scheme_codes:
                fund_info = MutualFundPriceService.get_fund_nav(code)
                if fund_info:
                    # Include all fields from fund_info
                    watchlist_with_details.append({
                        'scheme_code': code,
                        'scheme_name': fund_info.get('scheme_name'),
                        'nav': fund_info.get('nav'),
                        'prev_nav': fund_info.get('prev_nav', 0),
                        'change': fund_info.get('change'),
                        'change_percent': fund_info.get('change_percent'),
                        'fund_house': fund_info.get('fund_house', ''),
                        'scheme_category': fund_info.get('scheme_category', ''),
                        'return_1y': fund_info.get('return_1y'),
                        'return_3y': fund_info.get('return_3y'),
                        'return_5y': fund_info.get('return_5y'),
                        'return_10y': fund_info.get('return_10y')
                    })
                else:
                    # Fund not found, return basic info
                    watchlist_with_details.append({
                        'scheme_code': code,
                        'scheme_name': code,
                        'nav': 0,
                        'prev_nav': 0,
                        'change': 0,
                        'change_percent': 0,
                        'fund_house': '',
                        'scheme_category': '',
                        'return_1y': None,
                        'return_3y': None,
                        'return_5y': None,
                        'return_10y': None
                    })
            
            return True, "Watchlist retrieved successfully", watchlist_with_details
        
        except Exception as e:
            return False, f"Error retrieving watchlist: {str(e)}", None
    
    @staticmethod
    def add_to_watchlist(email: str, scheme_code: str, watchlist_id: str = 'default'):
        """
        Add mutual fund to user's watchlist
        
        Args:
            email: User's email
            scheme_code: Mutual fund scheme code
            watchlist_id: Watchlist ID
            
        Returns:
            tuple: (success, message, data)
        """
        try:
            # Convert scheme_code to string and strip whitespace
            scheme_code = str(scheme_code).strip()
            
            # Validate scheme exists by fetching NAV
            fund_data = MutualFundPriceService.get_fund_nav(scheme_code)
            if not fund_data or not fund_data.get('nav'):
                return False, f"Mutual fund scheme '{scheme_code}' not found or invalid", None
            
            from models.mf_user_watchlist import MFUserWatchlist
            
            # If 'default', resolve to actual default ID
            if watchlist_id == 'default':
                user_watchlists = MFUserWatchlist.get_user_watchlists(email)
                if user_watchlists:
                    default_w = next((w for w in user_watchlists if w.get('is_default')), user_watchlists[0] if user_watchlists else None)
                    if default_w:
                        watchlist_id = default_w['watchlist_id']
                    else:
                        return False, "No watchlists found. Please create a watchlist first.", None
                else:
                    return False, "No watchlists found. Please create a watchlist first.", None
            
            # Add to watchlist
            added = MFWatchlist.add_fund(email, scheme_code, watchlist_id)
            
            if not added:
                return False, f"Fund '{scheme_code}' is already in your watchlist", None
            
            # Get updated watchlist
            success, message, watchlist = MFWatchlistService.get_watchlist(email, watchlist_id)
            
            return True, f"Fund '{scheme_code}' added to watchlist", watchlist
        
        except Exception as e:
            return False, f"Error adding to watchlist: {str(e)}", None
    
    @staticmethod
    def remove_from_watchlist(email: str, scheme_code: str, watchlist_id: str = 'default'):
        """
        Remove mutual fund from user's watchlist
        
        Args:
            email: User's email
            scheme_code: Mutual fund scheme code
            watchlist_id: Watchlist ID
            
        Returns:
            tuple: (success, message, data)
        """
        try:
            # Convert scheme_code to string and strip whitespace
            scheme_code = str(scheme_code).strip()
            
            from models.mf_user_watchlist import MFUserWatchlist
            
            # If 'default', resolve to actual default ID
            if watchlist_id == 'default':
                user_watchlists = MFUserWatchlist.get_user_watchlists(email)
                if user_watchlists:
                    default_w = next((w for w in user_watchlists if w.get('is_default')), user_watchlists[0] if user_watchlists else None)
                    if default_w:
                        watchlist_id = default_w['watchlist_id']
            
            # Remove from watchlist
            removed = MFWatchlist.remove_fund(email, scheme_code, watchlist_id)
            
            if not removed:
                return False, f"Fund '{scheme_code}' not found in watchlist", None
            
            # Get updated watchlist
            success, message, watchlist = MFWatchlistService.get_watchlist(email, watchlist_id)
            
            return True, f"Fund '{scheme_code}' removed from watchlist", watchlist
        
        except Exception as e:
            return False, f"Error removing from watchlist: {str(e)}", None
    
    @staticmethod
    def get_watchlist_navs(email: str, watchlist_id: str = 'default'):
        """
        Get current NAVs for all funds in user's watchlist
        
        Args:
            email: User's email
            watchlist_id: Watchlist ID
            
        Returns:
            tuple: (success, message, data)
        """
        try:
            scheme_codes = MFWatchlist.get_user_watchlist(email, watchlist_id)
            
            if not scheme_codes:
                return True, "Watchlist is empty", {}
            
            # Fetch NAVs for all funds
            nav_data = MutualFundPriceService.get_multiple_fund_navs(scheme_codes)
            
            return True, "NAVs retrieved successfully", nav_data
        
        except Exception as e:
            return False, f"Error fetching NAVs: {str(e)}", None
