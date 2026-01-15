from flask import Blueprint
from controllers.watchlist_controller import WatchlistController

# Create watchlist blueprint
watchlist_bp = Blueprint('watchlist', __name__, url_prefix='/api/<string:user_email>/watchlist')

# Register routes
watchlist_bp.route('', methods=['GET'])(WatchlistController.get_watchlist)
watchlist_bp.route('', methods=['POST'])(WatchlistController.add_to_watchlist)
watchlist_bp.route('/<string:ticker>', methods=['DELETE'])(WatchlistController.remove_from_watchlist)
watchlist_bp.route('/news', methods=['GET'])(WatchlistController.get_watchlist_news)
watchlist_bp.route('/price', methods=['GET'])(WatchlistController.get_watchlist_prices)
