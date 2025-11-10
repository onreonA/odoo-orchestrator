import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TemplateService } from '@/lib/services/template-service'

/**
 * GET /api/templates/[id]
 * Template'i ID ile getir
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const template = await TemplateService.getTemplateById(id)

    return NextResponse.json({ success: true, data: template })
  } catch (error: any) {
    console.error('Template get error:', error)
    return NextResponse.json({ error: error.message || 'Template not found' }, { status: 404 })
  }
}




