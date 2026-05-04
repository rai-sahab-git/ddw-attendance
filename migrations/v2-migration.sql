-- attendance_settings table
CREATE TABLE IF NOT EXISTS attendance_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  label         TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT '#6B7280',
  text_color    TEXT NOT NULL DEFAULT '#FFFFFF',
  calc_type     TEXT NOT NULL DEFAULT 'present',
  fixed_amount  NUMERIC NOT NULL DEFAULT 0,
  multiplier    NUMERIC NOT NULL DEFAULT 1,
  sort_order    INT     NOT NULL DEFAULT 99,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_system     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attendance_settings ADD COLUMN IF NOT EXISTS multiplier NUMERIC NOT NULL DEFAULT 1;

-- employee_type_overrides table
CREATE TABLE IF NOT EXISTS employee_type_overrides (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type_code           TEXT NOT NULL,
  override_amount     NUMERIC,
  override_multiplier NUMERIC,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, type_code)
);

-- Seed defaults
INSERT INTO attendance_settings 
  (code, label, color, text_color, calc_type, fixed_amount, multiplier, sort_order, is_system)
VALUES
  ('P',   'Present',        '#00A651','#FFFFFF','present',         0,   1,   1, TRUE),
  ('A',   'Absent',         '#EF4444','#FFFFFF','absent',          0,   1,   2, TRUE),
  ('H',   'Half Day',       '#F59E0B','#FFFFFF','half',            0,   0.5, 3, TRUE),
  ('L',   'Leave',          '#EC4899','#FFFFFF','absent',          0,   1,   4, TRUE),
  ('OT',  'Overtime',       '#F97316','#FFFFFF','ot_fixed',        300, 1,   5, TRUE),
  ('2OT', 'Double OT',      '#8B5CF6','#FFFFFF','ot_fixed',        600, 1,   6, FALSE),
  ('3OT', 'Triple OT',      '#7C3AED','#FFFFFF','ot_fixed',        900, 1,   7, FALSE),
  ('2P',  'Double Present', '#3B82F6','#FFFFFF','per_day_multiply', 0,  2,   8, FALSE),
  ('HD',  'Holiday',        '#D1D5DB','#374151','no_effect',       0,   1,   9, TRUE),
  ('WO',  'Week Off',       '#F3F4F6','#9CA3AF','no_effect',       0,   1,   10,TRUE)
ON CONFLICT (code) DO UPDATE SET
  calc_type    = EXCLUDED.calc_type,
  fixed_amount = EXCLUDED.fixed_amount,
  multiplier   = EXCLUDED.multiplier;

ALTER TABLE attendance_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_type_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_settings"   ON attendance_settings     FOR ALL TO authenticated USING (TRUE);
CREATE POLICY "auth_all_overrides"  ON employee_type_overrides FOR ALL TO authenticated USING (TRUE);