from flask import Blueprint
from controllers.email_alert_controller import EmailAlertController

email_alert_bp = Blueprint('email_alert', __name__, url_prefix='/api/email')

@email_alert_bp.route('/alert', methods=['POST'])
def check_and_send_alerts():
    """
    Check watchlist stocks for 5%+ drops and send email alerts
    
    Headers:
        Authorization: Bearer <jwt_token>
    
    Returns:
        JSON response with alerts sent
    """
    return EmailAlertController.check_and_send_alerts()
