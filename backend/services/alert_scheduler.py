"""
Background scheduler for automated stock alerts
Checks all users' watchlists periodically and sends email alerts
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import pytz
from services.watchlist_service import WatchlistService
from services.price_service import PriceService
from services.email_alert_service import EmailAlertService
from models.user import User


class AlertScheduler:
    """Scheduler for automated stock price alerts"""
    
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.is_running = False
    
    def check_all_users_alerts(self):
        """Check all users' watchlists and send alerts for stocks below -3%"""
        try:
            # Get current time in IST
            ist = pytz.timezone('Asia/Kolkata')
            current_time = datetime.now(ist)
            
            print(f"\n{'='*60}")
            print(f"🔔 Running scheduled alert check at {current_time.strftime('%Y-%m-%d %H:%M:%S %Z')}")
            print(f"{'='*60}")
            
            # Skip weekends (Saturday=5, Sunday=6)
            current_day = current_time.weekday()
            if current_day >= 5:  # 5 = Saturday, 6 = Sunday
                day_name = "Saturday" if current_day == 5 else "Sunday"
                print(f"⏸️  Skipping alerts - Today is {day_name} (markets closed)")
                print(f"{'='*60}\n")
                return
            
            # Check if current time is within market hours (9:15 AM to 3:30 PM IST)
            current_hour = current_time.hour
            current_minute = current_time.minute
            
            # Convert to minutes since midnight for easier comparison
            current_minutes = current_hour * 60 + current_minute
            market_open = 9 * 60 + 15  # 9:15 AM = 555 minutes
            market_close = 15 * 60 + 30  # 3:30 PM = 930 minutes
            
            if current_minutes < market_open or current_minutes > market_close:
                print(f"⏸️  Skipping alerts - Outside market hours (9:15 AM - 3:30 PM IST)")
                print(f"   Current time: {current_time.strftime('%I:%M %p')}")
                print(f"{'='*60}\n")
                return
            
            # Get all users
            users = User.get_all_users()
            
            if not users:
                print("ℹ️  No users found")
                return
            
            print(f"👥 Checking alerts for {len(users)} users...")
            
            total_alerts_sent = 0
            
            for user in users:
                user_email = user.get('email')
                if not user_email:
                    continue
                
                print(f"\n📧 Checking watchlist for: {user_email}")
                
                # Get user's stocks across ALL watchlists
                success, message, watchlist = WatchlistService.get_all_stocks_for_user(user_email)
                
                if not success:
                    print(f"   ❌ Error fetching stocks for {user_email}: {message}")
                    continue
                
                if not watchlist:
                    print(f"   ⚠️  No stocks found for {user_email} across any watchlist")
                    continue
                
                # Get tickers
                tickers = [stock['ticker'] for stock in watchlist]
                print(f"   📊 Checking {len(tickers)} stocks: {', '.join(tickers)}")
                
                # Fetch prices
                prices = PriceService.get_multiple_prices(tickers)
                
                # Check for drops
                alerts_sent = 0
                for stock in watchlist:
                    ticker = stock['ticker']
                    
                    if ticker not in prices:
                        continue
                    
                    price_data = prices[ticker]
                    change_percent = price_data.get('change_percent', 0)
                    
                    # Check if stock dropped 3% or more
                    if change_percent <= -3.0:
                        print(f"   🔴 {ticker}: {change_percent:.2f}% - Sending alert...")
                        
                        # Prepare stock data
                        stock_data = {
                            'ticker': ticker,
                            'name': stock.get('name', ticker),
                            'price': price_data.get('price', 0),
                            'prev_close': price_data.get('prev_close', 0),
                            'change_percent': change_percent
                        }
                        
                        # Send email alert
                        email_sent = EmailAlertService.send_price_drop_alert(
                            user_email,
                            stock_data
                        )
                        
                        if email_sent:
                            alerts_sent += 1
                            total_alerts_sent += 1
                            print(f"   ✅ Alert sent for {ticker}")
                        else:
                            print(f"   ❌ Failed to send alert for {ticker}")
                    else:
                        print(f"   ✅ {ticker}: {change_percent:.2f}% - No alert needed")
                
                if alerts_sent > 0:
                    print(f"   📬 Sent {alerts_sent} alert(s) to {user_email}")
                else:
                    print(f"   ℹ️  No alerts needed for {user_email}")
                
                # Add delay between users to spread load (Render free tier)
                import time
                time.sleep(2)
            
            print(f"\n{'='*60}")
            print(f"✅ Alert check completed. Total alerts sent: {total_alerts_sent}")
            print(f"{'='*60}\n")
            
        except Exception as e:
            print(f"❌ Error in scheduled alert check: {e}")
    
    def start(self):
        """Start the scheduler"""
        if self.is_running:
            print("⚠️  Scheduler is already running")
            return
        
        # Run only during market hours (9:15 AM - 3:30 PM IST, Mon-Fri)
        ist = pytz.timezone('Asia/Kolkata')
        
        # Schedule to run every 15 minutes during market hours
        # Market hours: 9:15 AM to 3:30 PM
        # We'll schedule it to run at :00, :15, :30, :45 of each hour
        # between 9 AM and 3 PM (the time check in check_all_users_alerts will filter out times before 9:15 and after 3:30)
        self.scheduler.add_job(
            self.check_all_users_alerts,
            trigger=CronTrigger(
                day_of_week='mon-fri',  # Monday to Friday
                hour='9-15',  # 9 AM to 3 PM (covers 9:15 AM to 3:30 PM with our time check)
                minute='*/30',  # Every 30 minutes (0, 15, 30, 45)
                timezone=ist
            ),
            id='stock_alert_check',
            name='Stock Alert Check (Market Hours)',
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        
        print("\n" + "="*60)
        print("🚀 Alert Scheduler Started!")
        print("="*60)
        print("⏰ Running every 30 minutes during market hours")
        print("📅 Monday to Friday only")
        print("🕐 Market hours: 9:15 AM - 3:30 PM IST")
        print("📧 Will check all users per cycle") 
        print("🎯 Alert threshold: -3% or more")
        print("="*60 + "\n")
    
    def stop(self):
        """Stop the scheduler"""
        if not self.is_running:
            print("⚠️  Scheduler is not running")
            return
        
        self.scheduler.shutdown()
        self.is_running = False
        print("\n🛑 Alert Scheduler Stopped\n")
    
    def run_now(self):
        """Manually trigger an alert check (for testing)"""
        print("\n🔔 Manually triggering alert check...")
        self.check_all_users_alerts()


# Global scheduler instance
alert_scheduler = AlertScheduler()
