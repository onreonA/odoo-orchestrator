import { createClient } from '@/lib/supabase/server'

interface Document {
  id: string
  title: string
  category: string
  company_id: string
  uploaded_by: string
  file_name: string
  file_path: string
  file_size?: number
  created_at: string
}

interface GetDocumentsOptions {
  category?: string
  search?: string
}

interface CreateDocumentData {
  title: string
  category: string
  file_name: string
  file_path: string
  file_size?: number
}

interface DocumentStats {
  total: number
  byCategory: Record<string, number>
  totalSize: number
}

export class DocumentService {
  /**
   * Get documents with optional filters
   */
  static async getDocuments(
    options?: GetDocumentsOptions
  ): Promise<{ data: Document[] | null; error: { message: string } | null }> {
    try {
      const supabase = await createClient()

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return { data: null, error: { message: 'Unauthorized' } }
      }

      // Get user profile to get company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      // Build query
      let query = supabase.from('documents').select('*').eq('company_id', profile.company_id)

      // Apply filters
      if (options?.category) {
        query = query.eq('category', options.category)
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
      }

      // Order by created_at desc
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: data as Document[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to get documents' } }
    }
  }

  /**
   * Get document by ID
   */
  static async getDocumentById(
    id: string
  ): Promise<{ data: Document | null; error: { message: string } | null }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase.from('documents').select('*').eq('id', id).single()

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: data as Document, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to get document' } }
    }
  }

  /**
   * Create document
   */
  static async createDocument(
    documentData: CreateDocumentData
  ): Promise<{ data: Document | null; error: { message: string } | null }> {
    try {
      const supabase = await createClient()

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return { data: null, error: { message: 'Unauthorized' } }
      }

      // Get user profile to get company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      // Insert document
      const { data, error } = await supabase
        .from('documents')
        .insert({
          ...documentData,
          company_id: profile.company_id,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: data as Document, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to create document' } }
    }
  }

  /**
   * Update document
   */
  static async updateDocument(
    id: string,
    updates: Partial<CreateDocumentData>
  ): Promise<{ data: Document | null; error: { message: string } | null }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: data as Document, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to update document' } }
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(id: string): Promise<{ error: { message: string } | null }> {
    try {
      const supabase = await createClient()

      // Get document to get file_path
      const { data: document } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', id)
        .single()

      // Delete from storage if file_path exists
      if (document?.file_path) {
        const pathParts = document.file_path.split('/')
        const bucket = pathParts[0] || 'documents'
        const filePath = pathParts.slice(1).join('/')

        await supabase.storage.from(bucket).remove([filePath])
      }

      // Delete document record
      const { error } = await supabase.from('documents').delete().eq('id', id)

      if (error) {
        return { error: { message: error.message } }
      }

      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to delete document' } }
    }
  }

  /**
   * Get document categories
   */
  static getCategories(): string[] {
    return ['general', 'training', 'technical', 'legal', 'financial', 'hr', 'other']
  }

  /**
   * Get document statistics
   */
  static async getDocumentStats(): Promise<{
    data: DocumentStats | null
    error: { message: string } | null
  }> {
    try {
      const supabase = await createClient()

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return { data: null, error: { message: 'Unauthorized' } }
      }

      // Get user profile to get company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return { data: null, error: { message: 'User profile not found' } }
      }

      // Get all documents for company
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, category, file_size')
        .eq('company_id', profile.company_id)

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      // Calculate stats
      const stats: DocumentStats = {
        total: documents?.length || 0,
        byCategory: {},
        totalSize: 0,
      }

      documents?.forEach((doc: any) => {
        stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1
        stats.totalSize += doc.file_size || 0
      })

      return { data: stats, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to get document stats' } }
    }
  }
}
