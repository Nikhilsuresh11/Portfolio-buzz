from flask import request, jsonify
from services.portfolio_analysis_service import PortfolioAnalysisService
from services.watchlist_service import WatchlistService
from utils.response import success_response, error_response

class PortfolioAnalysisController:
    """Controller for portfolio analysis endpoints"""
    
    @staticmethod
    def get_portfolio_analysis(user_email):
        """
        GET /api/{user_email}/analysis/portfolio
        Get comprehensive portfolio analytics
        """
        try:
            # Get IDs from query parameters
            portfolio_id = request.args.get('portfolio_id', 'default')
            
            # Get tickers from portfolio positions (as requested: "based on the portfolio positions and not the watchlist")
            from models.position import Position
            positions = Position.get_positions(user_email, portfolio_id)
            
            if not positions:
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
                }, "No positions found in this portfolio", 200)

            tickers = list(set([p['symbol'] for p in positions]))
            source_data = [{"ticker": p['symbol'], "sector": p.get('sector', 'Unknown')} for p in positions]
            print(f"[ANALYSIS] Analyzing portfolio: {portfolio_id} ({len(tickers)} unique tickers)")
            
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
            sector_counts = {}
            for item in source_data:
                sec = item.get('sector', 'Unknown')
                if sec and sec != 'Unknown' and sec != 'N/A':
                    sector_counts[sec] = sector_counts.get(sec, 0) + 1
            
            total_stocks = len(tickers) if tickers else 1
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
                # Find sector in source data
                info_item = next((i for i in source_data if i['ticker'] == asset['ticker']), None)
                if info_item:
                    asset['sector'] = info_item.get('sector', 'Unknown')

            # Combine data
            response_data = {
                **metrics_data,
                "sector_allocation": sector_allocation
            }
            
            return success_response(response_data, "Portfolio analysis generated", 200)

        except Exception as e:
            return error_response(f"Error generating analysis: {str(e)}", 500)
