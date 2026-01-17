"""
MongoDB Setup Script for Mutual Fund Watchlists
Creates necessary collections and indexes
"""

from pymongo import MongoClient, ASCENDING
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://nikhilsuresh:eZOKT9nbysKcpAuq@cluster0.s5urjmx.mongodb.net/?appName=Cluster0')
DB_NAME = 'portfolio_buzz'

def setup_mf_collections():
    """Setup mutual fund watchlist collections"""
    
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print(f"Connected to database: {DB_NAME}")
    
    # Collection 1: mf_watchlist (stores individual fund entries)
    print("\n1. Setting up 'mf_watchlist' collection...")
    mf_watchlist_col = db['mf_watchlist']
    
    # Create indexes for mf_watchlist
    print("   Creating indexes...")
    mf_watchlist_col.create_index([("user_email", ASCENDING)])
    mf_watchlist_col.create_index([("scheme_code", ASCENDING)])
    mf_watchlist_col.create_index([("watchlist_id", ASCENDING)])
    mf_watchlist_col.create_index([
        ("user_email", ASCENDING),
        ("watchlist_id", ASCENDING),
        ("scheme_code", ASCENDING)
    ], unique=True)  # Prevent duplicate funds in same watchlist
    
    print("   ✓ Indexes created for mf_watchlist")
    
    # Collection 2: user_mf_watchlists (stores watchlist metadata)
    print("\n2. Setting up 'user_mf_watchlists' collection...")
    user_mf_watchlists_col = db['user_mf_watchlists']
    
    # Create indexes for user_mf_watchlists
    print("   Creating indexes...")
    user_mf_watchlists_col.create_index([("user_email", ASCENDING)])
    user_mf_watchlists_col.create_index([("portfolio_id", ASCENDING)])
    user_mf_watchlists_col.create_index([("watchlist_id", ASCENDING)], unique=True)
    user_mf_watchlists_col.create_index([
        ("user_email", ASCENDING),
        ("portfolio_id", ASCENDING)
    ])
    
    print("   ✓ Indexes created for user_mf_watchlists")
    
    # Show collection stats
    print("\n" + "="*60)
    print("SETUP COMPLETE!")
    print("="*60)
    
    print("\nCollections created:")
    print(f"  1. mf_watchlist - Stores individual mutual fund entries")
    print(f"  2. user_mf_watchlists - Stores MF watchlist metadata")
    
    print("\nCollection Structure:")
    print("\n  mf_watchlist document:")
    print("  {")
    print("    user_email: string,")
    print("    scheme_code: string,")
    print("    watchlist_id: string,")
    print("    portfolio_id: string,")
    print("    added_at: datetime")
    print("  }")
    
    print("\n  user_mf_watchlists document:")
    print("  {")
    print("    watchlist_id: string (UUID),")
    print("    user_email: string,")
    print("    portfolio_id: string,")
    print("    watchlist_name: string,")
    print("    description: string,")
    print("    is_default: boolean,")
    print("    created_at: datetime,")
    print("    updated_at: datetime")
    print("  }")
    
    # Check existing data
    mf_count = mf_watchlist_col.count_documents({})
    watchlist_count = user_mf_watchlists_col.count_documents({})
    
    print("\nCurrent Data:")
    print(f"  MF Watchlist entries: {mf_count}")
    print(f"  MF Watchlists: {watchlist_count}")
    
    print("\n" + "="*60)
    
    client.close()
    print("\nConnection closed.")

if __name__ == "__main__":
    print("="*60)
    print("MUTUAL FUND WATCHLIST SETUP")
    print("="*60)
    setup_mf_collections()
