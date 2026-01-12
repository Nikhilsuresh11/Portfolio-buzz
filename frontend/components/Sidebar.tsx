"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Dashboard,
    Folder,
    Settings as SettingsIcon,
    User as UserIcon,
    ChevronDown as ChevronDownIcon,
    ChartBar,
    Report,
    Analytics,
    Search as SearchIcon,
    Notification,
    Portfolio as PortfolioIcon,
    Filter,
} from "@carbon/icons-react";
import Link from 'next/link';
import { useRouter } from 'next/router';

const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

/* ----------------------------- Components ----------------------------- */

function BrandLogo() {
    return (
        <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-900/20">
            <div className="text-white font-black text-xl italic tracking-tighter">B</div>
        </div>
    );
}

function NavItem({
    icon: Icon,
    label,
    isActive,
    onClick,
    isCollapsed = false
}: {
    icon: any,
    label: string,
    isActive: boolean,
    onClick: () => void,
    isCollapsed?: boolean
}) {
    return (
        <button
            onClick={onClick}
            className={`
                group relative flex items-center gap-3 w-full h-11 px-3 rounded-xl transition-all duration-300
                ${isActive
                    ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"}
            `}
        >
            <div className={`p-1 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                <Icon size={20} />
            </div>

            {!isCollapsed && (
                <span className="text-sm font-medium tracking-wide truncate">
                    {label}
                </span>
            )}

            {isActive && (
                <div className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full" />
            )}
        </button>
    );
}

/* ------------------------------- Main Sidebar ------------------------------ */

export default function Sidebar({ onSearchClick }: { onSearchClick?: () => void }) {
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Determine active route
    const currentPath = router.pathname;
    const activeSection = useMemo(() => {
        if (currentPath.startsWith('/portfolio') || currentPath.startsWith('/positions')) return 'portfolio';
        if (currentPath.startsWith('/research')) return 'research';
        if (currentPath.startsWith('/watchlist')) return 'watchlist';
        if (currentPath.startsWith('/settings')) return 'settings';
        return 'dashboard';
    }, [currentPath]);

    const menuItems = {
        main: [
            { id: 'watchlist', icon: Dashboard, label: 'Watchlist', href: '/watchlist' },
            { id: 'research', icon: Report, label: 'Deep Research', href: '/research' },
        ],
        portfolio: [
            { id: 'overview', icon: Folder, label: 'Overview', href: '/portfolio' },
            { id: 'summary', icon: ChartBar, label: 'Summary', href: '/portfolio/summary' },
            { id: 'metrics', icon: Analytics, label: 'Risk Metrics', href: '/portfolio/metrics' },
            { id: 'positions', icon: PortfolioIcon, label: 'My Positions', href: '/positions' },
        ],
    };

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    return (
        <aside
            className={`
                h-screen flex flex-col bg-[#09090B] border-r border-white/5 transition-all duration-500 z-[100]
                ${isCollapsed ? "w-20" : "w-64"}
            `}
            style={{ transitionTimingFunction: softSpringEasing }}
        >
            {/* Header / Brand */}
            <div className="p-6 flex items-center gap-3">
                <BrandLogo />
                {!isCollapsed && (
                    <div className="flex flex-col">
                        <span className="text-white font-bold tracking-tight leading-none text-lg">Portfolio</span>
                        <span className="text-blue-500 font-bold tracking-widest text-[10px] uppercase">Buzz</span>
                    </div>
                )}
            </div>

            {/* Search Trigger */}
            <div className="px-4 mb-6">
                <button
                    onClick={onSearchClick}
                    className={`
                        flex items-center gap-3 w-full h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] 
                        text-neutral-500 transition-all hover:bg-white/[0.06] hover:border-white/10
                        ${isCollapsed ? "justify-center px-0" : "px-3"}
                    `}
                >
                    <SearchIcon size={18} />
                    {!isCollapsed && <span className="text-xs font-medium">Search Stocks...</span>}
                    {!isCollapsed && <span className="ml-auto text-[10px] opacity-40">⌘K</span>}
                </button>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 overflow-y-auto px-3 space-y-8 custom-scrollbar">
                {/* Main Overview */}
                <div>
                    {!isCollapsed && (
                        <div className="px-3 mb-3 text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">
                            Market Overview
                        </div>
                    )}
                    <div className="space-y-1">
                        {menuItems.main.map((item) => (
                            <NavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={currentPath === item.href}
                                onClick={() => handleNavigate(item.href)}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </div>
                </div>

                {/* Portfolio Management */}
                <div>
                    {!isCollapsed && (
                        <div className="px-3 mb-3 text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">
                            Portfolios
                        </div>
                    )}
                    <div className="space-y-1">
                        {menuItems.portfolio.map((item) => (
                            <NavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={currentPath === item.href}
                                onClick={() => handleNavigate(item.href)}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="p-4 space-y-2 border-t border-white/5 bg-black/20">
                <NavItem
                    icon={SettingsIcon}
                    label="Settings"
                    isActive={currentPath === '/settings'}
                    onClick={() => handleNavigate('/settings')}
                    isCollapsed={isCollapsed}
                />

                <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] ${isCollapsed ? "justify-center" : "px-3"}`}>
                    <div className="size-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 border border-white/5">
                        <UserIcon size={16} className="text-neutral-400" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">Premium User</span>
                            <span className="text-[10px] text-neutral-500 uppercase font-black">Pro Plan</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex justify-center p-2 text-neutral-600 hover:text-white transition-colors"
                >
                    <ChevronDownIcon size={20} className={`transform transition-transform duration-500 ${isCollapsed ? "-rotate-90" : "rotate-90"}`} />
                </button>
            </div>
        </aside>
    );
}

