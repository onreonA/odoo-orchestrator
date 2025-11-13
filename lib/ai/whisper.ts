import { openai } from './openai'

/**
 * Whisper API - Ses tanıma (Speech-to-Text)
 * OpenAI Whisper modelini kullanarak ses kayıtlarını yazıya çevirir
 */
export async function transcribeAudio(
  audioFile: File | Buffer,
  options?: {
    language?: string
    prompt?: string
    temperature?: number
    filename?: string
    mimeType?: string
  }
): Promise<string> {
  try {
    // Convert Buffer to File if needed, preserving original format
    let file: File
    if (audioFile instanceof Buffer) {
      // Use provided filename/mimeType or default to mp3
      const filename = options?.filename || 'audio.mp3'
      const mimeType = options?.mimeType || 'audio/mpeg'
      file = new File([new Uint8Array(audioFile)], filename, { type: mimeType })
    } else {
      file = audioFile as File
    }

    // Ensure file has correct MIME type for m4a files
    // Mac's voice notes use m4a format which needs 'audio/mp4' or 'audio/x-m4a'
    if (
      file.name.toLowerCase().endsWith('.m4a') &&
      !file.type.includes('m4a') &&
      !file.type.includes('mp4')
    ) {
      // Create new File with correct MIME type
      file = new File([file], file.name, { type: 'audio/mp4' })
    }

    console.log('[Whisper] Starting transcription:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      language: options?.language || 'tr',
    })

    // Prepare transcription request - try auto-detect first for better accuracy
    const transcriptionParams: any = {
      file: file,
      model: 'whisper-1',
      temperature: options?.temperature || 0,
      response_format: 'verbose_json', // Detaylı JSON formatı
    }

    // Language parameter - only add if specified (auto-detect is better for mixed content)
    if (options?.language) {
      transcriptionParams.language = options.language
    } else {
      // Auto-detect language for better accuracy
      console.log('[Whisper] Using auto-detect language (no language specified)')
    }

    // Prompt parameter - helps Whisper understand context
    if (options?.prompt) {
      transcriptionParams.prompt = options.prompt
    }

    console.log('[Whisper] API Request params:', {
      model: transcriptionParams.model,
      language: transcriptionParams.language || 'auto-detect',
      hasPrompt: !!transcriptionParams.prompt,
      temperature: transcriptionParams.temperature,
    })

    const transcription = await openai.audio.transcriptions.create(transcriptionParams)

    const transcriptText = transcription.text || ''
    console.log('[Whisper] Transcription completed:', {
      textLength: transcriptText.length,
      preview: transcriptText.substring(0, 200), // İlk 200 karakteri göster
      fullText: transcriptText, // Tam metni logla (debug için)
    })

    if (!transcriptText || transcriptText.trim().length === 0) {
      console.warn('[Whisper] Warning: Empty transcript received')
      throw new Error('Whisper API returned empty transcript. Please check the audio file.')
    }

    return transcriptText
  } catch (error: any) {
    console.error('[Whisper] Transcription error:', {
      message: error.message,
      status: error.status,
      code: error.code,
    })
    throw new Error(`Whisper transcription failed: ${error.message}`)
  }
}

/**
 * Ses kaydını yazıya çevir ve zaman damgalarıyla birlikte döndür
 */
export async function transcribeWithTimestamps(
  audioFile: File | Buffer,
  options?: {
    language?: string
    prompt?: string
    filename?: string
    mimeType?: string
  }
): Promise<{
  text: string
  segments: Array<{
    start: number
    end: number
    text: string
  }>
}> {
  try {
    // Convert Buffer to File if needed, preserving original format
    let file: File
    if (audioFile instanceof Buffer) {
      // Use provided filename/mimeType or default to mp3
      const filename = options?.filename || 'audio.mp3'
      const mimeType = options?.mimeType || 'audio/mpeg'
      file = new File([new Uint8Array(audioFile)], filename, { type: mimeType })
    } else {
      file = audioFile as File
    }

    // Ensure file has correct MIME type for m4a files
    if (
      file.name.toLowerCase().endsWith('.m4a') &&
      !file.type.includes('m4a') &&
      !file.type.includes('mp4')
    ) {
      file = new File([file], file.name, { type: 'audio/mp4' })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: options?.language || 'tr',
      prompt: options?.prompt,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    })

    return {
      text: transcription.text,
      segments:
        (transcription as any).segments?.map((seg: any) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
        })) || [],
    }
  } catch (error: any) {
    throw new Error(`Whisper transcription with timestamps failed: ${error.message}`)
  }
}
