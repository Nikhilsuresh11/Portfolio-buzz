from flask import Blueprint
from controllers.copilot_controller import copilot_query

copilot_bp = Blueprint('copilot', __name__, url_prefix='/api')

# Copilot endpoint
copilot_bp.route('/copilot', methods=['POST'])(copilot_query)
