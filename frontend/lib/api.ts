import { config } from '../config';
import { getToken } from './auth';

const BASE_URL = config.API_BASE_URL;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
}

export interface Position {
    position_id: string;
    symbol: string;
    quantity: number;
    buy_date: string;
    invested_amount: number;
    nifty_value: number;
    current_price?: number;
    current_value?: number;
    profit?: number;
    return_percent?: number;
}

export interface NiftyMetrics {
    total_units: number;
    current_price: number;
    current_value: number;
    profit: number;
    return_percent: number;
    xirr: number | null;
    xirr_percent: number | null;
}

export interface SymbolBreakdown {
    symbol: string;
    total_quantity: number;
}

export interface Transaction {
    symbol: string;
    buy_date: string;
    quantity: number;
    invested_amount: number;
    nifty_value: number;
    nifty_units_bought: number;
}

export interface OverallTransactionsResponse {
    user_email: string;
    transaction_count: number;
    total_invested: number;
    current_value: number;
    profit: number;
    return_percent: number;
    portfolio_xirr: number | null;
    portfolio_xirr_percent: number | null;
    nifty: NiftyMetrics;
    outperformance: number | null;
    transactions: Transaction[];
    symbol_breakdown: SymbolBreakdown[];
}

export interface PortfolioSummaryResponse {
    user_email: string;
    count: number;
    total_invested: number;
    total_current_value: number;
    total_profit: number;
    return_percent: number;
    positions: Position[];
    symbol_allocations: any[]; // Define more strictly if needed
}

export const positionsApi = {
    getPortfolios: () =>
        fetchWithAuth(`/api/portfolio/portfolios`),

    createPosition: (portfolioId: string, data: any) =>
        fetchWithAuth(`/api/portfolio/positions`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    listPositions: (portfolioId: string, symbol?: string) => {
        const query = symbol ? `?symbol=${symbol}` : '';
        return fetchWithAuth(`/api/portfolio/positions${query}`);
    },

    getPosition: (positionId: string) =>
        fetchWithAuth(`/api/portfolio/positions/${positionId}`),

    updatePosition: (positionId: string, data: any) =>
        fetchWithAuth(`/api/portfolio/positions/${positionId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    deletePosition: (positionId: string) =>
        fetchWithAuth(`/api/portfolio/positions/${positionId}`, {
            method: 'DELETE',
        }),

    getPortfolioSummary: (portfolioId: string): Promise<PortfolioSummaryResponse> =>
        fetchWithAuth(`/api/portfolio/summary`),

    getOverallTransactions: (portfolioId: string): Promise<OverallTransactionsResponse> =>
        fetchWithAuth(`/api/portfolio/overall-transactions`),

    getWatchlist: () => fetchWithAuth('/api/watchlist'),

    addToWatchlist: (ticker: string) =>
        fetchWithAuth('/api/watchlist', {
            method: 'POST',
            body: JSON.stringify({ ticker }),
        }),

    removeFromWatchlist: (ticker: string) =>
        fetchWithAuth(`/api/watchlist/${ticker}`, {
            method: 'DELETE',
        }),

    getWatchlistPrices: () => fetchWithAuth('/api/watchlist/price'),
};
