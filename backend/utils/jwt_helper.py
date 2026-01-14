from functools import wraps
from flask import request
import jwt
from datetime import datetime, timedelta
from config import get_config
from utils.response import error_response

config = get_config()


def generate_token(user_email, expires_in=None):
    """
    Generate JWT access token
    
    Args:
        user_email: User's email address
        expires_in: Token expiration time in seconds (default: from config)
    
    Returns:
        str: JWT token
    """
    if expires_in is None:
        expires_in = config.JWT_ACCESS_TOKEN_EXPIRES
    
    payload = {
        'email': user_email,
        'exp': datetime.utcnow() + timedelta(seconds=expires_in),
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(payload, config.JWT_SECRET_KEY, algorithm='HS256')
    return token


def decode_token(token):
    """
    Decode and verify JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        dict: Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_from_header():
    """
    Extract token from Authorization header
    
    Returns:
        str: Token or None
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        # Debug: Log when header is missing
        print(f"DEBUG: Missing Authorization header for {request.method} {request.path}")
        # print(f"DEBUG: All headers: {dict(request.headers)}")
        return None
    
    # Expected format: "Bearer <token>"
    parts = auth_header.split()
    
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        print(f"DEBUG: Invalid Authorization format: {auth_header[:20]}...")
        return None
    
    return parts[1]


def token_required(f):
    """
    Decorator to protect routes with JWT authentication
    
    Usage:
        @app.route('/protected')
        @token_required
        def protected_route(current_user_email):
            return {'message': f'Hello {current_user_email}'}
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            return error_response('Missing authentication token', 401)
        
        payload = decode_token(token)
        
        if not payload:
            return error_response('Invalid or expired token', 401)
        
        # Pass user email to the route function
        return f(current_user_email=payload['email'], *args, **kwargs)
    
    return decorated_function


def optional_token(f):
    """
    Decorator for routes where authentication is optional
    
    Usage:
        @app.route('/public')
        @optional_token
        def public_route(current_user_email=None):
            if current_user_email:
                return {'message': f'Hello {current_user_email}'}
            return {'message': 'Hello guest'}
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        
        current_user_email = None
        if token:
            payload = decode_token(token)
            if payload:
                current_user_email = payload['email']
        
        return f(current_user_email=current_user_email, *args, **kwargs)
    
    return decorated_function
