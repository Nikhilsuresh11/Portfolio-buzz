import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface AuthContextType {
    user: any | null;
    userEmail: string | null;
    isLoading: boolean;
    login: (email: string, user: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_EMAIL_KEY = 'pb_user_email';
const USER_DATA_KEY = 'pb_user_data';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<any | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Initialize from local storage
        if (typeof window !== 'undefined') {
            const storedEmail = localStorage.getItem(USER_EMAIL_KEY);
            const storedUser = localStorage.getItem(USER_DATA_KEY);

            if (storedEmail && storedUser) {
                setUserEmail(storedEmail);
                setUserState(JSON.parse(storedUser));
            }
        }
        setIsLoading(false);
    }, []);

    const login = (email: string, userData: any) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(USER_EMAIL_KEY, email);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        }
        setUserEmail(email);
        setUserState(userData);
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(USER_EMAIL_KEY);
            localStorage.removeItem(USER_DATA_KEY);
        }
        setUserEmail(null);
        setUserState(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{
            user,
            userEmail,
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
