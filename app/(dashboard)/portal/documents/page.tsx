'use client'

import { useState, useEffect } from 'react'
import { FileText, Upload, Search, Filter, Download, Trash2, Edit, Tag } from 'lucide-react'
import Link from 'next/link'

interface Document {
  id: string
  title: string
  description?: string
  category: string
  file_name: string
  file_size?: number
  file_type?: string
  tags?: string[]
  created_at: string
  uploaded_by?: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)

  const categories = ['all', 'general', 'training', 'technical', 'user-guide', 'api-docs', 'other']

  useEffect(() => {
    loadDocuments()
  }, [selectedCategory, searchTerm])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/documents?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setDocuments(data.data || [])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'Genel',
      training: 'Eğitim',
      technical: 'Teknik',
      'user-guide': 'Kullanıcı Kılavuzu',
      'api-docs': 'API Dokümantasyonu',
      other: 'Diğer',
    }
    return labels[category] || category
  }

  const filteredDocuments = documents.filter((doc) => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false
    if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !doc.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Doküman Kütüphanesi</h1>
        <p className="text-gray-600">Projelerinizle ilgili tüm dokümanlar</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Doküman ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Tüm Kategoriler' : getCategoryLabel(cat)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Upload className="w-4 h-4" />
            Yükle
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Yükleniyor...</div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Henüz Doküman Yok</h2>
          <p className="text-gray-600 mb-4">İlk dokümanınızı yükleyerek başlayın</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Doküman Yükle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{doc.title}</h3>
                    <p className="text-sm text-gray-500">{getCategoryLabel(doc.category)}</p>
                  </div>
                </div>
              </div>

              {doc.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doc.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{doc.file_name}</span>
                <span>{formatFileSize(doc.file_size)}</span>
              </div>

              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {doc.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-gray-500">
                  {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                </span>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Doküman Yükle</h2>
            <p className="text-gray-600 mb-4">Doküman yükleme özelliği yakında eklenecek.</p>
            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

