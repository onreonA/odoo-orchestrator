/**
 * Test Runs API
 * 
 * Test run geçmişini ve istatistiklerini getirir
 */

import { NextRequest, NextResponse } from 'next/server'
import { TestRunnerService } from '@/lib/services/test-runner-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const runId = searchParams.get('runId')

    if (runId) {
      const run = TestRunnerService.getRun(runId)
      if (!run) {
        return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: run })
    }

    const runs = TestRunnerService.getRecentRuns(limit)
    const stats = TestRunnerService.getStats()

    return NextResponse.json({
      success: true,
      data: {
        runs,
        stats,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

