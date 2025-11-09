import { openai } from '../openai'
import { transcribeAudio, transcribeWithTimestamps } from '../whisper'

/**
 * Discovery Agent - Firma ön analizi için AI agent
 *
 * Görevleri:
 * 1. Toplantı ses kaydını yazıya çevirir
 * 2. Önemli bilgileri çıkarır
 * 3. Süreçleri haritalandırır
 * 4. Odoo modül önerileri yapar
 * 5. Discovery raporu oluşturur
 */
export class DiscoveryAgent {
  private companyId: string
  private projectId?: string

  constructor(companyId: string, projectId?: string) {
    this.companyId = companyId
    this.projectId = projectId
  }

  /**
   * Ses kaydını yazıya çevir
   */
  async transcribeMeeting(audioFile: File | Buffer): Promise<string> {
    const prompt = `
Bu bir Odoo ERP sistemi kurulumu için ön analiz toplantısıdır.
Firma süreçleri, departmanlar, mevcut sistemler ve ihtiyaçlar hakkında konuşulacak.
Lütfen teknik terimleri ve özel isimleri doğru yaz.
    `.trim()

    return await transcribeAudio(audioFile, {
      language: 'tr',
      prompt,
    })
  }

  /**
   * Transkriptten önemli bilgileri çıkar
   */
  async extractInformation(transcript: string): Promise<{
    companyInfo: {
      name: string
      industry: string
      size: string
      departments: string[]
    }
    processes: Array<{
      name: string
      type: string
      description: string
      painPoints: string[]
    }>
    currentSystems: Array<{
      name: string
      type: string
      issues: string[]
    }>
    requirements: Array<{
      priority: 'high' | 'medium' | 'low'
      description: string
      category: string
    }>
  }> {
    const prompt = `
Aşağıdaki toplantı transkriptini analiz et ve yapılandırılmış bilgiler çıkar.

Transkript:
${transcript}

Lütfen şu bilgileri çıkar:
1. Firma Bilgileri:
   - Firma adı
   - Sektör
   - Büyüklük (küçük/orta/büyük)
   - Departmanlar

2. İş Süreçleri:
   - Her süreç için: ad, tip (satış/üretim/stok/finans vb.), açıklama, sorun noktaları

3. Mevcut Sistemler:
   - Sistem adı, tipi, sorunları

4. İhtiyaçlar:
   - Öncelik (high/medium/low), açıklama, kategori

JSON formatında döndür.
    `.trim()

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'Sen bir ERP sistem analisti. Toplantı notlarını analiz edip yapılandırılmış bilgiler çıkarıyorsun.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result
  }

  /**
   * Süreçleri haritalandır ve Odoo modül önerileri yap
   */
  async mapProcessesAndSuggestModules(
    extractedInfo: Awaited<ReturnType<typeof this.extractInformation>>
  ): Promise<{
    suggestedModules: Array<{
      name: string
      technicalName: string
      priority: 'high' | 'medium' | 'low'
      reason: string
    }>
    processMappings: Array<{
      processName: string
      odooModule: string
      configuration: string[]
    }>
  }> {
    const prompt = `
Aşağıdaki firma bilgilerine göre Odoo 19 modül önerileri yap.

Firma Bilgileri:
${JSON.stringify(extractedInfo.companyInfo, null, 2)}

İş Süreçleri:
${JSON.stringify(extractedInfo.processes, null, 2)}

Mevcut Sistemler:
${JSON.stringify(extractedInfo.currentSystems, null, 2)}

İhtiyaçlar:
${JSON.stringify(extractedInfo.requirements, null, 2)}

Lütfen:
1. Önerilen Odoo modüllerini listele (teknik isimleriyle)
2. Her modül için öncelik ve neden belirt
3. Süreçleri Odoo modüllerine map et
4. Her süreç için gerekli konfigürasyonları listele

JSON formatında döndür.
    `.trim()

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'Sen bir Odoo ERP uzmanısın. Firmaların ihtiyaçlarına göre modül önerileri yapıyorsun.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result
  }

  /**
   * Discovery raporu oluştur
   * Not: Veritabanı kaydı API route'ta yapılmalı
   */
  async generateReport(
    transcript: string,
    extractedInfo: Awaited<ReturnType<typeof this.extractInformation>>,
    moduleSuggestions: Awaited<ReturnType<typeof this.mapProcessesAndSuggestModules>>
  ): Promise<string> {
    const prompt = `
Aşağıdaki bilgilere göre profesyonel bir discovery raporu oluştur.

Firma Bilgileri:
${JSON.stringify(extractedInfo.companyInfo, null, 2)}

İş Süreçleri:
${JSON.stringify(extractedInfo.processes, null, 2)}

Önerilen Modüller:
${JSON.stringify(moduleSuggestions.suggestedModules, null, 2)}

Rapor şu bölümleri içermeli:
1. Executive Summary
2. Firma Genel Bakış
3. Mevcut Durum Analizi
4. İş Süreçleri Analizi
5. Odoo Modül Önerileri
6. Uygulama Planı
7. Riskler ve Öneriler

Markdown formatında, profesyonel ve detaylı bir rapor hazırla.
    `.trim()

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Sen bir ERP danışmanısın. Profesyonel discovery raporları yazıyorsun.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
    })

    return response.choices[0].message.content || ''
  }

  /**
   * Tam discovery sürecini çalıştır
   */
  async runFullDiscovery(audioFile: File | Buffer): Promise<{
    transcript: string
    extractedInfo: Awaited<ReturnType<DiscoveryAgent['extractInformation']>>
    moduleSuggestions: Awaited<ReturnType<DiscoveryAgent['mapProcessesAndSuggestModules']>>
    report: string
  }> {
    // 1. Transkript
    const transcript = await this.transcribeMeeting(audioFile)

    // 2. Bilgi çıkarma
    const extractedInfo = await this.extractInformation(transcript)

    // 3. Modül önerileri
    const moduleSuggestions = await this.mapProcessesAndSuggestModules(extractedInfo)

    // 4. Rapor oluşturma
    const report = await this.generateReport(transcript, extractedInfo, moduleSuggestions)

    return {
      transcript,
      extractedInfo,
      moduleSuggestions,
      report,
    }
  }
}
