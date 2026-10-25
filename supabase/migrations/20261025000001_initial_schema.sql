-- ==============================================================================
-- FYNUX OS — INITIAL PRODUCTION SCHEMA MIGRATION
-- Database: PostgreSQL (Supabase Compatible)
-- Version: 1.0.0
-- Created: 2026-10-25
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTION: AUTO UPDATE TIMESTAMP
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- DOMAIN 1: IDENTITY & ACCESS MANAGEMENT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'DEVELOPER' CHECK (role IN ('OWNER', 'SALES', 'DEVELOPER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

-- ==============================================================================
-- DOMAIN 2: CRM & PROSPECT MANAGEMENT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL UNIQUE, -- Standar 628xxx dinormalisasi
  email TEXT,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_wa ON contacts(whatsapp_number);

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  research_notes TEXT NOT NULL, -- Catatan bebas riset bisnis
  pain_points TEXT,
  potential_services TEXT,
  assigned_sales_id UUID REFERENCES users(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'NEW' CHECK (
    stage IN ('NEW', 'CONTACTED', 'RESPONDED', 'ENGAGED', 'QUALIFIED', 'NEGOTIATION', 'PENDING', 'CLOSED_WON', 'FAILED')
  ),
  next_action TEXT NOT NULL DEFAULT 'REACH_NOW' CHECK (
    next_action IN ('REACH_NOW', 'WAITING_FOR_RESPONSE', 'REPLY_TO_CLIENT', 'PREPARE_PROPOSAL', 'SCHEDULE_MEETING', 'FOLLOW_UP_SCHEDULED', 'NO_ACTION_REQUIRED')
  ),
  next_follow_up_date DATE,
  follow_up_step TEXT DEFAULT 'INITIAL' CHECK (follow_up_step IN ('INITIAL', 'FU1', 'FU2', 'FU3', 'FAILED')),
  last_reach_at TIMESTAMPTZ,
  failed_reason TEXT CHECK (
    failed_reason IS NULL OR failed_reason IN ('NO_RESPONSE', 'REJECTED', 'BUDGET', 'NOT_A_FIT', 'COMPETITOR', 'ALREADY_HAVE_PROVIDER', 'TIMELINE', 'OTHER')
  ),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prospects_stage ON prospects(stage);
CREATE INDEX idx_prospects_assigned_sales ON prospects(assigned_sales_id);
CREATE INDEX idx_prospects_fu_date ON prospects(next_follow_up_date);

CREATE TRIGGER trg_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS follow_up_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('INITIAL', 'FU1', 'FU2', 'FU3', 'FAILED')),
  channel TEXT NOT NULL DEFAULT 'WHATSAPP',
  sent_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  confirmed_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- ==============================================================================
-- DOMAIN 3: WHATSAPP SHARED INBOX & PERCAKAPAN
-- ==============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('SALES', 'PROSPECT', 'AI')),
  sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_draft BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);

CREATE TABLE IF NOT EXISTS conversation_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes <= 20971520), -- Maksimal 20MB
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DOMAIN 4: KATALOG LAYANAN & DEALS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL CHECK (tier IN ('BASIC', 'BUSINESS', 'ENTERPRISE')),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  warranty_duration_months INT NOT NULL DEFAULT 3,
  terms_pdf_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_service_catalog_updated_at
  BEFORE UPDATE ON service_catalog
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  client_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  primary_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  pic_sales_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_tier TEXT NOT NULL CHECK (service_tier IN ('BASIC', 'BUSINESS', 'ENTERPRISE')),
  agreed_price NUMERIC(15, 2) NOT NULL CHECK (agreed_price >= 0),
  payment_terms TEXT NOT NULL, -- e.g. "Lunas", "DP 50% + Pelunasan"
  scope_of_work TEXT NOT NULL,
  special_notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACCEPTED' CHECK (status IN ('DRAFT', 'PROPOSED', 'ACCEPTED', 'REJECTED')),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS deal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DOMAIN 5: FINANCE, INVOICES & PAYMENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE, -- Format: FYN-YYYYMM-NNNN (Contoh: FYN-202602-0003)
  deal_id UUID REFERENCES deals(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  issued_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
  due_date DATE NOT NULL,
  notes TEXT,
  pdf_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  duration_info TEXT, -- misal: "12 bulan", "3 bulan"
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('MANUAL_TRANSFER_BCA', 'DUITKU_QRIS', 'DUITKU_VA', 'CASH')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'REVERSED', 'REFUNDED')),
  gateway_order_id TEXT UNIQUE,
  gateway_reference TEXT,
  payment_proof_path TEXT,
  confirmed_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  confirmed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ==============================================================================
-- DOMAIN 6: PROJECT OPERATIONS & TASKS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED')),
  progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  scope_description TEXT NOT NULL,
  start_date DATE,
  target_deadline DATE,
  completed_at TIMESTAMPTZ,
  on_hold_reason TEXT,
  on_hold_date TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_status ON projects(status);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role_in_project TEXT NOT NULL DEFAULT 'DEVELOPER',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS project_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN ('HOSTING', 'DOMAIN', 'DEVELOPER', 'ASSET', 'OTHER')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  recorded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('DOCUMENT', 'DESIGN', 'REPOSITORY', 'OTHER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  primary_pic_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Tepat 1 PIC utama
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  deadline DATE,
  blocked_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_pic ON tasks(primary_pic_id);
CREATE INDEX idx_tasks_status ON tasks(status);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS task_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- ==============================================================================
-- DOMAIN 7: CLIENT LIFECYCLE, WARRANTY & MAINTENANCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  tier TEXT NOT NULL CHECK (tier IN ('BASIC', 'BUSINESS', 'ENTERPRISE')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  scope_of_support TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  previous_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  billing_type TEXT NOT NULL CHECK (billing_type IN ('ONE_OFF', 'MONTHLY', 'ANNUAL')),
  price NUMERIC(15, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_reminder_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'RENEWED', 'TERMINATED')),
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  previous_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('REPEAT_ORDER', 'UPSELL')),
  title TEXT NOT NULL,
  estimated_value NUMERIC(15, 2),
  stage TEXT NOT NULL DEFAULT 'IDENTIFIED' CHECK (stage IN ('IDENTIFIED', 'PROPOSAL', 'WON', 'LOST')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DOMAIN 8: GOVERNANCE, APPROVAL QUEUE & AUDIT LOGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('DISCOUNT', 'CUSTOM_PRICING', 'PAYMENT_TERMS', 'REFUND', 'PROJECT_CANCELLATION', 'AI_COMMERCIAL_ACTION')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requested_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  related_entity_type TEXT CHECK (related_entity_type IN ('DEAL', 'INVOICE', 'PROJECT', 'PROSPECT')),
  related_entity_id UUID,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approvals_status ON approval_requests(status);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('CRM', 'FINANCE', 'PROJECT', 'AI', 'SECURITY', 'SYSTEM')),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  target_id TEXT,
  target_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_created ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Current User Owner
CREATE OR REPLACE FUNCTION auth_is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'OWNER' AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Has Custom Permission
CREATE OR REPLACE FUNCTION auth_has_permission(p_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth_is_owner() THEN
    RETURN TRUE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN users u ON u.id = up.user_id
    WHERE up.user_id = auth.uid()
      AND up.permission = p_permission
      AND u.status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users RLS:
CREATE POLICY "Users can view profile" ON users
  FOR SELECT USING (TRUE);

CREATE POLICY "Owner manages users" ON users
  FOR ALL USING (auth_is_owner());

-- Prospects RLS:
CREATE POLICY "View prospects policy" ON prospects
  FOR SELECT USING (
    auth_is_owner()
    OR auth_has_permission('crm.view_all')
    OR assigned_sales_id = auth.uid()
  );

CREATE POLICY "Modify prospects policy" ON prospects
  FOR ALL USING (
    auth_is_owner()
    OR auth_has_permission('crm.edit_all')
    OR assigned_sales_id = auth.uid()
  );

-- Projects RLS:
CREATE POLICY "View projects policy" ON projects
  FOR SELECT USING (TRUE); -- Developer & Sales can view general delivery status

CREATE POLICY "Modify projects policy" ON projects
  FOR UPDATE USING (
    auth_is_owner()
    OR auth_has_permission('projects.edit_all')
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

-- Project Costs RLS (Biaya internal hanya untuk Owner / permission):
CREATE POLICY "View project costs policy" ON project_costs
  FOR SELECT USING (
    auth_is_owner() OR auth_has_permission('finance.view_costs_margins')
  );

CREATE POLICY "Manage project costs policy" ON project_costs
  FOR ALL USING (auth_is_owner());

-- Invoices RLS:
CREATE POLICY "View invoices policy" ON invoices
  FOR SELECT USING (
    auth_is_owner()
    OR auth_has_permission('finance.view_costs_margins')
    OR issued_by_user_id = auth.uid()
  );

CREATE POLICY "Manage invoices policy" ON invoices
  FOR ALL USING (
    auth_is_owner() OR auth_has_permission('finance.create_invoice')
  );

-- Payments RLS:
CREATE POLICY "View payments policy" ON payments
  FOR SELECT USING (TRUE);

CREATE POLICY "Manage payments policy" ON payments
  FOR ALL USING (
    auth_is_owner() OR auth_has_permission('finance.confirm_payment')
  );

-- Approval Requests RLS:
CREATE POLICY "View approvals policy" ON approval_requests
  FOR SELECT USING (
    auth_is_owner() OR requested_by_user_id = auth.uid()
  );

CREATE POLICY "Owner reviews approvals" ON approval_requests
  FOR UPDATE USING (auth_is_owner());

-- Audit Logs RLS:
CREATE POLICY "View audit logs policy" ON audit_logs
  FOR SELECT USING (auth_is_owner());

CREATE POLICY "Insert audit logs policy" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);
