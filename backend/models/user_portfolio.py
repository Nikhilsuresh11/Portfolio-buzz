from datetime import datetime
import uuid
from utils.db import Database

def get_user_portfolios_collection():
    """Get user portfolios collection"""
    return Database.get_collection('user_portfolios')

def get_user_watchlists_collection():
    """Get user watchlists collection"""
    return Database.get_collection('user_watchlists')

class UserPortfolio:
    """User Portfolio model for managing multiple portfolios"""
    
    @staticmethod
    def create_portfolio(user_email, portfolio_name, description="", is_default=False):
        """Create a new portfolio for a user"""
        portfolios_col = get_user_portfolios_collection()
        
        portfolio_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # If this is set as default, unset other defaults
        if is_default:
            portfolios_col.update_many(
                {"user_email": user_email.lower()},
                {"$set": {"is_default": False}}
            )
        
        portfolio_doc = {
            "portfolio_id": portfolio_id,
            "user_email": user_email.lower(),
            "portfolio_name": portfolio_name,
            "description": description,
            "is_default": is_default,
            "created_at": now,
            "updated_at": now
        }
        
        portfolios_col.insert_one(portfolio_doc)
        
        if "_id" in portfolio_doc:
            del portfolio_doc["_id"]
        
        return portfolio_doc
    
    @staticmethod
    def get_user_portfolios(user_email):
        """Get all portfolios for a user"""
        portfolios_col = get_user_portfolios_collection()
        cursor = portfolios_col.find({"user_email": user_email.lower()}).sort("created_at", -1)
        
        portfolios = []
        for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            portfolios.append(doc)
        
        return portfolios
    
    @staticmethod
    def get_portfolio(user_email, portfolio_id):
        """Get a specific portfolio"""
        portfolios_col = get_user_portfolios_collection()
        doc = portfolios_col.find_one({
            "user_email": user_email.lower(),
            "portfolio_id": portfolio_id
        })
        
        if doc and "_id" in doc:
            del doc["_id"]
        
        return doc
    
    @staticmethod
    def get_default_portfolio(user_email):
        """Get user's default portfolio"""
        portfolios_col = get_user_portfolios_collection()
        doc = portfolios_col.find_one({
            "user_email": user_email.lower(),
            "is_default": True
        })
        
        if doc and "_id" in doc:
            del doc["_id"]
        
        return doc
    
    @staticmethod
    def update_portfolio(user_email, portfolio_id, update_data):
        """Update a portfolio"""
        portfolios_col = get_user_portfolios_collection()
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Handle is_default flag
        if update_data.get("is_default"):
            portfolios_col.update_many(
                {"user_email": user_email.lower()},
                {"$set": {"is_default": False}}
            )
        
        result = portfolios_col.update_one(
            {"user_email": user_email.lower(), "portfolio_id": portfolio_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return UserPortfolio.get_portfolio(user_email, portfolio_id)
        return None
    
    @staticmethod
    def delete_portfolio(user_email, portfolio_id):
        """Delete a portfolio"""
        portfolios_col = get_user_portfolios_collection()
        
        # Don't allow deleting the default portfolio
        portfolio = UserPortfolio.get_portfolio(user_email, portfolio_id)
        if portfolio and portfolio.get("is_default"):
            raise ValueError("Cannot delete default portfolio")
        
        if portfolio:
            portfolios_col.delete_one({
                "user_email": user_email.lower(),
                "portfolio_id": portfolio_id
            })
            return portfolio
        return None


class UserWatchlist:
    """User Watchlist model for managing multiple watchlists per portfolio"""
    
    @staticmethod
    def create_watchlist(user_email, portfolio_id, watchlist_name, description="", is_default=False):
        """Create a new watchlist for a portfolio"""
        watchlists_col = get_user_watchlists_collection()
        
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
        """Get all watchlists for a portfolio"""
        watchlists_col = get_user_watchlists_collection()
        cursor = watchlists_col.find({
            "user_email": user_email.lower(),
            "portfolio_id": portfolio_id
        }).sort("created_at", -1)
        
        watchlists = []
        for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            watchlists.append(doc)
            
        # No watchlists exist for this portfolio, just return empty list
        return watchlists
    
    @staticmethod
    def get_user_watchlists(user_email):
        """Get all watchlists for a user across all portfolios"""
        watchlists_col = get_user_watchlists_collection()
        cursor = watchlists_col.find({"user_email": user_email.lower()}).sort("created_at", -1)
        
        watchlists = []
        for doc in cursor:
            if "_id" in doc:
                del doc["_id"]
            watchlists.append(doc)
        
        return watchlists
    
    @staticmethod
    def get_watchlist(user_email, watchlist_id):
        """Get a specific watchlist"""
        watchlists_col = get_user_watchlists_collection()
        doc = watchlists_col.find_one({
            "user_email": user_email.lower(),
            "watchlist_id": watchlist_id
        })
        
        if doc and "_id" in doc:
            del doc["_id"]
        
        return doc
    
    @staticmethod
    def get_default_watchlist(user_email, portfolio_id):
        """Get default watchlist for a portfolio"""
        watchlists_col = get_user_watchlists_collection()
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
        """Update a watchlist"""
        watchlists_col = get_user_watchlists_collection()
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Handle is_default flag
        if update_data.get("is_default"):
            watchlist = UserWatchlist.get_watchlist(user_email, watchlist_id)
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
            return UserWatchlist.get_watchlist(user_email, watchlist_id)
        return None
    
    @staticmethod
    def delete_watchlist(user_email, watchlist_id):
        """Delete a watchlist"""
        watchlists_col = get_user_watchlists_collection()
        
        watchlist = UserWatchlist.get_watchlist(user_email, watchlist_id)
        if watchlist:
            watchlists_col.delete_one({
                "user_email": user_email.lower(),
                "watchlist_id": watchlist_id
            })
            return watchlist
        return None
