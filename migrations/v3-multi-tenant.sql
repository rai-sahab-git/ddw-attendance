-- Multi-warehouse, multi-admin, permissions (DDW Attendance v3)
-- Run in Supabase SQL editor.

-- ── Warehouses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  address     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default warehouse if empty
INSERT INTO warehouses (code, name, address)
SELECT 'HQ', 'Head Office', 'Main location'
WHERE NOT EXISTS (SELECT 1 FROM warehouses LIMIT 1);

-- ── Extend user_profiles ──────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Allowed app roles on profile (text for flexibility)
-- Values: super_admin | admin | manager | viewer | employee
COMMENT ON COLUMN user_profiles.role IS 'super_admin|admin|manager|viewer|employee';

-- ── Warehouse memberships ─────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouse_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id  UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'admin'
                CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (warehouse_id, user_id)
);

-- ── Employees belong to a warehouse ───────────────────────
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);

UPDATE employees e
SET warehouse_id = (SELECT id FROM warehouses ORDER BY created_at ASC LIMIT 1)
WHERE e.warehouse_id IS NULL;

-- ── App appearance prefs (per user) ───────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id       UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  theme         TEXT NOT NULL DEFAULT 'system'
                CHECK (theme IN ('light', 'dark', 'system')),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Report presets (optional saved filters) ───────────────
CREATE TABLE IF NOT EXISTS report_presets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  warehouse_id  UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  report_type   TEXT NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employees_warehouse ON employees(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_members_user ON warehouse_members(user_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_members_wh ON warehouse_members(warehouse_id);

-- RLS (authenticated admins; service role bypasses)
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_warehouses" ON warehouses;
CREATE POLICY "auth_warehouses" ON warehouses
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "auth_warehouse_members" ON warehouse_members;
CREATE POLICY "auth_warehouse_members" ON warehouse_members
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "own_preferences" ON user_preferences;
CREATE POLICY "own_preferences" ON user_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "own_report_presets" ON report_presets;
CREATE POLICY "own_report_presets" ON report_presets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
