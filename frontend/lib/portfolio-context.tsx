import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { positionsApi } from './api';

interface Portfolio {
    portfolio_id: string;
    portfolio_name: string;
    position_count?: number;
}

interface PortfolioContextType {
    portfolios: Portfolio[];
    currentPortfolio: Portfolio | null;
    isLoading: boolean;
    setCurrentPortfolio: (portfolio: Portfolio) => void;
    refreshPortfolios: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
    const { userEmail, token } = useAuth();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [currentPortfolio, setCurrentPortfolioState] = useState<Portfolio | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load saved portfolio from local storage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('current_portfolio');
            if (saved) {
                try {
                    setCurrentPortfolioState(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse saved portfolio', e);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (userEmail && token) {
            refreshPortfolios();
        } else {
            setPortfolios([]);
        }
    }, [userEmail, token]);

    const refreshPortfolios = async () => {
        if (!userEmail || !token) return;

        setIsLoading(true);
        try {
            // Simply use a default portfolio for now as requested
            const defaultPortfolio = { portfolio_id: 'default', portfolio_name: 'Main Portfolio', position_count: 0 };
            setPortfolios([defaultPortfolio]);

            if (!currentPortfolio) {
                setCurrentPortfolio(defaultPortfolio);
            }
        } catch (error) {
            console.error("Error setting up portfolio", error);
        } finally {
            setIsLoading(false);
        }
    };

    const setCurrentPortfolio = (portfolio: Portfolio) => {
        setCurrentPortfolioState(portfolio);
        if (typeof window !== 'undefined') {
            localStorage.setItem('current_portfolio', JSON.stringify(portfolio));
        }
    };

    return (
        <PortfolioContext.Provider value={{
            portfolios,
            currentPortfolio,
            isLoading,
            setCurrentPortfolio,
            refreshPortfolios
        }}>
            {children}
        </PortfolioContext.Provider>
    );
}

export function usePortfolio() {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error('usePortfolio must be used within a PortfolioProvider');
    }
    return context;
}
