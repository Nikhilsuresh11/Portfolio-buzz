"use client";

import React, { useState, useMemo } from "react";
import {
    LayoutDashboard,
    FolderOpen,
    Settings,
    UserCircle,
    PieChart,
    FileText,
    TrendingUp,
    Search as SearchIcon,
    Bell,
    Briefcase,
    BrainCircuit,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Menu
} from "lucide-react";
import { useRouter } from 'next/router';
import { cn } from "@/lib/utils";

const softSpringEasing = "cubic-bezier(0.4, 0, 0.2, 1)";


/* ----------------------------- Components ----------------------------- */

function BrandLogo({ isCollapsed }: { isCollapsed: boolean }) {
    return (
        <div className="flex items-center gap-3 px-2">
            <div className="flex items-center justify-center size-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/20 shrink-0">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
            </div>
            <div className={cn(
                "flex flex-col transition-all duration-300 overflow-hidden",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
                <span className="text-white font-bold tracking-tight leading-none text-lg whitespace-nowrap">Portfolio Buzz</span>
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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['holdings']);

    const currentPath = router.pathname;

    const toggleMenu = (id: string) => {
        setExpandedMenus(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSidebarClick = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
        }
    };

    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsCollapsed(!isCollapsed);
    };

    const menuItems = {
        main: [
            {
                id: 'holdings',
                icon: Briefcase,
                label: 'Holdings',
                href: '#',
                subItems: [
                    { id: 'stocks', label: 'Stocks', href: '/positions' },
                    { id: 'mutual-funds', label: 'Mutual Funds', href: '/mf-positions' }
                ]
            },
            { id: 'research', icon: BrainCircuit, label: 'Deep Research', href: '/research' },
            { id: 'portfolios', icon: FolderOpen, label: 'Portfolios', href: '/portfolios' },
            {
                id: 'stocks-menu',
                icon: TrendingUp,
                label: 'Stocks',
                subItems: [
                    { id: 'watchlist', label: 'Watchlist', href: '/watchlist' },
                    { id: 'overview', label: 'Overview', href: '/portfolio' },
                    { id: 'summary', label: 'Summary', href: '/portfolio/summary' },
                    { id: 'metrics', label: 'Risk Metrics', href: '/portfolio/metrics' },
                ]
            },
            {
                id: 'mutual-funds-menu',
                icon: PieChart,
                label: 'Mutual Funds',
                subItems: [
                    { id: 'mf-watchlist', label: 'Watchlist', href: '/mf-watchlist' },
                    { id: 'mf-overview', label: 'Overview', href: '/mf-portfolio' },
                    { id: 'mf-summary', label: 'Summary', href: '/mf-portfolio/summary' },
                    { id: 'mf-metrics', label: 'Risk Metrics', href: '/mf-portfolio/metrics' },
                ]
            }
        ],
        bottom: [
            { id: 'notifications', icon: Bell, label: 'Notifications', href: '/notifications' },
            { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
        ]
    };

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    return (
        <aside
            onClick={handleSidebarClick}
            className={cn(
                "h-screen flex flex-col bg-black border-r border-white/5 transition-all duration-300 z-[100] relative overflow-hidden",
                isCollapsed ? "w-20 cursor-pointer hover:bg-zinc-900/50" : "w-[240px]"
            )}
            style={{ transitionTimingFunction: softSpringEasing }}
        >
            {/* Ambient background effects inside sidebar */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none z-0" />

            {/* Header / Brand */}
            <div className="p-4 mb-2 z-10 shrink-0">
                <BrandLogo isCollapsed={isCollapsed} />
            </div>

            {/* Search Trigger & Toggle */}
            <div className="px-3 mb-4 z-10 flex items-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSearchClick?.();
                    }}
                    className={cn(
                        "flex-1 flex items-center h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] text-neutral-500 transition-all hover:bg-white/[0.06] hover:border-white/10 group/search",
                        isCollapsed ? "justify-center px-0 w-10 shrink-0" : "px-3"
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

                <button
                    onClick={handleToggleClick}
                    className="flex items-center justify-center size-8 text-neutral-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    <div className={cn("transition-transform duration-300", isCollapsed ? "rotate-180" : "rotate-0")}>
                        <ChevronsLeft size={16} />
                    </div>
                </button>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-4 z-10">
                {/* Main Overview */}
                <div>
                    <div className={cn(
                        "px-3 mb-2 text-[9px] font-bold text-neutral-600 uppercase tracking-[0.2em] transition-all duration-300 h-3 overflow-hidden",
                        isCollapsed ? "opacity-0" : "opacity-100"
                    )}>
                        Markets
                    </div>
                    <div className="space-y-1">
                        {menuItems.main.map((item) => {
                            if (item.subItems) {
                                const isExpanded = expandedMenus.includes(item.id);
                                const isParentActive = item.subItems.some(sub => currentPath === sub.href);

                                return (
                                    <div key={item.id} className="space-y-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                !isCollapsed && toggleMenu(item.id);
                                            }}
                                            className={cn(
                                                "group relative flex items-center w-full h-12 rounded-xl transition-all duration-300",
                                                isParentActive && !isExpanded
                                                    ? "bg-white/10 text-white"
                                                    : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5",
                                                isCollapsed ? "px-3 justify-center" : "px-4"
                                            )}
                                        >
                                            <div className={cn(
                                                "transition-transform duration-300 shrink-0",
                                                (isParentActive && !isExpanded) ? "scale-110 text-blue-400" : "group-hover:scale-110",
                                                isCollapsed ? "" : "mr-3"
                                            )}>
                                                <item.icon size={20} />
                                            </div>

                                            <span className={cn(
                                                "flex-1 text-left text-sm font-medium tracking-wide truncate transition-all duration-300 overflow-hidden",
                                                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                                            )}>
                                                {item.label}
                                            </span>

                                            {!isCollapsed && (
                                                <div className={cn(
                                                    "transition-transform duration-300",
                                                    isExpanded ? "rotate-90" : "rotate-0"
                                                )}>
                                                    <ChevronRight size={12} className="text-neutral-500" />
                                                </div>
                                            )}

                                            {isCollapsed && (
                                                <div className="absolute left-16 px-3 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[110]">
                                                    {item.label}
                                                </div>
                                            )}
                                        </button>

                                        {/* Dropdown Items */}
                                        <div className={cn(
                                            "overflow-hidden transition-all duration-300 ease-in-out",
                                            isExpanded && !isCollapsed ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                                        )}>
                                            <div className="pl-11 pr-2 space-y-1 py-1">
                                                {item.subItems.map((subItem) => (
                                                    <button
                                                        key={subItem.id || subItem.label}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleNavigate(subItem.href);
                                                        }}
                                                        className={cn(
                                                            "flex items-center w-full h-9 rounded-lg transition-colors text-sm",
                                                            currentPath === subItem.href
                                                                ? "text-blue-400 bg-blue-500/10 font-medium px-3"
                                                                : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5 px-3"
                                                        )}
                                                    >
                                                        {subItem.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <NavItem
                                    key={item.id}
                                    icon={item.icon}
                                    label={item.label}
                                    isActive={currentPath === item.href}
                                    onClick={() => handleNavigate(item.href)}
                                    isCollapsed={isCollapsed}
                                />
                            );
                        })}
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
            </div>
        </aside>
    );
}
