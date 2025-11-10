-- ============================================
-- PUBLIC API SYSTEM
-- ============================================
-- Created: 2025-11-12
-- Description: Public API için API key sistemi ve webhooks
-- Sprint: 5

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE api_key_status AS ENUM ('active', 'inactive', 'revoked');
CREATE TYPE webhook_status AS ENUM ('active', 'inactive', 'failed');
CREATE TYPE webhook_event_type AS ENUM (
  'company.created',
  'company.updated',
  'company.deleted',
  'project.created',
  'project.updated',
  'project.completed',
  'ticket.created',
  'ticket.updated',
  'ticket.resolved',
  'document.created',
  'document.updated',
  'user.created',
  'user.updated'
);

-- ============================================
-- TABLES
-- ============================================

-- 1. api_keys (API Keys)
-- Public API için API key'ler
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Key Info
  name TEXT NOT NULL, -- User-friendly name
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "sk_live_")
  
  -- Owner
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = user-level
  
  -- Status
  status api_key_status NOT NULL DEFAULT 'active',
  
  -- Permissions
  scopes TEXT[] DEFAULT '{}', -- e.g., ['read:companies', 'write:projects']
  
  -- Rate Limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Usage Tracking
  last_used_at TIMESTAMPTZ,
  request_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  
  -- Constraints
  CONSTRAINT valid_key_prefix CHECK (key_prefix ~ '^[a-zA-Z0-9_]+$')
);

-- 2. api_requests (API Request Logs)
-- API isteklerini logla (rate limiting ve analytics için)
CREATE TABLE api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request Info
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  method TEXT NOT NULL, -- GET, POST, PUT, DELETE
  endpoint TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  
  -- Request Details
  request_body JSONB,
  response_body JSONB,
  ip_address INET,
  user_agent TEXT,
  
  -- Performance
  response_time_ms INTEGER, -- Response time in milliseconds
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. webhooks (Webhooks)
-- Webhook endpoint'leri
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = user-level
  
  -- Webhook Info
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- Secret for signature verification
  
  -- Events
  events webhook_event_type[] NOT NULL DEFAULT '{}',
  
  -- Status
  status webhook_status NOT NULL DEFAULT 'active',
  
  -- Retry Policy
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  
  -- Statistics
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_url CHECK (url ~ '^https?://')
);

-- 4. webhook_deliveries (Webhook Delivery Logs)
-- Webhook gönderim logları
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Event Info
  event_type webhook_event_type NOT NULL,
  event_data JSONB NOT NULL,
  
  -- Delivery Status
  status TEXT NOT NULL, -- 'pending', 'success', 'failed', 'retrying'
  status_code INTEGER,
  response_body TEXT,
  
  -- Retry Info
  attempt_number INTEGER DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'success', 'failed', 'retrying'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_company ON api_keys(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_api_keys_status ON api_keys(status);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

CREATE INDEX idx_api_requests_api_key ON api_requests(api_key_id);
CREATE INDEX idx_api_requests_created_at ON api_requests(created_at DESC);
CREATE INDEX idx_api_requests_endpoint ON api_requests(endpoint);

CREATE INDEX idx_webhooks_user ON webhooks(user_id);
CREATE INDEX idx_webhooks_company ON webhooks(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_webhooks_status ON webhooks(status);
CREATE INDEX idx_webhooks_events ON webhooks USING GIN(events);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'retrying';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- api_keys: Users can see their own keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_read_own" ON api_keys
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "api_keys_write_own" ON api_keys
  FOR ALL
  USING (
    user_id = auth.uid() OR
    (company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND profiles.role IN ('company_admin', 'super_admin')
    )) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- api_requests: Users can see their own request logs
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_requests_read_own" ON api_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM api_keys
      WHERE api_keys.id = api_requests.api_key_id
      AND (
        api_keys.user_id = auth.uid() OR
        api_keys.company_id IN (
          SELECT company_id FROM profiles
          WHERE id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
        )
      )
    )
  );

-- webhooks: Users can see their own webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_read_own" ON webhooks
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "webhooks_write_own" ON webhooks
  FOR ALL
  USING (
    user_id = auth.uid() OR
    (company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND profiles.role IN ('company_admin', 'super_admin')
    )) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- webhook_deliveries: Same as webhooks
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_read_webhook" ON webhook_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks
      WHERE webhooks.id = webhook_deliveries.webhook_id
      AND (
        webhooks.user_id = auth.uid() OR
        webhooks.company_id IN (
          SELECT company_id FROM profiles
          WHERE id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'super_admin'
        )
      )
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp for webhooks
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- Update api_key last_used_at and request_count
CREATE OR REPLACE FUNCTION update_api_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api_keys
  SET 
    last_used_at = NOW(),
    request_count = request_count + 1
  WHERE id = NEW.api_key_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_key_usage_trigger
  AFTER INSERT ON api_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_api_key_usage();

-- Update webhook statistics
CREATE OR REPLACE FUNCTION update_webhook_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE webhooks
    SET 
      success_count = success_count + 1,
      last_success_at = NOW(),
      last_triggered_at = NOW()
    WHERE id = NEW.webhook_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE webhooks
    SET 
      failure_count = failure_count + 1,
      last_failure_at = NOW(),
      last_error = NEW.response_body,
      last_triggered_at = NOW()
    WHERE id = NEW.webhook_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhook_stats_trigger
  AFTER UPDATE ON webhook_deliveries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_webhook_stats();

