import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Code, FileCode, Workflow, Shield, FileText, Filter } from 'lucide-react'
import Link from 'next/link'

export default async function ConfigurationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  // Get user's company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  // Build query
  let query = supabase.from('configurations').select('*, companies(name)')

  if (profile?.role !== 'super_admin' && profile?.company_id) {
    query = query.eq('company_id', profile.company_id)
  }

  // Apply filters
  if (params.type) {
    query = query.eq('type', params.type as string)
  }
  if (params.status) {
    query = query.eq('status', params.status as string)
  }

  const { data: configurations, error } = await query.order('created_at', { ascending: false })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'model':
        return <Code className="w-5 h-5 text-blue-500" />
      case 'view':
        return <FileCode className="w-5 h-5 text-green-500" />
      case 'workflow':
        return <Workflow className="w-5 h-5 text-purple-500" />
      case 'security':
        return <Shield className="w-5 h-5 text-red-500" />
      case 'report':
        return <FileText className="w-5 h-5 text-orange-500" />
      default:
        return <Code className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-700'
      case 'approved':
        return 'bg-blue-100 text-blue-700'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-700'
      case 'needs_changes':
        return 'bg-orange-100 text-orange-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const stats = {
    total: configurations?.length || 0,
    deployed: configurations?.filter((c: any) => c.status === 'deployed').length || 0,
    pending: configurations?.filter((c: any) => c.status === 'pending_review').length || 0,
    draft: configurations?.filter((c: any) => c.status === 'draft').length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Konfigürasyonlar</h1>
          <p className="text-[var(--neutral-600)] mt-1">Odoo konfigürasyonlarını yönetin</p>
        </div>
        {(profile?.role === 'super_admin' || profile?.role === 'consultant') && (
          <Link href="/configurations/new">
            <Button size="lg" leftIcon={<Plus />}>
              Yeni Konfigürasyon
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-[var(--neutral-200)]">
          <div className="text-sm text-[var(--neutral-600)]">Toplam</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-[var(--neutral-200)]">
          <div className="text-sm text-[var(--neutral-600)]">Deploy Edildi</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{stats.deployed}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-[var(--neutral-200)]">
          <div className="text-sm text-[var(--neutral-600)]">İncelemede</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-[var(--neutral-200)]">
          <div className="text-sm text-[var(--neutral-600)]">Taslak</div>
          <div className="text-2xl font-bold mt-1 text-gray-600">{stats.draft}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Filter className="w-5 h-5 text-[var(--neutral-500)]" />
        <select
          defaultValue={params.type as string || 'all'}
          className="px-4 py-2 border border-[var(--neutral-300)] rounded-lg"
        >
          <option value="all">Tüm Tipler</option>
          <option value="model">Model</option>
          <option value="view">View</option>
          <option value="workflow">Workflow</option>
          <option value="security">Security</option>
          <option value="report">Report</option>
        </select>
        <select
          defaultValue={params.status as string || 'all'}
          className="px-4 py-2 border border-[var(--neutral-300)] rounded-lg"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="draft">Taslak</option>
          <option value="pending_review">İncelemede</option>
          <option value="approved">Onaylandı</option>
          <option value="deployed">Deploy Edildi</option>
          <option value="rejected">Reddedildi</option>
        </select>
      </div>

      {/* Configurations List */}
      {configurations && configurations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configurations.map((config: any) => (
            <Link
              key={config.id}
              href={`/configurations/${config.id}`}
              className="bg-white rounded-xl p-6 border border-[var(--neutral-200)] hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-[var(--brand-primary-50)]">
                  {getTypeIcon(config.type)}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(config.status)}`}>
                  {config.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{config.name}</h3>
              <div className="text-sm text-[var(--neutral-600)] mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Tip:</span>
                  <span className="capitalize">{config.type}</span>
                </div>
                {config.companies && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">Firma:</span>
                    <span>{config.companies.name}</span>
                  </div>
                )}
              </div>
              {config.natural_language_input && (
                <p className="text-sm text-[var(--neutral-600)] line-clamp-2">
                  {config.natural_language_input}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-[var(--neutral-200)]">
          <Code className="w-16 h-16 mx-auto text-[var(--neutral-400)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--neutral-700)] mb-2">
            Henüz konfigürasyon yok
          </h3>
          <p className="text-[var(--neutral-600)] mb-6">
            İlk konfigürasyonu oluşturarak başlayın
          </p>
          {(profile?.role === 'super_admin' || profile?.role === 'consultant') && (
            <Link href="/configurations/new">
              <Button leftIcon={<Plus />}>Yeni Konfigürasyon</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

