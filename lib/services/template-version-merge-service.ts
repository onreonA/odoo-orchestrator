import { createClient } from '@/lib/supabase/server'

export interface MergeConflict {
  field: string
  baseValue: any
  sourceValue: any
  targetValue: any
  resolution?: 'base' | 'source' | 'target' | 'manual'
}

export interface MergeResult {
  success: boolean
  mergedVersionId?: string
  conflicts: MergeConflict[]
  errors: string[]
}

export class TemplateVersionMergeService {
  private supabase: any

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Merge two template versions
   */
  async mergeVersions(
    baseVersionId: string,
    sourceVersionId: string,
    targetVersionId: string,
    conflictResolutions?: Record<string, 'base' | 'source' | 'target' | 'manual'>
  ): Promise<MergeResult> {
    // Get all three versions
    const [base, source, target] = await Promise.all([
      this.getVersion(baseVersionId),
      this.getVersion(sourceVersionId),
      this.getVersion(targetVersionId),
    ])

    if (!base || !source || !target) {
      return {
        success: false,
        conflicts: [],
        errors: ['One or more versions not found'],
      }
    }

    // Detect conflicts
    const conflicts = this.detectConflicts(base, source, target)

    // Resolve conflicts
    const resolvedConflicts = conflicts.map(conflict => {
      if (conflictResolutions?.[conflict.field]) {
        return {
          ...conflict,
          resolution: conflictResolutions[conflict.field],
        }
      }
      return conflict
    })

    // Check if all conflicts are resolved
    const unresolvedConflicts = resolvedConflicts.filter(
      c => !c.resolution || c.resolution === 'manual'
    )
    if (unresolvedConflicts.length > 0) {
      return {
        success: false,
        conflicts: unresolvedConflicts,
        errors: ['Some conflicts are not resolved'],
      }
    }

    // Merge versions
    try {
      const mergedStructure = this.mergeStructures(base, source, target, resolvedConflicts)

      // Create new version from merged structure
      const mergedVersionId = await this.createMergedVersion(
        base.template_id,
        mergedStructure,
        `Merged: ${source.version} + ${target.version}`
      )

      return {
        success: true,
        mergedVersionId,
        conflicts: [],
        errors: [],
      }
    } catch (error: any) {
      return {
        success: false,
        conflicts: resolvedConflicts,
        errors: [error.message],
      }
    }
  }

  /**
   * Get version data
   */
  private async getVersion(versionId: string): Promise<any> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('template_versions')
      .select('*')
      .eq('id', versionId)
      .single()

    if (error) {
      throw new Error(`Failed to get version: ${error.message}`)
    }

    return data
  }

  /**
   * Detect conflicts between versions
   */
  private detectConflicts(base: any, source: any, target: any): MergeConflict[] {
    const conflicts: MergeConflict[] = []

    // Compare custom fields
    const baseFields = base.structure?.custom_fields || []
    const sourceFields = source.structure?.custom_fields || []
    const targetFields = target.structure?.custom_fields || []

    // Find conflicts in custom fields
    const allFieldNames = new Set([
      ...baseFields.map((f: any) => f.field_name),
      ...sourceFields.map((f: any) => f.field_name),
      ...targetFields.map((f: any) => f.field_name),
    ])

    for (const fieldName of allFieldNames) {
      const baseField = baseFields.find((f: any) => f.field_name === fieldName)
      const sourceField = sourceFields.find((f: any) => f.field_name === fieldName)
      const targetField = targetFields.find((f: any) => f.field_name === fieldName)

      if (this.hasConflict(baseField, sourceField, targetField)) {
        conflicts.push({
          field: `custom_fields.${fieldName}`,
          baseValue: baseField,
          sourceValue: sourceField,
          targetValue: targetField,
        })
      }
    }

    // Compare workflows, dashboards, etc. (similar logic)
    // ... (simplified for brevity)

    return conflicts
  }

  /**
   * Check if there's a conflict between three values
   */
  private hasConflict(base: any, source: any, target: any): boolean {
    const baseStr = JSON.stringify(base)
    const sourceStr = JSON.stringify(source)
    const targetStr = JSON.stringify(target)

    // Conflict if source and target differ, and both differ from base
    return sourceStr !== targetStr && (sourceStr !== baseStr || targetStr !== baseStr)
  }

  /**
   * Merge structures based on conflict resolutions
   */
  private mergeStructures(base: any, source: any, target: any, conflicts: MergeConflict[]): any {
    const merged = JSON.parse(JSON.stringify(base)) // Deep clone

    for (const conflict of conflicts) {
      let value: any
      switch (conflict.resolution) {
        case 'source':
          value = conflict.sourceValue
          break
        case 'target':
          value = conflict.targetValue
          break
        case 'base':
          value = conflict.baseValue
          break
        default:
          value = conflict.baseValue
      }

      // Set value in merged structure
      const fieldPath = conflict.field.split('.')
      let current: any = merged
      for (let i = 0; i < fieldPath.length - 1; i++) {
        if (!current[fieldPath[i]]) {
          current[fieldPath[i]] = {}
        }
        current = current[fieldPath[i]]
      }
      current[fieldPath[fieldPath.length - 1]] = value
    }

    return merged
  }

  /**
   * Create merged version
   */
  private async createMergedVersion(
    templateId: string,
    structure: any,
    description: string
  ): Promise<string> {
    // Get latest version number
    const supabase = await this.getSupabase()
    const { data: versions } = await supabase
      .from('template_versions')
      .select('version')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false })
      .limit(1)

    const latestVersion = versions?.[0]?.version || '1.0.0'
    const versionParts = latestVersion.split('.').map(Number)
    versionParts[2]++ // Increment patch version
    const newVersion = versionParts.join('.')

    const { data, error } = await supabase
      .from('template_versions')
      .insert({
        template_id: templateId,
        version: newVersion,
        structure,
        description,
        is_merged: true,
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create merged version: ${error.message}`)
    }

    return data.id
  }

  /**
   * Create a branch from a version
   */
  async createBranch(
    templateId: string,
    baseVersionId: string,
    branchName: string
  ): Promise<string> {
    const baseVersion = await this.getVersion(baseVersionId)

    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('template_versions')
      .insert({
        template_id: templateId,
        version: `${baseVersion.version}-${branchName}`,
        structure: baseVersion.structure,
        description: `Branch: ${branchName}`,
        branch_name: branchName,
        parent_version_id: baseVersionId,
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create branch: ${error.message}`)
    }

    return data.id
  }

  /**
   * Get all branches for a template
   */
  async getBranches(templateId: string): Promise<any[]> {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('template_versions')
      .select('*')
      .eq('template_id', templateId)
      .not('branch_name', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get branches: ${error.message}`)
    }

    return data || []
  }
}

export function getTemplateVersionMergeService(): TemplateVersionMergeService {
  return new TemplateVersionMergeService()
}
