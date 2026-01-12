from flask import Blueprint, request, jsonify
from services.portfolio_service import PortfolioService
from models.position import Position
from werkzeug.exceptions import BadRequest, NotFound
from utils.jwt_helper import token_required

portfolio_bp = Blueprint('portfolio', __name__, url_prefix='/api/portfolio')

# Example: /api/portfolio/portfolios/{portfolio_id}/positions

@portfolio_bp.route('/portfolios', methods=['GET'])
@token_required
def get_portfolios(current_user_email):
    try:
        portfolios = PortfolioService.get_user_portfolios(current_user_email)
        return jsonify({"portfolios": portfolios})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/positions', methods=['POST'])
@token_required
def create_position(current_user_email):
    try:
        data = request.json
        if not data:
            raise BadRequest("Request body is required")
            
        data['user_email'] = current_user_email
        # Default portfolio ID
        data['portfolio_id'] = 'default'
        
        result = PortfolioService.create_position(data)
        return jsonify({"message": "Position created", "item": result}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@portfolio_bp.route('/positions', methods=['GET'])
@token_required
def list_positions(current_user_email):
    try:
        symbol = request.args.get('symbol')
        # Default portfolio
        portfolio_id = 'default'
        positions = Position.get_positions(current_user_email, portfolio_id, symbol)
        return jsonify({
            "user_email": current_user_email,
            "portfolio_id": portfolio_id,
            "count": len(positions),
            "positions": positions
        })
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/positions/<position_id>', methods=['GET'])
@token_required
def get_position(current_user_email, position_id):
    try:
        pos = Position.get_position_by_id(current_user_email, position_id)
        if not pos:
            return jsonify({"message": "Position not found"}), 404
        return jsonify({"item": pos})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/positions/<position_id>', methods=['PUT'])
@token_required
def update_position(current_user_email, position_id):
    try:
        data = request.json
        updated = Position.update_position(current_user_email, position_id, data)
        if not updated:
            return jsonify({"message": "Position not found or update failed"}), 404
        return jsonify({"message": "Position updated", "item": updated})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/positions/<position_id>', methods=['DELETE'])
@token_required
def delete_position(current_user_email, position_id):
    try:
        deleted = Position.delete_position(current_user_email, position_id)
        if not deleted:
            return jsonify({"message": "Position not found"}), 404
        return jsonify({"message": "Position deleted", "deleted_item": deleted})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/summary', methods=['GET'])
@token_required
def portfolio_summary(current_user_email):
    try:
        # Default portfolio
        portfolio_id = 'default'
        summary = PortfolioService.get_portfolio_summary(current_user_email, portfolio_id)
        return jsonify(summary)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/overall-transactions', methods=['GET'])
@token_required
def overall_transactions(current_user_email):
    try:
        # Default portfolio
        portfolio_id = 'default'
        result = PortfolioService.get_overall_transactions(current_user_email, portfolio_id)
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": str(e)}), 500
