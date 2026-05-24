/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // HookFlow Design System — Dark Theme
        hf: {
          bg:          '#080811',
          'bg-sec':    '#0d0d1a',
          card:        '#111120',
          'card-sec':  '#16162a',
          hover:       '#1c1c35',
          border:      '#242438',
          'border-sub':'#1a1a2e',
          // Text
          text:        '#e2e8f0',
          'text-sec':  '#94a3b8',
          muted:       '#4b5563',
          // Accent - Violet
          accent:      '#7c3aed',
          'accent-lt': '#8b5cf6',
          'accent-dim':'rgba(124, 58, 237, 0.12)',
          // Status colors
          success:     '#10b981',
          'success-dim':'rgba(16, 185, 129, 0.12)',
          warning:     '#f59e0b',
          'warning-dim':'rgba(245, 158, 11, 0.12)',
          danger:      '#ef4444',
          'danger-dim': 'rgba(239, 68, 68, 0.12)',
          info:        '#3b82f6',
          'info-dim':  'rgba(59, 130, 246, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(124, 58, 237, 0.2)',
        'glow':     '0 0 24px rgba(124, 58, 237, 0.25)',
        'glow-lg':  '0 0 40px rgba(124, 58, 237, 0.3)',
        'card':     '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-lg':  '0 4px 16px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.25), transparent)',
        'card-gradient': 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, transparent 60%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
