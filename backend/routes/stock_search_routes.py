from flask import Blueprint
from controllers.stock_search_controller import StockSearchController

# Create stock search blueprint
stock_search_bp = Blueprint('stock_search', __name__, url_prefix='/api')

# Register routes
stock_search_bp.route('/search-stock', methods=['GET'])(StockSearchController.search_stock)
