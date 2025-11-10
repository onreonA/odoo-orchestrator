import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TemplateService, CreateTemplateInput } from '@/lib/services/template-service'

/**
 * GET /api/templates
 * Template'leri listele
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry')
    const isActive = searchParams.get('is_active')

    const templates = await TemplateService.listTemplates({
      industry: industry || undefined,
      is_active: isActive === 'false' ? false : undefined,
    })

    return NextResponse.json({ success: true, data: templates })
  } catch (error: any) {
    console.error('Template list error:', error)
    return NextResponse.json({ error: error.message || 'Failed to list templates' }, { status: 500 })
  }
}

/**
 * POST /api/templates
 * Yeni template oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateTemplateInput = await request.json()

    if (!body.name || !body.industry || !body.modules) {
      return NextResponse.json(
        { error: 'Missing required fields: name, industry, modules' },
        { status: 400 }
      )
    }

    const template = await TemplateService.createTemplate(body, user.id)

    return NextResponse.json({ success: true, data: template })
  } catch (error: any) {
    console.error('Template creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create template' }, { status: 500 })
  }
}




