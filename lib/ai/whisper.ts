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
  }
): Promise<string> {
  try {
    // Convert Buffer to File if needed
    let file: File
    if (audioFile instanceof Buffer) {
      file = new File([new Uint8Array(audioFile)], 'audio.mp3', { type: 'audio/mpeg' })
    } else {
      file = audioFile as File
    }

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: options?.language || 'tr', // Default: Türkçe
      prompt: options?.prompt, // Context için ön bilgi
      temperature: options?.temperature || 0,
      response_format: 'verbose_json', // Detaylı JSON formatı
    })

    return transcription.text
  } catch (error: any) {
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
    // Convert Buffer to File if needed
    let file: File
    if (audioFile instanceof Buffer) {
      file = new File([new Uint8Array(audioFile)], 'audio.mp3', { type: 'audio/mpeg' })
    } else {
      file = audioFile as File
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
