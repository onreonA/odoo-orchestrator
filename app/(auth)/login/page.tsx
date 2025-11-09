'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Redirect to dashboard
        setLoading(false)
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--neutral-50)] p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--brand-primary-500)] to-[var(--brand-secondary-500)] bg-clip-text text-transparent">
            Odoo Orchestrator
          </h1>
          <p className="mt-2 text-[var(--neutral-600)]">Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-[var(--error)]/10 border border-[var(--error)] p-3 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--neutral-200)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary-500)]"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" loading={loading} disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Button>
        </form>

        <div className="text-center text-sm text-[var(--neutral-600)]">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="text-[var(--brand-primary-500)] hover:underline">
            Kayıt olun
          </Link>
        </div>
      </div>
    </div>
  )
}
