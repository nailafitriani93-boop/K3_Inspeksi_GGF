ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email VARCHAR(200),
  ADD COLUMN IF NOT EXISTS akses_dashboard BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.users
SET role = CASE
  WHEN UPPER(role) = 'KABAG' OR LOWER(username) LIKE '%.kabag' OR LOWER(username) = 'kabag' THEN 'ADMIN'
  WHEN UPPER(role) = 'KASIE' OR LOWER(username) LIKE '%.kasie' OR LOWER(username) = 'kasi' THEN 'INSPECTOR'
  WHEN UPPER(role) = 'ADMIN' THEN 'ADMIN'
  ELSE 'INSPECTOR'
END;

UPDATE public.users
SET akses_dashboard = (UPPER(role) = 'ADMIN');

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email
  ON public.users (LOWER(email))
  WHERE email IS NOT NULL AND TRIM(email) <> '';