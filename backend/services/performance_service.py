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
    def get_performance_chart_data(user_email, portfolio_id=None):
        """
        Generate historical performance data for portfolio vs Nifty
        Returns monthly data points showing cumulative returns
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
        
        # Generate monthly data points from earliest date to today
        data_points = []
        current_date = earliest_date.replace(day=1)  # Start of month
        today = date.today()
        
        while current_date <= today:
            # Calculate portfolio value at this date
            portfolio_value = PerformanceService._calculate_portfolio_value_at_date(
                positions, current_date
            )
            
            # Calculate Nifty value at this date
            nifty_value = PerformanceService._calculate_nifty_value_at_date(
                positions, current_date
            )
            
            if portfolio_value is not None and nifty_value is not None:
                data_points.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "portfolio": round(portfolio_value, 2),
                    "nifty": round(nifty_value, 2)
                })
            
            # Move to next month
            current_date = current_date + relativedelta(months=1)
            if current_date > today:
                # Add final data point for today if not already included
                if not data_points or data_points[-1]["date"] != today.strftime("%Y-%m-%d"):
                    portfolio_value = PerformanceService._calculate_portfolio_value_at_date(
                        positions, today
                    )
                    nifty_value = PerformanceService._calculate_nifty_value_at_date(
                        positions, today
                    )
                    if portfolio_value is not None and nifty_value is not None:
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
    
    @staticmethod
    def _calculate_portfolio_value_at_date(positions, target_date):
        """Calculate total portfolio value at a specific date"""
        total_invested = 0
        holdings = {}
        
        # Build holdings up to target date
        for p in positions:
            try:
                buy_dt = datetime.strptime(p['buy_date'], "%Y-%m-%d").date()
                if buy_dt <= target_date:
                    total_invested += p.get('invested_amount', 0)
                    symbol = p.get('symbol')
                    qty = p.get('quantity', 0)
                    
                    if symbol not in holdings:
                        holdings[symbol] = 0
                    holdings[symbol] += qty
            except:
                continue
        
        if not holdings:
            return 0
        
        # If target date is today, use current prices
        if target_date == date.today():
            total_value = 0
            for symbol, qty in holdings.items():
                price = PerformanceService._fetch_price_yahoo(symbol)
                if price:
                    total_value += qty * price
            return total_value
        
        # For historical dates, return invested amount as approximation
        # (fetching historical prices for all stocks would be too slow)
        return total_invested
    
    @staticmethod
    def _calculate_nifty_value_at_date(positions, target_date):
        """Calculate equivalent Nifty investment value at a specific date"""
        total_invested = 0
        total_units = 0
        
        # Build Nifty units up to target date
        for p in positions:
            try:
                buy_dt = datetime.strptime(p['buy_date'], "%Y-%m-%d").date()
                if buy_dt <= target_date:
                    invested = p.get('invested_amount', 0)
                    nifty_val = p.get('nifty_value', 0)
                    
                    total_invested += invested
                    if nifty_val > 0:
                        total_units += invested / nifty_val
            except:
                continue
        
        if total_units == 0:
            return 0
        
        # If target date is today, use current Nifty price
        if target_date == date.today():
            nifty_price = PerformanceService._fetch_price_yahoo("^NSEI")
            if nifty_price:
                return total_units * nifty_price
        
        # For historical dates, return invested amount as approximation
        return total_invested
