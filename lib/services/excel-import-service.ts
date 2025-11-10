/**
 * Excel Import Service
 * 
 * Excel dosyalarını parse edip Odoo'ya aktarma servisi
 */

import * as XLSX from 'xlsx'
import { OdooClient } from '@/lib/odoo/client'

export interface ExcelImportConfig {
  file: File | Buffer
  mapping: {
    sheet_name: string
    model: string // 'product.product', 'mrp.bom', 'res.partner', etc.
    field_mapping: Record<string, string> // Excel column -> Odoo field
    skip_rows?: number
  }
  odoo_config: {
    url: string
    database: string
    username: string
    password: string
  }
}

export interface ImportResult {
  success: boolean
  imported_count: number
  failed_count: number
  errors: Array<{ row: number; error: string }>
  warnings: Array<{ row: number; warning: string }>
}

export class ExcelImportService {
  /**
   * Excel dosyasını parse et
   */
  static parseExcel(file: File | Buffer): XLSX.WorkBook {
    const buffer = file instanceof File ? file : Buffer.from(file)
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    return workbook
  }

  /**
   * Excel sheet'ini JSON'a çevir
   */
  static sheetToJson(workbook: XLSX.WorkBook, sheetName: string, skipRows = 0): any[] {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`)
    }

    const json = XLSX.utils.sheet_to_json(sheet, { defval: null })
    return json.slice(skipRows)
  }

  /**
   * Excel verilerini Odoo formatına map et
   */
  static mapToOdooFormat(
    excelData: any[],
    fieldMapping: Record<string, string>
  ): Array<Record<string, any>> {
    return excelData.map(row => {
      const odooRow: Record<string, any> = {}

      for (const [excelField, odooField] of Object.entries(fieldMapping)) {
        const value = row[excelField]
        if (value !== null && value !== undefined && value !== '') {
          odooRow[odooField] = value
        }
      }

      return odooRow
    })
  }

  /**
   * Excel'i Odoo'ya import et
   */
  static async importToOdoo(config: ExcelImportConfig): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported_count: 0,
      failed_count: 0,
      errors: [],
      warnings: [],
    }

    try {
      // 1. Excel'i parse et
      const workbook = this.parseExcel(config.file)
      const excelData = this.sheetToJson(
        workbook,
        config.mapping.sheet_name,
        config.mapping.skip_rows || 0
      )

      if (excelData.length === 0) {
        throw new Error('Excel file is empty or no data found')
      }

      // 2. Odoo'ya bağlan
      const odooClient = new OdooClient(config.odoo_config)
      await odooClient.connect()

      // 3. Verileri Odoo formatına map et
      const odooData = this.mapToOdooFormat(excelData, config.mapping.field_mapping)

      // 4. Odoo'ya aktar
      for (let i = 0; i < odooData.length; i++) {
        try {
          await odooClient.create(config.mapping.model, odooData[i])
          result.imported_count++
        } catch (error: any) {
          result.failed_count++
          result.errors.push({
            row: i + 1 + (config.mapping.skip_rows || 0),
            error: error.message || 'Unknown error',
          })
        }
      }

      result.success = result.failed_count === 0
    } catch (error: any) {
      result.success = false
      result.errors.push({
        row: 0,
        error: error.message || 'Import failed',
      })
    }

    return result
  }

  /**
   * BOM (Bill of Materials) import
   */
  static async importBOM(
    file: File | Buffer,
    odooConfig: ExcelImportConfig['odoo_config']
  ): Promise<ImportResult> {
    const workbook = this.parseExcel(file)

    // BOM için özel mapping
    const bomMapping = {
      sheet_name: 'BOM',
      model: 'mrp.bom',
      field_mapping: {
        'Product Code': 'product_id', // Bu ID'ye çevrilmeli
        'Product Name': 'product_tmpl_id', // Bu ID'ye çevrilmeli
        'Quantity': 'product_qty',
        'UOM': 'product_uom_id',
      },
      skip_rows: 1,
    }

    return this.importToOdoo({
      file,
      mapping: bomMapping,
      odoo_config: odooConfig,
    })
  }

  /**
   * Product import
   */
  static async importProducts(
    file: File | Buffer,
    odooConfig: ExcelImportConfig['odoo_config']
  ): Promise<ImportResult> {
    const workbook = this.parseExcel(file)

    const productMapping = {
      sheet_name: 'Products',
      model: 'product.product',
      field_mapping: {
        'Name': 'name',
        'Code': 'default_code',
        'Barcode': 'barcode',
        'Sale Price': 'list_price',
        'Cost Price': 'standard_price',
        'Type': 'type',
        'Category': 'categ_id', // Bu ID'ye çevrilmeli
      },
      skip_rows: 1,
    }

    return this.importToOdoo({
      file,
      mapping: productMapping,
      odoo_config: odooConfig,
    })
  }

  /**
   * Employee import
   */
  static async importEmployees(
    file: File | Buffer,
    odooConfig: ExcelImportConfig['odoo_config']
  ): Promise<ImportResult> {
    const workbook = this.parseExcel(file)

    const employeeMapping = {
      sheet_name: 'Employees',
      model: 'hr.employee',
      field_mapping: {
        'Name': 'name',
        'Employee ID': 'identification_id',
        'Department': 'department_id', // Bu ID'ye çevrilmeli
        'Job Title': 'job_id', // Bu ID'ye çevrilmeli
        'Email': 'work_email',
        'Phone': 'work_phone',
      },
      skip_rows: 1,
    }

    return this.importToOdoo({
      file,
      mapping: employeeMapping,
      odoo_config: odooConfig,
    })
  }
}




