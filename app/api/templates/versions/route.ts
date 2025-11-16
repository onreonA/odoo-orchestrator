import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createErrorResponse, logError, ApiErrors } from '@/lib/utils/api-error'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(createErrorResponse(ApiErrors.unauthorized()), { status: 401 })
    }

    // Check if user can create versions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logError('POST /api/templates/versions - Profile fetch error', profileError)
      return NextResponse.json(createErrorResponse(ApiErrors.internalError()), { status: 500 })
    }

    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'consultant')) {
      return NextResponse.json(createErrorResponse(ApiErrors.forbidden()), { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        createErrorResponse(ApiErrors.validationError('Invalid JSON body')),
        { status: 400 }
      )
    }

    const { template_id, version, changelog, structure } = body

    // Validation
    const missingFields: string[] = []
    if (!template_id) missingFields.push('template_id')
    if (!version) missingFields.push('version')
    if (!structure) missingFields.push('structure')

    if (missingFields.length > 0) {
      return NextResponse.json(createErrorResponse(ApiErrors.missingFields(missingFields)), {
        status: 400,
      })
    }

    // Validate version format
    const versionRegex = /^\d+\.\d+\.\d+$/
    if (!versionRegex.test(version)) {
      return NextResponse.json(
        createErrorResponse(
          ApiErrors.validationError('Invalid version format. Use semantic versioning (e.g., 1.0.0)')
        ),
        { status: 400 }
      )
    }

    // Validate structure is an object
    if (typeof structure !== 'object' || structure === null || Array.isArray(structure)) {
      return NextResponse.json(
        createErrorResponse(ApiErrors.validationError('Structure must be a valid object')),
        { status: 400 }
      )
    }

    // Check if version already exists
    const { data: existingVersion, error: checkError } = await supabase
      .from('template_versions')
      .select('id')
      .eq('template_id', template_id)
      .eq('version', version)
      .maybeSingle()

    if (checkError) {
      logError('POST /api/templates/versions - Version check error', checkError)
      return NextResponse.json(createErrorResponse(ApiErrors.internalError()), { status: 500 })
    }

    if (existingVersion) {
      return NextResponse.json(createErrorResponse(ApiErrors.conflict('Version already exists')), {
        status: 409,
      })
    }

    // Create version (new version becomes current, old current becomes non-current)
    const { data: versionData, error: insertError } = await supabase
      .from('template_versions')
      .insert({
        template_id,
        version,
        changelog: changelog || null,
        structure,
        is_current: true, // New version becomes current
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      logError('POST /api/templates/versions - Version insert error', insertError, {
        template_id,
        version,
      })
      return NextResponse.json(createErrorResponse(ApiErrors.internalError()), { status: 500 })
    }

    // Update old current version to non-current (trigger handles this, but we can also do it explicitly)
    const { error: updateError } = await supabase
      .from('template_versions')
      .update({ is_current: false })
      .eq('template_id', template_id)
      .eq('is_current', true)
      .neq('id', versionData.id)

    if (updateError) {
      logError('POST /api/templates/versions - Version update error', updateError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({ version: versionData })
  } catch (error: any) {
    logError('POST /api/templates/versions', error)
    return NextResponse.json(createErrorResponse(error), { status: 500 })
  }
}
