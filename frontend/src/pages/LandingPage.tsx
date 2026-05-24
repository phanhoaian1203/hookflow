import { Link } from 'react-router-dom'
import {
  Zap, Shield, RefreshCw, BarChart2, FlaskConical,
  ArrowRight, CheckCircle2, GitBranch, CreditCard, Rocket,
  Activity, Copy, Eye,
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Signature Verification',
    desc: 'HMAC SHA256 authentication on every request. Reject forged webhooks automatically.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: CheckCircle2,
    title: 'Idempotency Protection',
    desc: 'Duplicate detection via ExternalEventId. Same event sent 10× — processed only once.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Zap,
    title: 'Background Worker',
    desc: 'API responds in < 200ms. Heavy processing runs async in a dedicated worker service.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: RefreshCw,
    title: 'Retry Engine',
    desc: 'Exponential backoff: 1m → 5m → 15m → 1h. Dead Letter Queue for manual replay.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: BarChart2,
    title: 'Real-time Dashboard',
    desc: 'Metrics, charts, event timeline, and processing attempts — all in one view.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
  {
    icon: FlaskConical,
    title: 'Webhook Simulator',
    desc: 'Send test webhooks directly from the UI without needing an external service.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
]

const steps = [
  { num: '01', title: 'Create an Endpoint',    desc: 'Define your webhook URL, provider, and allowed event types.' },
  { num: '02', title: 'Copy the URL',          desc: 'Paste the generated URL into GitHub, Stripe, or any service.' },
  { num: '03', title: 'Receive & Verify',      desc: 'HookFlow validates the signature and stores the raw payload.' },
  { num: '04', title: 'Monitor & Debug',       desc: 'View events, JSON payloads, retry history on the dashboard.' },
]

const useCases = [
  {
    icon: GitBranch,
    title: 'GitHub Monitor',
    desc: 'Track push events, pull requests, and workflow runs across all your repos.',
    events: ['push', 'pull_request', 'workflow_run'],
    color: 'from-gray-600/30 to-gray-700/10',
  },
  {
    icon: CreditCard,
    title: 'Payment Gateway',
    desc: 'Process payment events reliably. Never miss a payment.success or refund event.',
    events: ['payment.success', 'payment.failed', 'refund.created'],
    color: 'from-emerald-600/20 to-teal-700/10',
  },
  {
    icon: Rocket,
    title: 'CI/CD Pipeline',
    desc: 'Know exactly when each deployment finishes, who deployed, and which version.',
    events: ['deployment.finished', 'build.success', 'build.failed'],
    color: 'from-violet-600/20 to-purple-700/10',
  },
]

const terminalLines = [
  { type: 'comment', text: '# Receive a payment webhook' },
  { type: 'cmd',     text: 'POST /api/incoming-webhooks/payment-success' },
  { type: 'blank',   text: '' },
  { type: 'key',     text: '  "event": ', val: '"payment.success",' },
  { type: 'key',     text: '  "orderId": ', val: '"ORD-2026-001",' },
  { type: 'key',     text: '  "amount": ', val: '350000,' },
  { type: 'key',     text: '  "currency": ', val: '"VND"' },
  { type: 'blank',   text: '' },
  { type: 'success', text: '✓ Signature valid  · Status: Pending → Processed' },
  { type: 'success', text: '✓ Saved in 12ms  · Worker processed in 145ms' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-hf-bg text-hf-text font-sans">
      {/* ─── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-hf-border bg-hf-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-hf-accent to-purple-500 flex items-center justify-center shadow-glow-sm">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <span className="text-hf-text font-bold text-lg tracking-tight">HookFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-hf-text-sec">
            <a href="#features" className="hover:text-hf-text transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-hf-text transition-colors">How it works</a>
            <a href="#use-cases" className="hover:text-hf-text transition-colors">Use cases</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-hf-text-sec hover:text-hf-text transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="btn-primary px-4 py-2 text-sm"
            >
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="bg-hero bg-grid pt-40 pb-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-hf-accent-dim border border-hf-accent/20 text-hf-accent-lt text-sm font-medium mb-8 animate-fade-in">
            <Activity size={14} className="animate-pulse" />
            Webhook Event Processor — Developer Tool
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up text-balance">
            Webhooks that{' '}
            <span className="gradient-text">never get lost</span>
          </h1>

          <p className="text-xl text-hf-text-sec max-w-2xl mx-auto mb-10 text-balance animate-slide-up">
            Receive, validate, store, and monitor webhook events with signature verification,
            automatic retries, and a real-time debug dashboard.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 mb-16 animate-slide-up">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">
              Start for free <ArrowRight size={16} />
            </Link>
            <Link to="/dashboard" className="btn-secondary px-6 py-3 text-base">
              <Eye size={16} /> View Demo
            </Link>
          </div>

          {/* Terminal Preview */}
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-hf-border bg-hf-bg shadow-card-lg overflow-hidden">
              {/* Terminal titlebar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-hf-card border-b border-hf-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="flex-1 text-center text-xs text-hf-muted font-mono">hookflow — incoming webhook</span>
                <Copy size={12} className="text-hf-muted cursor-pointer hover:text-hf-text-sec" />
              </div>
              {/* Terminal body */}
              <div className="p-5 font-mono text-sm text-left space-y-1">
                {terminalLines.map((line, i) => (
                  <div key={i}>
                    {line.type === 'comment' && <span className="text-hf-muted">{line.text}</span>}
                    {line.type === 'cmd' && <span className="text-hf-accent-lt font-semibold">{line.text}</span>}
                    {line.type === 'key' && <div><span className="text-blue-400">{line.text}</span><span className="text-amber-300">{line.val}</span></div>}
                    {line.type === 'success' && <div className="text-hf-success">{line.text}</div>}
                    {line.type === 'blank' && <div>&nbsp;</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────── */}
      <section className="border-y border-hf-border bg-hf-card">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 divide-x divide-hf-border text-center">
            {[
              { label: 'Events processed today', value: '1,284' },
              { label: 'Average response time', value: '< 200ms' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="px-8 py-2">
                <div className="text-2xl font-bold text-hf-text mb-1">{stat.value}</div>
                <div className="text-sm text-hf-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────── */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-hf-accent text-sm font-semibold tracking-widest uppercase mb-3">Features</div>
          <h2 className="text-4xl font-bold text-hf-text mb-4">Everything you need for production webhooks</h2>
          <p className="text-hf-text-sec max-w-xl mx-auto">
            Built to solve the 6 most common problems developers face when integrating webhooks.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className={`card-hover p-6 border ${f.bg}`}>
              <div className={`w-10 h-10 rounded-lg ${f.bg} border flex items-center justify-center mb-4`}>
                <f.icon size={20} className={f.color} />
              </div>
              <h3 className="font-semibold text-hf-text mb-2">{f.title}</h3>
              <p className="text-sm text-hf-text-sec leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-hf-bg-sec border-y border-hf-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-hf-accent text-sm font-semibold tracking-widest uppercase mb-3">How It Works</div>
            <h2 className="text-4xl font-bold text-hf-text mb-4">From zero to webhook in 4 steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%-8px)] w-full h-px bg-gradient-to-r from-hf-border to-transparent z-10" />
                )}
                <div className="card p-6 h-full">
                  <div className="text-3xl font-bold gradient-text mb-4">{step.num}</div>
                  <h3 className="font-semibold text-hf-text mb-2">{step.title}</h3>
                  <p className="text-sm text-hf-text-sec">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Use Cases ───────────────────────────────────────────── */}
      <section id="use-cases" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-hf-accent text-sm font-semibold tracking-widest uppercase mb-3">Use Cases</div>
          <h2 className="text-4xl font-bold text-hf-text mb-4">Works with any webhook provider</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {useCases.map((uc) => (
            <div key={uc.title} className={`card p-6 bg-gradient-to-br ${uc.color} hover:border-hf-accent/30 transition-all duration-200`}>
              <uc.icon size={24} className="text-hf-text-sec mb-4" />
              <h3 className="font-semibold text-hf-text text-lg mb-2">{uc.title}</h3>
              <p className="text-sm text-hf-text-sec mb-4">{uc.desc}</p>
              <div className="flex flex-wrap gap-2">
                {uc.events.map((e) => (
                  <span key={e} className="badge bg-hf-hover text-hf-muted border border-hf-border font-mono text-[10px]">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 border-t border-hf-border bg-hf-bg-sec">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-hf-accent to-purple-500 flex items-center justify-center mx-auto mb-8 shadow-glow">
            <Zap size={28} className="text-white" fill="white" />
          </div>
          <h2 className="text-4xl font-bold text-hf-text mb-4">
            Start monitoring webhooks today
          </h2>
          <p className="text-hf-text-sec mb-8">
            Join developers who rely on HookFlow to keep their integrations reliable.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary px-8 py-3 text-base">
              Create free account <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-ghost px-6 py-3 text-base">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-hf-border bg-hf-bg py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-hf-accent to-purple-500 flex items-center justify-center">
              <Zap size={12} className="text-white" fill="white" />
            </div>
            <span className="text-hf-text font-semibold">HookFlow</span>
          </div>
          <div className="text-sm text-hf-muted">
            © 2026 HookFlow · Webhook Event Processor · Built with ❤️ by phanhoaian1203
          </div>
          <div className="flex gap-5 text-sm text-hf-muted">
            <a href="#" className="hover:text-hf-text transition-colors">Docs</a>
            <a href="#" className="hover:text-hf-text transition-colors">GitHub</a>
            <a href="#" className="hover:text-hf-text transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
