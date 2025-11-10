/**
 * Odoo API Types
 */

export interface OdooConnectionConfig {
  url: string // Odoo instance URL (e.g., https://odoo.example.com)
  database: string // Database name
  username: string // Odoo username
  password: string // Odoo password
  apiKey?: string // Optional API key for GraphQL
}

export interface OdooSearchDomain {
  [key: string]: any
}

export interface OdooReadResult {
  id: number
  [key: string]: any
}

export interface OdooCreateResult {
  id: number
}

export interface OdooModule {
  id: number
  name: string
  technical_name: string
  category: string
  state: 'installed' | 'uninstalled' | 'to install' | 'to upgrade'
  summary: string
  description: string
  depends_on: string[]
}

export interface OdooProduct {
  id: number
  name: string
  default_code?: string
  barcode?: string
  list_price: number
  standard_price: number
  type: 'product' | 'consu' | 'service'
  categ_id: [number, string] // [id, name]
  [key: string]: any
}

export interface OdooCompany {
  id: number
  name: string
  email?: string
  phone?: string
  website?: string
  [key: string]: any
}

export interface OdooBOMLine {
  product_id: number
  product_qty: number
  product_uom_id: number
  [key: string]: any
}

export interface OdooBOM {
  id: number
  product_id: number
  product_tmpl_id: number
  product_qty: number
  product_uom_id: number
  bom_line_ids: OdooBOMLine[]
  [key: string]: any
}




