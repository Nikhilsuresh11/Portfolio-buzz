"""
Script to add portfolio positions to MongoDB
Run this script from the backend directory: python scripts/add_positions.py
"""

import sys
import os
from pymongo import MongoClient
from datetime import datetime

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MONGODB_URI = "mongodb+srv://nikhilsuresh:eZOKT9nbysKcpAuq@cluster0.s5urjmx.mongodb.net/?appName=Cluster0"

positions_data = [
    {
        "quantity": 20.0,
        "symbol": "KTKBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 3540.0,
        "buy_date": "2025-11-10",
        "nifty_value": 25574.349609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "08893ca7-2832-4307-bbbc-8c4a54fcc486"
    },
    {
        "quantity": 4.0,
        "symbol": "NATCOPHARM",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 3220.0,
        "buy_date": "2025-09-26",
        "nifty_value": 24654.69921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "0c9a12db-0216-464a-9e9e-df8b81c5229c"
    },
    {
        "quantity": 5.0,
        "symbol": "KTKBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 875.0,
        "buy_date": "2025-08-06",
        "nifty_value": 24574.19921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "0dd9866f-2308-4b88-b889-88a981e658d5"
    },
    {
        "quantity": 1.0,
        "symbol": "ITC",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 417.75,
        "buy_date": "2025-06-02",
        "nifty_value": 24716.599609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "0fef2fdc-3c27-44f1-93c0-c4a72374711c"
    },
    {
        "quantity": 10.0,
        "symbol": "GOLDBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 970.7,
        "buy_date": "2025-10-03",
        "nifty_value": 24894.25,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "12eaf350-54e4-4dd5-8acf-bd84b5a4a733"
    },
    {
        "quantity": 10.0,
        "symbol": "SILVERBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1399.7,
        "buy_date": "2025-10-03",
        "nifty_value": 24894.25,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "1c512568-1153-45c7-9e74-11cfe7d92810"
    },
    {
        "quantity": 24.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 688.8,
        "buy_date": "2025-09-29",
        "nifty_value": 24634.900390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "1c7c3260-3af8-4e43-bb43-7165799afe7d"
    },
    {
        "buy_date": "2025-12-02",
        "invested_amount": 1951.2,
        "nifty_value": 26032.19921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "portfolio_name": "sankar stocks",
        "quantity": 4.0,
        "symbol": "JSWENERGY",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "position_id": "222179ec-2fae-43ba-92c9-54e5d7c0d4ea"
    },
    {
        "quantity": 1.0,
        "symbol": "ITC",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 404.0,
        "buy_date": "2025-12-01",
        "nifty_value": 26175.75,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "2384fa55-67fe-47a8-8759-cd983114177c"
    },
    {
        "quantity": 7.0,
        "symbol": "SILVERBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 770.0,
        "buy_date": "2025-08-18",
        "nifty_value": 24876.94921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "27491702-b38c-4ce7-a58c-30e50e716dde"
    },
    {
        "quantity": 2.0,
        "symbol": "INDUSINDBK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1470.0,
        "buy_date": "2025-09-22",
        "nifty_value": 25202.349609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "2fc31214-41b0-4353-bc6b-c2e76a0a1c65"
    },
    {
        "quantity": 1.0,
        "symbol": "TMPV",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 464.74,
        "buy_date": "2025-07-14",
        "nifty_value": 25082.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "325cfabb-e488-4b66-821f-4c0d7b7ed857"
    },
    {
        "quantity": 5.0,
        "symbol": "GOLDBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 407.1,
        "buy_date": "2025-06-06",
        "nifty_value": 25003.05078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "32d1945f-e595-422c-bad4-e9711667d7cb"
    },
    {
        "quantity": 6.0,
        "symbol": "NATCOPHARM",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 4919.1,
        "buy_date": "2025-11-04",
        "nifty_value": 25597.650390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "335bba72-0dbf-40db-8542-bcdc22b428a4"
    },
    {
        "quantity": 1.0,
        "symbol": "NATCOPHARM",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 920.0,
        "buy_date": "2025-07-02",
        "nifty_value": 25453.400390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "3627dbce-747d-4e44-b436-7c7accd3915e"
    },
    {
        "quantity": 10.0,
        "symbol": "GOLDBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 802.0,
        "buy_date": "2025-07-09",
        "nifty_value": 25476.099609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "368897e0-7a2d-495b-90b9-f17c9082877b"
    },
    {
        "quantity": 1.0,
        "symbol": "MANINFRA",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 162.68,
        "buy_date": "2025-06-13",
        "nifty_value": 24718.599609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "3774d99e-ef7b-468d-87d4-5f959ecdaa8c"
    },
    {
        "quantity": 5.0,
        "symbol": "IDFCFIRSTB",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 343.0,
        "buy_date": "2025-06-03",
        "nifty_value": 24542.5,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "39f96fe7-a578-4026-bf83-51cd90d4c6ac"
    },
    {
        "quantity": 1.0,
        "symbol": "NATCOPHARM",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 845.0,
        "buy_date": "2025-09-08",
        "nifty_value": 24773.150390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "3ca3a119-50f4-48d8-ab27-6107b2e2050b"
    },
    {
        "quantity": 5.0,
        "symbol": "ITC",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1838.5,
        "buy_date": "2026-01-01",
        "nifty_value": 26146.55078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "4728f6d0-ee73-43c9-95ce-4c197ad4b0ff"
    },
    {
        "quantity": 3.0,
        "symbol": "SILVERBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 309.0,
        "buy_date": "2025-06-11",
        "nifty_value": 25141.400390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "4961dbeb-5738-42e8-928b-3c43fb66c450"
    },
    {
        "quantity": 9.0,
        "symbol": "MANINFRA",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1527.03,
        "buy_date": "2025-06-12",
        "nifty_value": 24888.19921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "4a47e14a-16de-4f81-b37d-d1956a3c2a9e"
    },
    {
        "quantity": 8.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 233.6,
        "buy_date": "2025-07-22",
        "nifty_value": 25060.900390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "4cacd3bc-ccbb-4ee6-8dc0-36359644ea08"
    },
    {
        "quantity": 5.0,
        "symbol": "SILVERBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 527.5,
        "buy_date": "2025-08-01",
        "nifty_value": 24565.349609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "51d5b80b-748b-4c95-9eae-37a5b11a2979"
    },
    {
        "quantity": 10.0,
        "symbol": "IDFCFIRSTB",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 745.0,
        "buy_date": "2025-07-14",
        "nifty_value": 25082.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "538a2215-146a-487d-a0b2-20869efcedd2"
    },
    {
        "quantity": 1.0,
        "symbol": "TATAPOWER",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 385.0,
        "buy_date": "2025-08-05",
        "nifty_value": 24649.55078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "53f29d01-e204-4429-aeb7-562550919037"
    },
    {
        "quantity": 1.0,
        "symbol": "TITAGARH",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 925.0,
        "buy_date": "2025-07-18",
        "nifty_value": 24968.400390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "58594292-90f5-4ab2-83c9-58347d7a057b"
    },
    {
        "quantity": 10.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 285.0,
        "buy_date": "2025-08-06",
        "nifty_value": 24574.19921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "59e045a9-49ca-42cc-aab2-3fed17afd488"
    },
    {
        "quantity": 10.0,
        "symbol": "GOLDBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 942.0,
        "buy_date": "2025-09-26",
        "nifty_value": 24654.69921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "59e4fb0d-c28f-46f4-88ed-79510b55015e"
    },
    {
        "quantity": 18.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 542.0,
        "buy_date": "2025-07-08",
        "nifty_value": 25522.5,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "5cf199f8-5f65-4089-af6b-b643519a504e"
    },
    {
        "quantity": 6.0,
        "symbol": "IDFCFIRSTB",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 417.0,
        "buy_date": "2025-07-30",
        "nifty_value": 24855.05078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "601edb9b-0661-41ac-ad33-0948aad18add"
    },
    {
        "quantity": 52.0,
        "symbol": "GOLDBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 5194.28,
        "buy_date": "2025-10-07",
        "nifty_value": 25108.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "630aa8d1-30c8-4a9d-b211-11d9b69129d3"
    },
    {
        "quantity": 1.0,
        "symbol": "ITC",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 406.65,
        "buy_date": "2025-11-10",
        "nifty_value": 25574.349609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "67b50648-596d-4643-aa88-dc86c7e52773"
    },
    {
        "quantity": 10.0,
        "symbol": "SILVERBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1434.8,
        "buy_date": "2025-10-07",
        "nifty_value": 25108.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "6bc0d9ee-a1c3-49f7-9218-e37b30ae9c10"
    },
    {
        "quantity": 10.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 307.8,
        "buy_date": "2025-06-10",
        "nifty_value": 25104.25,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "6fd8f5fc-3f53-40ff-9e77-6024f49c00f6"
    },
    {
        "quantity": 24.0,
        "symbol": "IDFCFIRSTB",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1867.2,
        "buy_date": "2025-07-04",
        "nifty_value": 25461.0,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "72c70437-ae12-4390-9c19-bfd4835fcda6"
    },
    {
        "quantity": 10.0,
        "symbol": "KTKBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 2074.7,
        "buy_date": "2026-01-01",
        "nifty_value": 26146.55078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "765a1885-e31c-4179-99f2-9569a1715576"
    },
    {
        "quantity": 14.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 531.72,
        "buy_date": "2025-10-24",
        "nifty_value": 25795.150390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "774dfd8e-9758-471f-9fd0-07abb046d271"
    },
    {
        "quantity": 1.0,
        "symbol": "GOLDBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 106.69,
        "buy_date": "2025-12-01",
        "nifty_value": 26175.75,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "77719fc1-c674-491d-a69a-921a2a744be9"
    },
    {
        "quantity": 2.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 59.0,
        "buy_date": "2025-06-03",
        "nifty_value": 24542.5,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "788ca546-f2cf-43f4-9699-9f7a39b43526"
    },
    {
        "quantity": 1.0,
        "symbol": "TMPV",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 468.87,
        "buy_date": "2025-07-02",
        "nifty_value": 25453.400390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "7a72c119-b33b-481d-990b-65b93c537082"
    },
    {
        "quantity": 10.0,
        "symbol": "KNRCON",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1620.0,
        "buy_date": "2025-12-01",
        "nifty_value": 26175.75,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "7ae7a248-1e05-4d79-aa35-243bc6736443"
    },
    {
        "quantity": 4.0,
        "symbol": "TMPV",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1440.2,
        "buy_date": "2025-12-02",
        "nifty_value": 26032.19921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "7c62d6bc-3404-4321-a387-1227ddb4410c"
    },
    {
        "quantity": 1.0,
        "symbol": "ITC",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 413.2,
        "buy_date": "2025-07-02",
        "nifty_value": 25453.400390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "7d98803b-b074-4bf3-a4c6-137fd71078b6"
    },
    {
        "quantity": 1.0,
        "symbol": "INDUSINDBK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 855.25,
        "buy_date": "2025-07-04",
        "nifty_value": 25461.0,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "83fe9fff-efd2-45fc-a848-7dc2661d0218"
    },
    {
        "quantity": 10.0,
        "symbol": "MANINFRA",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1304.8,
        "buy_date": "2025-12-02",
        "nifty_value": 26032.19921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "8adb6b71-3599-481e-b457-8d8f38f8d574"
    },
    {
        "quantity": 1.0,
        "symbol": "ITC",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 404.5,
        "buy_date": "2025-10-03",
        "nifty_value": 24894.25,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "8f5c802e-9c35-4c8a-8629-805c73fbae25"
    },
    {
        "quantity": 5.0,
        "symbol": "GOLDBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 400.45,
        "buy_date": "2025-06-10",
        "nifty_value": 25104.25,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "934f0b8d-8ef7-4c22-96be-8bbfc630e77d"
    },
    {
        "quantity": 20.0,
        "symbol": "KNRCON",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 3195.2,
        "buy_date": "2025-12-02",
        "nifty_value": 26032.19921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "935c3448-62f8-4e79-9871-99eeedcc09bf"
    },
    {
        "quantity": 3.0,
        "symbol": "MANINFRA",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 468.0,
        "buy_date": "2025-08-18",
        "nifty_value": 24876.94921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "995eeea3-8cc9-43f1-a4b1-c23cc4d66211"
    },
    {
        "quantity": 14.0,
        "symbol": "IDFCFIRSTB",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 952.0,
        "buy_date": "2025-08-01",
        "nifty_value": 24565.349609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "99925909-78a1-4bb6-b4d9-09a2f4dc38f2"
    },
    {
        "quantity": 13.0,
        "symbol": "SILVERBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1712.1,
        "buy_date": "2025-09-26",
        "nifty_value": 24654.69921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "9a35bb58-148e-4b8a-98ae-1b73fb51e56e"
    },
    {
        "quantity": 2.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 79.14,
        "buy_date": "2026-01-05",
        "nifty_value": 26250.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "9ae14396-df07-4718-ac93-f34defe157b0"
    },
    {
        "quantity": 28.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1062.32,
        "buy_date": "2026-01-01",
        "nifty_value": 26146.55078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "9b295e13-75f8-4d15-bb38-8e006a91f859"
    },
    {
        "quantity": 2.0,
        "symbol": "TMCV",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 868.7,
        "buy_date": "2026-01-05",
        "nifty_value": 26250.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "9b329b5c-825c-4a75-a407-5b5e29dbaef1"
    },
    {
        "quantity": 2.0,
        "symbol": "MANINFRA",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 331.18,
        "buy_date": "2025-08-08",
        "nifty_value": 24363.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "9d2065b4-95de-49b4-8a45-41526f5b0943"
    },
    {
        "quantity": 1.0,
        "symbol": "JSWENERGY",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 510.0,
        "buy_date": "2025-08-01",
        "nifty_value": 24565.349609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "a012a9bb-0bf3-4b5e-84af-97d95fa71062"
    },
    {
        "quantity": 1.0,
        "symbol": "NATCOPHARM",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 794.55,
        "buy_date": "2025-11-11",
        "nifty_value": 25694.94921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "a20993c2-3561-4eeb-8c73-1084e2f95b6d"
    },
    {
        "quantity": 10.0,
        "symbol": "GOLDBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 922.8,
        "buy_date": "2025-09-22",
        "nifty_value": 25202.349609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "a73664f9-98ec-4456-a028-41363b5ef43a"
    },
    {
        "quantity": 1.0,
        "symbol": "TITAGARH",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 825.0,
        "buy_date": "2025-08-08",
        "nifty_value": 24363.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "a75e0903-a7a2-4581-befe-4959f1247c4c"
    },
    {
        "quantity": 9.0,
        "symbol": "GOLDBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1010.16,
        "buy_date": "2026-01-05",
        "nifty_value": 26250.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "b10aeb79-091c-4a9b-b4e7-5ed4bc99dffa"
    },
    {
        "quantity": 1.0,
        "symbol": "TITAGARH",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 780.0,
        "buy_date": "2025-08-11",
        "nifty_value": 24585.05078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "ba8849ea-84fe-494d-b5cb-d2e2fb513da3"
    },
    {
        "quantity": 1.0,
        "symbol": "TMPV",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 435.13,
        "buy_date": "2025-08-08",
        "nifty_value": 24363.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "bd76350f-fe72-4020-816c-5b71e9ec7904"
    },
    {
        "quantity": 1.0,
        "symbol": "IDFCFIRSTB",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 68.5,
        "buy_date": "2025-06-02",
        "nifty_value": 24716.599609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "bf1e7c31-b00a-4b0d-9a2b-0cbd9492d5c5"
    },
    {
        "quantity": 2.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 76.72,
        "buy_date": "2025-11-10",
        "nifty_value": 25574.349609375,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "c3f47c51-4f58-44c8-aa7b-b0f911644325"
    },
    {
        "buy_date": "2025-06-03",
        "invested_amount": 970.86,
        "nifty_value": 24542.5,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "portfolio_name": "sankar stocks",
        "quantity": 2.0,
        "symbol": "TMPV",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "position_id": "c5b03b10-a159-47a0-b1af-38c006d666ba"
    },
    {
        "quantity": 5.0,
        "symbol": "MANINFRA",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 835.0,
        "buy_date": "2025-08-06",
        "nifty_value": 24574.19921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "c5d38e2e-5920-44ec-8caf-a02271f70a1e"
    },
    {
        "quantity": 1.0,
        "symbol": "JBMA",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 643.1,
        "buy_date": "2025-07-04",
        "nifty_value": 25461.0,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "c80edc1c-23c1-45c6-8291-a1b6dd80b57f"
    },
    {
        "quantity": 10.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 298.0,
        "buy_date": "2025-07-18",
        "nifty_value": 24968.400390625,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "d9726d53-ffa5-4331-b65d-4e949aee79ac"
    },
    {
        "quantity": 2.0,
        "symbol": "SILVERBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 207.84,
        "buy_date": "2025-06-10",
        "nifty_value": 25104.25,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "e4cb6b75-33c4-4699-825c-0447b2910a69"
    },
    {
        "quantity": 5.0,
        "symbol": "TMCV",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 1058.5,
        "buy_date": "2025-10-16",
        "nifty_value": 25585.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "e526f269-d0e2-40bf-92f9-65ed02e0ee9a"
    },
    {
        "quantity": 10.0,
        "symbol": "GOLDBEES",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 830.0,
        "buy_date": "2025-08-14",
        "nifty_value": 24631.30078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "f69164e3-0a9f-4df6-80ac-c6d65f038b48"
    },
    {
        "quantity": 5.0,
        "symbol": "KTKBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 895.0,
        "buy_date": "2025-08-05",
        "nifty_value": 24649.55078125,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "f764803f-5e0d-4c82-935c-3911d261faba"
    },
    {
        "quantity": 2.0,
        "symbol": "SOUTHBANK",
        "user_email": "sankarkarthikeyan066@gmail.com",
        "portfolio_name": "sankar stocks",
        "invested_amount": 58.0,
        "buy_date": "2025-07-21",
        "nifty_value": 25090.69921875,
        "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba",
        "position_id": "fbfcb17b-20c6-48ac-a9d3-4fd1e24c5e07"
    }
]

def main():
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    
    try:
        # Test connection
        client.admin.command('ping')
        print("[OK] Connected successfully to MongoDB!")
        
        # Get database
        db = client['portfolio_buzz']
        
        # Delete the incorrect 'positions' collection if it exists
        if 'positions' in db.list_collection_names():
            print("\n[INFO] Deleting incorrect 'positions' collection...")
            db['positions'].drop()
            print("[OK] Deleted 'positions' collection")
        
        # Use the correct collection name
        positions_collection = db['portfolio_positions']
        
        print(f"\nInserting {len(positions_data)} positions into 'portfolio_positions' collection...")
        
        # Insert all positions
        result = positions_collection.insert_many(positions_data)
        
        print(f"[OK] Successfully inserted {len(result.inserted_ids)} positions!")
        print(f"\nSample inserted IDs:")
        for i, id in enumerate(result.inserted_ids[:5]):
            print(f"  {i+1}. {id}")
        
        if len(result.inserted_ids) > 5:
            print(f"  ... and {len(result.inserted_ids) - 5} more")
        
        # Verify insertion
        count = positions_collection.count_documents({
            "user_email": "sankarkarthikeyan066@gmail.com",
            "portfolio_id": "2ecfb581-3b63-41d7-aa15-9ce2a447a5ba"
        })
        print(f"\n[OK] Total positions for this portfolio in 'portfolio_positions': {count}")
        
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()
        print("\n[OK] Database connection closed")

if __name__ == "__main__":
    main()
