from datetime import datetime
import uuid
from utils.db import get_positions_collection

class Position:
    """Position model for portfolio management"""
    
    @staticmethod
    def create_position(data):
        """
        Create a new position
        
        Args:
            data: Dictionary containing position details
            
        Returns:
            dict: Created position document
        """
        positions_col = get_positions_collection()
        
        position_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        position_doc = {
            "position_id": position_id,
            "user_email": data.get("user_email").lower(),
            "symbol": data.get("symbol", "").upper(),
            "quantity": float(data.get("quantity", 0)),
            "buy_date": data.get("buy_date"),  # ISO format YYYY-MM-DD
            "invested_amount": float(data.get("invested_amount", 0)),
            "nifty_value": float(data.get("nifty_value", 0)),
            "portfolio_id": data.get("portfolio_id", "default"),
            "portfolio_name": data.get("portfolio_name", "My Portfolio"),
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        positions_col.insert_one(position_doc)
        
        # Remove _id for JSON serialization compatibility if needed, 
        # but usually we might want to keep it or convert it. 
        # The sample app returns the item without _id or with it.
        # Let's clean it up for the return.
        doc_to_return = position_doc.copy()
        if "_id" in doc_to_return:
            del doc_to_return["_id"]
            
        return doc_to_return

    @staticmethod
    def get_positions(user_email, portfolio_id=None, symbol=None):
        """
        Get positions filtered by user, portfolio, and symbol
        """
        positions_col = get_positions_collection()
        query = {"user_email": user_email.lower()}
        
        if portfolio_id:
            query["portfolio_id"] = portfolio_id
        
        if symbol:
            query["symbol"] = symbol.upper()
            
        cursor = positions_col.find(query)
        
        # Convert to list and clean _id
        positions = []
        for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            positions.append(doc)
            
        return positions

    @staticmethod
    def get_position_by_id(user_email, position_id):
        """Get a specific position"""
        positions_col = get_positions_collection()
        doc = positions_col.find_one({
            "user_email": user_email.lower(),
            "position_id": position_id
        })
        
        if doc and "_id" in doc:
            del doc["_id"]
            
        return doc

    @staticmethod
    def update_position(user_email, position_id, update_data):
        """Update a position"""
        positions_col = get_positions_collection()
        
        # Don't allow updating unchangeable fields easily usually, but here we trust the service layer
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = positions_col.update_one(
            {"user_email": user_email.lower(), "position_id": position_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return Position.get_position_by_id(user_email, position_id)
        return None

    @staticmethod
    def delete_position(user_email, position_id):
        """Delete a position"""
        positions_col = get_positions_collection()
        doc = Position.get_position_by_id(user_email, position_id)
        if doc:
            positions_col.delete_one({
                "user_email": user_email.lower(), 
                "position_id": position_id
            })
            return doc
        return None

    @staticmethod
    def get_user_portfolios(user_email):
        """Get list of distinct portfolios for a user"""
        positions_col = get_positions_collection()
        pipeline = [
            {"$match": {"user_email": user_email.lower()}},
            {"$group": {
                "_id": "$portfolio_id",
                "portfolio_name": {"$first": "$portfolio_name"},
                "position_count": {"$sum": 1}
            }},
            {"$project": {
                "portfolio_id": "$_id",
                "portfolio_name": 1,
                "position_count": 1,
                "_id": 0
            }}
        ]
        return list(positions_col.aggregate(pipeline))
