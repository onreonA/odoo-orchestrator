import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Test Supabase connection
 * GET /api/test-supabase
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Test connection by querying a simple table
    // (This will fail if tables don't exist yet, but connection will work)
    const { data, error } = await supabase.from('profiles').select('count').limit(1)

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist (expected at this stage)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        message: 'Supabase bağlantısı çalışıyor ama tablolar henüz oluşturulmamış.',
      })
    }

    return NextResponse.json({
      success: true,
      message: '✅ Supabase bağlantısı başarılı!',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Supabase bağlantısında hata var. .env.local dosyasını kontrol edin.',
      },
      { status: 500 }
    )
  }
}



