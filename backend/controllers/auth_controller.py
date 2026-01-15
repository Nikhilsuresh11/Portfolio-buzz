from flask import request
from services.auth_service import AuthService
from utils.response import success_response, error_response
import traceback


class AuthController:
    """Authentication controller for Google OAuth"""
    
    @staticmethod
    def google_auth():
        """
        POST /auth/google
        Authenticate user with Google ID token
        
        Request body:
        {
            "token": "google_id_token_here"
        }
        
        Response:
        {
            "success": true,
            "data": {
                "user": { "email": "..." },
                "email": "user@example.com"
            },
            "error": null
        }
        """
        try:
            data = request.get_json()
            
            if not data or 'token' not in data:
                return error_response("Google token is required", 400)
            
            token = data.get('token', '').strip()
            
            if not token:
                return error_response("Google token cannot be empty", 400)
            
            success, message, result = AuthService.verify_google_token(token)
            
            if success:
                return success_response(result, message, 200)
            else:
                return error_response(message, 401)
        
        except Exception as e:
            print(f"Google auth error: {e}")
            traceback.print_exc()
            return error_response(f"Authentication failed: {str(e)}", 500)
