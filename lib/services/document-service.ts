/**
 * Document Service
 * 
 * Doküman yönetimi için servis
 */

import { createClient } from '@/lib/supabase/server'

export interface Document {
  id: string
  company_id: string
  project_id?: string
  title: string
  description?: string
  category: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  mime_type?: string
  uploaded_by?: string
  version: number
  is_public: boolean
  tags?: string[]
  access_level: string
  created_at: string
  updated_at: string
}

export interface DocumentFilters {
  companyId?: string
  projectId?: string
  category?: string
  search?: string
  tags?: string[]
}

export class DocumentService {
  /**
   * Dokümanları listele
   */
  static async getDocuments(filters?: DocumentFilters): Promise<{ data: Document[] | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get user's company_id
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()

    let query = supabase.from('documents').select('*').order('created_at', { ascending: false })

    // Filter by company (if not super admin)
    if (profile?.company_id) {
      query = query.eq('company_id', profile.company_id)
    } else if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId)
    }

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    const { data, error } = await query

    return { data, error }
  }

  /**
   * Tek bir dokümanı getir
   */
  static async getDocumentById(id: string): Promise<{ data: Document | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('documents').select('*').eq('id', id).single()

    return { data, error }
  }

  /**
   * Doküman oluştur
   */
  static async createDocument(document: Partial<Document>): Promise<{ data: Document | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get user's company_id if not provided
    if (!document.company_id) {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (profile?.company_id) {
        document.company_id = profile.company_id
      }
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        ...document,
        uploaded_by: user.id,
      })
      .select()
      .single()

    return { data, error }
  }

  /**
   * Doküman güncelle
   */
  static async updateDocument(id: string, updates: Partial<Document>): Promise<{ data: Document | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('documents').update(updates).eq('id', id).select().single()

    return { data, error }
  }

  /**
   * Doküman sil
   */
  static async deleteDocument(id: string): Promise<{ error: any }> {
    const supabase = await createClient()

    // Get document to delete file from storage
    const { data: document } = await supabase.from('documents').select('file_path').eq('id', id).single()

    // Delete from database
    const { error } = await supabase.from('documents').delete().eq('id', id)

    // Delete file from storage if exists
    if (!error && document?.file_path) {
      const filePath = document.file_path.replace('documents/', '')
      await supabase.storage.from('documents').remove([filePath])
    }

    return { error }
  }

  /**
   * Kategorileri getir
   */
  static async getCategories(): Promise<string[]> {
    return ['general', 'training', 'technical', 'user-guide', 'api-docs', 'other']
  }

  /**
   * Doküman istatistiklerini getir
   */
  static async getDocumentStats(companyId?: string): Promise<{ data: any; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get user's company_id
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()

    let query = supabase.from('documents').select('id, category, file_size')

    if (companyId) {
      query = query.eq('company_id', companyId)
    } else if (profile?.company_id) {
      query = query.eq('company_id', profile.company_id)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error }
    }

    const stats = {
      total: data?.length || 0,
      byCategory: {} as Record<string, number>,
      totalSize: 0,
    }

    data?.forEach((doc) => {
      stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1
      stats.totalSize += doc.file_size || 0
    })

    return { data: stats, error: null }
  }
}

