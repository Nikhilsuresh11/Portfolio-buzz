from flask import request
from services.auth_service import AuthService
from utils.response import success_response, error_response
from utils.validators import require_json
import traceback


class AuthController:
    """Authentication controller for login and signup"""
    
    @staticmethod
    @require_json('email', 'password')
    def login():
        """
        POST /login
        Login user and return JWT token
        
        Request body:
        {
            "email": "user@example.com",
            "password": "password123"
        }
        
        Response:
        {
            "success": true,
            "data": {
                "user": { "email": "..." },
                "token": "jwt_token_here"
            },
            "error": null
        }
        """
        try:
            data = request.get_json()
            email = data.get('email', '').strip()
            password = data.get('password', '')
            
            success, message, result = AuthService.login_user(email, password)
            
            if success:
                return success_response(result, message, 200)
            else:
                return error_response(message, 401)
        
        except Exception as e:
            print(f"Login error: {e}")
            traceback.print_exc()
            return error_response(f"Login failed: {str(e)}", 500)
    
    @staticmethod
    @require_json('email', 'password')
    def signup():
        """
        POST /signup
        Register new user and return JWT token
        
        Request body:
        {
            "email": "user@example.com",
            "password": "SecurePass123!"
        }
        
        Response:
        {
            "success": true,
            "data": {
                "user": { "email": "..." },
                "token": "jwt_token_here"
            },
            "error": null
        }
        """
        try:
            data = request.get_json()
            email = data.get('email', '').strip()
            password = data.get('password', '')
            
            success, message, result = AuthService.register_user(email, password)
            
            if success:
                return success_response(result, message, 201)
            else:
                return error_response(message, 400)
        
        except Exception as e:
            print(f"Signup error: {e}")
            traceback.print_exc()
            return error_response(f"Registration failed: {str(e)}", 500)
