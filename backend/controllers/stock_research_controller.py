from flask import request
from services.stock_research_service import get_fundamental_research
from utils.response import success_response, error_response


def get_stock_research():
    """
    POST /api/stock-research
    Generate comprehensive fundamental research for a stock
    
    Request body:
    {
        "stock_name": "Apple Inc",
        "ticker_name": "AAPL"
    }
    
    Response:
    {
        "success": true,
        "data": {
            "stock_name": "Apple Inc",
            "ticker": "AAPL",
            "business_model": "...",
            "core_focus": "...",
            ... (all 17 analysis points)
            "generated_at": "2024-12-09T22:21:00"
        },
        "error": null
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        stock_name = data.get('stock_name', '').strip()
        ticker_name = data.get('ticker_name', '').strip()
        
        if not stock_name:
            return error_response("stock_name is required", 400)
        
        if not ticker_name:
            return error_response("ticker_name is required", 400)
        
        # Call the service function
        success, message, result = get_fundamental_research(stock_name, ticker_name)
        
        if success:
            return success_response(result, message, 200)
        else:
            return error_response(message, 400)
    
    except Exception as e:
        return error_response(f"Error generating stock research: {str(e)}", 500)
