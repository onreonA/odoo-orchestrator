import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user can rollback versions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin' && profile?.role !== 'consultant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get version to rollback to
  const { data: version, error: fetchError } = await supabase
    .from('template_versions')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !version) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }

  // Set this version as current
  const { data: updatedVersion, error } = await supabase
    .from('template_versions')
    .update({ is_current: true })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update template_library structure to match this version
  await supabase
    .from('template_library')
    .update({ structure: version.structure })
    .eq('template_id', version.template_id)

  // Set other versions to non-current
  await supabase
    .from('template_versions')
    .update({ is_current: false })
    .eq('template_id', version.template_id)
    .neq('id', id)

  return NextResponse.json({ version: updatedVersion })
}


