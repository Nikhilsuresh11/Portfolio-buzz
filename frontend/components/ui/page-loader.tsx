import { useState, useEffect } from 'react';
import { InfinityLoader } from './loader-13';

interface PageLoaderProps {
    messages?: string[];
    subtitle?: string;
}

const defaultMessages = [
    "Loading your data...",
    "Almost there...",
    "Preparing your view...",
    "Just a moment...",
];

export function PageLoader({
    messages = defaultMessages,
    subtitle = "Please wait while we prepare your data"
}: PageLoaderProps) {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2000); // Change message every 2 seconds

        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <div className="flex flex-col items-center justify-center gap-6">
            <InfinityLoader
                size={80}
                className="[&>svg>path:last-child]:stroke-blue-500"
            />
            <div className="text-center space-y-2">
                <p className="text-lg font-medium text-white animate-pulse">
                    {messages[messageIndex]}
                </p>
                <p className="text-sm text-zinc-500">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}
