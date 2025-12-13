from flask import jsonify
from services.email_alert_service import EmailAlertService
from services.price_service import PriceService
from services.watchlist_service import WatchlistService
from utils.jwt_helper import token_required
from utils.response import success_response, error_response
from config import get_config

config = get_config()


class EmailAlertController:
    """Controller for email alert functionality"""
    
    @staticmethod
    @token_required
    def check_and_send_alerts(current_user_email):
        """
        Check user's watchlist for stocks that dropped 5%+ and send email alerts
        
        Args:
            current_user_email: Current authenticated user's email from JWT token
        
        Returns:
            JSON response with alert status
        """
        try:
            user_email = current_user_email
            
            # Get user's watchlist
            success, message, watchlist = WatchlistService.get_watchlist(user_email)
            
            if not success:
                return error_response(message, 400)
            
            if not watchlist or len(watchlist) == 0:
                return success_response({
                    'message': 'No stocks in watchlist',
                    'alerts_sent': 0,
                    'stocks_checked': 0
                }, 'No stocks to check', 200)
            
            # Get tickers from watchlist
            tickers = [stock['ticker'] for stock in watchlist]
            
            # Fetch current prices
            prices = PriceService.get_multiple_prices(tickers)
            
            # Check for 5%+ drops and send alerts
            alerts_sent = []
            stocks_checked = 0
            
            for stock in watchlist:
                ticker = stock['ticker']
                stocks_checked += 1
                
                if ticker not in prices:
                    print(f"⚠️ No price data for {ticker}")
                    continue
                
                price_data = prices[ticker]
                change_percent = price_data.get('change_percent', 0)
                
                print(f"📊 {ticker}: {change_percent:.2f}% change")
                
                # Check if stock dropped 5% or more
                if change_percent <= -5.0:
                    print(f"🔴 {ticker} dropped 5%+! Sending alert...")
                    # Prepare stock data for email
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
                        print(f"✅ Alert sent for {ticker}")
                        alerts_sent.append({
                            'ticker': ticker,
                            'name': stock.get('name', ticker),
                            'change_percent': change_percent,
                            'price': price_data.get('price', 0)
                        })
                    else:
                        print(f"❌ Failed to send alert for {ticker}")
                else:
                    print(f"✅ {ticker} is positive or neutral, no alert needed")
            
            return success_response({
                'message': f'Checked {stocks_checked} stocks, sent {len(alerts_sent)} alerts',
                'alerts_sent': len(alerts_sent),
                'stocks_checked': stocks_checked,
                'alerts': alerts_sent
            }, 'Alert check completed', 200)
            
        except Exception as e:
            print(f"Error in check_and_send_alerts: {e}")
            return error_response(str(e), 500)
