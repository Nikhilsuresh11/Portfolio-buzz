"""
MongoDB Collection Setup Script for Portfolio Buzz
This script creates all necessary collections and indexes for the portfolio system.
"""

import os
import sys
from pymongo import MongoClient, ASCENDING, DESCENDING
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://nikhilsuresh:eZOKT9nbysKcpAuq@cluster0.s5urjmx.mongodb.net/')
DB_NAME = 'portfolio_buzz'

def create_collections_and_indexes():
    """Create all collections and their indexes"""
    
    print("=" * 60)
    print("Portfolio Buzz - MongoDB Setup Script")
    print("=" * 60)
    print(f"\nConnecting to MongoDB...")
    print(f"Database: {DB_NAME}\n")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.admin.command('ping')
        print("✓ Successfully connected to MongoDB!\n")
        
        # Get database
        db = client[DB_NAME]
        
        # ==================== POSITIONS COLLECTION ====================
        print("Setting up 'portfolio_positions' collection...")
        positions_col = db['portfolio_positions']
        
        # Drop existing indexes (optional - comment out if you want to keep existing data)
        # positions_col.drop_indexes()
        
        # Create indexes for positions
        print("  Creating indexes...")
        positions_col.create_index(
            [("user_email", ASCENDING), ("portfolio_id", ASCENDING)],
            name="user_portfolio_idx"
        )
        print("    ✓ Created index: user_email + portfolio_id")
        
        positions_col.create_index(
            [("user_email", ASCENDING), ("position_id", ASCENDING)],
            unique=True,
            name="user_position_unique_idx"
        )
        print("    ✓ Created unique index: user_email + position_id")
        
        positions_col.create_index(
            [("user_email", ASCENDING), ("symbol", ASCENDING)],
            name="user_symbol_idx"
        )
        print("    ✓ Created index: user_email + symbol")
        
        positions_col.create_index(
            [("created_at", DESCENDING)],
            name="created_at_idx"
        )
        print("    ✓ Created index: created_at")
        
        positions_col.create_index(
            [("buy_date", DESCENDING)],
            name="buy_date_idx"
        )
        print("    ✓ Created index: buy_date")
        
        # Insert sample document (optional)
        sample_exists = positions_col.count_documents({}) > 0
        if not sample_exists:
            print("\n  Inserting sample document...")
            sample_doc = {
                "position_id": "sample-uuid-12345",
                "user_email": "demo@example.com",
                "symbol": "RELIANCE",
                "quantity": 10.0,
                "buy_date": "2024-01-15",
                "invested_amount": 25000.0,
                "nifty_value": 21500.0,
                "portfolio_id": "default",
                "portfolio_name": "Main Portfolio",
                "created_at": "2024-01-15T10:30:00.000Z",
                "updated_at": "2024-01-15T10:30:00.000Z"
            }
            positions_col.insert_one(sample_doc)
            print("    ✓ Sample document inserted")
        else:
            print(f"    ℹ Collection already has {positions_col.count_documents({})} documents")
        
        print("✓ 'portfolio_positions' collection setup complete!\n")
        
        # ==================== USERS COLLECTION ====================
        print("Setting up 'users' collection...")
        users_col = db['users']
        
        users_col.create_index(
            [("email", ASCENDING)],
            unique=True,
            name="email_unique_idx"
        )
        print("    ✓ Created unique index: email")
        
        users_col.create_index(
            [("created_at", DESCENDING)],
            name="created_at_idx"
        )
        print("    ✓ Created index: created_at")
        
        print("✓ 'users' collection setup complete!\n")
        
        # ==================== WATCHLISTS COLLECTION ====================
        print("Setting up 'watchlists' collection...")
        watchlists_col = db['watchlists']
        
        watchlists_col.create_index(
            [("user_email", ASCENDING)],
            name="user_email_idx"
        )
        print("    ✓ Created index: user_email")
        
        watchlists_col.create_index(
            [("user_email", ASCENDING), ("ticker", ASCENDING)],
            unique=True,
            name="user_ticker_unique_idx"
        )
        print("    ✓ Created unique index: user_email + ticker")
        
        print("✓ 'watchlists' collection setup complete!\n")
        
        # ==================== STOCK MAPPINGS COLLECTION ====================
        print("Setting up 'stock_mappings' collection...")
        mappings_col = db['stock_mappings']
        
        mappings_col.create_index(
            [("ticker", ASCENDING)],
            unique=True,
            name="ticker_unique_idx"
        )
        print("    ✓ Created unique index: ticker")
        
        mappings_col.create_index(
            [("name", ASCENDING)],
            name="name_idx"
        )
        print("    ✓ Created index: name")
        
        print("✓ 'stock_mappings' collection setup complete!\n")
        
        # ==================== NEWS COLLECTION ====================
        print("Setting up 'company_news' collection...")
        news_col = db['company_news']
        
        news_col.create_index(
            [("ticker", ASCENDING), ("published_at", DESCENDING)],
            name="ticker_published_idx"
        )
        print("    ✓ Created index: ticker + published_at")
        
        news_col.create_index(
            [("published_at", DESCENDING)],
            name="published_at_idx"
        )
        print("    ✓ Created index: published_at")
        
        print("✓ 'company_news' collection setup complete!\n")
        
        # ==================== SUMMARY ====================
        print("=" * 60)
        print("SETUP COMPLETE!")
        print("=" * 60)
        print("\nCollections created:")
        print("  ✓ portfolio_positions")
        print("  ✓ users")
        print("  ✓ watchlists")
        print("  ✓ stock_mappings")
        print("  ✓ company_news")
        
        print("\nCollection Statistics:")
        for collection_name in ['portfolio_positions', 'users', 'watchlists', 'stock_mappings', 'company_news']:
            col = db[collection_name]
            count = col.count_documents({})
            indexes = len(col.list_indexes())
            print(f"  {collection_name}: {count} documents, {indexes} indexes")
        
        print("\n✓ All collections and indexes created successfully!")
        print("=" * 60)
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        print("\nPlease check:")
        print("  1. MongoDB URI is correct")
        print("  2. Network connection is available")
        print("  3. MongoDB credentials are valid")
        sys.exit(1)

if __name__ == "__main__":
    create_collections_and_indexes()
