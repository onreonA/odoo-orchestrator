import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user can create versions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin' && profile?.role !== 'consultant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { template_id, version, changelog, structure } = body

  // Validation
  if (!template_id || !version || !structure) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate version format
  const versionRegex = /^\d+\.\d+\.\d+$/
  if (!versionRegex.test(version)) {
    return NextResponse.json(
      { error: 'Invalid version format. Use semantic versioning (e.g., 1.0.0)' },
      { status: 400 }
    )
  }

  // Check if version already exists
  const { data: existingVersion } = await supabase
    .from('template_versions')
    .select('id')
    .eq('template_id', template_id)
    .eq('version', version)
    .single()

  if (existingVersion) {
    return NextResponse.json({ error: 'Version already exists' }, { status: 409 })
  }

  // Create version (new version becomes current, old current becomes non-current)
  const { data: versionData, error } = await supabase
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update old current version to non-current (trigger handles this, but we can also do it explicitly)
  await supabase
    .from('template_versions')
    .update({ is_current: false })
    .eq('template_id', template_id)
    .eq('is_current', true)
    .neq('id', versionData.id)

  return NextResponse.json({ version: versionData })
}
