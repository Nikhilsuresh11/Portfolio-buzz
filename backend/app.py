from flask import Flask, jsonify
from flask_cors import CORS
from config import get_config
from utils.db import Database
import sys
import os

# Add backend directory to path for imports
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Add parent directory to path for scraper imports
parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Import blueprints
from routes.auth_routes import auth_bp
from routes.watchlist_routes import watchlist_bp
from routes.search_routes import search_bp
from routes.analysis_routes import analysis_bp
from routes.stock_research_routes import stock_research_bp


def create_app(config_name='development'):
    """
    Application factory pattern
    
    Args:
        config_name: Configuration environment (development, production, testing)
    
    Returns:
        Flask app instance
    """
    app = Flask(__name__)
    
    # Load configuration
    config = get_config(config_name)
    app.config.from_object(config)
    
    # Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": config.CORS_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600
        }
    })
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(watchlist_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(analysis_bp)
    app.register_blueprint(stock_research_bp)
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            # Test database connection
            db = Database.get_db()
            db.command('ping')
            
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'version': '1.0.0'
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'database': 'disconnected',
                'error': str(e)
            }), 500
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        """Root endpoint with API information"""
        return jsonify({
            'name': 'Portfolio Buzz API',
            'version': '1.0.0',
            'description': 'Stock watchlist and analysis API',
            'endpoints': {
                'auth': {
                    'POST /api/auth/login': 'User login',
                    'POST /api/auth/signup': 'User registration'
                },
                'watchlist': {
                    'GET /api/watchlist': 'Get user watchlist',
                    'POST /api/watchlist': 'Add stock to watchlist',
                    'DELETE /api/watchlist/<ticker>': 'Remove stock from watchlist',
                    'GET /api/watchlist/news': 'Get news for watchlist stocks',
                    'GET /api/watchlist/price': 'Get prices for watchlist stocks'
                },
                'search': {
                    'GET /api/search?q=<query>': 'Search stocks',
                    'GET /api/search/default': 'Get popular stocks',
                    'GET /api/search/autocomplete?q=<query>': 'Autocomplete suggestions'
                },
                'analysis': {
                    'POST /api/ai-insight': 'Generate AI stock analysis',
                    'POST /api/key-insights': 'Generate key insights',
                    'GET /api/news/<days>?stock_name=<name>': 'Get news for last N days'
                }
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors"""
        return jsonify({
            'success': False,
            'data': None,
            'error': 'Endpoint not found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors"""
        return jsonify({
            'success': False,
            'data': None,
            'error': 'Internal server error'
        }), 500
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        """Handle 405 errors"""
        return jsonify({
            'success': False,
            'data': None,
            'error': 'Method not allowed'
        }), 405
    

    
    return app


if __name__ == '__main__':
    # Get environment from environment variable
    env = os.getenv('FLASK_ENV', 'development')
    
    # Create app
    app = create_app(env)
    
    # Get configuration
    config = get_config(env)
    
    # Run app
    print(f"Starting Portfolio Buzz API in {env} mode...")
    print(f"Database: {config.DB_NAME}")
    print(f"CORS Origins: {config.CORS_ORIGINS}")
    
    port = int(os.environ.get('PORT', 5000))
    app.run(
        host='0.0.0.0',
        port=port,
        debug=config.DEBUG
    )
