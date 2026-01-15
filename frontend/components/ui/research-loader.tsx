import { useState, useEffect } from 'react';
import { InfinityLoader } from './loader-13';

const loadingMessages = [
    "Initializing deep research engine...",
    "Analyzing financial statements...",
    "Evaluating market sentiment...",
    "Synthesizing AI investment verdict...",
    "Scanning recent developments...",
    "Almost done with the analysis...",
];

export function ResearchLoader() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 2500); // Change message every 2.5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-6 py-20">
            <InfinityLoader
                size={80}
                className="[&>svg>path:last-child]:stroke-blue-500"
            />
            <div className="text-center space-y-2">
                <p className="text-lg font-medium text-white animate-pulse">
                    {loadingMessages[messageIndex]}
                </p>
                <p className="text-sm text-zinc-500">
                    Our AI agents are conducting a comprehensive analysis
                </p>
            </div>
        </div>
    );
}
