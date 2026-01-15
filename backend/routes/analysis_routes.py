from flask import Blueprint
from controllers.analysis_controller import AnalysisController

# Create analysis blueprint
analysis_bp = Blueprint('analysis', __name__, url_prefix='/api')

# Register routes
analysis_bp.route('/key-insights', methods=['POST'])(AnalysisController.generate_key_insights)
analysis_bp.route('/<string:user_email>/key-insights/watchlist', methods=['POST'])(AnalysisController.generate_watchlist_insights)

# News routes - support both with and without days parameter
analysis_bp.route('/news', methods=['GET'])(AnalysisController.get_news_by_days)
analysis_bp.route('/news/<int:days>', methods=['GET'])(AnalysisController.get_news_by_days)
