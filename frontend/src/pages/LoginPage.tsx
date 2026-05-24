import { Link } from 'react-router-dom'
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react'

export function LoginPage() {
  return (
    <div className="min-h-screen bg-hero bg-grid flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hf-accent to-purple-500 flex items-center justify-center shadow-glow">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-hf-text font-bold text-2xl tracking-tight">HookFlow</span>
        </div>

        {/* Card */}
        <div className="gradient-border rounded-2xl bg-hf-card p-8 shadow-card-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-hf-text mb-1">Welcome back</h1>
            <p className="text-hf-text-sec text-sm">Sign in to your HookFlow account</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); window.location.href = '/dashboard' }}>
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-hf-text-sec mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hf-muted" />
                <input
                  type="email"
                  defaultValue="dev@example.com"
                  placeholder="you@example.com"
                  className="input-base pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-hf-text-sec">Password</label>
                <a href="#" className="text-xs text-hf-accent hover:text-hf-accent-lt transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hf-muted" />
                <input
                  type="password"
                  defaultValue="password"
                  placeholder="••••••••"
                  className="input-base pl-9"
                />
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-hf-border bg-hf-bg accent-hf-accent" defaultChecked />
              <label htmlFor="remember" className="text-sm text-hf-text-sec">Remember me</label>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full py-2.5 text-sm mt-2">
              Sign in <ArrowRight size={15} />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-hf-border" /></div>
            <div className="relative text-center"><span className="px-3 text-xs text-hf-muted bg-hf-card">Demo account pre-filled</span></div>
          </div>

          <p className="text-center text-sm text-hf-text-sec">
            Don't have an account?{' '}
            <Link to="/register" className="text-hf-accent hover:text-hf-accent-lt transition-colors font-medium">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
