import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfigurationTemplateService } from '@/lib/services/configuration-template-service'

/**
 * GET /api/configuration-templates/[id]
 * Get template by ID
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
    const templateService = getConfigurationTemplateService()
    const template = await templateService.getTemplateById(id)

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('[Configuration Templates API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/configuration-templates/[id]
 * Update template
 */
export async function PUT(
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
    const body = await request.json()
    const { name, description, industry, department_types, template_config, variables, is_public } = body

    const templateService = getConfigurationTemplateService()
    const template = await templateService.updateTemplate(id, {
      name,
      description,
      industry,
      department_types,
      template_config,
      variables,
      is_public,
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('[Configuration Templates API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/configuration-templates/[id]
 * Delete template
 */
export async function DELETE(
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
    const templateService = getConfigurationTemplateService()
    await templateService.deleteTemplate(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Configuration Templates API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


