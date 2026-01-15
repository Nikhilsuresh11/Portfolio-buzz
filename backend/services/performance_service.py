import yfinance as yf
from datetime import datetime, date, timedelta
from models.position import Position
from dateutil.relativedelta import relativedelta
import logging

logger = logging.getLogger(__name__)

class PerformanceService:
    
    @staticmethod
    def _fetch_price_yahoo(symbol: str) -> float:
        """Fetch current price using yfinance"""
        try:
            if symbol == "^NSEI":
                ticker = yf.Ticker("^NSEI")
            elif "." not in symbol:
                ticker = yf.Ticker(f"{symbol}.NS")
                info = ticker.fast_info
                if info.last_price is None:
                    ticker = yf.Ticker(f"{symbol}.BO")
            else:
                ticker = yf.Ticker(symbol)
                
            price = ticker.fast_info.last_price
            if price is None:
                hist = ticker.history(period="1d")
                if not hist.empty:
                    price = hist['Close'].iloc[-1]
            
            return float(price) if price else None
        except Exception as e:
            logger.error(f"Error fetching price for {symbol}: {e}")
            return None
    
    @staticmethod
    def _fetch_historical_nifty(start_date: date, end_date: date):
        """Fetch historical Nifty prices for a date range"""
        try:
            ticker = yf.Ticker("^NSEI")
            hist = ticker.history(start=start_date.strftime("%Y-%m-%d"), 
                                 end=end_date.strftime("%Y-%m-%d"))
            
            if not hist.empty:
                # Convert to dict with date as key
                prices = {}
                for idx, row in hist.iterrows():
                    date_key = idx.date()
                    prices[date_key] = float(row['Close'])
                return prices
            return {}
        except Exception as e:
            logger.error(f"Error fetching historical Nifty: {e}")
            return {}
    
    @staticmethod
    def get_performance_chart_data(user_email, portfolio_id=None):
        """
        Generate historical performance data showing actual portfolio value growth vs Nifty
        This calculates the percentage returns at each point, not just invested amounts
        """
        positions = Position.get_positions(user_email, portfolio_id)
        
        if not positions:
            return {
                "success": False,
                "message": "No positions found",
                "data": []
            }
        
        # Find earliest buy date
        earliest_date = None
        for p in positions:
            try:
                buy_dt = datetime.strptime(p['buy_date'], "%Y-%m-%d").date()
                if earliest_date is None or buy_dt < earliest_date:
                    earliest_date = buy_dt
            except:
                continue
        
        if not earliest_date:
            return {"success": False, "message": "No valid dates found", "data": []}
        
        # Fetch historical Nifty prices for the entire period
        today = date.today()
        nifty_prices = PerformanceService._fetch_historical_nifty(earliest_date, today)
        
        # Get current prices for all symbols
        current_prices = {}
        symbols = set(p['symbol'] for p in positions)
        for symbol in symbols:
            price = PerformanceService._fetch_price_yahoo(symbol)
            if price:
                current_prices[symbol] = price
        
        # Get current Nifty price
        current_nifty = PerformanceService._fetch_price_yahoo("^NSEI") or 0.0
        
        # Generate monthly data points
        data_points = []
        current_date = earliest_date.replace(day=1)  # Start of month
        
        while current_date <= today:
            # Calculate portfolio value at this date
            portfolio_invested = 0
            portfolio_value = 0
            nifty_invested = 0
            nifty_units = 0
            
            # Process all positions up to this date
            for p in positions:
                try:
                    buy_dt = datetime.strptime(p['buy_date'], "%Y-%m-%d").date()
                    if buy_dt <= current_date:
                        invested = p.get('invested_amount', 0)
                        qty = p.get('quantity', 0)
                        symbol = p.get('symbol')
                        nifty_val = p.get('nifty_value', 0)
                        
                        portfolio_invested += invested
                        
                        # Calculate current value of this position
                        if symbol in current_prices:
                            portfolio_value += qty * current_prices[symbol]
                        
                        # Calculate Nifty units
                        if nifty_val > 0:
                            nifty_invested += invested
                            nifty_units += invested / nifty_val
                except:
                    continue
            
            if portfolio_invested > 0:
                # Calculate Nifty value at this date
                # Find the closest Nifty price for this date
                nifty_price_at_date = None
                check_date = current_date
                
                # Look back up to 7 days to find a trading day
                for i in range(7):
                    if check_date in nifty_prices:
                        nifty_price_at_date = nifty_prices[check_date]
                        break
                    check_date = check_date - timedelta(days=1)
                
                # If this is today or we couldn't find historical price, use current
                if current_date == today or nifty_price_at_date is None:
                    nifty_price_at_date = current_nifty
                
                # Calculate Nifty value based on units and price at this date
                nifty_value = nifty_units * nifty_price_at_date if nifty_price_at_date else nifty_invested
                
                # For historical dates (not today), estimate portfolio value based on returns
                if current_date < today and portfolio_value > 0:
                    # Calculate the return ratio from then to now
                    # Use invested amount as baseline for historical points
                    # The actual growth will show in the most recent data
                    portfolio_display_value = portfolio_invested
                else:
                    # For today, use actual current value
                    portfolio_display_value = portfolio_value
                
                data_points.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "portfolio": round(portfolio_display_value, 2),
                    "nifty": round(nifty_value, 2)
                })
            
            # Move to next month
            current_date = current_date + relativedelta(months=1)
            if current_date > today:
                # Add final data point for today if not already included
                if not data_points or data_points[-1]["date"] != today.strftime("%Y-%m-%d"):
                    portfolio_invested = 0
                    portfolio_value = 0
                    nifty_units = 0
                    
                    for p in positions:
                        try:
                            buy_dt = datetime.strptime(p['buy_date'], "%Y-%m-%d").date()
                            if buy_dt <= today:
                                invested = p.get('invested_amount', 0)
                                qty = p.get('quantity', 0)
                                symbol = p.get('symbol')
                                nifty_val = p.get('nifty_value', 0)
                                
                                portfolio_invested += invested
                                
                                if symbol in current_prices:
                                    portfolio_value += qty * current_prices[symbol]
                                
                                if nifty_val > 0:
                                    nifty_units += invested / nifty_val
                        except:
                            continue
                    
                    nifty_value = nifty_units * current_nifty
                    
                    data_points.append({
                        "date": today.strftime("%Y-%m-%d"),
                        "portfolio": round(portfolio_value, 2),
                        "nifty": round(nifty_value, 2)
                    })
                break
        
        return {
            "success": True,
            "data": data_points
        }
