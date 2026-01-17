"""
Mutual Fund Price Service
Fetches current NAV and historical data for mutual funds using MFapi.in and mftool
"""

import requests
import logging
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from mftool import Mftool

logger = logging.getLogger(__name__)

class MutualFundPriceService:
    """Service for fetching mutual fund NAV and historical data"""
    
    def __init__(self):
        self.mf = Mftool()
        self.base_url = "https://api.mfapi.in/mf"
    
    @staticmethod
    def get_fund_nav(scheme_code: str) -> Optional[Dict]:
        """
        Get current NAV and performance metrics for a mutual fund scheme
        
        Args:
            scheme_code: Mutual fund scheme code
            
        Returns:
            Dict with NAV data, previous NAV, and performance metrics (1Y, 3Y, 5Y, 10Y returns)
        """
        try:
            url = f"https://api.mfapi.in/mf/{scheme_code}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data and 'data' in data and len(data['data']) > 0:
                    latest = data['data'][0]
                    current_nav = float(latest['nav'])
                    
                    # Get previous day NAV
                    prev_nav = 0
                    change = 0
                    change_percent = 0
                    if len(data['data']) > 1:
                        prev_nav = float(data['data'][1]['nav'])
                        change = current_nav - prev_nav
                        change_percent = (change / prev_nav) * 100 if prev_nav > 0 else 0
                    
                    # Calculate performance returns as CAGR (Compound Annual Growth Rate)
                    # CAGR = ((Ending Value / Beginning Value)^(1/Years) - 1) × 100
                    performance = {}
                    historical_data = data['data']
                    
                    # 1 Year CAGR (~252 trading days)
                    if len(historical_data) > 252:
                        nav_1y = float(historical_data[252]['nav'])
                        if nav_1y > 0:
                            cagr_1y = ((current_nav / nav_1y) ** (1/1) - 1) * 100
                            performance['return_1y'] = cagr_1y
                        else:
                            performance['return_1y'] = None
                    else:
                        performance['return_1y'] = None
                    
                    # 3 Year CAGR (~756 trading days)
                    if len(historical_data) > 756:
                        nav_3y = float(historical_data[756]['nav'])
                        if nav_3y > 0:
                            cagr_3y = ((current_nav / nav_3y) ** (1/3) - 1) * 100
                            performance['return_3y'] = cagr_3y
                        else:
                            performance['return_3y'] = None
                    else:
                        performance['return_3y'] = None
                    
                    # 5 Year CAGR (~1260 trading days)
                    if len(historical_data) > 1260:
                        nav_5y = float(historical_data[1260]['nav'])
                        if nav_5y > 0:
                            cagr_5y = ((current_nav / nav_5y) ** (1/5) - 1) * 100
                            performance['return_5y'] = cagr_5y
                        else:
                            performance['return_5y'] = None
                    else:
                        performance['return_5y'] = None
                    
                    # 10 Year CAGR (~2520 trading days)
                    if len(historical_data) > 2520:
                        nav_10y = float(historical_data[2520]['nav'])
                        if nav_10y > 0:
                            cagr_10y = ((current_nav / nav_10y) ** (1/10) - 1) * 100
                            performance['return_10y'] = cagr_10y
                        else:
                            performance['return_10y'] = None
                    else:
                        performance['return_10y'] = None
                    
                    return {
                        'scheme_code': scheme_code,
                        'scheme_name': data.get('meta', {}).get('scheme_name', ''),
                        'nav': current_nav,
                        'prev_nav': prev_nav,
                        'date': latest['date'],
                        'change': change,
                        'change_percent': change_percent,
                        'fund_house': data.get('meta', {}).get('fund_house', ''),
                        'scheme_type': data.get('meta', {}).get('scheme_type', ''),
                        'scheme_category': data.get('meta', {}).get('scheme_category', ''),
                        'return_1y': performance.get('return_1y'),
                        'return_3y': performance.get('return_3y'),
                        'return_5y': performance.get('return_5y'),
                        'return_10y': performance.get('return_10y')
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching NAV for {scheme_code}: {str(e)}")
            return None
    
    @staticmethod
    def get_historical_nav(scheme_code: str, days: int = 365) -> Optional[List[Dict]]:
        """
        Get historical NAV data for a mutual fund
        
        Args:
            scheme_code: Mutual fund scheme code
            days: Number of days of history to fetch
            
        Returns:
            List of historical NAV data
        """
        try:
            url = f"https://api.mfapi.in/mf/{scheme_code}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data and 'data' in data:
                    # Return last N days
                    return data['data'][:days]
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching historical NAV for {scheme_code}: {str(e)}")
            return None
    
    def get_fund_details(self, scheme_code: str) -> Optional[Dict]:
        """
        Get detailed information about a mutual fund using mftool
        
        Args:
            scheme_code: Mutual fund scheme code
            
        Returns:
            Dict with fund details
        """
        try:
            # Get scheme quote
            quote = self.mf.get_scheme_quote(scheme_code)
            
            if quote:
                return {
                    'scheme_code': quote.get('scheme_code'),
                    'scheme_name': quote.get('scheme_name'),
                    'nav': float(quote.get('nav', 0)),
                    'last_updated': quote.get('last_updated'),
                    'fund_house': quote.get('fund_house', ''),
                    'scheme_type': quote.get('scheme_type', ''),
                    'scheme_category': quote.get('scheme_category', '')
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching fund details for {scheme_code}: {str(e)}")
            return None
    
    def search_funds(self, query: str) -> List[Dict]:
        """
        Search for mutual funds by name
        
        Args:
            query: Search query
            
        Returns:
            List of matching funds
        """
        try:
            # Get all scheme codes
            all_schemes = self.mf.get_all_amc_profiles()
            
            results = []
            query_lower = query.lower()
            
            for amc_code, amc_data in all_schemes.items():
                if isinstance(amc_data, list):
                    for scheme in amc_data:
                        if isinstance(scheme, dict):
                            scheme_name = scheme.get('scheme_name', '').lower()
                            if query_lower in scheme_name:
                                results.append({
                                    'scheme_code': scheme.get('scheme_code'),
                                    'scheme_name': scheme.get('scheme_name'),
                                    'fund_house': amc_code
                                })
                                
                                if len(results) >= 10:
                                    return results
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching funds: {str(e)}")
            return []
    
    @staticmethod
    def get_fund_performance(scheme_code: str) -> Optional[Dict]:
        """
        Calculate fund performance metrics (1Y, 3Y, 5Y returns)
        
        Args:
            scheme_code: Mutual fund scheme code
            
        Returns:
            Dict with performance metrics
        """
        try:
            historical_data = MutualFundPriceService.get_historical_nav(scheme_code, days=1825)  # ~5 years
            
            if not historical_data or len(historical_data) < 2:
                return None
            
            current_nav = float(historical_data[0]['nav'])
            
            # Calculate returns
            returns = {}
            
            # 1 Year return (252 trading days)
            if len(historical_data) > 252:
                nav_1y = float(historical_data[252]['nav'])
                returns['return_1y'] = ((current_nav - nav_1y) / nav_1y) * 100
            
            # 3 Year return (756 trading days)
            if len(historical_data) > 756:
                nav_3y = float(historical_data[756]['nav'])
                returns['return_3y'] = ((current_nav - nav_3y) / nav_3y) * 100
            
            # 5 Year return (1260 trading days)
            if len(historical_data) > 1260:
                nav_5y = float(historical_data[1260]['nav'])
                returns['return_5y'] = ((current_nav - nav_5y) / nav_5y) * 100
            
            return returns
            
        except Exception as e:
            logger.error(f"Error calculating performance for {scheme_code}: {str(e)}")
            return None
    
    @staticmethod
    def get_multiple_fund_navs(scheme_codes: List[str]) -> Dict[str, Dict]:
        """
        Get NAV data for multiple funds
        
        Args:
            scheme_codes: List of scheme codes
            
        Returns:
            Dict mapping scheme_code to NAV data
        """
        results = {}
        
        for code in scheme_codes:
            nav_data = MutualFundPriceService.get_fund_nav(code)
            if nav_data:
                results[code] = nav_data
        
        return results
