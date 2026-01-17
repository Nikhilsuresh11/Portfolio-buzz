"""
Mutual Fund Controllers
API endpoints for mutual fund operations
"""

from flask import request
from services.mf_search_service import MutualFundSearchService
from services.mf_price_service import MutualFundPriceService
from services.mf_watchlist_service import MFWatchlistService
from utils.response import success_response, error_response

class MFController:
    """Controller for mutual fund endpoints"""
    
    @staticmethod
    def search_funds():
        """
        GET /api/mf/search?q=<query>
        Search for mutual funds
        """
        try:
            query = request.args.get('q', '').strip()
            
            if not query or len(query) < 2:
                return success_response({'results': []}, 'Query too short', 200)
            
            search_service = MutualFundSearchService()
            results = search_service.search_funds(query, limit=50)  # Increased from 10 to 50
            
            return success_response(
                {'results': results},
                f'Found {len(results)} results',
                200
            )
            
        except Exception as e:
            return error_response(f"Error searching funds: {str(e)}", 500)
    
    @staticmethod
    def get_popular_funds():
        """
        GET /api/mf/popular
        Get a list of popular mutual funds for discovery
        """
        try:
            # List of some popular mutual fund scheme codes in India
            popular_codes = [
                '120465',  # SBI Bluechip Fund - Direct Plan - Growth
                '118834',  # Mirae Asset Large Cap Fund - Direct Plan - Growth
                '148918',  # Canara Robeco Bluechip Equity Fund - Direct Plan - Growth
                '102885',  # HDFC Top 100 Fund - Direct Plan - Growth
                '145238',  # Axis Bluechip Fund - Direct Plan - Growth
                '120844',  # ICICI Prudential Bluechip Fund - Direct Plan - Growth
                '119551',  # Parag Parikh Flexi Cap Fund - Direct Plan - Growth
            ]
            
            results = []
            for code in popular_codes:
                nav_data = MutualFundPriceService.get_fund_nav(code)
                if nav_data:
                    results.append({
                        'scheme_code': code,
                        'scheme_name': nav_data.get('scheme_name'),
                        'nav': nav_data.get('nav'),
                        'return_1y': nav_data.get('return_1y'),
                        'return_3y': nav_data.get('return_3y'),
                        'return_5y': nav_data.get('return_5y'),
                    })
            
            return success_response(results, 'Popular funds retrieved successfully', 200)
            
        except Exception as e:
            return error_response(f"Error fetching popular funds: {str(e)}", 500)
    
    @staticmethod
    def get_fund_nav(scheme_code):
        """
        GET /api/mf/<scheme_code>/nav
        Get current NAV for a mutual fund
        """
        try:
            nav_data = MutualFundPriceService.get_fund_nav(scheme_code)
            
            if not nav_data:
                return error_response(f"Fund {scheme_code} not found", 404)
            
            return success_response(nav_data, 'NAV retrieved successfully', 200)
            
        except Exception as e:
            return error_response(f"Error fetching NAV: {str(e)}", 500)
    
    @staticmethod
    def get_fund_performance(scheme_code):
        """
        GET /api/mf/<scheme_code>/performance
        Get performance metrics for a mutual fund
        """
        try:
            performance = MutualFundPriceService.get_fund_performance(scheme_code)
            
            if not performance:
                return error_response(f"Performance data not available for {scheme_code}", 404)
            
            return success_response(performance, 'Performance retrieved successfully', 200)
            
        except Exception as e:
            return error_response(f"Error fetching performance: {str(e)}", 500)

    @staticmethod
    def get_nav_on_date(scheme_code):
        """
        GET /api/mf/<scheme_code>/nav-on-date?date=<YYYY-MM-DD>
        Get NAV for a specific date
        """
        try:
            date_str = request.args.get('date')
            if not date_str:
                return error_response("date parameter is required", 400)
                
            nav = MutualFundPriceService.get_nav_on_date(scheme_code, date_str)
            
            if nav is None:
                return error_response(f"NAV not found for {scheme_code} on {date_str}", 404)
                
            return success_response({'nav': nav}, 'NAV retrieved successfully', 200)
            
        except Exception as e:
            return error_response(f"Error fetching NAV for date: {str(e)}", 500)
    


class MFWatchlistController:
    """Controller for mutual fund watchlist endpoints"""
    
    @staticmethod
    def get_watchlist(user_email):
        """
        GET /api/<user_email>/mf/watchlist
        Get user's mutual fund watchlist
        """
        try:
            watchlist_id = request.args.get('watchlist_id', 'default')
            
            success, message, data = MFWatchlistService.get_watchlist(user_email, watchlist_id)
            
            if success:
                return success_response(data, message, 200)
            else:
                return error_response(message, 400)
                
        except Exception as e:
            return error_response(f"Error fetching watchlist: {str(e)}", 500)
    
    @staticmethod
    def add_to_watchlist(user_email):
        """
        POST /api/<user_email>/mf/watchlist
        Add fund to watchlist
        
        Body: {
            "scheme_code": "120503",
            "watchlist_id": "default"
        }
        """
        try:
            data = request.get_json()
            
            if not data or 'scheme_code' not in data:
                return error_response("scheme_code is required", 400)
            
            scheme_code = data.get('scheme_code')
            watchlist_id = data.get('watchlist_id', 'default')
            
            success, message, watchlist = MFWatchlistService.add_to_watchlist(
                user_email, scheme_code, watchlist_id
            )
            
            if success:
                return success_response(watchlist, message, 200)
            else:
                return error_response(message, 400)
                
        except Exception as e:
            return error_response(f"Error adding to watchlist: {str(e)}", 500)
    
    @staticmethod
    def remove_from_watchlist(user_email, scheme_code):
        """
        DELETE /api/<user_email>/mf/watchlist/<scheme_code>
        Remove fund from watchlist
        """
        try:
            watchlist_id = request.args.get('watchlist_id', 'default')
            
            success, message, watchlist = MFWatchlistService.remove_from_watchlist(
                user_email, scheme_code, watchlist_id
            )
            
            if success:
                return success_response(watchlist, message, 200)
            else:
                return error_response(message, 400)
                
        except Exception as e:
            return error_response(f"Error removing from watchlist: {str(e)}", 500)
    
    @staticmethod
    def get_watchlist_navs(user_email):
        """
        GET /api/<user_email>/mf/watchlist/navs
        Get NAVs for all funds in watchlist
        """
        try:
            watchlist_id = request.args.get('watchlist_id', 'default')
            
            success, message, data = MFWatchlistService.get_watchlist_navs(user_email, watchlist_id)
            
            if success:
                return success_response(data, message, 200)
            else:
                return error_response(message, 400)
                
        except Exception as e:
            return error_response(f"Error fetching NAVs: {str(e)}", 500)
