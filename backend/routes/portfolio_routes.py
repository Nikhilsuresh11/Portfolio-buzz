from flask import Blueprint, request, jsonify
from services.portfolio_service import PortfolioService
from models.position import Position
from werkzeug.exceptions import BadRequest, NotFound

portfolio_bp = Blueprint('portfolio', __name__, url_prefix='/api/<string:user_email>/portfolio')

@portfolio_bp.route('/portfolios', methods=['GET'])
def get_portfolios(user_email):
    try:
        portfolios = PortfolioService.get_user_portfolios(user_email)
        return jsonify({"portfolios": portfolios})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/positions', methods=['POST'])
def create_position(user_email):
    try:
        data = request.json
        if not data:
            raise BadRequest("Request body is required")
            
        data['user_email'] = user_email
        if 'portfolio_id' not in data:
            data['portfolio_id'] = 'default'
        
        result = PortfolioService.create_position(data)
        return jsonify({"message": "Position created", "item": result}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@portfolio_bp.route('/positions', methods=['GET'])
def list_positions(user_email):
    try:
        symbol = request.args.get('symbol')
        portfolio_id = request.args.get('portfolio_id', 'default')
        positions = Position.get_positions(user_email, portfolio_id, symbol)
        return jsonify({
            "user_email": user_email,
            "portfolio_id": portfolio_id,
            "count": len(positions),
            "positions": positions
        })
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/positions/<position_id>', methods=['GET'])
def get_position(user_email, position_id):
    try:
        pos = Position.get_position_by_id(user_email, position_id)
        if not pos:
            return jsonify({"message": "Position not found"}), 404
        return jsonify({"item": pos})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/positions/<position_id>', methods=['PUT'])
def update_position(user_email, position_id):
    try:
        data = request.json
        updated = Position.update_position(user_email, position_id, data)
        if not updated:
            return jsonify({"message": "Position not found or update failed"}), 404
        return jsonify({"message": "Position updated", "item": updated})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/positions/<position_id>', methods=['DELETE'])
def delete_position(user_email, position_id):
    try:
        deleted = Position.delete_position(user_email, position_id)
        if not deleted:
            return jsonify({"message": "Position not found"}), 404
        return jsonify({"message": "Position deleted", "deleted_item": deleted})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/summary', methods=['GET'])
def portfolio_summary(user_email):
    try:
        portfolio_id = request.args.get('portfolio_id', 'default')
        summary = PortfolioService.get_portfolio_summary(user_email, portfolio_id)
        return jsonify(summary)
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@portfolio_bp.route('/overall-transactions', methods=['GET'])
def overall_transactions(user_email):
    try:
        portfolio_id = request.args.get('portfolio_id', 'default')
        result = PortfolioService.get_overall_transactions(user_email, portfolio_id)
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": str(e)}), 500
