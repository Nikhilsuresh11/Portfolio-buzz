import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { isAuthenticated } from '../lib/auth'

export default function LandingPage() {
    const router = useRouter()
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        setIsLoggedIn(isAuthenticated())

        // Dark theme by default for landing
        document.documentElement.setAttribute('data-theme', 'dark')
    }, [])

    return (
        <div className="landing-root">
            <nav className="nav">
                <div className="logo">Portfolio Buzz</div>
                <div className="nav-links">
                    {isLoggedIn ? (
                        <Link href="/watchlist" className="btn-primary">
                            Go to Watchlist
                        </Link>
                    ) : (
                        <>
                            <Link href="/auth/login" className="btn-ghost">
                                Login
                            </Link>
                            <Link href="/auth/login" className="btn-primary">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            <main className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Smarter Portfolio Tracking with <span className="gradient-text">AI Insights</span>
                    </h1>
                    <p className="hero-subtitle">
                        Track your stocks, get real-time news, and leverage AI to make better investment decisions. All in one beautiful dashboard.
                    </p>
                    <div className="cta-group">
                        <Link href={isLoggedIn ? "/watchlist" : "/auth/login"} className="btn-lg btn-primary">
                            {isLoggedIn ? "View Dashboard" : "Start Tracking Now"}
                        </Link>
                        <a href="#features" className="btn-lg btn-secondary">
                            Learn More
                        </a>
                    </div>
                </div>

                <div className="hero-image">
                    {/* Placeholder for dashboard screenshot */}
                    <div className="dashboard-preview">
                        <div className="preview-header">
                            <div className="dot red"></div>
                            <div className="dot yellow"></div>
                            <div className="dot green"></div>
                        </div>
                        <div className="preview-content">
                            <div className="preview-sidebar"></div>
                            <div className="preview-main">
                                <div className="skeleton-row"></div>
                                <div className="skeleton-row"></div>
                                <div className="skeleton-row"></div>
                                <div className="skeleton-graph"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .landing-root {
                    min-height: 100vh;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-family: 'Inter', sans-serif;
                }

                .nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 24px 48px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .logo {
                    font-size: 24px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .nav-links {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .hero {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 80px 24px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 48px;
                    align-items: center;
                }

                .hero-title {
                    font-size: 56px;
                    line-height: 1.1;
                    font-weight: 800;
                    margin-bottom: 24px;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .hero-subtitle {
                    font-size: 20px;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 40px;
                    max-width: 500px;
                }

                .cta-group {
                    display: flex;
                    gap: 16px;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 99px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: transform 0.2s;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .btn-ghost {
                    color: var(--text-primary);
                    padding: 12px 24px;
                    font-weight: 600;
                    text-decoration: none;
                }

                .btn-lg {
                    padding: 16px 32px;
                    font-size: 18px;
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-primary);
                    padding: 12px 24px;
                    border-radius: 99px;
                    font-weight: 600;
                    text-decoration: none;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: background 0.2s;
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .dashboard-preview {
                    background: #1a1f2e;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                    aspect-ratio: 16/10;
                    position: relative;
                }

                .preview-header {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 12px;
                    display: flex;
                    gap: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .red { background: #ef4444; }
                .yellow { background: #eab308; }
                .green { background: #22c55e; }

                .preview-content {
                    display: flex;
                    height: 100%;
                }

                .preview-sidebar {
                    width: 60px;
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                }

                .preview-main {
                    flex: 1;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .skeleton-row {
                    height: 48px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                }

                .skeleton-graph {
                    flex: 1;
                    background: linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0) 100%);
                    border-top: 2px solid #3b82f6;
                    border-radius: 0 0 8px 8px;
                    max-height: 200px;
                }

                @media (max-width: 768px) {
                    .hero {
                        grid-template-columns: 1fr;
                        text-align: center;
                        gap: 32px;
                    }
                    
                    .hero-title {
                        font-size: 40px;
                    }
                    
                    .nav {
                        padding: 16px 24px;
                    }
                    
                    .cta-group {
                        justify-content: center;
                    }

                    .hero-image {
                        order: -1;
                    }
                    
                    .hero-subtitle {
                        margin-left: auto;
                        margin-right: auto;
                    }
                }
            `}</style>
        </div>
    )
}
