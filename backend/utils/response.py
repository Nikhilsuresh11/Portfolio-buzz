from flask import jsonify


def success_response(data=None, message=None, status_code=200):
    """
    Create a standardized success response
    
    Args:
        data: Response data (dict, list, or any JSON-serializable object)
        message: Optional success message
        status_code: HTTP status code (default: 200)
    
    Returns:
        Flask JSON response with format: { success: true, data: ..., error: null }
    """
    response = {
        'success': True,
        'data': data,
        'error': None
    }
    
    if message:
        response['message'] = message
    
    return jsonify(response), status_code


def error_response(error_message, status_code=400, error_code=None):
    """
    Create a standardized error response
    
    Args:
        error_message: Error message string
        status_code: HTTP status code (default: 400)
        error_code: Optional error code for client-side handling
    
    Returns:
        Flask JSON response with format: { success: false, data: null, error: ... }
    """
    response = {
        'success': False,
        'data': None,
        'error': error_message
    }
    
    if error_code:
        response['error_code'] = error_code
    
    return jsonify(response), status_code


def validation_error_response(errors):
    """
    Create a validation error response
    
    Args:
        errors: Dictionary of field errors or list of error messages
    
    Returns:
        Flask JSON response with validation errors
    """
    response = {
        'success': False,
        'data': None,
        'error': 'Validation failed',
        'error_code': 'VALIDATION_ERROR',
        'errors': errors
    }
    
    return jsonify(response), 422
