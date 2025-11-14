-- ============================================
-- SPRINT 6.5: DEPARTMENT & TASK MANAGEMENT
-- ============================================
-- Created: 2025-11-13
-- Description: Departman ve görev yönetimi için tablolar, RLS politikaları, indeksler

-- ============================================
-- ENUMS (Idempotent - only create if not exists)
-- ============================================

-- Create ENUM types only if they don't exist
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'pending_review', 'completed', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_type AS ENUM ('kickoff_task', 'training', 'data_collection', 'review', 'approval', 'meeting');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'sent', 'accepted', 'declined');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- notification_type enum already exists in previous migration (20251111000000_create_sprint2_schema.sql)
-- It has values: 'email', 'message', 'calendar', 'task', 'system'
-- We'll use 'task' for task-related notifications and add a detail_type column for specificity
-- Note: PostgreSQL enum values can only be added in a transaction, and IF NOT EXISTS is not supported
-- So we'll use the existing enum and add detail_type TEXT column for more specific types

DO $$ BEGIN
  CREATE TYPE dependency_type AS ENUM ('finish_to_start', 'start_to_start', 'finish_to_finish');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE collaborator_role AS ENUM ('owner', 'collaborator', 'reviewer', 'observer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE phase_status AS ENUM ('pending', 'active', 'completed', 'delayed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM ('pending', 'completed', 'delayed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- 1. departments (Departmanlar)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- 'Üretim', 'Stok', 'Satınalma'
  technical_name TEXT NOT NULL, -- 'production', 'inventory', 'purchasing'
  description TEXT,
  
  -- Departman sorumlusu
  manager_id UUID REFERENCES profiles(id),
  
  -- Odoo mapping
  odoo_department_id INTEGER, -- Odoo'daki hr.department ID'si
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, technical_name)
);

-- 2. department_members (Departman Üyeleri)
CREATE TABLE IF NOT EXISTS department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'member', -- 'manager', 'member', 'viewer'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(department_id, user_id)
);

-- 3. department_contacts (Davet Bekleyen Kişiler)
CREATE TABLE IF NOT EXISTS department_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Kişi Bilgileri (henüz kullanıcı değil)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT,
  
  -- Davet Durumu
  invitation_status invitation_status DEFAULT 'pending',
  invitation_token TEXT UNIQUE,
  invitation_sent_at TIMESTAMPTZ,
  invitation_expires_at TIMESTAMPTZ,
  
  -- Kullanıcı oluşturulunca
  user_id UUID REFERENCES profiles(id), -- NULL ise henüz kayıt olmamış
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, email)
);

-- 4. tasks (Görevler)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  type task_type DEFAULT 'kickoff_task',
  
  -- Atama
  assigned_to UUID REFERENCES profiles(id),
  assigned_department_id UUID REFERENCES departments(id),
  
  -- Durum
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  
  -- Zaman
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Tamamlama gereksinimleri
  completion_requirements JSONB,
  -- {
  --   "requires_file_upload": true,
  --   "required_file_types": ["xlsx", "csv"],
  --   "requires_approval": true,
  --   "approval_by": "consultant",
  --   "min_data_rows": 10
  -- }
  
  -- Onay süreci
  completed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Bağlantılar
  related_module_id UUID REFERENCES odoo_modules(id),
  related_calendar_event_id UUID REFERENCES calendar_events(id),
  phase_id UUID, -- Will reference project_phases after creation
  milestone_id UUID, -- Will reference project_milestones after creation
  
  -- Bağımlılık kontrolü
  can_start BOOLEAN DEFAULT true,
  blocked_by TEXT[],
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. task_dependencies (Görev Bağımlılıkları)
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  dependency_type dependency_type DEFAULT 'finish_to_start',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

-- 6. task_attachments (Görev Dosyaları)
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. task_collaborators (Görev İşbirlikçileri)
CREATE TABLE IF NOT EXISTS task_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  department_id UUID REFERENCES departments(id),
  
  role collaborator_role NOT NULL DEFAULT 'collaborator',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(task_id, user_id)
);

-- 8. notifications (Bildirimler)
-- Table already exists from previous migration (20251111000000_create_sprint2_schema.sql)
-- We'll add missing columns for Sprint 6.5 features
DO $$ 
BEGIN
  -- Add missing columns to existing notifications table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'related_task_id'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'related_event_id'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN related_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'related_company_id'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN related_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  
  -- Add is_read column (migrate from status if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN is_read BOOLEAN DEFAULT false;
    
    -- Migrate existing status to is_read
    UPDATE notifications 
    SET is_read = (status = 'read')
    WHERE status IS NOT NULL;
  END IF;
  
  -- Add sent_via column for tracking notification channels
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'sent_via'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN sent_via TEXT[] DEFAULT ARRAY['platform'];
  END IF;
  
  -- Add detail_type for more specific notification types (task_assigned, task_due, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'detail_type'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN detail_type TEXT;
  END IF;
END $$;

-- 9. notification_preferences (Bildirim Tercihleri)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Kanal tercihleri
  email_enabled BOOLEAN DEFAULT true,
  platform_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  
  -- Bildirim tipleri
  task_assigned BOOLEAN DEFAULT true,
  task_due_reminder BOOLEAN DEFAULT true,
  meeting_reminder BOOLEAN DEFAULT true,
  mention BOOLEAN DEFAULT true,
  approval_request BOOLEAN DEFAULT true,
  
  -- Zamanlama
  quiet_hours_start TIME, -- '22:00'
  quiet_hours_end TIME,   -- '08:00'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 10. project_phases (Proje Fazları)
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- 'Hafta 1: Discovery', 'Hafta 2: Configuration'
  description TEXT,
  phase_number INTEGER NOT NULL,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  status phase_status DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. project_milestones (Proje Kilometre Taşları)
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL, -- 'Pre-Analiz Raporu Sunumu'
  description TEXT,
  due_date DATE NOT NULL,
  
  deliverables TEXT[], -- ['Analiz raporu', 'Sunum', 'Aksiyon planı']
  
  status milestone_status DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FOREIGN KEY CONSTRAINTS (After all tables exist)
-- ============================================

-- Update tasks table to reference project_phases and project_milestones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_phase_id_fkey'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_phase_id_fkey 
    FOREIGN KEY (phase_id) REFERENCES project_phases(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_milestone_id_fkey'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_milestone_id_fkey 
    FOREIGN KEY (milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_departments_technical_name ON departments(company_id, technical_name);

CREATE INDEX IF NOT EXISTS idx_department_members_dept ON department_members(department_id);
CREATE INDEX IF NOT EXISTS idx_department_members_user ON department_members(user_id);

CREATE INDEX IF NOT EXISTS idx_department_contacts_company ON department_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_department_contacts_email ON department_contacts(email);
CREATE INDEX IF NOT EXISTS idx_department_contacts_token ON department_contacts(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_department_contacts_status ON department_contacts(invitation_status);

CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(assigned_department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks(milestone_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends ON task_dependencies(depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);

CREATE INDEX IF NOT EXISTS idx_task_collaborators_task ON task_collaborators(task_id);
CREATE INDEX IF NOT EXISTS idx_task_collaborators_user ON task_collaborators(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_detail_type ON notifications(detail_type) WHERE detail_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_task ON notifications(related_task_id) WHERE related_task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_phases_project ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_status ON project_phases(status);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_phase ON project_milestones(phase_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_department_contacts_updated_at
  BEFORE UPDATE ON department_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_phases_updated_at
  BEFORE UPDATE ON project_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- Super Admin: Full access
CREATE POLICY "Super admins have full access to departments"
  ON departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins have full access to tasks"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins have full access to notifications"
  ON notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Company Admin: Access to own company
CREATE POLICY "Company admins access own company departments"
  ON departments FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

CREATE POLICY "Company admins access own company tasks"
  ON tasks FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin')
    )
  );

-- Users: View assigned tasks and department tasks
CREATE POLICY "Users can view assigned tasks"
  ON tasks FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR assigned_department_id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
    OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'company_admin')
    )
  );

-- Users: Update own assigned tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'company_admin')
    )
  );

-- Users: View own company departments
CREATE POLICY "Users can view company departments"
  ON departments FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users: View own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Users: Manage own notification preferences
CREATE POLICY "Users can manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Users: View own company project phases
CREATE POLICY "Users can view company project phases"
  ON project_phases FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE pr.id = auth.uid()
    )
  );

-- Users: View own company milestones
CREATE POLICY "Users can view company milestones"
  ON project_milestones FOR SELECT
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN profiles pr ON pr.company_id = p.company_id
      WHERE pr.id = auth.uid()
    )
  );

-- ============================================
-- UPDATE EXISTING TABLES
-- ============================================

-- Add department_id and task_id to calendar_events if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    -- Add department_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'calendar_events' AND column_name = 'department_id'
    ) THEN
      ALTER TABLE calendar_events 
      ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_calendar_events_department 
      ON calendar_events(department_id);
    END IF;
    
    -- Add task_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'calendar_events' AND column_name = 'task_id'
    ) THEN
      ALTER TABLE calendar_events 
      ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_calendar_events_task 
      ON calendar_events(task_id);
    END IF;
  END IF;
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE departments IS 'Firma departmanları. Her departmanın bir sorumlusu olabilir.';
COMMENT ON TABLE department_members IS 'Departman üyeleri. Bir kullanıcı birden fazla departmanda olabilir.';
COMMENT ON TABLE department_contacts IS 'Davet bekleyen kişiler. Henüz platform kullanıcısı olmayan departman sorumluları.';
COMMENT ON TABLE tasks IS 'Görevler. Departmanlara veya kullanıcılara atanabilir.';
COMMENT ON TABLE task_dependencies IS 'Görev bağımlılıkları. Bir görev diğer görevlerin tamamlanmasını bekleyebilir.';
COMMENT ON TABLE task_attachments IS 'Görev dosyaları. Supabase Storage kullanılır.';
COMMENT ON TABLE task_collaborators IS 'Görev işbirlikçileri. Birden fazla kişi veya departman bir görevde çalışabilir.';
COMMENT ON TABLE notifications IS 'Bildirimler. Email ve platform bildirimleri.';
COMMENT ON TABLE notification_preferences IS 'Kullanıcı bildirim tercihleri.';
COMMENT ON TABLE project_phases IS 'Proje fazları. Örn: Hafta 1: Discovery, Hafta 2: Configuration';
COMMENT ON TABLE project_milestones IS 'Proje kilometre taşları. Örn: Pre-Analiz Raporu Sunumu';

