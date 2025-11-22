import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/projects
 * Get admin projects
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ data: [], error: null })
}



