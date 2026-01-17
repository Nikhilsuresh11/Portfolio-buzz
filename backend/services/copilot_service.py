import os
import json
import logging
from openai import OpenAI
from groq import Groq
from config import get_config
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

config = get_config()


def handle_greeting(query):
    """
    Handle greeting queries using Llama-3.3-70b-versatile
    
    Args:
        query: User's greeting query
    
    Returns:
        tuple: (success: bool, message: str, response: dict or None)
    """
    try:
        logger.info("=== HANDLING GREETING ===")
        logger.info(f"Query: {query}")
        
        if not config.GROQ_API_KEY:
            logger.error("Groq API key not configured")
            return False, "Groq API key not configured", None
        
        client = Groq(api_key=config.GROQ_API_KEY)
        
        greeting_prompt = f"""You are a friendly and professional stock market copilot assistant.

The user has greeted you with: "{query}"

Respond warmly and professionally. Let them know you're here to help with:
- Deep fundamental analysis of companies
- General stock market questions
- Investment insights and research

Keep your response concise (2-3 sentences max), friendly, and professional.

Response:"""

        logger.info("Sending greeting request to Llama-3.3-70b-versatile...")
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a friendly, professional stock market copilot assistant. Be warm but concise."
                },
                {
                    "role": "user",
                    "content": greeting_prompt
                }
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        greeting_response = response.choices[0].message.content.strip()
        
        result = {
            'type': 'greeting',
            'response': greeting_response,
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info("✓ Greeting response generated successfully")
        return True, "Greeting handled successfully", result
    
    except Exception as e:
        logger.error(f"✗ Error handling greeting: {type(e).__name__}: {e}", exc_info=True)
        return False, f"Error handling greeting: {str(e)}", None


def handle_generic_question(query, previous_conversation=None):
    """
    Handle generic company/market questions using Groq Llama
    
    Args:
        query: User's generic question
        previous_conversation: List of previous Q&A pairs for context
    
    Returns:
        tuple: (success: bool, message: str, response: dict or None)
    """
    try:
        logger.info("=== HANDLING GENERIC QUESTION ===")
        logger.info(f"Query: {query}")
        
        if not config.GROQ_API_KEY:
            logger.error("Groq API key not configured")
            return False, "Groq API key not configured", None
        
        # Initialize Groq client
        client = Groq(api_key=config.GROQ_API_KEY)
        
        # Build conversation context
        conversation_context = ""
        has_previous_conversation = previous_conversation and len(previous_conversation) > 0
        
        if has_previous_conversation:
            conversation_context = "\n\nPrevious Conversation:\n"
            for i, conv in enumerate(previous_conversation[-3:], 1):
                conversation_context += f"Q{i}: {conv.get('query', '')}\n"
                conversation_context += f"A{i}: {conv.get('answer', '')[:200]}...\n\n"
        
        # Build guidelines - only mention follow-up if there's previous conversation
        follow_up_instruction = "\n- If this is a follow-up question, refer to the previous conversation" if has_previous_conversation else ""
        
        # Research prompt for generic questions
        research_prompt = f"""You are a friendly financial advisor explaining concepts to beginners.{conversation_context}

User Question: {query}

Provide a CONCISE, STRAIGHTFORWARD answer that gets straight to the point.

Guidelines:
- Start with a simple 1-2 sentence definition
- Use everyday language, avoid jargon
- If you must use technical terms, explain them simply
- Give 1-2 practical examples
- Keep it short and easy to understand
- No lengthy explanations or over-explaining{follow_up_instruction}

CRITICAL - HTML FORMATTING REQUIREMENTS:
- Use ONLY HTML tags - NO Markdown syntax like ** or __ or *
- Use <h2>Main Topic</h2> for headings ONLY (do NOT use h3, h4, or any other heading levels)
- Add <br><br> after each </h2> tag for spacing
- Use <strong>text</strong> for bold emphasis (NOT **text**)
- Use <em>text</em> for italics (NOT *text*)
- PREFER LISTS: Structure most content as bullet points using <ul> and <li>
- Use <p> only for brief introductory sentences
- Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for tabular data
- Do NOT include <html>, <head>, or <body> tags
- Do NOT include citation numbers like [1], [2], [3] - NO citations at all
- Output PURE HTML only - no Markdown

STRUCTURE EXAMPLE:
<h2>Concept Name</h2><br><br>
<p>Brief 1-2 sentence introduction.</p>
<ul>
  <li><strong>Key Point 1:</strong> Explanation</li>
  <li><strong>Key Point 2:</strong> Explanation</li>
  <li><strong>Example:</strong> Practical example</li>
</ul>

Keep your answer under 200 words. Be clear, simple, and helpful."""

        logger.info("Sending generic question to Groq Llama...")
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a friendly financial advisor who explains complex concepts in simple terms. Keep answers short, clear, and beginner-friendly. Use PURE HTML formatting ONLY - use <h2> for headings (NO h3 or h4), structure content as bullet lists with <ul> and <li>, use <strong> for bold. Add <br><br> after headings for spacing. NEVER use Markdown syntax or citation numbers like [1] [2]."
                },
                {
                    "role": "user",
                    "content": research_prompt
                }
            ],
            temperature=0.3,
            max_tokens=800,  # Reduced to enforce conciseness
            top_p=0.9
        )
        
        answer = response.choices[0].message.content.strip()
        
        result = {
            'type': 'generic_question',
            'query': query,
            'answer': answer,
            'format': 'html',
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info("✓ Generic question answered successfully")
        return True, "Question answered successfully", result
    
    except Exception as e:
        logger.error(f"✗ Error handling generic question: {type(e).__name__}: {e}", exc_info=True)
        return False, f"Error answering question: {str(e)}", None


def handle_fundamental_analysis(query, previous_conversation=None, stock_name=None, ticker_name=None):
    """
    Handle fundamental analysis requests using Perplexity with HTML formatting
    
    Args:
        query: User's query
        previous_conversation: List of previous Q&A pairs for context
        stock_name: Company name (optional, extracted from query if not provided)
        ticker_name: Stock ticker (optional, extracted from query if not provided)
    
    Returns:
        tuple: (success: bool, message: str, response: dict or None)
    """
    try:
        logger.info("=== HANDLING FUNDAMENTAL ANALYSIS ===")
        logger.info(f"Query: {query}")
        logger.info(f"Stock Name: {stock_name}, Ticker: {ticker_name}")
        
        # If stock details not provided, try to extract from query
        if not stock_name or not ticker_name:
            logger.info("Extracting stock information from query...")
            
            # Use Groq to extract stock information from query
            if config.GROQ_API_KEY:
                client = Groq(api_key=config.GROQ_API_KEY)
                
                extraction_prompt = f"""Extract the company name and ticker symbol from this query.

Query: "{query}"

Respond in JSON format:
{{
    "stock_name": "Full Company Name",
    "ticker": "TICKER_SYMBOL"
}}

If you cannot identify a specific company, respond with:
{{
    "stock_name": null,
    "ticker": null
}}"""

                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a stock ticker extraction assistant. Always respond with valid JSON."
                        },
                        {
                            "role": "user",
                            "content": extraction_prompt
                        }
                    ],
                    temperature=0.1,
                    max_tokens=100
                )
                
                extraction_result = response.choices[0].message.content.strip()
                
                # Parse JSON response
                try:
                    if "```json" in extraction_result:
                        json_start = extraction_result.find("```json") + 7
                        json_end = extraction_result.find("```", json_start)
                        extraction_data = json.loads(extraction_result[json_start:json_end].strip())
                    else:
                        extraction_data = json.loads(extraction_result)
                    
                    stock_name = extraction_data.get('stock_name')
                    ticker_name = extraction_data.get('ticker')
                    
                    logger.info(f"Extracted - Stock: {stock_name}, Ticker: {ticker_name}")
                except Exception as parse_error:
                    logger.warning(f"Failed to parse extraction result: {parse_error}")
        
        # If we still don't have stock details, return error
        if not stock_name or not ticker_name:
            logger.error("Could not identify company from query")
            return False, "Could not identify a specific company from your query. Please specify the company name or ticker symbol.", None
        
        # Check if Perplexity API key is configured
        if not config.PERPLEXITY_API_KEY:
            logger.error("Perplexity API key not configured")
            return False, "Perplexity API key not configured", None
        
        # Initialize Perplexity client
        client = OpenAI(
            api_key=config.PERPLEXITY_API_KEY,
            base_url="https://api.perplexity.ai"
        )
        
        # Build conversation context
        conversation_context = ""
        if previous_conversation and len(previous_conversation) > 0:
            logger.info(f"Adding conversation context ({len(previous_conversation)} previous exchanges)")
            conversation_context = "\n\nPREVIOUS CONVERSATION:\n"
            for conv in previous_conversation[-3:]:  # Last 3 exchanges
                conversation_context += f"User: {conv.get('query', '')}\n"
                conversation_context += f"Assistant: {conv.get('answer', '')}[:200]...\n\n"
        
        # Comprehensive fundamental analysis prompt with HTML formatting
        research_prompt = f"""You are an expert SEBI-certified stock market advisor with 30+ years of experience in analyzing stocks for long-term investment (5+ years).

{conversation_context}

Provide a comprehensive fundamental analysis for {stock_name} ({ticker_name}) covering:

1. Business Model - B2B, B2C, core focus, key strengths, export presence
2. Financial Performance - Revenue/profit growth, profit margins (10 years)
3. Financial Health - Debt levels, cash flow (10 years)
4. Profitability Metrics - ROE, ROCE
5. Valuation - PE, PB ratios vs industry and historical medians (1, 3, 5, 10 years)
6. Dividends - Dividend history (10 years)
7. Price Movement - Recent price rise/fall reasons
8. Competition - Main competitors, positioning, advantages/disadvantages
9. Capital Expenditure - Capex trends
10. Investment Case - Pros and cons
11. Future Outlook - Business and stock prospects
12. Analyst Opinion - Current analyst views
13. Recent News - Breaking news and developments
14. Legal/Patents - Cases, patents, regulatory matters

Provide detailed, accurate, unbiased analysis based on reliable sources (screener.in, company filings, etc.).

CRITICAL - HTML FORMATTING REQUIREMENTS:
- Use ONLY HTML tags - NO Markdown syntax like ** or __ or *
- Use <h2>Section Name</h2> for each major section ONLY (do NOT use h3, h4, or any other heading levels)
- Add <br><br> after each </h2> tag for spacing between sections
- Use <strong>text</strong> for bold emphasis (NOT **text**)
- Use <em>text</em> for italics (NOT *text*)
- PREFER LISTS: Structure each section's content as bullet points using <ul> and <li>
- Use <p> only for brief section introductions
- Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for financial data (ratios, metrics, comparisons)
- Do NOT include <html>, <head>, or <body> tags - only the content
- Do NOT include citation numbers like [1], [2], [3] - NO citations at all
- Output PURE HTML only - no Markdown mixed in

STRUCTURE EXAMPLE:
<h2>Business Model</h2><br><br>
<ul>
  <li><strong>Type:</strong> B2B/B2C description</li>
  <li><strong>Core Focus:</strong> Main business areas</li>
  <li><strong>Key Strengths:</strong> Competitive advantages</li>
</ul>

<h2>Financial Performance</h2><br><br>
<table>
  <thead><tr><th>Metric</th><th>Value</th><th>Trend</th></tr></thead>
  <tbody>
    <tr><td>Revenue Growth</td><td>X%</td><td>Increasing/Stable</td></tr>
  </tbody>
</table>
<ul>
  <li>Additional insights as bullets</li>
</ul>

Structure ALL sections this way with clear h2 headings, spacing, lists, and tables."""

        logger.info(f"Sending fundamental analysis request for {stock_name} to Perplexity...")
        
        response = client.chat.completions.create(
            model="sonar",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert SEBI-certified stock market advisor. Provide comprehensive fundamental analysis in PURE HTML format ONLY. Use <h2> for section headings ONLY (NO h3 or h4), structure content as bullet lists with <ul> and <li>, use <table> for financial data. Add <br><br> after headings for spacing. NEVER use Markdown syntax or citation numbers like [1] [2]."
                },
                {
                    "role": "user",
                    "content": research_prompt
                }
            ],
            temperature=0.2,
            max_tokens=4000,
            top_p=0.9
        )
        
        answer = response.choices[0].message.content.strip()
        
        result = {
            'type': 'fundamental_analysis',
            'query': query,
            'stock_name': stock_name,
            'ticker': ticker_name,
            'answer': answer,
            'format': 'html',
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info("✓ Fundamental analysis completed successfully")
        return True, "Fundamental analysis completed successfully", result
    
    except Exception as e:
        logger.error(f"✗ Error handling fundamental analysis: {type(e).__name__}: {e}", exc_info=True)
        return False, f"Error performing fundamental analysis: {str(e)}", None


def handle_portfolio_query(query, user_email, portfolio_id=None, previous_conversation=None):
    """
    Handle portfolio-specific queries using Perplexity Sonar with user's portfolio data
    
    Args:
        query: User's portfolio question
        user_email: User's email to fetch portfolio data
        portfolio_id: Optional portfolio ID (defaults to 'default')
        previous_conversation: List of previous Q&A pairs for context
    
    Returns:
        tuple: (success: bool, message: str, response: dict or None)
    """
    try:
        logger.info("=== HANDLING PORTFOLIO QUERY ===")
        logger.info(f"Query: {query}")
        logger.info(f"User Email: {user_email}")
        logger.info(f"Portfolio ID: {portfolio_id}")
        
        if not user_email:
            logger.error("User email not provided")
            return False, "User email is required for portfolio queries", None
        
        if not config.PERPLEXITY_API_KEY:
            logger.error("Perplexity API key not configured")
            return False, "Perplexity API key not configured", None
        
        # Import here to avoid circular dependency
        from services.portfolio_service import PortfolioService
        
        # Fetch user's portfolio data
        portfolio_id = portfolio_id or 'default'
        
        try:
            logger.info(f"Fetching portfolio data for {user_email}...")
            
            # Get comprehensive portfolio data
            portfolio_summary = PortfolioService.get_portfolio_summary(user_email, portfolio_id)
            portfolio_transactions = PortfolioService.get_overall_transactions(user_email, portfolio_id)
            
            logger.info(f"Portfolio data fetched - Holdings: {len(portfolio_summary['symbol_allocations'])}, Transactions: {portfolio_transactions['transaction_count']}")
            
            # Format portfolio data for context
            portfolio_context = f"""
USER PORTFOLIO DATA:

Total Invested: ₹{portfolio_summary['total_invested']:,.2f}
Current Value: ₹{portfolio_summary['total_current_value']:,.2f}
Total Profit/Loss: ₹{portfolio_summary['total_profit']:,.2f}
Return Percentage: {portfolio_summary['return_percent']:.2f}%

XIRR (Portfolio): {portfolio_transactions['portfolio_xirr_percent']:.2f}% if portfolio_transactions['portfolio_xirr_percent'] else 'N/A'
XIRR (Nifty 50 Benchmark): {portfolio_transactions['nifty']['xirr_percent']:.2f}% if portfolio_transactions['nifty']['xirr_percent'] else 'N/A'
Outperformance vs Nifty: {portfolio_transactions['outperformance']:.2f}% if portfolio_transactions['outperformance'] else 'N/A'

HOLDINGS ({len(portfolio_summary['symbol_allocations'])} stocks):
"""
            
            # Add individual stock holdings
            for stock in portfolio_summary['symbol_allocations']:
                portfolio_context += f"""
- {stock['symbol']}:
  Quantity: {stock['quantity']}
  Invested: ₹{stock['invested_amount']:,.2f}
  Current Value: ₹{stock['current_value']:,.2f}
  Current Price: ₹{stock['current_price']:.2f}
  Profit/Loss: ₹{stock['profit']:,.2f}
  Return: {stock['return_percent']:.2f}%
  Portfolio Allocation: {stock['allocation_percent']:.2f}%
"""
            
            # Add transaction history summary
            portfolio_context += f"\n\nTRANSACTION HISTORY ({portfolio_transactions['transaction_count']} transactions):\n"
            for txn in portfolio_transactions['transactions'][:10]:  # Show last 10 transactions
                portfolio_context += f"- {txn['symbol']}: Bought {txn['quantity']} shares on {txn['buy_date']} for ₹{txn['invested_amount']:,.2f}\n"
            
        except Exception as e:
            logger.error(f"Error fetching portfolio data: {e}", exc_info=True)
            return False, f"Could not fetch portfolio data: {str(e)}", None
        
        # Build conversation context
        conversation_context = ""
        if previous_conversation and len(previous_conversation) > 0:
            logger.info(f"Adding conversation context ({len(previous_conversation)} previous exchanges)")
            conversation_context = "\n\nPREVIOUS CONVERSATION:\n"
            for conv in previous_conversation[-5:]:  # Last 5 exchanges
                conversation_context += f"User: {conv.get('query', '')}\n"
                conversation_context += f"Assistant: {conv.get('answer', '')}\n\n"
        
        # Initialize Perplexity client
        client = OpenAI(
            api_key=config.PERPLEXITY_API_KEY,
            base_url="https://api.perplexity.ai"
        )
        
        # Research prompt for portfolio questions
        research_prompt = f"""You are an expert portfolio advisor and stock market consultant with 30+ years of experience.

{portfolio_context}
{conversation_context}

User Question: {query}

Provide a comprehensive, personalized answer based on the user's actual portfolio data above. 

Guidelines:
- Reference specific stocks and numbers from their portfolio
- Provide actionable insights and recommendations
- Consider their XIRR, returns, and allocation
- Compare performance against Nifty 50 benchmark
- Be specific and data-driven
- Explain your reasoning clearly
- If suggesting changes, explain why

CRITICAL - HTML FORMATTING REQUIREMENTS:
- Use ONLY HTML tags - NO Markdown syntax like ** or __ or *
- Use <h2>Section Name</h2> for major sections ONLY (do NOT use h3, h4, or any other heading levels)
- Add <br><br> after each </h2> tag for spacing between sections
- Use <strong>text</strong> for bold emphasis (NOT **text**)
- Use <em>text</em> for italics (NOT *text*)
- PREFER LISTS: Structure most content as bullet points using <ul> and <li>
- Use <p> only for brief section introductions
- Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for portfolio comparisons and metrics
- Do NOT include <html>, <head>, or <body> tags - only the content
- Do NOT include citation numbers like [1], [2], [3] - NO citations at all
- Output PURE HTML only - no Markdown mixed in

STRUCTURE EXAMPLE:
<h2>Performance Overview</h2><br><br>
<ul>
  <li><strong>Total Return:</strong> ₹X,XXX (Y%)</li>
  <li><strong>XIRR:</strong> Z% vs Nifty 50's A%</li>
  <li><strong>Outperformance:</strong> B%</li>
</ul>

<h2>Top Holdings</h2><br><br>
<table>
  <thead><tr><th>Stock</th><th>Allocation</th><th>Return</th></tr></thead>
  <tbody>
    <tr><td>STOCK1</td><td>X%</td><td>Y%</td></tr>
  </tbody>
</table>

<h2>Recommendations</h2><br><br>
<ul>
  <li><strong>Action 1:</strong> Specific recommendation with reasoning</li>
  <li><strong>Action 2:</strong> Another recommendation</li>
</ul>

Structure your entire response this way with clear h2 headings, spacing, lists, and tables."""

        logger.info("Sending portfolio query to Perplexity Sonar...")
        
        response = client.chat.completions.create(
            model="sonar",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert portfolio advisor. Provide personalized, data-driven advice in PURE HTML format ONLY. Use <h2> for section headings ONLY (NO h3 or h4), structure content as bullet lists with <ul> and <li>, use <table> for metrics. Add <br><br> after headings for spacing. NEVER use Markdown syntax or citation numbers like [1] [2]."
                },
                {
                    "role": "user",
                    "content": research_prompt
                }
            ],
            temperature=0.3,
            max_tokens=2500,
            top_p=0.9
        )
        
        answer = response.choices[0].message.content.strip()
        
        result = {
            'type': 'portfolio_query',
            'query': query,
            'answer': answer,
            'format': 'html',
            'portfolio_summary': {
                'total_invested': portfolio_summary['total_invested'],
                'current_value': portfolio_summary['total_current_value'],
                'total_profit': portfolio_summary['total_profit'],
                'return_percent': portfolio_summary['return_percent'],
                'xirr_percent': portfolio_transactions['portfolio_xirr_percent'],
                'holdings_count': len(portfolio_summary['symbol_allocations'])
            },
            'generated_at': datetime.now().isoformat()
        }
        
        logger.info("✓ Portfolio query answered successfully")
        return True, "Portfolio query answered successfully", result
    
    except Exception as e:
        logger.error(f"✗ Error handling portfolio query: {type(e).__name__}: {e}", exc_info=True)
        return False, f"Error answering portfolio query: {str(e)}", None


def process_copilot_query(query, classification, user_email=None, portfolio_id=None, previous_conversation=None):
    """
    Main copilot function that routes queries to appropriate handlers
    
    Args:
        query: User's input query
        classification: REQUIRED classification (greeting, company_fundamental, generic_company_question, portfolio_queries)
        user_email: User's email (required for portfolio queries)
        portfolio_id: Portfolio ID (optional, defaults to 'default')
        previous_conversation: List of previous Q&A pairs for context
    
    Returns:
        tuple: (success: bool, message: str, response: dict or None)
    """
    try:
        logger.info("\n" + "="*60)
        logger.info("=== COPILOT QUERY PROCESSING ===")
        logger.info("="*60)
        logger.info(f"Query: {query}")
        logger.info(f"Classification: {classification}")
        logger.info(f"User Email: {user_email}")
        logger.info(f"Portfolio ID: {portfolio_id}")
        
        # Validate classification
        valid_classifications = ['greeting', 'company_fundamental', 'generic_company_question', 'portfolio_queries']
        if not classification:
            logger.error("Classification is required")
            return False, "Classification is required. Valid options: greeting, company_fundamental, generic_company_question, portfolio_queries", None
        
        if classification not in valid_classifications:
            logger.error(f"Invalid classification '{classification}'. Valid options: {valid_classifications}")
            return False, f"Invalid classification '{classification}'. Valid options: {', '.join(valid_classifications)}", None
        
        logger.info("-" * 60)
        
        # Route to appropriate handler based on classification
        if classification == 'greeting':
            return handle_greeting(query)
        
        elif classification == 'generic_company_question':
            return handle_generic_question(query, previous_conversation)
        
        elif classification == 'company_fundamental':
            return handle_fundamental_analysis(query, previous_conversation)
        
        elif classification == 'portfolio_queries':
            if not user_email:
                logger.error("Portfolio query requires user email")
                return False, "User email is required for portfolio queries. Please provide your email.", None
            return handle_portfolio_query(query, user_email, portfolio_id, previous_conversation)
        
        else:
            # Fallback to generic question
            logger.warning(f"Unknown classification '{classification}', falling back to generic question")
            return handle_generic_question(query)
    
    except Exception as e:
        logger.error(f"✗ Error in copilot query processing: {type(e).__name__}: {e}", exc_info=True)
        return False, f"Error processing query: {str(e)}", None
