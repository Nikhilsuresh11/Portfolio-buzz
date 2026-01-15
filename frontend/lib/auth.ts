/**
 * Authentication utility functions - Updated for Google OAuth
 * These functions now work with email-based authentication instead of JWT tokens
 */

const USER_EMAIL_KEY = 'pb_user_email';
const USER_DATA_KEY = 'pb_user_data';

// Legacy token key (for backward compatibility during migration)
const TOKEN_KEY = 'pb_token';

/**
 * Check if user email exists (replaces token check)
 */
export const getToken = (): string | null => {
    // Return email as "token" for backward compatibility
    if (typeof window !== 'undefined') {
        return localStorage.getItem(USER_EMAIL_KEY);
    }
    return null;
};

/**
 * Check if user is authenticated (now checks for email)
 */
export const isAuthenticated = (): boolean => {
    if (typeof window !== 'undefined') {
        return !!localStorage.getItem(USER_EMAIL_KEY);
    }
    return false;
};

/**
 * Get user data from localStorage
 */
export const getUser = (): any | null => {
    if (typeof window !== 'undefined') {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }
    return null;
};

/**
 * Get user email
 */
export const getUserEmail = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(USER_EMAIL_KEY);
    }
    return null;
};

/**
 * Get authorization headers for API requests (no longer includes token)
 */
export const getAuthHeaders = (): HeadersInit => {
    return {
        'Content-Type': 'application/json',
    };
};

/**
 * Save user data (called by auth-context)
 */
export const saveUser = (user: any): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    }
};

/**
 * Save user email (called by auth-context)
 */
export const saveUserEmail = (email: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(USER_EMAIL_KEY, email);
    }
};

/**
 * Remove user data (logout)
 */
export const removeToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_EMAIL_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        // Also remove legacy token if it exists
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('pb_user');
    }
};

export const logout = removeToken;

// Legacy function for backward compatibility
export const saveToken = (token: string): void => {
    // No longer used, but kept for compatibility
    console.warn('saveToken is deprecated - using email-based auth now');
};
