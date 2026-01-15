from models.user import User
from google.oauth2 import id_token
from google.auth.transport import requests
import os


class AuthService:
    """Authentication service for Google OAuth"""
    
    # Get Google Client ID from environment variable
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    
    @staticmethod
    def verify_google_token(token):
        """
        Verify Google ID token and create/get user
        
        Args:
            token: Google ID token from frontend
        
        Returns:
            tuple: (success: bool, message: str, data: dict or None)
        """
        try:
            # Verify the token with clock skew tolerance (10 seconds)
            # This handles minor time differences between client and server
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                AuthService.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10
            )
            
            # Get user email from token
            email = idinfo.get('email')
            
            if not email:
                return False, "Email not found in Google token", None
            
            # Create or get user
            user = User.create_user(email)
            
            if not user:
                return False, "Failed to create user", None
            
            return True, "Authentication successful", {
                'user': User.to_dict(user),
                'email': email
            }
            
        except ValueError as e:
            # Invalid token
            return False, f"Invalid Google token: {str(e)}", None
        except Exception as e:
            return False, f"Authentication error: {str(e)}", None
    
    @staticmethod
    def get_or_create_user(email):
        """
        Get existing user or create new one
        
        Args:
            email: User's email address
        
        Returns:
            tuple: (success: bool, message: str, user: dict or None)
        """
        try:
            # Create or get user
            user = User.create_user(email)
            
            if not user:
                return False, "Failed to create user", None
            
            return True, "User retrieved successfully", User.to_dict(user)
            
        except Exception as e:
            return False, f"Error: {str(e)}", None
