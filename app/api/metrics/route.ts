/**
 * Metrics Endpoint
 * 
 * Platform metrics for monitoring dashboard
 * Sprint 5 - Monitoring Setup
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get metrics in parallel
    const [
      companiesResult,
      projectsResult,
      usersResult,
      activeUsersResult,
      ticketsResult,
    ] = await Promise.all([
      supabase.from('companies').select('count', { count: 'exact', head: true }),
      supabase.from('projects').select('count', { count: 'exact', head: true }),
      supabase.from('profiles').select('count', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
        .gt('last_login', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('support_tickets')
        .select('count', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']),
    ])

    const metrics = {
      companies: companiesResult.count || 0,
      projects: projectsResult.count || 0,
      users: usersResult.count || 0,
      activeUsers: activeUsersResult.count || 0,
      openTickets: ticketsResult.count || 0,
      timestamp: new Date().toISOString(),
    }

    await logger.info('Metrics fetched', { metrics })

    return NextResponse.json({
      success: true,
      data: metrics,
    })
  } catch (error: any) {
    await logger.error('Failed to fetch metrics', error as Error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch metrics',
      },
      { status: 500 }
    )
  }
}

