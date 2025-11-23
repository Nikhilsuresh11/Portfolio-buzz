import streamlit as st
from groq import Groq
from datetime import datetime
import time
from dotenv import load_dotenv
import os
import sys

# Add parent directory to path to import scraper
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scraper import scrape_all_sources

# Check if user is authenticated
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.switch_page("login.py")

# Get selected stock from session state (if coming from home.py)
selected_stock = st.session_state.get("selected_stock", None)

load_dotenv()
groq_api_key = st.secrets.get("GROQ_API_KEY", os.getenv("GROQ_API_KEY"))

# Fixed settings (no user control)
max_articles = 10
include_global = True
include_indian = True

# Page configuration
st.set_page_config(
    page_title="Portfolio Buzz - Stock Analysis",
    page_icon="💸",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide sidebar
st.markdown("""
    <style>
    [data-testid="stSidebarNav"] { display: none; }
    [data-testid="stSidebar"] { display: none; }
    </style>
""", unsafe_allow_html=True)

# Custom CSS
st.markdown("""
    <style>
    .main {
        padding: 2rem;
    }
    .stButton>button {
        width: 100%;
        background: linear-gradient(135deg, #5b70d9 0%, #4860c4 100%);
        color: white;
        height: 3em;
        border-radius: 8px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(91, 112, 217, 0.2);
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        background: linear-gradient(135deg, #4860c4 0%, #3d52ad 100%);
        box-shadow: 0 4px 12px rgba(91, 112, 217, 0.3);
        transform: translateY(-2px);
    }
    .news-card {
        background-color: #f0f2f6;
        padding: 1.5rem;
        border-radius: 10px;
        margin-bottom: 1rem;
        border-left: 4px solid #5b70d9;
    }
    .metric-card {
        background-color: #e8f5ff;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        border: 1px solid #d0e4ff;
    }
    .source-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8em;
        margin-right: 5px;
        font-weight: bold;
    }
    .premium-source {
        background-color: #FFD700;
        color: #000;
    }
    .free-source {
        background-color: #5b70d9;
        color: white;
    }
    </style>
""", unsafe_allow_html=True)
col1, col2, col3 = st.columns([1, 10, 3])
with col1:

    if st.button("← Back", use_container_width=True):
            st.switch_page("pages/home.py")

with col3:
    st.markdown(f"{st.session_state.username}")

    if st.button(" Logout", use_container_width=True):
        st.session_state.authenticated = False
        st.session_state.username = None
        st.session_state.selected_stock = None
        st.switch_page("login.py")

# Header with navigation
col1, col2, col3 = st.columns([7, 1, 3])
with col1:
    # Title
    st.title("Portfolio Buzz")
    st.markdown("### Every Stock. Every Headline. Miss Nothing")


st.divider()

# Main input
col1, col2, col3 = st.columns([7, 1, 3])
with col1:
    stock_name = st.text_input(
        "Enter Stock/Company Name or Ticker",
        placeholder="e.g., Tesla, TSLA, Reliance, RELIANCE.NS",
        # help="Enter stock ticker or company name",
        value=selected_stock if selected_stock else ""
    )

with col3:
    search_button = st.button("🔍 Analyze News", use_container_width=True)


def generate_summary_with_groq(articles, stock_name, api_key):
    """Generate AI summary"""
    if not articles:
        return "No articles found to analyze."
    
    try:
        client = Groq(api_key=api_key)
        
        # Prepare content
        articles_text = "\n\n".join([
            f"[{article['source']}] {article['title']}\n{article.get('content', '')[:300]}"
            for article in articles[:25]
        ])
        
        prompt = f"""
You are a Senior Equity Research Analyst at a Tier-1 global investment bank (ex-Goldman Sachs / Morgan Stanley level) with 15+ years of experience writing institutional research reports.

Your client is a $5B+ hedge fund portfolio manager who demands concise, actionable, data-driven insights — no fluff, no speculation, no disclaimers beyond what's necessary.

Stock: **{stock_name.upper()}**
Analysis Date: {datetime.now().strftime('%B %d, %Y')}

=== RAW NEWS INPUT (Latest articles from 30+ sources including Reuters, Bloomberg, CNBC, Economic Times, Seeking Alpha, Moneycontrol, etc.) ===
{articles_text}
=== END OF INPUT ===

Deliver a **professional equity research brief** using the exact structure below. Every claim must be grounded in the provided articles.

### 1. EXECUTIVE SUMMARY (3–4 sentences)
One-paragraph distillation of the prevailing narrative, dominant catalysts, and immediate market implication. End with implied directional bias.

### 2. KEY NEWS FLOW & MATERIAL DEVELOPMENTS
- Most important 6–8 developments ranked by potential P&L impact
- Include specific numbers, quotes, or management commentary where available
- Tag each with source credibility: [High] = Reuters/Bloomberg, [Medium] = CNBC/Yahoo, [Low] = unverified/social

### 3. SENTIMENT DASHBOARD
Overall Sentiment:          Positive / Mixed-Positive / Neutral / Mixed-Negative / Negative
Primary Driver:             Earnings | Guidance | Macro | Regulatory | Product/Deal | Valuation | Other
Consensus Consistency:     High (≥70% sources aligned) / Medium / Low
Confidence in Current Sentiment: High / Medium / Low

### 4. PRICE CATALYSTS CALENDAR (Next 90 Days)
• [Date] Event → Expected Impact (Positive/Neutral/Negative) + Magnitude (Low/Medium/High)
List all identifiable upcoming events (earnings, FDA decisions, lock-up expiry, index rebalance, etc.)

### 5. BULL vs BEAR THESIS SYNOPSIS
**Bull Case (from articles):**
• Top 3 supporting arguments with evidence

**Bear Case (from articles):**
• Top 3 counter-arguments with evidence

**Current Winner:** Bull Case / Bear Case / Too Close to Call

### 6. CROSS-SOURCE ANALYSIS & BIAS MAPPING
Group sources by tone:
• Strongly Bullish: [list sources]
• Cautious / Neutral: [list sources] 
• Bearish / Critical: [list sources]

Highlight:
- Any major contradictions or conflicting facts
- Sources that appear to have unique/early access
- Obvious clickbait or low-credibility outliers

### 7. TRADING & POSITIONING INSIGHT (Institutional Tone)
Estimated Street Sentiment:      Overly Bullish / Balanced / Overly Bearish
Near-Term Bias (1–4 weeks):      Upward / Sideways / Downward    |   Expected Volatility: Low / Moderate / Elevated
Medium-Term Trend (1–3 months):  Strengthening / Stable / Deteriorating
Key Risks to Monitor:            [List top 2–3 downside triggers]
Key Upside Triggers:             [List top 2–3 upside surprises]

### 8. INVESTMENT CONCLUSION (One-liner + Stance)
"Following today’s news flow, we are [Bullish / Neutral / Cautious] on {stock_name.upper()} into [next catalyst/event]."
Recommended Action: Long / Add on Weakness / Hold / Take Profits / Avoid / Short

────────────────────────────────────
STYLE RULES (NON-NEGOTIABLE):
• Write like a sell-side desk analyst — crisp, confident, evidence-based
• Never say "I don't have enough information" — synthesize what exists
• Never give direct financial advice or personal recommendations
• Use bold and italics strategically for scannability
• No emoji, no exclamation marks, no marketing fluff
• Maximum 1200 words total

Output only the structured report in clean markdown. No preamble.
"""

        response = client.chat.completions.create(
            messages = [
            {
                "role": "system",
                "content": """You are a former #1-ranked Institutional Investor equity research analyst now running a $5B+ long/short hedge fund research desk.
        You write morning notes that move stocks. Your audience: CIOs, PMs, and risk teams who demand precision, evidence, and tradable conclusions.
        Never speculate. Never hedge with disclaimers. Never hallucinate. Every sentence must be grounded in the provided articles.
        Write with quiet confidence — like you’ve seen this movie before."""
            },
            {
                "role": "user",
                "content": prompt
            },
            {
                "role": "assistant",
                "content": "Understood. Proceeding with institutional-grade analysis of " + stock_name.upper() + ". Output will follow exact structure with zero deviation."
            }
        ],
            model="llama-3.3-70b-versatile",
            temperature=0.12,
            max_tokens=3800,
            frequency_penalty=0.1,
            seed=42,
            top_p=0.95,
            timeout=180,
        )
        
        return response.choices[0].message.content
    
    except Exception as e:
        return f"❌ Error: {str(e)}"


# Main execution
if search_button:
    if not stock_name:
        st.warning("⚠️ Please enter a stock name")
    elif not groq_api_key:
        st.warning("⚠️ Please set your GROQ_API_KEY in environment variables")
    else:
        status = st.empty()
        progress = st.progress(0)
        
        try:
            status.info(f"🔍 Searching {stock_name} from various sources...")
            progress.progress(20)
            
            articles = scrape_all_sources(stock_name, include_global, include_indian)
            
            progress.progress(70)
            
            if not articles:
                status.error(" No articles found. Try: different ticker, company name, or check spelling")
                progress.empty()
            else:
                status.success(f" Found {len(articles)} articles from {len(set(a['source'] for a in articles))} sources")
                progress.progress(80)
                
                # Metrics
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.markdown(f'<div class="metric-card"><h3>📰</h3><p>Articles</p><h2>{len(articles)}</h2></div>', unsafe_allow_html=True)
                with col2:
                    sources = len(set(a['source'] for a in articles))
                    st.markdown(f'<div class="metric-card"><h3>🌐</h3><p>Sources</p><h2>{sources}</h2></div>', unsafe_allow_html=True)
                with col3:
                    free = sum(1 for a in articles if not a.get('premium'))
                    st.markdown(f'<div class="metric-card"><h3>🆓</h3><p>Free</p><h2>{free}</h2></div>', unsafe_allow_html=True)
                with col4:
                    premium = sum(1 for a in articles if a.get('premium'))
                    st.markdown(f'<div class="metric-card"><h3>💎</h3><p>Premium</p><h2>{premium}</h2></div>', unsafe_allow_html=True)
                
                # Articles by source
                with st.expander("📰 View All Articles by Source"):
                    source_groups = {}
                    for article in articles:
                        source = article['source']
                        if source not in source_groups:
                            source_groups[source] = []
                        source_groups[source].append(article)
                    
                    for source, source_articles in sorted(source_groups.items()):
                        st.markdown(f"### {source} ({len(source_articles)} articles)")
                        for i, article in enumerate(source_articles, 1):
                            badge_class = "premium-source" if article.get('premium') else "free-source"
                            badge_text = "Premium" if article.get('premium') else "Free"
                            st.markdown(f'<span class="source-badge {badge_class}">{badge_text}</span> **{i}. {article["title"]}**', unsafe_allow_html=True)
                            if article.get('content') and article['content'] != article['title']:
                                st.caption(article['content'][:200])
                        st.markdown("---")
                
                # Generate summary
                status.info("🤖 Generating comprehensive AI analysis...")
                progress.progress(90)
                
                summary = generate_summary_with_groq(articles, stock_name, groq_api_key)
                
                progress.progress(100)
                time.sleep(0.3)
                status.empty()
                progress.empty()
                
                # Display analysis
                st.markdown("## 📊 Comprehensive Analysis Report")
                
                # col1, col2, col3, col4 = st.columns(4)
                # with col1:
                #     st.markdown(f"**Stock:** {stock_name.upper()}")
                # with col2:
                #     st.markdown(f"**Date:** {datetime.now().strftime('%Y-%m-%d')}")
                # with col3:
                #     st.markdown(f"**Articles:** {len(articles)}")
                # with col4:
                #     st.markdown(f"**Model:** Llama 3.3 70B")
                
                st.markdown("---")
                st.markdown(summary)
                
                # Downloads
                st.markdown("---")
                report = f"""
{'='*70}
COMPREHENSIVE STOCK ANALYSIS REPORT
{'='*70}

Stock: {stock_name.upper()}
Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}
Period: Past 7 days
Total Articles: {len(articles)}
Sources: {', '.join(set(a['source'] for a in articles))}

{'='*70}
AI ANALYSIS (Llama 3.3 70B)
{'='*70}

{summary}

{'='*70}
ARTICLE SOURCES BREAKDOWN
{'='*70}

"""
                for source, source_articles in sorted(source_groups.items()):
                    report += f"\n{source} ({len(source_articles)} articles):\n"
                    for i, article in enumerate(source_articles, 1):
                        report += f"{i}. {article['title']}\n"
                    report += "\n"
                
                report += f"""
{'='*70}
Generated by Stock News Analyzer Pro
Powered by GROQ AI
{'='*70}
"""
                
                st.download_button(
                    "📥 Download Full Report",
                    report,
                    f"{stock_name}_comprehensive_analysis_{datetime.now().strftime('%Y%m%d_%H%M')}.txt",
                    "text/plain",
                    use_container_width=True
                )
        
        except Exception as e:
            status.error(f" Error: {str(e)}")
            progress.empty()

st.markdown("---")
st.markdown("""
    <div style='text-align: center; color: #666; font-size: 0.85em;'>
        <p style='font-size: 0.75em;'>⚠️ Free Tier will be Slow. Nikhil R</p>
    </div>
""", unsafe_allow_html=True)
