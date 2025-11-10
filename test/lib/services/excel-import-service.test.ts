import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExcelImportService } from '@/lib/services/excel-import-service'
import * as XLSX from 'xlsx'

// Mock xlsx
vi.mock('xlsx', () => ({
  default: {
    read: vi.fn(),
    utils: {
      sheet_to_json: vi.fn(),
    },
  },
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}))

describe('ExcelImportService', () => {
  const mockWorkbook = {
    Sheets: {
      Products: {},
    },
  }

  beforeEach(() => {
    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any)
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
      { Name: 'Product 1', Code: 'P001', 'Sale Price': 100 },
      { Name: 'Product 2', Code: 'P002', 'Sale Price': 200 },
    ])
  })

  describe('parseExcel', () => {
    it('should parse Excel file', () => {
      const file = Buffer.from('test')
      const result = ExcelImportService.parseExcel(file)

      expect(XLSX.read).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('sheetToJson', () => {
    it('should convert sheet to JSON', () => {
      const result = ExcelImportService.sheetToJson(mockWorkbook as any, 'Products')

      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should skip rows', () => {
      ExcelImportService.sheetToJson(mockWorkbook as any, 'Products', 1)

      expect(XLSX.utils.sheet_to_json).toHaveBeenCalled()
    })

    it('should throw error if sheet not found', () => {
      const workbook = { Sheets: {} }

      expect(() => {
        ExcelImportService.sheetToJson(workbook as any, 'NonExistent')
      }).toThrow('Sheet "NonExistent" not found')
    })
  })

  describe('mapToOdooFormat', () => {
    it('should map Excel data to Odoo format', () => {
      const excelData = [
        { Name: 'Product 1', Code: 'P001', Price: 100 },
        { Name: 'Product 2', Code: 'P002', Price: 200 },
      ]

      const fieldMapping = {
        Name: 'name',
        Code: 'default_code',
        Price: 'list_price',
      }

      const result = ExcelImportService.mapToOdooFormat(excelData, fieldMapping)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        name: 'Product 1',
        default_code: 'P001',
        list_price: 100,
      })
    })

    it('should skip null/empty values', () => {
      const excelData = [{ Name: 'Product 1', Code: null, Price: '' }]
      const fieldMapping = { Name: 'name', Code: 'default_code', Price: 'list_price' }

      const result = ExcelImportService.mapToOdooFormat(excelData, fieldMapping)

      expect(result[0]).toEqual({ name: 'Product 1' })
      expect(result[0]).not.toHaveProperty('default_code')
      expect(result[0]).not.toHaveProperty('list_price')
    })
  })
})




