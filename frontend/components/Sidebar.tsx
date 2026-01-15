"use client";

import React, { useState, useMemo } from "react";
import {
    Dashboard,
    Folder,
    Settings as SettingsIcon,
    User as UserIcon,
    ChartBar,
    Report,
    Analytics,
    Search as SearchIcon,
    Notification as NotificationIcon,
    Portfolio as PortfolioIcon,
    Logout,
} from "@carbon/icons-react";
import { useRouter } from 'next/router';
import { logout } from '@/lib/auth';
import { cn } from "@/lib/utils";

const softSpringEasing = "cubic-bezier(0.4, 0, 0.2, 1)";

/* ----------------------------- Components ----------------------------- */

function BrandLogo({ isCollapsed }: { isCollapsed: boolean }) {
    return (
        <div className="flex items-center gap-3 px-2">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 shadow-lg shadow-blue-500/20 shrink-0">
                <div className="text-white font-black text-xl italic tracking-tighter">B</div>
            </div>
            <div className={cn(
                "flex flex-col transition-all duration-300 overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
                <span className="text-white font-bold tracking-tight leading-none text-lg whitespace-nowrap">Portfolio</span>
                <span className="text-blue-500 font-bold tracking-widest text-[10px] uppercase whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Buzz</span>
            </div>
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
            className={cn(
                "group relative flex items-center w-full h-12 rounded-xl transition-all duration-300",
                isActive
                    ? "bg-white/10 text-white"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5",
                isCollapsed ? "px-3 justify-center" : "px-4"
            )}
        >
            <div className={cn(
                "transition-transform duration-300 shrink-0",
                isActive ? "scale-110 text-blue-400" : "group-hover:scale-110",
                isCollapsed ? "" : "mr-3"
            )}>
                <Icon size={20} />
            </div>

            <span className={cn(
                "text-sm font-medium tracking-wide truncate transition-all duration-300 overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
                {label}
            </span>

            {isActive && (
                <div className="absolute left-0 w-1.5 h-6 bg-gradient-to-b from-blue-500 to-emerald-500 rounded-r-full" />
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
                <div className="absolute left-16 px-3 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[110]">
                    {label}
                </div>
            )}
        </button>
    );
}

/* ------------------------------- Main Sidebar ------------------------------ */

export default function Sidebar({ onSearchClick }: { onSearchClick?: () => void }) {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const isCollapsed = !isHovered;

    const currentPath = router.pathname;

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
        bottom: [
            { id: 'notifications', icon: NotificationIcon, label: 'Notifications', href: '/notifications' },
            { id: 'settings', icon: SettingsIcon, label: 'Settings', href: '/settings' },
        ]
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "h-screen flex flex-col bg-black border-r border-white/5 transition-all duration-300 z-[100] relative overflow-hidden",
                isHovered ? "w-[240px]" : "w-20"
            )}
            style={{ transitionTimingFunction: softSpringEasing }}
        >
            {/* Ambient background effects inside sidebar */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none z-0" />

            {/* Header / Brand */}
            <div className="p-4 mb-2 z-10">
                <BrandLogo isCollapsed={isCollapsed} />
            </div>

            {/* Search Trigger */}
            <div className="px-3 mb-4 z-10">
                <button
                    onClick={onSearchClick}
                    className={cn(
                        "flex items-center w-full h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] text-neutral-500 transition-all hover:bg-white/[0.06] hover:border-white/10 group/search",
                        isCollapsed ? "justify-center px-0" : "px-3"
                    )}
                >
                    <SearchIcon size={18} className="shrink-0 transition-colors group-hover/search:text-blue-400" />
                    <span className={cn(
                        "ml-3 text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap",
                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}>
                        Search...
                    </span>
                    {!isCollapsed && <span className="ml-auto text-[10px] opacity-40 uppercase tracking-tighter">⌘K</span>}
                </button>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 overflow-hidden px-3 space-y-4 z-10">
                {/* Main Overview */}
                <div>
                    <div className={cn(
                        "px-3 mb-2 text-[9px] font-bold text-neutral-600 uppercase tracking-[0.2em] transition-all duration-300 h-3 overflow-hidden",
                        isCollapsed ? "opacity-0" : "opacity-100"
                    )}>
                        Market
                    </div>
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
                    <div className={cn(
                        "px-3 mb-2 text-[9px] font-bold text-neutral-600 uppercase tracking-[0.2em] transition-all duration-300 h-3 overflow-hidden",
                        isCollapsed ? "opacity-0" : "opacity-100"
                    )}>
                        Portfolio
                    </div>
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
            <div className="p-3 space-y-1 border-t border-white/5 z-10">
                {menuItems.bottom.map((item) => (
                    <NavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={currentPath === item.href}
                        onClick={() => handleNavigate(item.href)}
                        isCollapsed={isCollapsed}
                    />
                ))}

                <button
                    onClick={handleLogout}
                    className={cn(
                        "group relative flex items-center w-full h-10 rounded-xl transition-all duration-300 text-red-500/60 hover:text-red-400 hover:bg-red-500/10",
                        isCollapsed ? "px-3 justify-center" : "px-3"
                    )}
                >
                    <Logout size={20} className="shrink-0" />
                    <span className={cn(
                        "ml-3 text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap",
                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}>
                        Log Out
                    </span>
                    {isCollapsed && (
                        <div className="absolute left-16 px-3 py-2 bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[110]">
                            Log Out
                        </div>
                    )}
                </button>

                <div className={cn(
                    "flex items-center h-10 rounded-xl bg-white/[0.02] transition-all duration-300 overflow-hidden border border-white/5",
                    isCollapsed ? "px-2 justify-center" : "px-2 mt-2"
                )}>
                    <div className="size-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-white/10">
                        <UserIcon size={14} className="text-zinc-400" />
                    </div>
                    <div className={cn(
                        "ml-2.5 flex flex-col min-w-0 transition-all duration-300",
                        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}>
                        <span className="text-[11px] font-bold text-white truncate leading-tight whitespace-nowrap">Premium User</span>
                        <span className="text-[8px] text-zinc-500 uppercase font-black leading-tight whitespace-nowrap tracking-tighter">
                            Pro Plan Active
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

