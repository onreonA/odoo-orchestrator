import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getReportExportService } from '@/lib/services/report-export-service'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: templateId } = await params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'pdf' // 'pdf' or 'excel'
  const startDate =
    searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const endDate = searchParams.get('end_date') || new Date().toISOString()

  const exportService = getReportExportService()

  try {
    let blob: Blob
    let contentType: string
    let filename: string

    if (format === 'excel') {
      blob = await exportService.generateExcelReport(templateId, startDate, endDate)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = `template-analytics-${templateId}-${startDate}-${endDate}.csv`
    } else {
      blob = await exportService.generatePDFReport(templateId, startDate, endDate)
      contentType = 'application/pdf'
      filename = `template-analytics-${templateId}-${startDate}-${endDate}.pdf`
    }

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



