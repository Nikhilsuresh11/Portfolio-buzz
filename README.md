# 📈 Stock News Analyzer Pro - Setup Guide

## Overview
A professional financial news analysis tool with AI-powered insights from 30+ global sources. Features secure user authentication with MongoDB and advanced sentiment analysis using GROQ's Llama model.

---

## 📋 Project Structure

```
working_news_analyzer/
├── login.py                    # Login & Signup page (entry point)
├── scraper.py                  # Web scraper for 30+ news sources
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (create from .env.example)
├── .env.example               # Template for environment variables
├── pages/
│   ├── home.py                # Watchlist dashboard (protected)
│   └── claude.py              # Detailed stock analysis (protected)
└── README.md
```

---

## 🚀 Quick Start

### 1. **Install Dependencies**

```bash
pip install -r requirements.txt
```

### 2. **Set Up Environment Variables**

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# MongoDB Connection String
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/?retryWrites=true&w=majority

# GROQ API Key (get from https://console.groq.com)
GROQ_API_KEY=your_groq_api_key_here
```

### 3. **Create MongoDB Demo User** (Optional)

To test with demo credentials, create a user in MongoDB:

```javascript
db.users.insertOne({
  username: "demo",
  email: "demo@example.com",
  password: "e7cf3ef4f17c3999a94f2c6f612e8a888e5b1026878e4e19398b23dd3f592cb"  // SHA-256 hash of "demo123"
})
```

### 4. **Run the Application**

```bash
streamlit run login.py
```

The app will open at `http://localhost:8501`

---

## 🔐 Authentication System

### Login Page Features
- ✅ Secure password hashing (SHA-256)
- ✅ Username/Email validation
- ✅ MongoDB integration
- ✅ Session state management

### Signup Flow
1. Enter username (min 3 characters)
2. Enter email address
3. Create password (min 6 characters)
4. Account automatically stored in MongoDB

### Demo Credentials
- **Username:** `demo`
- **Password:** `demo123`

---

## 📊 Main Features (After Login)

### Watchlist Dashboard (home.py)
- **User-Specific Watchlist:** Automatically created per user
- **Suggested Stocks:** Popular stocks like AAPL, TSLA, MSFT, AMZN, NVDA
- **Add Custom Stocks:** Search and add any stock by ticker or name
- **Real-time News:** Latest news for each stock
- **Sentiment Analysis:** Automatic positive/negative/neutral classification
- **Quick Actions:** Click to analyze, remove stocks

### Stock Analysis (claude.py)
- **7-Section Detailed Report:**
  1. Executive Summary
  2. Key Developments
  3. Market Sentiment Analysis
  4. Important Events & Catalysts
  5. Stock Impact Assessment
  6. Cross-Source Insights
  7. Investment Takeaway
- **News Scraping:** 30+ global, Indian, and crypto sources
- **AI Analysis:** GROQ Llama 3.3 70B model
- **Report Download:** Export as TXT files
- **Back Navigation:** Return to watchlist anytime

---

## 🌐 Supported News Sources

### Global Sources (14)
Reuters, Bloomberg, CNBC, MarketWatch, Yahoo Finance, Investopedia, Google News, BBC Business, CNN Business, Forbes, Benzinga, Barron's, Motley Fool, Morningstar

### Ticker-Based Sources (5)
Seeking Alpha, Finviz, Zacks, TradingView, GuruFocus

### Indian Sources (8)
Economic Times, Moneycontrol, Livemint, Business Standard, NDTV Profit, Financial Express, Mint, Zerodha Pulse

### Crypto Sources (2)
CoinDesk, Cointelegraph

### Small Cap Sources (1)
Proactive Investors

---

## 🔧 Environment Setup

### MongoDB Setup
1. Create account at [MongoDB Cloud](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`
4. Add to `.env`

### GROQ API Setup
1. Create account at [GROQ Console](https://console.groq.com)
2. Generate API key
3. Add to `.env`

---

## 📁 File Descriptions

### `login.py`
- Entry point of the application
- Handles user authentication and signup
- Email-based login (not username)
- MongoDB integration for user management
- Session state management
- Redirects to `pages/home.py` on successful login

### `scraper.py`
- Contains 30+ scraper functions
- Parallel web scraping using ThreadPoolExecutor
- Request caching with @lru_cache
- Deduplication of articles
- Organized by region: Global, Indian, Crypto

### `pages/home.py`
- Protected dashboard (requires authentication)
- User-specific watchlist management
- MongoDB CRUD operations for watchlists
- Real-time news fetching per stock
- Sentiment analysis
- Add/remove stocks functionality
- Suggested stocks grid
- Redirects to `claude.py` for detailed analysis

### `pages/claude.py`
- Protected detailed analysis page
- Pre-populated with selected stock from watchlist
- News scraping orchestration
- AI analysis using GROQ API
- Report generation and download
- Back button to return to watchlist

---

## 🔒 Security Features

✅ **Password Security**
- SHA-256 hashing
- No plaintext passwords stored
- Validation on signup

✅ **Authentication**
- Session-based auth
- Automatic redirect for unauthenticated users
- Logout functionality

✅ **API Security**
- Environment variables for sensitive data
- No hardcoded credentials
- GROQ API key protection

---

## 🐛 Troubleshooting

### "Database connection failed"
- Verify `MONGODB_URI` in `.env`
- Check MongoDB cluster is running
- Ensure IP whitelist includes your IP

### "No articles found"
- Try different stock ticker
- Check internet connection
- Verify news sources are accessible

### "GROQ API Error"
- Verify `GROQ_API_KEY` in `.env`
- Check API key validity
- Ensure account has available quota

### Import errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

---

## 📝 Example Usage

1. **Start App:** `streamlit run login.py`
2. **Create Account:** Click "Sign Up" tab, enter email and password
3. **Login:** Use your credentials
4. **Add Stocks:** 
   - Click suggested stocks, OR
   - Search and add custom ticker
5. **View Analysis:** Click on any stock tile
6. **Download Report:** Export analysis as TXT
7. **Manage Watchlist:** Add/remove stocks anytime

---

## 🤝 Contributing

Enhancements welcome! Consider:
- Adding more news sources
- Improving sentiment analysis
- Database optimization
- UI/UX improvements

---

## ⚠️ Disclaimer

**For Educational Purposes Only**
- Not financial advice
- Use for research and information only
- Always consult professional advisors before trading
- Past performance ≠ Future results

---

## � Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        LOGIN.PY                              │
│                   (Entry Point)                              │
│                                                              │
│  ┌──────────────────┐          ┌──────────────────────┐    │
│  │   Login Tab      │          │   Signup Tab         │    │
│  │                  │          │                      │    │
│  │ • Email input    │   ←→     │ • Email input        │    │
│  │ • Password input │          │ • Password input     │    │
│  │ • Validate       │          │ • Confirm password   │    │
│  │ • Create session │          │ • Store in MongoDB   │    │
│  └──────────────────┘          └──────────────────────┘    │
│           ↓                                                   │
│     Authenticated ✓                                           │
└─────────────────────────────────────────────────────────────┘
          ↓↓↓
┌─────────────────────────────────────────────────────────────┐
│                     PAGES/HOME.PY                            │
│              (Watchlist Dashboard)                           │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  First Time User (Empty Watchlist):              │      │
│  │  • Show suggested stocks (AAPL, TSLA, etc)       │      │
│  │  • Allow custom stock search                     │      │
│  │  • Add to watchlist → MongoDB                    │      │
│  └──────────────────────────────────────────────────┘      │
│                      ↓                                        │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Returning User (Existing Watchlist):            │      │
│  │  • Load watchlist from MongoDB                   │      │
│  │  • Fetch latest news for each stock              │      │
│  │  • Calculate sentiment (positive/negative)       │      │
│  │  • Display tiles with news preview               │      │
│  │  • Show remove button                            │      │
│  └──────────────────────────────────────────────────┘      │
│           ↓                          ↓                       │
│    Click Stock Tile          Add New Stock                  │
│           ↓                          ↓                       │
└─────────────────────────────────────────────────────────────┘
          ↓↓↓                          ↓↓↓
┌──────────────────────┐    ┌─────────────────────────┐
│  PAGES/CLAUDE.PY     │    │   MongoDB Watchlist     │
│ (Stock Analysis)     │    │    Updated + Rerun      │
│                      │    └─────────────────────────┘
│ • Stock pre-filled   │
│ • Scrape 30+ sources │
│ • AI analysis        │
│ • Generate report    │
│ • Back to home.py    │
└──────────────────────┘
```

---

For issues or questions:
1. Check troubleshooting section
2. Verify environment setup
3. Review MongoDB/GROQ documentation

---

## 📄 License

This project is for educational purposes. Feel free to modify and use as needed.

---

**Happy analyzing! 📊**
