import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { saveToken, saveUser, isAuthenticated } from '../../lib/auth'
import { toast } from 'react-toastify'

export default function Login() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/watchlist')
    }
  }, [router])

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup'
      const response = await fetch(`https://portfolio-buzz.onrender.com${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // Save token and user data
        saveToken(data.data.token)
        saveUser(data.data.user)

        toast.success(isLogin ? 'Login successful!' : 'Account created successfully!')

        // Redirect to home page
        router.push('/watchlist')
      } else {
        setError(data.error || 'Authentication failed')
        toast.error(data.error || 'Authentication failed')
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Network error. Please try again.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="auth-container">
      {/* Left Side - Testimonial/Branding */}
      <div className="auth-left">
        <div className="auth-brand">
          <h1 className="brand-name">Portfolio Buzz</h1>
        </div>

        <div className="testimonial">
          <blockquote className="testimonial-quote">
            "Your watchlist, enriched with live news and AI-generated insights."
          </blockquote>
          {/* <div className="testimonial-author">
            <div className="author-avatar">PB</div>
            <div className="author-info">
              <div className="author-name">Ali Hassan</div>
              <div className="author-role">Portfolio Manager</div>
            </div>
          </div> */}
        </div>

        <div className="auth-decorations">
          <div className="decoration-circle decoration-1"></div>
          <div className="decoration-circle decoration-2"></div>
          <div className="decoration-circle decoration-3"></div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-header">
            <button className="back-button" onClick={() => router.push('/')}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              Home
            </button>
          </div>

          <div className="auth-form-content">
            <h2 className="auth-title">
              {isLogin ? 'Sign In or Join Now!' : 'Create Your Account'}
            </h2>
            <p className="auth-subtitle">
              {isLogin
                ? 'Login or create your portfolio buzz account.'
                : 'Join us to start managing your portfolio.'}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 6L10 11L17 6M3 6V14C3 14.5523 3.44772 15 4 15H16C16.5523 15 17 14.5523 17 14V6M3 6C3 5.44772 3.44772 5 4 5H16C16.5523 5 17 5.44772 17 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    className="auth-input"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10V7C5 4.79086 6.79086 3 9 3H11C13.2091 3 15 4.79086 15 7V10M4 10H16C16.5523 10 17 10.4477 17 11V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V11C3 10.4477 3.44772 10 4 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3 3L17 17M10 7C11.6569 7 13 8.34315 13 10C13 10.3506 12.9448 10.6872 12.8433 11M7.36364 7.36364C7.13333 7.88889 7 8.47407 7 9C7 10.6569 8.34315 12 10 12C10.5259 12 11.1111 11.8667 11.6364 11.6364M7.36364 7.36364L11.6364 11.6364M7.36364 7.36364L4 4M11.6364 11.6364L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7ZM10 7V4M10 13V16M17 10C17 10 14.5 14 10 14C5.5 14 3 10 3 10C3 10 5.5 6 10 6C14.5 6 17 10 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M5 10V7C5 4.79086 6.79086 3 9 3H11C13.2091 3 15 4.79086 15 7V10M4 10H16C16.5523 10 17 10.4477 17 11V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V11C3 10.4477 3.44772 10 4 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM9 12H7V10H9V12ZM9 9H7V4H9V9Z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              <p className="auth-footer">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  className="toggle-link"
                  onClick={toggleMode}
                  disabled={loading}
                >
                  {isLogin ? 'Create account' : 'Sign in'}
                </button>
              </p>

              <p className="terms-text">
                By clicking continue, you agree to our{' '}
                <a href="#" className="terms-link">Terms of Service</a> and{' '}
                <a href="#" className="terms-link">Privacy Policy</a>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
