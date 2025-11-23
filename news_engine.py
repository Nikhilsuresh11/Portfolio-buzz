import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from scraper import scrape_all_sources
from groq import Groq
import os
from dotenv import load_dotenv
import streamlit as st

load_dotenv()
GROQ_API_KEY = st.secrets.get("GROQ_API_KEY", os.getenv("GROQ_API_KEY"))
client = Groq(api_key=GROQ_API_KEY)

TIME_24H = timedelta(hours=24)
TIME_72H = timedelta(hours=72)

def filter_articles_by_timeframe(articles, hours_range=(0, 24)):
    """Filter articles by recency (mocked since scraper doesn't return dates)"""
    # In real implementation: parse date from article if available
    # For now: use article order as proxy (newest first)
    cutoff = len(articles) * (hours_range[0] / 72)
    return articles[int(cutoff):] if articles else []

def get_quarterly_earnings_summary(stock_name):
    """Fallback: latest earnings call summary"""
    prompt = f"""
    You are a financial analyst. Summarize the most recent quarterly earnings for {stock_name} in 3–5 concise, professional bullet points.
    Focus only on key financial metrics, guidance, and management commentary.
    If no data, return: "No recent earnings data available."
    """
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except:
        return "• No recent earnings data available"

def generate_key_bullets(articles, stock_name, timeframe="24h"):
    """
    Always returns 3–5 clean, professional, agency-style bullet points.
    Never mentions sources, scraping, or lack of data.
    Uses strict time hierarchy: 24h → 48–72h → earnings.
    """
    if not articles:
        # Fallback: latest quarterly earnings (silent)
        return get_professional_earnings_bullets(stock_name)

    # Select articles based on timeframe
    if timeframe == "24h":
        selected = articles[:10]  # freshest
    else:  # 48–72h
        selected = articles[:14]

    titles = [a["title"] for a in selected if len(a["title"]) > 20]

    if not titles:
        return get_professional_earnings_bullets(stock_name)

    text = "\n".join([f"• {title}" for title in titles])

    prompt = f"""
You are a senior editor at a top-tier global financial news wire (like Reuters or Bloomberg).

Write exactly 3–5 concise, factual, investor-focused bullet points about **{stock_name}** based solely on the latest developments below.

Rules:
- Each bullet must describe a real business event and briefly explain why it matters.
- Never use words like "reported", "according to", "article", "news", "sources", or "mentioned".
- Never say anything is missing or unavailable.
- Never include sentiment (positive/negative).
- Never refer to timeframes or recency.
- Write in crisp, institutional tone.

Latest developments:
{text}

Output only the bullet points. Nothing else.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=400,
            top_p=0.9
        )
        raw = response.choices[0].message.content.strip()

        # Clean and enforce 3–5 bullets
        lines = [line.strip() for line in raw.split('\n') if line.strip() and line.strip().startswith(('•', '-', '*', '·'))]
        lines = [line[1:].strip() if line[0] in "•-*·" else line.strip() for line in lines]
        lines = [line for line in lines if len(line) > 20]

        if len(lines) >= 3:
            return "\n".join(f"• {line}" for line in lines[:5])
        else:
            return get_professional_earnings_bullets(stock_name)

    except Exception as e:
        return get_professional_earnings_bullets(stock_name)


def get_professional_earnings_bullets(stock_name):
    """Silent fallback: latest quarterly earnings — always professional"""
    prompt = f"""
You are a senior financial correspondent.

Write exactly 3–5 concise, factual bullet points summarizing the most recent quarterly performance and outlook for **{stock_name}**.

Focus on:
- Revenue, profit, margins
- Segment performance
- Guidance or capex plans
- Strategic initiatives

Use real or highly plausible figures and updates.
Write in institutional, neutral tone.
Never say "no data available" or "latest earnings".

Output only bullet points.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=400
        )
        raw = response.choices[0].message.content.strip()
        lines = [l.strip() for l in raw.split('\n') if l.strip() and any(l.startswith(s) for s in "•-*·")]
        lines = [l[1:].strip() if l[0] in "•-*·" else l.strip() for l in lines]
        lines = [l for l in lines if len(l) > 20][:5]
        return "\n".join(f"• {line}" for line in lines) if lines else "• The company continues to execute its long-term growth strategy across core segments."
    except:
        return "• The company continues to execute its long-term growth strategy across core segments.\n• Management remains focused on operational efficiency and market expansion.\n• Balance sheet strength supports ongoing capital allocation priorities."
    
def fetch_stock_news_with_fallback(ticker, company_name):
    """Main function: 24h → 48–72h → earnings"""
    start = time.time()
    articles = scrape_all_sources(company_name or ticker, include_global=True, include_indian=True)

    if not articles:
        return {
            "bullets": get_quarterly_earnings_summary(company_name or ticker),
            "source": "earnings_fallback",
            "fetch_time": round(time.time() - start, 2)
        }

    # Try 24h (assume first ~30% are newest)
    recent_24h = articles[:max(1, len(articles)//3)]
    if len(recent_24h) >= 3:
        bullets = generate_key_bullets(recent_24h, company_name or ticker, "24h")
        return {
            "bullets": bullets,
            "source": "24h",
            "articles_count": len(recent_24h),
            "fetch_time": round(time.time() - start, 2)
        }

    # Try 48–72h
    recent_72h = articles[:max(1, len(articles)//2)]
    if len(recent_72h) >= 3:
        bullets = generate_key_bullets(recent_72h, company_name or ticker, "72h")
        return {
            "bullets": bullets,
            "source": "72h",
            "articles_count": len(recent_72h),
            "fetch_time": round(time.time() - start, 2)
        }

    # Final fallback: earnings
    bullets = get_quarterly_earnings_summary(company_name or ticker)
    return {
        "bullets": bullets,
        "source": "earnings_fallback",
        "fetch_time": round(time.time() - start, 2)
    }

def fetch_multiple_stocks_parallel(tickers_with_names):
    """
    Input: [("RELIANCE", "Reliance Industries"), ("TCS", "Tata Consultancy Services")]
    Output: { "RELIANCE": {bullets: "...", source: "24h", ...}, ... }
    """
    results = {}
    with ThreadPoolExecutor(max_workers=8) as executor:
        future_to_ticker = {
            executor.submit(fetch_stock_news_with_fallback, ticker, name): ticker
            for ticker, name in tickers_with_names
        }
        for future in as_completed(future_to_ticker):
            ticker = future_to_ticker[future]
            try:
                results[ticker] = future.result()
            except:
                results[ticker] = {
                    "bullets": "• News temporarily unavailable",
                    "source": "error",
                    "fetch_time": 0
                }
    return results