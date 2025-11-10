/**
 * API Authentication Middleware
 * 
 * Public API için authentication ve rate limiting
 * Sprint 5
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiKeyService } from '@/lib/services/api-key-service'

export interface AuthenticatedRequest extends NextRequest {
  apiKey?: any
}

/**
 * Authenticate API request using API key
 */
export async function authenticateApiRequest(
  request: NextRequest
): Promise<{ apiKey: any; error: any }> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { apiKey: null, error: { message: 'Missing or invalid Authorization header' } }
  }

  const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix

  // Validate API key
  const { data, error } = await ApiKeyService.validateApiKey(apiKey)

  if (error || !data) {
    return { apiKey: null, error: { message: 'Invalid API key' } }
  }

  return { apiKey: data, error: null }
}

/**
 * Check rate limit for API request
 */
export async function checkRateLimit(
  apiKeyId: string,
  request: NextRequest
): Promise<{ allowed: boolean; error?: any }> {
  // Check all time windows
  const checks = await Promise.all([
    ApiKeyService.checkRateLimit(apiKeyId, 'minute'),
    ApiKeyService.checkRateLimit(apiKeyId, 'hour'),
    ApiKeyService.checkRateLimit(apiKeyId, 'day'),
  ])

  const failed = checks.find((check) => !check.allowed)

  if (failed) {
    return { allowed: false, error: failed.error }
  }

  return { allowed: true }
}

/**
 * API middleware wrapper
 */
export function withApiAuth(
  handler: (request: NextRequest, context: { apiKey: any }, routeContext?: { params?: Promise<any> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, routeContext?: { params?: Promise<any> }) => {
    // Authenticate
    const { apiKey, error: authError } = await authenticateApiRequest(request)

    if (authError || !apiKey) {
      return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const { allowed, error: rateLimitError } = await checkRateLimit(apiKey.id, request)

    if (!allowed) {
      return NextResponse.json(
        {
          error: rateLimitError?.message || 'Rate limit exceeded',
          retryAfter: 60, // seconds
        },
        { status: 429 }
      )
    }

    // Log request start time
    const startTime = Date.now()

    try {
      // Call handler
      const response = await handler(request, { apiKey }, routeContext)

      // Log request
      const responseTime = Date.now() - startTime
      await ApiKeyService.logRequest(apiKey.id, {
        method: request.method,
        endpoint: request.nextUrl.pathname,
        statusCode: response.status,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        responseTimeMs: responseTime,
      })

      return response
    } catch (error: any) {
      // Log error
      const responseTime = Date.now() - startTime
      await ApiKeyService.logRequest(apiKey.id, {
        method: request.method,
        endpoint: request.nextUrl.pathname,
        statusCode: 500,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        responseTimeMs: responseTime,
      })

      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
  }
}

