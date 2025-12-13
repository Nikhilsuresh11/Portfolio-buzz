"""
Test script for email alert functionality
Run this to test if your email configuration is working
"""

import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.email_alert_service import EmailAlertService
from config import get_config

def test_email_alert():
    """Test sending a sample email alert"""
    
    config = get_config()
    
    # Check if email is configured
    if not config.SENDER_EMAIL or not config.SENDER_PASSWORD:
        print("❌ Email not configured!")
        print("\nPlease add the following to your .env file:")
        print("SENDER_EMAIL=your-email@gmail.com")
        print("SENDER_PASSWORD=your-app-password")
        print("\nSee EMAIL_ALERT_README.md for setup instructions.")
        return False
    
    print("📧 Email Configuration:")
    print(f"   SMTP Server: {config.SMTP_SERVER}:{config.SMTP_PORT}")
    print(f"   Sender Email: {config.SENDER_EMAIL}")
    print(f"   Password: {'*' * len(config.SENDER_PASSWORD)}")
    print()
    
    # Get recipient email
    recipient = input("Enter recipient email address (or press Enter to use sender email): ").strip()
    if not recipient:
        recipient = config.SENDER_EMAIL
    
    print(f"\n📨 Sending test alert to: {recipient}")
    
    # Sample stock data (simulating a 5% drop)
    test_stock_data = {
        'ticker': 'TEST.NS',
        'name': 'Test Stock Ltd.',
        'price': 950.00,
        'prev_close': 1000.00,
        'change_percent': -5.0
    }
    
    # Send test email
    try:
        success = EmailAlertService.send_price_drop_alert(recipient, test_stock_data)
        
        if success:
            print("\n✅ Test email sent successfully!")
            print(f"   Check {recipient} for the alert email.")
            print("   (Don't forget to check spam/junk folder)")
            return True
        else:
            print("\n❌ Failed to send test email.")
            print("   Check your email configuration and try again.")
            return False
            
    except Exception as e:
        print(f"\n❌ Error sending test email: {e}")
        print("\nCommon issues:")
        print("1. Gmail: Make sure you're using an App Password, not your regular password")
        print("2. Check that 2-Factor Authentication is enabled on your Google account")
        print("3. Verify SMTP server and port are correct")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Portfolio Buzz - Email Alert Test")
    print("=" * 60)
    print()
    
    success = test_email_alert()
    
    print()
    print("=" * 60)
    if success:
        print("✅ Email alert system is working!")
    else:
        print("❌ Email alert system needs configuration")
        print("See EMAIL_ALERT_README.md for detailed setup instructions")
    print("=" * 60)
