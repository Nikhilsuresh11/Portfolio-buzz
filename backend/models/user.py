import hashlib
from datetime import datetime
from utils.db import get_users_collection


class User:
    """User model for authentication and user management"""
    
    @staticmethod
    def hash_password(password):
        """
        Hash password using SHA-256
        
        Args:
            password: Plain text password
        
        Returns:
            str: Hashed password
        """
        return hashlib.sha256(password.encode()).hexdigest()
    
    @staticmethod
    def create_user(email, password):
        """
        Create a new user
        
        Args:
            email: User's email address
            password: Plain text password
        
        Returns:
            dict: Created user document or None if email exists
        """
        users_col = get_users_collection()
        
        # Check if user already exists
        if users_col.find_one({'email': email.lower()}):
            return None
        
        user_doc = {
            'email': email.lower(),
            'password': User.hash_password(password),
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
    def verify_password(email, password):
        """
        Verify user password
        
        Args:
            email: User's email address
            password: Plain text password to verify
        
        Returns:
            bool: True if password matches, False otherwise
        """
        user = User.find_by_email(email)
        
        if not user:
            return False
        
        hashed_password = User.hash_password(password)
        return user['password'] == hashed_password
    
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
        return list(users_col.find({}, {'password': 0}))  # Exclude password field
    
    @staticmethod
    def to_dict(user_doc):
        """
        Convert user document to dictionary (excluding password)
        
        Args:
            user_doc: User document from MongoDB
        
        Returns:
            dict: User data without sensitive information
        """
        if not user_doc:
            return None
        
        return {
            'email': user_doc['email'],
            'created_at': user_doc.get('created_at'),
            'updated_at': user_doc.get('updated_at')
        }
