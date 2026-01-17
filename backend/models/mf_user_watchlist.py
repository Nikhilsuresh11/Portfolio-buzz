"""
MF User Watchlist Model
Manages multiple MF watchlists per portfolio (metadata)
"""

from datetime import datetime
import uuid
from utils.db import Database

def get_user_mf_watchlists_collection():
    """Get user MF watchlists collection"""
    return Database.get_collection('user_mf_watchlists')

class MFUserWatchlist:
    """MF User Watchlist model for managing multiple watchlists per portfolio"""
    
    @staticmethod
    def create_watchlist(user_email, portfolio_id, watchlist_name, description="", is_default=False):
        """Create a new MF watchlist for a portfolio"""
        watchlists_col = get_user_mf_watchlists_collection()
        
        watchlist_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # If this is set as default for this portfolio, unset other defaults
        if is_default:
            watchlists_col.update_many(
                {"user_email": user_email.lower(), "portfolio_id": portfolio_id},
                {"$set": {"is_default": False}}
            )
        
        watchlist_doc = {
            "watchlist_id": watchlist_id,
            "user_email": user_email.lower(),
            "portfolio_id": portfolio_id,
            "watchlist_name": watchlist_name,
            "description": description,
            "is_default": is_default,
            "created_at": now,
            "updated_at": now
        }
        
        watchlists_col.insert_one(watchlist_doc)
        
        if "_id" in watchlist_doc:
            del watchlist_doc["_id"]
        
        return watchlist_doc
    
    @staticmethod
    def get_portfolio_watchlists(user_email, portfolio_id):
        """Get all MF watchlists for a portfolio"""
        watchlists_col = get_user_mf_watchlists_collection()
        cursor = watchlists_col.find({
            "user_email": user_email.lower(),
            "portfolio_id": portfolio_id
        }).sort("created_at", -1)
        
        watchlists = []
        for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            watchlists.append(doc)
            
        return watchlists
    
    @staticmethod
    def get_user_watchlists(user_email):
        """Get all MF watchlists for a user across all portfolios"""
        watchlists_col = get_user_mf_watchlists_collection()
        cursor = watchlists_col.find({"user_email": user_email.lower()}).sort("created_at", -1)
        
        watchlists = []
        for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            watchlists.append(doc)
        
        return watchlists
    
    @staticmethod
    def get_watchlist(user_email, watchlist_id):
        """Get a specific MF watchlist"""
        watchlists_col = get_user_mf_watchlists_collection()
        doc = watchlists_col.find_one({
            "user_email": user_email.lower(),
            "watchlist_id": watchlist_id
        })
        
        if doc and "_id" in doc:
            del doc["_id"]
        
        return doc
    
    @staticmethod
    def get_default_watchlist(user_email, portfolio_id):
        """Get default MF watchlist for a portfolio"""
        watchlists_col = get_user_mf_watchlists_collection()
        doc = watchlists_col.find_one({
            "user_email": user_email.lower(),
            "portfolio_id": portfolio_id,
            "is_default": True
        })
        
        if doc and "_id" in doc:
            del doc["_id"]
        
        return doc
    
    @staticmethod
    def update_watchlist(user_email, watchlist_id, update_data):
        """Update a MF watchlist"""
        watchlists_col = get_user_mf_watchlists_collection()
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Handle is_default flag
        if update_data.get("is_default"):
            watchlist = MFUserWatchlist.get_watchlist(user_email, watchlist_id)
            if watchlist:
                watchlists_col.update_many(
                    {
                        "user_email": user_email.lower(),
                        "portfolio_id": watchlist["portfolio_id"]
                    },
                    {"$set": {"is_default": False}}
                )
        
        result = watchlists_col.update_one(
            {"user_email": user_email.lower(), "watchlist_id": watchlist_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return MFUserWatchlist.get_watchlist(user_email, watchlist_id)
        return None
    
    @staticmethod
    def delete_watchlist(user_email, watchlist_id):
        """Delete a MF watchlist"""
        watchlists_col = get_user_mf_watchlists_collection()
        
        watchlist = MFUserWatchlist.get_watchlist(user_email, watchlist_id)
        if watchlist:
            watchlists_col.delete_one({
                "user_email": user_email.lower(),
                "watchlist_id": watchlist_id
            })
            return watchlist
        return None
