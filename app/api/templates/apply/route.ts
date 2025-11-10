import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TemplateService, ApplyTemplateInput } from '@/lib/services/template-service'

/**
 * POST /api/templates/apply
 * Template'i firmaya uygula
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

    const body: ApplyTemplateInput = await request.json()

    if (!body.template_id || !body.company_id || !body.odoo_config) {
      return NextResponse.json(
        { error: 'Missing required fields: template_id, company_id, odoo_config' },
        { status: 400 }
      )
    }

    const result = await TemplateService.applyTemplate(body, user.id)

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Template apply error:', error)
    return NextResponse.json({ error: error.message || 'Failed to apply template' }, { status: 500 })
  }
}




