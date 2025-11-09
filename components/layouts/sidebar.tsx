'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, FolderKanban, Headphones, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: any
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/companies', label: 'Firmalar', icon: Building2 },
  { href: '/projects', label: 'Projeler', icon: FolderKanban },
  { href: '/support', label: 'Destek', icon: Headphones },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[var(--neutral-200)]">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-[var(--neutral-200)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[var(--brand-primary-500)]" />
          <span className="font-bold text-lg">Odoo AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-[var(--brand-primary-50)] text-[var(--brand-primary-600)] font-medium'
                  : 'text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="rounded-lg bg-[var(--neutral-100)] p-3">
          <div className="text-sm font-medium">{user?.full_name || 'Kullanıcı'}</div>
          <div className="text-xs text-[var(--neutral-500)]">{user?.email}</div>
          <div className="text-xs text-[var(--brand-primary-500)] mt-1">
            {user?.role === 'super_admin' ? 'Super Admin' : 'Kullanıcı'}
          </div>
        </div>
      </div>
    </aside>
  )
}
