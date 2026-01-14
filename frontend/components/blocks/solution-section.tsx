import React from 'react';
import { Shield, Target, TrendingUp, Brain } from 'lucide-react';

export function SolutionSection() {
    return (
        <section id="solution" className="py-24 bg-black relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-semibold tracking-widest text-emerald-500 uppercase mb-3">Solution</h2>
                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">What We Solve</h3>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                        Retail investing is noisy. Portfolio Buzz cuts through the static with institutional-grade tools reorganized for the modern investor.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        {
                            title: 'Information Overload',
                            description: 'We summarize thousands of news articles into 3 key takeaways using AI sentiment models.',
                            icon: Brain,
                            color: 'text-blue-500'
                        },
                        {
                            title: 'Hidden Risks',
                            description: 'Identify correlation risks and volatility spikes before they impact your capital.',
                            icon: Shield,
                            color: 'text-emerald-500'
                        },
                        {
                            title: 'Emotional Bias',
                            description: 'Objective, data-driven insights help you stick to your strategy during market turbulence.',
                            icon: Target,
                            color: 'text-purple-500'
                        },
                        {
                            title: 'Opportunity Lag',
                            description: 'Real-time alerts on significant price drops or sentiment shifts in your watchlist.',
                            icon: TrendingUp,
                            color: 'text-orange-500'
                        }
                    ].map((item, i) => (
                        <div key={i} className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors group">
                            <item.icon className={`size-10 mb-6 ${item.color} group-hover:scale-110 transition-transform`} />
                            <h4 className="text-xl font-semibold text-white mb-4">{item.title}</h4>
                            <p className="text-zinc-400 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
