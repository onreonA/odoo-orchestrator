/**
 * Test Scheduler Service
 * 
 * Bu servis, testleri zamanlanmış olarak çalıştırmak için kullanılır.
 */

import { TestRunnerService, TestRun } from './test-runner-service'

export interface ScheduleConfig {
  /** Test tipi */
  testType: 'unit' | 'e2e' | 'visual' | 'performance' | 'all'
  /** Cron expression veya interval (dakika) */
  schedule: string | number
  /** Aktif mi? */
  enabled: boolean
}

export class TestSchedulerService {
  private static schedules: Map<string, ScheduleConfig> = new Map()
  private static intervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Zamanlanmış test ekle
   */
  static addSchedule(id: string, config: ScheduleConfig): void {
    this.schedules.set(id, config)

    if (config.enabled) {
      this.startSchedule(id, config)
    }
  }

  /**
   * Zamanlanmış testi başlat
   */
  private static startSchedule(id: string, config: ScheduleConfig): void {
    // Eğer zaten çalışıyorsa durdur
    this.stopSchedule(id)

    // Schedule'ı parse et
    let intervalMs: number

    if (typeof config.schedule === 'number') {
      // Dakika cinsinden interval
      intervalMs = config.schedule * 60 * 1000
    } else {
      // Cron expression (şimdilik basit interval olarak kullan)
      // TODO: Gerçek cron parser ekle
      intervalMs = 5 * 60 * 1000 // Varsayılan 5 dakika
    }

    // İlk çalıştırmayı hemen yap
    this.runScheduledTest(id, config)

    // Sonraki çalıştırmaları zamanla
    const interval = setInterval(() => {
      this.runScheduledTest(id, config)
    }, intervalMs)

    this.intervals.set(id, interval)
  }

  /**
   * Zamanlanmış testi durdur
   */
  static stopSchedule(id: string): void {
    const interval = this.intervals.get(id)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(id)
    }
  }

  /**
   * Zamanlanmış testi çalıştır
   */
  private static async runScheduledTest(id: string, config: ScheduleConfig): Promise<void> {
    console.log(`[Test Scheduler] Running scheduled test: ${id} (${config.testType})`)

    try {
      let run: TestRun

      switch (config.testType) {
        case 'unit':
          await TestRunnerService.runUnitTests()
          break
        case 'e2e':
          await TestRunnerService.runE2ETests()
          break
        case 'visual':
          await TestRunnerService.runVisualTests()
          break
        case 'performance':
          await TestRunnerService.runPerformanceTests()
          break
        case 'all':
          run = await TestRunnerService.runAllTests()
          break
      }

      console.log(`[Test Scheduler] Completed scheduled test: ${id}`)
    } catch (error: any) {
      console.error(`[Test Scheduler] Error running scheduled test ${id}:`, error.message)
    }
  }

  /**
   * Tüm schedule'ları başlat
   */
  static startAllSchedules(): void {
    for (const [id, config] of this.schedules.entries()) {
      if (config.enabled) {
        this.startSchedule(id, config)
      }
    }
  }

  /**
   * Tüm schedule'ları durdur
   */
  static stopAllSchedules(): void {
    for (const id of this.intervals.keys()) {
      this.stopSchedule(id)
    }
  }

  /**
   * Schedule'ı getir
   */
  static getSchedule(id: string): ScheduleConfig | undefined {
    return this.schedules.get(id)
  }

  /**
   * Tüm schedule'ları getir
   */
  static getAllSchedules(): Map<string, ScheduleConfig> {
    return this.schedules
  }

  /**
   * Schedule'ı sil
   */
  static removeSchedule(id: string): void {
    this.stopSchedule(id)
    this.schedules.delete(id)
  }

  /**
   * Varsayılan schedule'ları oluştur
   */
  static initializeDefaultSchedules(): void {
    // Her 5 dakikada bir kritik testler
    this.addSchedule('critical-tests', {
      testType: 'unit',
      schedule: 5, // 5 dakika
      enabled: false, // Varsayılan olarak kapalı
    })

    // Her gece tüm testler
    this.addSchedule('nightly-tests', {
      testType: 'all',
      schedule: 24 * 60, // 24 saat
      enabled: false,
    })

    // Her saat başı E2E testleri
    this.addSchedule('hourly-e2e', {
      testType: 'e2e',
      schedule: 60, // 60 dakika
      enabled: false,
    })
  }
}

