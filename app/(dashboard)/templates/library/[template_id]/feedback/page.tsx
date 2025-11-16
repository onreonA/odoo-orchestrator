import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MessageSquare, Star, AlertCircle } from 'lucide-react'
import { FeedbackForm } from '@/components/templates/feedback-form'
import { FeedbackList } from '@/components/templates/feedback-list'

export default async function TemplateFeedbackPage({
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

  // Get user profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Get template
  const { data: template, error } = await supabase
    .from('template_library')
    .select('*')
    .eq('template_id', template_id)
    .single()

  if (error || !template) {
    notFound()
  }

  // Get user's company
  const companyId = profile?.company_id

  // Get user's deployments for this template
  const { data: deployments } = await supabase
    .from('template_deployments')
    .select('id, status, created_at')
    .eq('template_id', template_id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get existing feedback for this template
  const { data: feedbackList } = await supabase
    .from('template_feedback')
    .select(
      `
      *,
      user:profiles!template_feedback_user_id_fkey(id, full_name, email),
      company:companies(id, name)
    `
    )
    .eq('template_id', template_id)
    .order('created_at', { ascending: false })

  // Get feedback statistics
  const { data: feedbackStats } = await supabase
    .from('template_feedback')
    .select('rating, sentiment')
    .eq('template_id', template_id)

  const stats = {
    total: feedbackList?.length || 0,
    avgRating: feedbackStats
      ? feedbackStats.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackStats.length
      : 0,
    positive: feedbackStats?.filter(f => f.sentiment === 'positive').length || 0,
    negative: feedbackStats?.filter(f => f.sentiment === 'negative').length || 0,
    neutral: feedbackStats?.filter(f => f.sentiment === 'neutral').length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          Template Feedback
        </h1>
        <p className="text-gray-600 mt-1">{template.name} için feedback ve değerlendirmeler</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Feedback</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <MessageSquare className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ortalama Rating</p>
              <p className="text-3xl font-bold mt-2 flex items-center gap-1">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
                {stats.avgRating > 0 && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pozitif</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats.positive}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50">
              <AlertCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Negatif</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats.negative}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      {companyId && (
        <FeedbackForm
          templateId={template_id}
          companyId={companyId}
          userId={user.id}
          deployments={deployments || []}
        />
      )}

      {/* Feedback List */}
      <FeedbackList templateId={template_id} feedbackList={feedbackList || []} userId={user.id} />
    </div>
  )
}
