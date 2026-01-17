from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from config import get_config

config = get_config()

class Database:
    """MongoDB database connection manager"""
    _client = None
    _db = None
    
    @classmethod
    def get_client(cls):
        """Get MongoDB client (singleton pattern)"""
        if cls._client is None:
            try:
                # Optimized connection pool for Render free tier (512MB RAM)
                cls._client = MongoClient(
                    config.MONGODB_URI,
                    serverSelectionTimeoutMS=5000,
                    maxPoolSize=10,  # Reduced from 50 for memory savings
                    minPoolSize=2,   # Reduced from 10 for memory savings
                    maxIdleTimeMS=30000,  # Close idle connections after 30s
                    retryWrites=True,
                    w='majority'
                )
                # Test connection
                cls._client.admin.command('ping')
                print("[DB] MongoDB connected with optimized pool (max=10, min=2)")
            except ConnectionFailure as e:
                raise Exception(f"Failed to connect to MongoDB: {str(e)}")
        return cls._client
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        if cls._db is None:
            client = cls.get_client()
            cls._db = client[config.DB_NAME]
        return cls._db
    
    @classmethod
    def get_collection(cls, collection_name):
        """Get a specific collection"""
        db = cls.get_db()
        return db[collection_name]
    
    @classmethod
    def close_connection(cls):
        """Close MongoDB connection"""
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None


def get_users_collection():
    """Get users collection"""
    return Database.get_collection(config.USERS_COLLECTION)


def get_watchlist_collection():
    """Get watchlist collection"""
    return Database.get_collection(config.WATCHLIST_COLLECTION)


def get_stock_mappings_collection():
    """Get stock mappings collection"""
    return Database.get_collection(config.STOCK_MAPPINGS_COLLECTION)


def get_news_collection():
    """Get company news collection (pre-fetched by cron scraper)"""
    return Database.get_collection(config.NEWS_COLLECTION)


def get_positions_collection():
    """Get portfolio positions collection"""
    return Database.get_collection(config.POSITIONS_COLLECTION)


def get_notifications_collection():
    """Get notifications collection"""
    return Database.get_collection(config.NOTIFICATIONS_COLLECTION)


def get_mf_watchlist_collection():
    """Get mutual fund watchlist collection"""
    return Database.get_collection('mf_watchlist')

