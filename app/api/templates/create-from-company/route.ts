import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TemplateService } from '@/lib/services/template-service'

/**
 * POST /api/templates/create-from-company
 * Mevcut firmadan template oluştur
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

    const body = await request.json()
    const { company_id, project_id, template_name, industry } = body

    if (!company_id || !template_name || !industry) {
      return NextResponse.json(
        { error: 'Missing required fields: company_id, template_name, industry' },
        { status: 400 }
      )
    }

    const template = await TemplateService.createTemplateFromCompany(
      company_id,
      project_id,
      template_name,
      industry,
      user.id
    )

    return NextResponse.json({ success: true, data: template })
  } catch (error: any) {
    console.error('Create template from company error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create template from company' },
      { status: 500 }
    )
  }
}




