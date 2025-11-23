import streamlit as st
from pymongo import MongoClient
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import sys
from difflib import SequenceMatcher
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from functools import lru_cache
import re
from groq import Groq
from news_engine import fetch_multiple_stocks_parallel
from fuzzywuzzy import fuzz
from st_keyup import st_keyup
import time
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scraper import scrape_all_sources

# === FIX: Initialize session_state keys safely ===
if "stock_search_query" not in st.session_state:
    st.session_state.stock_search_query = ""
if "watchlist_cache" not in st.session_state:
    st.session_state.watchlist_cache = {}
if "newly_added" not in st.session_state:
    st.session_state.newly_added = []
if "search_open" not in st.session_state:
    st.session_state.search_open = False
if "search_key" not in st.session_state:
    st.session_state.search_key = 0
if "clear_search" not in st.session_state:
    st.session_state.clear_search = False

# Add this function anywhere near the top (after imports, before any st. code)
@st.cache_data(ttl=3600)
def get_all_stocks_cached():
    docs = get_stock_mappings()
    result = []
    for d in docs:
        name = d.get("official_name") or d.get("company_name") or d["ticker"]
        result.append({
            "ticker": d["ticker"],
            "name": name,
            "exchange": d.get("exchange", ""),
        })
    return result

def local_fuzzy_search(query, limit=6):
    if not query or len(query) < 2:
        return []
    query_lower = query.lower().strip()
    stocks = get_all_stocks_cached()
    
    scored = []
    for s in stocks:
        score = max(
            fuzz.partial_ratio(query_lower, s["ticker"].lower()),
            fuzz.partial_ratio(query_lower, s["name"].lower()),
            max((fuzz.partial_ratio(query_lower, syn) for syn in s["synonyms"]), default=0)
        )
        if score > 75:
            scored.append((score, s))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    return [s for _, s in scored[:limit]]

# Add parent directory to path to import scraper


# Check if user is authenticated
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.switch_page("login.py")

load_dotenv()

# MongoDB connection
MONGO_URI = st.secrets.get("MONGODB_URI", os.getenv("MONGODB_URI"))
DB_NAME = "portfolio_buzz"
WATCHLIST_COLLECTION = "watchlists"
MAPPINGS_COLLECTION = "stock_mappings"

# Performance settings
MAX_WORKERS = 5  # Parallel threads for news fetching
CACHE_DURATION = 3600  # Cache for 1 hour
SEARCH_CACHE_SIZE = 128  # LRU cache size for search results

# Page configuration
st.set_page_config(
    page_title="Stock Watchlist - Portfolio Buzz",
    page_icon="💸",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide sidebar completely
st.markdown("""
    <style>
    [data-testid="stSidebarNav"] { display: none; }
    [data-testid="stSidebar"] { display: none; }
    </style>
""", unsafe_allow_html=True)

# Custom CSS with improved layout
st.markdown("""
    <style>
    .main > div { padding: 2rem; }
    [data-testid="stSidebar"], #MainMenu, footer, header { visibility: hidden !important; }

    /* Gradient Header Card */
    .header-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2.5rem;
        border-radius: 16px;
        margin-bottom: 2rem;
        text-align: center;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    .header-card h1 { margin: 0; font-size: 2.6rem; font-weight: 800; }
    .header-card p { margin: 0.8rem 0 0; opacity: 0.95; font-size: 1.15rem; }
    .search-container {
        background: white;
        padding: 1.8rem;
        border-radius: 14px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        margin-bottom: 2.5rem;
    }

    /* Uniform Responsive Grid */
    .watchlist-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 1.8rem;
        margin-top: 1rem;
    }
    .watchlist-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-top: 1rem;
    }
    @media (max-width: 1200px) {
        .watchlist-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (max-width: 768px) {
        .watchlist-grid {
            grid-template-columns: 1fr;
        }
    }

    .watchlist-tile {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        height: 100%;
        box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        border: 1px solid #eee;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
    }
    .watchlist-tile:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 40px rgba(0,0,0,0.16);
        border-color: #667eea;
    }
    .tile-header { font-size: 1.7rem; font-weight: 700; margin-bottom: 0.4rem; color: #1a1a1a; }
    .tile-company { color: #666; font-size: 1rem; margin-bottom: 1.2rem; }
    .key-insights {
        background: #f8f9ff;
        border-left: 5px solid #667eea;
        padding: 1.1rem;
        border-radius: 10px;
        margin: 1rem 0;
        flex-grow: 1;
        font-size: 0.95rem;
        line-height: 1.7;
        white-space: pre-wrap;   /* This ensures bullets wrap correctly */
    }
    .tile-actions {
        margin-top: 1.5rem;
        display: flex;
        gap: 1rem;
    }
    .tile-sentiment {
        font-size: 1.1em;
        margin-bottom: 1rem;
        font-weight: 600;
    }
    .stock-info {
        text-align: left;
        padding: 1.5rem;
        background-color: #f8f9fa;
        border-radius: 10px;
        margin-bottom: 1rem;
        border-left: 4px solid #667eea;
    }
    .sentiment-positive {
        color: #4CAF50;
        font-weight: bold;
    }
    .sentiment-negative {
        color: #f44336;
        font-weight: bold;
    }
    .sentiment-neutral {
        color: #ff9800;
        font-weight: bold;
    }
    .suggested-tile {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        padding: 1.5rem;
        border-radius: 12px;
        color: white;
        text-align: center;
        cursor: pointer;
        transition: transform 0.2s;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.1em;
    }
    .suggested-tile:hover {
        transform: scale(1.05);
    }
    .empty-state {
        text-align: center;
        padding: 3rem;
        color: #666;
    }
    .stButton>button {
        background: linear-gradient(135deg, #5b70d9 0%, #4860c4 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(91, 112, 217, 0.2);
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        background: linear-gradient(135deg, #4860c4 0%, #3d52ad 100%);
        box-shadow: 0 4px 12px rgba(91, 112, 217, 0.3);
        transform: translateY(-2px);
    }
    .tile-button {
        font-size: 0.75em;
        padding: 0.4rem 0.8rem;
        height: auto;
        min-height: 32px;
    }
    .analyze-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        font-size: 0.8em !important;
    }
    .remove-btn {
        background-color: #f44336 !important;
        font-size: 0.8em !important;
    }
    .key-insights {
        background-color: #f8f9ff;
        border-left: 3px solid #667eea;
        padding: 0.75rem;
        border-radius: 6px;
        margin: 0.75rem 0;
        font-size: 0.85em;
        line-height: 1.4;
    }
    .insight-item {
        margin: 0.4rem 0;
        display: flex;
        align-items: flex-start;
    }
    .insight-bullet {
        color: #667eea;
        font-weight: bold;
        margin-right: 0.5rem;
        min-width: 1em;
    }
    .news-bullet {
        padding: 0.5rem 0;
        font-size: 0.9em;
    }
    .header-section {
        background-color: #f8f9fa;
        padding: 2rem;
        border-radius: 12px;
        color: #1a1a1a;
        margin-bottom: 2rem;
        text-align: left;
        border-left: 4px solid #5b70d9;
    }
    
    .header-section h1 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 700;
        color: #1a1a1a;
    }
    
    .header-section p {
        margin: 0.5rem 0 0 0;
        color: #666;
        font-size: 0.95rem;
    }
    .remove-btn {
        background-color: #f44336 !important;
        font-size: 0.8em;
    }
    .floating-search-container {
        position: fixed;
        top: 70px;
        right: 20px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .search-icon-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }
    .search-dropdown {
        position: absolute;
        top: 60px;
        right: 0;
        width: 350px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        padding: 12px;
        max-height: 400px;
        overflow-y: auto;
    }
    .search-result-item {
        padding: 12px 16px;
        margin: 4px 0;
        background: #f8f9fa;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
    }
    .search-result-item:hover {
        background: #e8f0fe;
        border-color: #667eea;
    }
    .ticker-highlight {
        font-weight: 700;
        color: #667eea;
    }
    .suggestions-box {
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 8px;
        max-height: 300px;
        overflow-y: auto;
        position: absolute;
        width: 100%;
        z-index: 1000;
    }
    .suggestion-item {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .suggestion-item:hover {
        background-color: #efefef;
    }
    .suggestion-item-main {
        font-weight: bold;
        color: #333;
    }
    .suggestion-item-sub {
        font-size: 0.85em;
        color: #666;
    }
    .ticker-badge {
        display: inline-block;
        background-color: #667eea;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85em;
        margin-right: 0.5rem;
    }
    .suggestion-item {
        padding: 12px 16px !important;
        margin: 4px 0 !important;
        background: #ffffff !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 12px !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        font-size: 15px !important;
    }
    .suggestion-item:hover {
        background: #f0f5ff !important;
        border-color: #4285f4 !important;
        box-shadow: 0 2px 8px rgba(66, 133, 244, 0.2) !important;
    }
    </style>
""", unsafe_allow_html=True)


def get_db():
    """Connect to MongoDB"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        return db
    except Exception as e:
        st.error(f"❌ Database connection failed: {str(e)}")
        return None

def get_user_watchlist(email):
    """Get user's watchlist from MongoDB"""
    db = get_db()
    if db is None:
        return []
    
    watchlist_col = db[WATCHLIST_COLLECTION]
    user_data = watchlist_col.find_one({"email": email.lower()})
    
    if user_data:
        return user_data.get("watchlist", [])
    return []

def create_user_watchlist(email):
    """Create a new watchlist for user"""
    db = get_db()
    if db is None:
        return False
    
    watchlist_col = db[WATCHLIST_COLLECTION]
    watchlist_col.insert_one({
        "email": email.lower(),
        "watchlist": [],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    })
    return True

def add_to_watchlist(email, ticker):
    """Add stock to user's watchlist"""
    db = get_db()
    if db is None:
        return False
    
    watchlist_col = db[WATCHLIST_COLLECTION]
    ticker = ticker.upper().strip()
    
    # Check if user exists
    user_data = watchlist_col.find_one({"email": email.lower()})
    
    if user_data is None:
        # Create new watchlist
        create_user_watchlist(email)
        user_data = watchlist_col.find_one({"email": email.lower()})
    
    # Add ticker if not already present
    if ticker not in user_data["watchlist"]:
        watchlist_col.update_one(
            {"email": email.lower()},
            {
                "$push": {"watchlist": ticker},
                "$set": {"updated_at": datetime.now()}
            }
        )
        return True
    return False

def remove_from_watchlist(email, ticker):
    """Remove stock from user's watchlist"""
    db = get_db()
    if db is None:
        return False
    
    watchlist_col = db[WATCHLIST_COLLECTION]
    ticker = ticker.upper().strip()
    
    watchlist_col.update_one(
        {"email": email.lower()},
        {
            "$pull": {"watchlist": ticker},
            "$set": {"updated_at": datetime.now()}
        }
    )
    return True

def get_stock_mappings():
    """Get all stock mappings from MongoDB"""
    db = get_db()
    if db is None:
        return []
    
    mappings_col = db[MAPPINGS_COLLECTION]
    return list(mappings_col.find({}, {"_id": 0}))

def search_stocks(query):
    """
    Search for stocks based on user input
    Returns matching stocks sorted by relevance
    Optimized with caching and efficient querying
    """
    if not query or len(query.strip()) < 1:
        return []
    
    query = query.lower().strip()
    db = get_db()
    if db is None:
        return []
    
    try:
        mappings_col = db[MAPPINGS_COLLECTION]
        
        # Combine all search strategies in one efficient query
        matches = list(mappings_col.find({
            "$or": [
                {"ticker": {"$regex": f"^{query}", "$options": "i"}},
                {"company_name": {"$regex": f"^{query}", "$options": "i"}},
                {"search_terms": {"$regex": query, "$options": "i"}},
                {"synonyms": {"$regex": query, "$options": "i"}}
            ]
        }, {"_id": 0}).limit(10))
        
        # Deduplicate by ticker
        seen_tickers = set()
        unique_matches = []
        for match in matches:
            if match["ticker"] not in seen_tickers:
                seen_tickers.add(match["ticker"])
                unique_matches.append(match)
        
        return unique_matches[:10]
    
    except Exception as e:
        st.warning(f"⚠️ Search error: {str(e)}")
        return []

def validate_stock(ticker):
    """
    Validate if a stock exists in the mappings collection
    Returns stock data if valid, None otherwise
    """
    db = get_db()
    if db is None:
        return None
    
    mappings_col = db[MAPPINGS_COLLECTION]
    stock = mappings_col.find_one({
        "ticker": ticker.upper().strip()
    }, {"_id": 0})
    
    return stock

def similarity_score(a, b):
    """Calculate string similarity score (0-1)"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def get_similar_stocks(query):
    """
    Get stocks similar to the query using fuzzy matching
    Used for typo/misspelling suggestions
    """
    if not query or len(query.strip()) < 2:
        return []
    
    db = get_db()
    if db is None:
        return []
    
    mappings_col = db[MAPPINGS_COLLECTION]
    all_stocks = list(mappings_col.find({}, {"_id": 0}))
    
    query_lower = query.lower().strip()
    
    # Calculate similarity for all stocks
    similarities = []
    for stock in all_stocks:
        # Check similarity with ticker
        ticker_sim = similarity_score(query_lower, stock["ticker"].lower())
        
        # Check similarity with company name
        name_sim = similarity_score(query_lower, stock["company_name"].lower())
        
        # Check if query matches any search term or misspelling
        search_sim = max(
            [similarity_score(query_lower, term.lower()) 
             for term in stock.get("search_terms", [])] +
            [similarity_score(query_lower, term.lower()) 
             for term in stock.get("common_misspellings", [])] +
            [0]
        )
        
        max_sim = max(ticker_sim, name_sim, search_sim)
        
        if max_sim > 0.6:  # Threshold for similarity
            similarities.append((stock, max_sim))
    
    # Sort by similarity score and return top matches
    similarities.sort(key=lambda x: x[1], reverse=True)
    return [stock for stock, _ in similarities[:5]]

def get_stock_sentiment(articles):
    """Determine sentiment from articles"""
    if not articles:
        return "Neutral ➡️", "No data"
    
    # Simple sentiment analysis based on article count
    positive_keywords = ["gain", "up", "surge", "rally", "bull", "strong", "beat", "growth", "profit", "record", "high"]
    negative_keywords = ["drop", "fall", "loss", "down", "bear", "weak", "miss", "decline", "fall", "low", "loss"]
    
    positive_count = 0
    negative_count = 0
    
    for article in articles:
        title_lower = article.get('title', '').lower()
        positive_count += sum(1 for keyword in positive_keywords if keyword in title_lower)
        negative_count += sum(1 for keyword in negative_keywords if keyword in title_lower)
    
    if positive_count > negative_count:
        return "Positive 📈", positive_count
    elif negative_count > positive_count:
        return "Negative 📉", negative_count
    else:
        return "Neutral ➡️", len(articles)


@st.cache_data(ttl=3600, show_spinner=False)  # Cache for 1 hour → instant reloads
def generate_key_insights(articles, stock_name="Stock") -> str:
    """
    Extracts 3–5 ultra-high-signal, material business developments from 24–48h news.
    Used in watchlist cards — must be fast, accurate, and visually perfect.
    """
    if not articles:
        return "• No recent developments\n• Market quiet on this name"

    # ── 1. Filter to last 48 hours (most apps don't have timestamps → smart fallback)
    now = datetime.now()
    recent_articles = []
    
    for a in articles:
        # Try to extract date from article if available (some scrapers add 'date' field)
        article_time = a.get('published_at') or a.get('date') or a.get('timestamp')
        if article_time:
            try:
                if isinstance(article_time, str):
                    from dateutil import parser
                    article_time = parser.parse(article_time)
                if now - article_time <= timedelta(hours=72):  # broader net
                    recent_articles.append(a)
            except:
                pass
        else:
            # If no date, assume recent (most scrapers return latest first)
            recent_articles.append(a)
    
    if not recent_articles:
        recent_articles = articles[:8]

    # ── 2. Build ultra-clean input (title + snippet only)
    clean_entries = []
    seen_titles = set()
    
    for a in recent_articles[:12]:
        title = a.get('title', '').strip()
        if not title or title.lower() in seen_titles:
            continue
        seen_titles.add(title.lower())
        
        snippet = a.get('content', '') or a.get('description', '') or ''
        if snippet == title:
            snippet = ''
            
        entry = f"• [{a.get('source', 'News')}] {title}"
        if snippet and len(snippet) > 20:
            entry += f" → {snippet.strip()[:140]}..."
        clean_entries.append(entry)

    articles_text = "\n".join(clean_entries) if clean_entries else "No valid articles"

    # ── 3. The Nuclear-Grade Prompt (Zero Hallucination, Perfect Formatting)
    prompt = f"""You are a senior equity sales trader writing the morning "Key Calls" section for a $10B hedge fund.

Extract ONLY the 3–5 most material, trade-moving developments for {stock_name.upper()} from the last 48 hours.

INPUT:
{articles_text}

RULES (NON-NEGOTIABLE):
- Only include developments that actually happened (earnings, deals, guidance, regulatory, product, CEO quotes, etc.)
- No generic filler ("stock rises", "analysts comment", "market reacts")
- No repetition. No headlines as insights.
- Max 1 line per bullet. Under 120 characters.
- Start each line with •
- Return ONLY the bullet points. Nothing else. No intro. No numbering.

OUTPUT NOW:"""

    # ── 4. Optimal Groq Settings (Speed + Precision)
    try:
        groq_api_key = st.secrets.get("GROQ_API_KEY", os.getenv("GROQ_API_KEY"))
        client = Groq(api_key=groq_api_key)
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a ruthless, precise equity sales trader. Only material facts. No fluff ever."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.08,        # Ice-cold precision
            top_p=0.92,
            max_tokens=380,
            frequency_penalty=0.15,
            seed=42,                  # Reproducible = perfect for caching
            timeout=25,
        )
        
        raw = response.choices[0].message.content.strip()
        
        # ── 5. Bullet-Proof Post-Processing
        lines = [l.strip() for l in raw.split('\n') if l.strip()]
        bullets = []
        
        for line in lines:
            line = line.strip("•-*0123456789. ")
            if len(line) > 15 and len(line) < 130:
                # Clean up common AI artifacts
                line = re.sub(r'^[•\-\*]+\s*', '', line)
                line = re.sub(r'\s*→.*$', '', line)  # remove extra commentary
                line = line.split('(')[0].strip()    # remove source notes if added
                line = line.split('- ')[-1].strip()  # final cleanup
                if line and line not in [b.split('• ')[-1] for b in bullets]:
                    bullets.append(f"• {line.capitalize()}")

        # Ensure 3–5 bullets
        final_bullets = bullets[:5] or _fallback_bullets(articles, stock_name)
        if len(final_bullets) < 3:
            final_bullets += _fallback_bullets(articles, stock_name)
            final_bullets = final_bullets[:5]

        return "\n".join(final_bullets)

    except Exception as e:
        print(f"Key insights fallback triggered: {e}")
        return _fallback_bullets(articles, stock_name)


# ── Ultra-Reliable Fallback (Never Fail)
def _fallback_bullets(articles, stock_name):
    titles = []
    for a in articles[:7]:
        t = a.get('title', '').strip()
        if t and len(t) > 20 and '|' not in t and ' - ' not in t[:30]:
            t = re.sub(r'\s*\|\s*.+$', '', t)
            t = re.sub(r'\s*-\s*.+$', '', t)
            titles.append(t)
    
    bullets = [f"• {t}" for t in titles[:4]]
    if len(bullets) < 3:
        bullets = [
            f"• Monitoring {stock_name.upper()} for fresh catalysts",
            "• Recent news flow light",
            "• No major developments in past 48 hours"
        ]
    return bullets

def generate_key_insights_fallback(articles):
    """
    Fallback rule-based key insights generation
    Used when GROQ API is unavailable
    """
    if not articles:
        return "• No recent news available\n• Check back later for updates"
    
    developments = []
    
    # Extract from top 3 articles
    for article in articles[:3]:
        title = article.get('title', '').strip()
        description = article.get('description', '').strip()
        
        # Filter out generic/irrelevant phrases
        irrelevant_phrases = [
            'how we use', 'how we approach', 'editorial', 'personal data',
            'privacy', 'terms', 'disclaimer', 'contact us', 'about', 'careers'
        ]
        
        if any(phrase.lower() in title.lower() for phrase in irrelevant_phrases):
            continue
        
        # Clean title
        if len(title) > 15 and len(title) < 150:
            development = f"• {title.strip()}"
            if development not in developments:
                developments.append(development)
    
    # If we have less than 3, add activity indicator
    while len(developments) < 3:
        if len(developments) == 0:
            developments.append("• Recent market activity being tracked")
        elif len(developments) == 1:
            developments.append("• Company news and updates ongoing")
        elif len(developments) == 2:
            developments.append("• Monitor news for significant developments")
    
    return "\n".join(developments[:5])

def filter_articles_by_timeframe(articles, hours_range=(24, 48)):
    """
    Filter articles to get recent ones (24-48 hours)
    Uses GROQ AI to identify old news based on content analysis
    Falls back to taking newest articles if date parsing fails
    """
    if not articles:
        return []
    
    try:
        groq_api_key = st.secrets.get("GROQ_API_KEY", os.getenv("GROQ_API_KEY"))
        if not groq_api_key:
            # No API key, return top articles as-is
            return articles[:5]
        
        client = Groq(api_key=groq_api_key)
        
        # Create a batch check for which articles are recent
        articles_check = "\n".join([
            f"{i+1}. {article.get('title', 'N/A')}"
            for i, article in enumerate(articles[:10])
        ])
        
        prompt = f"""Analyze these news headlines and identify which ones appear to be from the LAST 24-48 HOURS.
        
HEADLINES:
{articles_check}

INSTRUCTIONS:
- Look for temporal clues: "announced today", "just reported", "breaking", "latest quarter", specific recent dates
- Identify articles that seem OLD (6+ months old phrases like "to raise prices", "plans to", historical references)
- Return ONLY the numbers (1-based) of RECENT articles, comma-separated
- If unsure, assume it's recent
- Example output: 1,2,4,6

RECENT ARTICLE NUMBERS:"""
        
        message = client.messages.create(
            model="llama-3.3-70b-versatile",
            max_tokens=100,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        response = message.content[0].text.strip()
        recent_indices = []
        
        # Parse the response to get article indices
        try:
            indices_str = response.split(':')[-1].strip()
            recent_indices = [int(x.strip()) - 1 for x in indices_str.split(',') if x.strip().isdigit()]
        except:
            recent_indices = list(range(min(5, len(articles))))
        
        if recent_indices:
            filtered = [articles[i] for i in recent_indices if i < len(articles)]
            return filtered if filtered else articles[:5]
        else:
            # Fallback: return first 5
            return articles[:5]
    
    except Exception as e:
        # Fallback: return first 5 articles
        return articles[:5]

def get_stock_news(stock_name):
    """Fetch news for a stock"""
    try:
        articles = scrape_all_sources(stock_name, include_global=True, include_indian=True)
        # Filter articles from 24-48 hours timeframe
        filtered_articles = filter_articles_by_timeframe(articles)
        return filtered_articles if filtered_articles else articles[:5]
    except Exception as e:
        return []

def fetch_stock_data_parallel(watchlist):
    """
    Fetch news and sentiment for all stocks in parallel
    Significantly improves load time for large watchlists
    """
    if not watchlist:
        return {}
    
    stock_data_cache = {}
    
    # Use ThreadPoolExecutor for parallel fetching
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all tasks
        futures = {
            executor.submit(get_stock_news, stock): stock 
            for stock in watchlist
        }
        
        # Collect results as they complete
        for future in as_completed(futures):
            stock = futures[future]
            try:
                articles = future.result()
                sentiment, intensity = get_stock_sentiment(articles)
                stock_data_cache[stock] = {
                    'news': articles,
                    'sentiment': sentiment,
                    'intensity': intensity
                }
            except Exception as e:
                # Fallback for any stock that fails
                stock_data_cache[stock] = {
                    'news': [],
                    'sentiment': 'Neutral ➡️',
                    'intensity': 0
                }
    
    return stock_data_cache

def render_header():
    """Render professional header - compact"""
    st.markdown("""
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 1rem 1.5rem;
            border-radius: 10px;
            color: white;
            margin-bottom: 1rem;
            text-align: center;
        ">
            <h2 style="margin: 0; font-size: 1.4rem;">Portfolio Buzz</h2>
            <p style="margin: 0.3rem 0 0 0; font-size: 0.85rem; opacity: 0.9;"> Every Stock. Every Headline. Miss Nothing</p>
        </div>
    """, unsafe_allow_html=True)

def render_suggested_stocks():
    """Render suggested stocks grid"""
    st.markdown("### 💡 Popular Stocks to Add")
    
    suggested = ["AAPL", "TSLA", "MSFT", "AMZN", "NVDA", "GOOGL", "META", "NFLX"]
    
    cols = st.columns(4)
    for idx, stock in enumerate(suggested):
        with cols[idx % 4]:
            if st.button(f"+ {stock}", use_container_width=True, key=f"add_{stock}"):
                if add_to_watchlist(st.session_state.username, stock):
                    st.session_state.refresh = True
                    st.rerun()
                else:
                    st.info(f"{stock} already in watchlist")

def render_floating_search(watchlist):
    """Render floating search bar with INSTANT suggestions"""
    
    col1, col2 = st.columns([4, 3])
    
    with col1:
        # This fires on EVERY keystroke - no Enter needed!
        search_query = st_keyup(
            "Search stocks",
            key="instant_search",
            placeholder="🔍 Type to search...",
            label_visibility="collapsed"
        )
    
    query = search_query.strip().upper() if search_query else ""
    
    if query and len(query) >= 1:
        stocks = get_all_stocks_cached()
        
        matches = []
        for s in stocks:
            ticker = s["ticker"]
            name = s["name"]
            
            if ticker == query:
                matches.append((ticker, name, -1))
            elif ticker.startswith(query):
                matches.append((ticker, name, 0))
            elif name.upper().startswith(query):
                matches.append((ticker, name, 1))
            elif query in ticker or query in name.upper():
                matches.append((ticker, name, 2))
        
        matches = sorted(matches, key=lambda x: (x[2], x[0]))[:8]
        
        if matches:
            with col1:
                for ticker, name, _ in matches:
                    already_added = ticker in watchlist
                    
                    # Clean single-line suggestion
                    cols = st.columns([1, 3, 2])
                    cols[0].markdown(f"**{ticker}**")
                    cols[1].caption(name[:35])
                    
                    if already_added:
                        cols[2].markdown("In Watchlist")
                    else:
                        if cols[2].button("Add to watchlist", key=f"add_{ticker}"):
                            add_to_watchlist(st.session_state.username, ticker)
                            new_data = fetch_multiple_stocks_parallel([(ticker, name)])
                            if new_data:
                                st.session_state.watchlist_cache.update(new_data)
                            st.session_state.newly_added.append(ticker)
                            st.toast(f"✅ {ticker} added!", icon="📈")
                            st.rerun()
        else:
            with col1:
                st.caption("No stocks found")

def render_watchlist_tiles(watchlist):
    if not watchlist:
        st.info("Your watchlist is empty. Add stocks to get started!")
        return

    st.markdown("### Your Watchlist")

    # Fetch mappings once
    mappings = {doc["ticker"]: doc for doc in get_stock_mappings()}

    # Prepare input for parallel fetch
    ticker_name_pairs = []
    for ticker in watchlist:
        name = mappings.get(ticker, {}).get("official_name", ticker)
        ticker_name_pairs.append((ticker, name))

    # Parallel fetch
    # Use cached data, only fetch missing
    cached = st.session_state.watchlist_cache
    missing = [p for p in ticker_name_pairs if p[0] not in cached]

    if missing:
        with st.spinner(f"Loading {len(missing)} new stocks..."):
            new_data = fetch_multiple_stocks_parallel(missing)
            cached.update(new_data or {})
            st.session_state.watchlist_cache = cached

    stock_data = cached

    # Render grid
    cols = st.columns(3)
    for idx, ticker in enumerate(watchlist):
        with cols[idx % 3]:
            data = stock_data.get(ticker, {})
            bullets = data.get("bullets", "• Loading...")
            company_name = mappings.get(ticker, {}).get("official_name", ticker)

            with st.container(border=True):
                st.markdown(f"### {ticker}")
                st.caption(company_name)

                # Logo (optional, if you have URLs in mappings)
                # if logo := mappings.get(ticker, {}).get("logo"):
                #     st.image(logo, width=60)

                st.markdown(f"<div class='key-insights'>{bullets}</div>", unsafe_allow_html=True)

                col1, col2 = st.columns([2, 1])
                with col1:
                    if st.button("Analyze", key=f"analyze_{ticker}", use_container_width=True):
                        st.session_state.selected_stock = ticker
                        st.switch_page("pages/analysis.py")
                with col2:
                    if st.button("Remove", key=f"rm_{ticker}", type="secondary"):
                        remove_from_watchlist(st.session_state.username, ticker)
                        st.rerun()# ============================================================================
# MAIN APP
# ============================================================================

# Initialize session state
if "refresh" not in st.session_state:
    st.session_state.refresh = False

if "watchlist_cache" not in st.session_state:
    st.session_state.watchlist_cache = {}

# Header with user controls
col1, col2 = st.columns([8, 2])
with col1:
    render_header()
    render_floating_search(get_user_watchlist(st.session_state.username))
with col2:
    # Smaller username
    st.markdown(f"<span style='font-size: 1rem; color: #666;'> {st.session_state.username}</span>", unsafe_allow_html=True)
    
    # Red logout button styling
    st.markdown("""
        <style>
        /* Override primary button color to red */
        .stButton > button[kind="primary"] {
            background-color: #dc3545 !important;
            border-color: #dc3545 !important;
        }
        .stButton > button[kind="primary"]:hover {
            background-color: #c82333 !important;
            border-color: #c82333 !important;
        }
        </style>
        """, unsafe_allow_html=True)

    if st.button("Logout", use_container_width=True, type="primary"):
        st.session_state.authenticated = False
        st.session_state.username = None
        st.switch_page("login.py")

st.divider()

# Main content
# === SMART WATCHLIST LOADING (ONLY WHEN NEEDED) ===
watchlist = get_user_watchlist(st.session_state.username)

# Only fetch full news if cache is missing or too small
if "watchlist_cache" not in st.session_state or len(st.session_state.watchlist_cache) < len(watchlist):
    if watchlist:
        with st.spinner(f"Loading updates for {len(watchlist)} stocks..."):
            mappings = {d["ticker"]: d.get("official_name") or d.get("company_name") or d["ticker"] 
                       for d in get_stock_mappings()}
            pairs = [(t, mappings.get(t, t)) for t in watchlist]
            full_data = fetch_multiple_stocks_parallel(pairs)
            st.session_state.watchlist_cache = full_data
    else:
        st.session_state.watchlist_cache = {}

# Check if watchlist is empty
# Always show floating search at top
# render_floating_search(watchlist)

if not watchlist:
    st.markdown("---")
    render_suggested_stocks()
else:
    render_watchlist_tiles(watchlist)

# Footer
st.markdown("---")
st.markdown("""
    <div style='text-align: center; color: #666; font-size: 0.85em;'>
        <p style='font-size: 0.75em;'>⚠️ Free Tier will be Slow. Nikhil R</p>
    </div>
""", unsafe_allow_html=True)
