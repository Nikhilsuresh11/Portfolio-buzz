import React, { useState } from 'react';
import { PricingCard } from "@/components/ui/dark-gradient-pricing"
import { GoogleSignInModal } from "@/components/GoogleSignInModal"

export function PricingSection() {
    const [showSignInModal, setShowSignInModal] = useState(false);
    return (
        <section id="pricing" className="relative overflow-hidden bg-black text-foreground">
            <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 md:px-8">
                <div className="mb-12 space-y-3">
                    <h2 className="text-center text-3xl font-semibold leading-tight sm:text-4xl sm:leading-tight md:text-5xl md:leading-tight">
                        Pricing
                    </h2>
                    <p className="text-center text-base text-muted-foreground md:text-lg">
                        Start free and scale as your portfolio grows.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <PricingCard
                        tier="Free"
                        price="$0/mo"
                        bestFor="Perfect for getting started"
                        CTA="Get started free"
                        onCTAClick={() => setShowSignInModal(true)}
                        benefits={[
                            { text: "Track up to 10 stocks", checked: true },
                            { text: "Basic AI insights", checked: true },
                            { text: "Daily news summaries", checked: true },
                            { text: "Email alerts", checked: false },
                            { text: "Advanced risk metrics", checked: false },
                            { text: "Priority support", checked: false },
                        ]}
                    />
                    <PricingCard
                        tier="Pro"
                        price="$19/mo"
                        bestFor="For serious investors"
                        CTA="Start 14-day trial"
                        benefits={[
                            { text: "Track unlimited stocks", checked: true },
                            { text: "Advanced AI analysis", checked: true },
                            { text: "Real-time news alerts", checked: true },
                            { text: "Email & WhatsApp alerts", checked: true },
                            { text: "Advanced risk metrics", checked: true },
                            { text: "Priority support", checked: false },
                        ]}
                    />
                    <PricingCard
                        tier="Enterprise"
                        price="Custom"
                        bestFor="For teams and institutions"
                        CTA="Contact sales"
                        benefits={[
                            { text: "Everything in Pro", checked: true },
                            { text: "Custom integrations", checked: true },
                            { text: "Dedicated support", checked: true },
                            { text: "Team collaboration", checked: true },
                            { text: "API access", checked: true },
                            { text: "SLA guarantee", checked: true },
                        ]}
                    />
                </div>
            </div>
            <GoogleSignInModal
                open={showSignInModal}
                onClose={() => setShowSignInModal(false)}
            />
        </section>
    )
}
