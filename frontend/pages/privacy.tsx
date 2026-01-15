import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
    }, []);

    return (
        <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30">
            <Head>
                <title>Privacy Policy | Portfolio Buzz</title>
                <meta name="description" content="Privacy Policy for Portfolio Buzz - How we handle your data." />
            </Head>

            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            <header className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-md">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Lock size={18} className="text-emerald-400" />
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
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Privacy Policy</h1>
                    <p className="text-zinc-500 mb-12">Last updated: January 15, 2026</p>

                    <section className="space-y-12">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">1. Data We Collect</h2>
                            <p className="leading-relaxed mb-4">
                                Portfolio Buzz is designed to be privacy-conscious. We only collect the minimum amount of data required to provide our service:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Identity Data:</strong> We use Google OAuth to identify you. We store your email address and profile name provided by Google.</li>
                                <li><strong>Portfolio Data:</strong> We store the tickers, quantities, and transaction dates you add to your portfolios and watchlists.</li>
                                <li><strong>API Usage:</strong> We may log API requests to improve system performance and security.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Data</h2>
                            <p className="leading-relaxed mb-4">
                                Your data is strictly used for the following purposes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>To maintain your personalized watchlists and portfolios across sessions.</li>
                                <li>To provide AI-powered research and analysis specific to the stocks you follow.</li>
                                <li>To send alerts and notifications (if enabled by you) regarding price changes or news.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">3. Data Security</h2>
                            <p className="leading-relaxed">
                                We implement industry-standard security measures to protect your data. Authentication is handled by Google, ensuring your password is never shared with us. All communication between our frontend and backend is encrypted via HTTPS.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">4. Third-Party Services</h2>
                            <p className="leading-relaxed mb-4">
                                We utilize trusted third-party services to deliver our core features:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Google OAuth:</strong> For secure user authentication.</li>
                                <li><strong>Financial Data APIs:</strong> To retrieve real-time stock prices and market data.</li>
                                <li><strong>AI Models:</strong> To generate research summaries and insights (no personally identifiable data is sent to these models).</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">5. Data Retention & Deletion</h2>
                            <p className="leading-relaxed">
                                You have full control over your data. You can delete stocks from your watchlist or remove entire portfolios at any time. When you delete a portfolio, all associated transaction data is permanently removed from our active databases.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">6. Cookies</h2>
                            <p className="leading-relaxed">
                                We use essential cookies and local storage tokens to maintain your session state. We do not use tracking cookies for advertising or third-party data profiling.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-white mb-4">7. Contact Us</h2>
                            <p className="leading-relaxed">
                                If you have questions about this Privacy Policy or how your data is handled, feel free to contact us through the application settings.
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
