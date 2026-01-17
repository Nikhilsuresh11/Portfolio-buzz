"""
Mutual Fund Routes
Flask blueprint for mutual fund endpoints
"""

from flask import Blueprint
from controllers.mf_controller import MFController, MFWatchlistController

# Create mutual fund blueprint
mf_bp = Blueprint('mf', __name__, url_prefix='/api')

# Search and discovery routes
mf_bp.route('/mf/search', methods=['GET'])(MFController.search_funds)
mf_bp.route('/mf/popular', methods=['GET'])(MFController.get_popular_funds)
mf_bp.route('/mf/<scheme_code>/nav', methods=['GET'])(MFController.get_fund_nav)
mf_bp.route('/mf/<scheme_code>/nav-on-date', methods=['GET'])(MFController.get_nav_on_date)
mf_bp.route('/mf/<scheme_code>/performance', methods=['GET'])(MFController.get_fund_performance)

# Watchlist routes
mf_bp.route('/<user_email>/mf/watchlist', methods=['GET'])(MFWatchlistController.get_watchlist)
mf_bp.route('/<user_email>/mf/watchlist', methods=['POST'])(MFWatchlistController.add_to_watchlist)
mf_bp.route('/<user_email>/mf/watchlist/<scheme_code>', methods=['DELETE'])(MFWatchlistController.remove_from_watchlist)
mf_bp.route('/<user_email>/mf/watchlist/navs', methods=['GET'])(MFWatchlistController.get_watchlist_navs)
