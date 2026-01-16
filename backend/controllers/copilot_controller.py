from flask import request
from services.copilot_service import process_copilot_query
from utils.response import success_response, error_response


def copilot_query():
    """
    POST /api/copilot
    Process user query through the copilot with required classification
    
    Request body:
    {
        "query": "What is PE ratio?",
        "classification": "generic_company_question",  // REQUIRED: greeting, company_fundamental, generic_company_question, portfolio_queries
        "user_email": "user@example.com",  // Required for portfolio_queries
        "portfolio_id": "default",  // Optional, defaults to 'default'
        "previous_conversation": [  // Optional conversation history
            {
                "query": "How is my portfolio?",
                "answer": "Your portfolio is performing well..."
            }
        ]
    }
    
    Response:
    {
        "success": true,
        "data": {
            "type": "greeting|generic_question|fundamental_analysis|portfolio_query",
            "response": "...",  // For greeting
            "answer": "...",    // For generic questions and portfolio queries
            // OR full fundamental analysis data for company_fundamental
            "portfolio_summary": {...},  // For portfolio queries
            "generated_at": "2024-12-09T22:21:00"
        },
        "error": null
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return error_response("Request body is required", 400)
        
        query = data.get('query', '').strip()
        classification = data.get('classification', '').strip()
        
        if not query:
            return error_response("query is required", 400)
        
        if not classification:
            return error_response("classification is required. Valid options: greeting, company_fundamental, generic_company_question, portfolio_queries", 400)
        
        # Extract parameters
        user_email = data.get('user_email', '').strip() or None
        portfolio_id = data.get('portfolio_id', '').strip() or 'default'
        previous_conversation = data.get('previous_conversation', [])
        
        # Validate previous_conversation format
        if not isinstance(previous_conversation, list):
            previous_conversation = []
        
        # Process through copilot
        success, message, result = process_copilot_query(
            query=query,
            classification=classification,
            user_email=user_email,
            portfolio_id=portfolio_id,
            previous_conversation=previous_conversation
        )
        
        if success:
            return success_response(result, message, 200)
        else:
            return error_response(message, 400)
    
    except Exception as e:
        return error_response(f"Error processing copilot query: {str(e)}", 500)
