/**
 * Test Analysis API
 * 
 * Test sonuçlarını analiz eder
 */

import { NextRequest, NextResponse } from 'next/server'
import { TestRunnerService } from '@/lib/services/test-runner-service'
import { TestAnalyzerService } from '@/lib/services/test-analyzer-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { runId } = body

    if (!runId) {
      return NextResponse.json({ success: false, error: 'Run ID required' }, { status: 400 })
    }

    const run = TestRunnerService.getRun(runId)
    if (!run) {
      return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 })
    }

    const analysis = TestAnalyzerService.analyzeRun(run)

    return NextResponse.json({ success: true, data: analysis })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const runs = TestRunnerService.getRecentRuns(limit)
    const analyses = runs.map((run) => TestAnalyzerService.analyzeRun(run))

    return NextResponse.json({ success: true, data: analyses })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

