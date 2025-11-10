import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TemplateService } from '@/lib/services/template-service'
import { furnitureTemplate } from '@/lib/templates/furniture-template'

/**
 * POST /api/templates/seed
 * İlk template'leri (Mobilya) oluştur
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

    // Check if furniture template already exists
    const existing = await TemplateService.listTemplates({ industry: 'furniture' })
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Furniture template already exists',
        data: existing[0],
      })
    }

    // Create furniture template
    const template = await TemplateService.createTemplate(
      {
        name: furnitureTemplate.name,
        description: furnitureTemplate.description,
        industry: furnitureTemplate.industry,
        modules: furnitureTemplate.modules,
        configurations: furnitureTemplate.configurations,
        workflows: furnitureTemplate.workflows,
        custom_fields: furnitureTemplate.custom_fields,
        reports: furnitureTemplate.reports,
      },
      user.id
    )

    return NextResponse.json({
      success: true,
      message: 'Furniture template created successfully',
      data: template,
    })
  } catch (error: any) {
    console.error('Template seed error:', error)
    return NextResponse.json({ error: error.message || 'Failed to seed templates' }, { status: 500 })
  }
}




