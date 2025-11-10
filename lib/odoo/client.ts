/**
 * Odoo 19 XML-RPC Client
 * 
 * Odoo ile iletişim için XML-RPC client wrapper
 */

import xmlrpc from 'xmlrpc'
import type {
  OdooConnectionConfig,
  OdooSearchDomain,
  OdooReadResult,
  OdooCreateResult,
  OdooModule,
  OdooProduct,
  OdooCompany,
  OdooBOM,
} from './types'

export class OdooClient {
  private config: OdooConnectionConfig
  private uid: number | null = null
  private models: any
  private common: any

  constructor(config: OdooConnectionConfig) {
    this.config = config
    this.models = xmlrpc.createClient({
      host: new URL(config.url).hostname,
      port: new URL(config.url).port ? parseInt(new URL(config.url).port) : 443,
      path: '/xmlrpc/2/object',
      basic_auth: {
        user: config.username,
        pass: config.password,
      },
    })

    this.common = xmlrpc.createClient({
      host: new URL(config.url).hostname,
      port: new URL(config.url).port ? parseInt(new URL(config.url).port) : 443,
      path: '/xmlrpc/2/common',
    })
  }

  /**
   * Odoo'ya bağlan ve authentication yap
   */
  async connect(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.common.methodCall(
        'authenticate',
        [this.config.database, this.config.username, this.config.password, {}],
        (error: any, uid: number) => {
          if (error) {
            reject(new Error(`Odoo authentication failed: ${error.message}`))
            return
          }
          if (!uid) {
            reject(new Error('Odoo authentication failed: Invalid credentials'))
            return
          }
          this.uid = uid
          resolve(uid)
        }
      )
    })
  }

  /**
   * Generic search method
   */
  async search(
    model: string,
    domain: OdooSearchDomain[] = [],
    options: { limit?: number; offset?: number; order?: string } = {}
  ): Promise<number[]> {
    if (!this.uid) {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      this.models.methodCall(
        'execute_kw',
        [
          this.config.database,
          this.uid!,
          this.config.password,
          model,
          'search',
          [domain],
          {
            limit: options.limit || 1000,
            offset: options.offset || 0,
            order: options.order || 'id desc',
          },
        ],
        (error: any, result: number[]) => {
          if (error) {
            reject(new Error(`Odoo search failed: ${error.message}`))
            return
          }
          resolve(result || [])
        }
      )
    })
  }

  /**
   * Generic read method
   */
  async read(
    model: string,
    ids: number[],
    fields: string[] = []
  ): Promise<OdooReadResult[]> {
    if (!this.uid) {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      this.models.methodCall(
        'execute_kw',
        [
          this.config.database,
          this.uid!,
          this.config.password,
          model,
          'read',
          [ids],
          { fields },
        ],
        (error: any, result: OdooReadResult[]) => {
          if (error) {
            reject(new Error(`Odoo read failed: ${error.message}`))
            return
          }
          resolve(result || [])
        }
      )
    })
  }

  /**
   * Generic create method
   */
  async create(model: string, values: Record<string, any>): Promise<OdooCreateResult> {
    if (!this.uid) {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      this.models.methodCall(
        'execute_kw',
        [
          this.config.database,
          this.uid!,
          this.config.password,
          model,
          'create',
          [values],
        ],
        (error: any, result: number) => {
          if (error) {
            reject(new Error(`Odoo create failed: ${error.message}`))
            return
          }
          resolve({ id: result })
        }
      )
    })
  }

  /**
   * Generic write (update) method
   */
  async write(model: string, ids: number[], values: Record<string, any>): Promise<boolean> {
    if (!this.uid) {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      this.models.methodCall(
        'execute_kw',
        [
          this.config.database,
          this.uid!,
          this.config.password,
          model,
          'write',
          [ids, values],
        ],
        (error: any, result: boolean) => {
          if (error) {
            reject(new Error(`Odoo write failed: ${error.message}`))
            return
          }
          resolve(result)
        }
      )
    })
  }

  /**
   * Generic delete method
   */
  async delete(model: string, ids: number[]): Promise<boolean> {
    if (!this.uid) {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      this.models.methodCall(
        'execute_kw',
        [
          this.config.database,
          this.uid!,
          this.config.password,
          model,
          'unlink',
          [ids],
        ],
        (error: any, result: boolean) => {
          if (error) {
            reject(new Error(`Odoo delete failed: ${error.message}`))
            return
          }
          resolve(result)
        }
      )
    })
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; version?: string; error?: string }> {
    try {
      const uid = await this.connect()
      return { success: true, version: '19.0' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // ============================================
  // Specific Model Methods
  // ============================================

  /**
   * Get installed modules
   */
  async getModules(): Promise<OdooModule[]> {
    const moduleIds = await this.search('ir.module.module', [['state', '=', 'installed']])
    const modules = await this.read('ir.module.module', moduleIds, [
      'name',
      'technical_name',
      'category_id',
      'state',
      'summary',
      'description',
      'depends_id',
    ])

    return modules.map((m: any) => ({
      id: m.id,
      name: m.name,
      technical_name: m.name,
      category: m.category_id ? m.category_id[1] : '',
      state: m.state,
      summary: m.summary || '',
      description: m.description || '',
      depends_on: m.depends_id ? m.depends_id.map((d: any) => d[1]) : [],
    }))
  }

  /**
   * Install module
   */
  async installModule(technicalName: string): Promise<boolean> {
    if (!this.uid) {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      this.models.methodCall(
        'execute_kw',
        [
          this.config.database,
          this.uid!,
          this.config.password,
          'ir.module.module',
          'button_immediate_install',
          [[technicalName]],
        ],
        (error: any, result: any) => {
          if (error) {
            reject(new Error(`Module installation failed: ${error.message}`))
            return
          }
          resolve(true)
        }
      )
    })
  }

  /**
   * Get products
   */
  async getProducts(domain: OdooSearchDomain[] = []): Promise<OdooProduct[]> {
    const productIds = await this.search('product.product', domain)
    const products = await this.read('product.product', productIds, [
      'name',
      'default_code',
      'barcode',
      'list_price',
      'standard_price',
      'type',
      'categ_id',
    ])
    return products as OdooProduct[]
  }

  /**
   * Create product
   */
  async createProduct(values: Partial<OdooProduct>): Promise<OdooCreateResult> {
    return this.create('product.product', values)
  }

  /**
   * Get companies
   */
  async getCompanies(): Promise<OdooCompany[]> {
    const companyIds = await this.search('res.company', [])
    const companies = await this.read('res.company', companyIds, ['name', 'email', 'phone', 'website'])
    return companies as OdooCompany[]
  }

  /**
   * Get BOMs (Bill of Materials)
   */
  async getBOMs(productId?: number): Promise<OdooBOM[]> {
    const domain = productId ? [['product_id', '=', productId]] : []
    const bomIds = await this.search('mrp.bom', domain)
    const boms = await this.read('mrp.bom', bomIds, [
      'product_id',
      'product_tmpl_id',
      'product_qty',
      'product_uom_id',
      'bom_line_ids',
    ])
    return boms as OdooBOM[]
  }

  /**
   * Create BOM
   */
  async createBOM(values: Partial<OdooBOM>): Promise<OdooCreateResult> {
    return this.create('mrp.bom', values)
  }
}

