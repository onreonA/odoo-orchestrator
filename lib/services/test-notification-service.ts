/**
 * Test Notification Service
 * 
 * Bu servis, test sonuçları için bildirimler gönderir.
 */

import { TestRun, TestResult } from './test-runner-service'
import { TestAnalysis } from './test-analyzer-service'

export interface Notification {
  id: string
  type: 'test_failed' | 'test_passed' | 'test_completed' | 'critical_issue'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  testRunId?: string
  details?: any
}

export class TestNotificationService {
  private static notifications: Notification[] = []

  /**
   * Test sonuçlarına göre bildirim oluştur
   */
  static createNotifications(run: TestRun, analysis?: TestAnalysis): Notification[] {
    const notifications: Notification[] = []

    // Başarısız testler için bildirim
    const failedResults = run.results.filter((r) => r.status === 'failed')
    if (failedResults.length > 0) {
      const totalFailed = failedResults.reduce((sum, r) => sum + r.failed, 0)
      
      notifications.push({
        id: `notification-${run.id}-failed`,
        type: 'test_failed',
        title: `${totalFailed} Test Başarısız`,
        message: `${run.testType} testlerinde ${totalFailed} başarısız test var`,
        severity: totalFailed > 10 ? 'critical' : totalFailed > 5 ? 'high' : 'medium',
        timestamp: new Date(),
        testRunId: run.id,
        details: { failedResults },
      })
    }

    // Kritik sorunlar için bildirim
    if (analysis && analysis.issues.some((i) => i.severity === 'critical')) {
      const criticalIssues = analysis.issues.filter((i) => i.severity === 'critical')
      
      notifications.push({
        id: `notification-${run.id}-critical`,
        type: 'critical_issue',
        title: 'Kritik Sorunlar Tespit Edildi',
        message: `${criticalIssues.length} kritik sorun bulundu`,
        severity: 'critical',
        timestamp: new Date(),
        testRunId: run.id,
        details: { issues: criticalIssues },
      })
    }

    // Tüm testler başarılıysa bildirim
    if (run.status === 'completed' && failedResults.length === 0) {
      const totalPassed = run.results.reduce((sum, r) => sum + r.passed, 0)
      
      notifications.push({
        id: `notification-${run.id}-passed`,
        type: 'test_passed',
        title: 'Tüm Testler Başarılı',
        message: `${totalPassed} test başarıyla tamamlandı`,
        severity: 'low',
        timestamp: new Date(),
        testRunId: run.id,
      })
    }

    // Bildirimleri kaydet
    notifications.forEach((n) => this.notifications.push(n))

    return notifications
  }

  /**
   * Bildirimleri getir
   */
  static getNotifications(limit: number = 20): Notification[] {
    return this.notifications
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Kritik bildirimleri getir
   */
  static getCriticalNotifications(): Notification[] {
    return this.notifications.filter((n) => n.severity === 'critical' || n.severity === 'high')
  }

  /**
   * Bildirimi sil
   */
  static removeNotification(id: string): void {
    const index = this.notifications.findIndex((n) => n.id === id)
    if (index > -1) {
      this.notifications.splice(index, 1)
    }
  }

  /**
   * Tüm bildirimleri temizle
   */
  static clearNotifications(): void {
    this.notifications = []
  }

  /**
   * Console'a bildirim yazdır (geliştirme için)
   */
  static logNotification(notification: Notification): void {
    const emoji = {
      test_failed: '❌',
      test_passed: '✅',
      test_completed: '📊',
      critical_issue: '🚨',
    }[notification.type] || '📢'

    console.log(`${emoji} [${notification.severity.toUpperCase()}] ${notification.title}`)
    console.log(`   ${notification.message}`)
    if (notification.details) {
      console.log(`   Details:`, notification.details)
    }
  }
}

