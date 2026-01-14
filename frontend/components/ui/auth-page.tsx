'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import Link from 'next/link';

import {
    ChevronLeftIcon,
    TrendingUp,
    BarChart3,
    Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthPageProps {
    children?: React.ReactNode;
}

export function AuthPage({ children }: AuthPageProps) {
    return (
        <main className="relative min-h-screen bg-black text-white overflow-hidden">
            {/* Gradient Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 grid lg:grid-cols-2 min-h-screen">
                {/* Left Side - Branding */}
                <div className="hidden lg:flex flex-col justify-between p-12 border-r border-zinc-800/50">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500">
                            <TrendingUp className="size-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight group-hover:text-emerald-400 transition-colors">
                            Portfolio Buzz
                        </span>
                    </Link>

                    {/* Features */}
                    <div className="space-y-8 max-w-md">
                        <div>
                            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-emerald-200 bg-clip-text text-transparent">
                                Your Portfolio, Supercharged by AI
                            </h2>
                            <p className="text-zinc-400 text-lg leading-relaxed">
                                Real-time sentiment analysis, deep research reports, and risk metrics that matter.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {[
                                {
                                    icon: Brain,
                                    title: 'AI-Powered Insights',
                                    description: 'Advanced models analyze sentiment and news momentum in seconds'
                                },
                                {
                                    icon: BarChart3,
                                    title: 'Risk Metrics',
                                    description: 'Quantify exposure with intelligent risk scores and volatility tracking'
                                },
                                {
                                    icon: TrendingUp,
                                    title: 'Real-Time Alerts',
                                    description: 'Get notified of significant price drops or sentiment shifts instantly'
                                }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.2 }}
                                    className="flex gap-4 items-start group"
                                >
                                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
                                        <feature.icon className="size-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                                        <p className="text-sm text-zinc-500">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-sm text-zinc-600">
                        © 2026 Portfolio Buzz. All rights reserved.
                    </div>
                </div>

                {/* Right Side - Auth Form */}
                <div className="relative flex flex-col justify-center p-8 lg:p-12">
                    <div className="absolute top-6 left-6 lg:left-12">
                        <Button
                            variant="ghost"
                            className="text-zinc-400 hover:text-white"
                            asChild
                        >
                            <Link href="/">
                                <ChevronLeftIcon className='size-4 me-2' />
                                Back to Home
                            </Link>
                        </Button>
                    </div>

                    {/* Mobile Logo */}
                    <Link href="/" className="flex lg:hidden items-center gap-3 mb-8 mt-16 group">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500">
                            <TrendingUp className="size-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight group-hover:text-emerald-400 transition-colors">
                            Portfolio Buzz
                        </span>
                    </Link>

                    <div className="mx-auto w-full max-w-[420px] space-y-6">
                        {/* Content Injected Here */}
                        {children}
                    </div>
                </div>
            </div>
        </main>
    );
}

export const AuthSeparator = () => {
    return (
        <div className="flex w-full items-center justify-center">
            <div className="bg-zinc-800 h-px w-full" />
            <span className="text-zinc-500 px-2 text-xs">OR</span>
            <div className="bg-zinc-800 h-px w-full" />
        </div>
    );
};
