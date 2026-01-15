/**
 * Authentication utility functions - Updated for Google OAuth
 * These functions track session state via localStorage
 */

const USER_EMAIL_KEY = 'pb_user_email';
const USER_DATA_KEY = 'pb_user_data';

/**
 * Check if user is authenticated (checks for email in session)
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
 * Remove session data (logout)
 */
export const logout = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_EMAIL_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        // Clear any legacy keys
        localStorage.removeItem('pb_token');
        localStorage.removeItem('pb_user');
        localStorage.removeItem('current_portfolio');
    }
};

/**
 * Placeholder for headers - most API calls now use getApiHeaders from api-helpers.ts
 */
export const getAuthHeaders = (): HeadersInit => {
    return {
        'Content-Type': 'application/json',
    };
};
