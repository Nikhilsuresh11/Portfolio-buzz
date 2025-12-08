import sys
import os

# Add parent directory to path to import scraper
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import requests
from datetime import datetime
from functools import lru_cache
from config import get_config

config = get_config()


class PriceService:
    """Price fetching service using multiple data sources"""
    
    @staticmethod
    @lru_cache(maxsize=128)
    def get_stock_price(ticker, use_cache=True):
        """
        Fetch current stock price from multiple sources
        
        Args:
            ticker: Stock ticker symbol
            use_cache: Whether to use cached results
        
        Returns:
            dict: Price data or None
        """
        ticker = ticker.upper().strip()
        
        # Try Yahoo Finance first (Best for Indian stocks)
        price_data = PriceService._fetch_yahoo(ticker)
        if price_data:
            return price_data
            
        # Try Alpha Vantage second
        if config.ALPHA_VANTAGE_API_KEY:
            price_data = PriceService._fetch_alpha_vantage(ticker)
            if price_data:
                return price_data
        
        # Try Finnhub last
        if config.FINNHUB_KEY:
            price_data = PriceService._fetch_finnhub(ticker)
            if price_data:
                return price_data
        
        return None
    
    @staticmethod
    def _fetch_alpha_vantage(ticker):
        """Fetch from Alpha Vantage API"""
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                "function": "GLOBAL_QUOTE",
                "symbol": ticker,
                "apikey": config.ALPHA_VANTAGE_API_KEY
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if "Global Quote" in data and data["Global Quote"]:
                quote = data["Global Quote"]
                
                price = float(quote.get("05. price", 0))
                change = float(quote.get("09. change", 0))
                change_percent = float(quote.get("10. change percent", "0").rstrip('%'))
                volume = int(quote.get("06. volume", 0))
                open_price = float(quote.get("02. open", 0))
                high = float(quote.get("03. high", 0))
                low = float(quote.get("04. low", 0))
                prev_close = float(quote.get("08. previous close", 0))
                
                # Fix zero values
                if open_price == 0 and prev_close > 0:
                    open_price = prev_close
                if high == 0:
                    high = price
                if low == 0:
                    low = price
                
                return {
                    "ticker": ticker,
                    "price": price,
                    "change": change,
                    "change_percent": change_percent,
                    "volume": volume,
                    "open": open_price,
                    "high": high,
                    "low": low,
                    "prev_close": prev_close,
                    "currency": "USD",
                    "timestamp": datetime.now().isoformat(),
                    "source": "Alpha Vantage"
                }
        except Exception as e:
            print(f"Alpha Vantage error for {ticker}: {e}")
        return None
    
    @staticmethod
    def _fetch_finnhub(ticker):
        """Fetch from Finnhub API"""
        try:
            url = "https://finnhub.io/api/v1/quote"
            params = {
                "symbol": ticker,
                "token": config.FINNHUB_KEY
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data.get("c"):
                current = data["c"]
                previous = data.get("pc", current)
                change = current - previous
                change_percent = (change / previous * 100) if previous else 0
                open_price = data.get("o", 0)
                high = data.get("h", 0)
                low = data.get("l", 0)
                
                # Fix zero values
                if open_price == 0 and previous > 0:
                    open_price = previous
                if high == 0:
                    high = current
                if low == 0:
                    low = current
                
                return {
                    "ticker": ticker,
                    "price": current,
                    "change": change,
                    "change_percent": change_percent,
                    "volume": 0,
                    "open": open_price,
                    "high": high,
                    "low": low,
                    "prev_close": previous,
                    "currency": "USD",
                    "timestamp": datetime.now().isoformat(),
                    "source": "Finnhub"
                }
        except Exception as e:
            print(f"Finnhub error for {ticker}: {e}")
        return None
    
    @staticmethod
    def _fetch_yahoo(ticker):
        """Fetch from Yahoo Finance"""
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
            params = {
                "interval": "1d",
                "range": "1d"
            }
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            data = response.json()
            
            if "chart" in data and "result" in data["chart"]:
                result = data["chart"]["result"][0]
                meta = result.get("meta", {})
                
                current_price = meta.get("regularMarketPrice")
                previous_close = meta.get("chartPreviousClose")
                
                if current_price and previous_close:
                    change = current_price - previous_close
                    change_percent = (change / previous_close * 100)
                    open_price = meta.get("regularMarketOpen", 0)
                    high = meta.get("regularMarketDayHigh", 0)
                    low = meta.get("regularMarketDayLow", 0)
                    
                    # Fix zero values
                    if open_price == 0 and previous_close > 0:
                        open_price = previous_close
                    if high == 0:
                        high = current_price
                    if low == 0:
                        low = current_price
                    
                    return {
                        "ticker": ticker,
                        "price": current_price,
                        "change": change,
                        "change_percent": change_percent,
                        "volume": meta.get("regularMarketVolume", 0),
                        "open": open_price,
                        "high": high,
                        "low": low,
                        "prev_close": previous_close,
                        "currency": meta.get("currency", "USD"),
                        "timestamp": datetime.now().isoformat(),
                        "source": "Yahoo Finance"
                    }
        except Exception as e:
            print(f"Yahoo Finance error for {ticker}: {e}")
        return None
    
    @staticmethod
    def get_multiple_prices(tickers):
        """
        Get prices for multiple stocks
        
        Args:
            tickers: List of stock tickers
        
        Returns:
            dict: Dictionary mapping tickers to price data
        """
        prices = {}
        for ticker in tickers:
            price_data = PriceService.get_stock_price(ticker)
            if price_data:
                prices[ticker] = price_data
        
        return prices
