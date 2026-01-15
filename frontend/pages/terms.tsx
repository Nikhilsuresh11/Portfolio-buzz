import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsOfService() {
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
    }, []);

    return (
        <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-500/30">
            <Head>
                <title>Terms of Service | Portfolio Buzz</title>
                <meta name="description" content="Terms of Service for Portfolio Buzz - AI-powered portfolio insights." />
            </Head>

            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
            </div>

            <header className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-md">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Shield size={18} className="text-blue-400" />
                        <span className="text-sm font-bold text-white tracking-tight">Portfolio Buzz</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Terms of Service</h1>
                    <p className="text-zinc-500 mb-12">Last updated: January 15, 2026</p>

                    <section className="space-y-12">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                            <p className="leading-relaxed">
                                By accessing or using Portfolio Buzz ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. Portfolio Buzz provides AI-powered stock research, portfolio tracking, and market insights.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
                            <p className="leading-relaxed mb-4">
                                Portfolio Buzz is an investment research platform that utilizes artificial intelligence to provide:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Real-time stock search and autocomplete functionality.</li>
                                <li>AI-generated research summaries and deep-dive analysis.</li>
                                <li>Portfolio and watchlist management tools.</li>
                                <li>Sentiment analysis and news momentum tracking.</li>
                                <li>Risk metrics and performance analytics.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">3. Not Financial Advice</h2>
                            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-blue-100/80 italic">
                                Important: Portfolio Buzz is for informational and educational purposes only. The AI-generated insights, research data, and metrics do not constitute financial, investment, or legal advice. Always conduct your own research or consult with a certified financial advisor before making any investment decisions.
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">4. User Accounts</h2>
                            <p className="leading-relaxed">
                                Our Service uses Google OAuth for authentication. You are responsible for maintaining the security of your Google account. Portfolio Buzz only accesses your email address and basic profile information to provide personalized portfolio services. You agree not to use the Service for any illegal or unauthorized purpose.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">5. Data Accuracy</h2>
                            <p className="leading-relaxed">
                                While we strive for accuracy, stock market data and AI-generated content may contain errors or delays. Portfolio Buzz relies on third-party APIs and large language models which may occasionally provide inaccurate or outdated information. We are not liable for any losses incurred based on information provided by the Service.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
                            <p className="leading-relaxed">
                                Portfolio Buzz and its creators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the Service, including but not limited to investment losses.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">7. Changes to Terms</h2>
                            <p className="leading-relaxed">
                                We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
                            </p>
                        </div>
                    </section>
                </motion.div>
            </main>

            <footer className="relative z-10 border-t border-white/5 py-12 text-center text-zinc-600">
                <p>&copy; 2026 Portfolio Buzz. All rights reserved.</p>
            </footer>
        </div>
    );
}
