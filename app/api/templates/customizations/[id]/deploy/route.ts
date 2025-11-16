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

  // Get customization
  const { data: customization, error: fetchError } = await supabase
    .from('template_customizations')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !customization) {
    return NextResponse.json({ error: 'Customization not found' }, { status: 404 })
  }

  // Check ownership
  if (customization.created_by !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update status to active
  const { data: updatedCustomization, error } = await supabase
    .from('template_customizations')
    .update({ status: 'active' })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: Trigger deployment using TemplateDeploymentEngine
  // For now, just return success
  return NextResponse.json({
    customization: updatedCustomization,
    message: 'Deployment will be triggered',
  })
}
