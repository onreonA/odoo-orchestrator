/**
 * Whisper API Debug Test
 * Bu dosyayı çalıştırarak Whisper API'nin düzgün çalışıp çalışmadığını test edebilirsiniz
 *
 * Kullanım:
 * 1. Küçük bir test ses dosyası hazırlayın (m4a formatında)
 * 2. Bu dosyayı çalıştırın: npx tsx test/whisper-debug.ts
 */

import { transcribeAudio } from '../lib/ai/whisper'
import * as fs from 'fs'
import * as path from 'path'

async function testWhisper() {
  console.log('🎤 Whisper API Test Başlatılıyor...\n')

  // Test için küçük bir ses dosyası yolu (kullanıcı kendi dosyasını belirtmeli)
  const testAudioPath = process.argv[2] || 'test-audio.m4a'

  if (!fs.existsSync(testAudioPath)) {
    console.error(`❌ Dosya bulunamadı: ${testAudioPath}`)
    console.log('\nKullanım: npx tsx test/whisper-debug.ts <ses-dosyasi-yolu>')
    process.exit(1)
  }

  try {
    const audioBuffer = fs.readFileSync(testAudioPath)
    const audioFile = new File([audioBuffer], path.basename(testAudioPath), {
      type: 'audio/mp4', // m4a için
    })

    console.log('📁 Dosya Bilgileri:')
    console.log(`   Adı: ${audioFile.name}`)
    console.log(`   Boyutu: ${(audioFile.size / 1024).toFixed(2)} KB`)
    console.log(`   Tipi: ${audioFile.type}`)
    console.log('')

    console.log("🔄 Whisper API'ye gönderiliyor...")
    console.log('')

    const transcript = await transcribeAudio(audioFile, {
      language: 'tr',
      prompt: 'Bu bir Odoo ERP sistemi kurulumu için ön analiz toplantısıdır.',
    })

    console.log('✅ Transkript Alındı!\n')
    console.log('📝 Transkript İçeriği:')
    console.log('─'.repeat(60))
    console.log(transcript)
    console.log('─'.repeat(60))
    console.log(`\n📊 Uzunluk: ${transcript.length} karakter`)
    console.log(`📊 Kelime Sayısı: ${transcript.split(/\s+/).length}`)

    if (transcript.length < 50) {
      console.warn('\n⚠️  UYARI: Transkript çok kısa! Ses dosyası düzgün işlenmemiş olabilir.')
    }
  } catch (error: any) {
    console.error('\n❌ Hata:', error.message)
    console.error('\nDetaylar:', error)
    process.exit(1)
  }
}

testWhisper()
