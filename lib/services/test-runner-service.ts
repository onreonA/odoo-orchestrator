/**
 * Test Runner Service
 * 
 * Bu servis, testleri çalıştırmak ve sonuçlarını analiz etmek için kullanılır.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { TestNotificationService } from './test-notification-service'
import { TestAnalyzerService } from './test-analyzer-service'

const execAsync = promisify(exec)

export interface TestResult {
  testType: 'unit' | 'e2e' | 'visual' | 'performance'
  status: 'passed' | 'failed' | 'running' | 'skipped'
  passed: number
  failed: number
  skipped: number
  duration: number
  timestamp: Date
  error?: string
  details?: any
}

export interface TestRun {
  id: string
  testType: 'unit' | 'e2e' | 'visual' | 'performance' | 'all'
  status: 'running' | 'completed' | 'failed'
  results: TestResult[]
  startedAt: Date
  completedAt?: Date
  triggeredBy: 'scheduled' | 'manual' | 'webhook'
}

export class TestRunnerService {
  private static runs: Map<string, TestRun> = new Map()

  /**
   * Unit testleri çalıştır
   */
  static async runUnitTests(): Promise<TestResult> {
    const startTime = Date.now()
    try {
      const { stdout, stderr } = await execAsync('npm run test', {
        cwd: process.cwd(),
        timeout: 300000, // 5 dakika timeout
      })

      // Parse test results from stdout
      const passedMatch = stdout.match(/(\d+)\s+passed/)
      const failedMatch = stdout.match(/(\d+)\s+failed/)
      const skippedMatch = stdout.match(/(\d+)\s+skipped/)

      return {
        testType: 'unit',
        status: failedMatch && parseInt(failedMatch[1]) > 0 ? 'failed' : 'passed',
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        details: { stdout, stderr },
      }
    } catch (error: any) {
      return {
        testType: 'unit',
        status: 'failed',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message,
        details: { stderr: error.stderr, stdout: error.stdout },
      }
    }
  }

  /**
   * E2E testleri çalıştır
   */
  static async runE2ETests(): Promise<TestResult> {
    const startTime = Date.now()
    try {
      const { stdout, stderr } = await execAsync('npm run test:e2e', {
        cwd: process.cwd(),
        timeout: 600000, // 10 dakika timeout
      })

      // Parse Playwright test results
      const passedMatch = stdout.match(/(\d+)\s+passed/)
      const failedMatch = stdout.match(/(\d+)\s+failed/)
      const skippedMatch = stdout.match(/(\d+)\s+skipped/)

      return {
        testType: 'e2e',
        status: failedMatch && parseInt(failedMatch[1]) > 0 ? 'failed' : 'passed',
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        details: { stdout, stderr },
      }
    } catch (error: any) {
      return {
        testType: 'e2e',
        status: 'failed',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message,
        details: { stderr: error.stderr, stdout: error.stdout },
      }
    }
  }

  /**
   * Visual regression testleri çalıştır
   */
  static async runVisualTests(): Promise<TestResult> {
    const startTime = Date.now()
    try {
      const { stdout, stderr } = await execAsync('npm run test:e2e:visual', {
        cwd: process.cwd(),
        timeout: 600000, // 10 dakika timeout
      })

      const passedMatch = stdout.match(/(\d+)\s+passed/)
      const failedMatch = stdout.match(/(\d+)\s+failed/)

      return {
        testType: 'visual',
        status: failedMatch && parseInt(failedMatch[1]) > 0 ? 'failed' : 'passed',
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        skipped: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        details: { stdout, stderr },
      }
    } catch (error: any) {
      return {
        testType: 'visual',
        status: 'failed',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message,
        details: { stderr: error.stderr, stdout: error.stdout },
      }
    }
  }

  /**
   * Performance testleri çalıştır
   */
  static async runPerformanceTests(): Promise<TestResult> {
    const startTime = Date.now()
    try {
      const { stdout, stderr } = await execAsync('npm run test:e2e:performance', {
        cwd: process.cwd(),
        timeout: 600000, // 10 dakika timeout
      })

      const passedMatch = stdout.match(/(\d+)\s+passed/)
      const failedMatch = stdout.match(/(\d+)\s+failed/)

      return {
        testType: 'performance',
        status: failedMatch && parseInt(failedMatch[1]) > 0 ? 'failed' : 'passed',
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        skipped: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        details: { stdout, stderr },
      }
    } catch (error: any) {
      return {
        testType: 'performance',
        status: 'failed',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message,
        details: { stderr: error.stderr, stdout: error.stdout },
      }
    }
  }

  /**
   * Tüm testleri çalıştır
   */
  static async runAllTests(): Promise<TestRun> {
    const runId = `run-${Date.now()}`
    const run: TestRun = {
      id: runId,
      testType: 'all',
      status: 'running',
      results: [],
      startedAt: new Date(),
      triggeredBy: 'manual',
    }

    this.runs.set(runId, run)

    try {
      // Run tests sequentially
      const unitResult = await this.runUnitTests()
      run.results.push(unitResult)

      const e2eResult = await this.runE2ETests()
      run.results.push(e2eResult)

      const visualResult = await this.runVisualTests()
      run.results.push(visualResult)

      const performanceResult = await this.runPerformanceTests()
      run.results.push(performanceResult)

      run.status = run.results.some((r) => r.status === 'failed') ? 'failed' : 'completed'
      run.completedAt = new Date()

      // Analiz et ve bildirim oluştur
      const analysis = TestAnalyzerService.analyzeRun(run)
      TestNotificationService.createNotifications(run, analysis)

      return run
    } catch (error: any) {
      run.status = 'failed'
      run.completedAt = new Date()
      throw error
    }
  }

  /**
   * Test run'ı getir
   */
  static getRun(runId: string): TestRun | undefined {
    return this.runs.get(runId)
  }

  /**
   * Son N test run'ını getir
   */
  static getRecentRuns(limit: number = 10): TestRun[] {
    return Array.from(this.runs.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit)
  }

  /**
   * Test istatistiklerini getir
   */
  static getStats(): {
    totalRuns: number
    successRate: number
    averageDuration: number
    lastRun?: TestRun
  } {
    const runs = Array.from(this.runs.values())
    const completedRuns = runs.filter((r) => r.status !== 'running')
    const successfulRuns = completedRuns.filter((r) => r.status === 'completed')

    const totalDuration = completedRuns.reduce((sum, r) => {
      if (r.completedAt) {
        return sum + (r.completedAt.getTime() - r.startedAt.getTime())
      }
      return sum
    }, 0)

    return {
      totalRuns: runs.length,
      successRate: completedRuns.length > 0 ? (successfulRuns.length / completedRuns.length) * 100 : 0,
      averageDuration: completedRuns.length > 0 ? totalDuration / completedRuns.length : 0,
      lastRun: runs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0],
    }
  }
}

