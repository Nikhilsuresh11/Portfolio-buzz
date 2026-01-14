import React from 'react';
import Image from 'next/image';

export function AboutUs() {
    return (
        <section id="about" className="py-32 bg-black text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-zinc-500 text-sm font-medium mb-12 uppercase tracking-tight">About Portfolio Buzz</h2>
                            <h3 className="text-5xl md:text-7xl font-light leading-tight">
                                Driven by expertise <br />
                                <span className="font-medium">United by the same purpose</span>
                            </h3>
                        </div>
                        <p className="text-zinc-400 text-xl leading-relaxed max-w-xl">
                            Portfolio Buzz is a specialized financial technology platform built by engineers who believe in the power of data-driven investing. Founded by industry professionals, we combine deep AI research with robust backend systems to address unique market challenges and drive smarter decisions.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="flex flex-col items-center lg:items-end">
                            <div className="relative group">
                                <div className="w-[250px] h-[350px] md:w-[380px] md:h-[520px] relative overflow-hidden bg-zinc-900">
                                    <Image
                                        src="/images/sankar.png"
                                        alt="Sankar"
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                                <div className="mt-6 text-left">
                                    <h4 className="text-lg font-medium">Sankar</h4>
                                    <p className="text-zinc-500 text-sm">AI Engineer</p>
                                    <p className="text-zinc-600 text-xs mt-1 lowercase">sankarkarthikeyan066@gmail.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-32 lg:-mt-24 flex justify-center lg:justify-start lg:ml-24">
                    <div className="relative group">
                        <div className="w-[250px] h-[350px] md:w-[380px] md:h-[520px] relative overflow-hidden bg-zinc-900">
                            <Image
                                src="/images/nikhil.png"
                                alt="Nikhil"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        <div className="mt-6">
                            <h4 className="text-lg font-medium">Nikhil</h4>
                            <p className="text-zinc-500 text-sm">Backend Engineer</p>
                            <p className="text-zinc-600 text-xs mt-1 lowercase">nikhilram11@gmail.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
