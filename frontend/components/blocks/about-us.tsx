import React from 'react';
import Image from 'next/image';

export function AboutUs() {
    return (
        <section id="about" className="py-32 bg-black text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                    <div className="space-y-8 flex-1">
                        <div>
                            <h2 className="text-zinc-500 text-sm font-medium mb-12 uppercase tracking-tight">About Portfolio Buzz</h2>
                            <h3 className="text-5xl md:text-6xl font-light leading-tight">
                                Driven by expertise <br />
                                <span className="font-medium">United by the same purpose</span>
                            </h3>
                        </div>
                        <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
                            Portfolio Buzz is a specialized financial technology platform built by engineers who believe in the power of data-driven investing. Founded by industry professionals, we combine deep AI research with robust backend systems to address unique market challenges and drive smarter decisions.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-8 lg:gap-12 shrink-0">
                        <div className="relative group">
                            <div className="w-[220px] h-[300px] relative overflow-hidden bg-zinc-900">
                                <Image
                                    src="/images/sankar.png"
                                    alt="Sankar"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            <div className="mt-4">
                                <h4 className="text-lg font-medium">Sankar</h4>
                                <p className="text-zinc-500 text-sm">AI Engineer</p>
                                <a href="mailto:sankarkarthikeyan066@gmail.com" className="text-zinc-600 text-xs mt-1 lowercase block hover:text-zinc-400 transition-colors">sankarkarthikeyan066@gmail.com</a>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="w-[220px] h-[300px] relative overflow-hidden bg-zinc-900">
                                <Image
                                    src="/images/nikhil.png"
                                    alt="Nikhil"
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            <div className="mt-4">
                                <h4 className="text-lg font-medium">Nikhil</h4>
                                <p className="text-zinc-500 text-sm">Backend Engineer</p>
                                <a href="mailto:nikhilram1010@gmail.com" className="text-zinc-600 text-xs mt-1 lowercase block hover:text-zinc-400 transition-colors">nikhilram1010@gmail.com</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
