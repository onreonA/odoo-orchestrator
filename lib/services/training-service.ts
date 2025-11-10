/**
 * Training Service
 * 
 * Eğitim materyalleri ve ilerleme takibi için servis
 */

import { createClient } from '@/lib/supabase/server'

export interface TrainingMaterial {
  id: string
  company_id: string
  project_id?: string
  title: string
  description?: string
  category: string
  type: string
  content_url?: string
  duration_minutes?: number
  difficulty_level: string
  created_by?: string
  tags?: string[]
  is_required: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface TrainingProgress {
  id: string
  user_id: string
  training_material_id: string
  company_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  progress_percentage: number
  time_spent_minutes: number
  completed_at?: string
  last_accessed_at?: string
  quiz_score?: number
  quiz_attempts: number
  created_at: string
  updated_at: string
}

export interface TrainingStats {
  totalMaterials: number
  completedMaterials: number
  inProgressMaterials: number
  notStartedMaterials: number
  totalTimeSpent: number
  averageScore?: number
  completionRate: number
}

export class TrainingService {
  /**
   * Eğitim materyallerini listele
   */
  static async getMaterials(filters?: {
    companyId?: string
    projectId?: string
    category?: string
    type?: string
    isRequired?: boolean
  }): Promise<{ data: TrainingMaterial[] | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get user's company_id
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()

    let query = supabase
      .from('training_materials')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })

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

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.isRequired !== undefined) {
      query = query.eq('is_required', filters.isRequired)
    }

    const { data, error } = await query

    return { data, error }
  }

  /**
   * Tek bir eğitim materyalini getir
   */
  static async getMaterialById(id: string): Promise<{ data: TrainingMaterial | null; error: any }> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('training_materials').select('*').eq('id', id).single()

    return { data, error }
  }

  /**
   * Kullanıcının eğitim ilerlemesini getir
   */
  static async getUserProgress(userId?: string): Promise<{ data: TrainingProgress[] | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    const targetUserId = userId || user.id

    const { data, error } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', targetUserId)
      .order('updated_at', { ascending: false })

    return { data, error }
  }

  /**
   * Belirli bir materyal için kullanıcı ilerlemesini getir
   */
  static async getProgressByMaterial(
    materialId: string,
    userId?: string
  ): Promise<{ data: TrainingProgress | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    const targetUserId = userId || user.id

    const { data, error } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('training_material_id', materialId)
      .single()

    return { data, error }
  }

  /**
   * Eğitim ilerlemesini güncelle veya oluştur
   */
  static async updateProgress(
    materialId: string,
    progress: Partial<TrainingProgress>
  ): Promise<{ data: TrainingProgress | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get material to get company_id
    const { data: material } = await supabase
      .from('training_materials')
      .select('company_id')
      .eq('id', materialId)
      .single()

    if (!material) {
      return { data: null, error: { message: 'Training material not found' } }
    }

    // Check if progress exists
    const { data: existingProgress } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('training_material_id', materialId)
      .single()

    let result
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('training_progress')
        .update({
          ...progress,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Create new progress
      const { data, error } = await supabase
        .from('training_progress')
        .insert({
          user_id: user.id,
          training_material_id: materialId,
          company_id: material.company_id,
          status: progress.status || 'in_progress',
          progress_percentage: progress.progress_percentage || 0,
          time_spent_minutes: progress.time_spent_minutes || 0,
          last_accessed_at: new Date().toISOString(),
        })
        .select()
        .single()

      result = { data, error }
    }

    return result
  }

  /**
   * Eğitim istatistiklerini getir
   */
  static async getTrainingStats(userId?: string): Promise<{ data: TrainingStats | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    const targetUserId = userId || user.id

    // Get user's company_id
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', targetUserId).single()

    if (!profile?.company_id) {
      return { data: null, error: { message: 'User company not found' } }
    }

    // Get all materials for company
    const { data: materials } = await supabase
      .from('training_materials')
      .select('id')
      .eq('company_id', profile.company_id)

    // Get all progress for user
    const { data: progress } = await supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', targetUserId)

    const totalMaterials = materials?.length || 0
    const completedMaterials = progress?.filter((p) => p.status === 'completed').length || 0
    const inProgressMaterials = progress?.filter((p) => p.status === 'in_progress').length || 0
    const notStartedMaterials = totalMaterials - completedMaterials - inProgressMaterials
    const totalTimeSpent = progress?.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) || 0

    const completedWithScore = progress?.filter((p) => p.status === 'completed' && p.quiz_score !== null) || []
    const averageScore =
      completedWithScore.length > 0
        ? completedWithScore.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / completedWithScore.length
        : undefined

    const completionRate = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0

    return {
      data: {
        totalMaterials,
        completedMaterials,
        inProgressMaterials,
        notStartedMaterials,
        totalTimeSpent,
        averageScore,
        completionRate,
      },
      error: null,
    }
  }

  /**
   * Eğitim materyali oluştur
   */
  static async createMaterial(material: Partial<TrainingMaterial>): Promise<{ data: TrainingMaterial | null; error: any }> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { data: null, error: { message: 'Unauthorized' } }
    }

    // Get user's company_id if not provided
    if (!material.company_id) {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (profile?.company_id) {
        material.company_id = profile.company_id
      }
    }

    const { data, error } = await supabase
      .from('training_materials')
      .insert({
        ...material,
        created_by: user.id,
      })
      .select()
      .single()

    return { data, error }
  }
}

