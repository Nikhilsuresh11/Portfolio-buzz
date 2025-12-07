# Script to populate Indian stocks in MongoDB
from utils.db import get_stock_mappings_collection

def populate_indian_stocks():
    """Populate MongoDB with popular Indian stocks"""
    
    stocks_col = get_stock_mappings_collection()
    
    # Popular Indian stocks (NSE)
    indian_stocks = [
        {
            "ticker": "RELIANCE.NS",
            "company_name": "Reliance Industries Limited",
            "official_name": "Reliance Industries Ltd",
            "exchange": "NSE",
            "sector": "Energy",
            "industry": "Oil & Gas",
            "synonyms": ["RIL", "Reliance", "Mukesh Ambani"],
            "search_terms": ["reliance", "ril", "oil", "gas", "jio"]
        },
        {
            "ticker": "TCS.NS",
            "company_name": "Tata Consultancy Services Limited",
            "official_name": "TCS Ltd",
            "exchange": "NSE",
            "sector": "Technology",
            "industry": "IT Services",
            "synonyms": ["TCS", "Tata Consultancy"],
            "search_terms": ["tcs", "tata", "consultancy", "it", "software"]
        },
        {
            "ticker": "HDFCBANK.NS",
            "company_name": "HDFC Bank Limited",
            "official_name": "HDFC Bank Ltd",
            "exchange": "NSE",
            "sector": "Financial Services",
            "industry": "Banking",
            "synonyms": ["HDFC Bank", "HDFC"],
            "search_terms": ["hdfc", "bank", "banking", "finance"]
        },
        {
            "ticker": "INFY.NS",
            "company_name": "Infosys Limited",
            "official_name": "Infosys Ltd",
            "exchange": "NSE",
            "sector": "Technology",
            "industry": "IT Services",
            "synonyms": ["Infosys", "INFY"],
            "search_terms": ["infosys", "infy", "it", "software", "narayana murthy"]
        },
        {
            "ticker": "ICICIBANK.NS",
            "company_name": "ICICI Bank Limited",
            "official_name": "ICICI Bank Ltd",
            "exchange": "NSE",
            "sector": "Financial Services",
            "industry": "Banking",
            "synonyms": ["ICICI Bank", "ICICI"],
            "search_terms": ["icici", "bank", "banking", "finance"]
        },
        {
            "ticker": "HINDUNILVR.NS",
            "company_name": "Hindustan Unilever Limited",
            "official_name": "Hindustan Unilever Ltd",
            "exchange": "NSE",
            "sector": "Consumer Goods",
            "industry": "FMCG",
            "synonyms": ["HUL", "Hindustan Unilever"],
            "search_terms": ["hul", "unilever", "fmcg", "consumer"]
        },
        {
            "ticker": "ITC.NS",
            "company_name": "ITC Limited",
            "official_name": "ITC Ltd",
            "exchange": "NSE",
            "sector": "Consumer Goods",
            "industry": "Conglomerate",
            "synonyms": ["ITC"],
            "search_terms": ["itc", "tobacco", "hotels", "fmcg"]
        },
        {
            "ticker": "SBIN.NS",
            "company_name": "State Bank of India",
            "official_name": "SBI",
            "exchange": "NSE",
            "sector": "Financial Services",
            "industry": "Banking",
            "synonyms": ["SBI", "State Bank"],
            "search_terms": ["sbi", "state bank", "banking", "government bank"]
        },
        {
            "ticker": "BHARTIARTL.NS",
            "company_name": "Bharti Airtel Limited",
            "official_name": "Bharti Airtel Ltd",
            "exchange": "NSE",
            "sector": "Telecommunication",
            "industry": "Telecom Services",
            "synonyms": ["Airtel", "Bharti"],
            "search_terms": ["airtel", "bharti", "telecom", "mobile"]
        },
        {
            "ticker": "KOTAKBANK.NS",
            "company_name": "Kotak Mahindra Bank Limited",
            "official_name": "Kotak Mahindra Bank Ltd",
            "exchange": "NSE",
            "sector": "Financial Services",
            "industry": "Banking",
            "synonyms": ["Kotak Bank", "Kotak"],
            "search_terms": ["kotak", "bank", "banking", "mahindra"]
        },
        {
            "ticker": "LT.NS",
            "company_name": "Larsen & Toubro Limited",
            "official_name": "L&T Ltd",
            "exchange": "NSE",
            "sector": "Industrials",
            "industry": "Construction & Engineering",
            "synonyms": ["L&T", "Larsen Toubro"],
            "search_terms": ["lt", "larsen", "toubro", "construction", "engineering"]
        },
        {
            "ticker": "HCLTECH.NS",
            "company_name": "HCL Technologies Limited",
            "official_name": "HCL Technologies Ltd",
            "exchange": "NSE",
            "sector": "Technology",
            "industry": "IT Services",
            "synonyms": ["HCL Tech", "HCL"],
            "search_terms": ["hcl", "tech", "it", "software"]
        },
        {
            "ticker": "ASIANPAINT.NS",
            "company_name": "Asian Paints Limited",
            "official_name": "Asian Paints Ltd",
            "exchange": "NSE",
            "sector": "Consumer Goods",
            "industry": "Paints",
            "synonyms": ["Asian Paints"],
            "search_terms": ["asian", "paints", "paint", "home decor"]
        },
        {
            "ticker": "MARUTI.NS",
            "company_name": "Maruti Suzuki India Limited",
            "official_name": "Maruti Suzuki India Ltd",
            "exchange": "NSE",
            "sector": "Automobile",
            "industry": "Auto Manufacturers",
            "synonyms": ["Maruti", "Maruti Suzuki"],
            "search_terms": ["maruti", "suzuki", "car", "automobile"]
        },
        {
            "ticker": "SUNPHARMA.NS",
            "company_name": "Sun Pharmaceutical Industries Limited",
            "official_name": "Sun Pharma Industries Ltd",
            "exchange": "NSE",
            "sector": "Healthcare",
            "industry": "Pharmaceuticals",
            "synonyms": ["Sun Pharma"],
            "search_terms": ["sun", "pharma", "pharmaceutical", "medicine"]
        },
        {
            "ticker": "TITAN.NS",
            "company_name": "Titan Company Limited",
            "official_name": "Titan Company Ltd",
            "exchange": "NSE",
            "sector": "Consumer Goods",
            "industry": "Jewelry & Watches",
            "synonyms": ["Titan", "Tanishq"],
            "search_terms": ["titan", "tanishq", "jewelry", "watches"]
        },
        {
            "ticker": "WIPRO.NS",
            "company_name": "Wipro Limited",
            "official_name": "Wipro Ltd",
            "exchange": "NSE",
            "sector": "Technology",
            "industry": "IT Services",
            "synonyms": ["Wipro"],
            "search_terms": ["wipro", "it", "software", "azim premji"]
        },
        {
            "ticker": "ULTRACEMCO.NS",
            "company_name": "UltraTech Cement Limited",
            "official_name": "UltraTech Cement Ltd",
            "exchange": "NSE",
            "sector": "Industrials",
            "industry": "Cement",
            "synonyms": ["UltraTech", "Ultratech Cement"],
            "search_terms": ["ultratech", "cement", "construction"]
        },
        {
            "ticker": "AXISBANK.NS",
            "company_name": "Axis Bank Limited",
            "official_name": "Axis Bank Ltd",
            "exchange": "NSE",
            "sector": "Financial Services",
            "industry": "Banking",
            "synonyms": ["Axis Bank", "Axis"],
            "search_terms": ["axis", "bank", "banking"]
        },
        {
            "ticker": "NESTLEIND.NS",
            "company_name": "Nestle India Limited",
            "official_name": "Nestle India Ltd",
            "exchange": "NSE",
            "sector": "Consumer Goods",
            "industry": "Food Products",
            "synonyms": ["Nestle", "Nestle India"],
            "search_terms": ["nestle", "maggi", "nescafe", "food"]
        },
        {
            "ticker": "TATAMOTORS.NS",
            "company_name": "Tata Motors Limited",
            "official_name": "Tata Motors Ltd",
            "exchange": "NSE",
            "sector": "Automobile",
            "industry": "Auto Manufacturers",
            "synonyms": ["Tata Motors"],
            "search_terms": ["tata", "motors", "car", "automobile", "jaguar"]
        },
        {
            "ticker": "TATASTEEL.NS",
            "company_name": "Tata Steel Limited",
            "official_name": "Tata Steel Ltd",
            "exchange": "NSE",
            "sector": "Materials",
            "industry": "Steel",
            "synonyms": ["Tata Steel"],
            "search_terms": ["tata", "steel", "metal", "iron"]
        },
        {
            "ticker": "POWERGRID.NS",
            "company_name": "Power Grid Corporation of India Limited",
            "official_name": "Power Grid Corporation Ltd",
            "exchange": "NSE",
            "sector": "Utilities",
            "industry": "Electric Utilities",
            "synonyms": ["Power Grid", "PGCIL"],
            "search_terms": ["power", "grid", "electricity", "transmission"]
        },
        {
            "ticker": "NTPC.NS",
            "company_name": "NTPC Limited",
            "official_name": "NTPC Ltd",
            "exchange": "NSE",
            "sector": "Utilities",
            "industry": "Power Generation",
            "synonyms": ["NTPC"],
            "search_terms": ["ntpc", "power", "electricity", "thermal"]
        },
        {
            "ticker": "ONGC.NS",
            "company_name": "Oil and Natural Gas Corporation Limited",
            "official_name": "ONGC Ltd",
            "exchange": "NSE",
            "sector": "Energy",
            "industry": "Oil & Gas Exploration",
            "synonyms": ["ONGC"],
            "search_terms": ["ongc", "oil", "gas", "petroleum"]
        },
        {
            "ticker": "BAJFINANCE.NS",
            "company_name": "Bajaj Finance Limited",
            "official_name": "Bajaj Finance Ltd",
            "exchange": "NSE",
            "sector": "Financial Services",
            "industry": "Finance",
            "synonyms": ["Bajaj Finance"],
            "search_terms": ["bajaj", "finance", "loan", "nbfc"]
        },
        {
            "ticker": "ADANIPORTS.NS",
            "company_name": "Adani Ports and Special Economic Zone Limited",
            "official_name": "Adani Ports Ltd",
            "exchange": "NSE",
            "sector": "Industrials",
            "industry": "Ports & Logistics",
            "synonyms": ["Adani Ports", "APSEZ"],
            "search_terms": ["adani", "ports", "logistics", "shipping"]
        },
        {
            "ticker": "TECHM.NS",
            "company_name": "Tech Mahindra Limited",
            "official_name": "Tech Mahindra Ltd",
            "exchange": "NSE",
            "sector": "Technology",
            "industry": "IT Services",
            "synonyms": ["Tech Mahindra"],
            "search_terms": ["tech", "mahindra", "it", "software"]
        },
        {
            "ticker": "DIVISLAB.NS",
            "company_name": "Divi's Laboratories Limited",
            "official_name": "Divi's Laboratories Ltd",
            "exchange": "NSE",
            "sector": "Healthcare",
            "industry": "Pharmaceuticals",
            "synonyms": ["Divis Lab", "Divi's"],
            "search_terms": ["divis", "divi", "pharma", "laboratory"]
        },
        {
            "ticker": "BAJAJFINSV.NS",
            "company_name": "Bajaj Finserv Limited",
            "official_name": "Bajaj Finserv Ltd",
            "exchange": "NSE",
            "sector": "Financial Services",
            "industry": "Diversified Financial",
            "synonyms": ["Bajaj Finserv"],
            "search_terms": ["bajaj", "finserv", "finance", "insurance"]
        }
    ]
    
    # Insert or update stocks
    inserted_count = 0
    updated_count = 0
    
    for stock in indian_stocks:
        existing = stocks_col.find_one({"ticker": stock["ticker"]})
        if existing:
            stocks_col.update_one(
                {"ticker": stock["ticker"]},
                {"$set": stock}
            )
            updated_count += 1
            print(f"Updated: {stock['ticker']} - {stock['company_name']}")
        else:
            stocks_col.insert_one(stock)
            inserted_count += 1
            print(f"Inserted: {stock['ticker']} - {stock['company_name']}")
    
    print(f"\n✅ Complete! Inserted: {inserted_count}, Updated: {updated_count}")
    print(f"Total Indian stocks in database: {len(indian_stocks)}")

if __name__ == "__main__":
    populate_indian_stocks()
