'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type ImportType = 'products' | 'bom' | 'employees' | 'custom'

interface ImportResult {
  success: boolean
  imported_count: number
  failed_count: number
  errors: Array<{ row: number; error: string }>
  warnings: Array<{ row: number; warning: string }>
}

export default function ExcelImportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [importType, setImportType] = useState<ImportType>('products')
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<Array<{ 
    id: string
    name: string
    odoo_instance_url?: string | null
    odoo_db_name?: string | null
  }>>([])
  
  // Odoo connection info (can be auto-filled from company)
  const [odooUrl, setOdooUrl] = useState('')
  const [odooDatabase, setOdooDatabase] = useState('')
  const [odooUsername, setOdooUsername] = useState('')
  const [odooPassword, setOdooPassword] = useState('')
  
  // Import result
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('companies').select('id, name, odoo_instance_url, odoo_db_name').order('name')
      if (data) {
        setCompanies(data)
        if (data.length > 0 && !companyId) {
          setCompanyId(data[0].id)
          // Auto-fill Odoo info if available
          if (data[0].odoo_instance_url) {
            setOdooUrl(data[0].odoo_instance_url)
          }
          if (data[0].odoo_db_name) {
            setOdooDatabase(data[0].odoo_db_name)
          }
        }
      }
    }
    loadCompanies()
  }, [])

  // Update Odoo info when company changes
  useEffect(() => {
    if (companyId) {
      const company = companies.find(c => c.id === companyId)
      if (company) {
        if (company.odoo_instance_url) {
          setOdooUrl(company.odoo_instance_url)
        }
        if (company.odoo_db_name) {
          setOdooDatabase(company.odoo_db_name)
        }
      }
    }
  }, [companyId, companies])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validExtensions = /\.(xlsx|xls|csv)$/i
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
      ]

      const isValidExtension = validExtensions.test(file.name)
      const isValidType = file.type === '' || validTypes.includes(file.type) || isValidExtension

      if (!isValidType) {
        setError('Lütfen geçerli bir Excel dosyası seçin (.xlsx, .xls, .csv)')
        setExcelFile(null)
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        setError('Dosya boyutu çok büyük. Maksimum 50MB olmalıdır.')
        setExcelFile(null)
        return
      }

      setExcelFile(file)
      setError('')
      setSuccess(false)
      setImportResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    setImportResult(null)

    if (!excelFile) {
      setError('Lütfen bir Excel dosyası seçin')
      setLoading(false)
      return
    }

    if (!companyId) {
      setError('Lütfen bir firma seçin')
      setLoading(false)
      return
    }

    if (!odooUrl || !odooDatabase || !odooUsername || !odooPassword) {
      setError('Lütfen tüm Odoo bağlantı bilgilerini girin')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Oturum açmanız gerekiyor')
        setLoading(false)
        router.push('/login')
        return
      }

      const formData = new FormData()
      formData.append('file', excelFile)
      formData.append('import_type', importType)
      formData.append('company_id', companyId)
      formData.append('odoo_url', odooUrl)
      formData.append('odoo_database', odooDatabase)
      formData.append('odoo_username', odooUsername)
      formData.append('odoo_password', odooPassword)

      console.log('[Excel Import] Starting import...', {
        fileName: excelFile.name,
        fileSize: excelFile.size,
        importType,
        companyId,
      })

      const response = await fetch('/api/excel/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      console.log('[Excel Import] Response:', result)

      if (!response.ok) {
        const errorMessage = result.error || 'Import başarısız oldu'
        console.error('[Excel Import] Error:', errorMessage)
        setError(`❌ ${errorMessage}`)
        setLoading(false)
        return
      }

      if (!result.success) {
        setError(`❌ Import başarısız oldu`)
        setLoading(false)
        return
      }

      setImportResult(result.data)
      setSuccess(true)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Excel Veri İçe Aktarma</h1>
          <p className="text-gray-600 mt-1">
            Excel dosyalarınızı Odoo'ya otomatik olarak aktarın
          </p>
        </div>
        <Link href="/companies">
          <Button variant="outline" size="sm">Firmalara Dön</Button>
        </Link>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Desteklenen Veri Tipleri:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Ürünler (Products):</strong> Ürün listesi, kodlar, fiyatlar</li>
              <li><strong>BOM (Bill of Materials):</strong> Üretim reçeteleri</li>
              <li><strong>Çalışanlar (Employees):</strong> Personel listesi</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">1. Excel Dosyası Seçin</h2>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file"
                disabled={loading}
              />
              <label
                htmlFor="excel-file"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Dosya Seç
              </label>
              {excelFile && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Seçilen dosya: <strong>{excelFile.name}</strong> ({(excelFile.size / 1024).toFixed(2)} KB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Import Type */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">2. Veri Tipi Seçin</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['products', 'bom', 'employees'] as ImportType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setImportType(type)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  importType === type
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="font-medium capitalize mb-1">
                  {type === 'products' && 'Ürünler'}
                  {type === 'bom' && 'BOM (Üretim Reçeteleri)'}
                  {type === 'employees' && 'Çalışanlar'}
                </div>
                <div className="text-sm text-gray-600">
                  {type === 'products' && 'Ürün listesi ve fiyatlar'}
                  {type === 'bom' && 'Üretim reçeteleri'}
                  {type === 'employees' && 'Personel bilgileri'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Company Selection */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">3. Firma Seçin</h2>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">Firma seçin...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* Odoo Connection */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">4. Odoo Bağlantı Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Odoo URL
              </label>
              <input
                type="text"
                value={odooUrl}
                onChange={(e) => setOdooUrl(e.target.value)}
                placeholder="https://odoo.example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Veritabanı Adı
              </label>
              <input
                type="text"
                value={odooDatabase}
                onChange={(e) => setOdooDatabase(e.target.value)}
                placeholder="odoo_db"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={odooUsername}
                onChange={(e) => setOdooUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                value={odooPassword}
                onChange={(e) => setOdooPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 whitespace-pre-line">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && importResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-800 mb-2">Import Tamamlandı!</p>
                <div className="text-sm text-green-700 space-y-1">
                  <p>✅ Başarılı: {importResult.imported_count} kayıt</p>
                  {importResult.failed_count > 0 && (
                    <p>❌ Başarısız: {importResult.failed_count} kayıt</p>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Hatalar:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {importResult.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx}>
                            Satır {err.row}: {err.error}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>... ve {importResult.errors.length - 5} hata daha</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={loading || !excelFile || !companyId}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                İçe Aktarılıyor...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                İçe Aktar
              </>
            )}
          </Button>
          {success && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setExcelFile(null)
                setSuccess(false)
                setImportResult(null)
                setError('')
              }}
            >
              Yeni Import
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

