from flask import Blueprint, request, jsonify
from models.user_portfolio import UserPortfolio, UserWatchlist
from utils.jwt_helper import token_required

portfolio_management_bp = Blueprint('portfolio_management', __name__, url_prefix='/api/portfolio-management')

# ==================== PORTFOLIO ROUTES ====================

@portfolio_management_bp.route('/portfolios', methods=['GET'])
@token_required
def get_portfolios(current_user_email):
    """Get all portfolios for the current user"""
    try:
        portfolios = UserPortfolio.get_user_portfolios(current_user_email)
        return jsonify({"success": True, "portfolios": portfolios})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/portfolios', methods=['POST'])
@token_required
def create_portfolio(current_user_email):
    """Create a new portfolio"""
    try:
        data = request.json
        portfolio_name = data.get('portfolio_name')
        description = data.get('description', '')
        is_default = data.get('is_default', False)
        
        if not portfolio_name:
            return jsonify({"success": False, "message": "portfolio_name is required"}), 400
        
        portfolio = UserPortfolio.create_portfolio(
            current_user_email,
            portfolio_name,
            description,
            is_default
        )
        
        return jsonify({"success": True, "portfolio": portfolio}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/portfolios/<portfolio_id>', methods=['GET'])
@token_required
def get_portfolio(current_user_email, portfolio_id):
    """Get a specific portfolio"""
    try:
        portfolio = UserPortfolio.get_portfolio(current_user_email, portfolio_id)
        if not portfolio:
            return jsonify({"success": False, "message": "Portfolio not found"}), 404
        return jsonify({"success": True, "portfolio": portfolio})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/portfolios/<portfolio_id>', methods=['PUT'])
@token_required
def update_portfolio(current_user_email, portfolio_id):
    """Update a portfolio"""
    try:
        data = request.json
        portfolio = UserPortfolio.update_portfolio(current_user_email, portfolio_id, data)
        if not portfolio:
            return jsonify({"success": False, "message": "Portfolio not found or update failed"}), 404
        return jsonify({"success": True, "portfolio": portfolio})
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/portfolios/<portfolio_id>', methods=['DELETE'])
@token_required
def delete_portfolio(current_user_email, portfolio_id):
    """Delete a portfolio"""
    try:
        portfolio = UserPortfolio.delete_portfolio(current_user_email, portfolio_id)
        if not portfolio:
            return jsonify({"success": False, "message": "Portfolio not found"}), 404
        return jsonify({"success": True, "message": "Portfolio deleted", "portfolio": portfolio})
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/portfolios/default', methods=['GET'])
@token_required
def get_default_portfolio(current_user_email):
    """Get user's default portfolio"""
    try:
        portfolio = UserPortfolio.get_default_portfolio(current_user_email)
        if not portfolio:
            return jsonify({"success": False, "message": "No default portfolio found"}), 404
        return jsonify({"success": True, "portfolio": portfolio})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ==================== WATCHLIST ROUTES ====================

@portfolio_management_bp.route('/portfolios/<portfolio_id>/watchlists', methods=['GET'])
@token_required
def get_portfolio_watchlists(current_user_email, portfolio_id):
    """Get all watchlists for a portfolio"""
    try:
        watchlists = UserWatchlist.get_portfolio_watchlists(current_user_email, portfolio_id)
        return jsonify({"success": True, "watchlists": watchlists})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/watchlists', methods=['GET'])
@token_required
def get_all_watchlists(current_user_email):
    """Get all watchlists for the user"""
    try:
        watchlists = UserWatchlist.get_user_watchlists(current_user_email)
        return jsonify({"success": True, "watchlists": watchlists})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/watchlists', methods=['POST'])
@token_required
def create_watchlist(current_user_email):
    """Create a new watchlist"""
    try:
        data = request.json
        portfolio_id = data.get('portfolio_id')
        watchlist_name = data.get('watchlist_name')
        description = data.get('description', '')
        is_default = data.get('is_default', False)
        
        if not portfolio_id or not watchlist_name:
            return jsonify({"success": False, "message": "portfolio_id and watchlist_name are required"}), 400
        
        watchlist = UserWatchlist.create_watchlist(
            current_user_email,
            portfolio_id,
            watchlist_name,
            description,
            is_default
        )
        
        return jsonify({"success": True, "watchlist": watchlist}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/watchlists/<watchlist_id>', methods=['GET'])
@token_required
def get_watchlist(current_user_email, watchlist_id):
    """Get a specific watchlist"""
    try:
        watchlist = UserWatchlist.get_watchlist(current_user_email, watchlist_id)
        if not watchlist:
            return jsonify({"success": False, "message": "Watchlist not found"}), 404
        return jsonify({"success": True, "watchlist": watchlist})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/watchlists/<watchlist_id>', methods=['PUT'])
@token_required
def update_watchlist(current_user_email, watchlist_id):
    """Update a watchlist"""
    try:
        data = request.json
        watchlist = UserWatchlist.update_watchlist(current_user_email, watchlist_id, data)
        if not watchlist:
            return jsonify({"success": False, "message": "Watchlist not found or update failed"}), 404
        return jsonify({"success": True, "watchlist": watchlist})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/watchlists/<watchlist_id>', methods=['DELETE'])
@token_required
def delete_watchlist(current_user_email, watchlist_id):
    """Delete a watchlist"""
    try:
        watchlist = UserWatchlist.delete_watchlist(current_user_email, watchlist_id)
        if not watchlist:
            return jsonify({"success": False, "message": "Watchlist not found"}), 404
        return jsonify({"success": True, "message": "Watchlist deleted", "watchlist": watchlist})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
