/**
 * Test Run API
 * 
 * Manuel test çalıştırma endpoint'i
 */

import { NextRequest, NextResponse } from 'next/server'
import { TestRunnerService } from '@/lib/services/test-runner-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType } = body

    let result

    switch (testType) {
      case 'unit':
        result = await TestRunnerService.runUnitTests()
        break
      case 'e2e':
        result = await TestRunnerService.runE2ETests()
        break
      case 'visual':
        result = await TestRunnerService.runVisualTests()
        break
      case 'performance':
        result = await TestRunnerService.runPerformanceTests()
        break
      case 'all':
        const run = await TestRunnerService.runAllTests()
        return NextResponse.json({ success: true, data: run })
      default:
        return NextResponse.json({ success: false, error: 'Invalid test type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

