/**
 * Kickoff Template Types
 * 
 * Extended types for kickoff templates including departments, tasks, calendar events,
 * project phases, milestones, and document requirements.
 */

export type TaskType = 'data_collection' | 'training' | 'review' | 'approval' | 'meeting'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface RequiredDocument {
  name: string // 'BOM Listesi'
  description: string
  template_url?: string // '/templates/bom_template.xlsx'
  required: boolean
  format: string[] // ['xlsx', 'csv']
  validation?: {
    min_rows?: number
    required_columns?: string[]
    max_size_mb?: number
  }
}

export interface TaskTemplate {
  title: string
  description: string
  type: TaskType
  priority: TaskPriority
  due_days: number // Kick-off'tan kaç gün sonra
  estimated_hours: number
  required_documents: RequiredDocument[]
  requires_approval: boolean
  depends_on: string[] // Diğer task'ların title'ları
  collaborator_departments: string[] // Diğer departmanların technical_name'leri
}

export interface CalendarEventTemplate {
  title: string
  description: string
  event_type: 'meeting' | 'training' | 'review' | 'deadline'
  duration_minutes: number
  day_offset: number // Kick-off'tan kaç gün sonra
  attendees: string[] // Roller: ['manager', 'consultant', 'team']
}

export interface DepartmentTemplate {
  name: string // 'Üretim'
  technical_name: string // 'production'
  description?: string
  manager_role_title?: string // 'Üretim Müdürü'
  responsibilities?: string[]
  tasks?: TaskTemplate[]
  calendar_events?: CalendarEventTemplate[]
  related_modules?: string[] // technical_name'ler
}

export interface MilestoneTemplate {
  title: string
  description: string
  day_offset: number
  deliverables: string[]
  responsible_departments: string[]
}

export interface PhaseTemplate {
  name: string // 'Hafta 1: Discovery'
  description: string
  duration_days: number
  focus_areas: string[]
  milestones: MilestoneTemplate[]
}

export interface ProjectTimeline {
  phases: PhaseTemplate[]
}

export interface DocumentTemplate {
  name: string
  description: string
  template_file_url: string
  category: string // 'bom', 'process', 'report'
}

/**
 * Extended KickoffTemplateData interface
 * Includes departments, tasks, calendar events, project timeline, and document templates
 */
export interface ExtendedKickoffTemplateData {
  // Existing fields (from original KickoffTemplateData)
  modules: Array<{
    name: string
    technical_name: string
    category?: string
    priority?: number
    phase?: number
  }>
  customFields?: Array<{
    model: string
    field_name: string
    field_type: string
    label: string
    required?: boolean
    options?: Record<string, any>
  }>
  workflows?: Array<{
    name: string
    model: string
    states: Array<{
      name: string
      label: string
    }>
    transitions: Array<{
      from: string
      to: string
      condition?: string
    }>
  }>
  dashboards?: Array<{
    name: string
    view_type: string
    components: Array<{
      type: string
      model?: string
      domain?: any[]
      fields?: string[]
    }>
  }>
  moduleConfigs?: Array<{
    module: string
    settings: Record<string, any>
  }>

  // New fields for Sprint 6.5
  departments: DepartmentTemplate[]
  project_timeline: ProjectTimeline
  document_templates: DocumentTemplate[]
}

