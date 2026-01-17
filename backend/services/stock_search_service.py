import requests
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class StockSearchService:
    """Service for searching stocks using Yahoo Finance API"""
    
    @staticmethod
    def search_stocks(query: str) -> List[Dict]:
        """
        Search for stocks using Yahoo Finance API with multiple strategies
        
        Args:
            query: Search query (company name or ticker)
            
        Returns:
            List of stock results with symbol, name, exchange, and type
        """
        try:
            if not query or len(query) < 2:
                return []
            
            all_results = []
            
            # Strategy 1: Direct search with fuzzy matching
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
                response = requests.get(
                    'https://query2.finance.yahoo.com/v1/finance/search',
                    params={
                        'q': query,
                        'quotesCount': 15,
                        'newsCount': 0,
                        'enableFuzzyQuery': True,
                        'quotesQueryId': 'tss_match_phrase_query'
                    },
                    headers=headers,
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    for quote in data.get('quotes', []):
                        quote_type = quote.get('quoteType', '')
                        # Include EQUITY and other stock types
                        if quote_type in ['EQUITY', 'STOCK', 'ETF']:
                            all_results.append({
                                'symbol': quote.get('symbol', ''),
                                'name': quote.get('longname') or quote.get('shortname') or quote.get('symbol', ''),
                                'exchange': quote.get('exchange', ''),
                                'type': quote_type
                            })
            except Exception as e:
                logger.error(f"Search strategy 1 failed: {str(e)}")
            
            # Strategy 2: Try with .NS suffix for Indian stocks if no results
            if len(all_results) == 0 and not query.endswith(('.NS', '.BO', '.BSE')):
                try:
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                    ns_query = f"{query}.NS"
                    response = requests.get(
                        'https://query2.finance.yahoo.com/v1/finance/search',
                        params={
                            'q': ns_query,
                            'quotesCount': 10,
                            'newsCount': 0,
                            'enableFuzzyQuery': True,
                            'quotesQueryId': 'tss_match_phrase_query'
                        },
                        headers=headers,
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        for quote in data.get('quotes', []):
                            quote_type = quote.get('quoteType', '')
                            if quote_type in ['EQUITY', 'STOCK', 'ETF']:
                                all_results.append({
                                    'symbol': quote.get('symbol', ''),
                                    'name': quote.get('longname') or quote.get('shortname') or quote.get('symbol', ''),
                                    'exchange': quote.get('exchange', ''),
                                    'type': quote_type
                                })
                except Exception as e:
                    logger.error(f"Search strategy 2 (.NS) failed: {str(e)}")
            
            # Strategy 3: Try with .BO suffix for BSE stocks if still no results
            if len(all_results) == 0 and not query.endswith(('.NS', '.BO', '.BSE')):
                try:
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                    bo_query = f"{query}.BO"
                    response = requests.get(
                        'https://query2.finance.yahoo.com/v1/finance/search',
                        params={
                            'q': bo_query,
                            'quotesCount': 10,
                            'newsCount': 0,
                            'enableFuzzyQuery': True,
                            'quotesQueryId': 'tss_match_phrase_query'
                        },
                        headers=headers,
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        for quote in data.get('quotes', []):
                            quote_type = quote.get('quoteType', '')
                            if quote_type in ['EQUITY', 'STOCK', 'ETF']:
                                all_results.append({
                                    'symbol': quote.get('symbol', ''),
                                    'name': quote.get('longname') or quote.get('shortname') or quote.get('symbol', ''),
                                    'exchange': quote.get('exchange', ''),
                                    'type': quote_type
                                })
                except Exception as e:
                    logger.error(f"Search strategy 3 (.BO) failed: {str(e)}")
            
            # Strategy 4: Try direct ticker validation if user provided exact symbol
            if len(all_results) == 0:
                # Import here to avoid circular dependency
                from services.stock_price_service import fetch_stock_price
                
                # Try to validate if the query itself is a valid ticker
                for suffix in ['', '.NS', '.BO']:
                    try:
                        test_ticker = f"{query.upper()}{suffix}"
                        price_data = fetch_stock_price(test_ticker)
                        if price_data and price_data.get('current_price', 0) > 0:
                            all_results.append({
                                'symbol': test_ticker,
                                'name': test_ticker,
                                'exchange': 'NSE' if suffix == '.NS' else ('BSE' if suffix == '.BO' else 'Unknown'),
                                'type': 'EQUITY'
                            })
                            break
                    except Exception as e:
                        logger.error(f"Ticker validation failed for {test_ticker}: {str(e)}")
            
            # Remove duplicates based on symbol
            seen_symbols = set()
            unique_results = []
            for result in all_results:
                if result['symbol'] not in seen_symbols:
                    seen_symbols.add(result['symbol'])
                    unique_results.append(result)
            
            return unique_results[:10]
            
        except Exception as e:
            logger.error(f"Error searching stock: {str(e)}")
            return []
