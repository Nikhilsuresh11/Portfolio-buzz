import React, { useEffect, useState } from 'react';
import { HeroSection } from "@/components/blocks/hero-section-1";
import { FeatureSteps } from "@/components/blocks/feature-section";
import { PricingSection } from "@/components/blocks/pricing-section";
import { isAuthenticated } from '../lib/auth';

const features = [
    {
        step: 'Step 1',
        title: 'Research & Search',
        content: 'Search any stock and get instant AI-powered research summaries and deep dives.',
        image: '/images/copilot.png'
    },
    {
        step: 'Step 2',
        title: 'Monitor Trends',
        content: 'Track live news and price changes across your customized watchlist with real-time updates.',
        image: '/images/portfolio.png'
    },
    {
        step: 'Step 3',
        title: 'AI Insights',
        content: 'Get deep analysis on fundamentals and sentiment to make better investment decisions.',
        image: 'https://images.unsplash.com/photo-1611974717414-0437fe8b8969?q=80&w=2070&auto=format&fit=crop'
    },
];

export default function LandingPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(isAuthenticated());
        // Ensure dark theme for landing page aesthetics
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
    }, []);

    return (
        <div className="bg-background text-foreground min-h-screen overflow-x-hidden dark">
            {/* Hero Section */}
            <HeroSection />

            {/* Feature Steps Section */}
            <div className="py-20 bg-zinc-950/50">
                <FeatureSteps
                    features={features}
                    title="Your Journey Starts Here"
                    autoPlayInterval={4000}
                    imageHeight="h-[500px]"
                />
            </div>

            {/* Pricing Section */}
            <PricingSection />

            {/* Footer */}
            <footer className="py-12 border-t border-zinc-800 bg-black text-center text-zinc-500 text-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <p>© 2026 Portfolio Buzz. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
