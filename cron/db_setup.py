"""
Database setup script for news scraper
Creates collections and indexes for optimal performance
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, OperationFailure
from config import config
import sys


def setup_database():
    """Initialize MongoDB collections and indexes"""
    
    print("=" * 60)
    print("NEWS SCRAPER DATABASE SETUP")
    print("=" * 60)
    
    try:
        # Connect to MongoDB
        print(f"\n[1/4] Connecting to MongoDB...")
        print(f"      URI: {config.MONGODB_URI[:30]}...")
        
        client = MongoClient(
            config.MONGODB_URI,
            serverSelectionTimeoutMS=5000
        )
        
        # Test connection
        client.admin.command('ping')
        print("      ✓ Connected successfully")
        
        # Get database
        db = client[config.DB_NAME]
        print(f"\n[2/4] Using database: {config.DB_NAME}")
        
        # Get or create news collection
        news_collection = db[config.NEWS_COLLECTION]
        print(f"\n[3/4] Setting up collection: {config.NEWS_COLLECTION}")
        
        # Create indexes
        print("\n[4/4] Creating indexes...")
        
        # 1. Unique index on ticker for fast lookups
        news_collection.create_index(
            [("ticker", ASCENDING)],
            unique=True,
            name="ticker_unique"
        )
        print("      ✓ Created unique index on 'ticker'")
        
        # 2. Index on last_updated for freshness queries
        news_collection.create_index(
            [("last_updated", DESCENDING)],
            name="last_updated_desc"
        )
        print("      ✓ Created index on 'last_updated'")
        
        # 3. Index on articles.published_date for time-based filtering
        news_collection.create_index(
            [("articles.published_date", DESCENDING)],
            name="articles_published_date_desc"
        )
        print("      ✓ Created index on 'articles.published_date'")
        
        # 4. TTL index to auto-delete old articles (30 days)
        news_collection.create_index(
            [("last_updated", ASCENDING)],
            expireAfterSeconds=config.DATA_TTL_DAYS * 24 * 60 * 60,
            name="ttl_index"
        )
        print(f"      ✓ Created TTL index (expires after {config.DATA_TTL_DAYS} days)")
        
        # List all indexes
        print("\n" + "=" * 60)
        print("INDEXES CREATED:")
        print("=" * 60)
        for idx in news_collection.list_indexes():
            print(f"  • {idx['name']}: {idx.get('key', {})}")
        
        # Collection stats
        print("\n" + "=" * 60)
        print("COLLECTION STATS:")
        print("=" * 60)
        stats = db.command("collstats", config.NEWS_COLLECTION)
        print(f"  • Documents: {stats.get('count', 0)}")
        print(f"  • Size: {stats.get('size', 0) / 1024:.2f} KB")
        print(f"  • Indexes: {stats.get('nindexes', 0)}")
        
        print("\n" + "=" * 60)
        print("✓ DATABASE SETUP COMPLETE")
        print("=" * 60)
        print("\nYou can now run the news scraper:")
        print("  python news_scraper.py")
        print()
        
        client.close()
        return True
        
    except ConnectionFailure as e:
        print(f"\n✗ ERROR: Failed to connect to MongoDB")
        print(f"  {str(e)}")
        print(f"\nPlease check:")
        print(f"  1. MongoDB is running")
        print(f"  2. MONGODB_URI in .env is correct")
        return False
        
    except OperationFailure as e:
        print(f"\n✗ ERROR: Database operation failed")
        print(f"  {str(e)}")
        return False
        
    except Exception as e:
        print(f"\n✗ ERROR: Unexpected error")
        print(f"  {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = setup_database()
    sys.exit(0 if success else 1)
