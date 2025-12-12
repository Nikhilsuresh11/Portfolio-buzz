import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from config import get_config

config = get_config()


class EmailAlertService:
    """Service for sending email alerts for stock price drops"""
    
    @staticmethod
    def send_price_drop_alert(user_email, stock_data):
        """
        Send email alert when stock drops 5% or more
        
        Args:
            user_email: User's email address
            stock_data: Dictionary containing stock information
                {
                    'ticker': str,
                    'name': str,
                    'change_percent': float,
                    'price': float,
                    'prev_close': float
                }
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Get email configuration
            smtp_server = config.SMTP_SERVER
            smtp_port = config.SMTP_PORT
            smtp_username = config.SMTP_USERNAME or config.SENDER_EMAIL  # Use SMTP_USERNAME if set, else SENDER_EMAIL
            sender_email = config.SENDER_EMAIL
            sender_password = config.SENDER_PASSWORD
            
            # Debug: Print configuration status
            print(f"📧 Email Config Check:")
            print(f"   SMTP_SERVER: {smtp_server if smtp_server else '❌ Not set'}")
            print(f"   SMTP_PORT: {smtp_port if smtp_port else '❌ Not set'}")
            print(f"   SMTP_USERNAME: {smtp_username if smtp_username else '❌ Not set'}")
            print(f"   SENDER_EMAIL: {sender_email if sender_email else '❌ Not set'}")
            print(f"   SENDER_PASSWORD: {'✅ Set' if sender_password else '❌ Not set'}")
            
            # Validate configuration
            if not all([smtp_server, smtp_port, smtp_username, sender_email, sender_password]):
                print("❌ Email configuration incomplete. Skipping email alert.")
                return False
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = f"⚠️ Alert: {stock_data['ticker']} dropped {abs(stock_data['change_percent']):.2f}%"
            message["From"] = sender_email
            message["To"] = user_email
            
            # Create email body
            text_body = EmailAlertService._create_text_body(stock_data)
            html_body = EmailAlertService._create_html_body(stock_data)
            
            # Attach both plain text and HTML versions
            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            message.attach(part1)
            message.attach(part2)
            
            # Send email
            try:
                print(f"📤 Connecting to {smtp_server}:{smtp_port}...")
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    server.set_debuglevel(0)  # Set to 1 for verbose SMTP debugging
                    print(f"🔐 Starting TLS...")
                    server.starttls()  # Secure the connection
                    print(f"🔑 Authenticating as {smtp_username}...")
                    server.login(smtp_username, sender_password)
                    print(f"📧 Sending email to {user_email}...")
                    server.sendmail(sender_email, user_email, message.as_string())
                    print(f"✅ Email sent successfully!")
            except smtplib.SMTPAuthenticationError as e:
                print(f"❌ SMTP Authentication Error: {e}")
                print(f"   Check your SMTP credentials for {smtp_server}")
                print(f"   For Brevo: Make sure you're using your SMTP API key, not your account password")
                return False
            except smtplib.SMTPException as e:
                print(f"❌ SMTP Error: {e}")
                return False
            except Exception as e:
                print(f"❌ Unexpected error: {e}")
                return False
            
            print(f"Alert email sent to {user_email} for {stock_data['ticker']}")
            return True
            
        except Exception as e:
            print(f"Error sending email alert: {e}")
            return False
    
    @staticmethod
    def _create_text_body(stock_data):
        """Create plain text email body"""
        return f"""
Portfolio Buzz - Stock Alert

Stock: {stock_data['ticker']} ({stock_data.get('name', 'N/A')})
Alert: Price dropped by {abs(stock_data['change_percent']):.2f}%

Current Price: ₹{stock_data['price']:.2f}
Previous Close: ₹{stock_data['prev_close']:.2f}
Change: ₹{stock_data['price'] - stock_data['prev_close']:.2f} ({stock_data['change_percent']:.2f}%)

Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This is an automated alert from Portfolio Buzz.
Please review your watchlist and consider your investment strategy.

---
Portfolio Buzz
Your Stock Watchlist Companion
"""
    
    @staticmethod
    def _create_html_body(stock_data):
        """Create HTML email body"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }}
        .content {{
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }}
        .alert-box {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .stock-info {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .metric {{
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }}
        .metric:last-child {{
            border-bottom: none;
        }}
        .label {{
            font-weight: bold;
            color: #6c757d;
        }}
        .value {{
            color: #212529;
        }}
        .negative {{
            color: #dc3545;
            font-weight: bold;
        }}
        .footer {{
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0;">⚠️ Stock Alert</h1>
        <p style="margin: 10px 0 0 0;">Portfolio Buzz</p>
    </div>
    
    <div class="content">
        <div class="alert-box">
            <strong>Price Drop Alert!</strong><br>
            Your watchlist stock has dropped by more than 5% today.
        </div>
        
        <div class="stock-info">
            <h2 style="margin-top: 0; color: #212529;">{stock_data['ticker']}</h2>
            <p style="color: #6c757d; margin-top: -10px;">{stock_data.get('name', 'N/A')}</p>
            
            <div class="metric">
                <span class="label">Current Price:</span>
                <span class="value">₹{stock_data['price']:.2f}</span>
            </div>
            
            <div class="metric">
                <span class="label">Previous Close:</span>
                <span class="value">₹{stock_data['prev_close']:.2f}</span>
            </div>
            
            <div class="metric">
                <span class="label">Change:</span>
                <span class="value negative">₹{stock_data['price'] - stock_data['prev_close']:.2f} ({stock_data['change_percent']:.2f}%)</span>
            </div>
            
            <div class="metric">
                <span class="label">Alert Time:</span>
                <span class="value">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</span>
            </div>
        </div>
        
        <p style="color: #6c757d; font-size: 14px;">
            This is an automated alert from Portfolio Buzz. Please review your watchlist and consider your investment strategy.
        </p>
    </div>
    
    <div class="footer">
        <p>Portfolio Buzz - Your Stock Watchlist Companion</p>
        <p>This is an automated message. Please do not reply to this email.</p>
    </div>
</body>
</html>
"""
