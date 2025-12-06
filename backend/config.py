import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    # Flask
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # MongoDB
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    DB_NAME = 'portfolio_buzz'
    
    # Collections
    USERS_COLLECTION = 'users'
    WATCHLIST_COLLECTION = 'watchlists'
    STOCK_MAPPINGS_COLLECTION = 'stock_mappings'
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 days
    
    # API Keys
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API_KEY')
    FINNHUB_KEY = os.getenv('FINNHUB_KEY')
    
    # CORS
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8501']
    
    # Performance
    MAX_WORKERS = 8
    CACHE_DURATION = 3600  # 1 hour
    REQUEST_TIMEOUT = 15
    
    # Search
    SEARCH_LIMIT = 10
    FUZZY_THRESHOLD = 60


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    DB_NAME = 'portfolio_buzz_test'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config(env=None):
    """Get configuration based on environment"""
    if env is None:
        env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
