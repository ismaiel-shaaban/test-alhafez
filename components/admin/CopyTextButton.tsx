'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyTextToClipboard } from '@/lib/clipboard'

export default function CopyTextButton({
  text,
  title = 'نسخ',
  successMessage = 'تم النسخ',
  failMessage = 'تعذّر النسخ',
  className = '',
}: {
  text: string
  title?: string
  successMessage?: string
  failMessage?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(text)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      return
    }
    alert(failMessage)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? successMessage : title}
      aria-label={copied ? successMessage : title}
      className={`inline-flex items-center justify-center p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors shrink-0 ${className}`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}
