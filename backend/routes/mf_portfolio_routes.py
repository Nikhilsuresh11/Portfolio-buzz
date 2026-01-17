"""
Mutual Fund Portfolio Routes
API endpoints for MF portfolio management
"""

from flask import Blueprint, request, jsonify
from services.mf_portfolio_service import MFPortfolioService
from models.mf_position import MFPosition

mf_portfolio_bp = Blueprint('mf_portfolio', __name__, url_prefix='/api/<string:user_email>/mf-portfolio')

@mf_portfolio_bp.route('/<portfolio_id>/analysis', methods=['GET'])
def get_portfolio_analysis(user_email, portfolio_id):
    """
    Get comprehensive portfolio analysis with XIRR
    GET /api/<user_email>/mf-portfolio/<portfolio_id>/analysis
    """
    try:
        analysis = MFPortfolioService.get_portfolio_analysis(user_email, portfolio_id)
        return jsonify(analysis), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@mf_portfolio_bp.route('/<portfolio_id>/positions', methods=['GET'])
def get_positions(user_email, portfolio_id):
    """
    Get all positions in a portfolio
    GET /api/<user_email>/mf-portfolio/<portfolio_id>/positions
    """
    try:
        positions = MFPosition.get_positions(user_email, portfolio_id)
        return jsonify({"success": True, "positions": positions}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@mf_portfolio_bp.route('/<portfolio_id>/positions', methods=['POST'])
def add_position(user_email, portfolio_id):
    """
    Add a new position to portfolio
    POST /api/<user_email>/mf-portfolio/<portfolio_id>/positions
    
    Body:
    {
        "scheme_code": "120503",
        "units": 100,
        "purchase_date": "2024-01-15",
        "invested_amount": 8500,
        "purchase_nav": 85.00  // Optional, will be calculated if not provided
    }
    """
    try:
        data = request.json
        success, message, position = MFPortfolioService.add_position(user_email, portfolio_id, data)
        
        if success:
            return jsonify({"success": True, "message": message, "position": position}), 201
        else:
            return jsonify({"success": False, "message": message}), 400
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@mf_portfolio_bp.route('/<portfolio_id>/positions/<position_id>', methods=['GET'])
def get_position(user_email, portfolio_id, position_id):
    """Get a specific position"""
    try:
        position = MFPosition.get_position_by_id(user_email, position_id)
        
        if position:
            return jsonify({"success": True, "position": position}), 200
        else:
            return jsonify({"success": False, "message": "Position not found"}), 404
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@mf_portfolio_bp.route('/<portfolio_id>/positions/<position_id>', methods=['PUT'])
def update_position(user_email, portfolio_id, position_id):
    """
    Update a position
    PUT /api/<user_email>/mf-portfolio/<portfolio_id>/positions/<position_id>
    
    Body:
    {
        "units": 150,
        "invested_amount": 12750
    }
    """
    try:
        data = request.json
        success, message, position = MFPortfolioService.update_position(user_email, position_id, data)
        
        if success:
            return jsonify({"success": True, "message": message, "position": position}), 200
        else:
            return jsonify({"success": False, "message": message}), 400
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@mf_portfolio_bp.route('/<portfolio_id>/positions/<position_id>', methods=['DELETE'])
def delete_position(user_email, portfolio_id, position_id):
    """Delete a position"""
    try:
        success, message, position = MFPortfolioService.delete_position(user_email, position_id)
        
        if success:
            return jsonify({"success": True, "message": message, "position": position}), 200
        else:
            return jsonify({"success": False, "message": message}), 404
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@mf_portfolio_bp.route('/<portfolio_id>/summary', methods=['GET'])
def get_portfolio_summary(user_email, portfolio_id):
    """
    Get portfolio summary (total invested, position count, etc.)
    GET /api/<user_email>/mf-portfolio/<portfolio_id>/summary
    """
    try:
        summary = MFPosition.get_portfolio_summary(user_email, portfolio_id)
        return jsonify({"success": True, "summary": summary}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
