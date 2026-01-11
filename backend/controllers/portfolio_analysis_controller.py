from flask import request, jsonify
from services.portfolio_analysis_service import PortfolioAnalysisService
from services.watchlist_service import WatchlistService
from utils.response import success_response, error_response
from utils.jwt_helper import token_required

class PortfolioAnalysisController:
    """Controller for portfolio analysis endpoints"""
    
    @staticmethod
    @token_required
    def get_portfolio_analysis(current_user_email):
        """
        GET /api/analysis/portfolio
        Get comprehensive portfolio analytics
        """
        try:
            # 1. Get user's watchlist tickers
            success, message, watchlist = WatchlistService.get_watchlist(current_user_email)
            if not success or not watchlist:
                return error_response("Watchlist is empty or count not be retrieved", 400)
                
            tickers = [item['ticker'] for item in watchlist]
            
            if not tickers:
                return success_response({
                    "portfolio_health": {
                        "beta": 0, "sharpe_ratio": 0, "diversification_score": 0,
                        "var_95": "0%", "max_drawdown": "0%", "volatility": "0%"
                    },
                    "market_indicators": {
                        "nifty_rsi": 50, "fear_greed_index": 50, "market_sentiment": "Neutral"
                    },
                    "sector_allocation": [],
                    "assets": [],
                    "performance_chart": [],
                    "technical_signals": [],
                    "correlation_matrix": []
                }, "Watchlist is empty", 200)

            # 2. Calculate Metrics
            success_metrics, msg_metrics, metrics_data = PortfolioAnalysisService.calculate_portfolio_metrics(tickers)
            if not success_metrics:
                return error_response(msg_metrics, 500)
                
            # 3. Get Sector Distribution
            # Optimization: We can reuse sector info from watchlist service if available to avoid slow yfinance calls
            # But WatchlistService might not have updated sector info always.
            # Let's try to extract sectors from the watchlist data first to save time
            tickers_with_sectors = {}
            unknown_sector_tickers = []
            
            sector_counts = {}
            for item in watchlist:
                sec = item.get('sector', 'Unknown')
                if sec and sec != 'Unknown' and sec != 'N/A':
                    sector_counts[sec] = sector_counts.get(sec, 0) + 1
                else:
                    unknown_sector_tickers.append(item['ticker'])
            
            # For unknown sectors, maybe fetch? Or just leave as unknown for speed
            # For now, let's use what we have to ensure speed
            total_stocks = len(watchlist)
            sector_allocation = []
            for sec, count in sector_counts.items():
                sector_allocation.append({
                    "name": sec,
                    "value": round((count / total_stocks) * 100, 1),
                    "count": count
                })
            sector_allocation.sort(key=lambda x: x['value'], reverse=True)
            
            # If metrics_data doesn't have sector info in assets, we can enrich it
            for asset in metrics_data['assets']:
                # Find sector in watchlist
                wl_item = next((i for i in watchlist if i['ticker'] == asset['ticker']), None)
                if wl_item:
                    asset['sector'] = wl_item.get('sector', 'Unknown')

            # Combine data
            response_data = {
                **metrics_data,
                "sector_allocation": sector_allocation
            }
            
            return success_response(response_data, "Portfolio analysis generated", 200)

        except Exception as e:
            return error_response(f"Error generating analysis: {str(e)}", 500)
