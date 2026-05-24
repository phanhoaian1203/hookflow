import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyToClipboard } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  className?: string
  size?: 'sm' | 'md'
}

export function CopyButton({ text, className, size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const iconSize = size === 'sm' ? 12 : 14

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200',
        copied
          ? 'bg-hf-success-dim text-hf-success border border-hf-success/20'
          : 'bg-hf-hover text-hf-text-sec border border-hf-border hover:text-hf-text hover:border-hf-accent/30',
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <><Check size={iconSize} /><span>Copied!</span></>
      ) : (
        <><Copy size={iconSize} /><span>Copy</span></>
      )}
    </button>
  )
}
