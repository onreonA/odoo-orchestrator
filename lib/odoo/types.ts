// Odoo types
export interface OdooConnectionConfig {
  url: string
  database: string
  username: string
  password: string
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
  state: string
}

export interface OdooProduct {
  id: number
  name: string
}

export interface OdooCompany {
  id: number
  name: string
}

export interface OdooBOM {
  id: number
  name: string
}

