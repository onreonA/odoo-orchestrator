import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Sparkles, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { EvolutionDashboard } from '@/components/templates/evolution-dashboard'

export default async function TemplateEvolutionPage({
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

  // Check if user can view evolution
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin' && profile?.role !== 'consultant') {
    redirect(`/templates/library/${template_id}`)
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

  // Fetch evolution analysis
  let evolutionAnalysis = null
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/templates/${template_id}/evolution`,
      {
        headers: {
          Cookie: `sb-access-token=${user.id}`, // Simplified, should use proper auth
        },
      }
    )
    if (response.ok) {
      evolutionAnalysis = await response.json()
    }
  } catch (error) {
    console.error('Error fetching evolution analysis:', error)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8" />
          Template Evolution
        </h1>
        <p className="text-gray-600 mt-1">
          {template.name} - Otomatik iyileştirme önerileri ve analiz
        </p>
      </div>

      {/* Evolution Dashboard */}
      <EvolutionDashboard
        templateId={template_id}
        templateName={template.name}
        analysis={evolutionAnalysis?.analysis}
      />
    </div>
  )
}



