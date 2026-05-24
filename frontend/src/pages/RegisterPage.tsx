import { Link } from 'react-router-dom'
import { Zap, User, Mail, Lock, ArrowRight } from 'lucide-react'

export function RegisterPage() {
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
            <h1 className="text-2xl font-bold text-hf-text mb-1">Create your account</h1>
            <p className="text-hf-text-sec text-sm">Start managing webhooks like a pro</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); window.location.href = '/dashboard' }}>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-hf-text-sec mb-1.5">Full name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hf-muted" />
                <input type="text" placeholder="Nguyen Van A" className="input-base pl-9" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-hf-text-sec mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hf-muted" />
                <input type="email" placeholder="you@example.com" className="input-base pl-9" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-hf-text-sec mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hf-muted" />
                <input type="password" placeholder="Min 8 chars, uppercase, number" className="input-base pl-9" />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-hf-text-sec mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hf-muted" />
                <input type="password" placeholder="Repeat your password" className="input-base pl-9" />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full py-2.5 text-sm mt-2">
              Create account <ArrowRight size={15} />
            </button>
          </form>

          <p className="text-center text-sm text-hf-text-sec mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-hf-accent hover:text-hf-accent-lt transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
