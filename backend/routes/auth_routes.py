from flask import Blueprint
from controllers.auth_controller import AuthController

# Create auth blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Register routes
auth_bp.route('/login', methods=['POST'])(AuthController.login)
auth_bp.route('/signup', methods=['POST'])(AuthController.signup)
