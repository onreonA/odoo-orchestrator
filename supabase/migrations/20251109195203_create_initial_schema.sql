-- ============================================
-- ODOO ORCHESTRATOR - INITIAL DATABASE SCHEMA
-- ============================================
-- Created: 2025-11-09
-- Description: Tüm temel tablolar, RLS politikaları, indeksler ve trigger'lar

-- ============================================
-- EXTENSIONS
-- ============================================
-- Vector similarity search için (RAG - Knowledge Base)
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- ENUMS (Enumeration Types)
-- ============================================
CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'company_user', 'company_viewer');
CREATE TYPE company_status AS ENUM ('discovery', 'planning', 'implementation', 'live', 'support');
CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'testing', 'completed');
CREATE TYPE project_phase AS ENUM ('discovery', 'configuration', 'development', 'training', 'go_live');
CREATE TYPE module_status AS ENUM ('planned', 'configuring', 'testing', 'deployed');
CREATE TYPE config_status AS ENUM ('draft', 'review', 'approved', 'deployed');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE migration_status AS ENUM ('pending', 'testing', 'applied', 'failed', 'rolled_back');

-- ============================================
-- CORE TABLES
-- ============================================

-- 1. profiles (Kullanıcı Profilleri)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'company_user',
  company_id UUID, -- Foreign key will be added after companies table
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. companies (Firmalar)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL, -- 'furniture', 'defense', 'metal', etc.
  size TEXT, -- 'small', 'medium', 'large'
  status company_status DEFAULT 'discovery',
  health_score INTEGER DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
  
  -- Contact Info
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  
  -- Odoo Info
  odoo_instance_url TEXT,
  odoo_db_name TEXT,
  odoo_version TEXT,
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'trial',
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for profiles.company_id
ALTER TABLE profiles ADD CONSTRAINT profiles_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- 3. projects (Projeler)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'implementation', 'upgrade', 'support'
  status project_status DEFAULT 'planning',
  phase project_phase,
  
  -- Timeline
  start_date DATE,
  planned_go_live DATE,
  actual_go_live DATE,
  
  -- Budget
  estimated_budget DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  
  -- Progress
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. discoveries (Ön Analizler)
CREATE TABLE discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Meeting Info
  meeting_date TIMESTAMPTZ,
  meeting_type TEXT, -- 'initial', 'follow-up', 'technical'
  attendees TEXT[],
  
  -- Content
  raw_notes TEXT,
  transcript TEXT,
  audio_file_url TEXT,
  
  -- AI Analysis
  ai_summary JSONB,
  extracted_processes JSONB,
  extracted_requirements JSONB,
  pain_points TEXT[],
  opportunities TEXT[],
  
  -- Status
  analysis_status TEXT DEFAULT 'pending', -- 'pending', 'analyzing', 'completed'
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. processes (İş Süreçleri)
CREATE TABLE processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  discovery_id UUID REFERENCES discoveries(id),
  
  name TEXT NOT NULL,
  type TEXT, -- 'sales', 'manufacturing', 'inventory', 'finance', etc.
  description TEXT,
  
  -- Process Details
  departments_involved TEXT[],
  systems_involved TEXT[],
  current_pain_points TEXT[],
  
  -- Diagrams
  bpmn_diagram JSONB,
  data_flow_diagram JSONB,
  
  -- Odoo Mapping
  suggested_modules TEXT[],
  customization_needed BOOLEAN DEFAULT false,
  customization_notes TEXT,
  
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. odoo_modules (Odoo Modülleri)
CREATE TABLE odoo_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  
  name TEXT NOT NULL,
  technical_name TEXT NOT NULL,
  category TEXT,
  
  -- Status
  status module_status DEFAULT 'planned',
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  phase INTEGER DEFAULT 1, -- implementation phase
  
  -- Configuration
  is_standard BOOLEAN DEFAULT true,
  customization_level TEXT, -- 'none', 'light', 'medium', 'heavy'
  configuration_notes TEXT,
  
  -- Dependencies
  depends_on TEXT[],
  
  -- Deployment
  deployed_at TIMESTAMPTZ,
  deployed_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. configurations (Konfigürasyonlar)
CREATE TABLE configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES odoo_modules(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- 'model', 'view', 'report', 'workflow', 'security'
  name TEXT NOT NULL,
  
  -- Input
  natural_language_input TEXT,
  requirements JSONB,
  
  -- Generated Code
  generated_code TEXT,
  file_path TEXT,
  
  -- Status
  status config_status DEFAULT 'draft',
  
  -- Testing
  test_results JSONB,
  test_passed BOOLEAN,
  
  -- Version Control
  version INTEGER DEFAULT 1,
  git_commit_hash TEXT,
  
  created_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. support_tickets (Destek Talepleri)
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT, -- 'bug', 'feature', 'question', 'issue'
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  
  -- AI Analysis
  ai_category TEXT,
  ai_suggested_solution TEXT,
  ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
  
  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  assigned_to_ai_agent TEXT,
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. knowledge_base (Bilgi Bankası)
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id), -- NULL = global knowledge
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT, -- 'process', 'technical', 'training', 'faq'
  category TEXT,
  tags TEXT[],
  
  -- Vector Search (RAG için)
  embedding vector(1536), -- OpenAI embeddings
  
  -- Metadata
  source TEXT, -- 'manual', 'ai_generated', 'meeting', 'documentation'
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  usage_count INTEGER DEFAULT 0,
  
  is_public BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ai_agent_tasks (AI Agent Görevleri)
CREATE TABLE ai_agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  
  -- Input
  input_data JSONB,
  context JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Output
  output_data JSONB,
  error_message TEXT,
  
  -- Performance
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. migration_log (Migration Kayıtları)
CREATE TABLE migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  
  -- Content
  sql_up TEXT NOT NULL,
  sql_down TEXT NOT NULL,
  
  -- Status
  status migration_status DEFAULT 'pending',
  
  -- Testing
  test_results JSONB,
  test_passed BOOLEAN,
  
  -- Deployment
  applied_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  
  -- AI Generated
  generated_by_ai BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (Performance)
-- ============================================
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_health_score ON companies(health_score);

CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);

CREATE INDEX idx_discoveries_project_id ON discoveries(project_id);
CREATE INDEX idx_discoveries_company_id ON discoveries(company_id);

CREATE INDEX idx_processes_company_id ON processes(company_id);

CREATE INDEX idx_odoo_modules_company_id ON odoo_modules(company_id);
CREATE INDEX idx_odoo_modules_status ON odoo_modules(status);

CREATE INDEX idx_support_tickets_company_id ON support_tickets(company_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

CREATE INDEX idx_knowledge_base_company_id ON knowledge_base(company_id);

-- Vector similarity search index
CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discoveries_updated_at BEFORE UPDATE ON discoveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_odoo_modules_updated_at BEFORE UPDATE ON odoo_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configurations_updated_at BEFORE UPDATE ON configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE odoo_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Super Admin: Full access to everything
CREATE POLICY "Super admins have full access to companies"
  ON companies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins have full access to profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Company Admin: Access to own company
CREATE POLICY "Company admins access own company"
  ON companies FOR ALL
  USING (
    id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Company admins access own company projects"
  ON projects FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Company Users: Read-only access to own company
CREATE POLICY "Company users read own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- COMMENTS (Documentation)
-- ============================================
COMMENT ON TABLE profiles IS 'Kullanıcı profilleri - Supabase auth ile entegre';
COMMENT ON TABLE companies IS 'Müşteri firmaları';
COMMENT ON TABLE projects IS 'Firma projeleri';
COMMENT ON TABLE discoveries IS 'Ön analiz toplantıları ve AI analizleri';
COMMENT ON TABLE processes IS 'İş süreçleri ve BPMN diyagramları';
COMMENT ON TABLE odoo_modules IS 'Odoo modülleri ve deployment durumları';
COMMENT ON TABLE configurations IS 'AI tarafından üretilen Odoo konfigürasyonları';
COMMENT ON TABLE support_tickets IS 'Müşteri destek talepleri';
COMMENT ON TABLE knowledge_base IS 'Bilgi bankası - RAG için vector embeddings';
COMMENT ON TABLE ai_agent_tasks IS 'AI agent görevleri ve performans metrikleri';
COMMENT ON TABLE migration_log IS 'Database migration kayıtları';

