import streamlit as st
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from fuzzywuzzy import fuzz
import requests
from datetime import datetime, timedelta
import time
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from bs4 import BeautifulSoup
import re

load_dotenv()

# Configuration
MONGO_URI = os.getenv("MONGODB_URI")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
FINNHUB_KEY = os.getenv("FINNHUB_API_KEY")

DB_NAME = "portfolio_buzz"
MAPPINGS_COLLECTION = "stock_mappings"

# Page config
st.set_page_config(
    page_title="Stock Search & Prices",
    page_icon="📈",
    layout="wide"
)

# Custom CSS
st.markdown("""
    <style>
    .main { padding: 2rem; }
    
    .header-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        border-radius: 16px;
        margin-bottom: 2rem;
        text-align: center;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    
    .header-card h1 {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 800;
    }
    
    .search-container {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        margin-bottom: 2rem;
    }
    
    .result-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        border: 1px solid #eee;
        transition: all 0.3s ease;
        margin-bottom: 1.5rem;
    }
    
    .result-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        border-color: #667eea;
    }
    
    .ticker-badge {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 10px;
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    
    .company-name {
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 1rem;
    }
    
    .price-section {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 1.5rem;
        border-radius: 12px;
        margin: 1rem 0;
        text-align: center;
    }
    
    .price-main {
        font-size: 3rem;
        font-weight: 700;
        margin: 0.5rem 0;
    }
    
    .price-change {
        font-size: 1.3rem;
        font-weight: 600;
        margin-top: 0.5rem;
    }
    
    .price-positive { color: #22c55e; }
    .price-negative { color: #ef4444; }
    .price-neutral { color: #6b7280; }
    
    .exchange-badge {
        display: inline-block;
        background: #f3f4f6;
        padding: 0.25rem 0.75rem;
        border-radius: 6px;
        font-size: 0.85rem;
        color: #6b7280;
        margin-left: 0.5rem;
    }
    
    .stat-box {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 10px;
        text-align: center;
    }
    
    .stat-label {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.5rem;
    }
    
    .stat-value {
        font-size: 1.3rem;
        font-weight: 600;
        color: #1a1a1a;
    }
    
    .chart-container {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        margin-top: 1rem;
        border: 2px solid #667eea;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }
    
    .period-btn {
        display: inline-block;
        padding: 0.5rem 1rem;
        margin: 0.25rem;
        border-radius: 8px;
        background: #f3f4f6;
        color: #666;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .period-btn:hover {
        background: #667eea;
        color: white;
    }
    
    .no-results {
        text-align: center;
        padding: 3rem;
        color: #999;
        font-size: 1.1rem;
    }
    </style>
""", unsafe_allow_html=True)


# Initialize session state
if "show_chart" not in st.session_state:
    st.session_state.show_chart = {}
if "chart_period" not in st.session_state:
    st.session_state.chart_period = {}
if "show_fundamentals" not in st.session_state:
    st.session_state.show_fundamentals = {}


# Database Functions
@st.cache_resource
def get_db():
    """Connect to MongoDB"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        return db
    except Exception as e:
        st.error(f"❌ Database connection failed: {str(e)}")
        return None


def get_stock_mappings():
    """Get all stock mappings from MongoDB"""
    db = get_db()
    if db is None:
        return []
    
    mappings_col = db[MAPPINGS_COLLECTION]
    return list(mappings_col.find({}, {"_id": 0}))


@st.cache_data(ttl=3600)
def get_all_stocks_cached():
    """Cache stock mappings for 1 hour"""
    docs = get_stock_mappings()
    result = []
    for d in docs:
        name = d.get("official_name") or d.get("company_name") or d["ticker"]
        result.append({
            "ticker": d["ticker"],
            "name": name,
            "exchange": d.get("exchange", ""),
            "synonyms": d.get("synonyms", []),
            "data": d
        })
    return result


def local_fuzzy_search(query, limit=6):
    """Search stocks using fuzzy matching"""
    if not query or len(query) < 2:
        return []
    
    query_lower = query.lower().strip()
    stocks = get_all_stocks_cached()
    
    scored = []
    for s in stocks:
        score = max(
            fuzz.partial_ratio(query_lower, s["ticker"].lower()),
            fuzz.partial_ratio(query_lower, s["name"].lower()),
            max((fuzz.partial_ratio(query_lower, syn.lower()) 
                 for syn in s.get("synonyms", [])), default=0)
        )
        if score > 60:
            scored.append((score, s))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    return [s for _, s in scored[:limit]]


# Price Fetching Functions
@st.cache_data(ttl=300, show_spinner=False)
def fetch_stock_price(ticker):
    """Fetch current stock price"""
    ticker = ticker.upper().strip()
    
    if ALPHA_VANTAGE_KEY:
        price_data = _fetch_alpha_vantage(ticker)
        if price_data:
            return price_data
    
    if FINNHUB_KEY:
        price_data = _fetch_finnhub(ticker)
        if price_data:
            return price_data
    
    price_data = _fetch_yahoo(ticker)
    if price_data:
        return price_data
    
    return None


def _fetch_alpha_vantage(ticker):
    """Fetch from Alpha Vantage"""
    try:
        url = "https://www.alphavantage.co/query"
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": ticker,
            "apikey": ALPHA_VANTAGE_KEY
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
            
            # Fix: If open is 0, use previous close
            if open_price == 0 and prev_close > 0:
                open_price = prev_close
            
            # Fix: If high/low are 0, use current price
            if high == 0:
                high = price
            if low == 0:
                low = price
            
            return {
                "price": price,
                "change": change,
                "change_percent": change_percent,
                "volume": volume,
                "open": open_price,
                "high": high,
                "low": low,
                "prev_close": prev_close,
                "currency": "USD",
                "timestamp": datetime.now(),
                "source": "Alpha Vantage"
            }
    except Exception as e:
        print(f"Alpha Vantage error: {e}")
    return None


def _fetch_finnhub(ticker):
    """Fetch from Finnhub"""
    try:
        url = "https://finnhub.io/api/v1/quote"
        params = {
            "symbol": ticker,
            "token": FINNHUB_KEY
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
            
            # Fix: If open is 0, use previous close
            if open_price == 0 and previous > 0:
                open_price = previous
            
            # Fix: If high/low are 0, use current price
            if high == 0:
                high = current
            if low == 0:
                low = current
            
            return {
                "price": current,
                "change": change,
                "change_percent": change_percent,
                "volume": 0,
                "open": open_price,
                "high": high,
                "low": low,
                "prev_close": previous,
                "currency": "USD",
                "timestamp": datetime.now(),
                "source": "Finnhub"
            }
    except Exception as e:
        print(f"Finnhub error: {e}")
    return None


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
                
                # Fix: If open is 0, use previous close
                if open_price == 0 and previous_close > 0:
                    open_price = previous_close
                
                # Fix: If high/low are 0, use current price
                if high == 0:
                    high = current_price
                if low == 0:
                    low = current_price
                
                return {
                    "price": current_price,
                    "change": change,
                    "change_percent": change_percent,
                    "volume": meta.get("regularMarketVolume", 0),
                    "open": open_price,
                    "high": high,
                    "low": low,
                    "prev_close": previous_close,
                    "currency": meta.get("currency", "USD"),
                    "timestamp": datetime.now(),
                    "source": "Yahoo Finance"
                }
    except Exception as e:
        print(f"Yahoo Finance error: {e}")
    return None


# Fundamentals Functions
@st.cache_data(ttl=86400, show_spinner=False)  # Cache for 24 hours
def fetch_fundamentals(ticker):
    """Fetch company fundamentals with Screener.in priority for Indian stocks"""
    ticker = ticker.upper().strip()
    
    # Check if it's an Indian stock
    is_indian = ticker.endswith('.NS') or ticker.endswith('.BO') or ticker.endswith('.BSE')
    
    screener_data = None
    yahoo_data = None
    
    # For Indian stocks, try Screener.in first
    if is_indian:
        # Extract base ticker (remove .NS, .BO, .BSE)
        base_ticker = ticker.replace('.NS', '').replace('.BO', '').replace('.BSE', '')
        
        screener_data = _fetch_screener_in(base_ticker)
        
        # If Screener.in has data but missing some fields, supplement with Yahoo
        if screener_data:
            yahoo_data = _fetch_fundamentals_yahoo(ticker)
            if yahoo_data:
                # Fill in missing metrics from Yahoo
                for key in screener_data:
                    if screener_data[key] == "N/A" and yahoo_data.get(key, "N/A") != "N/A":
                        screener_data[key] = yahoo_data[key]
                
                # Keep Screener.in as primary source
                screener_data['source'] = "Screener.in + Yahoo Finance (Combined)"
            
            return screener_data
    
    # Try Alpha Vantage for US stocks or as fallback
    if ALPHA_VANTAGE_KEY:
        fundamentals = _fetch_fundamentals_alpha_vantage(ticker)
        if fundamentals:
            return fundamentals
    
    # Final fallback to Yahoo Finance
    fundamentals = _fetch_fundamentals_yahoo(ticker)
    return fundamentals


def _fetch_screener_in(ticker):
    """
    Scrape Screener.in for detailed Indian stock fundamentals
    Updated to match exact website structure (Nov 2024)
    """
    try:
        url = f"https://www.screener.in/company/{ticker}/"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        
        # Check if page exists
        if response.status_code == 404:
            print(f"404 Not Found for {ticker}")
            return None
        
        if response.status_code != 200:
            print(f"Status {response.status_code} for {ticker}")
            return None
        
        soup = BeautifulSoup(response.text, 'lxml')
        
        # Extract company name from title or h1
        company_name = ticker
        title = soup.find('title')
        if title:
            company_name = title.text.split('|')[0].strip()
        
        # Initialize data dictionary
        data = {}
        
        # NEW METHOD: Look for the top metrics box (the grid at the top)
        # This has: Market Cap, Current Price, High/Low, Stock P/E, Book Value, etc.
        
        # Find all list items with class pattern
        top_items = soup.find_all('li', class_='flex flex-space-between')
        
        for item in top_items:
            try:
                # Get name and value spans
                name_span = item.find('span', class_='name')
                value_span = item.find('span', class_='number')
                
                if name_span and value_span:
                    label = name_span.get_text(strip=True).lower()
                    value = value_span.get_text(strip=True)
                    
                    # Clean value - remove extra whitespace
                    value = ' '.join(value.split())
                    
                    # Map to our fields based on exact labels from screenshots
                    if 'market cap' in label:
                        data['market_cap'] = value
                    elif 'current price' in label:
                        data['current_price'] = value
                    elif 'high / low' in label or 'high/low' in label:
                        # Split "1,406 / 1,020" format
                        parts = value.split('/')
                        if len(parts) == 2:
                            data['52_week_high'] = parts[0].strip()
                            data['52_week_low'] = parts[1].strip()
                    elif 'stock p/e' in label or 'pe ratio' in label:
                        data['pe_ratio'] = value
                    elif 'book value' in label:
                        data['book_value'] = value.replace('₹', '').strip()
                    elif 'dividend yield' in label:
                        data['dividend_yield'] = value.replace('%', '').strip()
                    elif 'roce' in label and 'roe' not in label:
                        data['roce'] = value.replace('%', '').strip()
                    elif label == 'roe' or label == 'roe ':
                        data['roe'] = value.replace('%', '').strip()
                    elif 'face value' in label:
                        data['face_value'] = value.replace('₹', '').strip()
            except Exception as e:
                continue
        
        # Look for EPS in quarters table or P&L
        try:
            # Find the quarterly/annual section
            tables = soup.find_all('table', class_='data-table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all('td')
                    if cells and len(cells) >= 2:
                        label = cells[0].get_text(strip=True).lower()
                        
                        if 'eps in rs' in label or 'eps' in label:
                            # Get latest value (rightmost column)
                            latest_value = cells[-1].get_text(strip=True)
                            if latest_value and latest_value != '-':
                                data['eps'] = latest_value.replace('₹', '').replace(',', '').strip()
                        
                        elif 'sales growth' in label or 'sales %' in label:
                            latest_value = cells[-1].get_text(strip=True)
                            if latest_value and latest_value != '-':
                                data['sales_growth'] = latest_value
                        
                        elif 'profit growth' in label or 'net profit' in label:
                            # Calculate growth if we have values
                            if len(cells) >= 3:
                                try:
                                    latest = cells[-1].get_text(strip=True).replace(',', '')
                                    previous = cells[-2].get_text(strip=True).replace(',', '')
                                    if latest and previous and latest != '-' and previous != '-':
                                        latest_val = float(latest)
                                        prev_val = float(previous)
                                        if prev_val != 0:
                                            growth = ((latest_val - prev_val) / abs(prev_val)) * 100
                                            data['profit_growth'] = f"{growth:.1f}%"
                                except:
                                    pass
                        
                        elif 'opm %' in label or 'operating margin' in label:
                            latest_value = cells[-1].get_text(strip=True)
                            if latest_value and latest_value != '-':
                                data['operating_margin'] = latest_value
                        
                        elif 'npm %' in label or 'net profit margin' in label or 'profit margin' in label:
                            latest_value = cells[-1].get_text(strip=True)
                            if latest_value and latest_value != '-':
                                data['profit_margin'] = latest_value
                        
                        elif 'debt' in label and 'equity' in label:
                            latest_value = cells[-1].get_text(strip=True)
                            if latest_value and latest_value != '-':
                                data['debt_to_equity'] = latest_value
        except Exception as e:
            print(f"Error parsing tables: {e}")
        
        # Extract sector/industry from breadcrumb or meta
        sector = "N/A"
        industry = "N/A"
        
        breadcrumb = soup.find('p', class_='sub')
        if breadcrumb:
            text = breadcrumb.get_text(strip=True)
            parts = [p.strip() for p in text.split('/')]
            if len(parts) >= 1:
                sector = parts[0]
            if len(parts) >= 2:
                industry = parts[1]
        
        # Build fundamentals dictionary
        fundamentals = {
            "company_name": company_name,
            "sector": sector,
            "industry": industry,
            "market_cap": data.get('market_cap', 'N/A'),
            "current_price": data.get('current_price', 'N/A'),
            "pe_ratio": data.get('pe_ratio', 'N/A'),
            "peg_ratio": "N/A",
            "book_value": data.get('book_value', 'N/A'),
            "dividend_yield": data.get('dividend_yield', 'N/A'),
            "eps": data.get('eps', 'N/A'),
            "face_value": data.get('face_value', 'N/A'),
            "revenue": "N/A",
            "profit_margin": data.get('profit_margin', 'N/A'),
            "operating_margin": data.get('operating_margin', 'N/A'),
            "roe": data.get('roe', 'N/A'),
            "roa": "N/A",
            "roce": data.get('roce', 'N/A'),
            "debt_to_equity": data.get('debt_to_equity', 'N/A'),
            "current_ratio": "N/A",
            "beta": "N/A",
            "52_week_high": data.get('52_week_high', 'N/A'),
            "52_week_low": data.get('52_week_low', 'N/A'),
            "avg_volume": "N/A",
            "shares_outstanding": "N/A",
            "sales_growth": data.get('sales_growth', 'N/A'),
            "profit_growth": data.get('profit_growth', 'N/A'),
            "description": f"Financial data from Screener.in for {company_name}",
            "currency": "INR",
            "source": "Screener.in (Premium Indian Data)"
        }
        
        # Debug: Print what we found
        print(f"\n=== Scraped data for {ticker} ===")
        for key, value in fundamentals.items():
            if value != "N/A":
                print(f"{key}: {value}")
        
        return fundamentals
        
    except Exception as e:
        print(f"Screener.in error for {ticker}: {e}")
        import traceback
        traceback.print_exc()
        return None


def _fetch_fundamentals_alpha_vantage(ticker):
    """Fetch fundamentals from Alpha Vantage"""
    try:
        # Get company overview
        url = "https://www.alphavantage.co/query"
        params = {
            "function": "OVERVIEW",
            "symbol": ticker,
            "apikey": ALPHA_VANTAGE_KEY
        }
        
        response = requests.get(url, params=params, timeout=15)
        data = response.json()
        
        if data and "Symbol" in data:
            return {
                "company_name": data.get("Name", "N/A"),
                "sector": data.get("Sector", "N/A"),
                "industry": data.get("Industry", "N/A"),
                "market_cap": data.get("MarketCapitalization", "N/A"),
                "pe_ratio": data.get("PERatio", "N/A"),
                "peg_ratio": data.get("PEGRatio", "N/A"),
                "book_value": data.get("BookValue", "N/A"),
                "dividend_yield": data.get("DividendYield", "N/A"),
                "eps": data.get("EPS", "N/A"),
                "revenue": data.get("RevenueTTM", "N/A"),
                "profit_margin": data.get("ProfitMargin", "N/A"),
                "operating_margin": data.get("OperatingMarginTTM", "N/A"),
                "roe": data.get("ReturnOnEquityTTM", "N/A"),
                "roa": data.get("ReturnOnAssetsTTM", "N/A"),
                "debt_to_equity": data.get("DebtToEquity", "N/A"),
                "current_ratio": data.get("CurrentRatio", "N/A"),
                "beta": data.get("Beta", "N/A"),
                "52_week_high": data.get("52WeekHigh", "N/A"),
                "52_week_low": data.get("52WeekLow", "N/A"),
                "avg_volume": data.get("Volume", "N/A"),
                "shares_outstanding": data.get("SharesOutstanding", "N/A"),
                "description": data.get("Description", "N/A"),
                "source": "Alpha Vantage"
            }
    except Exception as e:
        print(f"Alpha Vantage fundamentals error: {e}")
    return None


def _fetch_fundamentals_yahoo(ticker):
    """Fetch fundamentals from Yahoo Finance"""
    try:
        # Yahoo Finance has limited free fundamental data
        # This is a simplified version
        url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}"
        params = {
            "modules": "summaryDetail,financialData,defaultKeyStatistics"
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=15)
        data = response.json()
        
        if "quoteSummary" in data and "result" in data["quoteSummary"]:
            result = data["quoteSummary"]["result"][0]
            
            summary = result.get("summaryDetail", {})
            financial = result.get("financialData", {})
            key_stats = result.get("defaultKeyStatistics", {})
            
            def get_value(obj, key):
                val = obj.get(key, {})
                if isinstance(val, dict):
                    return val.get("raw", "N/A")
                return val if val else "N/A"
            
            market_cap = get_value(summary, "marketCap")
            if market_cap != "N/A":
                market_cap = f"{market_cap / 1e9:.2f}B" if market_cap > 1e9 else f"{market_cap / 1e6:.2f}M"
            
            return {
                "company_name": ticker,
                "sector": "N/A",
                "industry": "N/A",
                "market_cap": market_cap,
                "pe_ratio": get_value(summary, "trailingPE"),
                "peg_ratio": get_value(key_stats, "pegRatio"),
                "book_value": get_value(key_stats, "bookValue"),
                "dividend_yield": get_value(summary, "dividendYield"),
                "eps": get_value(key_stats, "trailingEps"),
                "revenue": "N/A",
                "profit_margin": get_value(financial, "profitMargins"),
                "operating_margin": get_value(financial, "operatingMargins"),
                "roe": get_value(financial, "returnOnEquity"),
                "roa": get_value(financial, "returnOnAssets"),
                "debt_to_equity": get_value(financial, "debtToEquity"),
                "current_ratio": get_value(financial, "currentRatio"),
                "beta": get_value(summary, "beta"),
                "52_week_high": get_value(summary, "fiftyTwoWeekHigh"),
                "52_week_low": get_value(summary, "fiftyTwoWeekLow"),
                "avg_volume": get_value(summary, "averageVolume"),
                "shares_outstanding": "N/A",
                "description": "N/A",
                "source": "Yahoo Finance"
            }
    except Exception as e:
        print(f"Yahoo fundamentals error: {e}")
    return None


# Historical Data Functions
@st.cache_data(ttl=3600, show_spinner=False)
def fetch_historical_data(ticker, period="1M"):
    """Fetch historical price data"""
    ticker = ticker.upper().strip()
    
    # Try Alpha Vantage first (better data)
    if ALPHA_VANTAGE_KEY:
        hist_data = _fetch_historical_alpha_vantage(ticker, period)
        if hist_data is not None:
            return hist_data
    
    # Fallback to Yahoo Finance
    hist_data = _fetch_historical_yahoo(ticker, period)
    return hist_data


def _fetch_historical_alpha_vantage(ticker, period):
    """Fetch historical data from Alpha Vantage"""
    try:
        # Map period to Alpha Vantage function
        if period in ["1D", "5D"]:
            function = "TIME_SERIES_INTRADAY"
            interval = "15min"
            extra_params = {"interval": interval}
        else:
            function = "TIME_SERIES_DAILY"
            extra_params = {}
        
        url = "https://www.alphavantage.co/query"
        params = {
            "function": function,
            "symbol": ticker,
            "apikey": ALPHA_VANTAGE_KEY,
            "outputsize": "full"
        }
        params.update(extra_params)
        
        response = requests.get(url, params=params, timeout=15)
        data = response.json()
        
        # Extract time series
        time_series_key = None
        for key in data.keys():
            if "Time Series" in key:
                time_series_key = key
                break
        
        if not time_series_key:
            return None
        
        time_series = data[time_series_key]
        
        # Convert to DataFrame
        df = pd.DataFrame.from_dict(time_series, orient='index')
        df.index = pd.to_datetime(df.index)
        df = df.sort_index()
        
        # Rename columns
        df.columns = ['open', 'high', 'low', 'close', 'volume']
        df = df.astype(float)
        
        # Filter by period
        now = datetime.now()
        period_map = {
            "1D": now - timedelta(days=1),
            "5D": now - timedelta(days=5),
            "1M": now - timedelta(days=30),
            "3M": now - timedelta(days=90),
            "6M": now - timedelta(days=180),
            "1Y": now - timedelta(days=365),
            "5Y": now - timedelta(days=365*5)
        }
        
        start_date = period_map.get(period, now - timedelta(days=30))
        df = df[df.index >= start_date]
        
        return df
    
    except Exception as e:
        print(f"Alpha Vantage historical error: {e}")
        return None


def _fetch_historical_yahoo(ticker, period):
    """Fetch historical data from Yahoo Finance"""
    try:
        # Map period to Yahoo range
        period_map = {
            "1D": "1d",
            "5D": "5d",
            "1M": "1mo",
            "3M": "3mo",
            "6M": "6mo",
            "1Y": "1y",
            "5Y": "5y"
        }
        
        range_param = period_map.get(period, "1mo")
        
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        params = {
            "interval": "1d" if period not in ["1D", "5D"] else "15m",
            "range": range_param
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=15)
        data = response.json()
        
        if "chart" in data and "result" in data["chart"]:
            result = data["chart"]["result"][0]
            
            timestamps = result.get("timestamp", [])
            quotes = result.get("indicators", {}).get("quote", [{}])[0]
            
            if not timestamps:
                return None
            
            df = pd.DataFrame({
                "timestamp": pd.to_datetime(timestamps, unit='s'),
                "open": quotes.get("open", []),
                "high": quotes.get("high", []),
                "low": quotes.get("low", []),
                "close": quotes.get("close", []),
                "volume": quotes.get("volume", [])
            })
            
            df.set_index("timestamp", inplace=True)
            df = df.dropna()
            
            return df
    
    except Exception as e:
        print(f"Yahoo historical error: {e}")
        return None


def create_price_chart(df, ticker, period):
    """Create interactive Plotly chart"""
    if df is None or df.empty:
        return None
    
    # Create candlestick chart
    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.03,
        row_heights=[0.7, 0.3],
        subplot_titles=(f"{ticker} Price", "Volume")
    )
    
    # Candlestick chart
    fig.add_trace(
        go.Candlestick(
            x=df.index,
            open=df['open'],
            high=df['high'],
            low=df['low'],
            close=df['close'],
            name="Price",
            increasing_line_color='#22c55e',
            decreasing_line_color='#ef4444'
        ),
        row=1, col=1
    )
    
    # Add moving average (20-day)
    if len(df) >= 20:
        ma20 = df['close'].rolling(window=20).mean()
        fig.add_trace(
            go.Scatter(
                x=df.index,
                y=ma20,
                name="MA20",
                line=dict(color='#667eea', width=2)
            ),
            row=1, col=1
        )
    
    # Volume bars
    colors = ['#22c55e' if close >= open else '#ef4444' 
              for close, open in zip(df['close'], df['open'])]
    
    fig.add_trace(
        go.Bar(
            x=df.index,
            y=df['volume'],
            name="Volume",
            marker_color=colors,
            opacity=0.5
        ),
        row=2, col=1
    )
    
    # Update layout
    fig.update_layout(
        height=600,
        showlegend=True,
        xaxis_rangeslider_visible=False,
        hovermode='x unified',
        template='plotly_white',
        margin=dict(t=50, b=50, l=50, r=50),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        )
    )
    
    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='#f0f0f0')
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='#f0f0f0')
    
    return fig


# UI Components
def render_header():
    """Render app header"""
    st.markdown("""
        <div class="header-card">
            <h1>📈 Stock Search & Price Viewer</h1>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">
                Search stocks and view interactive price charts
            </p>
        </div>
    """, unsafe_allow_html=True)


def render_price_card(stock_info, price_data):
    """Render stock price card with chart button"""
    ticker = stock_info["ticker"]
    name = stock_info["name"]
    exchange = stock_info.get("exchange", "")
    
    st.markdown(f"""
        <div class="result-card">
            <div>
                <span class="ticker-badge">{ticker}</span>
                {f'<span class="exchange-badge">{exchange}</span>' if exchange else ''}
            </div>
            <div class="company-name">{name}</div>
    """, unsafe_allow_html=True)
    
    if price_data:
        price = price_data["price"]
        change = price_data["change"]
        change_percent = price_data["change_percent"]
        
        if change > 0:
            color_class = "price-positive"
            arrow = "▲"
        elif change < 0:
            color_class = "price-negative"
            arrow = "▼"
        else:
            color_class = "price-neutral"
            arrow = "─"
        
        st.markdown(f"""
            <div class="price-section">
                <div style="font-size: 0.9rem; color: #666;">Current Price</div>
                <div class="price-main">{price_data['currency']} {price:.2f}</div>
                <div class="price-change {color_class}">
                    {arrow} {abs(change):.2f} ({abs(change_percent):.2f}%)
                </div>
                <div style="font-size: 0.8rem; color: #999; margin-top: 1rem;">
                    Last updated: {price_data['timestamp'].strftime('%I:%M:%S %p')} • Source: {price_data['source']}
                </div>
            </div>
        """, unsafe_allow_html=True)
        
        # Stats row
        if price_data.get("high") and price_data.get("low"):
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-label">Open</div>
                        <div class="stat-value">{price_data.get('open', 0):.2f}</div>
                    </div>
                """, unsafe_allow_html=True)
            
            with col2:
                st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-label">High</div>
                        <div class="stat-value">{price_data.get('high', 0):.2f}</div>
                    </div>
                """, unsafe_allow_html=True)
            
            with col3:
                st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-label">Low</div>
                        <div class="stat-value">{price_data.get('low', 0):.2f}</div>
                    </div>
                """, unsafe_allow_html=True)
            
            with col4:
                volume = price_data.get('volume', 0)
                volume_str = f"{volume:,}" if volume else "N/A"
                st.markdown(f"""
                    <div class="stat-box">
                        <div class="stat-label">Volume</div>
                        <div class="stat-value" style="font-size: 1rem;">{volume_str}</div>
                    </div>
                """, unsafe_allow_html=True)
        
        # Chart button
        st.markdown("<br>", unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns([1, 1, 2])
        with col1:
            if st.button(f"📊 View Chart", key=f"chart_btn_{ticker}", use_container_width=True):
                if ticker not in st.session_state.show_chart:
                    st.session_state.show_chart[ticker] = False
                st.session_state.show_chart[ticker] = not st.session_state.show_chart.get(ticker, False)
                # Close fundamentals if open
                if st.session_state.show_chart[ticker]:
                    st.session_state.show_fundamentals[ticker] = False
                st.rerun()
        
        with col2:
            if st.button(f"📋 Fundamentals", key=f"fund_btn_{ticker}", use_container_width=True):
                if ticker not in st.session_state.show_fundamentals:
                    st.session_state.show_fundamentals[ticker] = False
                st.session_state.show_fundamentals[ticker] = not st.session_state.show_fundamentals.get(ticker, False)
                # Close chart if open
                if st.session_state.show_fundamentals[ticker]:
                    st.session_state.show_chart[ticker] = False
                st.rerun()
        
        # Show fundamentals if toggled
        if st.session_state.show_fundamentals.get(ticker, False):
            st.markdown('<div class="chart-container">', unsafe_allow_html=True)
            
            with st.spinner(f"Loading fundamentals for {ticker}..."):
                fundamentals = fetch_fundamentals(ticker)
                
                if fundamentals:
                    st.markdown(f"### 📊 {fundamentals.get('company_name', ticker)} - Company Overview")
                    
                    # Company Info Section
                    st.markdown("#### 🏢 Company Information")
                    info_col1, info_col2, info_col3 = st.columns(3)
                    
                    with info_col1:
                        st.markdown(f"""
                            <div class="stat-box">
                                <div class="stat-label">Sector</div>
                                <div class="stat-value" style="font-size: 1rem;">{fundamentals.get('sector', 'N/A')}</div>
                            </div>
                        """, unsafe_allow_html=True)
                    
                    with info_col2:
                        st.markdown(f"""
                            <div class="stat-box">
                                <div class="stat-label">Industry</div>
                                <div class="stat-value" style="font-size: 1rem;">{fundamentals.get('industry', 'N/A')}</div>
                            </div>
                        """, unsafe_allow_html=True)
                    
                    with info_col3:
                        market_cap = fundamentals.get('market_cap', 'N/A')
                        if market_cap != 'N/A' and isinstance(market_cap, (int, float)):
                            if market_cap > 1e9:
                                market_cap = f"${market_cap/1e9:.2f}B"
                            elif market_cap > 1e6:
                                market_cap = f"${market_cap/1e6:.2f}M"
                        st.markdown(f"""
                            <div class="stat-box">
                                <div class="stat-label">Market Cap</div>
                                <div class="stat-value" style="font-size: 1rem;">{market_cap}</div>
                            </div>
                        """, unsafe_allow_html=True)
                    
                    st.markdown("<br>", unsafe_allow_html=True)
                    
                    # Valuation Metrics
                    st.markdown("#### 💰 Valuation Metrics")
                    val_col1, val_col2, val_col3, val_col4 = st.columns(4)
                    
                    with val_col1:
                        pe = fundamentals.get('pe_ratio', 'N/A')
                        if pe != 'N/A':
                            try:
                                pe = f"{float(pe):.2f}"
                            except:
                                pass
                        st.metric("P/E Ratio", pe)
                    
                    with val_col2:
                        peg = fundamentals.get('peg_ratio', 'N/A')
                        if peg != 'N/A':
                            try:
                                peg = f"{float(peg):.2f}"
                            except:
                                pass
                        st.metric("PEG Ratio", peg)
                    
                    with val_col3:
                        book = fundamentals.get('book_value', 'N/A')
                        if book != 'N/A':
                            try:
                                book = f"${float(book):.2f}"
                            except:
                                pass
                        st.metric("Book Value", book)
                    
                    with val_col4:
                        div_yield = fundamentals.get('dividend_yield', 'N/A')
                        if div_yield != 'N/A':
                            try:
                                # Handle % sign
                                val = float(str(div_yield).replace('%', '').strip())
                                
                                # Fix unrealistic dividend yields
                                # Normal range: 0-10%, rarely >10%
                                if val > 20:  # Clearly wrong (e.g., 36%)
                                    val = val / 100  # Convert to decimal
                                elif val > 10:  # Suspicious but possible
                                    # Check if it's a decimal shown as percentage
                                    val = val / 100
                                
                                div_yield = f"{val:.2f}%"
                            except:
                                pass
                        st.metric("Dividend Yield", div_yield)
                    
                    st.markdown("<br>", unsafe_allow_html=True)
                    
                    # Profitability Metrics
                    st.markdown("#### 📈 Profitability Metrics")
                    prof_col1, prof_col2, prof_col3, prof_col4 = st.columns(4)
                    
                    with prof_col1:
                        eps = fundamentals.get('eps', 'N/A')
                        if eps != 'N/A':
                            try:
                                eps = f"₹{float(eps):.2f}" if fundamentals.get('currency') == 'INR' else f"${float(eps):.2f}"
                            except:
                                pass
                        st.metric("EPS", eps)
                    
                    with prof_col2:
                        # Show ROCE if available (Screener.in provides this)
                        roce = fundamentals.get('roce', 'N/A')
                        if roce != 'N/A':
                            try:
                                roce = f"{float(roce):.2f}%"
                            except:
                                pass
                            st.metric("ROCE", roce)
                        else:
                            profit_margin = fundamentals.get('profit_margin', 'N/A')
                            if profit_margin != 'N/A':
                                try:
                                    profit_margin = f"{float(profit_margin)*100:.2f}%"
                                except:
                                    pass
                            st.metric("Profit Margin", profit_margin)
                    
                    with prof_col3:
                        # Show Profit Growth if available (Screener.in)
                        profit_growth = fundamentals.get('profit_growth', 'N/A')
                        if profit_growth != 'N/A':
                            st.metric("Profit Growth", profit_growth)
                        else:
                            op_margin = fundamentals.get('operating_margin', 'N/A')
                            if op_margin != 'N/A':
                                try:
                                    op_margin = f"{float(op_margin)*100:.2f}%"
                                except:
                                    pass
                            st.metric("Operating Margin", op_margin)
                    
                    with prof_col4:
                        roe = fundamentals.get('roe', 'N/A')
                        if roe != 'N/A':
                            try:
                                # Handle if already has % sign
                                if '%' in str(roe):
                                    val = float(str(roe).replace('%', '').strip())
                                else:
                                    val = float(roe)
                                
                                # Fix unrealistic values
                                if val > 100:  # Likely wrong (e.g., 661%)
                                    val = val / 100  # Convert to ratio
                                elif val > 2 and val <= 10:  # Might be ratio (e.g., 6.61 means 661%)
                                    # Keep as is if reasonable percentage
                                    pass
                                elif val <= 2:  # Likely a ratio (e.g., 0.098 means 9.8%)
                                    val = val * 100
                                
                                # Ensure reasonable range for ROE (typically -50% to 50%)
                                if val > 100:
                                    val = val / 10  # Another level of correction
                                
                                roe = f"{val:.2f}%"
                            except:
                                pass
                        st.metric("ROE", roe)
                    
                    st.markdown("<br>", unsafe_allow_html=True)
                    
                    # Growth Metrics (if available from Screener.in)
                    if fundamentals.get('sales_growth') != 'N/A' or fundamentals.get('profit_growth') != 'N/A':
                        st.markdown("#### 🚀 Growth Metrics")
                        growth_col1, growth_col2, growth_col3, growth_col4 = st.columns(4)
                        
                        with growth_col1:
                            sales_growth = fundamentals.get('sales_growth', 'N/A')
                            st.metric("Sales Growth", sales_growth)
                        
                        with growth_col2:
                            profit_growth = fundamentals.get('profit_growth', 'N/A')
                            st.metric("Profit Growth", profit_growth)
                        
                        with growth_col3:
                            # Show face value for Indian stocks
                            face_value = fundamentals.get('face_value', 'N/A')
                            if face_value != 'N/A':
                                st.metric("Face Value", f"₹{face_value}")
                            else:
                                st.metric("Face Value", "N/A")
                        
                        with growth_col4:
                            # Placeholder for future metric
                            st.metric("Data Source", "Screener.in" if fundamentals.get('source', '').startswith('Screener') else "Standard")
                        
                        st.markdown("<br>", unsafe_allow_html=True)
                    
                    # Financial Health
                    st.markdown("#### 🏦 Financial Health")
                    health_col1, health_col2, health_col3, health_col4 = st.columns(4)
                    
                    with health_col1:
                        debt_equity = fundamentals.get('debt_to_equity', 'N/A')
                        if debt_equity != 'N/A':
                            try:
                                debt_equity = f"{float(debt_equity):.2f}"
                            except:
                                pass
                        st.metric("Debt/Equity", debt_equity)
                    
                    with health_col2:
                        current_ratio = fundamentals.get('current_ratio', 'N/A')
                        if current_ratio != 'N/A':
                            try:
                                current_ratio = f"{float(current_ratio):.2f}"
                            except:
                                pass
                        st.metric("Current Ratio", current_ratio)
                    
                    with health_col3:
                        beta = fundamentals.get('beta', 'N/A')
                        if beta != 'N/A':
                            try:
                                beta = f"{float(beta):.2f}"
                            except:
                                pass
                        st.metric("Beta", beta)
                    
                    with health_col4:
                        roa = fundamentals.get('roa', 'N/A')
                        if roa != 'N/A':
                            try:
                                roa = f"{float(roa)*100:.2f}%"
                            except:
                                pass
                        st.metric("ROA", roa)
                    
                    st.markdown("<br>", unsafe_allow_html=True)
                    
                    # Trading Stats
                    st.markdown("#### 📊 Trading Statistics")
                    trade_col1, trade_col2, trade_col3, trade_col4 = st.columns(4)
                    
                    with trade_col1:
                        week_high = fundamentals.get('52_week_high', 'N/A')
                        if week_high != 'N/A':
                            try:
                                week_high = f"${float(week_high):.2f}"
                            except:
                                pass
                        st.metric("52W High", week_high)
                    
                    with trade_col2:
                        week_low = fundamentals.get('52_week_low', 'N/A')
                        if week_low != 'N/A':
                            try:
                                week_low = f"${float(week_low):.2f}"
                            except:
                                pass
                        st.metric("52W Low", week_low)
                    
                    with trade_col3:
                        avg_vol = fundamentals.get('avg_volume', 'N/A')
                        if avg_vol != 'N/A':
                            try:
                                avg_vol = f"{int(float(avg_vol)):,}"
                            except:
                                pass
                        st.metric("Avg Volume", avg_vol)
                    
                    with trade_col4:
                        shares = fundamentals.get('shares_outstanding', 'N/A')
                        if shares != 'N/A':
                            try:
                                shares_num = float(shares)
                                if shares_num > 1e9:
                                    shares = f"{shares_num/1e9:.2f}B"
                                elif shares_num > 1e6:
                                    shares = f"{shares_num/1e6:.2f}M"
                            except:
                                pass
                        st.metric("Shares Out", shares)
                    
                    # Description
                    if fundamentals.get('description') and fundamentals['description'] != 'N/A':
                        st.markdown("<br>", unsafe_allow_html=True)
                        st.markdown("#### 📝 Company Description")
                        with st.expander("Read More"):
                            st.write(fundamentals['description'])
                    
                    st.markdown(f"""
                        <div style='text-align: right; color: #999; font-size: 0.8rem; margin-top: 1rem;'>
                            Data source: {fundamentals.get('source', 'N/A')} • Updated daily
                        </div>
                    """, unsafe_allow_html=True)
                
                else:
                    st.warning(f"Fundamental data not available for {ticker}")
                    
                    # Provide specific guidance based on exchange
                    exchange = stock_info.get("exchange", "").upper()
                    
                    if "NSE" in exchange or "BSE" in exchange:
                        st.info("""
                        **💡 Indian Stock Tips:**
                        - **BSE stocks**: Add `.BSE` or `.BO` suffix (e.g., `RELIANCE.BSE`)
                        - **NSE stocks**: Alpha Vantage has limited support. Try Yahoo Finance format with `.NS` suffix
                        - **Alternative**: Use Yahoo Finance which has better Indian market coverage
                        """)
                    else:
                        st.info("""
                        **💡 Availability Notes:**
                        - ✅ **US stocks** (NYSE, NASDAQ): Full fundamental data available
                        - ✅ **BSE stocks** (India): Available with `.BSE` or `.BO` suffix
                        - ⚠️ **NSE stocks** (India): Limited support - try `.NS` suffix
                        - ⚠️ **Other markets**: Data may be limited or unavailable
                        - 💡 **Tip**: Yahoo Finance fallback works for most global stocks
                        """)
            
            st.markdown('</div>', unsafe_allow_html=True)
        
        # Show chart if toggled
        if st.session_state.show_chart.get(ticker, False):
            st.markdown('<div class="chart-container">', unsafe_allow_html=True)
            
            # Period selector
            st.markdown("**Select Time Period:**")
            periods = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"]
            
            current_period = st.session_state.chart_period.get(ticker, "1M")
            
            period_cols = st.columns(len(periods))
            for idx, period in enumerate(periods):
                with period_cols[idx]:
                    if st.button(
                        period, 
                        key=f"period_{ticker}_{period}",
                        use_container_width=True,
                        type="primary" if period == current_period else "secondary"
                    ):
                        st.session_state.chart_period[ticker] = period
                        st.rerun()
            
            # Fetch and display chart
            with st.spinner(f"Loading {current_period} chart..."):
                df = fetch_historical_data(ticker, current_period)
                
                if df is not None and not df.empty:
                    fig = create_price_chart(df, ticker, current_period)
                    if fig:
                        st.plotly_chart(fig, use_container_width=True)
                        
                        # Chart stats
                        period_change = df['close'].iloc[-1] - df['close'].iloc[0]
                        period_change_pct = (period_change / df['close'].iloc[0]) * 100
                        period_high = df['high'].max()
                        period_low = df['low'].min()
                        
                        stat_col1, stat_col2, stat_col3, stat_col4 = st.columns(4)
                        
                        with stat_col1:
                            st.metric(
                                f"{current_period} Change",
                                f"{period_change:.2f}",
                                f"{period_change_pct:.2f}%"
                            )
                        with stat_col2:
                            st.metric(f"{current_period} High", f"{period_high:.2f}")
                        with stat_col3:
                            st.metric(f"{current_period} Low", f"{period_low:.2f}")
                        with stat_col4:
                            avg_volume = df['volume'].mean()
                            st.metric("Avg Volume", f"{avg_volume:,.0f}")
                    else:
                        st.warning("Could not generate chart")
                else:
                    st.warning(f"Historical data not available for {ticker}")
            
            st.markdown('</div>', unsafe_allow_html=True)
    
    else:
        st.markdown("""
            <div class="price-section">
                <div style="color: #999; font-size: 1.1rem;">
                    ⚠️ Price data unavailable
                </div>
                <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">
                    This stock may not be supported or markets are closed
                </div>
            </div>
        """, unsafe_allow_html=True)
    
    st.markdown("</div>", unsafe_allow_html=True)


# Main App
def main():
    render_header()
    
    # Search container
    st.markdown('<div class="search-container">', unsafe_allow_html=True)
    
    search_query = st.text_input(
        "Search for a stock",
        placeholder="Type company name or ticker (e.g., Apple, TSLA, Reliance)",
        key="stock_search",
        label_visibility="collapsed"
    )
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Search results
    if search_query and len(search_query) >= 2:
        with st.spinner("🔍 Searching stocks..."):
            results = local_fuzzy_search(search_query, limit=6)
        
        if results:
            st.markdown(f"### Found {len(results)} matching stocks")
            
            for stock_info in results:
                ticker = stock_info["ticker"]
                
                with st.spinner(f"Fetching price for {ticker}..."):
                    price_data = fetch_stock_price(ticker)
                
                render_price_card(stock_info, price_data)
        
        else:
            st.markdown("""
                <div class="no-results">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                    <div>No stocks found matching your search</div>
                    <div style="font-size: 0.9rem; color: #999; margin-top: 0.5rem;">
                        Try searching with different keywords or ticker symbols
                    </div>
                </div>
            """, unsafe_allow_html=True)
    
    elif not search_query:
        st.markdown("""
            <div class="no-results">
                <div style="font-size: 3rem; margin-bottom: 1rem;">👋</div>
                <div style="font-size: 1.3rem; color: #333;">Start typing to search stocks</div>
                <div style="font-size: 0.95rem; color: #666; margin-top: 1rem;">
                    Search by company name (Apple, Tesla) or ticker symbol (AAPL, TSLA)
                </div>
                <div style="font-size: 0.85rem; color: #999; margin-top: 2rem;">
                    💡 Tip: Click "View Chart" to see interactive price history
                </div>
            </div>
        """, unsafe_allow_html=True)
    
    # Footer
    st.markdown("---")
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("""
            <div style='text-align: center; color: #999; font-size: 0.85rem;'>
                <p>Prices updated every 5 minutes • Charts cached for 1 hour</p>
                <p style='font-size: 0.75rem;'>⚠️ Free tier APIs may have rate limits</p>
            </div>
        """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()