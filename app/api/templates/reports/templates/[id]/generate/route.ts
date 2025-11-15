import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCustomReportBuilderService } from '@/lib/services/custom-report-builder-service'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const reportService = getCustomReportBuilderService()
    const blob = await reportService.generateReport(id)

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="custom-report-${id}.csv"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
