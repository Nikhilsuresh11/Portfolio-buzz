from flask import Blueprint
from controllers.search_controller import SearchController

# Create search blueprint
search_bp = Blueprint('search', __name__, url_prefix='/api/search')

# Register routes
search_bp.route('', methods=['GET'])(SearchController.search_stocks)
search_bp.route('/default', methods=['GET'])(SearchController.get_default_stocks)
search_bp.route('/autocomplete', methods=['GET'])(SearchController.autocomplete)
