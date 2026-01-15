import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth-context';
import { config } from '@/config';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GoogleSignInModalProps {
    open: boolean;
    onClose: () => void;
}

const Logo = ({ className }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('h-8 w-8', className)}>
            <defs>
                <linearGradient
                    id="logo-gradient-modal"
                    x1="0"
                    y1="0"
                    x2="24"
                    y2="24"
                    gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#10B981" />
                </linearGradient>
            </defs>
            <path
                d="M3 3h18v18H3V3z"
                fill="url(#logo-gradient-modal)"
                opacity="0.2"
            />
            <path
                d="M7 12l3 3 7-7"
                stroke="url(#logo-gradient-modal)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12 3v3m0 12v3M3 12h3m12 0h3"
                stroke="url(#logo-gradient-modal)"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
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
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-[440px] overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="absolute inset-0 -z-10 bg-zinc-950 rounded-[2rem] border border-white/10" />
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />

                        <div className="p-8 sm:p-10 flex flex-col items-center">
                            {/* Brand Header */}
                            <div className="flex flex-col items-center mb-8">
                                <motion.div
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="mb-4"
                                >
                                    <Logo />
                                </motion.div>
                                <motion.h2
                                    initial={{ y: -5, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                    className="text-2xl font-bold tracking-tight text-white text-center"
                                >
                                    Sign In to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Portfolio Buzz</span>
                                </motion.h2>
                                <motion.p
                                    initial={{ y: -5, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-zinc-500 text-sm mt-2 text-center"
                                >
                                    Elevate your investment strategy with AI
                                </motion.p>
                            </div>

                            {/* Sign In Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="w-full flex flex-col items-center"
                            >
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                                        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                        <p className="text-zinc-400 text-sm font-medium">Authenticating...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="group w-full flex justify-center p-0.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-emerald-500/20 hover:from-blue-500/40 hover:to-emerald-500/40 transition-all duration-300">
                                            <div className="w-full h-[46px] flex justify-center">
                                                <GoogleLogin
                                                    onSuccess={handleGoogleSuccess}
                                                    onError={handleGoogleError}
                                                    theme="filled_black"
                                                    size="large"
                                                    text="continue_with"
                                                    shape="rectangular"
                                                    logo_alignment="left"
                                                    width="360"
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="w-full p-3 mt-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                                            >
                                                <p className="text-xs text-red-500 text-center font-medium">{error}</p>
                                            </motion.div>
                                        )}

                                        <p className="text-[11px] text-zinc-500 text-center mt-8 px-6 leading-relaxed">
                                            By continuing, you agree to our{' '}
                                            <a
                                                href="/terms"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-zinc-300 hover:text-white transition-colors underline underline-offset-4"
                                            >
                                                Terms
                                            </a>{' '}
                                            &{' '}
                                            <a
                                                href="/privacy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-zinc-300 hover:text-white transition-colors underline underline-offset-4"
                                            >
                                                Privacy
                                            </a>
                                        </p>
                                    </>
                                )}
                            </motion.div>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-all hover:bg-white/5 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

