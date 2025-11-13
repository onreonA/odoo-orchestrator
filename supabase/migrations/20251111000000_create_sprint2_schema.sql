-- ============================================
-- SPRINT 2: CALENDAR & COMMUNICATION SCHEMA
-- ============================================
-- Created: 2025-11-11
-- Description: Calendar, Email ve Messaging tabloları

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE event_status AS ENUM ('scheduled', 'confirmed', 'cancelled', 'completed');
CREATE TYPE event_type AS ENUM ('meeting', 'call', 'task', 'reminder', 'block', 'other');
CREATE TYPE sync_status AS ENUM ('active', 'paused', 'error', 'syncing');
CREATE TYPE sync_direction AS ENUM ('one_way_in', 'one_way_out', 'bidirectional');
CREATE TYPE email_status AS ENUM ('draft', 'sent', 'received', 'archived', 'deleted');
CREATE TYPE email_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE message_type AS ENUM ('text', 'file', 'system', 'ai_response');
CREATE TYPE notification_type AS ENUM ('email', 'message', 'calendar', 'task', 'system');
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');

-- ============================================
-- CALENDAR TABLES
-- ============================================

-- 1. calendar_syncs (Dış Takvim Senkronizasyonları) - ÖNCE BU OLUŞTURULMALI
CREATE TABLE calendar_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sync Info
  name TEXT NOT NULL, -- User-friendly name
  provider TEXT NOT NULL, -- 'google', 'outlook', 'caldav', 'custom'
  sync_direction sync_direction DEFAULT 'bidirectional',
  status sync_status DEFAULT 'active',
  
  -- Connection Details (encrypted in production)
  api_endpoint TEXT,
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Calendar Info
  external_calendar_id TEXT, -- ID in external system
  external_calendar_name TEXT,
  
  -- Filtering Rules
  sync_rules JSONB DEFAULT '{}', -- Which events to sync
  privacy_rules JSONB DEFAULT '{}', -- Privacy masking rules
  
  -- Sync Status
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success', 'partial', 'failed'
  last_sync_error TEXT,
  next_sync_at TIMESTAMPTZ,
  
  -- Conflict Resolution
  conflict_resolution_strategy TEXT DEFAULT 'platform_wins', -- 'platform_wins', 'external_wins', 'manual'
  
  -- Owner
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = personal calendar
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. calendar_events (Takvim Etkinlikleri) - calendar_syncs'ten SONRA
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type DEFAULT 'meeting',
  status event_status DEFAULT 'scheduled',
  
  -- Time
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'Europe/Istanbul',
  all_day BOOLEAN DEFAULT false,
  
  -- Location
  location TEXT,
  meeting_url TEXT, -- Zoom, Teams, etc.
  
  -- Participants
  organizer_id UUID REFERENCES profiles(id),
  attendees UUID[] DEFAULT '{}', -- Array of profile IDs
  external_attendees TEXT[], -- Email addresses of external participants
  
  -- Relations
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  discovery_id UUID REFERENCES discoveries(id) ON DELETE SET NULL,
  
  -- AI Optimization
  energy_level TEXT, -- 'high', 'medium', 'low' (for AI scheduling)
  preparation_notes TEXT, -- AI-generated meeting prep
  auto_prepared BOOLEAN DEFAULT false,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format (RFC 5545)
  recurrence_end_date TIMESTAMPTZ,
  parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE, -- For recurring events
  
  -- Sync
  synced_with_external BOOLEAN DEFAULT false,
  external_event_id TEXT, -- ID in external calendar
  external_calendar_id UUID REFERENCES calendar_syncs(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMPTZ,
  
  -- Privacy
  is_private BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'public', -- 'public', 'company', 'private'
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- ============================================
-- EMAIL TABLES
-- ============================================

-- 3. email_accounts (Email Hesapları)
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Account Info
  email_address TEXT NOT NULL,
  display_name TEXT,
  provider TEXT, -- 'gmail', 'outlook', 'imap', 'smtp'
  
  -- Connection (encrypted in production)
  imap_host TEXT,
  imap_port INTEGER,
  imap_username TEXT,
  imap_password TEXT,
  imap_ssl BOOLEAN DEFAULT true,
  
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_ssl BOOLEAN DEFAULT true,
  
  -- OAuth (for Gmail, Outlook)
  oauth_provider TEXT, -- 'google', 'microsoft'
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  oauth_token_expires_at TIMESTAMPTZ,
  
  -- Sync Settings
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency INTEGER DEFAULT 5, -- minutes
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT,
  
  -- Filtering
  auto_categorize BOOLEAN DEFAULT true,
  auto_respond BOOLEAN DEFAULT false,
  auto_archive BOOLEAN DEFAULT false,
  
  -- Owner
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL = personal email
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(email_address, user_id)
);

-- 4. emails (Email Mesajları)
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  email_status email_status DEFAULT 'received',
  email_priority email_priority DEFAULT 'normal',
  
  -- Participants
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses TEXT[] DEFAULT '{}',
  cc_addresses TEXT[] DEFAULT '{}',
  bcc_addresses TEXT[] DEFAULT '{}',
  reply_to TEXT,
  
  -- Threading
  thread_id TEXT, -- Email thread ID
  in_reply_to TEXT, -- Parent email ID
  email_references TEXT[], -- Email references (RFC 822 References header)
  
  -- Message ID
  message_id TEXT UNIQUE, -- RFC 822 Message-ID
  external_id TEXT, -- ID in external system
  
  -- Attachments
  attachments JSONB DEFAULT '[]', -- Array of {name, url, size, type}
  
  -- AI Analysis
  ai_category TEXT, -- 'urgent', 'high', 'medium', 'low', 'spam'
  ai_sentiment TEXT, -- 'positive', 'neutral', 'negative'
  ai_summary TEXT,
  ai_priority_score DECIMAL(3,2) CHECK (ai_priority_score >= 0 AND ai_priority_score <= 1),
  ai_suggested_action TEXT, -- 'reply', 'forward', 'archive', 'urgent_reply'
  ai_draft_response TEXT, -- AI-generated draft
  
  -- Auto-response
  auto_responded BOOLEAN DEFAULT false,
  auto_response_sent_at TIMESTAMPTZ,
  
  -- Relations
  email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  related_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  
  -- Labels/Tags
  labels TEXT[] DEFAULT '{}',
  is_starred BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  
  -- Dates
  received_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id), -- NULL for received emails
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGING TABLES
-- ============================================

-- 5. message_threads (Mesaj Thread'leri)
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Thread Info
  title TEXT,
  type TEXT DEFAULT 'company', -- 'company', 'direct', 'group'
  
  -- Participants
  participants UUID[] NOT NULL DEFAULT '{}', -- Array of profile IDs
  
  -- Relations
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Metadata
  last_message_at TIMESTAMPTZ,
  last_message_by UUID REFERENCES profiles(id),
  unread_count INTEGER DEFAULT 0,
  
  -- Settings
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. messages (Mesajlar)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  
  -- Relations
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Thread Info
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Attachments
  attachments JSONB DEFAULT '[]', -- Array of {name, url, size, type}
  
  -- AI
  is_ai_generated BOOLEAN DEFAULT false,
  ai_agent_name TEXT, -- Which AI agent generated this
  
  -- Reactions
  reactions JSONB DEFAULT '{}', -- {emoji: [user_ids]}
  
  -- Mentions
  mentions UUID[] DEFAULT '{}', -- Array of mentioned profile IDs
  
  -- Read Status
  read_by UUID[] DEFAULT '{}', -- Array of profile IDs who read this
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

-- 7. notifications (Bildirimler)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Notification Info
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type notification_type NOT NULL,
  status notification_status DEFAULT 'unread',
  
  -- Relations
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  related_id UUID, -- ID of related entity (event, email, message, etc.)
  related_type TEXT, -- Type of related entity
  
  -- Action
  action_url TEXT, -- URL to navigate when clicked
  action_label TEXT, -- Button label
  
  -- Metadata
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Calendar Events
CREATE INDEX idx_calendar_events_company_id ON calendar_events(company_id);
CREATE INDEX idx_calendar_events_organizer_id ON calendar_events(organizer_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_calendar_events_external_calendar_id ON calendar_events(external_calendar_id);

-- Calendar Syncs
CREATE INDEX idx_calendar_syncs_user_id ON calendar_syncs(user_id);
CREATE INDEX idx_calendar_syncs_status ON calendar_syncs(status);
CREATE INDEX idx_calendar_syncs_next_sync_at ON calendar_syncs(next_sync_at) WHERE status = 'active';

-- Email Accounts
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_company_id ON email_accounts(company_id);

-- Emails
CREATE INDEX idx_emails_email_account_id ON emails(email_account_id);
CREATE INDEX idx_emails_company_id ON emails(company_id);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_status ON emails(email_status);
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_from_address ON emails(from_address);

-- Message Threads
CREATE INDEX idx_message_threads_company_id ON message_threads(company_id);
CREATE INDEX idx_message_threads_participants ON message_threads USING GIN(participants);
CREATE INDEX idx_message_threads_last_message_at ON message_threads(last_message_at DESC);

-- Messages
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_mentions ON messages USING GIN(mentions);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Calendar Events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calendar events for their companies"
  ON calendar_events FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      company_id IN (
        SELECT company_id FROM profiles
        WHERE profiles.id = auth.uid()
        AND company_id IS NOT NULL
      )
      OR organizer_id = auth.uid()
      OR auth.uid() = ANY(attendees)
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    )
  );

CREATE POLICY "Users can create calendar events for their companies"
  ON calendar_events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      company_id IN (
        SELECT company_id FROM profiles
        WHERE profiles.id = auth.uid()
        AND company_id IS NOT NULL
      )
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    )
  );

CREATE POLICY "Users can update their calendar events"
  ON calendar_events FOR UPDATE
  USING (
    organizer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    organizer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Users can delete their calendar events"
  ON calendar_events FOR DELETE
  USING (
    organizer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Calendar Syncs
ALTER TABLE calendar_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar syncs"
  ON calendar_syncs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Email Accounts
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email accounts"
  ON email_accounts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Emails
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emails from their accounts"
  ON emails FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND email_account_id IN (
      SELECT id FROM email_accounts
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create emails from their accounts"
  ON emails FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND email_account_id IN (
      SELECT id FROM email_accounts
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their emails"
  ON emails FOR UPDATE
  USING (
    email_account_id IN (
      SELECT id FROM email_accounts
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    email_account_id IN (
      SELECT id FROM email_accounts
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their emails"
  ON emails FOR DELETE
  USING (
    email_account_id IN (
      SELECT id FROM email_accounts
      WHERE user_id = auth.uid()
    )
  );

-- Message Threads
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view threads they participate in"
  ON message_threads FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.uid() = ANY(participants)
      OR company_id IN (
        SELECT company_id FROM profiles
        WHERE profiles.id = auth.uid()
        AND company_id IS NOT NULL
      )
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
      )
    )
  );

CREATE POLICY "Users can create threads"
  ON message_threads FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = ANY(participants)
  );

CREATE POLICY "Users can update threads they participate in"
  ON message_threads FOR UPDATE
  USING (auth.uid() = ANY(participants))
  WITH CHECK (auth.uid() = ANY(participants));

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their threads"
  ON messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND thread_id IN (
      SELECT id FROM message_threads
      WHERE auth.uid() = ANY(participants)
    )
  );

CREATE POLICY "Users can create messages in their threads"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND sender_id = auth.uid()
    AND thread_id IN (
      SELECT id FROM message_threads
      WHERE auth.uid() = ANY(participants)
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (sender_id = auth.uid());

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_syncs_updated_at
  BEFORE UPDATE ON calendar_syncs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at
  BEFORE UPDATE ON message_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update message_threads last_message_at and unread_count
CREATE OR REPLACE FUNCTION update_thread_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET
    last_message_at = NEW.created_at,
    last_message_by = NEW.sender_id,
    unread_count = CASE 
      WHEN NEW.sender_id = ANY(participants) THEN unread_count
      ELSE unread_count + 1
    END
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_metadata_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_metadata();
