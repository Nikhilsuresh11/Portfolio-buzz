"""
Mutual Fund Portfolio Service
Handles MF portfolio analysis, XIRR calculation, and performance metrics
"""

import logging
import concurrent.futures
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Tuple
import pandas as pd
from models.mf_position import MFPosition
from services.mf_price_service import MutualFundPriceService

logger = logging.getLogger(__name__)

# Global cache for Nifty data to avoid redundant slow yfinance fetches
_nifty_cache = {
    "data": None,
    "last_updated": None
}

class MFPortfolioService:
    """Service for MF portfolio management and analysis"""
    
    @staticmethod
    def calculate_xirr(cashflows: List[Tuple[datetime, float]], guess=0.1) -> Optional[float]:
        """
        Calculate XIRR (Extended Internal Rate of Return) for irregular cashflows
        
        Args:
            cashflows: List of (date, amount) tuples
                      Negative for investments, positive for redemptions/current value
            guess: Initial guess for IRR (default 0.1 = 10%)
            
        Returns:
            float: XIRR as a percentage, or None if calculation fails
        """
        try:
            if not cashflows or len(cashflows) < 2:
                logger.warning(f"Insufficient cashflows for XIRR: {len(cashflows) if cashflows else 0}")
                return None
            
            # Sort cashflows by date
            cashflows = sorted(cashflows, key=lambda x: x[0])
            
            # Check if all cashflows are zero or same sign (invalid for XIRR)
            amounts = [cf[1] for cf in cashflows]
            if all(a >= 0 for a in amounts) or all(a <= 0 for a in amounts):
                logger.warning("All cashflows have same sign, cannot calculate XIRR")
                return None
            
            # Base date (first cashflow date)
            base_date = cashflows[0][0]
            
            # Convert to days from base date
            days_and_amounts = []
            for date, amount in cashflows:
                days = (date - base_date).days
                days_and_amounts.append((days, amount))
            
            # Try multiple initial guesses if first one doesn't converge
            guesses = [guess, 0.01, -0.01, 0.5, -0.5]
            
            for initial_guess in guesses:
                # Newton-Raphson method to find IRR
                rate = initial_guess
                max_iterations = 100
                tolerance = 1e-6
                
                for iteration in range(max_iterations):
                    npv = 0
                    dnpv = 0
                    
                    for days, amount in days_and_amounts:
                        if days == 0:
                            npv += amount
                        else:
                            factor = (1 + rate) ** (days / 365.0)
                            npv += amount / factor
                            dnpv -= (days / 365.0) * amount / (factor * (1 + rate))
                    
                    if abs(npv) < tolerance:
                        result = rate * 100  # Convert to percentage
                        logger.info(f"XIRR converged to {result}% after {iteration} iterations with guess {initial_guess}")
                        return result
                    
                    if dnpv == 0:
                        break  # Try next guess
                    
                    rate = rate - npv / dnpv
                    
                    # Prevent extreme values
                    if rate < -0.99:
                        rate = -0.99
                    elif rate > 10:
                        rate = 10
            
            # If we didn't converge with any guess
            logger.warning(f"XIRR did not converge after trying {len(guesses)} initial guesses")
            return None
            
        except Exception as e:
            logger.error(f"Error calculating XIRR: {str(e)}")
            logger.exception(e)
            return None
    
    @staticmethod
    def calculate_nifty_xirr(cashflows: List[Tuple[datetime, float]]) -> Optional[float]:
        """
        Calculate Nifty 50 XIRR for the same investment dates
        
        This simulates what the return would have been if the same amounts
        were invested in Nifty 50 on the same dates
        
        Args:
            cashflows: List of (date, amount) tuples from portfolio
            
        Returns:
            float: Nifty XIRR as a percentage, or None if calculation fails
        """
        try:
            import yfinance as yf
            
            if not cashflows or len(cashflows) < 2:
                logger.warning(f"Insufficient cashflows for Nifty XIRR: {len(cashflows) if cashflows else 0}")
                return None
            
            # Sort cashflows
            cashflows = sorted(cashflows, key=lambda x: x[0])
            logger.info(f"Calculating Nifty XIRR for {len(cashflows)} cashflows")
            
            # Check cache first
            global _nifty_cache
            now = datetime.now()
            
            # Cache Nifty history for 4 hours to avoid redundant hits
            if (_nifty_cache["data"] is not None and 
                _nifty_cache["last_updated"] is not None and 
                (now - _nifty_cache["last_updated"]) < timedelta(hours=4)):
                hist = _nifty_cache["data"]
                logger.info("Using cached Nifty data")
            else:
                # Fetch Nifty data (get last 5 years to be safe for most portfolios)
                logger.info("Fetching fresh Nifty data from yfinance")
                nifty = yf.Ticker("^NSEI")
                hist = nifty.history(period="5y")
                if not hist.empty:
                    _nifty_cache["data"] = hist
                    _nifty_cache["last_updated"] = now
                    logger.info(f"Cached {len(hist)} days of Nifty data")
            
            if hist.empty:
                logger.warning("No Nifty data available")
                return None
            
            # Calculate Nifty cashflows
            nifty_cashflows = []
            total_nifty_units = 0
            
            for d, amount in cashflows[:-1]:  # Exclude last cashflow (current value)
                # Find closest Nifty price
                # Ensure we use date part only for matching
                target_dt = d.date()
                
                # Convert to timezone-aware timestamp to match hist.index
                # yfinance returns timezone-aware data (Asia/Kolkata)
                target_ts = pd.Timestamp(target_dt)
                if hist.index.tz is not None:
                    # Make target timezone-aware to match the index
                    target_ts = target_ts.tz_localize(hist.index.tz)
                
                idx = hist.index.get_indexer([target_ts], method='nearest')[0]
                nifty_price = hist.iloc[idx]['Close']
                
                if amount < 0:  # Investment
                    units = abs(amount) / nifty_price
                    total_nifty_units += units
                    nifty_cashflows.append((d, amount))
            
            logger.info(f"Total Nifty units purchased: {total_nifty_units}")
            
            # Calculate current Nifty value
            current_nifty_price = hist.iloc[-1]['Close']
            current_nifty_value = total_nifty_units * current_nifty_price
            nifty_cashflows.append((now, current_nifty_value))
            
            logger.info(f"Current Nifty value: {current_nifty_value}, Price: {current_nifty_price}")
            logger.info(f"Nifty cashflows count: {len(nifty_cashflows)}")
            
            # Calculate XIRR for Nifty
            nifty_xirr = MFPortfolioService.calculate_xirr(nifty_cashflows)
            
            logger.info(f"Calculated Nifty XIRR: {nifty_xirr}")
            
            return nifty_xirr
            
        except ImportError:
            logger.warning("yfinance not installed, cannot calculate Nifty XIRR")
            return None
        except Exception as e:
            logger.error(f"Error calculating Nifty XIRR: {str(e)}")
            logger.exception(e)
            return None
    
    @staticmethod
    def get_portfolio_overview(user_email: str, portfolio_id: str) -> Dict:
        """
        Calculates only high-level KPIs and benchmarks.
        Skips building the enriched positions list to save resources.
        Optimized by fetching unique NAVs only once.
        """
        try:
            positions = MFPosition.get_positions(user_email, portfolio_id)
            
            if not positions:
                return {
                    "success": True,
                    "summary": {
                        "total_invested": 0, "current_value": 0, "total_returns": 0,
                        "total_returns_percent": 0, "xirr": None, "nifty_xirr": None,
                        "alpha": None, "position_count": 0
                    }
                }

            # Grouping and aggregating
            total_invested = 0
            total_current_value = 0
            cashflows = []
            scheme_codes = list(set(p.get("scheme_code") for p in positions if p.get("scheme_code")))
            
            # Fetch NAVs IN PARALLEL
            nav_map = {}
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                future_to_code = {executor.submit(MutualFundPriceService.get_fund_nav, code): code for code in scheme_codes}
                for future in concurrent.futures.as_completed(future_to_code):
                    code = future_to_code[future]
                    try:
                        fund_data = future.result()
                        if fund_data:
                            nav_map[code] = fund_data
                    except Exception as exc:
                        logger.error(f"Scheme {code} error: {exc}")

            for position in positions:
                scheme_code = position.get("scheme_code")
                invested_amount = position.get("invested_amount", 0)
                units = position.get("units", 0)
                purchase_date_str = position.get("purchase_date")
                
                nav_data = nav_map.get(scheme_code)
                current_nav = nav_data.get("nav", 0) if nav_data else 0
                
                total_invested += invested_amount
                total_current_value += (units * current_nav)
                
                if purchase_date_str:
                    try:
                        p_date = datetime.fromisoformat(purchase_date_str.replace('Z', '+00:00'))
                        cashflows.append((p_date, -invested_amount))
                    except: pass

            now = datetime.now()
            cashflows.append((now, total_current_value))
            
            logger.info(f"Calculating portfolio XIRR with {len(cashflows)} cashflows")
            xirr = MFPortfolioService.calculate_xirr(cashflows)
            
            logger.info(f"Calculating Nifty XIRR with {len(cashflows)} cashflows")
            logger.info(f"First cashflow: {cashflows[0] if cashflows else 'None'}, Last: {cashflows[-1] if cashflows else 'None'}")
            nifty_xirr = MFPortfolioService.calculate_nifty_xirr(cashflows)
            
            total_returns = total_current_value - total_invested
            total_returns_percent = (total_returns / total_invested * 100) if total_invested > 0 else 0
            alpha = (xirr - nifty_xirr) if (xirr is not None and nifty_xirr is not None) else None
            
            return {
                "success": True,
                "summary": {
                    "total_invested": total_invested,
                    "current_value": total_current_value,
                    "total_returns": total_returns,
                    "total_returns_percent": total_returns_percent,
                    "xirr": xirr,
                    "nifty_xirr": nifty_xirr,
                    "alpha": alpha,
                    "position_count": len(positions)
                }
            }
        except Exception as e:
            logger.error(f"Error in portfolio overview: {str(e)}")
            return {"success": False, "error": str(e), "summary": {}}

    @staticmethod
    def get_portfolio_analysis(user_email: str, portfolio_id: str) -> Dict:
        """
        Get comprehensive portfolio analysis with XIRR and other metrics
        
        Args:
            user_email: User's email
            portfolio_id: Portfolio ID
            
        Returns:
            dict: Portfolio analysis with positions, metrics, and XIRR
        """
        try:
            # Get all positions
            positions = MFPosition.get_positions(user_email, portfolio_id)
            
            if not positions:
                return {
                    "success": True,
                    "positions": [],
                    "summary": {
                        "total_invested": 0,
                        "current_value": 0,
                        "total_returns": 0,
                        "total_returns_percent": 0,
                        "xirr": None,
                        "position_count": 0
                    }
                }
            
            # Identify unique scheme codes to avoid redundant NAV fetching
            scheme_codes = list(set(p.get("scheme_code") for p in positions if p.get("scheme_code")))
            
            # Fetch NAVs IN PARALLEL to significantly reduce wait time
            nav_map = {}
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                # Map scheme codes to futures
                future_to_code = {executor.submit(MutualFundPriceService.get_fund_nav, code): code for code in scheme_codes}
                for future in concurrent.futures.as_completed(future_to_code):
                    code = future_to_code[future]
                    try:
                        fund_data = future.result()
                        if fund_data:
                            nav_map[code] = fund_data
                    except Exception as exc:
                        logger.error(f"Scheme {code} generated an exception: {exc}")

            # Enrich positions with current NAV and calculate metrics
            enriched_positions = []
            total_invested = 0
            total_current_value = 0
            cashflows = []  # For XIRR calculation
            
            # For per-fund XIRR
            fund_groups = {} # scheme_code -> {"cashflows": [], "current_value": 0}

            for position in positions:
                scheme_code = position.get("scheme_code")
                units = position.get("units", 0)
                invested_amount = position.get("invested_amount", 0)
                purchase_date_str = position.get("purchase_date")
                purchase_nav = position.get("purchase_nav", 0)
                
                # Get current NAV from optimized map
                fund_data = nav_map.get(scheme_code)
                current_nav = fund_data.get("nav", 0) if fund_data else 0
                
                # Calculate current value and returns
                current_value = units * current_nav
                returns = current_value - invested_amount
                returns_percent = (returns / invested_amount * 100) if invested_amount > 0 else 0
                
                # Add to totals
                total_invested += invested_amount
                total_current_value += current_value
                
                if scheme_code not in fund_groups:
                    fund_groups[scheme_code] = {"cashflows": [], "current_value": 0}
                
                # Add cashflow for XIRR (negative for investment)
                if purchase_date_str:
                    try:
                        purchase_date = datetime.fromisoformat(purchase_date_str.replace('Z', '+00:00'))
                        cashflows.append((purchase_date, -invested_amount))
                        fund_groups[scheme_code]["cashflows"].append((purchase_date, -invested_amount))
                    except:
                        pass
                
                fund_groups[scheme_code]["current_value"] += current_value
                
                # Enrich position
                enriched_position = {
                    **position,
                    "current_nav": current_nav,
                    "current_value": current_value,
                    "returns": returns,
                    "returns_percent": returns_percent,
                    "fund_name": fund_data.get("scheme_name", position.get("scheme_name", "")) if fund_data else position.get("scheme_name", ""),
                    "fund_house": fund_data.get("fund_house", "") if fund_data else ""
                }
                
                enriched_positions.append(enriched_position)
            
            # Calculate per-fund XIRR
            now = datetime.now()
            fund_xirrs = {}
            for sc, g_data in fund_groups.items():
                if g_data["cashflows"]:
                    f_cashflows = g_data["cashflows"] + [(now, g_data["current_value"])]
                    fund_xirrs[sc] = MFPortfolioService.calculate_xirr(f_cashflows)
                else:
                    fund_xirrs[sc] = None
            
            # Inject fund-wise XIRR into enriched positions
            for ep in enriched_positions:
                ep["fund_xirr"] = fund_xirrs.get(ep.get("scheme_code"))
            
            # Add final cashflow (current value as positive)
            cashflows.append((now, total_current_value))
            
            # Calculate XIRR
            xirr = MFPortfolioService.calculate_xirr(cashflows)
            
            # Calculate Nifty XIRR for comparison
            nifty_xirr = MFPortfolioService.calculate_nifty_xirr(cashflows)
            
            # Calculate summary
            total_returns = total_current_value - total_invested
            total_returns_percent = (total_returns / total_invested * 100) if total_invested > 0 else 0
            
            # Calculate alpha (portfolio XIRR - Nifty XIRR)
            alpha = None
            if xirr is not None and nifty_xirr is not None:
                alpha = xirr - nifty_xirr
            
            summary = {
                "total_invested": total_invested,
                "current_value": total_current_value,
                "total_returns": total_returns,
                "total_returns_percent": total_returns_percent,
                "xirr": xirr,
                "nifty_xirr": nifty_xirr,
                "alpha": alpha,
                "position_count": len(positions)
            }
            
            return {
                "success": True,
                "positions": enriched_positions,
                "summary": summary
            }
        except Exception as e:
            logger.error(f"Error in portfolio analysis: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "positions": [],
                "summary": {}
            }
    
    @staticmethod
    def add_position(user_email: str, portfolio_id: str, position_data: Dict) -> Tuple[bool, str, Optional[Dict]]:
        """
        Add a new MF position to portfolio
        
        Args:
            user_email: User's email
            portfolio_id: Portfolio ID
            position_data: Position details
            
        Returns:
            tuple: (success, message, position_doc)
        """
        try:
            # Validate required fields
            # Units optional now
            required_fields = ["scheme_code", "purchase_date", "invested_amount"]
            for field in required_fields:
                if field not in position_data:
                    return False, f"Missing required field: {field}", None
            
            scheme_code = str(position_data.get("scheme_code")).strip()
            purchase_date = position_data.get("purchase_date")
            invested_amount = float(position_data.get("invested_amount", 0))
            
            # Get fund details
            fund_data = MutualFundPriceService.get_fund_nav(scheme_code)
            if not fund_data:
                return False, f"Invalid scheme code: {scheme_code}", None
            
            # Calculate units if not provided
            units = position_data.get("units")
            if units is None or str(units).strip() == "":
                # Fetch NAV on purchase date
                purchase_nav = MutualFundPriceService.get_nav_on_date(scheme_code, purchase_date)
                if purchase_nav:
                    units = invested_amount / purchase_nav
                else:
                    # Fallback to current NAV if historical not found
                    purchase_nav = fund_data.get("nav", 0)
                    units = invested_amount / purchase_nav
            else:
                units = float(units)

            # Calculate purchase NAV for record keeping if not explicitly provided
            purchase_nav = position_data.get("purchase_nav")
            if not purchase_nav:
                if units > 0:
                    # Try to get historical NAV again for accuracy in record
                    hist_nav = MutualFundPriceService.get_nav_on_date(scheme_code, purchase_date)
                    purchase_nav = hist_nav if hist_nav else (invested_amount / units)
                else:
                    purchase_nav = fund_data.get("nav", 0)
            
            # Prepare position document
            position_doc = {
                "user_email": user_email,
                "portfolio_id": portfolio_id,
                "scheme_code": scheme_code,
                "scheme_name": fund_data.get("scheme_name", ""),
                "units": float(units),
                "purchase_date": position_data.get("purchase_date"),
                "invested_amount": float(position_data.get("invested_amount", 0)),
                "purchase_nav": float(purchase_nav)
            }
            
            # Create position
            created_position = MFPosition.create_position(position_doc)
            
            return True, "Position added successfully", created_position
            
        except Exception as e:
            logger.error(f"Error adding position: {str(e)}")
            return False, f"Error adding position: {str(e)}", None
    
    @staticmethod
    def update_position(user_email: str, position_id: str, update_data: Dict) -> Tuple[bool, str, Optional[Dict]]:
        """Update an existing MF position"""
        try:
            # Get existing position
            existing = MFPosition.get_position_by_id(user_email, position_id)
            if not existing:
                return False, "Position not found", None
            
            # Update position
            updated_position = MFPosition.update_position(user_email, position_id, update_data)
            
            if updated_position:
                return True, "Position updated successfully", updated_position
            else:
                return False, "Failed to update position", None
                
        except Exception as e:
            logger.error(f"Error updating position: {str(e)}")
            return False, f"Error updating position: {str(e)}", None
    
    @staticmethod
    def delete_position(user_email: str, position_id: str) -> Tuple[bool, str, Optional[Dict]]:
        """Delete an MF position"""
        try:
            deleted_position = MFPosition.delete_position(user_email, position_id)
            
            if deleted_position:
                return True, "Position deleted successfully", deleted_position
            else:
                return False, "Position not found", None
                
        except Exception as e:
            logger.error(f"Error deleting position: {str(e)}")
            return False, f"Error deleting position: {str(e)}", None
