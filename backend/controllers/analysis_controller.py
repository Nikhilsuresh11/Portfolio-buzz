from flask import request
from services.analysis_service import AnalysisService
from services.news_service import NewsService
from utils.response import success_response, error_response
from utils.jwt_helper import token_required, optional_token
from utils.date_utils import validate_days_parameter, get_default_days, ALLOWED_DAYS


class AnalysisController:
    """Analysis controller for AI-powered stock analysis"""
    
    @staticmethod
    @token_required
    def generate_ai_insight(current_user_email):
        """
        POST /ai-insight
        Generate AI-powered stock analysis
        
        Headers:
        Authorization: Bearer <jwt_token>
        
        Request body:
        {
            "stock_name": "Apple",
            "ticker": "AAPL"  // optional
        }
        
        Response:
        {
            "success": true,
            "data": {
                "stock": "APPLE",
                "ticker": "AAPL",
                "analysis": "...comprehensive analysis...",
                "articles_analyzed": 25,
                "generated_at": "2024-12-04T23:00:00"
            },
            "error": null
        }
        """
        try:
            data = request.get_json()
            
            if not data or 'stock_name' not in data:
                return error_response("stock_name is required", 400)
            
            stock_name = data.get('stock_name', '').strip()
            ticker = data.get('ticker', '').strip() if data.get('ticker') else None
            
            if not stock_name:
                return error_response("stock_name cannot be empty", 400)
            
            success, message, result = AnalysisService.generate_ai_insight(stock_name, ticker)
            
            if success:
                return success_response(result, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error generating analysis: {str(e)}", 500)
    
    @staticmethod
    @optional_token
    def get_news_by_days(current_user_email=None, days=None):
        """
        GET /news or /news/<days>
        Get news for the last N days (defaults to 2 days)
        
        Path parameters:
        - days: Number of days (1, 3, 7, 15, 30, 90) - optional, defaults to 2
        
        Query parameters:
        - stock_name: Stock name or ticker (required)
        - ticker: Stock ticker (optional)
        
        Response:
        {
            "success": true,
            "data": [
                {
                    "title": "...",
                    "content": "...",
                    "source": "Reuters",
                    "premium": false,
                    "published_at": "2024-12-04T10:00:00"
                }
            ],
            "error": null
        }
        """
        try:
            # Use default days if not provided
            if days is None:
                days = get_default_days()
            
            # Validate days parameter
            is_valid, error_msg = validate_days_parameter(days)
            if not is_valid:
                print(f"[NEWS] ❌ Invalid days parameter: {error_msg}")
                return error_response(error_msg, 400)
            
            days = int(days)
            
            stock_name = request.args.get('stock_name', '').strip()
            ticker = request.args.get('ticker', '').strip() if request.args.get('ticker') else None
            
            print(f"\n[NEWS] 📰 Request: stock_name='{stock_name}', ticker='{ticker}', days={days}")
            
            if not stock_name:
                print(f"[NEWS] ❌ Missing stock_name parameter")
                return error_response("stock_name query parameter is required", 400)
            
            print(f"[NEWS] 🔍 Fetching news for {stock_name}...")
            success, message, articles = NewsService.fetch_news_by_days(stock_name, ticker, days)
            
            if success:
                # Include summary
                summary = NewsService.get_news_summary(articles)
                print(f"[NEWS] ✅ Success: {len(articles)} articles from {len(summary.get('sources', []))} sources")
                print(f"[NEWS] 📊 Summary: {summary.get('total_articles', 0)} total, {summary.get('free_count', 0)} free, {summary.get('premium_count', 0)} premium")
                return success_response({
                    'articles': articles,
                    'summary': summary,
                    'days': days
                }, message, 200)
            else:
                print(f"[NEWS] ❌ Failed: {message}")
                return error_response(message, 400)
        
        except Exception as e:
            print(f"[NEWS] ❌ Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return error_response(f"Error fetching news: {str(e)}", 500)
    
    @staticmethod
    @token_required
    def generate_key_insights(current_user_email):
        """
        POST /key-insights
        Generate concise key insights (3-5 bullet points)
        
        Headers:
        Authorization: Bearer <jwt_token>
        
        Request body:
        {
            "stock_name": "Apple",
            "ticker": "AAPL"  // optional
        }
        
        Response:
        {
            "success": true,
            "data": {
                "stock": "APPLE",
                "ticker": "AAPL",
                "insights": "• Bullet 1\n• Bullet 2\n• Bullet 3",
                "bullet_points": ["Bullet 1", "Bullet 2", "Bullet 3"],
                "generated_at": "2024-12-04T23:00:00"
            },
            "error": null
        }
        """
        try:
            data = request.get_json()
            
            if not data or 'stock_name' not in data:
                return error_response("stock_name is required", 400)
            
            stock_name = data.get('stock_name', '').strip()
            ticker = data.get('ticker', '').strip() if data.get('ticker') else None
            
            if not stock_name:
                return error_response("stock_name cannot be empty", 400)
            
            success, message, result = AnalysisService.generate_key_insights(stock_name, ticker)
            
            if success:
                return success_response(result, message, 200)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            return error_response(f"Error generating insights: {str(e)}", 500)
