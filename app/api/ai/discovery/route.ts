import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryAgent } from '@/lib/ai/agents/discovery-agent'

/**
 * POST /api/ai/discovery
 * Discovery Agent'ı çalıştır - Ses kaydını analiz et ve rapor oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const companyId = formData.get('companyId') as string | null
    const projectId = formData.get('projectId') as string | null

    if (!audioFile || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: audio, companyId' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Run Discovery Agent
    const agent = new DiscoveryAgent(companyId, projectId || undefined)
    const result = await agent.runFullDiscovery(buffer)

    // Save to database
    const { error: dbError } = await supabase.from('discoveries').insert({
      company_id: companyId,
      project_id: projectId || null,
      meeting_transcript: result.transcript,
      extracted_info: result.extractedInfo,
      module_suggestions: result.moduleSuggestions,
      report_content: result.report,
      status: 'completed',
      created_by: user.id,
    })

    if (dbError) {
      console.error('Database error:', dbError)
      // Continue even if DB save fails
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Discovery Agent Error:', error)
    return NextResponse.json({ error: error.message || 'Discovery failed' }, { status: 500 })
  }
}
