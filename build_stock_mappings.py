from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv
import os

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = "portfolio_buzz"
MAPPINGS_COLLECTION = "stock_mappings"

def get_db():
    """Connect to MongoDB"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        return db
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return None

def get_stocks_data():
    """Return comprehensive stock mapping data"""
    return [
        # US STOCKS
        {
            "ticker": "AAPL",
            "company_name": "Apple Inc.",
            "exchange": "US",
            "sector": "Technology",
            "search_terms": ["apple", "appl", "aapl", "apple inc"],
            "common_misspellings": ["apl", "appel", "apple inc."],
            "synonyms": ["iphone company", "mac computer"]
        },
        {
            "ticker": "TSLA",
            "company_name": "Tesla Inc.",
            "exchange": "US",
            "sector": "Automotive",
            "search_terms": ["tesla", "tsla", "tesla inc", "elon musk"],
            "common_misspellings": ["tesl", "teslaa", "tesla inc."],
            "synonyms": ["electric vehicles", "ev maker", "tesla motors"]
        },
        {
            "ticker": "MSFT",
            "company_name": "Microsoft Corporation",
            "exchange": "US",
            "sector": "Technology",
            "search_terms": ["microsoft", "msft", "ms corp", "windows"],
            "common_misspellings": ["microsft", "microsfot", "ms"],
            "synonyms": ["windows", "office", "azure"]
        },
        {
            "ticker": "AMZN",
            "company_name": "Amazon.com Inc.",
            "exchange": "US",
            "sector": "Retail",
            "search_terms": ["amazon", "amzn", "aws", "amazon.com"],
            "common_misspellings": ["amazn", "amzon", "amazon."],
            "synonyms": ["e-commerce", "aws", "cloud"]
        },
        {
            "ticker": "GOOGL",
            "company_name": "Alphabet Inc.",
            "exchange": "US",
            "sector": "Technology",
            "search_terms": ["google", "googl", "alphabet", "goog"],
            "common_misspellings": ["gogle", "googlle", "goolge"],
            "synonyms": ["search engine", "alphabet inc", "youtube"]
        },
        {
            "ticker": "META",
            "company_name": "Meta Platforms Inc.",
            "exchange": "US",
            "sector": "Technology",
            "search_terms": ["meta", "facebook", "fb", "metaverse"],
            "common_misspellings": ["meet", "meta inc", "fb"],
            "synonyms": ["facebook", "instagram", "whatsapp"]
        },
        {
            "ticker": "NVDA",
            "company_name": "NVIDIA Corporation",
            "exchange": "US",
            "sector": "Technology",
            "search_terms": ["nvidia", "nvda", "nvda inc"],
            "common_misspellings": ["nvidia corp", "nvda corp"],
            "synonyms": ["graphics", "gpu", "ai chips"]
        },
        {
            "ticker": "NFLX",
            "company_name": "Netflix Inc.",
            "exchange": "US",
            "sector": "Entertainment",
            "search_terms": ["netflix", "nflx", "streaming"],
            "common_misspellings": ["netfl", "netflx"],
            "synonyms": ["streaming", "movies", "series"]
        },

        # INDIAN STOCKS
        {
            "ticker": "RELIANCE.NS",
            "company_name": "Reliance Industries Limited",
            "exchange": "IN",
            "sector": "Energy",
            "search_terms": ["reliance", "ril", "reliance industries", "reliance.ns"],
            "common_misspellings": ["relance", "reliace", "ril.ns"],
            "synonyms": ["rij", "energy", "oil & gas"]
        },
        {
            "ticker": "TCS.NS",
            "company_name": "Tata Consultancy Services",
            "exchange": "IN",
            "sector": "IT",
            "search_terms": ["tcs", "tata consultancy", "tcs.ns"],
            "common_misspellings": ["tc", "tata consulting"],
            "synonyms": ["it services", "tata group", "consulting"]
        },
        {
            "ticker": "INFY.NS",
            "company_name": "Infosys Limited",
            "exchange": "IN",
            "sector": "IT",
            "search_terms": ["infosys", "infy", "infy.ns"],
            "common_misspellings": ["infosys ltd", "infosys.ns"],
            "synonyms": ["it services", "consulting"]
        },
        {
            "ticker": "HDFCBANK.NS",
            "company_name": "HDFC Bank Limited",
            "exchange": "IN",
            "sector": "Finance",
            "search_terms": ["hdfc bank", "hdfcbank", "hdfc", "hdfcbank.ns"],
            "common_misspellings": ["hdfc bk", "hdfc bank.ns"],
            "synonyms": ["banking", "hdfc"]
        },
        {
            "ticker": "ICICIBANK.NS",
            "company_name": "ICICI Bank Limited",
            "exchange": "IN",
            "sector": "Finance",
            "search_terms": ["icici bank", "icicibank", "icici", "icicibank.ns"],
            "common_misspellings": ["icici bk", "icici bank.ns"],
            "synonyms": ["banking", "icici"]
        },
        {
            "ticker": "SBIN.NS",
            "company_name": "State Bank of India",
            "exchange": "IN",
            "sector": "Finance",
            "search_terms": ["sbi", "state bank", "sbin", "sbin.ns"],
            "common_misspellings": ["sbi bank", "sbin.ns"],
            "synonyms": ["banking", "sbi", "state bank of india"]
        },
        {
            "ticker": "WIPRO.NS",
            "company_name": "Wipro Limited",
            "exchange": "IN",
            "sector": "IT",
            "search_terms": ["wipro", "wipro.ns"],
            "common_misspellings": ["wipro ltd", "wipro.ns"],
            "synonyms": ["it services", "wipro tech"]
        },
        {
            "ticker": "MARUTI.NS",
            "company_name": "Maruti Suzuki India",
            "exchange": "IN",
            "sector": "Automotive",
            "search_terms": ["maruti", "maruti suzuki", "maruti.ns"],
            "common_misspellings": ["maruti motors", "maruti.ns"],
            "synonyms": ["automotive", "car manufacturer"]
        },

        {
            "ticker": "TMPV.NS",
            "company_name": "Tata Motors Passenger Vehicles",
            "exchange": "IN",
            "sector": "Automotive",
            "search_terms": ["tata motors pv", "tmpv", "tata passenger", "tmpv.ns", "tata motors passenger"],
            "common_misspellings": ["tata motors passenger vehicles", "tata pv", "tmpv.ns"],
            "synonyms": ["automotive", "passenger vehicles", "tata group", "tata pv", "car manufacturer"]
        },
        {
            "ticker": "TMCV.NS",
            "company_name": "Tata Motors Commercial Vehicles",
            "exchange": "IN",
            "sector": "Automotive",
            "search_terms": ["tata motors cv", "tmcv", "tata commercial", "tmcv.ns", "tata motors commercial"],
            "common_misspellings": ["tata motors commercial vehicles", "tata cv", "tmcv.ns"],
            "synonyms": ["automotive", "commercial vehicles", "tata group", "tata cv", "truck manufacturer"]
        },
        {
            "ticker": "BAJAJFINSV.NS",
            "company_name": "Bajaj Finserv Limited",
            "exchange": "IN",
            "sector": "Finance",
            "search_terms": ["bajaj finserv", "bajajfinsv", "bajajfinsv.ns"],
            "common_misspellings": ["bajaj fin", "bajaj finserv.ns"],
            "synonyms": ["finance", "bajaj group"]
        },
        {
            "ticker": "AXISBANK.NS",
            "company_name": "Axis Bank Limited",
            "exchange": "IN",
            "sector": "Finance",
            "search_terms": ["axis bank", "axisbank", "axisbank.ns"],
            "common_misspellings": ["axis bk", "axis bank.ns"],
            "synonyms": ["banking", "axis"]
        },
        {
            "ticker": "ASIANPAINT.NS",
            "company_name": "Asian Paints Limited",
            "exchange": "IN",
            "sector": "Chemicals",
            "search_terms": ["asian paints", "asianpaint", "asianpaint.ns"],
            "common_misspellings": ["asian paint", "asian paints.ns"],
            "synonyms": ["paints", "chemical"]
        },
        {
            "ticker": "SUNPHARMA.NS",
            "company_name": "Sun Pharmaceutical Industries",
            "exchange": "IN",
            "sector": "Pharma",
            "search_terms": ["sun pharma", "sunpharma", "sunpharma.ns"],
            "common_misspellings": ["sun pharmaceutical", "sun pharma.ns"],
            "synonyms": ["pharmaceutical", "pharma"]
        },
        {
            "ticker": "APOLLOHOSP.NS",
            "company_name": "Apollo Hospitals Enterprise",
            "exchange": "IN",
            "sector": "Healthcare",
            "search_terms": ["apollo hospitals", "apollohosp", "apollohosp.ns"],
            "common_misspellings": ["apollo hospital", "apollo hosp"],
            "synonyms": ["healthcare", "hospital"]
        },
        {
            "ticker": "DRREDDY.NS",
            "company_name": "Dr. Reddy's Laboratories",
            "exchange": "IN",
            "sector": "Pharma",
            "search_terms": ["dr reddy", "drreddy", "dr reddys", "drreddy.ns"],
            "common_misspellings": ["dr. reddy", "dr reddy.ns"],
            "synonyms": ["pharmaceutical", "pharma"]
        },
        {
            "ticker": "CIPLA.NS",
            "company_name": "Cipla Limited",
            "exchange": "IN",
            "sector": "Pharma",
            "search_terms": ["cipla", "cipla.ns"],
            "common_misspellings": ["cipla ltd", "cipla.ns"],
            "synonyms": ["pharmaceutical", "pharma"]
        },
        {
            "ticker": "SOUTHBANK.NS",
            "company_name": "South Indian Bank",
            "exchange": "IN",
            "sector": "Finance",
            "search_terms": ["south indian bank", "southbank", "sib", "southbank.ns"],
            "common_misspellings": ["south india bank", "sib bank"],
            "synonyms": ["banking", "south indian bank"]
        },
        {
            "ticker": "ITC.NS",
            "company_name": "ITC Limited",
            "exchange": "IN",
            "sector": "Diversified",
            "search_terms": ["itc", "itc limited", "itc.ns"],
            "common_misspellings": ["itc ltd", "itc.ns"],
            "synonyms": ["diversified", "conglomerate"]
        },
        {
            "ticker": "HINDUNILVR.NS",
            "company_name": "Hindustan Unilever",
            "exchange": "IN",
            "sector": "FMCG",
            "search_terms": ["hindustan unilever", "hindunilvr", "hul", "hindunilvr.ns"],
            "common_misspellings": ["hindustan unilever ltd", "hindunilv"],
            "synonyms": ["fmcg", "consumer goods"]
        },
        {
            "ticker": "NESTLEIND.NS",
            "company_name": "Nestlé India",
            "exchange": "IN",
            "sector": "FMCG",
            "search_terms": ["nestle", "nestleind", "nestle india", "nestleind.ns"],
            "common_misspellings": ["nestle ind", "nestle.ns"],
            "synonyms": ["fmcg", "food & beverage"]
        },
        {
            "ticker": "BRITANNIA.NS",
            "company_name": "Britannia Industries",
            "exchange": "IN",
            "sector": "FMCG",
            "search_terms": ["britannia", "britannia.ns"],
            "common_misspellings": ["britannia ind", "britannia.ns"],
            "synonyms": ["fmcg", "food company"]
        },
    ]

def create_indexes():
    """Create indexes for efficient searching"""
    db = get_db()
    if db is None:
        return False
    
    collection = db[MAPPINGS_COLLECTION]
    
    try:
        # Create indexes
        collection.create_index([("ticker", ASCENDING)], unique=True)
        collection.create_index([("company_name", ASCENDING)])
        collection.create_index([("search_terms", ASCENDING)])
        collection.create_index([("exchange", ASCENDING)])
        print("✅ Indexes created successfully")
        return True
    except Exception as e:
        print(f"⚠️ Index creation warning: {str(e)}")
        return True

def populate_stocks():
    """Populate stock mappings collection"""
    db = get_db()
    if db is None:
        print("❌ Failed to connect to MongoDB")
        return False
    
    collection = db[MAPPINGS_COLLECTION]
    
    print(f"📊 Building Stock Mappings Collection...")
    print(f"Database: {DB_NAME}")
    print(f"Collection: {MAPPINGS_COLLECTION}")
    print("-" * 60)
    
    # Get stock data
    stocks = get_stocks_data()
    total_stocks = len(stocks)
    
    # Clear existing data (optional - uncomment to reset)
    # collection.delete_many({})
    # print("🔄 Cleared existing data")
    
    added = 0
    updated = 0
    duplicates = 0
    
    for stock in stocks:
        try:
            result = collection.update_one(
                {"ticker": stock["ticker"]},
                {"$set": stock},
                upsert=True
            )
            
            if result.upserted_id:
                added += 1
                status = "✅ ADDED"
            else:
                updated += 1
                status = "🔄 UPDATED"
            
            print(f"{status} | {stock['ticker']:15} | {stock['company_name']:35} | {stock['exchange']}")
            
        except Exception as e:
            duplicates += 1
            print(f"⚠️  DUPLICATE | {stock['ticker']:15} | Error: {str(e)[:40]}")
    
    print("-" * 60)
    print(f"\n📈 Summary:")
    print(f"   Total Stocks: {total_stocks}")
    print(f"   Added: {added}")
    print(f"   Updated: {updated}")
    print(f"   Duplicates/Errors: {duplicates}")
    
    return True

def verify_collection():
    """Verify the collection was created"""
    db = get_db()
    if db is None:
        return
    
    collection = db[MAPPINGS_COLLECTION]
    count = collection.count_documents({})
    
    print(f"\n✅ Verification:")
    print(f"   Total documents in collection: {count}")
    
    # Show sample
    print(f"\n📋 Sample Documents:")
    for doc in collection.find().limit(3):
        print(f"\n   Ticker: {doc['ticker']}")
        print(f"   Company: {doc['company_name']}")
        print(f"   Exchange: {doc['exchange']}")
        print(f"   Search Terms: {', '.join(doc['search_terms'][:3])}")

def main():
    """Main execution"""
    print("\n" + "="*60)
    print("🏗️  STOCK MAPPING COLLECTION BUILDER")
    print("="*60)
    print("\nThis utility builds the stock_mappings collection in MongoDB")
    print("Run this file ONCE to populate the collection\n")
    
    # Step 1: Create indexes
    print("Step 1: Creating indexes...")
    if not create_indexes():
        print("❌ Failed to create indexes")
        return
    
    # Step 2: Populate stocks
    print("\nStep 2: Populating stocks...")
    if not populate_stocks():
        print("❌ Failed to populate stocks")
        return
    
    # Step 3: Verify
    print("\nStep 3: Verifying...")
    verify_collection()
    
    print("\n" + "="*60)
    print("✅ COMPLETE! Stock mappings collection is ready to use")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
