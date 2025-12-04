import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function Settings() {
    const router = useRouter()
    const [user, setUser] = useState<string | null>(null)
    const [theme, setTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        const u = localStorage.getItem('pb_user')
        setUser(u)

        // Load theme preference, default to dark
        const savedTheme = localStorage.getItem('pb_theme') as 'light' | 'dark' | null
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.setAttribute('data-theme', savedTheme)
        } else {
            // Default to dark mode
            setTheme('dark')
            localStorage.setItem('pb_theme', 'dark')
            document.documentElement.setAttribute('data-theme', 'dark')
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('pb_theme', newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
    }

    return (
        <div className="app-root">
            <Sidebar />
            <main className="main-col">
                <Header user={user} />

                <div style={{ maxWidth: 800 }}>
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h2 style={{ margin: 0, marginBottom: 8, fontSize: 28, fontWeight: 700 }}>Settings</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                            Manage your preferences and account settings
                        </p>
                    </div>

                    {/* Appearance Section */}
                    <div className="card">
                        <h3 style={{ margin: 0, marginBottom: 20, fontSize: 20, fontWeight: 600 }}>Appearance</h3>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                                Theme
                            </label>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => {
                                        setTheme('light')
                                        localStorage.setItem('pb_theme', 'light')
                                        document.documentElement.setAttribute('data-theme', 'light')
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '16px 20px',
                                        borderRadius: 12,
                                        border: theme === 'light' ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                                        background: theme === 'light' ? 'rgba(248, 250, 252, 0.08)' : 'var(--bg-primary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="5" fill={theme === 'light' ? '#f8fafc' : '#94a3b8'} />
                                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={theme === 'light' ? '#f8fafc' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>Light</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setTheme('dark')
                                        localStorage.setItem('pb_theme', 'dark')
                                        document.documentElement.setAttribute('data-theme', 'dark')
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '16px 20px',
                                        borderRadius: 12,
                                        border: theme === 'dark' ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                                        background: theme === 'dark' ? 'rgba(248, 250, 252, 0.08)' : 'var(--bg-primary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={theme === 'dark' ? '#f8fafc' : '#94a3b8'} stroke={theme === 'dark' ? '#f8fafc' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>Dark</span>
                                </button>
                            </div>
                        </div>

                        <div style={{
                            padding: 16,
                            borderRadius: 10,
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="var(--accent-primary)" strokeWidth="2" />
                                <path d="M12 16v-4M12 8h.01" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Theme preference is saved locally and will persist across sessions
                            </p>
                        </div>
                    </div>

                    {/* Account Section */}
                    <div className="card" style={{ marginTop: 24, padding: 28 }}>
                        <h3 style={{ margin: 0, marginBottom: 20, fontSize: 20, fontWeight: 600 }}>Account</h3>

                        <div style={{
                            padding: 20,
                            borderRadius: 12,
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Logout</h4>
                                <p style={{ margin: 0, marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    Sign out of your account
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('pb_user')
                                    router.push('/auth/login')
                                }}
                                style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: 10,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
