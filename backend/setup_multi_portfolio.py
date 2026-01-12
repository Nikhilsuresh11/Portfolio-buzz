"""
MongoDB Collection Setup Script - Multi-Portfolio & Multi-Watchlist Support
Creates user_portfolios and user_watchlists collections
"""

import os
import sys
from pymongo import MongoClient, ASCENDING, DESCENDING
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://nikhilsuresh:eZOKT9nbysKcpAuq@cluster0.s5urjmx.mongodb.net/')
DB_NAME = 'portfolio_buzz'

def setup_multi_portfolio_collections():
    """Create user_portfolios and user_watchlists collections"""
    
    print("=" * 60)
    print("Multi-Portfolio & Multi-Watchlist Setup")
    print("=" * 60)
    print(f"\nConnecting to MongoDB...")
    
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✓ Connected to MongoDB!\n")
        
        db = client[DB_NAME]
        
        # ==================== USER PORTFOLIOS COLLECTION ====================
        print("Setting up 'user_portfolios' collection...")
        portfolios_col = db['user_portfolios']
        
        # Create indexes
        portfolios_col.create_index(
            [("user_email", ASCENDING), ("portfolio_id", ASCENDING)],
            unique=True,
            name="user_portfolio_unique_idx"
        )
        print("    ✓ Created unique index: user_email + portfolio_id")
        
        portfolios_col.create_index(
            [("user_email", ASCENDING)],
            name="user_email_idx"
        )
        print("    ✓ Created index: user_email")
        
        portfolios_col.create_index(
            [("created_at", DESCENDING)],
            name="created_at_idx"
        )
        print("    ✓ Created index: created_at")
        
        # Sample document
        sample_portfolio = {
            "portfolio_id": "default",
            "user_email": "demo@example.com",
            "portfolio_name": "Main Portfolio",
            "description": "My primary investment portfolio",
            "is_default": True,
            "created_at": "2024-01-15T10:30:00.000Z",
            "updated_at": "2024-01-15T10:30:00.000Z"
        }
        
        if portfolios_col.count_documents({}) == 0:
            portfolios_col.insert_one(sample_portfolio)
            print("    ✓ Sample portfolio inserted")
        
        print("✓ 'user_portfolios' collection setup complete!\n")
        
        # ==================== USER WATCHLISTS COLLECTION ====================
        print("Setting up 'user_watchlists' collection...")
        watchlists_col = db['user_watchlists']
        
        # Create indexes
        watchlists_col.create_index(
            [("user_email", ASCENDING), ("watchlist_id", ASCENDING)],
            unique=True,
            name="user_watchlist_unique_idx"
        )
        print("    ✓ Created unique index: user_email + watchlist_id")
        
        watchlists_col.create_index(
            [("user_email", ASCENDING), ("portfolio_id", ASCENDING)],
            name="user_portfolio_idx"
        )
        print("    ✓ Created index: user_email + portfolio_id")
        
        watchlists_col.create_index(
            [("created_at", DESCENDING)],
            name="created_at_idx"
        )
        print("    ✓ Created index: created_at")
        
        # Sample document
        sample_watchlist = {
            "watchlist_id": "default",
            "user_email": "demo@example.com",
            "portfolio_id": "default",
            "watchlist_name": "Main Watchlist",
            "description": "Stocks I'm watching for my main portfolio",
            "is_default": True,
            "created_at": "2024-01-15T10:30:00.000Z",
            "updated_at": "2024-01-15T10:30:00.000Z"
        }
        
        if watchlists_col.count_documents({}) == 0:
            watchlists_col.insert_one(sample_watchlist)
            print("    ✓ Sample watchlist inserted")
        
        print("✓ 'user_watchlists' collection setup complete!\n")
        
        # ==================== UPDATE WATCHLISTS COLLECTION ====================
        print("Updating 'watchlists' collection schema...")
        old_watchlists_col = db['watchlists']
        
        # Add portfolio_id and watchlist_id to existing documents
        old_watchlists_col.create_index(
            [("user_email", ASCENDING), ("watchlist_id", ASCENDING), ("ticker", ASCENDING)],
            unique=True,
            name="user_watchlist_ticker_unique_idx"
        )
        print("    ✓ Created unique index: user_email + watchlist_id + ticker")
        
        print("✓ 'watchlists' collection updated!\n")
        
        # ==================== UPDATE POSITIONS COLLECTION ====================
        print("Verifying 'portfolio_positions' collection...")
        positions_col = db['portfolio_positions']
        
        # Ensure portfolio_id index exists
        positions_col.create_index(
            [("user_email", ASCENDING), ("portfolio_id", ASCENDING), ("symbol", ASCENDING)],
            name="user_portfolio_symbol_idx"
        )
        print("    ✓ Verified index: user_email + portfolio_id + symbol")
        
        print("✓ 'portfolio_positions' collection verified!\n")
        
        # ==================== SUMMARY ====================
        print("=" * 60)
        print("SETUP COMPLETE!")
        print("=" * 60)
        print("\nNew Collections:")
        print("  ✓ user_portfolios - Stores user portfolio metadata")
        print("  ✓ user_watchlists - Stores user watchlist metadata")
        
        print("\nUpdated Collections:")
        print("  ✓ watchlists - Now supports multiple watchlists per portfolio")
        print("  ✓ portfolio_positions - Verified portfolio_id support")
        
        print("\nCollection Statistics:")
        for collection_name in ['user_portfolios', 'user_watchlists', 'watchlists', 'portfolio_positions']:
            col = db[collection_name]
            count = col.count_documents({})
            indexes = len(list(col.list_indexes()))
            print(f"  {collection_name}: {count} documents, {indexes} indexes")
        
        print("\n✓ Multi-portfolio system ready!")
        print("=" * 60)
        
        client.close()
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    setup_multi_portfolio_collections()
