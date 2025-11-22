import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { TemplateEvolutionService } from '@/lib/services/template-evolution-service'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: templateId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user can view evolution data
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin' && profile?.role !== 'consultant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const evolutionService = new TemplateEvolutionService()
    const analysis = await evolutionService.analyzeTemplate(templateId)

    return NextResponse.json({ analysis })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: templateId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user can apply recommendations
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin' && profile?.role !== 'consultant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { recommendation_id } = body

  try {
    const evolutionService = new TemplateEvolutionService()
    const result = await evolutionService.applyRecommendation(templateId, recommendation_id)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



