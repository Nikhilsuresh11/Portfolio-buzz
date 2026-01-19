import yfinance as yf
from datetime import datetime, date, timedelta
from models.position import Position
from werkzeug.exceptions import BadRequest, NotFound
import logging
import math

logger = logging.getLogger(__name__)

class PortfolioService:
    
    @staticmethod
    def _fetch_price_data_yahoo(symbol: str):
        """Fetch current price and previous close using yfinance"""
        try:
            ticker_sym = symbol
            if symbol != "^NSEI" and "." not in symbol:
                ticker_sym = f"{symbol}.NS"
            
            ticker = yf.Ticker(ticker_sym)
            hist = ticker.history(period="2d")
            
            if hist.empty and symbol != "^NSEI" and "." not in symbol:
                ticker_sym = f"{symbol}.BO"
                ticker = yf.Ticker(ticker_sym)
                hist = ticker.history(period="2d")

            if len(hist) >= 2:
                current_price = hist['Close'].iloc[-1]
                prev_close = hist['Close'].iloc[-2]
                return {
                    "current_price": float(current_price),
                    "previous_close": float(prev_close)
                }
            elif len(hist) == 1:
                current_price = hist['Close'].iloc[-1]
                return {
                    "current_price": float(current_price),
                    "previous_close": float(current_price)
                }
            
            return None
        except Exception as e:
            logger.error(f"Error fetching price data for {symbol}: {e}")
            return None

    @staticmethod
    def _fetch_price_yahoo(symbol: str) -> float:
        """Fetch current price using yfinance"""
        data = PortfolioService._fetch_price_data_yahoo(symbol)
        return data['current_price'] if data else None

    @staticmethod
    def _fetch_historical_price_yahoo(symbol: str, date_str: str) -> float:
        """Fetch historical price for a specific date (handling weekends)"""
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d")
            
            # Determine ticker symbol
            ticker_sym = symbol
            if symbol != "^NSEI" and "." not in symbol:
                ticker_sym = f"{symbol}.NS" # Default to NSE
            
            # Fetch a range around the date to handle weekends/holidays
            start_date = (target_date - timedelta(days=5)).strftime("%Y-%m-%d")
            end_date = (target_date + timedelta(days=1)).strftime("%Y-%m-%d")
            
            ticker = yf.Ticker(ticker_sym)
            hist = ticker.history(start=start_date, end=end_date)
            
            if hist.empty and symbol != "^NSEI" and "." not in symbol:
                # Try BSE if NSE failed
                ticker_sym = f"{symbol}.BO"
                ticker = yf.Ticker(ticker_sym)
                hist = ticker.history(start=start_date, end=end_date)

            if not hist.empty:
                # Get the price on or closest before the target date
                # history index is DatetimeIndex
                # We want the last available price <= target_date
                # Since we fetched up to target_date+1, the last row should be it.
                return float(hist['Close'].iloc[-1])
            
            return None
        except Exception as e:
            logger.error(f"Error fetching historical price for {symbol} on {date_str}: {e}")
            return None

    @staticmethod
    def _xnpv(rate, cashflows):
        """Calculate Net Present Value for irregular intervals"""
        if not cashflows:
            return 0.0
        d0 = cashflows[0][0]
        return sum([cf / ((1 + rate) ** ((d - d0).days / 365.0)) for d, cf in cashflows])

    @staticmethod
    def _xirr(cashflows, guess=0.1):
        """Calculate Internal Rate of Return for irregular intervals"""
        if len(cashflows) < 2:
            return None
        
        # Check signs
        has_pos = any(cf > 0 for _, cf in cashflows)
        has_neg = any(cf < 0 for _, cf in cashflows)
        if not (has_pos and has_neg):
            return None

        try:
            rate = guess
            for _ in range(100):
                f = PortfolioService._xnpv(rate, cashflows)
                if abs(f) < 1e-8:
                    return rate
                
                # Numerical derivative
                h = 1e-6
                f1 = PortfolioService._xnpv(rate + h, cashflows)
                deriv = (f1 - f) / h
                if deriv == 0:
                    return None
                    
                rate_next = rate - f / deriv
                if rate_next <= -0.999999:
                    rate_next = (rate - 0.999999) / 2.0
                
                if abs(rate_next - rate) < 1e-10:
                    return rate_next
                    
                rate = rate_next
            return None
        except Exception:
            return None

    @staticmethod
    def create_position(data):
        """Create a new position with automatic Nifty fetch"""
        buy_date_str = data.get("buy_date")
        if not buy_date_str:
            raise BadRequest("buy_date is required")
            
        # Fetch Nifty
        nifty_val = PortfolioService._fetch_historical_price_yahoo("^NSEI", buy_date_str)
        if nifty_val:
            data['nifty_value'] = nifty_val
        else:
            data['nifty_value'] = 0.0
            
        return Position.create_position(data)
        
    @staticmethod
    def get_portfolio_summary(user_email, portfolio_id=None):
        """Calculate summary metrics for portfolio"""
        # If no portfolio_id or 'default', we can fetch all or filter by 'default'
        # Current logic in model defaults to fetching all if None, or specific if provided.
        # Let's stick to what's passed, which is likely 'default' from the route.
        positions = Position.get_positions(user_email, portfolio_id)
        
        total_invested = 0.0
        total_current = 0.0
        total_day_change = 0.0
        details = []
        
        # Cache current prices
        price_cache = {}
        
        for p in positions:
            symbol = p.get('symbol')
            qty = p.get('quantity', 0)
            invested = p.get('invested_amount', 0)
            
            if symbol not in price_cache:
                price_data = PortfolioService._fetch_price_data_yahoo(symbol)
                price_cache[symbol] = price_data if price_data else {"current_price": 0.0, "previous_close": 0.0}
            
            current_price = price_cache[symbol]["current_price"]
            previous_close = price_cache[symbol]["previous_close"]
            current_val = qty * current_price
            
            # Day change calculations
            day_change = (current_price - previous_close) * qty
            day_change_percent = ((current_price - previous_close) / previous_close * 100) if previous_close > 0 else 0
            
            total_invested += invested
            total_current += current_val
            total_day_change += day_change
            
            profit = current_val - invested
            ret_pct = (profit / invested * 100) if invested > 0 else 0
            
            details.append({
                **p,
                "current_price": current_price,
                "previous_close": previous_close,
                "current_value": current_val,
                "profit": profit,
                "return_percent": ret_pct,
                "day_change": day_change,
                "day_change_percent": day_change_percent
            })
            
        # Symbol allocations
        symbol_groups = {}
        for d in details:
            sym = d['symbol']
            if sym not in symbol_groups:
                symbol_groups[sym] = {
                    "symbol": sym,
                    "quantity": 0,
                    "invested_amount": 0,
                    "current_value": 0,
                    "day_change": 0,
                    "position_count": 0,
                    "current_price": d['current_price'],
                    "previous_close": d['previous_close']
                }
            g = symbol_groups[sym]
            g['quantity'] += d['quantity']
            g['invested_amount'] += d['invested_amount']
            g['current_value'] += d['current_value']
            g['day_change'] += d['day_change']
            g['position_count'] += 1
            
        symbol_allocations = []
        for sym, g in symbol_groups.items():
            profit = g['current_value'] - g['invested_amount']
            ret_pct = (profit / g['invested_amount'] * 100) if g['invested_amount'] > 0 else 0
            alloc_pct = (g['current_value'] / total_current * 100) if total_current > 0 else 0
            day_ret_pct = (g['day_change'] / (g['current_value'] - g['day_change']) * 100) if (g['current_value'] - g['day_change']) > 0 else 0
            
            symbol_allocations.append({
                "symbol": sym,
                "quantity": g['quantity'],
                "invested_amount": g['invested_amount'],
                "current_value": g['current_value'],
                "current_price": g['current_price'],
                "profit": profit,
                "return_percent": ret_pct,
                "allocation_percent": alloc_pct,
                "day_change": g['day_change'],
                "day_change_percent": day_ret_pct,
                "position_count": g['position_count']
            })
            
        symbol_allocations.sort(key=lambda x: x['current_value'], reverse=True)
        
        return {
            "user_email": user_email,
            "count": len(positions),
            "total_invested": total_invested,
            "total_current_value": total_current,
            "total_profit": total_current - total_invested,
            "total_day_change": total_day_change,
            "total_day_change_percent": (total_day_change / (total_current - total_day_change) * 100) if (total_current - total_day_change) > 0 else 0,
            "return_percent": ((total_current - total_invested) / total_invested * 100) if total_invested > 0 else 0,
            "positions": details,
            "symbol_allocations": symbol_allocations
        }

    @staticmethod
    def get_overall_transactions(user_email, portfolio_id=None):
        """Comprehensive analysis with XIRR"""
        positions = Position.get_positions(user_email, portfolio_id)
        if not positions:
            return {
                "user_email": user_email,
                "transaction_count": 0,
                "total_invested": 0,
                "current_value": 0,
                "profit": 0,
                "return_percent": 0,
                "portfolio_xirr": None, 
                "portfolio_xirr_percent": None,
                "nifty": {"current_value": 0, "profit": 0, "return_percent": 0, "xirr": None},
                "outperformance": None,
                "transactions": [],
                "symbol_breakdown": []
            }
            
        # Parse dates and build cashflows
        portfolio_flows = []
        nifty_flows = []
        
        transactions = []
        symbol_holdings = {}
        
        total_invested = 0.0
        total_nifty_units = 0.0
        
        # 1. Process historical buys
        for p in positions:
            try:
                buy_dt = datetime.strptime(p['buy_date'], "%Y-%m-%d").date()
            except:
                continue
                
            invested = p.get('invested_amount', 0)
            qty = p.get('quantity', 0)
            sym = p.get('symbol')
            nifty_val = p.get('nifty_value', 0)
            
            total_invested += invested
            
            # Cashflows (money out is negative)
            portfolio_flows.append((buy_dt, -invested))
            
            if nifty_val > 0:
                units = invested / nifty_val
                total_nifty_units += units
                nifty_flows.append((buy_dt, -invested))
                
            # Holdings
            if sym not in symbol_holdings:
                symbol_holdings[sym] = 0.0
            symbol_holdings[sym] += qty
            
            # Txn list
            transactions.append({
                "symbol": sym,
                "buy_date": p['buy_date'],
                "quantity": qty,
                "invested_amount": invested,
                "nifty_value": nifty_val,
                "nifty_units_bought": invested / nifty_val if nifty_val > 0 else 0
            })
            
        # 2. Process current values
        total_current_val = 0.0
        price_map = {}
        
        for sym, qty in symbol_holdings.items():
            price = PortfolioService._fetch_price_yahoo(sym)
            if price:
                val = qty * price
                total_current_val += val
                price_map[sym] = price
            else:
                # If price fails, fallback to cost or 0? 
                # Ideally we shouldn't fail silently but for robustness:
                logger.warning(f"Could not get price for {sym}, assuming 0 value")
                
        # 3. Nifty current
        nifty_price = PortfolioService._fetch_price_yahoo("^NSEI") or 0.0
        nifty_current_val = total_nifty_units * nifty_price
        
        # 4. Final cashflows (money in is positive)
        today = date.today()
        portfolio_flows.append((today, total_current_val))
        if total_nifty_units > 0:
            nifty_flows.append((today, nifty_current_val))
            
        # 5. XIRR
        port_xirr = PortfolioService._xirr(portfolio_flows)
        nifty_xirr = PortfolioService._xirr(nifty_flows)
        
        profit = total_current_val - total_invested
        ret_pct = (profit / total_invested * 100) if total_invested > 0 else 0
        
        nifty_profit = nifty_current_val - total_invested
        nifty_ret = (nifty_profit / total_invested * 100) if total_invested > 0 else 0
        
        outperformance = None
        if port_xirr is not None and nifty_xirr is not None:
            outperformance = (port_xirr - nifty_xirr) * 100
            
        return {
            "user_email": user_email,
            "transaction_count": len(positions),
            "total_invested": total_invested,
            "current_value": total_current_val,
            "profit": profit,
            "return_percent": ret_pct,
            "portfolio_xirr": port_xirr,
            "portfolio_xirr_percent": port_xirr * 100 if port_xirr is not None else None,
            "nifty": {
                "total_units": total_nifty_units,
                "current_price": nifty_price,
                "current_value": nifty_current_val,
                "profit": nifty_profit,
                "return_percent": nifty_ret,
                "xirr": nifty_xirr,
                "xirr_percent": nifty_xirr * 100 if nifty_xirr is not None else None
            },
            "outperformance": outperformance,
            "transactions": sorted(transactions, key=lambda x: x['buy_date']),
            "symbol_breakdown": [
                {"symbol": s, "total_quantity": q} 
                for s, q in sorted(symbol_holdings.items())
            ]
        }

    @staticmethod
    def get_user_portfolios(user_email):
        """Get all portfolios for user"""
        return Position.get_user_portfolios(user_email)
