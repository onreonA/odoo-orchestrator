import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, customizations } = body

  // Get customization
  const { data: existingCustomization, error: fetchError } = await supabase
    .from('template_customizations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existingCustomization) {
    return NextResponse.json({ error: 'Customization not found' }, { status: 404 })
  }

  // Check ownership
  if (existingCustomization.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update customization
  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (customizations !== undefined) {
    updateData.customizations = customizations
    // Increment version
    const currentVersion = existingCustomization.version.split('.')
    const patchVersion = parseInt(currentVersion[2] || '0') + 1
    updateData.version = `${currentVersion[0]}.${currentVersion[1]}.${patchVersion}`
  }

  const { data: customization, error } = await supabase
    .from('template_customizations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ customization })
}





