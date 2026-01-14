from datetime import datetime
from utils.db import get_notifications_collection

class NotificationService:
    """Service for managing notifications stored in MongoDB"""
    
    @staticmethod
    def get_user_notifications(user_email, limit=50):
        """
        Fetch notifications for a specific user
        
        Args:
            user_email: User's email address
            limit: Maximum number of notifications to return
            
        Returns:
            tuple: (success, message, notifications)
        """
        try:
            notifications_col = get_notifications_collection()
            
            # Find notifications for the user, sorted by timestamp descending
            cursor = notifications_col.find(
                {'user_email': user_email}
            ).sort('timestamp', -1).limit(limit)
            
            notifications = list(cursor)
            
            # Convert ObjectId to string for JSON serialization
            for notification in notifications:
                notification['_id'] = str(notification['_id'])
                if 'timestamp' in notification and isinstance(notification['timestamp'], datetime):
                    notification['timestamp'] = notification['timestamp'].isoformat()
            
            return True, f"Found {len(notifications)} notifications", notifications
            
        except Exception as e:
            return False, f"Error fetching notifications: {str(e)}", None

    @staticmethod
    def mark_as_read(user_email, notification_id):
        """
        Mark a notification as read (optional future improvement)
        """
        pass
