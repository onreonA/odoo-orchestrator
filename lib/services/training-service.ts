import { createClient } from '@/lib/supabase/server'

interface TrainingMaterial {
  id: string
  title: string
  description: string
  type: string
  category: string
  content_url?: string
  created_at: string
}

interface TrainingProgress {
  id: string
  user_id: string
  material_id: string
  status: string
  progress_percentage: number
  completed_at?: string
}

interface GetMaterialsOptions {
  category?: string
}

interface CreateMaterialData {
  title: string
  description: string
  type: string
  category?: string
  content_url?: string
}

interface ProgressData {
  progress_percentage: number
  status: string
}

export class TrainingService {
  /**
   * Get training materials
   */
  static async getMaterials(
    options?: GetMaterialsOptions
  ): Promise<{ data: TrainingMaterial[] | null; error: { message: string } | null }> {
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

      // Build query
      let query = supabase.from('training_materials').select('*')

      // Apply filters
      if (options?.category) {
        query = query.eq('category', options.category)
      }

      // Order by created_at desc
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: data as TrainingMaterial[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to get materials' } }
    }
  }

  /**
   * Create training material
   */
  static async createMaterial(
    materialData: CreateMaterialData
  ): Promise<{ data: TrainingMaterial | null; error: { message: string } | null }> {
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

      // Validate required fields
      if (!materialData.title || !materialData.description || !materialData.type) {
        return { data: null, error: { message: 'Missing required fields' } }
      }

      // Insert material
      const { data, error } = await supabase
        .from('training_materials')
        .insert({
          ...materialData,
          category: materialData.category || 'general',
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: data as TrainingMaterial, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to create material' } }
    }
  }

  /**
   * Get user training progress
   */
  static async getUserProgress(): Promise<{
    data: TrainingProgress[] | null
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

      // Get user progress
      const { data, error } = await supabase
        .from('training_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        return { data: null, error: { message: error.message } }
      }

      return { data: data as TrainingProgress[], error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to get progress' } }
    }
  }

  /**
   * Update training progress
   */
  static async updateProgress(
    materialId: string,
    progress: ProgressData
  ): Promise<{ data: TrainingProgress | null; error: { message: string } | null }> {
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

      // Check if progress exists
      const { data: existingProgress } = await supabase
        .from('training_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('material_id', materialId)
        .single()

      let result
      if (existingProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from('training_progress')
          .update({
            ...progress,
            completed_at: progress.status === 'completed' ? new Date().toISOString() : null,
          })
          .eq('id', existingProgress.id)
          .select()
          .single()

        if (error) {
          return { data: null, error: { message: error.message } }
        }
        result = data
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from('training_progress')
          .insert({
            user_id: user.id,
            material_id: materialId,
            ...progress,
            completed_at: progress.status === 'completed' ? new Date().toISOString() : null,
          })
          .select()
          .single()

        if (error) {
          return { data: null, error: { message: error.message } }
        }
        result = data
      }

      return { data: result as TrainingProgress, error: null }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to update progress' } }
    }
  }

  /**
   * Get training statistics
   */
  static async getTrainingStats(): Promise<{
    data: {
      totalMaterials: number
      completedMaterials: number
      inProgressMaterials: number
    } | null
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

      // Get user profile for company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user.id)
        .single()

      // Get all training materials (filtered by company if needed)
      let materialsQuery = supabase.from('training_materials').select('id')
      if (profile?.company_id) {
        materialsQuery = materialsQuery.or(`company_id.eq.${profile.company_id},company_id.is.null`)
      }
      const { data: materials, error: materialsError } = await materialsQuery

      if (materialsError) {
        return { data: null, error: { message: materialsError.message } }
      }

      // Get user's training progress
      const { data: progress, error: progressError } = await supabase
        .from('training_progress')
        .select('status')
        .eq('user_id', user.id)

      if (progressError) {
        return { data: null, error: { message: progressError.message } }
      }

      const totalMaterials = materials?.length || 0
      const completedMaterials = progress?.filter(p => p.status === 'completed').length || 0
      const inProgressMaterials = progress?.filter(p => p.status === 'in_progress').length || 0

      return {
        data: {
          totalMaterials,
          completedMaterials,
          inProgressMaterials,
        },
        error: null,
      }
    } catch (error: any) {
      return { data: null, error: { message: error.message || 'Failed to get training stats' } }
    }
  }
}
