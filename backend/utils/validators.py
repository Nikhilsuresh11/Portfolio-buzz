import re
from functools import wraps
from flask import request
from utils.response import error_response


def validate_email(email):
    """
    Validate email format
    
    Args:
        email: Email string to validate
    
    Returns:
        bool: True if valid, False otherwise
    """
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password):
    """
    Validate password strength
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    
    Args:
        password: Password string to validate
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not password:
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, None


def validate_ticker(ticker):
    """
    Validate stock ticker format
    
    Args:
        ticker: Ticker string to validate
    
    Returns:
        bool: True if valid, False otherwise
    """
    if not ticker:
        return False
    
    # Allow alphanumeric, dots, and hyphens (e.g., BRK.B, RELIANCE.NS)
    pattern = r'^[A-Z0-9.\-]{1,10}$'
    return bool(re.match(pattern, ticker.upper()))


def require_json(*required_fields):
    """
    Decorator to validate JSON request body and required fields
    
    Args:
        *required_fields: Field names that must be present in request JSON
    
    Usage:
        @require_json('email', 'password')
        def login():
            data = request.get_json()
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if request has JSON
            if not request.is_json:
                return error_response('Request must be JSON', 400)
            
            data = request.get_json()
            
            # Check required fields
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return error_response(
                    f"Missing required fields: {', '.join(missing_fields)}",
                    400
                )
            
            # Check for empty values
            empty_fields = [field for field in required_fields if not data.get(field)]
            if empty_fields:
                return error_response(
                    f"Empty values not allowed for: {', '.join(empty_fields)}",
                    400
                )
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def validate_query_param(param_name, param_type=str, required=True):
    """
    Decorator to validate query parameters
    
    Args:
        param_name: Name of the query parameter
        param_type: Expected type (str, int, bool)
        required: Whether the parameter is required
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            value = request.args.get(param_name)
            
            if required and not value:
                return error_response(f"Missing required parameter: {param_name}", 400)
            
            if value and param_type == int:
                try:
                    value = int(value)
                except ValueError:
                    return error_response(f"Parameter '{param_name}' must be an integer", 400)
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
