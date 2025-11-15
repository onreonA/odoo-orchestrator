import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: templateId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateRange = searchParams.get('range') || '30' // days

  // Get analytics
  const { data: analytics, error } = await supabase
    .from('template_analytics')
    .select('*')
    .eq('template_id', templateId)
    .gte(
      'date',
      new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    )
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get deployment statistics
  const { data: deployments } = await supabase
    .from('template_deployments')
    .select('status, created_at, duration_seconds')
    .eq('template_id', templateId)

  // Get feedback statistics
  const { data: feedback } = await supabase
    .from('template_feedback')
    .select('rating, created_at')
    .eq('template_id', templateId)

  return NextResponse.json({
    analytics: analytics || [],
    deployments: deployments || [],
    feedback: feedback || [],
  })
}







