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
