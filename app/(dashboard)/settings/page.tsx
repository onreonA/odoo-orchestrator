import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Settings, Key, Webhook, User, Bell, Shield } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Get user profile
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Kullanıcı bulunamadı</div>
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const settingsCategories = [
    {
      title: 'API Ayarları',
      description: 'API anahtarlarınızı yönetin',
      icon: Key,
      href: '/settings/api-keys',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Webhook Ayarları',
      description: 'Webhook entegrasyonlarınızı yönetin',
      icon: Webhook,
      href: '/settings/webhooks',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Profil Ayarları',
      description: 'Kişisel bilgilerinizi güncelleyin',
      icon: User,
      href: '#',
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Bildirim Ayarları',
      description: 'Bildirim tercihlerinizi yönetin',
      icon: Bell,
      href: '#',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      title: 'Güvenlik',
      description: 'Şifre ve güvenlik ayarları',
      icon: Shield,
      href: '#',
      color: 'bg-red-50 text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ayarlar</h1>
          <p className="text-[var(--neutral-600)] mt-1">Platform ayarlarınızı yönetin</p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-[var(--brand-primary-50)]">
            <User className="w-6 h-6 text-[var(--brand-primary-500)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{profile?.full_name || 'Kullanıcı'}</h3>
            <p className="text-sm text-[var(--neutral-600)]">{profile?.email || user.email}</p>
            <p className="text-xs text-[var(--neutral-500)] mt-1">
              Rol: {profile?.role === 'super_admin' ? 'Super Admin' : 'Kullanıcı'}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map(category => {
          const Icon = category.icon
          return (
            <Link
              key={category.title}
              href={category.href}
              className="bg-white rounded-xl p-6 border border-[var(--neutral-200)] hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className={`p-3 rounded-lg ${category.color} w-fit mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
              <p className="text-sm text-[var(--neutral-600)]">{category.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
