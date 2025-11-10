'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Client-side redirect as fallback (next.config.ts redirect is primary)
    router.replace('/login')
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand-primary-500)] border-t-transparent mx-auto"></div>
        <p className="text-[var(--neutral-600)]">Yönlendiriliyor...</p>
      </div>
    </div>
  )
}
