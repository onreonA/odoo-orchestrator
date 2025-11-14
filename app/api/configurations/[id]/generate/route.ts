import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ConfigurationGeneratorAgent } from '@/lib/ai/agents/configuration-generator-agent'

/**
 * POST /api/configurations/[id]/generate
 * Generate configuration code using AI
 */
export async function POST(
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
    const { naturalLanguageInput, context } = body

    // Get configuration
    const { data: configuration, error: configError } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', id)
      .single()

    if (configError || !configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (
      profile.role !== 'super_admin' &&
      profile.role !== 'consultant' &&
      configuration.created_by !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate configuration using AI
    const generatorAgent = new ConfigurationGeneratorAgent(configuration.company_id)
    const generatedConfig = await generatorAgent.generateFromNaturalLanguage(
      naturalLanguageInput || configuration.natural_language_input || '',
      {
        companyId: configuration.company_id,
        departmentId: context?.departmentId,
        moduleId: context?.moduleId,
        existingConfigurations: context?.existingConfigurations,
        requirements: context?.requirements,
      }
    )

    // Update configuration with generated code
    await supabase
      .from('configurations')
      .update({
        generated_code: generatedConfig.generatedCode,
        file_path: generatedConfig.filePath,
        status: 'draft',
      })
      .eq('id', id)

    return NextResponse.json({ configuration: generatedConfig })
  } catch (error: any) {
    console.error('[Configurations Generate API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

