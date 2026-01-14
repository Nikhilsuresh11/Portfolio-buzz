from flask import request
from services.notification_service import NotificationService
from utils.response import success_response, error_response
from utils.jwt_helper import token_required

class NotificationController:
    """Controller for notification related endpoints"""
    
    @staticmethod
    @token_required
    def get_notifications(current_user_email):
        """
        GET /notifications
        Get notifications for the logged-in user
        """
        try:
            limit = request.args.get('limit', 50, type=int)
            
            success, message, notifications = NotificationService.get_user_notifications(current_user_email, limit)
            
            if success:
                return success_response(notifications, message, 200)
            else:
                return error_response(message, 400)
                
        except Exception as e:
            return error_response(f"Error retrieving notifications: {str(e)}", 500)
