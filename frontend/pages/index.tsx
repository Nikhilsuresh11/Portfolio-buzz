import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { HeroSection } from "@/components/blocks/hero-section-1";
import { FeatureSteps } from "@/components/blocks/feature-section";
import { SolutionSection } from "@/components/blocks/solution-section";
import { PricingSection } from "@/components/blocks/pricing-section";
import { AboutUs } from "@/components/blocks/about-us";
import { isAuthenticated } from '../lib/auth';
import { motion } from 'framer-motion';

const features = [
    {
        step: 'Step 1',
        title: 'Research & Search',
        content: 'Search any stock and get instant AI-powered research summaries and deep dives.',
        image: '/images/copilot.png'
    },
    {
        step: 'Step 2',
        title: 'Deep AI Insights',
        content: 'Our models analyze sentiment, news momentum, and analyst projections in seconds.',
        image: '/images/ai-insight.png'
    },
    {
        step: 'Step 3',
        title: 'Risk Metrics',
        content: 'Quantify your exposure with intelligent risk scores and volatility tracking.',
        image: '/images/risk-metrics.png'
    },
];

export default function LandingPage() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        if (isAuthenticated()) {
            router.replace('/watchlist');
        } else {
            setIsCheckingAuth(false);
        }
        // Ensure dark theme for landing page aesthetics
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        // Smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';
    }, [router]);

    if (isCheckingAuth) {
        return <div className="min-h-screen bg-black" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-black text-foreground min-h-screen overflow-x-hidden dark"
        >
            {/* Hero Section */}
            <HeroSection />

            {/* Feature Steps Section */}
            <div className="bg-black">
                <FeatureSteps
                    features={features}
                    title="Intelligent Portfolio Management"
                    autoPlayInterval={4000}
                    imageHeight="h-[500px]"
                />
            </div>

            {/* Solution Section */}
            <SolutionSection />

            {/* Pricing Section */}
            <div className="bg-black">
                <PricingSection />
            </div>

            {/* About Us Section */}
            <AboutUs />

            {/* Footer */}
            <footer className="py-12 border-t border-zinc-900 bg-black text-center text-zinc-500 text-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <p>© 2026 Portfolio Buzz. All rights reserved.</p>
                    <div className="mt-4 flex justify-center gap-6 text-zinc-600">
                        <a href="#features" className="hover:text-zinc-400 transition-colors">Features</a>
                        <a href="#solution" className="hover:text-zinc-400 transition-colors">Solution</a>
                        <a href="#pricing" className="hover:text-zinc-400 transition-colors">Pricing</a>
                        <a href="#about" className="hover:text-zinc-400 transition-colors">About</a>
                    </div>
                </div>
            </footer>
        </motion.div>
    );
}

