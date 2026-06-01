import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, Shield, RefreshCw, BarChart2, FlaskConical,
  ArrowRight, CheckCircle2, GitBranch, CreditCard, Rocket,
  Activity, Copy, Eye, Check, ChevronDown, Sparkles, AlertCircle,
  HelpCircle, Layers, Server, Terminal, Lock, Play
} from 'lucide-react'

// Terminal Payloads type
interface TerminalTab {
  name: string
  method: string
  url: string
  signatureHeader: string
  signatureValue: string
  payload: string
  logs: string[]
}

const terminalTabs: Record<string, TerminalTab> = {
  stripe: {
    name: 'Stripe',
    method: 'POST',
    url: '/api/v1/incoming/stripe',
    signatureHeader: 'Stripe-Signature',
    signatureValue: 't=1780362810,v1=9c12a83f98218e...',
    payload: JSON.stringify({
      id: "evt_stripe_9831a2",
      object: "event",
      type: "payment_intent.succeeded",
      created: 1780362810,
      data: {
        object: {
          id: "pi_3Mq12x",
          amount: 2900,
          currency: "usd",
          status: "succeeded"
        }
      }
    }, null, 2),
    logs: [
      '→ Verified Stripe HMAC signature successfully (v1)',
      '→ Event ID matches stripe event logs database',
      '→ Idempotency check: Unique event (external_id=evt_stripe_9831a2)',
      '→ Background worker: synced customer account (145ms)',
      '✓ Delivery status: 200 OK sent to your backend server in 12ms'
    ]
  },
  github: {
    name: 'GitHub',
    method: 'POST',
    url: '/api/v1/incoming/github',
    signatureHeader: 'X-Hub-Signature-256',
    signatureValue: 'sha256=f8d39c02aa021b39de58f84...',
    payload: JSON.stringify({
      ref: "refs/heads/main",
      before: "f8d39c02aa",
      after: "9c12a83f98",
      repository: {
        name: "hookflow-ui",
        owner: { name: "phanhoaian1203" }
      },
      commits: [
        {
          id: "9c12a83f98",
          message: "docs: update architecture flow diagram",
          author: { name: "An Phan" }
        }
      ]
    }, null, 2),
    logs: [
      '→ Verified GitHub signature (HMAC-SHA256)',
      '→ Event "push" matched registered endpoints configurations',
      '→ Queued event payload successfully to RabbitMQ cluster',
      '→ Executing webhook post-receive hook functions',
      '✓ Delivery status: 202 Accepted sent to dashboard in 8ms'
    ]
  },
  shopify: {
    name: 'Shopify',
    method: 'POST',
    url: '/api/v1/incoming/shopify',
    signatureHeader: 'X-Shopify-Hmac-SHA256',
    signatureValue: '839210382abcd8392efab8132039...',
    payload: JSON.stringify({
      id: 839210382,
      email: "customer@hookflow.io",
      total_price: "29.00",
      currency: "USD",
      line_items: [
        {
          id: 9812379,
          title: "Startup Plan - Annual",
          quantity: 1
        }
      ]
    }, null, 2),
    logs: [
      '→ Verified Shopify SHA256 HMAC header',
      '→ Endpoint: Shopify Webhooks (Active)',
      '→ Duplicate check passed (external_id=shopify_839210382)',
      '→ Triggered webhook pipeline logic hooks',
      '✓ Delivery status: 200 OK sent to CRM database in 19ms'
    ]
  },
  sentry: {
    name: 'Sentry',
    method: 'POST',
    url: '/api/v1/incoming/sentry',
    signatureHeader: 'Sentry-Hook-Signature',
    signatureValue: 'e158bf813a8cd71b2e2d93e18cf...',
    payload: JSON.stringify({
      action: "triggered",
      data: {
        issue: {
          id: "3829103",
          title: "Database connection timeout in ingest-worker",
          level: "error",
          project: "hookflow-prod"
        }
      }
    }, null, 2),
    logs: [
      '→ Verified Sentry header signature',
      '→ Filter matched: issue.level == "error"',
      '→ Dispatched slack message payload successfully',
      '→ Alerting integration active (Sentry to #alerts-dev)',
      '✓ Delivery status: 200 OK slack delivery in 11ms'
    ]
  }
}

const features = [
  {
    icon: Shield,
    title: 'Signature Verification',
    desc: 'HMAC SHA256 authentication computed dynamically on every inbound webhook. Reject forged triggers at our edge instantly.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 hover:border-emerald-500/30',
  },
  {
    icon: CheckCircle2,
    title: 'Idempotency Protection',
    desc: 'Duplicate check via custom ExternalEventId paths. Even if standard services send the same webhook 10×, we only execute once.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/10 hover:border-blue-500/30',
  },
  {
    icon: Zap,
    title: 'Instant HTTP Response',
    desc: 'Respond in under < 20ms to the sender, keeping integrations fast. Heavy business logic runs asynchronously inside isolated queues.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/5 hover:bg-violet-500/10 border-violet-500/10 hover:border-violet-500/30',
  },
  {
    icon: RefreshCw,
    title: 'Exponential Backoff Retries',
    desc: 'Automatic retry schedules: 1m → 5m → 15m → 1h → 6h. Built-in Dead Letter Queue (DLQ) for absolute control and manual replays.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10 hover:border-amber-500/30',
  },
  {
    icon: BarChart2,
    title: 'Real-time Metrics Logs',
    desc: 'Visual timeline, body schema inspectors, header audits, event statuses, and processing timelines—all built in one slick view.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/5 hover:bg-pink-500/10 border-pink-500/10 hover:border-pink-500/30',
  },
  {
    icon: FlaskConical,
    title: 'SaaS Webhook Simulator',
    desc: 'Trigger test webhook endpoints directly inside our UI panels. Simulate stripe or custom events without sending curl commands.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-500/10 hover:border-cyan-500/30',
  },
]

const pipelineSteps = [
  { label: 'Webhook Sender', desc: 'Stripe, GitHub, Shopify trigger a raw webhook post request.' },
  { label: 'HookFlow Ingest', desc: 'Edge server verifies HMAC-SHA256 signature and returns 202 Accepted.' },
  { label: 'Message Queue', desc: 'Saves payload to secure DB and schedules reliable async processing.' },
  { label: 'Worker Services', desc: 'Executes filters, dedupes, and extracts variables from payload.' },
  { label: 'Your Server', desc: 'HookFlow delivers clean webhook data. Automatically retries if 500 error occurs.' }
]

const faqItems = [
  {
    q: 'What is HookFlow and why do I need a webhook gateway?',
    a: 'HookFlow is a developer-focused webhook ingestion and routing gateway. Instead of pointing Stripe, GitHub, or Shopify events directly to your application backend, you route them through HookFlow first. This ensures immediate responses to providers (avoiding webhook timeouts), verifies signatures at our edge, removes duplicates, and automatically retries failures so you never lose critical customer transactions.'
  },
  {
    q: 'How does the HMAC Signature Verification work?',
    a: 'Inside HookFlow, you configure the webhook secret key provided by your sender. When a new webhook arrives, HookFlow computes the cryptographic signature (typically HMAC-SHA256) of the raw HTTP request body and matches it to headers like `X-Hub-Signature-256` or `Stripe-Signature`. If it is invalid, it is rejected at the edge, saving your backend from malicious spoofing.'
  },
  {
    q: 'What is Idempotency protection and how does it safeguard my data?',
    a: 'Webhook providers occasionally send the exact same event multiple times due to networking issues. HookFlow allows you to map an idempotency key (e.g. from Stripe event IDs or JSON payload paths). If HookFlow sees the same event identifier twice within your retention window, it will instantly bypass duplicate execution, preventing multiple charges or double DB inserts.'
  },
  {
    q: 'How does HookFlow handle automated retries & Dead Letter Queues?',
    a: 'If your server is down or returns a 5xx status code, HookFlow schedules an automated retry using exponential backoff (e.g., after 1 min, 5 mins, 30 mins). If your server continues failing after all retries, the webhook is moved to a Dead Letter Queue (DLQ). Once you fix your server code, you can replay the exact failed webhook manually from the dashboard.'
  },
  {
    q: 'Can I transform or filter payload bodies before delivery?',
    a: 'Yes! HookFlow provides rule-based filters. You can configure endpoint rules to only listen to specific event typologies (e.g., only trigger on `payment_intent.succeeded` or `push` to `main`). This reduces unnecessary traffic and load to your backend microservices.'
  }
]

export function LandingPage() {
  // Interactive Terminal state
  const [activeTab, setActiveTab] = useState<'stripe' | 'github' | 'shopify' | 'sentry'>('stripe')
  const [copied, setCopied] = useState(false)

  // Animated Webhook Delivery Pipeline State
  const [activePipelineStep, setActivePipelineStep] = useState(0)

  // How it works Interactive Selector
  const [activeHowStep, setActiveHowStep] = useState(0)

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // Pricing Toggle state
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('annually')

  // Auto increment active step in the delivery pipeline
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePipelineStep((prev) => (prev + 1) % 5)
    }, 2800)
    return () => clearInterval(timer)
  }, [])

  const handleCopy = () => {
    const currentData = terminalTabs[activeTab]
    const textToCopy = `curl -X ${currentData.method} "https://hookflow.io${currentData.url}" \\\n  -H "${currentData.signatureHeader}: ${currentData.signatureValue}" \\\n  -H "Content-Type: application/json" \\\n  -d '${currentData.payload.replace(/'/g, "'\\''")}'`
    
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentTerm = terminalTabs[activeTab]

  return (
    <div className="min-h-screen bg-hf-bg text-hf-text font-sans relative overflow-x-hidden selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* ─── Glowing Background Blobs ──────────────────────────────── */}
      <div className="absolute top-[8%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[130px] animate-pulse-slow pointer-events-none" />
      <div className="absolute top-[25%] right-[-5%] w-[450px] h-[450px] rounded-full bg-blue-600/10 blur-[120px] animate-float-slow pointer-events-none" />
      <div className="absolute top-[60%] left-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[150px] animate-float pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[130px] animate-pulse-slow pointer-events-none" />

      {/* ─── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-hf-border bg-hf-bg/75 backdrop-blur-md transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-hf-accent to-pink-500 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-all duration-300 transform group-hover:scale-105">
              <Zap size={18} className="text-white fill-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-hf-text font-extrabold text-lg tracking-tight leading-none group-hover:text-white transition-colors">HookFlow</span>
              <span className="text-[10px] text-hf-accent-lt font-mono tracking-widest uppercase">v1.2 Beta</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm text-hf-text-sec">
            <a href="#features" className="hover:text-hf-text hover:shadow-glow-sm transition-all duration-200 py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-hf-accent after:transition-all hover:after:w-full">Features</a>
            <a href="#how-it-works" className="hover:text-hf-text transition-all duration-200 py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-hf-accent after:transition-all hover:after:w-full">How it works</a>
            <a href="#pipeline" className="hover:text-hf-text transition-all duration-200 py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-hf-accent after:transition-all hover:after:w-full">Delivery Pipeline</a>
            <a href="#pricing" className="hover:text-hf-text transition-all duration-200 py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-hf-accent after:transition-all hover:after:w-full">Pricing</a>
            <a href="#faq" className="hover:text-hf-text transition-all duration-200 py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-hf-accent after:transition-all hover:after:w-full">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-hf-text-sec hover:text-hf-text transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="btn-primary px-4 py-2 text-sm shadow-glow-sm hover:shadow-glow transform active:scale-95 transition-all duration-150 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-1.5 font-semibold">
                Get Started <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="bg-hero bg-grid pt-36 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-hf-bg/50 to-hf-bg" />
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          
          {/* Glowing Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hf-accent/10 border border-hf-accent/30 text-hf-accent-lt text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in shadow-glow-sm">
            <Sparkles size={12} className="text-hf-accent-lt animate-pulse" />
            <span>Robust Ingest, Validation, and Retries Gateway</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up text-balance text-white leading-[1.1]">
            Webhooks that <br className="hidden md:inline" />
            <span className="gradient-text bg-gradient-to-r from-hf-accent-lt via-purple-400 to-pink-400 drop-shadow-[0_2px_15px_rgba(139,92,246,0.3)]">never get lost</span>
          </h1>

          <p className="text-lg md:text-xl text-hf-text-sec max-w-3xl mx-auto mb-10 text-balance animate-slide-up leading-relaxed">
            Protect your backend from webhook timeouts and malicious requests. HookFlow acts as a ultra-fast, 
            reliable secure gateway that ingests payloads in under <span className="text-hf-accent-lt font-semibold">20ms</span>, validates HMAC keys, and ensures automatic retries with Dead Letter Queue protection.
          </p>

          {/* Call-to-actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up">
            <Link to="/register" className="btn-primary px-8 py-3.5 text-base w-full sm:w-auto shadow-glow group transform active:scale-95 transition-all">
              Start Free Account <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <Link to="/dashboard" className="btn-secondary px-8 py-3.5 text-base w-full sm:w-auto hover:bg-hf-hover border border-hf-border flex items-center justify-center gap-2 transition-all">
              <Eye size={18} className="text-hf-accent-lt" /> View Interactive Demo
            </Link>
          </div>

          {/* ─── INTERACTIVE TERMINAL PREVIEW ───────────────────────── */}
          <div className="max-w-4xl mx-auto mt-6 animate-slide-up">
            <div className="rounded-2xl border border-hf-border/80 bg-hf-bg/95 shadow-card-lg overflow-hidden glass accent-border relative shine-card">
              
              {/* Tabs header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-hf-border/60 bg-hf-card/85 px-4 py-2.5 gap-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-2.5 text-xs text-hf-muted font-mono tracking-wider">gateway-inspector</span>
                </div>
                
                {/* Switchers */}
                <div className="flex p-0.5 rounded-lg bg-hf-bg border border-hf-border/80 self-center">
                  {(Object.keys(terminalTabs) as Array<keyof typeof terminalTabs>).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all duration-200 ${
                        activeTab === tab
                          ? 'bg-hf-accent text-white shadow-glow-sm'
                          : 'text-hf-text-sec hover:text-hf-text hover:bg-hf-hover/50'
                      }`}
                    >
                      {terminalTabs[tab].name}
                    </button>
                  ))}
                </div>
                
                {/* Copy CURL Command Button */}
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 px-3 py-1 rounded bg-hf-hover/60 border border-hf-border hover:border-hf-accent/50 hover:bg-hf-hover text-xs font-semibold text-hf-text-sec hover:text-white transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-hf-success animate-pulse" />
                      <span className="text-hf-success font-mono">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} className="text-hf-text-sec group-hover:text-white" />
                      <span>Copy CURL Demo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Terminal code / metrics bodies split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-hf-border/60">
                
                {/* JSON Body editor panel */}
                <div className="lg:col-span-7 p-5 text-left font-mono text-xs overflow-x-auto bg-hf-bg/40 max-h-[340px] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3 text-hf-muted">
                    <span className="px-2 py-0.5 rounded bg-hf-hover text-hf-accent-lt font-extrabold uppercase text-[10px]">Header Payload</span>
                    <span className="text-[10px] truncate max-w-[250px]">{currentTerm.signatureHeader}: {currentTerm.signatureValue}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className="text-purple-400 font-extrabold">{currentTerm.method}</span>
                    <span className="text-hf-text font-bold truncate">{currentTerm.url}</span>
                    <span className="text-hf-success ml-auto font-bold animate-pulse">● HTTP 202 Ingested</span>
                  </div>

                  <hr className="border-hf-border/40 my-3" />

                  <pre className="text-slate-300 leading-relaxed font-medium">
                    <code>{currentTerm.payload}</code>
                  </pre>
                </div>

                {/* Gateway validation steps terminal execution */}
                <div className="lg:col-span-5 p-5 text-left bg-[#0c0c16]/90 flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-hf-muted mb-4 flex items-center gap-1.5">
                      <Terminal size={10} className="text-hf-accent-lt" />
                      <span>HookFlow Processor Logs</span>
                    </div>

                    <div className="font-mono text-xs space-y-2.5 text-slate-300">
                      {currentTerm.logs.map((log, index) => {
                        const isSuccess = log.startsWith('✓')
                        const isWarning = log.startsWith('!')
                        return (
                          <div 
                            key={index} 
                            className={`p-2 rounded leading-snug border transition-all duration-300 ${
                              isSuccess 
                                ? 'bg-hf-success-dim/30 border-hf-success/20 text-emerald-400 font-semibold' 
                                : isWarning 
                                  ? 'bg-hf-warning-dim/30 border-hf-warning/20 text-amber-400' 
                                  : 'bg-hf-hover/50 border-hf-border/30 text-slate-300'
                            }`}
                          >
                            {log}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Simulator action shortcut */}
                  <div className="mt-4 pt-3 border-t border-hf-border/30 flex items-center justify-between">
                    <span className="text-[10px] text-hf-muted font-mono">Response Speed: 11ms</span>
                    <Link 
                      to="/simulator" 
                      className="text-xs text-hf-accent-lt hover:text-white font-semibold flex items-center gap-1 group/sim cursor-pointer"
                    >
                      Open Webhook Simulator <Play size={10} className="group-hover/sim:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── Trust Indicators & Counter Section ───────────────────── */}
      <section className="border-y border-hf-border/80 bg-hf-card/50 backdrop-blur-sm relative z-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-hf-border/70 text-center">
            
            <div className="px-8 py-3 group">
              <div className="text-3xl lg:text-4xl font-extrabold text-white mb-1.5 drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                1,284,930
              </div>
              <div className="text-xs font-semibold tracking-wider text-hf-accent-lt uppercase flex items-center justify-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-hf-success animate-ping-slow" />
                Webhook Deliveries Today
              </div>
            </div>

            <div className="px-8 py-3 group">
              <div className="text-3xl lg:text-4xl font-extrabold text-white mb-1.5 drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                &lt; 20ms
              </div>
              <div className="text-xs font-semibold tracking-wider text-hf-accent-lt uppercase">
                Average Ingest Latency
              </div>
            </div>

            <div className="px-8 py-3 group">
              <div className="text-3xl lg:text-4xl font-extrabold text-white mb-1.5 drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                99.997%
              </div>
              <div className="text-xs font-semibold tracking-wider text-hf-accent-lt uppercase">
                Gateway Ingest Uptime
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Animated Webhook Delivery Pipeline ───────────────────── */}
      <section id="pipeline" className="py-24 max-w-6xl mx-auto px-6 relative z-10 scroll-mt-12">
        <div className="text-center mb-16">
          <div className="text-hf-accent text-xs font-extrabold tracking-widest uppercase mb-3 flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-hf-accent animate-pulse" />
            Visual Core Infrastructure
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How HookFlow guarantees delivery
          </h2>
          <p className="text-hf-text-sec max-w-2xl mx-auto text-base">
            Watch the lifecycle of a single incoming webhook event. We ingest asynchronously so your server never struggles under heavy loads.
          </p>
        </div>

        {/* Dynamic SVG Connection Line & Row of nodes */}
        <div className="relative p-8 rounded-2xl border border-hf-border bg-hf-card/30 glass overflow-hidden">
          
          {/* Absolute Background Line connecting nodes */}
          <div className="hidden lg:block absolute top-[98px] left-[10%] right-[10%] h-[2px] bg-hf-border/80 z-0">
            {/* Glowing moving segment along the path */}
            <div 
              className="absolute top-0 h-full bg-gradient-to-r from-transparent via-hf-accent to-pink-500 transition-all duration-1000 ease-in-out"
              style={{
                left: `${activePipelineStep * 20}%`,
                width: '30%',
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
            {pipelineSteps.map((step, idx) => {
              const isActive = idx === activePipelineStep
              return (
                <div 
                  key={idx}
                  onClick={() => setActivePipelineStep(idx)}
                  className={`flex flex-col items-center text-center cursor-pointer p-4 rounded-xl transition-all duration-300 border ${
                    isActive 
                      ? 'bg-hf-accent/10 border-hf-accent/60 shadow-glow-sm scale-[1.03]' 
                      : 'bg-hf-bg/40 border-hf-border hover:border-hf-border/70 hover:bg-hf-card/50'
                  }`}
                >
                  {/* Node Index Badge */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-300 font-mono font-bold text-sm ${
                    isActive 
                      ? 'bg-gradient-to-br from-hf-accent to-pink-500 text-white shadow-glow scale-110' 
                      : 'bg-hf-card text-hf-muted border border-hf-border'
                  }`}>
                    {idx + 1}
                  </div>

                  <h3 className={`font-semibold text-sm mb-2 transition-colors ${isActive ? 'text-white' : 'text-hf-text'}`}>
                    {step.label}
                  </h3>
                  <p className="text-xs text-hf-text-sec leading-relaxed max-w-[150px]">
                    {step.desc}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Details visual explanation of active node */}
          <div className="mt-8 p-5 rounded-xl border border-hf-border bg-hf-bg/85 flex flex-col md:flex-row items-center justify-between gap-5 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-hf-accent/20 flex items-center justify-center shrink-0 border border-hf-accent/30 text-hf-accent-lt animate-pulse">
                {activePipelineStep === 0 && <Layers size={18} />}
                {activePipelineStep === 1 && <Shield size={18} />}
                {activePipelineStep === 2 && <RefreshCw size={18} />}
                {activePipelineStep === 3 && <FlaskConical size={18} />}
                {activePipelineStep === 4 && <Server size={18} />}
              </div>
              <div className="text-left">
                <span className="text-[10px] font-mono tracking-widest text-hf-muted uppercase">Currently Visualizing Stage {activePipelineStep + 1}</span>
                <h4 className="text-base font-bold text-white mt-0.5">{pipelineSteps[activePipelineStep].label}</h4>
              </div>
            </div>
            
            <p className="text-sm text-hf-text-sec text-left max-w-xl flex-1 leading-relaxed">
              {activePipelineStep === 0 && 'A provider fires off a webhook due to an action (like a new billing deposit or push event). Your backend is usually forced to respond in seconds, creating extreme spikes. HookFlow completely shields you from these crashes.'}
              {activePipelineStep === 1 && 'Our hyper-optimized edge points receive the request, compute the HMAC signatures, and check keys in less than 20ms. The sender gets a clean 202 Accepted. Your server receives no network load at this stage.'}
              {activePipelineStep === 2 && 'Incoming events are securely placed in high-performance databanks. If your application or infrastructure goes offline, the webhooks stay in the queue, preventing any transactional data loss.'}
              {activePipelineStep === 3 && 'Workers verify key filters, detect duplicate ID strings, and transform payload formatting. Only valid, unique, and configured webhooks are pushed downstream to your endpoints.'}
              {activePipelineStep === 4 && 'The webhook is delivered securely to your internal server. If your app returns a database error, HookFlow automatically triggers intelligent exponential backoff and stores failures in the Dead Letter Queue.'}
            </p>
          </div>

        </div>
      </section>

      {/* ─── Features Grid ────────────────────────────────────────── */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-6 scroll-mt-12 relative z-10">
        <div className="text-center mb-16">
          <div className="text-hf-accent text-xs font-extrabold tracking-widest uppercase mb-3 flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-hf-accent animate-pulse" />
            Engineering Standards
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Production-grade webhook management
          </h2>
          <p className="text-hf-text-sec max-w-xl mx-auto">
            Solve the most painful webhook engineering bottlenecks with a modular, highly visual toolkit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, index) => (
            <div 
              key={index} 
              className={`card-hover p-6 border transition-all duration-300 relative group overflow-hidden shine-card ${f.bg}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-hf-accent/5 rounded-bl-full translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform" />
              
              <div className="w-12 h-12 rounded-xl bg-hf-card border border-hf-border flex items-center justify-center mb-5 group-hover:scale-105 transition-all duration-300 shadow-card">
                <f.icon size={22} className={f.color} />
              </div>

              <h3 className="text-lg font-bold text-white mb-2.5 group-hover:text-hf-accent-lt transition-colors">
                {f.title}
              </h3>
              
              <p className="text-sm text-hf-text-sec leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works (Interactive Step Visualizer) ───────────── */}
      <section id="how-it-works" className="py-24 bg-hf-bg-sec/50 border-y border-hf-border/80 scroll-mt-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="text-center mb-16">
            <div className="text-hf-accent text-xs font-extrabold tracking-widest uppercase mb-3 flex items-center justify-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-hf-accent" />
              Simple Integration
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Get up and running in 4 easy steps
            </h2>
            <p className="text-hf-text-sec max-w-xl mx-auto text-base">
              Set up webhooks monitoring in less than 3 minutes. Zero code modifications required.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Steps Left List */}
            <div className="lg:col-span-5 flex flex-col justify-center gap-4">
              {[
                { 
                  num: '01', 
                  title: 'Create an Endpoint', 
                  desc: 'Provide your webhook URL, target provider (e.g. Stripe, GitHub), and toggle matching events.' 
                },
                { 
                  num: '02', 
                  title: 'Copy the Routing Link', 
                  desc: 'HookFlow generates a secure, unique ingestion URL. Paste this into your provider portal.' 
                },
                { 
                  num: '03', 
                  title: 'Ingest & Verify', 
                  desc: 'Every inbound payload signature is validated instantly against the matching HMAC key.' 
                },
                { 
                  num: '04', 
                  title: 'Analyze & Troubleshoot', 
                  desc: 'Inspect metrics dashboards, payload schemas, delivery retries, or trigger manual replays.' 
                }
              ].map((step, idx) => {
                const isActive = activeHowStep === idx
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveHowStep(idx)}
                    className={`text-left p-5 rounded-xl border transition-all duration-300 flex items-start gap-4 cursor-pointer w-full group ${
                      isActive 
                        ? 'bg-hf-accent/15 border-hf-accent/60 shadow-glow-sm' 
                        : 'bg-hf-bg border-hf-border hover:border-hf-border/70 hover:bg-hf-card/45'
                    }`}
                  >
                    <div className={`text-2xl font-extrabold tracking-tight font-mono shrink-0 transition-colors ${
                      isActive ? 'text-hf-accent-lt' : 'text-hf-muted group-hover:text-hf-text-sec'
                    }`}>
                      {step.num}
                    </div>
                    <div>
                      <h3 className={`font-bold text-base mb-1.5 transition-colors ${
                        isActive ? 'text-white' : 'text-hf-text group-hover:text-white'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-xs text-hf-text-sec leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Dashboard Mini-Mockups Right Visual Panel */}
            <div className="lg:col-span-7 rounded-2xl border border-hf-border bg-hf-bg shadow-card-lg overflow-hidden glass accent-border flex flex-col p-6 min-h-[380px] justify-between">
              
              {/* Top mock title */}
              <div className="flex items-center justify-between border-b border-hf-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-hf-accent animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    {activeHowStep === 0 && 'Configuring Webhook Endpoint'}
                    {activeHowStep === 1 && 'Ingestion Webhook URL Generated'}
                    {activeHowStep === 2 && 'Automatic HMAC Handshake Verified'}
                    {activeHowStep === 3 && 'Debugger Console & Logs'}
                  </span>
                </div>
                <span className="text-[10px] text-hf-muted font-mono">dashboard_mock_v1</span>
              </div>

              {/* Center mock bodies depending on selected step */}
              <div className="my-6 flex-1 flex flex-col justify-center font-mono">
                {activeHowStep === 0 && (
                  <div className="space-y-4 max-w-md mx-auto text-left w-full text-xs">
                    <div className="space-y-1.5">
                      <label className="text-hf-text-sec font-bold">Endpoint Label</label>
                      <div className="px-3 py-2 bg-hf-card border border-hf-border rounded-lg text-slate-300">Stripe Payment Gateway Production</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-hf-text-sec font-bold">Provider</label>
                        <div className="px-3 py-2 bg-hf-card border border-hf-border rounded-lg text-slate-300">Stripe</div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-hf-text-sec font-bold">Client Target URL</label>
                        <div className="px-3 py-2 bg-hf-card border border-hf-border rounded-lg text-slate-300 truncate">https://api.myapp.com/billing</div>
                      </div>
                    </div>
                    <div className="p-3 bg-hf-success-dim/20 border border-hf-success/20 rounded-lg text-[10px] text-emerald-400 font-semibold leading-relaxed">
                      ✓ Automatically listening to payment_intent.succeeded and charge.refunded events.
                    </div>
                  </div>
                )}

                {activeHowStep === 1 && (
                  <div className="space-y-4 max-w-md mx-auto text-left w-full text-xs">
                    <div className="p-4 bg-hf-card border border-hf-border rounded-xl">
                      <div className="text-[10px] font-bold text-hf-muted uppercase tracking-wider mb-2">Secure Gateway Target URL</div>
                      <div className="flex items-center gap-2 p-2 bg-hf-bg rounded-lg border border-hf-border">
                        <input 
                          type="text" 
                          readOnly 
                          value="https://hookflow.live/in/ep_prod_stripe_82937a" 
                          className="bg-transparent outline-none flex-1 text-slate-300 text-xs font-mono" 
                        />
                        <button className="px-2.5 py-1 rounded bg-hf-accent hover:bg-hf-accent-lt text-white text-[10px] font-sans font-bold transition-all">Copy</button>
                      </div>
                    </div>
                    <div className="text-[10px] text-hf-text-sec leading-relaxed text-center font-sans">
                      Paste this endpoint URL into Stripe Settings &gt; Webhooks. HookFlow is now listening.
                    </div>
                  </div>
                )}

                {activeHowStep === 2 && (
                  <div className="space-y-3.5 text-xs text-left max-w-lg mx-auto w-full">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-hf-success/20 bg-hf-success-dim/15">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-hf-success animate-pulse" />
                        <span className="font-extrabold text-emerald-400">HMAC Handshake Validated</span>
                      </div>
                      <span className="text-[10px] text-hf-muted">verified in 8ms</span>
                    </div>

                    <div className="p-3 bg-hf-card border border-hf-border rounded-lg space-y-1 font-mono text-[10px] text-slate-300">
                      <div><span className="text-hf-accent-lt">Signature matching:</span> Stripe-Signature SHA256 == computed_hash</div>
                      <div><span className="text-hf-accent-lt">Authentication status:</span> Authenticated & Gateway cleared</div>
                      <div><span className="text-hf-accent-lt">Security Audit:</span> Spoofing threats bypass failed (Clean Event)</div>
                    </div>
                  </div>
                )}

                {activeHowStep === 3 && (
                  <div className="space-y-3 w-full text-left text-xs">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="p-2.5 bg-hf-card border border-hf-border rounded-lg">
                        <div className="text-[10px] text-hf-muted">Ingested</div>
                        <div className="text-base font-bold text-white mt-1">10,230</div>
                      </div>
                      <div className="p-2.5 bg-hf-card border border-hf-border rounded-lg">
                        <div className="text-[10px] text-hf-muted">Success Rate</div>
                        <div className="text-base font-bold text-emerald-400 mt-1">99.98%</div>
                      </div>
                      <div className="p-2.5 bg-hf-card border border-hf-border rounded-lg">
                        <div className="text-[10px] text-hf-muted">Retried</div>
                        <div className="text-base font-bold text-amber-400 mt-1">21</div>
                      </div>
                      <div className="p-2.5 bg-hf-card border border-hf-border rounded-lg">
                        <div className="text-[10px] text-hf-muted">DLQ Events</div>
                        <div className="text-base font-bold text-red-400 mt-1">0</div>
                      </div>
                    </div>

                    <div className="p-3 bg-hf-hover/60 border border-hf-border rounded-lg flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle size={12} className="text-amber-400" />
                        <span className="text-slate-300 font-sans">1 event failed on client server (503 Service Unavailable)</span>
                      </div>
                      <button className="px-2.5 py-1 rounded bg-hf-accent-dim hover:bg-hf-accent/30 border border-hf-accent/40 text-hf-accent-lt font-bold text-[10px] font-sans transition-all">Replay Webhook</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mini foot tracker */}
              <div className="flex items-center justify-between border-t border-hf-border/50 pt-3">
                <span className="text-[10px] text-hf-muted font-mono">Stage {activeHowStep + 1} of 4</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((s) => (
                    <div 
                      key={s} 
                      onClick={() => setActiveHowStep(s)}
                      className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                        activeHowStep === s ? 'bg-hf-accent w-4' : 'bg-hf-border hover:bg-hf-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ─── Pricing Section ──────────────────────────────────────── */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-6 scroll-mt-12 relative z-10">
        <div className="text-center mb-12">
          <div className="text-hf-accent text-xs font-extrabold tracking-widest uppercase mb-3 flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-hf-accent animate-pulse" />
            Simple Transparent Billing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Affordable plans for developers and teams
          </h2>
          <p className="text-hf-text-sec max-w-xl mx-auto">
            Get started for free. Scale indefinitely as webhook volume grows. No hidden processing surcharges.
          </p>

          {/* Toggle Period switcher */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-hf-card border border-hf-border mt-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-300 ${
                billingPeriod === 'monthly'
                  ? 'bg-hf-bg text-white shadow-card'
                  : 'text-hf-text-sec hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                billingPeriod === 'annually'
                  ? 'bg-hf-accent text-white shadow-glow-sm'
                  : 'text-hf-text-sec hover:text-white'
              }`}
            >
              <span>Annually</span>
              <span className="px-1.5 py-0.5 rounded bg-white text-hf-accent font-extrabold text-[9px] uppercase tracking-normal">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
          
          {/* Card 1: Hobby */}
          <div className="rounded-2xl border border-hf-border bg-hf-card/30 p-8 flex flex-col justify-between hover:border-hf-border/80 transition-all duration-300 glass shine-card">
            <div>
              <div className="text-xs font-extrabold uppercase text-hf-muted tracking-wider">Hobby Plan</div>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-hf-muted">/ forever free</span>
              </div>
              <p className="text-xs text-hf-text-sec mt-3.5 leading-relaxed">
                Perfect for side projects, local debugging, and exploring webhook gateway infrastructure.
              </p>

              <hr className="border-hf-border/60 my-6" />

              <ul className="space-y-3.5 text-xs text-slate-300 text-left font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-hf-accent-lt" />
                  <span>10,000 webhook events / month</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-hf-accent-lt" />
                  <span>1 Ingestion Endpoint</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-hf-accent-lt" />
                  <span>24-Hour payload log retention</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-hf-accent-lt" />
                  <span>Basic HMAC signature verification</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-hf-accent-lt" />
                  <span>Max 3 automated retries per fail</span>
                </li>
              </ul>
            </div>

            <Link 
              to="/register" 
              className="btn-secondary w-full py-3 mt-8 flex items-center justify-center font-bold"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Card 2: Startup (Most Popular - Premium Border Highlight) */}
          <div className="rounded-2xl border-2 border-hf-accent bg-hf-card/50 p-8 flex flex-col justify-between shadow-glow relative transform scale-[1.03] z-10 glass shine-card">
            
            {/* Popular Badge banner */}
            <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-hf-accent to-pink-500 text-[10px] font-extrabold text-white uppercase tracking-widest shadow-glow flex items-center gap-1">
              <Sparkles size={9} fill="white" /> Most Popular
            </div>

            <div>
              <div className="text-xs font-extrabold uppercase text-hf-accent-lt tracking-wider">Startup Plan</div>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-4xl font-extrabold text-white">
                  {billingPeriod === 'annually' ? '$24' : '$29'}
                </span>
                <span className="text-xs text-hf-muted">
                  / month {billingPeriod === 'annually' && ' (billed annually)'}
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-3.5 leading-relaxed">
                Engineered for growing SaaS applications requiring full security verification and guaranteed deliveries.
              </p>

              <hr className="border-hf-accent/20 my-6" />

              <ul className="space-y-3.5 text-xs text-slate-200 text-left font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-purple-400" />
                  <span>250,000 webhook events / month</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-purple-400" />
                  <span className="font-bold text-white">Unlimited active endpoints</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-purple-400" />
                  <span>7-Day complete log body retention</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-purple-400" />
                  <span>Custom event transformations & rules</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-purple-400" />
                  <span>10 automated retries with backoff</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-purple-400" />
                  <span className="font-semibold text-white">Dead Letter Queue (DLQ) access</span>
                </li>
              </ul>
            </div>

            <Link 
              to="/register" 
              className="btn-primary w-full py-3 mt-8 shadow-glow text-white font-extrabold flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              Get Started Now <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 3: Enterprise */}
          <div className="rounded-2xl border border-hf-border bg-hf-card/30 p-8 flex flex-col justify-between hover:border-hf-border/80 transition-all duration-300 glass shine-card">
            <div>
              <div className="text-xs font-extrabold uppercase text-hf-muted tracking-wider">Enterprise Plan</div>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-4xl font-extrabold text-white">
                  {billingPeriod === 'annually' ? '$119' : '$149'}
                </span>
                <span className="text-xs text-hf-muted">/ month</span>
              </div>
              <p className="text-xs text-hf-text-sec mt-3.5 leading-relaxed">
                For enterprise production products requiring isolation, deep security compliance, and custom SLAs.
              </p>

              <hr className="border-hf-border/60 my-6" />

              <ul className="space-y-3.5 text-xs text-slate-300 text-left font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-hf-accent-lt" />
                  <span className="font-bold text-white">5,000,000+ events / month</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-hf-accent-lt" />
                  <span>30-Day complete retention archives</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-hf-accent-lt" />
                  <span>Dedicated ingestion queue workers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-hf-accent-lt" />
                  <span>IP whitelists & secure virtual connections</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 size={14} className="text-hf-accent-lt" />
                  <span>Dedicated Slack support & 99.99% SLA</span>
                </li>
              </ul>
            </div>

            <Link 
              to="/register" 
              className="btn-secondary w-full py-3 mt-8 flex items-center justify-center font-bold"
            >
              Contact Sales
            </Link>
          </div>

        </div>
      </section>

      {/* ─── FAQ Section Accordion ────────────────────────────────── */}
      <section id="faq" className="py-24 bg-hf-bg-sec/40 border-t border-hf-border/80 scroll-mt-12 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center mb-16">
            <div className="text-hf-accent text-xs font-extrabold tracking-widest uppercase mb-3 flex items-center justify-center gap-1.5">
              <HelpCircle size={14} className="text-hf-accent-lt" />
              Frequently Answered
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Answers for curious developers
            </h2>
            <p className="text-hf-text-sec max-w-xl mx-auto">
              Find technical descriptions on security thresholds, retention cycles, and webhook performance.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, idx) => {
              const isOpen = activeFaq === idx
              return (
                <div 
                  key={idx}
                  className="rounded-xl border border-hf-border bg-hf-bg/80 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm md:text-base text-white hover:text-hf-accent-lt transition-colors focus:outline-none cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown 
                      size={18} 
                      className={`text-hf-muted transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-hf-accent-lt' : ''}`} 
                    />
                  </button>

                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-[300px] border-t border-hf-border/40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-6 py-4.5 text-sm text-hf-text-sec leading-relaxed font-normal bg-hf-card/25">
                      {faq.a}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ─── Premium Call To Action Section ───────────────────────── */}
      <section className="py-28 border-t border-hf-border/80 bg-gradient-to-b from-hf-bg-sec/50 via-hf-bg to-hf-bg relative z-10 overflow-hidden">
        
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] bg-gradient-radial from-hf-accent/15 to-transparent blur-[80px] pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 text-center relative z-20">
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-hf-accent to-pink-500 flex items-center justify-center mx-auto mb-8 shadow-glow transform hover:rotate-12 transition-transform">
            <Zap size={28} className="text-white fill-white animate-pulse" />
          </div>

          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Deploy bulletproof webhooks in minutes
          </h2>
          
          <p className="text-base text-slate-300 mb-8 max-w-lg mx-auto leading-relaxed">
            Stop losing event payloads when your server restarts. Route through HookFlow and gain peace of mind today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link 
              to="/register" 
              className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base shadow-glow flex items-center justify-center gap-2 transform active:scale-95 transition-all font-semibold"
            >
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link 
              to="/login" 
              className="btn-secondary w-full sm:w-auto px-8 py-3.5 text-base hover:bg-hf-hover flex items-center justify-center gap-2 font-semibold"
            >
              Sign In to Console
            </Link>
          </div>

          <div className="mt-8 text-xs text-hf-muted font-mono tracking-wide">
            ✓ No Credit Card Required · Setup takes less than 3 minutes
          </div>

        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-hf-border/80 bg-hf-bg py-12 relative z-20">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 pb-8 border-b border-hf-border/60">
            
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-hf-accent to-pink-500 flex items-center justify-center shadow-glow-sm">
                <Zap size={14} className="text-white fill-white" />
              </div>
              <span className="text-white font-extrabold text-base tracking-tight">HookFlow</span>
            </div>

            {/* Operational Active Live Checker */}
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#091a13]/80 border border-emerald-500/20 text-emerald-400 text-xs font-semibold self-start md:self-center font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping-slow" />
              <span>All Systems Operational</span>
            </div>

          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
            <div className="text-xs text-hf-muted">
              © 2026 HookFlow Gateway · Built with ❤️ for developer ecosystems.
            </div>
            
            <div className="flex gap-6 text-xs text-hf-muted font-medium">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">GitHub Repository</a>
              <a href="#" className="hover:text-white transition-colors">REST API Docs</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}
