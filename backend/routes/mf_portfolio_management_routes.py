"""
Mutual Fund Portfolio Management Routes
Handles MF watchlist creation, update, and deletion per portfolio
"""

from flask import Blueprint, request, jsonify
from models.user_portfolio import UserPortfolio
from models.mf_user_watchlist import MFUserWatchlist

mf_portfolio_management_bp = Blueprint('mf_portfolio_management', __name__, url_prefix='/api/<string:user_email>/mf-portfolio-management')

# ==================== MF WATCHLIST ROUTES ====================

@mf_portfolio_management_bp.route('/portfolios/<portfolio_id>/watchlists', methods=['GET'])
def get_portfolio_mf_watchlists(user_email, portfolio_id):
    """Get all MF watchlists for a portfolio"""
    try:
        watchlists = MFUserWatchlist.get_portfolio_watchlists(user_email, portfolio_id)
        return jsonify({"success": True, "watchlists": watchlists})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@mf_portfolio_management_bp.route('/watchlists', methods=['GET'])
def get_all_mf_watchlists(user_email):
    """Get all MF watchlists for the user"""
    try:
        watchlists = MFUserWatchlist.get_user_watchlists(user_email)
        return jsonify({"success": True, "watchlists": watchlists})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@mf_portfolio_management_bp.route('/watchlists', methods=['POST'])
def create_mf_watchlist(user_email):
    """Create a new MF watchlist"""
    try:
        data = request.json
        print(f"[MF Watchlist] Creating watchlist for user: {user_email}")
        print(f"[MF Watchlist] Request data: {data}")
        
        portfolio_id = data.get('portfolio_id')
        watchlist_name = data.get('watchlist_name')
        description = data.get('description', '')
        is_default = data.get('is_default', False)
        
        if not portfolio_id or not watchlist_name:
            print(f"[MF Watchlist] Missing required fields")
            return jsonify({"success": False, "message": "portfolio_id and watchlist_name are required"}), 400
        
        print(f"[MF Watchlist] Creating: {watchlist_name} for portfolio: {portfolio_id}")
        watchlist = MFUserWatchlist.create_watchlist(
            user_email,
            portfolio_id,
            watchlist_name,
            description,
            is_default
        )
        
        print(f"[MF Watchlist] Created successfully: {watchlist}")
        return jsonify({"success": True, "watchlist": watchlist}), 201
    except Exception as e:
        print(f"[MF Watchlist] Error creating watchlist: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@mf_portfolio_management_bp.route('/watchlists/<watchlist_id>', methods=['GET'])
def get_mf_watchlist(user_email, watchlist_id):
    """Get a specific MF watchlist"""
    try:
        watchlist = MFUserWatchlist.get_watchlist(user_email, watchlist_id)
        if not watchlist:
            return jsonify({"success": False, "message": "Watchlist not found"}), 404
        return jsonify({"success": True, "watchlist": watchlist})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@mf_portfolio_management_bp.route('/watchlists/<watchlist_id>', methods=['PUT'])
def update_mf_watchlist(user_email, watchlist_id):
    """Update a MF watchlist"""
    try:
        data = request.json
        watchlist = MFUserWatchlist.update_watchlist(user_email, watchlist_id, data)
        if not watchlist:
            return jsonify({"success": False, "message": "Watchlist not found or update failed"}), 404
        return jsonify({"success": True, "watchlist": watchlist})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@mf_portfolio_management_bp.route('/watchlists/<watchlist_id>', methods=['DELETE'])
def delete_mf_watchlist(user_email, watchlist_id):
    """Delete a MF watchlist"""
    try:
        watchlist = MFUserWatchlist.delete_watchlist(user_email, watchlist_id)
        if not watchlist:
            return jsonify({"success": False, "message": "Watchlist not found"}), 404
        return jsonify({"success": True, "message": "Watchlist deleted", "watchlist": watchlist})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@mf_portfolio_management_bp.route('/portfolios/<portfolio_id>/watchlists/default', methods=['GET'])
def get_default_mf_watchlist(user_email, portfolio_id):
    """Get default MF watchlist for a portfolio"""
    try:
        watchlist = MFUserWatchlist.get_default_watchlist(user_email, portfolio_id)
        if not watchlist:
            return jsonify({"success": False, "message": "No default watchlist found"}), 404
        return jsonify({"success": True, "watchlist": watchlist})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
