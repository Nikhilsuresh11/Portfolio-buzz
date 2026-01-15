from flask import Blueprint
from controllers.auth_controller import AuthController

# Create auth blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Register Google OAuth route
auth_bp.route('/google', methods=['POST'])(AuthController.google_auth)
