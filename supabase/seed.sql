-- ==============================================================================
-- FYNUX OS — SEED DATA
-- Default system settings, initial users, and service catalog
-- ==============================================================================

-- 1. Default Internal Users
INSERT INTO users (id, email, full_name, role, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'faiz@fynux.co', 'Faiz Aditama', 'OWNER', 'ACTIVE'),
  ('22222222-2222-2222-2222-222222222222', 'sales@fynux.co', 'Sales Executive Fynux', 'SALES', 'ACTIVE'),
  ('33333333-3333-3333-3333-333333333333', 'dev@fynux.co', 'Developer Fynux', 'DEVELOPER', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- 2. Default Service Catalog (Mengacu pada businesslogic.txt & dokumen T&C Basic)
INSERT INTO service_catalog (id, tier, name, description, base_price, estimated_cost, warranty_duration_months, terms_pdf_path, is_active)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'BASIC',
    'Basic Website Development',
    'Website profil bisnis 3-5 halaman utama, gratis domain & hosting 1 tahun, garansi teknis 3 bulan.',
    1500000.00,
    400000.00, -- Modal hosting + domain ~400rb, laba kotor ~1.1jt
    3,
    'DATA INTI/Cover Terms & Services – Fynux Basic Website.pdf',
    TRUE
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'BUSINESS',
    'Business Website Development',
    'Website interaktif dengan integrasi CMS kustom, SEO On-page, dan optimasi konversi penjualan.',
    3500000.00,
    900000.00,
    6,
    NULL,
    TRUE
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'ENTERPRISE',
    'Enterprise Custom Web Application',
    'Aplikasi web khusus, arsitektur terdedikasi, integrasi API sistem pihak ketiga, SLA bisnis.',
    7500000.00,
    2500000.00,
    12,
    NULL,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- 3. Default System Settings
INSERT INTO system_settings (key, value)
VALUES
  ('follow_up_intervals', '{
    "initial": 0,
    "fu1_days": 1,
    "fu2_days": 3,
    "fu3_days": 5,
    "failed_after_fu3_days": 10
  }'::jsonb),
  ('company_targets', '{
    "monthly_revenue_target": 25000000,
    "monthly_deals_target": 10,
    "year": 2026
  }'::jsonb),
  ('prospect_assignment_mode', '{
    "mode": "MANUAL_OWNER_DISTRIBUTION"
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
