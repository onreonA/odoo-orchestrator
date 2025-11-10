/**
 * Root Cause Analysis Service
 * 
 * Bu servis, hataların kök nedenlerini analiz eder.
 */

import { DetectedError } from './error-detection-service'
import { TestResult } from './test-runner-service'

export interface RootCause {
  id: string
  errorId: string
  category: 'code' | 'configuration' | 'dependency' | 'environment' | 'data' | 'unknown'
  description: string
  confidence: number // 0-1 arası
  evidence: string[]
  suggestedFix?: string
  relatedErrors?: string[]
}

export class RootCauseAnalysisService {
  /**
   * Hatanın kök nedenini analiz et
   */
  static analyzeRootCause(error: DetectedError, testResult?: TestResult): RootCause {
    const evidence: string[] = []
    let category: RootCause['category'] = 'unknown'
    let description = ''
    let confidence = 0.5
    let suggestedFix: string | undefined

    // Error message analizi
    if (error.errorMessage) {
      evidence.push(`Error message: ${error.errorMessage}`)

      // Syntax errors
      if (error.type === 'syntax') {
        category = 'code'
        description = 'Syntax hatası tespit edildi. Kod yapısında sorun var.'
        confidence = 0.9
        suggestedFix = 'Syntax hatasını düzeltmek için kod yapısını kontrol edin.'
      }

      // Database errors
      if (error.type === 'database') {
        category = 'data'
        description = 'Database hatası tespit edildi. Veri veya sorgu sorunu olabilir.'
        confidence = 0.8
        suggestedFix = 'Database sorgusunu ve veri yapısını kontrol edin.'
      }

      // API errors
      if (error.type === 'api') {
        category = 'configuration'
        description = 'API hatası tespit edildi. Endpoint veya konfigürasyon sorunu olabilir.'
        confidence = 0.7
        suggestedFix = 'API endpoint\'lerini ve konfigürasyonları kontrol edin.'
      }

      // Performance errors
      if (error.type === 'performance') {
        category = 'code'
        description = 'Performans sorunu tespit edildi. Kod optimizasyonu gerekebilir.'
        confidence = 0.6
        suggestedFix = 'Performans optimizasyonu yapın veya caching ekleyin.'
      }

      // Runtime errors
      if (error.type === 'runtime') {
        category = 'code'
        description = 'Runtime hatası tespit edildi. Kod mantığında sorun olabilir.'
        confidence = 0.75
        suggestedFix = 'Kod mantığını ve null/undefined kontrollerini gözden geçirin.'
      }
    }

    // Location analizi
    if (error.location) {
      evidence.push(`Location: ${error.location.file}:${error.location.line}`)
      if (error.location.function) {
        evidence.push(`Function: ${error.location.function}`)
      }
    }

    // Test result analizi
    if (testResult) {
      evidence.push(`Test type: ${testResult.testType}`)
      evidence.push(`Failed: ${testResult.failed}, Passed: ${testResult.passed}`)
      
      if (testResult.details) {
        evidence.push(`Details: ${JSON.stringify(testResult.details).substring(0, 200)}`)
      }
    }

    // Context analizi
    if (error.context) {
      const contextStr = JSON.stringify(error.context).substring(0, 200)
      evidence.push(`Context: ${contextStr}`)
    }

    return {
      id: `root-cause-${error.id}`,
      errorId: error.id,
      category,
      description: description || 'Kök neden analiz edilemedi.',
      confidence,
      evidence,
      suggestedFix,
    }
  }

  /**
   * Birden fazla hatanın ortak kök nedenini bul
   */
  static findCommonRootCause(errors: DetectedError[]): RootCause | null {
    if (errors.length === 0) return null

    // Aynı tip hatalar varsa ortak kök neden olabilir
    const errorTypes = new Map<string, number>()
    errors.forEach((e) => {
      errorTypes.set(e.type, (errorTypes.get(e.type) || 0) + 1)
    })

    const mostCommonType = Array.from(errorTypes.entries()).sort((a, b) => b[1] - a[1])[0]

    if (mostCommonType[1] > errors.length / 2) {
      // Çoğunluk aynı tip hata
      const sampleError = errors.find((e) => e.type === mostCommonType[0])
      if (sampleError) {
        return {
          id: 'common-root-cause',
          errorId: sampleError.id,
          category: 'code',
          description: `${mostCommonType[1]} hata aynı tipte (${mostCommonType[0]}). Ortak bir kök neden olabilir.`,
          confidence: 0.7,
          evidence: [`${mostCommonType[1]} out of ${errors.length} errors are of type ${mostCommonType[0]}`],
          relatedErrors: errors.map((e) => e.id),
        }
      }
    }

    return null
  }

  /**
   * Kök neden kategorisine göre öneri oluştur
   */
  static generateFixSuggestion(rootCause: RootCause): string {
    if (rootCause.suggestedFix) {
      return rootCause.suggestedFix
    }

    switch (rootCause.category) {
      case 'code':
        return 'Kod yapısını gözden geçirin ve hataları düzeltin.'
      case 'configuration':
        return 'Konfigürasyon dosyalarını kontrol edin ve gerekli ayarları yapın.'
      case 'dependency':
        return 'Bağımlılıkları kontrol edin ve güncelleyin.'
      case 'environment':
        return 'Ortam ayarlarını kontrol edin ve gerekli değişkenleri ayarlayın.'
      case 'data':
        return 'Veri yapısını ve veri kalitesini kontrol edin.'
      default:
        return 'Hatanın kök nedenini manuel olarak analiz edin.'
    }
  }
}

