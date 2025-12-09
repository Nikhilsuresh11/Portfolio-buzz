import os
import json
from openai import OpenAI
from config import get_config
from datetime import datetime

config = get_config()


def get_fundamental_research(stock_name, ticker_name):
    """
    Get comprehensive fundamental research for a stock using Perplexity AI
    
    Args:
        stock_name: Company name (e.g., "Apple Inc")
        ticker_name: Stock ticker symbol (e.g., "AAPL")
    
    Returns:
        tuple: (success: bool, message: str, data: dict or None)
    """
    try:
        print(f"=== STOCK RESEARCH DEBUG ===")
        print(f"Stock: {stock_name}, Ticker: {ticker_name}")
        print(f"PERPLEXITY_API_KEY configured: {bool(config.PERPLEXITY_API_KEY)}")
        
        if not config.PERPLEXITY_API_KEY:
            return False, "Perplexity API key not configured", None
        
        # Initialize Perplexity client (uses OpenAI SDK)
        print("Initializing Perplexity client...")
        client = OpenAI(
            api_key=config.PERPLEXITY_API_KEY,
            base_url="https://api.perplexity.ai"
        )
        
        # Construct the comprehensive research prompt
        prompt = f"""You are an expert Stock market SEBI advisor and consultant with 30+ years of experience in analysing and suggesting ideas about stock market and shares to a rookie.

Your job is to give a valuable and reliable answers based on your deep research for me without any bias. Do not hallucinate or give fake news. Read reliable sources only and give a solid foundational answer for the below question.

Analyse and answer for all the below question for {stock_name} ({ticker_name}):

1. Business Model (B2B, B2C etc)
2. Core Focus, Key Strength, Future of the business, Exports(whether it exports to other countries)
3. Revenue and profit growth (refer screener.in)
4. Profit Margin over 10 years
5. Debt Level over 10 years
6. Cash Flow over 10 years
7. ROE and ROCE
8. PE, PB ratio along with the industry PE and PB. Also compare it with its own median PE for 1, 3, 5 and 10 years.
9. Dividend over 10 years
10. Reason for recent share price rise/fall
11. Main Competitors and its positioning and their advantages and disadvantages wrt share market
12. Capex
13. Advantages and disadvantages of investing in it
14. Future of that business's stock
15. Analyst Opinion
16. Recent breaking news about the company
17. Any cases, Patent for that company

Always answer and give advise in a way that what you would do when you were in my situation.
This study is specifically for long term investment (above 5 years).

Please structure your response in JSON format with the following keys:
{{
  "stock_name": "{stock_name}",
  "ticker": "{ticker_name}",
  "business_model": "...",
  "core_focus": "...",
  "revenue_profit_growth": "...",
  "profit_margin": "...",
  "debt_level": "...",
  "cash_flow": "...",
  "roe_roce": "...",
  "pe_pb_ratio": "...",
  "dividend_history": "...",
  "price_movement_reason": "...",
  "competitors": "...",
  "capex": "...",
  "investment_pros": "...",
  "investment_cons": "...",
  "future_outlook": "...",
  "analyst_opinion": "...",
  "recent_news": "...",
  "legal_patents": "...",
  "recommendation": "...",
  "sources": ["list of sources used"]
}}"""

        print("Sending request to Perplexity AI...")
        
        # Make API call to Perplexity
        response = client.chat.completions.create(
            model="sonar",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert SEBI-certified stock market advisor with 30+ years of experience. Provide detailed, accurate, and unbiased fundamental analysis based on reliable sources. Always structure your response in valid JSON format."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=4000,
            top_p=0.9
        )
        
        print("✓ Perplexity API response received")
        
        # Extract the response content
        research_content = response.choices[0].message.content
        
        # Try to parse as JSON, if it fails, return as text
        try:
            # Try to extract JSON from markdown code blocks if present
            if "```json" in research_content:
                json_start = research_content.find("```json") + 7
                json_end = research_content.find("```", json_start)
                research_data = json.loads(research_content[json_start:json_end].strip())
            elif "```" in research_content:
                json_start = research_content.find("```") + 3
                json_end = research_content.find("```", json_start)
                research_data = json.loads(research_content[json_start:json_end].strip())
            else:
                research_data = json.loads(research_content)
            
            # Add metadata
            research_data['generated_at'] = datetime.now().isoformat()
            research_data['analysis_type'] = 'fundamental_research'
            
        except json.JSONDecodeError:
            # If JSON parsing fails, structure the text response
            research_data = {
                'stock_name': stock_name,
                'ticker': ticker_name,
                'analysis': research_content,
                'generated_at': datetime.now().isoformat(),
                'analysis_type': 'fundamental_research',
                'format': 'text'
            }
        
        return True, "Stock research generated successfully", research_data
    
    except Exception as e:
        print(f"✗ Error in stock research: {type(e).__name__}: {e}")
        return False, f"Error generating stock research: {str(e)}", None
