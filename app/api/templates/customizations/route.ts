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

  const body = await request.json()
  const { template_id, base_template_id, name, customizations, company_id } = body

  // Validation
  if (!template_id || !name || !customizations) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create customization
  const { data: customization, error } = await supabase
    .from('template_customizations')
    .insert({
      template_id,
      base_template_id: base_template_id || template_id,
      name,
      customizations,
      created_by: user.id,
      company_id: company_id || null,
      version: '1.0.0',
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ customization })
}



