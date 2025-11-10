-- ============================================
-- PERFORMANCE OPTIMIZATION
-- ============================================
-- Created: 2025-11-12
-- Description: Database performance optimizations - indexes, query improvements
-- Sprint: 5

-- ============================================
-- ADDITIONAL INDEXES FOR FREQUENT QUERIES
-- ============================================

-- Companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_name_search ON companies USING gin(to_tsvector('english', name));

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_company_status ON projects(company_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_phase ON projects(phase);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_completion ON projects(completion_percentage) WHERE completion_percentage < 100;

-- Profiles table indexes (for user lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_company_role ON profiles(company_id, role) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_company_status ON support_tickets(company_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to) WHERE assigned_to IS NOT NULL;

-- Calendar events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_organizer_date ON calendar_events(organizer_id, start_time) WHERE organizer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_company_date ON calendar_events(company_id, start_time) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);

-- Email indexes
CREATE INDEX IF NOT EXISTS idx_emails_account_status ON emails(email_account_id, email_status);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(email_status);
CREATE INDEX IF NOT EXISTS idx_emails_priority ON emails(email_priority);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_sender ON messages(thread_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Message threads indexes
CREATE INDEX IF NOT EXISTS idx_message_threads_participants ON message_threads USING gin(participants);
CREATE INDEX IF NOT EXISTS idx_message_threads_company ON message_threads(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_message_threads_updated_at ON message_threads(updated_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status) WHERE status = 'unread';
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_company_category ON documents(company_id, category);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_title_search ON documents USING gin(to_tsvector('english', title));

-- Training materials indexes
CREATE INDEX IF NOT EXISTS idx_training_materials_category ON training_materials(category);
CREATE INDEX IF NOT EXISTS idx_training_materials_type ON training_materials(type);
CREATE INDEX IF NOT EXISTS idx_training_materials_is_required ON training_materials(is_required) WHERE is_required = true;

-- Training progress indexes
CREATE INDEX IF NOT EXISTS idx_training_progress_user_status ON training_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_training_progress_material ON training_progress(training_material_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_status ON training_progress(status);

-- Activity logs indexes (only if table exists - created in migration 20251112000004)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_activity_logs_company_created ON activity_logs(company_id, created_at DESC) WHERE company_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
  END IF;
END $$;

-- Odoo modules indexes
CREATE INDEX IF NOT EXISTS idx_odoo_modules_company_status ON odoo_modules(company_id, status);
CREATE INDEX IF NOT EXISTS idx_odoo_modules_project ON odoo_modules(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_odoo_modules_status ON odoo_modules(status);

-- Configurations indexes
CREATE INDEX IF NOT EXISTS idx_configurations_module_status ON configurations(module_id, status);
CREATE INDEX IF NOT EXISTS idx_configurations_status ON configurations(status);
CREATE INDEX IF NOT EXISTS idx_configurations_type ON configurations(type);

-- Discoveries indexes
CREATE INDEX IF NOT EXISTS idx_discoveries_company_status ON discoveries(company_id, analysis_status);
CREATE INDEX IF NOT EXISTS idx_discoveries_status ON discoveries(analysis_status);
CREATE INDEX IF NOT EXISTS idx_discoveries_created_at ON discoveries(created_at DESC);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_industry ON templates(industry);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);

-- ============================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================

-- Company + Project lookups
CREATE INDEX IF NOT EXISTS idx_projects_company_phase_status ON projects(company_id, phase, status);

-- User activity tracking (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_entity_created ON activity_logs(user_id, entity_type, created_at DESC);
  END IF;
END $$;

-- Calendar event lookups by date range
CREATE INDEX IF NOT EXISTS idx_calendar_events_organizer_start_end ON calendar_events(organizer_id, start_time, end_time) WHERE organizer_id IS NOT NULL;

-- Email filtering
CREATE INDEX IF NOT EXISTS idx_emails_account_status_received ON emails(email_account_id, email_status, received_at DESC);

-- ============================================
-- PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- ============================================

-- Active projects only
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(company_id, updated_at DESC) WHERE status = 'in_progress';

-- Unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE status = 'unread';

-- Pending support tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_pending ON support_tickets(company_id, priority, created_at) WHERE status IN ('open', 'in_progress');

-- Upcoming calendar events (removed - NOW() is not IMMUTABLE, cannot be used in index predicate)
-- Use regular index and filter in queries instead
CREATE INDEX IF NOT EXISTS idx_calendar_events_organizer_start ON calendar_events(organizer_id, start_time) WHERE organizer_id IS NOT NULL;

-- Active webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(company_id, created_at) WHERE status = 'active';

-- Active API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(user_id, created_at) WHERE status = 'active';

-- ============================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================

-- Company statistics view (only if activity_logs exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    CREATE MATERIALIZED VIEW IF NOT EXISTS company_stats AS
    SELECT 
      c.id as company_id,
      c.name as company_name,
      COUNT(DISTINCT p.id) as project_count,
      COUNT(DISTINCT CASE WHEN p.status = 'in_progress' THEN p.id END) as active_projects,
      COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_projects,
      AVG(p.completion_percentage) as avg_completion,
      COUNT(DISTINCT st.id) as ticket_count,
      COUNT(DISTINCT CASE WHEN st.status IN ('open', 'in_progress') THEN st.id END) as open_tickets,
      COUNT(DISTINCT prof.id) as user_count,
      MAX(p.updated_at) as last_project_update
    FROM companies c
    LEFT JOIN projects p ON p.company_id = c.id
    LEFT JOIN support_tickets st ON st.company_id = c.id
    LEFT JOIN profiles prof ON prof.company_id = c.id
    GROUP BY c.id, c.name;
  END IF;
END $$;

-- Index for materialized view (only if view exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'company_stats') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_company_stats_company ON company_stats(company_id);
  END IF;
END $$;

-- Refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_company_stats()
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'company_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY company_stats;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- QUERY OPTIMIZATION FUNCTIONS
-- ============================================

-- Function to get company dashboard data efficiently
CREATE OR REPLACE FUNCTION get_company_dashboard(company_uuid UUID)
RETURNS TABLE (
  company_data JSONB,
  projects JSONB,
  tickets JSONB,
  recent_activities JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT row_to_json(c)::jsonb FROM companies c WHERE c.id = company_uuid) as company_data,
    (SELECT jsonb_agg(row_to_json(p)) FROM (
      SELECT * FROM projects WHERE company_id = company_uuid ORDER BY updated_at DESC LIMIT 10
    ) p) as projects,
    (SELECT jsonb_agg(row_to_json(t)) FROM (
      SELECT * FROM support_tickets WHERE company_id = company_uuid AND status IN ('open', 'in_progress') ORDER BY priority DESC, created_at DESC LIMIT 10
    ) t) as tickets,
    (SELECT CASE 
      WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') 
      THEN (SELECT jsonb_agg(row_to_json(a)) FROM (
        SELECT * FROM activity_logs WHERE company_id = company_uuid ORDER BY created_at DESC LIMIT 20
      ) a)
      ELSE '[]'::jsonb
    END) as recent_activities;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VACUUM AND ANALYZE SETTINGS
-- ============================================

-- Enable autovacuum for better performance
ALTER TABLE companies SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE projects SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE support_tickets SET (autovacuum_vacuum_scale_factor = 0.1);

-- Activity logs autovacuum (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_logs') THEN
    ALTER TABLE activity_logs SET (autovacuum_vacuum_scale_factor = 0.2);
  END IF;
END $$;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_projects_company_status IS 'Optimizes queries filtering projects by company and status';
COMMENT ON INDEX idx_calendar_events_organizer_date IS 'Optimizes calendar queries by organizer and date range';
COMMENT ON INDEX idx_notifications_unread IS 'Optimizes unread notification queries';

-- Comment for materialized view (only if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'company_stats') THEN
    COMMENT ON MATERIALIZED VIEW company_stats IS 'Pre-computed company statistics for faster dashboard loading';
  END IF;
END $$;

