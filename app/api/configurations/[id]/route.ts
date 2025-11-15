import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/configurations/[id]
 * Get configuration by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { data: configuration, error } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !configuration) {
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

    if (profile.role !== 'super_admin' && profile.company_id !== configuration.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ configuration })
  } catch (error: any) {
    console.error('[Configurations API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/configurations/[id]
 * Update configuration
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { name, natural_language_input, requirements, generated_code, file_path } = body

    // Check permissions
    const { data: configuration } = await supabase
      .from('configurations')
      .select('created_by, company_id')
      .eq('id', id)
      .single()

    if (!configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

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

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (natural_language_input !== undefined)
      updateData.natural_language_input = natural_language_input
    if (requirements !== undefined) updateData.requirements = requirements
    if (generated_code !== undefined) updateData.generated_code = generated_code
    if (file_path !== undefined) updateData.file_path = file_path

    const { data: updatedConfiguration, error } = await supabase
      .from('configurations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ configuration: updatedConfiguration })
  } catch (error: any) {
    console.error('[Configurations API] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
