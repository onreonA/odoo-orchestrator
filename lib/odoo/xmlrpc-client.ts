/**
 * Odoo XML-RPC Client
 *
 * Low-level XML-RPC client for communicating with Odoo instances.
 * Handles authentication, request/response, and error handling.
 */

import xmlrpc from 'xmlrpc'

export interface OdooConnectionConfig {
  url: string
  database: string
  username: string
  password: string
  timeout?: number // milliseconds
}

export interface OdooError extends Error {
  code?: string
  data?: any
}

export class OdooXMLRPCClient {
  private url: string
  private database: string
  private username: string
  private password: string
  private timeout: number
  private uid: number | null = null

  // XML-RPC clients
  private commonClient: any
  private objectClient: any

  constructor(config: OdooConnectionConfig) {
    this.url = config.url
    this.database = config.database
    this.username = config.username
    this.password = config.password
    this.timeout = config.timeout || 10000 // 10 seconds default

    // Create XML-RPC clients
    const urlObj = new URL(this.url)
    const options = {
      host: urlObj.hostname,
      port: urlObj.port ? parseInt(urlObj.port) : urlObj.protocol === 'https:' ? 443 : 80,
      path: '/xmlrpc/2/common',
      timeout: this.timeout,
    }

    this.commonClient =
      urlObj.protocol === 'https:'
        ? xmlrpc.createSecureClient(options)
        : xmlrpc.createClient(options)

    this.objectClient =
      urlObj.protocol === 'https:'
        ? xmlrpc.createSecureClient({ ...options, path: '/xmlrpc/2/object' })
        : xmlrpc.createClient({ ...options, path: '/xmlrpc/2/object' })
  }

  /**
   * Authenticate with Odoo and get UID
   */
  async authenticate(): Promise<number> {
    if (this.uid) {
      return this.uid
    }

    try {
      const uid = await this.methodCall(this.commonClient, 'authenticate', [
        this.database,
        this.username,
        this.password,
        {},
      ])

      if (!uid || typeof uid !== 'number') {
        throw this.createError('Authentication failed: Invalid credentials', 'AUTH_FAILED')
      }

      this.uid = uid
      return uid
    } catch (error) {
      throw this.createError(
        `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'AUTH_FAILED',
        error
      )
    }
  }

  /**
   * Test connection to Odoo
   */
  async testConnection(): Promise<boolean> {
    try {
      const version = await this.methodCall(this.commonClient, 'version', [])
      return !!version
    } catch (error) {
      return false
    }
  }

  /**
   * Get Odoo server version
   */
  async getVersion(): Promise<any> {
    return await this.methodCall(this.commonClient, 'version', [])
  }

  /**
   * Execute a method on an Odoo model
   */
  async executeKw(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    // Ensure authenticated
    if (!this.uid) {
      await this.authenticate()
    }

    try {
      return await this.methodCall(this.objectClient, 'execute_kw', [
        this.database,
        this.uid,
        this.password,
        model,
        method,
        args,
        kwargs,
      ])
    } catch (error) {
      throw this.createError(
        `Execute failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXECUTE_FAILED',
        error
      )
    }
  }

  /**
   * Create a record
   */
  async create(model: string, data: any): Promise<number> {
    return await this.executeKw(model, 'create', [[data]])
  }

  /**
   * Read records
   */
  async read(model: string, ids: number[], fields?: string[]): Promise<any[]> {
    const kwargs = fields ? { fields } : {}
    return await this.executeKw(model, 'read', [ids], kwargs)
  }

  /**
   * Search for record IDs
   */
  async search(
    model: string,
    domain: any[] = [],
    options?: {
      offset?: number
      limit?: number
      order?: string
    }
  ): Promise<number[]> {
    return await this.executeKw(model, 'search', [domain], options || {})
  }

  /**
   * Search and read records
   */
  async searchRead(
    model: string,
    domain: any[] = [],
    options?: {
      fields?: string[]
      offset?: number
      limit?: number
      order?: string
    }
  ): Promise<any[]> {
    return await this.executeKw(model, 'search_read', [domain], options || {})
  }

  /**
   * Update records
   */
  async write(model: string, ids: number[], data: any): Promise<boolean> {
    return await this.executeKw(model, 'write', [ids, data])
  }

  /**
   * Delete records
   */
  async unlink(model: string, ids: number[]): Promise<boolean> {
    return await this.executeKw(model, 'unlink', [ids])
  }

  /**
   * Count records
   */
  async searchCount(model: string, domain: any[] = []): Promise<number> {
    return await this.executeKw(model, 'search_count', [domain])
  }

  /**
   * Get field definitions for a model
   */
  async fieldsGet(model: string, fields?: string[]): Promise<any> {
    const args = fields ? [fields] : []
    return await this.executeKw(model, 'fields_get', args)
  }

  /**
   * Batch create records
   */
  async batchCreate(model: string, dataList: any[]): Promise<number[]> {
    return await this.executeKw(model, 'create', [dataList])
  }

  /**
   * Batch write records
   */
  async batchWrite(model: string, updates: Array<{ ids: number[]; data: any }>): Promise<boolean> {
    // Odoo doesn't have native batch write, so we do multiple writes
    const promises = updates.map(update => this.write(model, update.ids, update.data))
    const results = await Promise.all(promises)
    return results.every(r => r === true)
  }

  /**
   * Call a method with timeout and retry logic
   */
  private async methodCall(
    client: any,
    method: string,
    params: any[],
    retries: number = 3
  ): Promise<any> {
    let lastError: any

    for (let i = 0; i < retries; i++) {
      try {
        return await this.promisifyMethodCall(client, method, params)
      } catch (error) {
        lastError = error

        // Don't retry on authentication errors
        if (error instanceof Error && error.message.includes('authentication')) {
          throw error
        }

        // Exponential backoff
        if (i < retries - 1) {
          await this.sleep(Math.pow(2, i) * 1000)
        }
      }
    }

    throw lastError
  }

  /**
   * Promisify XML-RPC method call
   */
  private promisifyMethodCall(client: any, method: string, params: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout after ${this.timeout}ms`))
      }, this.timeout)

      client.methodCall(method, params, (error: any, value: any) => {
        clearTimeout(timeout)

        if (error) {
          reject(error)
        } else {
          resolve(value)
        }
      })
    })
  }

  /**
   * Create a custom error
   */
  private createError(message: string, code: string, originalError?: any): OdooError {
    const error = new Error(message) as OdooError
    error.code = code
    error.data = originalError
    return error
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Install module
   */
  async installModule(technicalName: string): Promise<boolean> {
    try {
      await this.authenticate()
      await this.executeKw('ir.module.module', 'button_immediate_install', [[['name', '=', technicalName]]])
      return true
    } catch (error) {
      throw this.createError(
        `Failed to install module ${technicalName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MODULE_INSTALL_FAILED',
        error
      )
    }
  }

  /**
   * Execute method (alias for executeKw)
   */
  private async execute(model: string, method: string, args: any[]): Promise<any> {
    return this.executeKw(model, method, args)
  }

  /**
   * Disconnect (cleanup)
   */
  disconnect(): void {
    this.uid = null
    // XML-RPC clients don't need explicit cleanup
  }
}
