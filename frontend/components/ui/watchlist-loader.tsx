import { useState, useEffect } from 'react';
import { InfinityLoader } from './loader-13';

const loadingMessages = [
    "Getting your watchlist ready...",
    "Your watchlist looks amazing!",
    "Fetching real-time data...",
    "Almost there...",
    "Loading market insights...",
];

export function WatchlistLoader() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 2000); // Change message every 2 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-6">
            <InfinityLoader
                size={80}
                className="[&>svg>path:last-child]:stroke-blue-500"
            />
            <div className="text-center space-y-2">
                <p className="text-lg font-medium text-white animate-pulse">
                    {loadingMessages[messageIndex]}
                </p>
                <p className="text-sm text-zinc-500">
                    Please wait while we prepare your data
                </p>
            </div>
        </div>
    );
}
