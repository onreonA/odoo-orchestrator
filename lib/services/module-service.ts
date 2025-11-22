import { createClient } from '@/lib/supabase/server'

export class ModuleService {
  /**
   * Install module
   */
  static async installModule(
    moduleId: string,
    options: { companyId: string; userId: string; settings?: any }
  ): Promise<{ data?: any; error?: { message: string } }> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('module_instances')
        .insert({
          module_id: moduleId,
          company_id: options.companyId,
          installed_by: options.userId,
          settings: options.settings || {},
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        return { error: { message: error.message } }
      }

      return { data }
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to install module' } }
    }
  }

  /**
   * Get module by slug
   */
  static async getModule(slug: string): Promise<{ data?: any; error?: { message: string } }> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.from('modules').select('*').eq('slug', slug).single()

      if (error) {
        return { error: { message: error.message } }
      }

      return { data }
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to get module' } }
    }
  }

  /**
   * Activate module instance
   */
  static async activateInstance(
    instanceId: string
  ): Promise<{ data?: any; error?: { message: string } }> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('module_instances')
        .update({ status: 'active' })
        .eq('id', instanceId)
        .select()
        .single()

      if (error) {
        return { error: { message: error.message } }
      }

      return { data }
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to activate module' } }
    }
  }

  /**
   * Deactivate module instance
   */
  static async deactivateInstance(
    instanceId: string
  ): Promise<{ data?: any; error?: { message: string } }> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('module_instances')
        .update({ status: 'inactive' })
        .eq('id', instanceId)
        .select()
        .single()

      if (error) {
        return { error: { message: error.message } }
      }

      return { data }
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to deactivate module' } }
    }
  }

  /**
   * Uninstall module instance
   */
  static async uninstallInstance(instanceId: string): Promise<{ error?: { message: string } }> {
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('module_instances').delete().eq('id', instanceId)

      if (error) {
        return { error: { message: error.message } }
      }

      return {}
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to uninstall module' } }
    }
  }
}



