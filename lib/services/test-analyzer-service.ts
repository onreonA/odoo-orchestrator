/**
 * Test Analyzer Service
 * 
 * Bu servis, test sonuçlarını analiz eder ve öneriler sunar.
 */

import { TestRun, TestResult } from './test-runner-service'

export interface TestAnalysis {
  runId: string
  overallStatus: 'healthy' | 'warning' | 'critical'
  summary: string
  issues: TestIssue[]
  recommendations: string[]
  trends: TrendAnalysis
}

export interface TestIssue {
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'failure' | 'performance' | 'coverage' | 'flaky'
  description: string
  testType: string
  recommendation?: string
}

export interface TrendAnalysis {
  successRate: number
  trend: 'improving' | 'stable' | 'degrading'
  averageDuration: number
  durationTrend: 'faster' | 'stable' | 'slower'
}

export class TestAnalyzerService {
  /**
   * Test run'ını analiz et
   */
  static analyzeRun(run: TestRun): TestAnalysis {
    const issues: TestIssue[] = []
    const recommendations: string[] = []

    // Test sonuçlarını analiz et
    for (const result of run.results) {
      // Başarısız testler
      if (result.status === 'failed') {
        issues.push({
          severity: result.failed > 10 ? 'critical' : result.failed > 5 ? 'high' : 'medium',
          type: 'failure',
          description: `${result.testType} testlerinde ${result.failed} başarısız test var`,
          testType: result.testType,
          recommendation: `${result.testType} testlerini kontrol edin ve düzeltin`,
        })
      }

      // Performans sorunları
      if (result.testType === 'performance' && result.status === 'failed') {
        issues.push({
          severity: 'high',
          type: 'performance',
          description: 'Performans testleri başarısız',
          testType: 'performance',
          recommendation: 'Sayfa yükleme sürelerini ve API response time\'larını kontrol edin',
        })
      }

      // Süre analizi
      if (result.duration > 300000) {
        // 5 dakikadan uzun
        issues.push({
          severity: 'medium',
          type: 'performance',
          description: `${result.testType} testleri çok uzun sürüyor (${Math.round(result.duration / 1000)}s)`,
          testType: result.testType,
          recommendation: 'Test optimizasyonu yapın veya paralel çalıştırın',
        })
      }
    }

    // Öneriler oluştur
    if (issues.length === 0) {
      recommendations.push('Tüm testler başarılı! 🎉')
    } else {
      const criticalIssues = issues.filter((i) => i.severity === 'critical')
      if (criticalIssues.length > 0) {
        recommendations.push('Kritik sorunlar var, hemen düzeltilmesi gerekiyor')
      }

      const highIssues = issues.filter((i) => i.severity === 'high')
      if (highIssues.length > 0) {
        recommendations.push('Yüksek öncelikli sorunlar var, bugün içinde düzeltilmeli')
      }
    }

    // Trend analizi (basit)
    const successRate = run.results.reduce((sum, r) => {
      const total = r.passed + r.failed
      return sum + (total > 0 ? (r.passed / total) * 100 : 100)
    }, 0) / run.results.length

    const averageDuration = run.results.reduce((sum, r) => sum + r.duration, 0) / run.results.length

    // Overall status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (issues.some((i) => i.severity === 'critical')) {
      overallStatus = 'critical'
    } else if (issues.some((i) => i.severity === 'high')) {
      overallStatus = 'warning'
    }

    return {
      runId: run.id,
      overallStatus,
      summary: this.generateSummary(run, issues),
      issues,
      recommendations,
      trends: {
        successRate,
        trend: 'stable', // TODO: Geçmiş verilerle karşılaştır
        averageDuration,
        durationTrend: 'stable', // TODO: Geçmiş verilerle karşılaştır
      },
    }
  }

  /**
   * Özet oluştur
   */
  private static generateSummary(run: TestRun, issues: TestIssue[]): string {
    const totalTests = run.results.reduce((sum, r) => sum + r.passed + r.failed, 0)
    const totalPassed = run.results.reduce((sum, r) => sum + r.passed, 0)
    const totalFailed = run.results.reduce((sum, r) => sum + r.failed, 0)

    if (totalFailed === 0) {
      return `✅ Tüm testler başarılı (${totalPassed} test)`
    }

    return `⚠️ ${totalFailed} başarısız test, ${totalPassed} başarılı test (Toplam: ${totalTests})`
  }

  /**
   * Flaky testleri tespit et
   */
  static detectFlakyTests(runs: TestRun[]): string[] {
    // TODO: Geçmiş test run'larını analiz ederek flaky testleri tespit et
    return []
  }

  /**
   * Performans trend analizi
   */
  static analyzePerformanceTrend(runs: TestRun[]): TrendAnalysis {
    if (runs.length === 0) {
      return {
        successRate: 100,
        trend: 'stable',
        averageDuration: 0,
        durationTrend: 'stable',
      }
    }

    const performanceResults = runs
      .flatMap((r) => r.results)
      .filter((r) => r.testType === 'performance')

    if (performanceResults.length === 0) {
      return {
        successRate: 100,
        trend: 'stable',
        averageDuration: 0,
        durationTrend: 'stable',
      }
    }

    const successRate =
      performanceResults.reduce((sum, r) => {
        const total = r.passed + r.failed
        return sum + (total > 0 ? (r.passed / total) * 100 : 100)
      }, 0) / performanceResults.length

    const averageDuration = performanceResults.reduce((sum, r) => sum + r.duration, 0) / performanceResults.length

    return {
      successRate,
      trend: 'stable', // TODO: Geçmiş verilerle karşılaştır
      averageDuration,
      durationTrend: 'stable', // TODO: Geçmiş verilerle karşılaştır
    }
  }
}

