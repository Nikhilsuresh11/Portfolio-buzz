from flask import Blueprint
from controllers.stock_research_controller import get_stock_research

# Create stock research blueprint
stock_research_bp = Blueprint('stock_research', __name__, url_prefix='/api')

# Register route
stock_research_bp.route('/stock-research', methods=['POST'])(get_stock_research)
