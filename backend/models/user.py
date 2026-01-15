from datetime import datetime
from utils.db import get_users_collection


class User:
    """User model for Google OAuth authentication"""
    
    @staticmethod
    def create_user(email):
        """
        Create a new user with Google OAuth
        
        Args:
            email: User's email address from Google
        
        Returns:
            dict: Created user document or existing user if email exists
        """
        users_col = get_users_collection()
        
        # Check if user already exists
        existing_user = users_col.find_one({'email': email.lower()})
        if existing_user:
            return existing_user
        
        user_doc = {
            'email': email.lower(),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = users_col.insert_one(user_doc)
        user_doc['_id'] = result.inserted_id
        
        return user_doc
    
    @staticmethod
    def find_by_email(email):
        """
        Find user by email
        
        Args:
            email: User's email address
        
        Returns:
            dict: User document or None
        """
        users_col = get_users_collection()
        return users_col.find_one({'email': email.lower()})
    
    @staticmethod
    def update_user(email, update_data):
        """
        Update user information
        
        Args:
            email: User's email address
            update_data: Dictionary of fields to update
        
        Returns:
            bool: True if updated successfully
        """
        users_col = get_users_collection()
        
        update_data['updated_at'] = datetime.utcnow()
        
        result = users_col.update_one(
            {'email': email.lower()},
            {'$set': update_data}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    def delete_user(email):
        """
        Delete user
        
        Args:
            email: User's email address
        
        Returns:
            bool: True if deleted successfully
        """
        users_col = get_users_collection()
        result = users_col.delete_one({'email': email.lower()})
        return result.deleted_count > 0
    
    @staticmethod
    def get_all_users():
        """
        Get all users (for scheduled tasks)
        
        Returns:
            list: List of user documents
        """
        users_col = get_users_collection()
        return list(users_col.find({}))
    
    @staticmethod
    def to_dict(user_doc):
        """
        Convert user document to dictionary
        
        Args:
            user_doc: User document from MongoDB
        
        Returns:
            dict: User data
        """
        if not user_doc:
            return None
        
        return {
            'email': user_doc['email'],
            'created_at': user_doc.get('created_at'),
            'updated_at': user_doc.get('updated_at')
        }
