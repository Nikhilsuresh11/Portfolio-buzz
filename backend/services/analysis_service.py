import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from groq import Groq
from config import get_config
from services.news_service import NewsService
from datetime import datetime
from utils.date_utils import get_default_days
import re
import os

config = get_config()


class AnalysisService:
    """AI-powered stock analysis service using GROQ"""
    
    @staticmethod
    def generate_ai_insight(stock_name, ticker=None, articles=None):
        """
        Generate AI-powered stock insight using GROQ
        
        Args:
            stock_name: Company name
            ticker: Stock ticker (optional)
            articles: Pre-fetched articles (optional)
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            print(f"=== GENERATE_AI_INSIGHT DEBUG ===")
            print(f"Stock: {stock_name}, Ticker: {ticker}")
            print(f"GROQ_API_KEY configured: {bool(config.GROQ_API_KEY)}")
            
            if not config.GROQ_API_KEY:
                return False, "GROQ API key not configured", None
            
            # Fetch news if not provided (use default 2 days for AI analysis)
            if not articles:
                print("Fetching news articles...")
                success, message, articles = NewsService.fetch_news_by_days(
                    stock_name, ticker, days=get_default_days()
                )
                print(f"News fetch result: success={success}, articles count={len(articles) if articles else 0}")
                if not success or not articles:
                    return False, "No articles found for analysis", None
            
            # Initialize GROQ client
            print("Initializing GROQ client...")
            os.environ['GROQ_API_KEY'] = config.GROQ_API_KEY
            
            try:
                client = Groq()
                print("✓ Groq client initialized successfully!")
            except Exception as e:
                print(f"✗ Error initializing Groq client: {type(e).__name__}: {e}")
                return False, f"Error initializing GROQ client: {str(e)}", None
            
            # Prepare articles text
            articles_text = "\n\n".join([
                f"[{article['source']}] {article['title']}\n{article.get('content', '')[:300]}"
                for article in articles[:25]
            ])
            
            prompt = f"""You are a Senior Equity Research Analyst at a Tier-1 global investment bank (ex-Goldman Sachs / Morgan Stanley level) with 15+ years of experience writing institutional research reports.

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
"Following today's news flow, we are [Bullish / Neutral / Cautious] on {stock_name.upper()} into [next catalyst/event]."
Recommended Action: Long / Add on Weakness / Hold / Take Profits / Avoid / Short

────────────────────────────────────
STYLE RULES (NON-NEGOTIABLE):
• Write like a sell-side desk analyst — crisp, confident, evidence-based
• Never say "I don't have enough information" — synthesize what exists
• Never give direct financial advice or personal recommendations
• Use bold and italics strategically for scannability
• No emoji, no exclamation marks, no marketing fluff
• Maximum 1200 words total

Output only the structured report in clean markdown. No preamble."""

            response = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": """You are a former #1-ranked Institutional Investor equity research analyst now running a $5B+ long/short hedge fund research desk.
You write morning notes that move stocks. Your audience: CIOs, PMs, and risk teams who demand precision, evidence, and tradable conclusions.
Never speculate. Never hedge with disclaimers. Never hallucinate. Every sentence must be grounded in the provided articles.
Write with quiet confidence — like you've seen this movie before."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    },
                    {
                        "role": "assistant",
                        "content": f"Understood. Proceeding with institutional-grade analysis of {stock_name.upper()}. Output will follow exact structure with zero deviation."
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
            
            analysis = response.choices[0].message.content
            
            return True, "Analysis generated successfully", {
                'stock': stock_name.upper(),
                'ticker': ticker,
                'analysis': analysis,
                'articles_analyzed': len(articles),
                'generated_at': datetime.now().isoformat()
            }
        
        except Exception as e:
            # Fallback to smaller, faster model on rate limit or error
            error_msg = str(e).lower()
            if 'rate' in error_msg or 'limit' in error_msg or 'quota' in error_msg or 'timeout' in error_msg:
                try:
                    print(f"[ANALYSIS] Primary model failed ({e}), falling back to llama-3.1-8b-instant...")
                    
                    # Retry with smaller model
                    response = client.chat.completions.create(
                        messages=[
                            {
                                "role": "system",
                                "content": """You are a former #1-ranked Institutional Investor equity research analyst now running a $5B+ long/short hedge fund research desk.
You write morning notes that move stocks. Your audience: CIOs, PMs, and risk teams who demand precision, evidence, and tradable conclusions.
Never speculate. Never hedge with disclaimers. Never hallucinate. Every sentence must be grounded in the provided articles.
Write with quiet confidence — like you've seen this movie before."""
                            },
                            {
                                "role": "user",
                                "content": prompt
                            },
                            {
                                "role": "assistant",
                                "content": f"Understood. Proceeding with institutional-grade analysis of {stock_name.upper()}. Output will follow exact structure with zero deviation."
                            }
                        ],
                        model="llama-3.1-8b-instant",  # Fallback model
                        temperature=0.12,
                        max_tokens=3800,
                        frequency_penalty=0.1,
                        seed=42,
                        top_p=0.95,
                        timeout=60,
                    )
                    
                    analysis = response.choices[0].message.content
                    
                    return True, "Analysis generated successfully (fallback model)", {
                        'stock': stock_name.upper(),
                        'ticker': ticker,
                        'analysis': analysis,
                        'articles_analyzed': len(articles),
                        'generated_at': datetime.now().isoformat(),
                        'model_used': 'llama-3.1-8b-instant'
                    }
                except Exception as fallback_error:
                    return False, f"Error generating analysis (both models failed): {str(fallback_error)}", None
            
            return False, f"Error generating analysis: {str(e)}", None
    
    @staticmethod
    def generate_key_insights(stock_name, ticker=None, articles=None):
        """
        Generate concise key insights (3-5 bullet points)
        
        Args:
            stock_name: Company name
            ticker: Stock ticker (optional)
            articles: Pre-fetched articles (optional)
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            print(f"=== GENERATE_KEY_INSIGHTS DEBUG ===")
            print(f"Stock: {stock_name}, Ticker: {ticker}")
            print(f"GROQ_API_KEY configured: {bool(config.GROQ_API_KEY)}")
            
            if not config.GROQ_API_KEY:
                return False, "GROQ API key not configured", None
            
            # Fetch news if not provided (use default 2 days for key insights)
            if not articles:
                print("Fetching news articles...")
                success, message, articles = NewsService.fetch_news_by_days(
                    stock_name, ticker, days=get_default_days()
                )
                print(f"News fetch result: success={success}, articles count={len(articles) if articles else 0}")
                if not success or not articles:
                    return False, "No articles found for insights", None
            
            # Initialize GROQ client
            print("Initializing GROQ client...")
            os.environ['GROQ_API_KEY'] = config.GROQ_API_KEY
            
            try:
                client = Groq()
                print("✓ Groq client initialized successfully!")
            except Exception as e:
                print(f"✗ Error initializing Groq client: {type(e).__name__}: {e}")
                return False, f"Error initializing GROQ client: {str(e)}", None
            
            # Prepare clean article entries
            clean_entries = []
            seen_titles = set()
            
            for article in articles[:12]:
                title = article.get('title', '').strip()
                if not title or title.lower() in seen_titles:
                    continue
                seen_titles.add(title.lower())
                
                snippet = article.get('content', '') or ''
                if snippet == title:
                    snippet = ''
                
                entry = f"• [{article.get('source', 'News')}] {title}"
                if snippet and len(snippet) > 20:
                    entry += f" → {snippet.strip()[:140]}..."
                clean_entries.append(entry)
            
            articles_text = "\n".join(clean_entries) if clean_entries else "No valid articles"
            
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

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a ruthless, precise equity sales trader. Only material facts. No fluff ever."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.08,
                top_p=0.92,
                max_tokens=380,
                frequency_penalty=0.15,
                seed=42,
                timeout=25,
            )
            
            raw = response.choices[0].message.content.strip()
            
            # Clean up bullets
            lines = [l.strip() for l in raw.split('\n') if l.strip()]
            bullets = []
            
            for line in lines:
                line = line.strip("•-*0123456789. ")
                if len(line) > 15 and len(line) < 130:
                    line = re.sub(r'^[•\-\*]+\s*', '', line)
                    line = re.sub(r'\s*→.*$', '', line)
                    line = line.split('(')[0].strip()
                    line = line.split('- ')[-1].strip()
                    if line and line not in [b.split('• ')[-1] for b in bullets]:
                        bullets.append(f"• {line.capitalize()}")
            
            final_bullets = bullets[:5] if bullets else [
                f"• Monitoring {stock_name.upper()} for fresh catalysts",
                "• Recent news flow light",
                "• No major developments in past 48 hours"
            ]
            
            insights_text = "\n".join(final_bullets)
            
            return True, "Key insights generated", {
                'stock': stock_name.upper(),
                'ticker': ticker,
                'insights': insights_text,
                'bullet_points': final_bullets,
                'generated_at': datetime.now().isoformat()
            }
        
        except Exception as e:
            # Fallback to smaller model on rate limit or error
            error_msg = str(e).lower()
            if 'rate' in error_msg or 'limit' in error_msg or 'quota' in error_msg or 'timeout' in error_msg:
                try:
                    print(f"[KEY_INSIGHTS] Primary model failed ({e}), falling back to llama-3.1-8b-instant...")
                    
                    response = client.chat.completions.create(
                        model="llama-3.1-8b-instant",  # Fallback model
                        messages=[
                            {"role": "system", "content": "You are a ruthless, precise equity sales trader. Only material facts. No fluff ever."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.08,
                        top_p=0.92,
                        max_tokens=380,
                        frequency_penalty=0.15,
                        seed=42,
                        timeout=25,
                    )
                    
                    raw = response.choices[0].message.content.strip()
                    
                    # Clean up bullets (same logic as before)
                    lines = [l.strip() for l in raw.split('\n') if l.strip()]
                    bullets = []
                    
                    for line in lines:
                        line = line.strip("•-*0123456789. ")
                        if len(line) > 15 and len(line) < 130:
                            line = re.sub(r'^[•\-\*]+\s*', '', line)
                            line = re.sub(r'\s*→.*$', '', line)
                            line = line.split('(')[0].strip()
                            line = line.split('- ')[-1].strip()
                            if line and line not in [b.split('• ')[-1] for b in bullets]:
                                bullets.append(f"• {line.capitalize()}")
                    
                    final_bullets = bullets[:5] if bullets else [
                        f"• Monitoring {stock_name.upper()} for fresh catalysts",
                        "• Recent news flow light",
                        "• No major developments in past 48 hours"
                    ]
                    
                    insights_text = "\n".join(final_bullets)
                    
                    return True, "Key insights generated (fallback model)", {
                        'stock': stock_name.upper(),
                        'ticker': ticker,
                        'insights': insights_text,
                        'bullet_points': final_bullets,
                        'generated_at': datetime.now().isoformat(),
                        'model_used': 'llama-3.1-8b-instant'
                    }
                except Exception as fallback_error:
                    return False, f"Error generating insights (both models failed): {str(fallback_error)}", None
            
            return False, f"Error generating insights: {str(e)}", None
