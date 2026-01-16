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


def handle_generic_question(query):
    """
    Handle generic company/market questions using Perplexity Sonar
    
    Args:
        query: User's generic question
    
    Returns:
        tuple: (success: bool, message: str, response: dict or None)
    """
    try:
        logger.info("=== HANDLING GENERIC QUESTION ===")
        logger.info(f"Query: {query}")
        
        if not config.PERPLEXITY_API_KEY:
            logger.error("Perplexity API key not configured")
            return False, "Perplexity API key not configured", None
        
        # Initialize Perplexity client
        client = OpenAI(
            api_key=config.PERPLEXITY_API_KEY,
            base_url="https://api.perplexity.ai"
        )
        
        # Research prompt for generic questions
        research_prompt = f"""You are an expert stock market advisor and consultant with 30+ years of experience.

User Question: {query}

Provide a comprehensive, well-researched answer based on reliable sources. 

Guidelines:
- Be factual and accurate
- Use reliable financial sources
- Explain concepts clearly
- Provide practical insights
- Include examples where relevant
- Keep the response structured and easy to read

IMPORTANT: Format your response in clean HTML using these tags:
- Use <h3> for main headings
- Use <h4> for subheadings
- Use <p> for paragraphs
- Use <ul> and <li> for bullet points
- Use <strong> for emphasis
- Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for tables if needed
- Do NOT include <html>, <head>, or <body> tags - only the content

Provide your answer in well-formatted HTML."""

        logger.info("Sending generic question to Perplexity Sonar...")
        
        response = client.chat.completions.create(
            model="sonar",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert stock market advisor. Provide accurate, well-researched answers in HTML format. Use proper HTML tags for structure."
                },
                {
                    "role": "user",
                    "content": research_prompt
                }
            ],
            temperature=0.3,
            max_tokens=2000,
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


def handle_fundamental_analysis(query, stock_name=None, ticker_name=None):
    """
    Handle fundamental analysis requests using existing Perplexity research
    
    Args:
        query: User's query
        stock_name: Company name (optional, extracted from query if not provided)
        ticker_name: Stock ticker (optional, extracted from query if not provided)
    
    Returns:
        tuple: (success: bool, message: str, response: dict or None)
    """
    try:
        logger.info("=== HANDLING FUNDAMENTAL ANALYSIS ===")
        logger.info(f"Query: {query}")
        logger.info(f"Stock Name: {stock_name}, Ticker: {ticker_name}")
        
        # Import here to avoid circular dependency
        from services.stock_research_service import get_fundamental_research
        
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
        
        # Call existing fundamental research service
        logger.info(f"Calling fundamental research for {stock_name} ({ticker_name})...")
        success, message, research_data = get_fundamental_research(stock_name, ticker_name)
        
        if success:
            # Add type identifier
            research_data['type'] = 'fundamental_analysis'
            logger.info("✓ Fundamental analysis completed successfully")
            return True, message, research_data
        else:
            logger.error(f"Fundamental analysis failed: {message}")
            return False, message, None
    
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

IMPORTANT: Format your response in clean HTML using these tags:
- Use <h3> for main headings (e.g., "Portfolio Analysis", "Recommendations")
- Use <h4> for subheadings
- Use <p> for paragraphs
- Use <ul> and <li> for bullet points
- Use <strong> for emphasis on stock names and numbers
- Use <table>, <thead>, <tbody>, <tr>, <th>, <td> for comparison tables
- Do NOT include <html>, <head>, or <body> tags - only the content
- Make numbers stand out with <strong> tags

Provide your answer in well-formatted HTML for easy reading."""

        logger.info("Sending portfolio query to Perplexity Sonar...")
        
        response = client.chat.completions.create(
            model="sonar",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert portfolio advisor. Provide personalized, data-driven advice in HTML format. Use proper HTML tags for structure, tables, and emphasis."
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
            return handle_generic_question(query)
        
        elif classification == 'company_fundamental':
            return handle_fundamental_analysis(query)
        
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
