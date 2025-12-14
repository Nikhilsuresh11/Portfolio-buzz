import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Scene } from "@/components/ui/hero-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cpu, ShieldCheck, Layers, Zap, Menu, X, Loader2 } from "lucide-react";
import { isAuthenticated } from '../lib/auth';

const features = [
    {
        icon: Cpu,
        title: "Performance",
        description: "Ultra-fast data processing in every situation.",
    },
    {
        icon: ShieldCheck,
        title: "Security",
        description: "Advanced protection for complete peace of mind.",
    },
    {
        icon: Layers,
        title: "Modularity",
        description: "Easy integration with existing architecture.",
    },
    {
        icon: Zap,
        title: "Responsiveness",
        description: "Instant response to every command.",
    },
];

export default function LandingPage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [loadingWatchlist, setLoadingWatchlist] = useState(false);

    useEffect(() => {
        setIsLoggedIn(isAuthenticated());
        // Ensure dark theme for landing page aesthetics
        document.documentElement.setAttribute('data-theme', 'dark');
    }, []);

    const handleWatchlistClick = async () => {
        setLoadingWatchlist(true);
        await router.push('/watchlist');
    };

    return (
        <div className="min-h-svh w-screen bg-gradient-to-br from-[#000] to-[#1A2428] text-white flex flex-col relative overflow-hidden">

            {/* Navbar */}
            <nav className="relative z-50 w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Portfolio Buzz</span>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-4">
                    {isLoggedIn ? (
                        <Button
                            className="bg-white/10 border border-white/10 hover:bg-white/20 text-white"
                            onClick={handleWatchlistClick}
                            disabled={loadingWatchlist}
                        >
                            {loadingWatchlist && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Dashboard
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10" asChild>
                                <Link href="/auth/login?mode=login">
                                    Login
                                </Link>
                            </Button>
                            <Button className="bg-white text-black hover:bg-white/90" asChild>
                                <Link href="/auth/login?mode=signup">
                                    Sign Up
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-gray-300 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-16 left-0 w-full z-40 bg-black/90 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-4 md:hidden">
                    {isLoggedIn ? (
                        <Button
                            className="w-full bg-white/10 border border-white/10"
                            onClick={handleWatchlistClick}
                            disabled={loadingWatchlist}
                        >
                            {loadingWatchlist && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Dashboard
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" className="w-full justify-start text-gray-300" asChild>
                                <Link href="/auth/login?mode=login">Login</Link>
                            </Button>
                            <Button className="w-full bg-white text-black" asChild>
                                <Link href="/auth/login?mode=signup">Sign Up</Link>
                            </Button>
                        </>
                    )}
                </div>
            )}


            <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
                <div className="w-full max-w-6xl space-y-12">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <Badge variant="secondary" className="backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 px-4 py-2 rounded-full cursor-default">
                            ✨ Next Generation Portfolio Tracking
                        </Badge>

                        <div className="space-y-6 flex items-center justify-center flex-col ">
                            <h1 className="text-3xl md:text-6xl font-semibold tracking-tight max-w-3xl">
                                Discover minimalism and power in one place
                            </h1>
                            <p className="text-lg text-neutral-300 max-w-2xl">
                                Designed with aesthetics and performance in mind. Experience ultra-fast processing, advanced security, and intuitive design.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                {isLoggedIn ? (
                                    <Button
                                        className="text-sm px-8 py-3 h-auto rounded-xl bg-white text-black border border-white/10 shadow-none hover:bg-white/90 transition-none"
                                        onClick={handleWatchlistClick}
                                        disabled={loadingWatchlist}
                                    >
                                        {loadingWatchlist && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Go to Watchlist
                                    </Button>
                                ) : (
                                    <>
                                        <Button className="text-sm px-8 py-3 h-auto rounded-xl bg-white text-black border border-white/10 shadow-none hover:bg-white/90 transition-none" asChild>
                                            <Link href="/auth/login?mode=signup">
                                                Get Started
                                            </Link>
                                        </Button>
                                        <Button className="text-sm px-8 py-3 h-auto rounded-xl bg-transparent text-white border border-white/20 shadow-none hover:bg-white/10 transition-none" asChild>
                                            <Link href="/auth/login?mode=login">
                                                Login
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 h-40 md:h-48 flex flex-col justify-start items-start space-y-2 md:space-y-3 hover:bg-white/10 transition-colors"
                            >
                                <feature.icon size={18} className="text-white/80 md:w-5 md:h-5" />
                                <h3 className="text-sm md:text-base font-medium">{feature.title}</h3>
                                <p className="text-xs md:text-sm text-neutral-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className='absolute inset-0 z-0 pointer-events-none'>
                <Scene />
            </div>
        </div>
    );
}
