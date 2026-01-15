from flask import Blueprint
from controllers.notification_controller import NotificationController

# Create notification blueprint
notification_bp = Blueprint('notification', __name__, url_prefix='/api/<string:user_email>/notifications')

# Register routes
notification_bp.route('', methods=['GET'])(NotificationController.get_notifications)
