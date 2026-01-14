import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { getToken, getUser, removeToken, saveToken, saveUser } from './auth';

interface AuthContextType {
    user: any | null;
    userEmail: string | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<any | null>(null);
    const [token, setTokenState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Initialize from local storage
        const storedToken = getToken();
        const storedUser = getUser();

        if (storedToken && storedUser) {
            setTokenState(storedToken);
            setUserState(storedUser);
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: any) => {
        saveToken(newToken);
        saveUser(newUser);
        setTokenState(newToken);
        setUserState(newUser);
    };

    const logout = () => {
        removeToken();
        setTokenState(null);
        setUserState(null);
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            userEmail: user?.email || null,
            token,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
