from flask import Blueprint, request, jsonify
from models.user_portfolio import UserPortfolio, UserWatchlist

portfolio_management_bp = Blueprint('portfolio_management', __name__, url_prefix='/api/<string:user_email>/portfolio-management')

# ==================== PORTFOLIO ROUTES ====================

@portfolio_management_bp.route('/portfolios', methods=['GET'])
def get_portfolios(user_email):
    """Get all portfolios for the current user"""
    try:
        portfolios = UserPortfolio.get_user_portfolios(user_email)
        return jsonify({"success": True, "portfolios": portfolios})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/portfolios', methods=['POST'])
def create_portfolio(user_email):
    """Create a new portfolio"""
    try:
        data = request.json
        portfolio_name = data.get('portfolio_name')
        description = data.get('description', '')
        is_default = data.get('is_default', False)
        
        if not portfolio_name:
            return jsonify({"success": False, "message": "portfolio_name is required"}), 400
        
        portfolio = UserPortfolio.create_portfolio(
            user_email,
            portfolio_name,
            description,
            is_default
        )
        
        return jsonify({"success": True, "portfolio": portfolio}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/portfolios/<portfolio_id>', methods=['GET'])
def get_portfolio(user_email, portfolio_id):
    """Get a specific portfolio"""
    try:
        portfolio = UserPortfolio.get_portfolio(user_email, portfolio_id)
        if not portfolio:
            return jsonify({"success": False, "message": "Portfolio not found"}), 404
        return jsonify({"success": True, "portfolio": portfolio})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/portfolios/<portfolio_id>', methods=['PUT'])
def update_portfolio(user_email, portfolio_id):
    """Update a portfolio"""
    try:
        data = request.json
        portfolio = UserPortfolio.update_portfolio(user_email, portfolio_id, data)
        if not portfolio:
            return jsonify({"success": False, "message": "Portfolio not found or update failed"}), 404
        return jsonify({"success": True, "portfolio": portfolio})
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/portfolios/<portfolio_id>', methods=['DELETE'])
def delete_portfolio(user_email, portfolio_id):
    """Delete a portfolio"""
    try:
        portfolio = UserPortfolio.delete_portfolio(user_email, portfolio_id)
        if not portfolio:
            return jsonify({"success": False, "message": "Portfolio not found"}), 404
        return jsonify({"success": True, "message": "Portfolio deleted", "portfolio": portfolio})
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/portfolios/default', methods=['GET'])
def get_default_portfolio(user_email):
    """Get user's default portfolio"""
    try:
        portfolio = UserPortfolio.get_default_portfolio(user_email)
        if not portfolio:
            return jsonify({"success": False, "message": "No default portfolio found"}), 404
        return jsonify({"success": True, "portfolio": portfolio})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ==================== WATCHLIST ROUTES ====================

@portfolio_management_bp.route('/portfolios/<portfolio_id>/watchlists', methods=['GET'])
def get_portfolio_watchlists(user_email, portfolio_id):
    """Get all watchlists for a portfolio"""
    try:
        watchlists = UserWatchlist.get_portfolio_watchlists(user_email, portfolio_id)
        return jsonify({"success": True, "watchlists": watchlists})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/watchlists', methods=['GET'])
def get_all_watchlists(user_email):
    """Get all watchlists for the user"""
    try:
        watchlists = UserWatchlist.get_user_watchlists(user_email)
        return jsonify({"success": True, "watchlists": watchlists})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/watchlists', methods=['POST'])
def create_watchlist(user_email):
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
            user_email,
            portfolio_id,
            watchlist_name,
            description,
            is_default
        )
        
        return jsonify({"success": True, "watchlist": watchlist}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/watchlists/<watchlist_id>', methods=['GET'])
def get_watchlist(user_email, watchlist_id):
    """Get a specific watchlist"""
    try:
        watchlist = UserWatchlist.get_watchlist(user_email, watchlist_id)
        if not watchlist:
            return jsonify({"success": False, "message": "Watchlist not found"}), 404
        return jsonify({"success": True, "watchlist": watchlist})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/watchlists/<watchlist_id>', methods=['PUT'])
def update_watchlist(user_email, watchlist_id):
    """Update a watchlist"""
    try:
        data = request.json
        watchlist = UserWatchlist.update_watchlist(user_email, watchlist_id, data)
        if not watchlist:
            return jsonify({"success": False, "message": "Watchlist not found or update failed"}), 404
        return jsonify({"success": True, "watchlist": watchlist})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@portfolio_management_bp.route('/watchlists/<watchlist_id>', methods=['DELETE'])
def delete_watchlist(user_email, watchlist_id):
    """Delete a watchlist"""
    try:
        watchlist = UserWatchlist.delete_watchlist(user_email, watchlist_id)
        if not watchlist:
            return jsonify({"success": False, "message": "Watchlist not found"}), 404
        return jsonify({"success": True, "message": "Watchlist deleted", "watchlist": watchlist})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
