import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth-context';
import { config } from '@/config';
import { X } from 'lucide-react';

interface GoogleSignInModalProps {
    open: boolean;
    onClose: () => void;
}

export function GoogleSignInModal({ open, onClose }: GoogleSignInModalProps) {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [open, onClose]);

    if (!open) return null;

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        setError(null);
        try {
            // Send Google token to backend
            const response = await fetch(`${config.API_BASE_URL}/api/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: credentialResponse.credential
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Store email and user data
                login(data.data.email, data.data.user);
                onClose();

                // Redirect to watchlist
                router.push('/watchlist');
            } else {
                setError(data.error || 'Sign in failed');
            }
        } catch (error) {
            console.error('Google sign in error:', error);
            setError('Failed to sign in. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google sign in failed');
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Sign In to Portfolio Buzz
                    </h2>
                    <p className="text-neutral-400">
                        Use your Google account to get started
                    </p>
                </div>

                {/* Content */}
                <div className="flex flex-col items-center justify-center space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            <div className="w-full flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    theme="filled_black"
                                    size="large"
                                    text="signin_with"
                                    shape="rectangular"
                                    logo_alignment="left"
                                    width="300"
                                />
                            </div>

                            {error && (
                                <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-sm text-red-400 text-center">{error}</p>
                                </div>
                            )}

                            <p className="text-xs text-neutral-500 text-center mt-6 px-4">
                                By signing in, you agree to our{' '}
                                <a href="#" className="text-blue-400 hover:underline">
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a href="#" className="text-blue-400 hover:underline">
                                    Privacy Policy
                                </a>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
