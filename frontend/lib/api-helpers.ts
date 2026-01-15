import { config } from '../config';

/**
 * Build API URL with user email prefix for authenticated endpoints
 */
export function buildApiUrl(userEmail: string | null, endpoint: string): string {
    if (!userEmail) {
        throw new Error('User email is required for this endpoint');
    }

    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Encode email for URL safety
    const encodedEmail = encodeURIComponent(userEmail);

    return `${config.API_BASE_URL}/api/${encodedEmail}/${cleanEndpoint}`;
}

/**
 * Build API URL for public endpoints (no user email required)
 */
export function buildPublicApiUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    return `${config.API_BASE_URL}/api/${cleanEndpoint}`;
}

/**
 * Get headers for API requests (no auth token needed anymore)
 */
export function getApiHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json',
    };
}
