import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { template_id, company_id, deployment_id, rating, feedback_text, issues, suggestions } =
    body

  // Validation
  if (!template_id || !company_id || !rating) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }

  // Simple sentiment analysis based on rating
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  if (rating >= 4) {
    sentiment = 'positive'
  } else if (rating <= 2) {
    sentiment = 'negative'
  }

  // Create feedback
  const { data: feedback, error } = await supabase
    .from('template_feedback')
    .insert({
      template_id,
      company_id,
      deployment_id: deployment_id || null,
      user_id: user.id,
      rating,
      feedback_text: feedback_text || null,
      issues: issues || null,
      suggestions: suggestions || null,
      sentiment,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update template analytics (async, don't wait)
  supabase
    .rpc('update_template_analytics', {
      p_template_id: template_id,
    })
    .catch(console.error)

  return NextResponse.json({ feedback })
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const templateId = searchParams.get('template_id')

  if (!templateId) {
    return NextResponse.json({ error: 'Missing template_id' }, { status: 400 })
  }

  // Get feedback
  const { data: feedback, error } = await supabase
    .from('template_feedback')
    .select(
      `
      *,
      user:profiles!template_feedback_user_id_fkey(id, full_name, email),
      company:companies(id, name)
    `
    )
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ feedback })
}





