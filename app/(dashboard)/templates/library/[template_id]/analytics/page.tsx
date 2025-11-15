import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BarChart3, TrendingUp, Users, CheckCircle } from 'lucide-react'
import { AnalyticsDashboard } from '@/components/templates/analytics-dashboard'

export default async function TemplateAnalyticsPage({
  params,
}: {
  params: Promise<{ template_id: string }>
}) {
  const supabase = await createClient()
  const { template_id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get template
  const { data: template, error } = await supabase
    .from('template_library')
    .select('*')
    .eq('template_id', template_id)
    .single()

  if (error || !template) {
    notFound()
  }

  // Get analytics data
  const { data: analytics } = await supabase
    .from('template_analytics')
    .select('*')
    .eq('template_id', template_id)
    .order('date', { ascending: false })
    .limit(90) // Last 90 days

  // Get deployment statistics
  const { data: deployments } = await supabase
    .from('template_deployments')
    .select('status, created_at, duration_seconds')
    .eq('template_id', template_id)

  // Get feedback statistics
  const { data: feedback } = await supabase
    .from('template_feedback')
    .select('rating, created_at')
    .eq('template_id', template_id)

  // Get usage count
  const { data: usageCount } = await supabase
    .from('template_library')
    .select('usage_count')
    .eq('template_id', template_id)
    .single()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Template Analytics
        </h1>
        <p className="text-gray-600 mt-1">
          {template.name} - Kullanım istatistikleri ve performans metrikleri
        </p>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        templateId={template_id}
        templateName={template.name}
        analytics={analytics || []}
        deployments={deployments || []}
        feedback={feedback || []}
        usageCount={usageCount?.usage_count || 0}
      />
    </div>
  )
}

