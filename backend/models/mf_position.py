"""
Mutual Fund Position Model
Manages MF positions in user portfolios
"""

from datetime import datetime
import uuid
from utils.db import Database

def get_mf_positions_collection():
    """Get MF positions collection"""
    return Database.get_collection('mf_positions')

class MFPosition:
    """MF Position model for portfolio management"""
    
    @staticmethod
    def create_position(data):
        """
        Create a new MF position
        
        Args:
            data: Dictionary containing position details
                - user_email: User's email
                - scheme_code: MF scheme code
                - scheme_name: MF scheme name
                - units: Number of units purchased
                - purchase_date: Date of purchase (ISO format YYYY-MM-DD)
                - invested_amount: Amount invested
                - purchase_nav: NAV at time of purchase
                - portfolio_id: Portfolio ID
                
        Returns:
            dict: Created position document
        """
        positions_col = get_mf_positions_collection()
        
        position_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        position_doc = {
            "position_id": position_id,
            "user_email": data.get("user_email").lower(),
            "scheme_code": str(data.get("scheme_code", "")).strip(),
            "scheme_name": data.get("scheme_name", ""),
            "units": float(data.get("units", 0)),
            "purchase_date": data.get("purchase_date"),  # ISO format YYYY-MM-DD
            "invested_amount": float(data.get("invested_amount", 0)),
            "purchase_nav": float(data.get("purchase_nav", 0)),
            "portfolio_id": data.get("portfolio_id", "default"),
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        positions_col.insert_one(position_doc)
        
        doc_to_return = position_doc.copy()
        if "_id" in doc_to_return:
            del doc_to_return["_id"]
            
        return doc_to_return

    @staticmethod
    def get_positions(user_email, portfolio_id=None, scheme_code=None):
        """
        Get MF positions filtered by user, portfolio, and scheme
        
        Args:
            user_email: User's email
            portfolio_id: Optional portfolio ID filter
            scheme_code: Optional scheme code filter
            
        Returns:
            list: List of position documents
        """
        positions_col = get_mf_positions_collection()
        query = {"user_email": user_email.lower()}
        
        if portfolio_id:
            query["portfolio_id"] = portfolio_id
        
        if scheme_code:
            query["scheme_code"] = str(scheme_code).strip()
            
        cursor = positions_col.find(query).sort("purchase_date", -1)
        
        positions = []
        for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            positions.append(doc)
            
        return positions

    @staticmethod
    def get_position_by_id(user_email, position_id):
        """Get a specific MF position"""
        positions_col = get_mf_positions_collection()
        doc = positions_col.find_one({
            "user_email": user_email.lower(),
            "position_id": position_id
        })
        
        if doc and "_id" in doc:
            del doc["_id"]
            
        return doc

    @staticmethod
    def update_position(user_email, position_id, update_data):
        """Update an MF position"""
        positions_col = get_mf_positions_collection()
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Ensure scheme_code is string if being updated
        if "scheme_code" in update_data:
            update_data["scheme_code"] = str(update_data["scheme_code"]).strip()
        
        result = positions_col.update_one(
            {"user_email": user_email.lower(), "position_id": position_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return MFPosition.get_position_by_id(user_email, position_id)
        return None

    @staticmethod
    def delete_position(user_email, position_id):
        """Delete an MF position"""
        positions_col = get_mf_positions_collection()
        doc = MFPosition.get_position_by_id(user_email, position_id)
        if doc:
            positions_col.delete_one({
                "user_email": user_email.lower(), 
                "position_id": position_id
            })
            return doc
        return None

    @staticmethod
    def get_portfolio_summary(user_email, portfolio_id):
        """
        Get summary of MF positions in a portfolio
        
        Returns:
            dict: Summary with total invested, position count, etc.
        """
        positions_col = get_mf_positions_collection()
        pipeline = [
            {"$match": {
                "user_email": user_email.lower(),
                "portfolio_id": portfolio_id
            }},
            {"$group": {
                "_id": None,
                "total_invested": {"$sum": "$invested_amount"},
                "total_units": {"$sum": "$units"},
                "position_count": {"$sum": 1}
            }}
        ]
        
        result = list(positions_col.aggregate(pipeline))
        if result:
            summary = result[0]
            del summary["_id"]
            return summary
        
        return {
            "total_invested": 0,
            "total_units": 0,
            "position_count": 0
        }

    @staticmethod
    def get_scheme_positions(user_email, scheme_code, portfolio_id=None):
        """
        Get all positions for a specific scheme (for averaging)
        
        Args:
            user_email: User's email
            scheme_code: MF scheme code
            portfolio_id: Optional portfolio filter
            
        Returns:
            list: List of positions for the scheme
        """
        query = {
            "user_email": user_email.lower(),
            "scheme_code": str(scheme_code).strip()
        }
        
        if portfolio_id:
            query["portfolio_id"] = portfolio_id
        
        positions_col = get_mf_positions_collection()
        cursor = positions_col.find(query).sort("purchase_date", 1)
        
        positions = []
        for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            positions.append(doc)
            
        return positions
