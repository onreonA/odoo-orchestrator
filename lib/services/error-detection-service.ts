/**
 * Error Detection Service
 *
 * Bu servis, test hatalarını ve sistem hatalarını tespit eder.
 */

import { TestResult, TestRun } from './test-runner-service'

export interface DetectedError {
  id: string
  type: 'test_failure' | 'performance' | 'syntax' | 'runtime' | 'database' | 'api' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location?: {
    file?: string
    line?: number
    function?: string
  }
  errorMessage?: string
  stackTrace?: string
  context?: any
  detectedAt: Date
  testRunId?: string
}

export class ErrorDetectionService {
  /**
   * Test sonuçlarından hataları tespit et
   */
  static detectErrorsFromTestRun(run: TestRun): DetectedError[] {
    const errors: DetectedError[] = []

    for (const result of run.results) {
      if (result.status === 'failed') {
        // Test failure hataları
        if (result.error) {
          errors.push({
            id: `error-${run.id}-${result.testType}`,
            type: 'test_failure',
            severity: result.failed > 10 ? 'critical' : result.failed > 5 ? 'high' : 'medium',
            title: `${result.testType} Test Başarısız`,
            description: `${result.failed} test başarısız oldu`,
            errorMessage: result.error,
            context: { ...result.details, testType: result.testType },
            detectedAt: new Date(),
            testRunId: run.id,
          })
        }

        // Performance hataları
        if (result.testType === 'performance' && result.duration > 300000) {
          errors.push({
            id: `error-${run.id}-performance`,
            type: 'performance',
            severity: 'high',
            title: 'Performans Sorunu',
            description: `Testler çok uzun sürüyor (${Math.round(result.duration / 1000)}s)`,
            detectedAt: new Date(),
            testRunId: run.id,
          })
        }
      }
    }

    return errors
  }

  /**
   * Error message'dan hata tipini belirle
   */
  static classifyError(errorMessage: string): DetectedError['type'] {
    const message = errorMessage.toLowerCase()

    if (message.includes('syntax') || message.includes('parse')) {
      return 'syntax'
    }
    if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return 'database'
    }
    if (message.includes('api') || message.includes('http') || message.includes('fetch')) {
      return 'api'
    }
    if (
      message.includes('timeout') ||
      message.includes('performance') ||
      message.includes('slow')
    ) {
      return 'performance'
    }
    if (
      message.includes('runtime') ||
      message.includes('cannot read') ||
      message.includes('undefined')
    ) {
      return 'runtime'
    }

    return 'unknown'
  }

  /**
   * Stack trace'den lokasyon bilgisi çıkar
   */
  static extractLocationFromStackTrace(stackTrace: string): DetectedError['location'] {
    if (!stackTrace) return undefined

    // Stack trace'den dosya ve satır bilgisini çıkar
    const lines = stackTrace.split('\n')
    for (const line of lines) {
      // Örnek: "at functionName (file.ts:123:45)"
      const match = line.match(/at\s+(\w+)\s+\((.+):(\d+):(\d+)\)/)
      if (match) {
        return {
          function: match[1],
          file: match[2],
          line: parseInt(match[3]),
        }
      }
    }

    return undefined
  }

  /**
   * Hata şiddetini belirle
   */
  static determineSeverity(error: DetectedError): DetectedError['severity'] {
    // Kritik hatalar
    if (
      error.type === 'database' ||
      error.type === 'syntax' ||
      (error.type === 'test_failure' && error.severity === 'critical')
    ) {
      return 'critical'
    }

    // Yüksek öncelikli hatalar
    if (error.type === 'api' || error.type === 'performance' || error.type === 'runtime') {
      return 'high'
    }

    // Orta öncelikli hatalar
    if (error.type === 'test_failure') {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Hataları filtrele ve önceliklendir
   */
  static prioritizeErrors(errors: DetectedError[]): DetectedError[] {
    return errors.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }
}
