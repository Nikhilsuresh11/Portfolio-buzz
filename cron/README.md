# Standalone News Scraper

Standalone news scraping system for Portfolio Buzz that periodically fetches news for all company tickers and stores them in MongoDB. This decouples news scraping from API request handling, improving reliability and performance.

## Features

- ✅ **Independent Execution**: Runs separately from backend API
- ✅ **MongoDB Integration**: Stores pre-fetched news with TTL (30 days auto-cleanup)
- ✅ **Multi-Source Scraping**: Aggregates from Google News, Yahoo Finance, Reuters, CNBC, BBC, Economic Times, and more
- ✅ **Deduplication**: Removes duplicate articles by URL and title
- ✅ **Error Handling**: Partial success support - continues scraping even if some tickers fail
- ✅ **Comprehensive Logging**: Detailed logs with statistics and error tracking
- ✅ **Batch Processing**: Efficiently processes all tickers in database
- ✅ **Test Mode**: Test with limited tickers before full run

## Architecture

```
┌─────────────────┐
│  Cron Scraper   │  ← Runs periodically (e.g., every 30 min)
│  (This folder)  │
└────────┬────────┘
         │
         ├─ Fetches tickers from MongoDB (watchlists + stock_mappings)
         ├─ Scrapes news from multiple sources
         ├─ Deduplicates and normalizes articles
         │
         ▼
┌─────────────────┐
│    MongoDB      │
│ company_news    │  ← Pre-fetched news storage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │  ← Fast reads from MongoDB
│  /api/news/*    │     (fallback to live scraping if stale)
└─────────────────┘
```

## Setup

### 1. Install Dependencies

```bash
cd d:\Start\Portfolio-buzz\cron
pip install -r requirements.txt
```

### 2. Configure Environment

The scraper uses the same `.env` file as the backend (in parent directory). Ensure `MONGODB_URI` is set:

```env
MONGODB_URI=mongodb://localhost:27017/
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

### 3. Initialize Database

Create MongoDB collection and indexes:

```bash
python db_setup.py
```

**Expected output:**
```
======================================================================
NEWS SCRAPER DATABASE SETUP
======================================================================

[1/4] Connecting to MongoDB...
      ✓ Connected successfully

[2/4] Using database: portfolio_buzz

[3/4] Setting up collection: company_news

[4/4] Creating indexes...
      ✓ Created unique index on 'ticker'
      ✓ Created index on 'last_updated'
      ✓ Created index on 'articles.published_date'
      ✓ Created TTL index (expires after 30 days)

✓ DATABASE SETUP COMPLETE
```

## Usage

### Run Full Scraper

Scrape news for all tickers in the database:

```bash
python news_scraper.py
```

### Test Mode

Test with only 3 tickers:

```bash
python news_scraper.py --test
```

### Single Ticker

Scrape news for a specific ticker:

```bash
python news_scraper.py --ticker AAPL
```

## Scheduling

### Option 1: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., every 30 minutes)
4. Action: Start a program
   - Program: `python`
   - Arguments: `d:\Start\Portfolio-buzz\cron\news_scraper.py`
   - Start in: `d:\Start\Portfolio-buzz\cron`

### Option 2: Cron (Linux/Mac)

Add to crontab:

```bash
# Run every 30 minutes
*/30 * * * * cd /path/to/Portfolio-buzz/cron && python news_scraper.py >> news_scraper.log 2>&1
```

### Option 3: GitHub Actions

Create `.github/workflows/scrape-news.yml`:

```yaml
name: Scrape News
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          cd cron
          pip install -r requirements.txt
      - name: Run scraper
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
        run: |
          cd cron
          python news_scraper.py
```

### Option 4: Render Cron Jobs

If deploying on Render, add a cron job service:

1. Create new Cron Job in Render dashboard
2. Command: `cd cron && python news_scraper.py`
3. Schedule: `*/30 * * * *` (every 30 minutes)

## MongoDB Schema

```javascript
{
  "ticker": "AAPL",                    // Unique ticker symbol
  "company_name": "Apple Inc.",        // Company name
  "articles": [                        // Array of news articles
    {
      "title": "Apple announces...",
      "url": "https://...",
      "content": "Full article text...",
      "source": "Google News",
      "published_date": "2025-12-19T13:47:34Z",
      "scraped_at": "2025-12-19T13:47:34Z"
    }
  ],
  "last_updated": "2025-12-19T13:47:34Z",  // Last scrape timestamp
  "scrape_status": "success",              // success | partial | failed
  "article_count": 15,                     // Number of articles
  "sources_tried": 6,                      // Number of sources attempted
  "sources_succeeded": 5,                  // Number of sources that returned data
  "error_message": null                    // Error details if failed
}
```

## Monitoring

### Check Logs

View scraper logs:

```bash
tail -f news_scraper.log
```

### MongoDB Stats

Check collection stats:

```javascript
// In MongoDB shell or Compass
db.company_news.stats()
db.company_news.find().count()
db.company_news.find({scrape_status: "failed"})
```

### API Integration

The backend API automatically uses pre-fetched news:

```python
# In backend/services/news_service.py
# MongoDB is checked first (fast)
# Falls back to live scraping if data is stale (>1 hour old)
```

## Configuration

Edit `config.py` to customize:

```python
# Scraping parameters
MAX_WORKERS = 4                  # Parallel threads
REQUEST_DELAY = (1.5, 4.0)       # Delay between requests (seconds)
MAX_ARTICLES_PER_TICKER = 20     # Articles to store per ticker

# Data freshness
DATA_TTL_DAYS = 30               # Auto-delete after 30 days

# Logging
LOG_LEVEL = 'INFO'               # DEBUG | INFO | WARNING | ERROR
```

## Troubleshooting

### MongoDB Connection Failed

**Error:** `Failed to connect to MongoDB`

**Solution:**
1. Check MongoDB is running: `mongod --version`
2. Verify `MONGODB_URI` in `.env`
3. Test connection: `python -c "from pymongo import MongoClient; MongoClient('mongodb://localhost:27017/').admin.command('ping')"`

### No Tickers Found

**Error:** `No tickers found to scrape`

**Solution:**
1. Ensure users have stocks in their watchlists
2. Check `stock_mappings` collection has data
3. Verify database name is correct in config

### Scraping Failures

**Error:** High number of failed tickers

**Solution:**
1. Check internet connection
2. Some sources may be temporarily down (partial success is normal)
3. Increase `REQUEST_DELAY` to avoid rate limiting
4. Check logs for specific error messages

## Performance

- **Full scrape** (100 tickers): ~5-10 minutes
- **Single ticker**: ~5-10 seconds
- **API response** (MongoDB read): <100ms
- **Memory usage**: ~50-100MB

## Best Practices

1. **Schedule Frequency**: Run every 15-30 minutes for near-real-time news
2. **Monitor Logs**: Check for failed tickers and adjust scraping logic
3. **Data Freshness**: Backend falls back to live scraping if data >1 hour old
4. **Error Handling**: Partial success is normal - don't worry if some sources fail
5. **Rate Limiting**: Respect source websites by keeping delays reasonable

## Files

- `config.py` - Configuration settings
- `db_setup.py` - Database initialization
- `news_scraper.py` - Main scraper script
- `requirements.txt` - Python dependencies
- `news_scraper.log` - Scraper logs (auto-generated)
- `README.md` - This file

## Support

For issues or questions, check:
1. Logs in `news_scraper.log`
2. MongoDB collection `company_news`
3. Backend API logs for integration issues
