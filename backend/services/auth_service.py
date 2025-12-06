from models.user import User
from utils.jwt_helper import generate_token
from utils.validators import validate_email, validate_password


class AuthService:
    """Authentication service for user login and registration"""
    
    @staticmethod
    def register_user(email, password):
        """
        Register a new user
        
        Args:
            email: User's email address
            password: User's password
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        # Validate email
        if not validate_email(email):
            return False, "Invalid email format", None
        
        # Validate password
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return False, error_msg, None
        
        # Create user
        user = User.create_user(email, password)
        
        if not user:
            return False, "Email already registered", None
        
        # Generate JWT token
        token = generate_token(email)
        
        return True, "User registered successfully", {
            'user': User.to_dict(user),
            'token': token
        }
    
    @staticmethod
    def login_user(email, password):
        """
        Authenticate user and generate JWT token
        
        Args:
            email: User's email address
            password: User's password
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        # Validate email format
        if not validate_email(email):
            return False, "Invalid email format", None
        
        # Verify credentials
        if not User.verify_password(email, password):
            return False, "Invalid email or password", None
        
        # Get user data
        user = User.find_by_email(email)
        
        if not user:
            return False, "User not found", None
        
        # Generate JWT token
        token = generate_token(email)
        
        return True, "Login successful", {
            'user': User.to_dict(user),
            'token': token
        }
    
    @staticmethod
    def verify_token(token):
        """
        Verify JWT token and return user data
        
        Args:
            token: JWT token string
        
        Returns:
            tuple: (success: bool, message: str, user_email: str or None)
        """
        from utils.jwt_helper import decode_token
        
        payload = decode_token(token)
        
        if not payload:
            return False, "Invalid or expired token", None
        
        email = payload.get('email')
        
        # Verify user still exists
        user = User.find_by_email(email)
        if not user:
            return False, "User not found", None
        
        return True, "Token valid", email
    
    @staticmethod
    def change_password(email, old_password, new_password):
        """
        Change user password
        
        Args:
            email: User's email address
            old_password: Current password
            new_password: New password
        
        Returns:
            tuple: (success: bool, message: str)
        """
        # Verify old password
        if not User.verify_password(email, old_password):
            return False, "Current password is incorrect"
        
        # Validate new password
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return False, error_msg
        
        # Update password
        hashed_password = User.hash_password(new_password)
        success = User.update_user(email, {'password': hashed_password})
        
        if success:
            return True, "Password changed successfully"
        
        return False, "Failed to change password"
