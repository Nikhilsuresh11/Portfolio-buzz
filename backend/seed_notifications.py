import sys
import os
from datetime import datetime, timedelta

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from utils.db import get_notifications_collection
from config import get_config

def seed_notifications():
    config = get_config()
    print(f"Seeding notifications to database: {config.DB_NAME}")
    
    col = get_notifications_collection()
    
    # Get user email from env or default
    user_email = os.getenv('SENDER_EMAIL', 'blackbeard6622@gmail.com')
    
    dummy_notifications = [
        {
            'user_email': user_email,
            'ticker': 'RELIANCE.NS',
            'name': 'Reliance Industries',
            'change_percent': -5.2,
            'price': 2450.50,
            'prev_close': 2585.00,
            'type': 'price_drop',
            'status': 'sent',
            'timestamp': datetime.utcnow() - timedelta(hours=2),
            'title': 'Alert: RELIANCE.NS dropped 5.20%',
            'message': 'Reliance Industries price is ₹2,450.50, dropping 5.20% from previous close.'
        },
        {
            'user_email': user_email,
            'ticker': 'TCS.NS',
            'name': 'Tata Consultancy Services',
            'change_percent': -6.1,
            'price': 3210.00,
            'prev_close': 3418.50,
            'type': 'price_drop',
            'status': 'sent',
            'timestamp': datetime.utcnow() - timedelta(days=1),
            'title': 'Alert: TCS.NS dropped 6.10%',
            'message': 'Tata Consultancy Services price is ₹3,210.00, dropping 6.10% from previous close.'
        },
        {
            'user_email': user_email,
            'ticker': 'HDFC.NS',
            'name': 'HDFC Bank',
            'change_percent': -5.05,
            'price': 1520.00,
            'prev_close': 1601.00,
            'type': 'price_drop',
            'status': 'sent',
            'timestamp': datetime.utcnow() - timedelta(days=2),
            'title': 'Alert: HDFC.NS dropped 5.05%',
            'message': 'HDFC Bank price is ₹1,520.00, dropping 5.05% from previous close.'
        }
    ]
    
    # Clear existing if any (optional)
    # col.delete_many({'user_email': user_email})
    
    # Insert new ones
    result = col.insert_many(dummy_notifications)
    print(f"✅ Successfully seeded {len(result.inserted_ids)} notifications for {user_email}")

if __name__ == "__main__":
    seed_notifications()
