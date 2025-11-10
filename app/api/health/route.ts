/**
 * Health Check Endpoint
 * 
 * Uptime monitoring için health check endpoint'i
 * Production deployment için gerekli
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Check database connection
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()
    
    const responseTime = Date.now() - startTime
    
    // Database connection check
    if (dbError && dbError.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist (expected in some cases)
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'error',
          error: dbError.message,
          responseTime,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }
    
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]
    
    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    )
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'connected',
          missingEnvVars,
          responseTime,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
    })
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message || 'Internal error',
        responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

