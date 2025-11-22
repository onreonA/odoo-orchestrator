/**
 * API Error Handler Utility
 *
 * Merkezi error handling ve tutarlı error response formatı sağlar
 */

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: string
  timestamp?: string
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: string,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'ApiError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Error kodları enum'u
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELDS = 'MISSING_FIELDS',
  INVALID_INPUT = 'INVALID_INPUT',

  // Not Found
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Business Logic
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  OPERATION_FAILED = 'OPERATION_FAILED',
}

/**
 * Güvenli error mesajı oluşturur (production'da sensitive bilgileri gizler)
 */
function sanitizeErrorMessage(error: any, isDevelopment: boolean = false): string {
  if (isDevelopment) {
    return error.message || 'Unknown error'
  }

  // Production'da generic mesajlar döndür
  if (error instanceof ApiError && error.isOperational) {
    return error.message
  }

  // Database errors için generic mesaj
  if (error.message?.includes('database') || error.message?.includes('connection')) {
    return 'Database connection error. Please try again later.'
  }

  // Network errors için generic mesaj
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Please check your connection.'
  }

  // Diğer hatalar için generic mesaj
  return 'An unexpected error occurred. Please try again later.'
}

/**
 * Error response oluşturur
 */
export function createErrorResponse(
  error: any,
  statusCode: number = 500,
  code?: string
): ApiErrorResponse {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const sanitizedMessage = sanitizeErrorMessage(error, isDevelopment)

  const response: ApiErrorResponse = {
    success: false,
    error: sanitizedMessage,
    code: code || (error instanceof ApiError ? error.code : ErrorCode.INTERNAL_ERROR),
    timestamp: new Date().toISOString(),
  }

  // Development'ta details ekle
  if (isDevelopment && error.details) {
    response.details = error.details
  }

  return response
}

/**
 * Error'ı loglar (sensitive bilgileri filtreler)
 */
export function logError(context: string, error: any, additionalData?: Record<string, any>) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const logData: any = {
    context,
    message: error.message || 'Unknown error',
    timestamp: new Date().toISOString(),
    ...additionalData,
  }

  // Development'ta stack trace ekle
  if (isDevelopment && error.stack) {
    logData.stack = error.stack
  }

  // Error code ekle
  if (error instanceof ApiError) {
    logData.code = error.code
    logData.statusCode = error.statusCode
  }

  // Sensitive bilgileri filtrele
  const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'access_token', 'refresh_token']
  const filteredData = filterSensitiveData(logData, sensitiveKeys)

  console.error(`[API Error] ${context}:`, filteredData)
}

/**
 * Sensitive bilgileri filtreler
 */
function filterSensitiveData(obj: any, sensitiveKeys: string[]): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => filterSensitiveData(item, sensitiveKeys))
  }

  const filtered: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      filtered[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value, sensitiveKeys)
    } else {
      filtered[key] = value
    }
  }

  return filtered
}

/**
 * Common error factory functions
 */
export const ApiErrors = {
  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(message, 401, ErrorCode.UNAUTHORIZED),

  forbidden: (message: string = 'Forbidden') => new ApiError(message, 403, ErrorCode.FORBIDDEN),

  notFound: (resource: string = 'Resource') =>
    new ApiError(`${resource} not found`, 404, ErrorCode.NOT_FOUND),

  validationError: (message: string, details?: string) =>
    new ApiError(message, 400, ErrorCode.VALIDATION_ERROR, details),

  missingFields: (fields: string[]) =>
    new ApiError(`Missing required fields: ${fields.join(', ')}`, 400, ErrorCode.MISSING_FIELDS),

  conflict: (message: string = 'Resource conflict') =>
    new ApiError(message, 409, ErrorCode.CONFLICT),

  internalError: (message: string = 'Internal server error') =>
    new ApiError(message, 500, ErrorCode.INTERNAL_ERROR, undefined, false),
}

