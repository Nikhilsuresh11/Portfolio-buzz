import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import traceback

class PortfolioAnalysisService:
    """Service for advanced portfolio analytics and metrics"""
    
    @staticmethod
    def calculate_portfolio_metrics(tickers):
        """
        Calculate comprehensive portfolio metrics
        
        Args:
            tickers: List of ticker symbols (e.g., ['RELIANCE.NS', 'TCS.NS'])
            
        Returns:
            dict: Calculated metrics
        """
        try:
            if not tickers:
                return False, "No tickers provided", None
                
            # Add benchmark (Nifty 50)
            benchmark_ticker = "^NSEI"
            all_tickers = tickers + [benchmark_ticker]
            
            # Fetch data for last 1 year (extended slightly for SMA200)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=400) # Need extra days for SMA200
            
            print(f"[ANALYTICS] Fetching data for {len(tickers)} stocks + benchmark...")
            
            # Download data
            data = yf.download(all_tickers, start=start_date, end=end_date, progress=False)['Close']
            
            if data.empty:
                return False, "Failed to fetch market data", None
                
            # Check if we have enough data columns (sometimes yf returns empty df with index but no columns)
            if isinstance(data, pd.Series):
                 # Convert to DF if only one ticker returned as Series
                 data = data.to_frame(name=tickers[0])
                 
            # Filter out columns with all NaNs
            data = data.dropna(axis=1, how='all')
            
            if data.empty:
                 return False, "No data available for provided tickers", None

            # Check if we have enough data (at least 1 year approx 252 days)
            if len(data) < 10:
                pass # Very little data, calculations might fail, but proceed with caution

            # ---------------------------------------------------------
            # 1. Performance Chart (Portfolio vs Benchmark) - Last 1 Year
            # ---------------------------------------------------------
            # Filter last 365 days for the chart
            chart_start_date = end_date - timedelta(days=365)
            chart_data_df = data[data.index >= chart_start_date].copy()
            
            # Calculate Daily Returns
            # FutureWarning fix: fill_method=None
            daily_returns = chart_data_df.pct_change(fill_method=None).dropna()
            
            # Identify Benchmark Column
            bench_col = benchmark_ticker
            if benchmark_ticker not in daily_returns.columns:
                 # Fallback logic
                 cols = [c for c in daily_returns.columns if 'NSEI' in str(c)]
                 bench_col = cols[0] if cols else None

            # Portfolio Return (Equal Weighted)
            # Filter out benchmark from portfolio assets
            asset_cols = [c for c in daily_returns.columns if c != bench_col]
            
            if asset_cols:
                portfolio_daily_ret = daily_returns[asset_cols].mean(axis=1)
                portfolio_cum_ret = (1 + portfolio_daily_ret).cumprod() * 100
            else:
                portfolio_cum_ret = pd.Series(100, index=daily_returns.index)

            if bench_col and bench_col in daily_returns.columns:
                benchmark_cum_ret = (1 + daily_returns[bench_col]).cumprod() * 100
            else:
                benchmark_cum_ret = pd.Series(100, index=daily_returns.index)
            
            # Format for Recharts (Array of objects)
            # Format for Recharts (Array of objects)
            performance_chart = []
            
            if not portfolio_cum_ret.empty:
                # Downsample to ~50 points for performance
                step = max(1, len(portfolio_cum_ret) // 50)
                for i in range(0, len(portfolio_cum_ret), step):
                    idx = portfolio_cum_ret.index[i]
                    performance_chart.append({
                        "date": idx.strftime('%b %d'),
                        "Portfolio": round(portfolio_cum_ret.iloc[i], 1),
                        "Nifty50": round(benchmark_cum_ret.loc[idx], 1) if idx in benchmark_cum_ret.index else 100.0
                    })
                # Add last point
                last_idx = portfolio_cum_ret.index[-1]
                performance_chart.append({
                    "date": last_idx.strftime('%b %d'),
                    "Portfolio": round(portfolio_cum_ret.iloc[-1], 1),
                    "Nifty50": round(benchmark_cum_ret.loc[last_idx], 1) if last_idx in benchmark_cum_ret.index else 100.0
                })

            # ---------------------------------------------------------
            # 2. Portfolio Metrics (Beta, Sharpe, VaR)
            # ---------------------------------------------------------
            # Recalculate returns based on 1 year window usage
            recent_returns = daily_returns
            
            betas = {}
            if bench_col and bench_col in recent_returns.columns:
                bench_rets = recent_returns[bench_col]
                bench_var = np.var(bench_rets)
                
                for ticker in tickers:
                    if ticker in recent_returns.columns:
                        try:
                            # Concat and dropna to align dates
                            aligned = pd.concat([recent_returns[ticker], bench_rets], axis=1).dropna()
                            if len(aligned) > 10 and bench_var > 0:
                                cov = np.cov(aligned.iloc[:, 0], aligned.iloc[:, 1])[0][1]
                                betas[ticker] = round(cov / bench_var, 2)
                            else:
                                betas[ticker] = 1.0
                        except:
                            betas[ticker] = 1.0
            
            avg_beta = float(np.mean(list(betas.values()))) if betas else 1.0
            
            # Sharpe
            risk_free_rate_daily = 0.07 / 252
            sharpe_ratios = {}
            for ticker in tickers:
                if ticker in recent_returns.columns:
                    r = recent_returns[ticker]
                    std = r.std()
                    if std > 0:
                        sharpe = (r.mean() - risk_free_rate_daily) / std * np.sqrt(252)
                        sharpe_ratios[ticker] = round(sharpe, 2)
                    else:
                        sharpe_ratios[ticker] = 0.0
                        
            # Portfolio Aggr Stats
            if not portfolio_daily_ret.empty:
                pf_mean = portfolio_daily_ret.mean()
                pf_std = portfolio_daily_ret.std()
                portfolio_sharpe = float((pf_mean - risk_free_rate_daily) / pf_std * np.sqrt(252)) if pf_std != 0 else 0.0
                
                var_95 = float(np.percentile(portfolio_daily_ret, 5))
                var_text = f"{abs(var_95 * 100):.2f}%"
                
                # Drawdown
                cum = (1 + portfolio_daily_ret).cumprod()
                peak = cum.cummax()
                dd = (cum - peak) / peak
                max_drawdown = float(dd.min())
                max_drawdown_text = f"{abs(max_drawdown * 100):.2f}%"
                
                volatility = float(pf_std * np.sqrt(252))
                volatility_text = f"{volatility * 100:.2f}%"
            else:
                portfolio_sharpe = 0.0
                var_text = "0.00%"
                max_drawdown_text = "0.00%"
                volatility_text = "0.00%"

            # ---------------------------------------------------------
            # 3. Technical Signals & Analysis
            # ---------------------------------------------------------
            technical_signals = []
            
            for ticker in tickers:
                if ticker in data.columns:
                    price_series = data[ticker].dropna()
                    if len(price_series) > 14:
                        # RSI
                        delta = price_series.diff()
                        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                        rs = gain / loss
                        rsi_series = 100 - (100 / (1 + rs))
                        curr_rsi = rsi_series.iloc[-1]
                        
                        # SMA
                        sma50 = price_series.rolling(window=50).mean().iloc[-1]
                        sma200 = price_series.rolling(window=200).mean().iloc[-1] if len(price_series) > 200 else 0
                        
                        trend = "Neutral"
                        signal = None
                        
                        # RSI Signals
                        if curr_rsi > 70:
                            signal = {"type": "warning", "msg": "Overbought (RSI > 70)"}
                        elif curr_rsi < 30:
                            signal = {"type": "success", "msg": "Oversold (RSI < 30)"}
                            
                        # SMA Signals (Cross over check would require prev day, but let's just do state)
                        if sma200 > 0:
                            if sma50 > sma200:
                                trend = "Bullish"
                            else:
                                trend = "Bearish"
                        
                        if signal:
                            technical_signals.append({
                                "ticker": ticker,
                                "signal": signal['msg'],
                                "type": signal['type'],
                                "value": round(curr_rsi, 1)
                            })
                            
            # ---------------------------------------------------------
            # 4. Correlation Matrix
            # ---------------------------------------------------------
            correlation_matrix = []
            avg_correlation = 0.0
            
            if len(asset_cols) > 1:
                corr_df = recent_returns[asset_cols].corr()
                
                # Format for heatmap (x, y, value)
                for x in corr_df.columns:
                    for y in corr_df.columns:
                        correlation_matrix.append({
                            "x": x.replace('.NS', ''), # Clean names
                            "y": y.replace('.NS', ''),
                            "value": round(corr_df.loc[x, y], 2)
                        })
                
                # Calculate avg correlation
                mask = np.triu(np.ones_like(corr_df, dtype=bool), k=1)
                avg_correlation = float(corr_df.where(mask).stack().mean())
            
            diversification_score = int(max(0, min(100, (1 - avg_correlation) * 100)))

            # ---------------------------------------------------------
            # 5. Market Indicators
            # ---------------------------------------------------------
            nifty_rsi = 50.0
            if bench_col and bench_col in data.columns:
                 price_series = data[bench_col].dropna()
                 if len(price_series) > 14:
                    delta = price_series.diff()
                    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                    rs = gain / loss
                    rsi_series = 100 - (100 / (1 + rs))
                    nifty_rsi = float(rsi_series.iloc[-1])

            # Compile result
            analysis_data = {
                "portfolio_health": {
                    "beta": round(avg_beta, 2),
                    "sharpe_ratio": round(portfolio_sharpe, 2),
                    "diversification_score": diversification_score,
                    "var_95": var_text,
                    "max_drawdown": max_drawdown_text,
                    "volatility": volatility_text
                },
                "market_indicators": {
                    "nifty_rsi": round(nifty_rsi, 1),
                    "fear_greed_index": int(50 + (nifty_rsi - 50) + (avg_beta * 5)), 
                    "market_sentiment": "Neutral" if 40 < nifty_rsi < 60 else ("Bullish" if nifty_rsi >= 60 else "Bearish")
                },
                "assets": [],
                "performance_chart": performance_chart,
                "technical_signals": technical_signals,
                "correlation_matrix": correlation_matrix
            }
            
            for ticker in tickers:
                analysis_data["assets"].append({
                    "ticker": ticker,
                    "beta": betas.get(ticker, 1.0),
                    "sharpe": sharpe_ratios.get(ticker, 0.0),
                })
                
            return True, "Analysis successful", analysis_data

        except Exception as e:
            print(f"Error in portfolio analysis: {e}")
            traceback.print_exc()
            return False, f"Analysis failed: {str(e)}", None

    @staticmethod
    def get_sector_distribution(tickers):
        """
        Get sector distribution for tickers.
        Uses yfinance info to fetch sector.
        """
        try:
            sectors = {}
            for ticker in tickers:
                try:
                    stock = yf.Ticker(ticker)
                    info = stock.info
                    sector = info.get('sector', 'Unknown')
                    sectors[sector] = sectors.get(sector, 0) + 1
                except:
                    sectors['Unknown'] = sectors.get('Unknown', 0) + 1
            
            total = len(tickers)
            distribution = []
            for sector, count in sectors.items():
                distribution.append({
                    "name": sector,
                    "value": round((count / total) * 100, 1),
                    "count": count
                })
            
            distribution.sort(key=lambda x: x['value'], reverse=True)
            
            return True, "Sector distribution calculated", distribution
            
        except Exception as e:
            return False, f"Sector analysis failed: {str(e)}", []
