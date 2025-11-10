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
    // Improved prompt for better transcription accuracy
    const prompt = `
Bu bir Odoo ERP sistemi kurulumu için ön analiz toplantısıdır.
Firma süreçleri, departmanlar, mevcut sistemler ve ihtiyaçlar hakkında konuşulacak.
Lütfen teknik terimleri ve özel isimleri doğru yaz.
Türkçe konuşma içeriyor. Lütfen Türkçe karakterleri doğru kullanın.
    `.trim()

    // Preserve file metadata for m4a and other formats
    const options: any = {
      // Language: 'tr' - removed to allow auto-detection (better for mixed content)
      // Auto-detection works better if there's any non-Turkish content
      prompt,
    }

    // If it's a File, preserve filename and MIME type
    if (audioFile instanceof File) {
      options.filename = audioFile.name
      options.mimeType = audioFile.type
      
      // Log file info for debugging
      console.log('[Discovery Agent] Audio file info:', {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
        lastModified: audioFile.lastModified,
      })
    }

    const transcript = await transcribeAudio(audioFile, options)
    
    // Validate transcript
    if (!transcript || transcript.trim().length < 10) {
      console.warn('[Discovery Agent] Warning: Very short transcript received:', transcript)
    }
    
    return transcript
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
    // Check if transcript is too short or seems invalid
    if (transcript.trim().length < 50) {
      console.warn('[Discovery Agent] WARNING: Very short transcript for extraction:', transcript)
      // Return empty structure with error indication
      return {
        companyInfo: {
          name: 'Bilgi eksik - Transkript çok kısa',
          industry: 'Bilgi eksik - Transkript çok kısa',
          size: 'Bilgi eksik - Transkript çok kısa',
          departments: [],
        },
        processes: [],
        currentSystems: [],
        requirements: [],
      }
    }

    const prompt = `
Aşağıdaki toplantı transkriptini analiz et ve yapılandırılmış bilgiler çıkar.

ÖNEMLİ: Eğer transkript çok kısa, alakasız veya anlamsız ise, "Bilgi eksik, lütfen sağlayın." yazma. 
Bunun yerine, transkriptte gerçekten ne söylendiğini analiz et ve mümkün olduğunca bilgi çıkar.
Eğer transkript gerçekten bir toplantı kaydı değilse (örneğin müzik, gürültü, test kaydı), 
boş array'ler ve "Geçersiz transkript" mesajları döndür.

Transkript:
${transcript}

Lütfen şu bilgileri çıkar:
1. Firma Bilgileri:
   - Firma adı (eğer belirtildiyse)
   - Sektör (eğer belirtildiyse)
   - Büyüklük (küçük/orta/büyük) (eğer belirtildiyse)
   - Departmanlar (eğer belirtildiyse)

2. İş Süreçleri:
   - Her süreç için: ad, tip (satış/üretim/stok/finans vb.), açıklama, sorun noktaları
   - Eğer hiç süreç belirtilmediyse boş array döndür

3. Mevcut Sistemler:
   - Sistem adı, tipi, sorunları
   - Eğer hiç sistem belirtilmediyse boş array döndür

4. İhtiyaçlar:
   - Öncelik (high/medium/low), açıklama, kategori
   - Eğer hiç ihtiyaç belirtilmediyse boş array döndür

JSON formatında döndür. Eğer transkript geçersiz veya anlamsızsa, boş array'ler ve açıklayıcı mesajlar döndür.
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
    const startTime = Date.now()
    console.log('[Discovery Agent] Starting full discovery process...')

    try {
      // 1. Transkript
      console.log('[Discovery Agent] Step 1/4: Transcribing audio...')
      const transcript = await this.transcribeMeeting(audioFile)
      
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcription failed: Empty transcript received from Whisper API')
      }
      
      // Validate transcript quality - minimum 50 characters for meaningful content
      const MIN_TRANSCRIPT_LENGTH = 50
      if (transcript.trim().length < MIN_TRANSCRIPT_LENGTH) {
        console.warn('[Discovery Agent] WARNING: Very short transcript received:', {
          length: transcript.trim().length,
          content: transcript,
        })
        throw new Error(
          `Transkript çok kısa (${transcript.trim().length} karakter). ` +
          `Lütfen en az ${MIN_TRANSCRIPT_LENGTH} karakter içeren bir toplantı ses kaydı yükleyin. ` +
          `Müzik dosyası veya çok kısa kayıtlar kabul edilmez.`
        )
      }
      
      console.log('[Discovery Agent] Transcription completed:', {
        length: transcript.length,
        preview: transcript.substring(0, 200),
        fullTranscript: transcript, // Debug için tam transkripti logla
      })

      // 2. Bilgi çıkarma
      console.log('[Discovery Agent] Step 2/4: Extracting information...')
      const extractedInfo = await this.extractInformation(transcript)
      console.log('[Discovery Agent] Information extracted:', {
        hasCompanyInfo: !!extractedInfo.companyInfo,
        processesCount: extractedInfo.processes?.length || 0,
        requirementsCount: extractedInfo.requirements?.length || 0,
      })

      // 3. Modül önerileri
      console.log('[Discovery Agent] Step 3/4: Mapping processes and suggesting modules...')
      const moduleSuggestions = await this.mapProcessesAndSuggestModules(extractedInfo)
      console.log('[Discovery Agent] Module suggestions completed:', {
        suggestedModulesCount: moduleSuggestions?.suggestedModules?.length || 0,
        processMappingsCount: moduleSuggestions?.processMappings?.length || 0,
      })

      // 4. Rapor oluşturma
      console.log('[Discovery Agent] Step 4/4: Generating report...')
      const report = await this.generateReport(transcript, extractedInfo, moduleSuggestions)
      console.log('[Discovery Agent] Report generated:', {
        length: report.length,
      })

      const duration = Date.now() - startTime
      console.log(`[Discovery Agent] Full discovery completed in ${duration}ms`)

      return {
        transcript,
        extractedInfo,
        moduleSuggestions,
        report,
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error(`[Discovery Agent] Error after ${duration}ms:`, {
        message: error.message,
        stack: error.stack,
      })
      throw error
    }
  }
}
