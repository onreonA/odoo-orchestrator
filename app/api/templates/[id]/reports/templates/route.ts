import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCustomReportBuilderService } from '@/lib/services/custom-report-builder-service'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: templateId } = await params

  try {
    const reportService = getCustomReportBuilderService()
    const templates = await reportService.getTemplates(user.id, templateId)

    return NextResponse.json({ templates })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: templateId } = await params
  const body = await request.json()

  try {
    const reportService = getCustomReportBuilderService()
    const template = await reportService.createTemplate({
      ...body,
      template_id: templateId,
      created_by: user.id,
    })

    return NextResponse.json({ template })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

