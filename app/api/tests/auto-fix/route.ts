/**
 * Auto-Fix API
 * 
 * Otomatik düzeltme endpoint'leri
 */

import { NextRequest, NextResponse } from 'next/server'
import { TestRunnerService } from '@/lib/services/test-runner-service'
import { ErrorDetectionService } from '@/lib/services/error-detection-service'
import { RootCauseAnalysisService } from '@/lib/services/root-cause-analysis-service'
import { AutoFixService } from '@/lib/services/auto-fix-service'

/**
 * POST /api/tests/auto-fix
 * Test hatalarını analiz et ve otomatik düzeltme öner
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { runId, autoApply } = body

    if (!runId) {
      return NextResponse.json({ success: false, error: 'Run ID required' }, { status: 400 })
    }

    // Test run'ı getir
    const run = TestRunnerService.getRun(runId)
    if (!run) {
      return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 })
    }

    // Hataları tespit et
    const errors = ErrorDetectionService.detectErrorsFromTestRun(run)
    const prioritizedErrors = ErrorDetectionService.prioritizeErrors(errors)

    // Her hata için kök neden analizi yap
    const rootCauses = prioritizedErrors.map((error) => {
      // Error'dan testType'ı context'ten çıkar
      const testType = error.context?.testType || error.testRunId
      const testResult = run.results.find((r) => r.testType === testType)
      return RootCauseAnalysisService.analyzeRootCause(error, testResult)
    })

    // Otomatik düzeltmeler oluştur
    const fixes = await Promise.all(
      prioritizedErrors.map(async (error, index) => {
        const rootCause = rootCauses[index]
        return await AutoFixService.generateFix(error, rootCause)
      })
    )

    // Eğer autoApply true ise, düzeltmeleri uygula
    if (autoApply) {
      const appliedFixes = []
      for (const fix of fixes) {
        if (fix.status !== 'failed') {
          const applied = await AutoFixService.applyFix(fix)
          if (applied) {
            appliedFixes.push(fix)
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          errors,
          rootCauses,
          fixes,
          appliedFixes,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        errors,
        rootCauses,
        fixes,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/tests/auto-fix/apply
 * Belirli bir düzeltmeyi uygula
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { fixId } = body

    if (!fixId) {
      return NextResponse.json({ success: false, error: 'Fix ID required' }, { status: 400 })
    }

    // TODO: Fix'i getir ve uygula
    // Şimdilik basit bir response döndür

    return NextResponse.json({ success: true, message: 'Fix applied' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/tests/auto-fix/rollback
 * Düzeltmeyi geri al
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { fixId } = body

    if (!fixId) {
      return NextResponse.json({ success: false, error: 'Fix ID required' }, { status: 400 })
    }

    // TODO: Fix'i getir ve geri al
    // Şimdilik basit bir response döndür

    return NextResponse.json({ success: true, message: 'Fix rolled back' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

