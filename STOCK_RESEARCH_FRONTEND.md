# Stock Research Feature - Frontend Integration

## Overview
The Stock Research feature provides comprehensive fundamental analysis for stocks using Perplexity AI, integrated seamlessly into the Portfolio Buzz frontend.

## Components

### 1. StockResearchModal (`components/StockResearchModal.tsx`)
A full-featured modal component that provides:
- **Stock Search**: Search functionality using the existing `/api/search/autocomplete` endpoint
- **Research Display**: Beautiful UI to display 17+ fundamental analysis metrics
- **Loading States**: Smooth loading animations during API calls
- **Error Handling**: User-friendly error messages

#### Key Features:
- Clean, modular design
- Responsive layout
- Real-time search with debouncing
- Structured data display with sections
- Support for both JSON and text format responses

### 2. Updated Sidebar (`components/Sidebar.tsx`)
Added a new "Deep Research" button with:
- Flask icon (🧪) to represent research/analysis
- Tooltip: "Deep Research"
- Click handler: Opens the StockResearchModal

### 3. Updated Watchlist Page (`pages/watchlist.tsx`)
Integrated the research modal with:
- State management for modal visibility
- Event handlers for opening/closing
- Proper component composition

## User Flow

1. **Open Research Modal**
   - User clicks the Flask icon in the sidebar
   - Modal opens with search interface

2. **Search for Stock**
   - User types stock name or ticker (e.g., "RELIANCE", "TCS")
   - Auto-complete suggestions appear from database
   - Results show: Ticker, Company Name, Exchange

3. **Select Stock**
   - User clicks on a stock from search results
   - API call is made to `/api/stock-research` with:
     ```json
     {
       "stock_name": "Reliance Industries Limited",
       "ticker_name": "RELIANCE"
     }
     ```

4. **View Research**
   - Loading state shows "Analyzing..." (10-30 seconds)
   - Research data displays in organized sections:
     - Business Model
     - Core Focus & Strengths
     - Revenue & Profit Growth
     - PE & PB Ratios (with industry comparison)
     - ROE & ROCE
     - Debt Level (10-year)
     - Cash Flow (10-year)
     - Profit Margin (10-year)
     - Dividend History
     - Recent Price Movement
     - Competitors Analysis
     - Capital Expenditure
     - Investment Pros (highlighted in green)
     - Investment Cons (highlighted in red)
     - Future Outlook
     - Analyst Opinion
     - Recent News
     - Legal & Patents
     - Recommendation (highlighted)

5. **Navigate Back**
   - User can click "← Back to Search" to search another stock
   - Or close the modal entirely

## API Integration

### Endpoint Used
- **Search**: `GET /api/search/autocomplete?q={query}&limit=8`
- **Research**: `POST /api/stock-research`

### Request Format
```typescript
{
  stock_name: string  // Full company name from DB
  ticker_name: string // Ticker symbol from DB
}
```

### Response Format
```typescript
{
  success: boolean
  data: {
    stock_name: string
    ticker: string
    business_model?: string
    core_focus?: string
    revenue_profit_growth?: string
    // ... 17+ fields
    generated_at: string
    analysis_type: 'fundamental_research'
  }
  error?: string
}
```

## Styling

The modal uses:
- **Dark theme** consistent with the app
- **Blue accents** (#3b82f6) for interactive elements
- **Smooth animations** for loading and transitions
- **Responsive design** adapts to different screen sizes
- **Color coding**:
  - Green borders for positive sections (Investment Pros)
  - Red borders for negative sections (Investment Cons)
  - Blue borders for highlighted sections (Recommendation)

## Technical Details

### State Management
```typescript
const [isResearchOpen, setIsResearchOpen] = useState(false)
```

### Authentication
Uses `getAuthHeaders()` from `lib/auth.ts` to include JWT token in requests.

### Error Handling
- Network errors
- API errors
- Empty results
- Invalid responses

### Performance
- Debounced search (300ms)
- Lazy loading of research data
- Optimized re-renders

## Future Enhancements

Potential improvements:
1. **Save Research**: Allow users to save research reports
2. **Compare Stocks**: Side-by-side comparison of multiple stocks
3. **Export**: Download research as PDF
4. **Favorites**: Quick access to frequently researched stocks
5. **Historical**: View past research reports
6. **Notifications**: Alert when new research is available

## Files Modified

1. `frontend/components/StockResearchModal.tsx` - New file
2. `frontend/components/Sidebar.tsx` - Added research button
3. `frontend/pages/watchlist.tsx` - Integrated modal

## Testing

To test the feature:
1. Start the backend: `cd backend && python app.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Login to the app
4. Click the Flask icon in the sidebar
5. Search for a stock (e.g., "RELIANCE")
6. Click on a result to view research

## Dependencies

No new dependencies required! Uses existing:
- `lucide-react` for icons
- `next` for routing
- Existing auth utilities
