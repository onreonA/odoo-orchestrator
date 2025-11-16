'use client'

import { useState } from 'react'
import { Code, Copy, Check, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfigurationCodeViewerProps {
  code: string | null
  filePath?: string | null
  language?: 'python' | 'xml' | 'javascript' | 'json'
}

export function ConfigurationCodeViewer({
  code,
  filePath,
  language = 'python',
}: ConfigurationCodeViewerProps) {
  const [copied, setCopied] = useState(false)

  if (!code) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <Code className="w-5 h-5" />
          <span>Henüz kod üretilmedi</span>
        </div>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const getLanguageLabel = () => {
    switch (language) {
      case 'python':
        return 'Python'
      case 'xml':
        return 'XML'
      case 'javascript':
        return 'JavaScript'
      case 'json':
        return 'JSON'
      default:
        return 'Code'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">{getLanguageLabel()}</span>
          {filePath && (
            <span className="text-sm text-gray-500 ml-2">({filePath})</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        >
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </Button>
      </div>

      {/* Code */}
      <div className="relative">
        <pre className="p-4 overflow-x-auto bg-gray-900 text-gray-100 text-sm font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

