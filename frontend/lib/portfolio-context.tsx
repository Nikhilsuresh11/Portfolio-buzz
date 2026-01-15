import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { config } from '../config';
import { buildApiUrl, getApiHeaders } from './api-helpers';

interface Portfolio {
    portfolio_id: string;
    portfolio_name: string;
    description?: string;
    is_default: boolean;
    position_count?: number;
}

interface PortfolioContextType {
    portfolios: Portfolio[];
    currentPortfolio: Portfolio | null;
    isLoading: boolean;
    setCurrentPortfolio: (portfolio: Portfolio) => void;
    refreshPortfolios: () => Promise<void>;
    createPortfolio: (name: string, description: string, isDefault: boolean) => Promise<void>;
    updatePortfolio: (portfolioId: string, data: any) => Promise<void>;
    deletePortfolio: (portfolioId: string) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
    const { userEmail } = useAuth();
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
        if (userEmail) {
            refreshPortfolios();
        } else {
            setPortfolios([]);
        }
    }, [userEmail]);

    const refreshPortfolios = async () => {
        if (!userEmail) return;

        setIsLoading(true);
        try {
            const url = buildApiUrl(userEmail, 'portfolio-management/portfolios');
            const response = await fetch(url, {
                headers: getApiHeaders()
            });

            const data = await response.json();

            if (data.success && data.portfolios) {
                const fetchedPortfolios = data.portfolios;
                setPortfolios(fetchedPortfolios);

                // If no current portfolio or current portfolio not in list, select default or first
                if (fetchedPortfolios.length > 0) {
                    if (!currentPortfolio || !fetchedPortfolios.find((p: Portfolio) => p.portfolio_id === currentPortfolio.portfolio_id)) {
                        const defaultPortfolio = fetchedPortfolios.find((p: Portfolio) => p.is_default);
                        setCurrentPortfolio(defaultPortfolio || fetchedPortfolios[0]);
                    }
                } else {
                    setPortfolios([]);
                    setCurrentPortfolioState(null);
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('current_portfolio');
                    }
                }
            } else {
                setPortfolios([]);
                setCurrentPortfolioState(null);
            }
        } catch (error) {
            console.error("Error fetching portfolios", error);
            setPortfolios([]);
        } finally {
            setIsLoading(false);
        }
    };

    const createPortfolio = async (name: string, description: string, isDefault: boolean) => {
        if (!userEmail) return;

        try {
            const url = buildApiUrl(userEmail, 'portfolio-management/portfolios');
            const response = await fetch(url, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    portfolio_name: name,
                    description: description,
                    is_default: isDefault
                })
            });

            const data = await response.json();

            if (data.success) {
                await refreshPortfolios();
            }
        } catch (error) {
            console.error("Error creating portfolio", error);
            throw error;
        }
    };

    const updatePortfolio = async (portfolioId: string, updateData: any) => {
        if (!userEmail) return;

        try {
            const url = buildApiUrl(userEmail, `portfolio-management/portfolios/${portfolioId}`);
            const response = await fetch(url, {
                method: 'PUT',
                headers: getApiHeaders(),
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (data.success) {
                await refreshPortfolios();
            }
        } catch (error) {
            console.error("Error updating portfolio", error);
            throw error;
        }
    };

    const deletePortfolio = async (portfolioId: string) => {
        if (!userEmail) return;

        try {
            const url = buildApiUrl(userEmail, `portfolio-management/portfolios/${portfolioId}`);
            const response = await fetch(url, {
                method: 'DELETE',
                headers: getApiHeaders()
            });

            const data = await response.json();

            if (data.success) {
                await refreshPortfolios();
            } else {
                throw new Error(data.message || 'Failed to delete portfolio');
            }
        } catch (error) {
            console.error("Error deleting portfolio", error);
            throw error;
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
            refreshPortfolios,
            createPortfolio,
            updatePortfolio,
            deletePortfolio
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
