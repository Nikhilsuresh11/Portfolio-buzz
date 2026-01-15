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
    def _get_closest_nifty_price(target_date: date, nifty_prices: dict, current_nifty: float) -> float:
        """Get the closest available Nifty price for a given date"""
        if target_date == date.today():
            return current_nifty
        
        # Look back up to 7 days to find a trading day
        check_date = target_date
        for i in range(7):
            if check_date in nifty_prices:
                return nifty_prices[check_date]
            check_date = check_date - timedelta(days=1)
        
        # If no price found, return current (fallback)
        return current_nifty
    
    @staticmethod
    def get_performance_chart_data(user_email, portfolio_id=None):
        """
        Generate historical performance data showing actual portfolio value growth vs Nifty
        
        Key concept:
        - For each transaction, we calculate how many Nifty units were bought at that time
        - At any evaluation date, we calculate what those units are worth at that date's Nifty price
        - This shows the TRUE performance comparison
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
            nifty_value = 0
            
            # Get Nifty price at this evaluation date
            nifty_price_at_eval = PerformanceService._get_closest_nifty_price(
                current_date, nifty_prices, current_nifty
            )
            
            # Process all positions up to this date
            for p in positions:
                try:
                    buy_dt = datetime.strptime(p['buy_date'], "%Y-%m-%d").date()
                    if buy_dt <= current_date:
                        invested = p.get('invested_amount', 0)
                        qty = p.get('quantity', 0)
                        symbol = p.get('symbol')
                        nifty_at_purchase = p.get('nifty_value', 0)
                        
                        portfolio_invested += invested
                        
                        # Calculate current value of this position
                        if symbol in current_prices:
                            portfolio_value += qty * current_prices[symbol]
                        
                        # CORRECT Nifty calculation:
                        # For this specific transaction, calculate:
                        # 1. How many Nifty units were bought: invested / nifty_at_purchase
                        # 2. What those units are worth at evaluation date: units × nifty_price_at_eval
                        if nifty_at_purchase > 0 and nifty_price_at_eval > 0:
                            nifty_units_for_this_transaction = invested / nifty_at_purchase
                            value_at_eval_date = nifty_units_for_this_transaction * nifty_price_at_eval
                            nifty_value += value_at_eval_date
                except:
                    continue
            
            if portfolio_invested > 0:
                # For historical dates (not today), use invested amount as portfolio baseline
                # For today, use actual current value
                if current_date < today and portfolio_value > 0:
                    portfolio_display_value = portfolio_invested
                else:
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
                    nifty_value = 0
                    
                    for p in positions:
                        try:
                            buy_dt = datetime.strptime(p['buy_date'], "%Y-%m-%d").date()
                            if buy_dt <= today:
                                invested = p.get('invested_amount', 0)
                                qty = p.get('quantity', 0)
                                symbol = p.get('symbol')
                                nifty_at_purchase = p.get('nifty_value', 0)
                                
                                portfolio_invested += invested
                                
                                if symbol in current_prices:
                                    portfolio_value += qty * current_prices[symbol]
                                
                                if nifty_at_purchase > 0 and current_nifty > 0:
                                    nifty_units = invested / nifty_at_purchase
                                    nifty_value += nifty_units * current_nifty
                        except:
                            continue
                    
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
