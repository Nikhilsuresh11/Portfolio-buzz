import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { saveToken, saveUser, isAuthenticated } from '../../lib/auth'
import { toast } from 'react-toastify'
import { config } from '../../config'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthPage } from '@/components/ui/auth-page'
import { AtSignIcon, Loader2 } from "lucide-react"

export default function Login() {
  const router = useRouter()
  // Default to login, but check query param
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check query param for default mode
  useEffect(() => {
    if (router.query.mode === 'signup') {
      setIsLogin(false);
    } else if (router.query.mode === 'login') {
      setIsLogin(true);
    }

    // Enforce dark mode
    document.documentElement.setAttribute('data-theme', 'dark');
  }, [router.query.mode]);

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
      const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
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
    <AuthPage>
      <div className="flex flex-col space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-wide text-white">
          {isLogin ? 'Sign In or Join Now!' : 'Create an Account'}
        </h1>
        <p className="text-gray-400 text-base">
          {isLogin ? 'Login or create your Portfolio Buzz account.' : 'Enter your details to get started.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <p className="text-gray-400 text-start text-xs">
          Enter your email address to {isLogin ? 'sign in' : 'create an account'}
        </p>

        <div className="space-y-3">
          <div className="relative h-max">
            <Input
              placeholder="your.email@example.com"
              className="peer ps-9 bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-blue-500/50"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <AtSignIcon className="size-4" aria-hidden="true" />
            </div>
          </div>

          <div className="relative h-max">
            <Input
              placeholder="Password"
              className="peer ps-9 bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-blue-500/50"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
          </div>

          {!isLogin && (
            <div className="relative h-max">
              <Input
                placeholder="Confirm Password"
                className="peer ps-9 bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-blue-500/50"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
              <div className="text-gray-400 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLogin ? 'Continue' : 'Create Account'}
        </Button>
      </form>

      <p className="text-gray-400 mt-8 text-sm text-center">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={toggleMode}
          className="hover:text-blue-300 text-blue-400 underline underline-offset-4 cursor-pointer"
          disabled={loading}
        >
          {isLogin ? 'Sign up' : 'Log in'}
        </button>
      </p>

      <p className="text-gray-500 mt-4 text-xs text-center">
        By clicking continue, you agree to our{' '}
        <a
          href="#"
          className="hover:text-white underline underline-offset-4"
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          href="#"
          className="hover:text-white underline underline-offset-4"
        >
          Privacy Policy
        </a>
        .
      </p>
    </AuthPage>
  )
}
