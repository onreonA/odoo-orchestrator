import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConfigurationTemplateService } from '@/lib/services/configuration-template-service'

/**
 * GET /api/configuration-templates
 * List configuration templates
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
    const category = searchParams.get('category') as
      | 'model'
      | 'view'
      | 'workflow'
      | 'security'
      | 'report'
      | null
    const industry = searchParams.get('industry')
    const departmentType = searchParams.get('department_type')
    const isPublic = searchParams.get('is_public') === 'true'
    const search = searchParams.get('search')

    const templateService = getConfigurationTemplateService()
    const templates = await templateService.getTemplates({
      category: category || undefined,
      industry: industry || undefined,
      department_type: departmentType || undefined,
      is_public: isPublic || undefined,
      search: search || undefined,
    })

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('[Configuration Templates API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/configuration-templates
 * Create a new configuration template
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
    const { name, description, category, industry, department_types, template_config, variables, is_public } = body

    if (!name || !category || !template_config) {
      return NextResponse.json(
        { error: 'name, category, and template_config are required' },
        { status: 400 }
      )
    }

    const templateService = getConfigurationTemplateService()
    const template = await templateService.createTemplate({
      name,
      description,
      category,
      industry,
      department_types,
      template_config,
      variables,
      is_public,
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error('[Configuration Templates API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

