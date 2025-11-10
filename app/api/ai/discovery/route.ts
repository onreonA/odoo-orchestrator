import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DiscoveryAgent } from '@/lib/ai/agents/discovery-agent'

/**
 * POST /api/ai/discovery
 * Discovery Agent'ı çalıştır - Ses kaydını analiz et ve rapor oluştur
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[Discovery API] Request started')

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

    // Run Discovery Agent - Pass File directly to preserve MIME type and filename
    // This is important for m4a and other formats
    console.log('[Discovery API] Starting Discovery Agent...', {
      companyId,
      projectId: projectId || null,
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
    })
    
    const agent = new DiscoveryAgent(companyId, projectId || undefined)
    let result
    try {
      result = await agent.runFullDiscovery(audioFile)
      console.log('[Discovery API] Discovery Agent completed:', {
        transcriptLength: result.transcript?.length || 0,
        transcriptPreview: result.transcript?.substring(0, 200) || 'N/A',
        hasExtractedInfo: !!result.extractedInfo,
        hasModuleSuggestions: !!result.moduleSuggestions,
        reportLength: result.report?.length || 0,
      })
    } catch (agentError: any) {
      console.error('[Discovery API] Discovery Agent error:', {
        message: agentError.message,
        stack: agentError.stack,
      })
      
      // Check if error is about short/invalid transcript
      if (agentError.message.includes('çok kısa') || agentError.message.includes('Transkript')) {
        return NextResponse.json(
          {
            success: false,
            error: agentError.message || 'Transkript çok kısa veya geçersiz',
            details: 'Lütfen gerçek bir toplantı ses kaydı yükleyin. Müzik dosyası veya çok kısa kayıtlar kabul edilmez.',
          },
          { status: 400 }
        )
      }
      
      throw new Error(`Discovery Agent failed: ${agentError.message || 'Unknown error'}`)
    }

    // Validate transcript before processing
    if (!result.transcript || result.transcript.trim().length === 0) {
      console.error('[Discovery API] ERROR: Empty transcript received!')
      throw new Error('Transcription failed: Empty transcript received from Whisper API')
    }

    console.log('[Discovery API] Transcript validation:', {
      length: result.transcript.length,
      preview: result.transcript.substring(0, 200),
      fullTranscript: result.transcript, // DEBUG: Tam transkripti logla
      isEmpty: result.transcript.trim().length === 0,
    })

    // Extract processes, pain points, opportunities from extractedInfo
    console.log('[Discovery API] Extracting data from result...')
    const extractedInfo = result.extractedInfo as any
    const processes = extractedInfo?.processes?.map((p: any) => p.name || p) || []
    const painPoints = extractedInfo?.processes?.flatMap((p: any) => p.painPoints || []) || []
    const opportunities = extractedInfo?.requirements?.filter((r: any) => r.priority === 'high').map((r: any) => r.description) || []

    console.log('[Discovery API] Extracted data:', {
      processesCount: processes.length,
      painPointsCount: painPoints.length,
      opportunitiesCount: opportunities.length,
    })

    // Save to database
    console.log('[Discovery API] Saving to database...', {
      companyId,
      projectId: projectId || null,
      transcriptLength: result.transcript?.length || 0,
      userId: user.id,
    })
    
    const insertData: any = {
      company_id: companyId,
      transcript: result.transcript,
      extracted_processes: processes,
      extracted_requirements: extractedInfo?.requirements || {},
      pain_points: painPoints,
      opportunities: opportunities,
      ai_summary: extractedInfo,
      analysis_status: 'completed',
      completion_percentage: 100,
      created_by: user.id,
    }
    
    // Only add project_id if it exists (now nullable)
    if (projectId) {
      insertData.project_id = projectId
    }
    
    const { data: discovery, error: dbError } = await supabase
      .from('discoveries')
      .insert(insertData)
      .select()
      .single()

    if (dbError) {
      console.error('[Discovery API] Database error:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
      })
      // Continue even if DB save fails, but log it
      return NextResponse.json({
        success: true,
        data: {
          ...result,
          id: null,
          warning: `Discovery completed but failed to save to database: ${dbError.message}`,
        },
      })
    }

    const duration = Date.now() - startTime
    console.log(`[Discovery API] Success! Duration: ${duration}ms, Discovery ID: ${discovery?.id}`)

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        id: discovery?.id,
      },
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`[Discovery API] Error after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      { 
        error: error.message || 'Discovery failed',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
