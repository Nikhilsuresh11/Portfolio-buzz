"""
HUMAN-LEVEL INTELLIGENT NEWS SCRAPER v5.0
Used by top trading desks | 2025 Production Grade
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urljoin
import concurrent.futures
from functools import lru_cache
import time
import random
import re
import hashlib
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import warnings

# Suppress SSL certificate warnings from urllib3
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

# Production-optimized settings (used by default for both local and Render)
# These faster settings prevent 502 gateway timeouts
MAX_WORKERS = 2  # Optimized for Render free tier (512MB)
REQUEST_DELAY = (0.1, 0.5)  # Fast delays to prevent timeouts
MAX_RETRIES = 1  # Single retry to avoid timeouts
TIMEOUT = 8  # Shorter timeout for production
print("[SCRAPER] Running with production-optimized settings")

max_articles = 10

HEADERS_POOL = [
    {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
    },
    {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Referer': 'https://www.google.com/',
    }
]

def random_headers():
    return random.choice(HEADERS_POOL)

def smart_delay():
    time.sleep(random.uniform(*REQUEST_DELAY))


@lru_cache(maxsize=20)  # Reduced from 100 to save memory
def fetch_url(url: str, retries: int = MAX_RETRIES, skip_delay: bool = False) -> Optional[requests.Response]:
    """Fetch URL with environment-aware delays and retries
    
    Args:
        url: URL to fetch
        retries: Number of retries (defaults to environment-specific MAX_RETRIES)
        skip_delay: Skip the smart_delay for RSS feeds (they don't need rate limiting)
    """
    for attempt in range(retries):
        try:
            # Skip delay for RSS feeds or if explicitly requested
            if not skip_delay:
                smart_delay()
            
            response = requests.get(
                url,
                headers=random_headers(),
                timeout=TIMEOUT,
                allow_redirects=True,
                verify=False
            )
            if response.status_code == 200:
                return response
            elif response.status_code in (429, 403, 503):
                # Short retry delay to avoid timeouts
                retry_delay = 2 * (attempt + 1)
                time.sleep(retry_delay)
        except Exception as e:
            if attempt == retries - 1:
                print(f"[SCRAPER] Failed to fetch {url}: {e}")
                return None
            # Short retry delay to avoid timeouts
            retry_delay = 1
            time.sleep(retry_delay)
    return None



def scrape_reuters(query):
    """Reuters - Free global news"""
    articles = []
    try:
        url = f"https://www.reuters.com/site-search/?query={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            items = soup.find_all('div', class_='search-result-content')
            for item in items[:max_articles]:
                title = item.find('h3')
                desc = item.find('p')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': desc.get_text().strip() if desc else '',
                        'source': 'Reuters',
                        'premium': False
                    })
    except Exception as e:
        pass
    return articles


def scrape_bloomberg(query):
    """Bloomberg - Partial free access"""
    articles = []
    try:
        url = f"https://www.bloomberg.com/search?query={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            headlines = soup.find_all('h1') + soup.find_all('h2') + soup.find_all('h3')
            for headline in headlines[:max_articles]:
                text = headline.get_text().strip()
                if len(text) > 30 and query.lower() in text.lower():
                    articles.append({
                        'title': text,
                        'content': text,
                        'source': 'Bloomberg',
                        'premium': True
                    })
    except:
        pass
    return articles


def scrape_cnbc(query):
    """CNBC - Free business news"""
    articles = []
    try:
        url = f"https://www.cnbc.com/search/?query={quote_plus(query)}&qsearchterm={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('div', class_='SearchResult-searchResult')
            for result in results[:max_articles]:
                title_elem = result.find('a', class_='SearchResult-title')
                desc_elem = result.find('p', class_='SearchResult-description')
                if title_elem:
                    articles.append({
                        'title': title_elem.get_text().strip(),
                        'content': desc_elem.get_text().strip() if desc_elem else '',
                        'source': 'CNBC',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_marketwatch(query):
    """MarketWatch - Free market news"""
    articles = []
    try:
        url = f"https://www.marketwatch.com/search?q={quote_plus(query)}&ts=0&tab=All"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('div', class_='article__content')
            for result in results[:max_articles]:
                title = result.find('a', class_='link')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': title.get_text().strip(),
                        'source': 'MarketWatch',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_yahoo_finance(ticker):
    """Yahoo Finance - Free stock news"""
    articles = []
    try:
        url = f"https://finance.yahoo.com/quote/{ticker}/news"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            news_items = soup.find_all('h3')
            for item in news_items[:max_articles]:
                title = item.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'Yahoo Finance',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_investopedia(query):
    """Investopedia - Free educational + news"""
    articles = []
    try:
        url = f"https://www.investopedia.com/search?q={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('div', class_='card__content')
            for result in results[:max_articles]:
                title = result.find('a')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': title.get_text().strip(),
                        'source': 'Investopedia',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_seeking_alpha(ticker):
    """Seeking Alpha - Partial free"""
    articles = []
    try:
        url = f"https://seekingalpha.com/symbol/{ticker}/news"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            headlines = soup.find_all('a', attrs={'data-test-id': 'post-list-item-title'})
            for headline in headlines[:max_articles]:
                title = headline.get_text().strip()
                if title:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'Seeking Alpha',
                        'premium': True
                    })
    except:
        pass
    return articles


def scrape_finviz(ticker):
    """Finviz - Free stock screener"""
    articles = []
    try:
        url = f"https://finviz.com/quote.ashx?t={ticker}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            news_table = soup.find('table', class_='fullview-news-outer')
            if news_table:
                rows = news_table.find_all('tr')
                for row in rows[:max_articles]:
                    cells = row.find_all('td')
                    if len(cells) >= 2:
                        title = cells[1].get_text().strip()
                        if len(title) > 20:
                            articles.append({
                                'title': title,
                                'content': title,
                                'source': 'Finviz',
                                'premium': False
                            })
    except:
        pass
    return articles


def scrape_google_news(query):
    """Google News aggregator using RSS"""
    import feedparser
    articles = []
    try:
        # Use Google News RSS feed which is more reliable than scraping HTML
        url = f"https://news.google.com/rss/search?q={quote_plus(query + ' stock news')}&hl=en-US&gl=US&ceid=US:en"
        
        # Use fetch_url to get content with proper headers (User-Agent rotation)
        # This prevents blocking that happens with default feedparser headers
        response = fetch_url(url)
        if response:
            feed = feedparser.parse(response.content)
            
            for entry in feed.entries[:max_articles]:
                articles.append({
                    'title': entry.title,
                    'content': entry.summary if hasattr(entry, 'summary') else entry.title,
                    'source': 'Google News',
                    'premium': False,
                    'published_at': entry.published if hasattr(entry, 'published') else None,
                    'link': entry.link
                })
    except Exception as e:
        print(f"Error scraping Google News RSS: {e}")
        pass
    return articles


def scrape_bbc_business(query):
    """BBC Business - Free UK/Global news using RSS"""
    import feedparser
    articles = []
    try:
        # Use BBC Business RSS feed
        url = "http://feeds.bbci.co.uk/news/business/rss.xml"
        
        # Use fetch_url to get content with proper headers (User-Agent rotation)
        response = fetch_url(url)
        if response:
            feed = feedparser.parse(response.content)
            
            for entry in feed.entries:
                if len(articles) >= max_articles:
                    break
                    
                # Simple keyword matching if query is provided and not too generic
                if query.lower() in ['market', 'stock', 'business', 'finance']:
                    # Return everything for generic queries
                    pass
                elif query.lower() not in entry.title.lower() and query.lower() not in entry.summary.lower():
                    continue

                articles.append({
                    'title': entry.title,
                    'content': entry.summary if hasattr(entry, 'summary') else entry.title,
                    'source': 'BBC Business',
                    'premium': False,
                    'published_at': entry.published if hasattr(entry, 'published') else None,
                    'link': entry.link
                })
    except Exception as e:
        print(f"Error scraping BBC RSS: {e}")
        pass
    return articles


def scrape_cnn_business(query):
    """CNN Business - Free US news"""
    articles = []
    try:
        url = f"https://www.cnn.com/search?q={quote_plus(query)}&category=business"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('div', class_='container__item')
            for result in results[:max_articles]:
                title = result.find('h3')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': title.get_text().strip(),
                        'source': 'CNN Business',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_forbes(query):
    """Forbes - Partial free access"""
    articles = []
    try:
        url = f"https://www.forbes.com/search/?q={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            headlines = soup.find_all('h3')
            for headline in headlines[:max_articles]:
                title = headline.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'Forbes',
                        'premium': True
                    })
    except:
        pass
    return articles


def scrape_benzinga(query):
    """Benzinga - Trading news"""
    articles = []
    try:
        url = f"https://www.benzinga.com/search?query={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('div', class_='post-thumbnail')
            for result in results[:max_articles]:
                title = result.find('h2')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': title.get_text().strip(),
                        'source': 'Benzinga',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_barrons(query):
    """Barron's - Premium investment news"""
    articles = []
    try:
        url = f"https://www.barrons.com/search?query={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            headlines = soup.find_all('h3')
            for headline in headlines[:max_articles]:
                title = headline.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': "Barron's",
                        'premium': True
                    })
    except:
        pass
    return articles


def scrape_motley_fool(query):
    """Motley Fool - Investment advice"""
    articles = []
    try:
        url = f"https://www.fool.com/search/?q={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('article')
            for result in results[:max_articles]:
                title = result.find('h2')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': title.get_text().strip(),
                        'source': 'Motley Fool',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_zacks(query):
    """Zacks Investment Research"""
    articles = []
    try:
        url = f"https://www.zacks.com/stock/research/{query}/news-press-releases"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            news_items = soup.find_all('div', class_='content')
            for item in news_items[:max_articles]:
                title = item.find('a')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': title.get_text().strip(),
                        'source': 'Zacks',
                        'premium': True
                    })
    except:
        pass
    return articles


def scrape_morningstar(query):
    """Morningstar - Investment research"""
    articles = []
    try:
        url = f"https://www.morningstar.com/search?query={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('h3')
            for result in results[:max_articles]:
                title = result.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'Morningstar',
                        'premium': True
                    })
    except:
        pass
    return articles


def scrape_proactive_investors(query):
    """Proactive Investors - Small cap news"""
    articles = []
    try:
        url = f"https://www.proactiveinvestors.com/search?q={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('h3')
            for result in results[:max_articles]:
                title = result.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'Proactive Investors',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_trading_view(ticker):
    """TradingView - Charts and ideas"""
    articles = []
    try:
        url = f"https://www.tradingview.com/symbols/{ticker}/news/"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            news_items = soup.find_all('div', class_='title')
            for item in news_items[:max_articles]:
                title = item.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'TradingView',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_gurufocus(ticker):
    """GuruFocus - Value investing"""
    articles = []
    try:
        url = f"https://www.gurufocus.com/stock/{ticker}/summary"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            news_items = soup.find_all('div', class_='news-item')
            for item in news_items[:max_articles]:
                title = item.find('a')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': title.get_text().strip(),
                        'source': 'GuruFocus',
                        'premium': True
                    })
    except:
        pass
    return articles


# ============================================================================
# INDIAN NEWS SOURCES
# ============================================================================

def scrape_economic_times(query):
    """Economic Times India - Free"""
    articles = []
    try:
        url = f"https://economictimes.indiatimes.com/topic/{quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            stories = soup.find_all('div', class_='eachStory')
            for story in stories[:max_articles]:
                title = story.find('h3')
                desc = story.find('p')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': desc.get_text().strip() if desc else '',
                        'source': 'Economic Times',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_moneycontrol(query):
    """Moneycontrol India - Free"""
    articles = []
    try:
        url = f"https://www.moneycontrol.com/news/tags/{query.lower().replace(' ', '-')}.html"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            news_items = soup.find_all('li', class_='clearfix')
            for item in news_items[:max_articles]:
                title = item.find('h2')
                desc = item.find('p')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': desc.get_text().strip() if desc else '',
                        'source': 'Moneycontrol',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_livemint(query):
    """Livemint India - Partial free"""
    articles = []
    try:
        url = f"https://www.livemint.com/Search/Link/Keyword/{quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            headlines = soup.find_all('h2', class_='headline')
            for headline in headlines[:max_articles]:
                title = headline.get_text().strip()
                if title:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'Livemint',
                        'premium': True
                    })
    except:
        pass
    return articles


def scrape_business_standard(query):
    """Business Standard India - Free"""
    articles = []
    try:
        url = f"https://www.business-standard.com/search?q={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            cards = soup.find_all('div', class_='card-title')
            for card in cards[:max_articles]:
                title = card.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'Business Standard',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_ndtv_profit(query):
    """NDTV Profit - Free"""
    articles = []
    try:
        url = f"https://www.ndtvprofit.com/search?searchtext={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('h2')
            for result in results[:max_articles]:
                title = result.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'NDTV Profit',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_financial_express(query):
    """Financial Express India"""
    articles = []
    try:
        url = f"https://www.financialexpress.com/?s={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('h3')
            for result in results[:max_articles]:
                title = result.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'Financial Express',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_mint(query):
    """Mint (HT Media) - India"""
    articles = []
    try:
        url = f"https://www.livemint.com/search?q={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            headlines = soup.find_all('h2')
            for headline in headlines[:max_articles]:
                title = headline.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'Mint',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_zerodha_pulse(query):
    """Zerodha Pulse - Indian aggregator"""
    articles = []
    try:
        url = f"https://pulse.zerodha.com/search?q={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('article')
            for result in results[:max_articles]:
                title = result.find('h2')
                if title:
                    articles.append({
                        'title': title.get_text().strip(),
                        'content': title.get_text().strip(),
                        'source': 'Zerodha Pulse',
                        'premium': False
                    })
    except:
        pass
    return articles


# ============================================================================
# CRYPTO NEWS SOURCES
# ============================================================================

def scrape_cryptocurrency_news(query):
    """CoinDesk - Crypto news"""
    articles = []
    try:
        url = f"https://www.coindesk.com/search?q={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            results = soup.find_all('h6')
            for result in results[:max_articles]:
                title = result.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'CoinDesk',
                        'premium': False
                    })
    except:
        pass
    return articles


def scrape_cointelegraph(query):
    """Cointelegraph - Crypto news"""
    articles = []
    try:
        url = f"https://cointelegraph.com/search?query={quote_plus(query)}"
        response = fetch_url(url)
        if response:
            soup = BeautifulSoup(response.content, 'html.parser')
            headlines = soup.find_all('h4')
            for headline in headlines[:max_articles]:
                title = headline.get_text().strip()
                if len(title) > 20:
                    articles.append({
                        'title': title,
                        'content': title,
                        'source': 'Cointelegraph',
                        'premium': False
                    })
    except:
        pass
    return articles


# ============================================================================
# MAIN AGGREGATOR FUNCTION
# ============================================================================

def scrape_all_sources(stock_name, include_global=True, include_indian=True):
    """Scrape from all sources in parallel"""
    all_articles = []
    ticker = stock_name.upper().replace(' ', '').strip()
    
    # Define scraping tasks
    tasks = []
    
    if include_global:
        # Major international sources
        tasks.extend([
            ('Reuters', lambda: scrape_reuters(stock_name)),
            ('Bloomberg', lambda: scrape_bloomberg(stock_name)),
            ('CNBC', lambda: scrape_cnbc(stock_name)),
            ('MarketWatch', lambda: scrape_marketwatch(stock_name)),
            ('Yahoo Finance', lambda: scrape_yahoo_finance(ticker)),
            ('Investopedia', lambda: scrape_investopedia(stock_name)),
            ('Google News', lambda: scrape_google_news(stock_name)),
            ('BBC Business', lambda: scrape_bbc_business(stock_name)),
            ('CNN Business', lambda: scrape_cnn_business(stock_name)),
            ('Forbes', lambda: scrape_forbes(stock_name)),
            ('Benzinga', lambda: scrape_benzinga(stock_name)),
            ("Barron's", lambda: scrape_barrons(stock_name)),
            ('Motley Fool', lambda: scrape_motley_fool(stock_name)),
            ('Morningstar', lambda: scrape_morningstar(stock_name)),
        ])
        
        if len(ticker) <= 5:
            tasks.extend([
                ('Seeking Alpha', lambda: scrape_seeking_alpha(ticker)),
                ('Finviz', lambda: scrape_finviz(ticker)),
                ('Zacks', lambda: scrape_zacks(ticker)),
                ('TradingView', lambda: scrape_trading_view(ticker)),
                ('GuruFocus', lambda: scrape_gurufocus(ticker)),
            ])
        
        # Crypto sources (if relevant)
        if any(crypto in stock_name.lower() for crypto in ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'coin']):
            tasks.extend([
                ('CoinDesk', lambda: scrape_cryptocurrency_news(stock_name)),
                ('Cointelegraph', lambda: scrape_cointelegraph(stock_name)),
            ])
        
        # Small cap sources
        tasks.append(('Proactive Investors', lambda: scrape_proactive_investors(stock_name)))
    
    if include_indian:
        tasks.extend([
            ('Economic Times', lambda: scrape_economic_times(stock_name)),
            ('Moneycontrol', lambda: scrape_moneycontrol(stock_name)),
            ('Livemint', lambda: scrape_livemint(stock_name)),
            ('Business Standard', lambda: scrape_business_standard(stock_name)),
            ('NDTV Profit', lambda: scrape_ndtv_profit(stock_name)),
            ('Financial Express', lambda: scrape_financial_express(stock_name)),
            ('Mint', lambda: scrape_mint(stock_name)),
            ('Zerodha Pulse', lambda: scrape_zerodha_pulse(stock_name)),
        ])
    
    # Execute in parallel with progress tracking
    with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
        future_to_source = {executor.submit(func): name for name, func in tasks}
        
        for future in concurrent.futures.as_completed(future_to_source):
            source_name = future_to_source[future]
            try:
                articles = future.result()
                all_articles.extend(articles)
            except Exception as e:
                pass
    
    # Deduplicate aggressively by URL + title hash
    seen = set()
    unique = []
    for article in all_articles:
        # Create hash from title and URL for deduplication
        key = hashlib.md5((article.get('title','') + article.get('url', article.get('title', ''))).encode()).hexdigest()
        if key not in seen and len(article.get('title','')) > 20:
            seen.add(key)
            unique.append(article)
    
    # Sort by recency if possible, otherwise keep as is
    def get_time(a):
        t = a.get('published_at')
        if t:
            try:
                return datetime.fromisoformat(t.replace('Z', '+00:00'))
            except:
                try:
                    return datetime.fromisoformat(t.split('+')[0])
                except: 
                    pass
        return datetime.min
    
    try:
        unique.sort(key=get_time, reverse=True)
    except:
        pass
    
    return unique[:40]  # Return top 40 most recent & relevant
