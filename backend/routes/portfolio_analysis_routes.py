from flask import Blueprint
from controllers.portfolio_analysis_controller import PortfolioAnalysisController

# Create blueprint
portfolio_analysis_bp = Blueprint('portfolio_analysis', __name__, url_prefix='/api/analysis')

# Register routes
portfolio_analysis_bp.route('/portfolio', methods=['GET'])(PortfolioAnalysisController.get_portfolio_analysis)
