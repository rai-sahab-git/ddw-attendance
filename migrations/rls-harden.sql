-- Harden RLS for attendance_settings / employee_type_overrides
-- Run in Supabase SQL editor after reviewing. Adjust role checks to match your user_profiles schema.

-- Drop permissive policies if present
DROP POLICY IF EXISTS "auth_all_settings" ON attendance_settings;
DROP POLICY IF EXISTS "auth_all_overrides" ON employee_type_overrides;

-- Admins (user_profiles.role = 'admin') can manage settings
CREATE POLICY "admin_all_settings" ON attendance_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "admin_all_overrides" ON employee_type_overrides
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- Prefer mutating payroll tables via service-role API routes (requireAdminAuth),
-- not via the browser anon client.
