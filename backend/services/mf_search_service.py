"""
Mutual Fund Search Service
Search and discover mutual funds using mftool and MFapi.in
"""

import requests
import logging
from typing import List, Dict
from mftool import Mftool

logger = logging.getLogger(__name__)

class MutualFundSearchService:
    """Service for searching mutual funds"""
    
    def __init__(self):
        self.mf = Mftool()
    
    @staticmethod
    def search_funds(query: str, limit: int = 10) -> List[Dict]:
        """
        Search for mutual funds by name or AMC using MFapi.in
        
        MFapi.in provides comprehensive coverage of all Indian mutual funds
        registered with AMFI (Association of Mutual Funds in India)
        
        Args:
            query: Search query (fund name, AMC name, or keywords)
            limit: Maximum number of results
            
        Returns:
            List of matching funds with scheme_code and scheme_name
        """
        try:
            if not query or len(query) < 2:
                logger.warning("Search query too short or empty")
                return []
            
            # Use MFapi.in search endpoint
            # This API searches across all AMFI-registered mutual funds
            url = f"https://api.mfapi.in/mf/search?q={query}"
            logger.info(f"Searching MFapi.in for: {query}")
            
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                results = response.json()
                logger.info(f"Found {len(results)} results for '{query}'")
                
                # Format results
                formatted_results = []
                for fund in results[:limit]:
                    formatted_results.append({
                        'scheme_code': str(fund.get('schemeCode', '')),
                        'scheme_name': fund.get('schemeName', ''),
                        'type': 'MUTUAL_FUND'
                    })
                
                return formatted_results
            else:
                logger.error(f"MFapi.in returned status {response.status_code}")
                return []
            
        except requests.Timeout:
            logger.error("MFapi.in search timed out")
            return []
        except Exception as e:
            logger.error(f"Error searching funds: {str(e)}")
            return []
    
    def get_all_schemes(self) -> List[Dict]:
        """
        Get all available mutual fund schemes
        
        Returns:
            List of all schemes
        """
        try:
            schemes = self.mf.get_all_amc_profiles()
            
            all_funds = []
            for amc_code, amc_data in schemes.items():
                if isinstance(amc_data, list):
                    for scheme in amc_data:
                        if isinstance(scheme, dict):
                            all_funds.append({
                                'scheme_code': scheme.get('scheme_code'),
                                'scheme_name': scheme.get('scheme_name'),
                                'fund_house': amc_code
                            })
            
            return all_funds
            
        except Exception as e:
            logger.error(f"Error fetching all schemes: {str(e)}")
            return []
    
    def get_schemes_by_category(self, category: str) -> List[Dict]:
        """
        Get mutual funds by category (Equity, Debt, Hybrid, etc.)
        
        Args:
            category: Fund category
            
        Returns:
            List of funds in that category
        """
        try:
            # This would require additional filtering logic
            # For now, return empty list
            return []
            
        except Exception as e:
            logger.error(f"Error fetching schemes by category: {str(e)}")
            return []
    
    @staticmethod
    def get_popular_funds(limit: int = 10) -> List[Dict]:
        """
        Get popular/recommended mutual funds
        
        Args:
            limit: Number of funds to return
            
        Returns:
            List of popular funds
        """
        # Hardcoded popular fund scheme codes
        popular_codes = [
            '120503',  # SBI Bluechip Fund
            '118989',  # HDFC Top 100 Fund
            '119551',  # ICICI Prudential Bluechip Fund
            '120716',  # Axis Bluechip Fund
            '125497',  # Parag Parikh Flexi Cap Fund
            '120716',  # Mirae Asset Large Cap Fund
            '118989',  # UTI Nifty Index Fund
            '119551',  # SBI Small Cap Fund
            '120503',  # HDFC Mid-Cap Opportunities Fund
            '125497'   # Kotak Emerging Equity Fund
        ]
        
        results = []
        for code in popular_codes[:limit]:
            try:
                url = f"https://api.mfapi.in/mf/{code}"
                response = requests.get(url, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    if data and 'meta' in data:
                        results.append({
                            'scheme_code': code,
                            'scheme_name': data['meta'].get('scheme_name', ''),
                            'fund_house': data['meta'].get('fund_house', ''),
                            'scheme_category': data['meta'].get('scheme_category', '')
                        })
            except:
                continue
        
        return results
