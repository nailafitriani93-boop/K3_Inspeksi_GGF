-- Repair / upgrade script for the existing PostgreSQL database.
-- Safe to run repeatedly. It does NOT delete existing temuan data.

BEGIN;

ALTER TABLE public.temuan_k3
  ADD COLUMN IF NOT EXISTS no_wilayah SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS status_temuan VARCHAR(10) NOT NULL DEFAULT 'OPEN',
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS closed_by VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS foto_close_url VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS task_quiz JSONB NULL;

-- Backfill region number from the existing master relation.
UPDATE public.temuan_k3 t
SET no_wilayah = NULLIF(
  regexp_replace(mw.nama_wilayah, '[^0-9]', '', 'g'), ''
)::int
FROM public.master_wilayah mw
WHERE mw.id_wilayah = t.id_wilayah
  AND t.no_wilayah IS NULL
  AND NULLIF(regexp_replace(mw.nama_wilayah, '[^0-9]', '', 'g'), '')::int BETWEEN 1 AND 7;

ALTER TABLE public.temuan_k3 DROP CONSTRAINT IF EXISTS temuan_k3_status_check;
ALTER TABLE public.temuan_k3
  ADD CONSTRAINT temuan_k3_status_check
  CHECK (status_temuan IN ('OPEN','CLOSE'));

ALTER TABLE public.temuan_k3 DROP CONSTRAINT IF EXISTS temuan_k3_no_wilayah_check;
ALTER TABLE public.temuan_k3
  ADD CONSTRAINT temuan_k3_no_wilayah_check
  CHECK (no_wilayah BETWEEN 1 AND 7);

CREATE INDEX IF NOT EXISTS idx_temuan_k3_tanggal ON public.temuan_k3 (tanggal_temuan);
CREATE INDEX IF NOT EXISTS idx_temuan_k3_status ON public.temuan_k3 (status_temuan);
CREATE INDEX IF NOT EXISTS idx_temuan_k3_wilayah ON public.temuan_k3 (no_wilayah);
CREATE INDEX IF NOT EXISTS idx_temuan_k3_status_tanggal ON public.temuan_k3 (status_temuan, tanggal_temuan);

COMMIT;


-- Perbaiki trigger validasi: PIC sudah tidak digunakan. Validasi hanya lokasi terhadap wilayah.
CREATE OR REPLACE FUNCTION public.validasi_wilayah_temuan()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  lokasi_wilayah INTEGER;
BEGIN
  SELECT wilayah_id INTO lokasi_wilayah
  FROM public.master_lokasi
  WHERE id_lokasi = NEW.id_lokasi;

  IF lokasi_wilayah IS NULL THEN
    RAISE EXCEPTION 'Lokasi % tidak ditemukan', NEW.id_lokasi;
  END IF;

  IF NEW.id_wilayah IS NULL THEN
    RAISE EXCEPTION 'Wilayah temuan wajib diisi';
  END IF;

  IF lokasi_wilayah <> NEW.id_wilayah THEN
    RAISE EXCEPTION 'Lokasi tidak sesuai wilayah. Wilayah temuan %, lokasi berada di wilayah %', NEW.id_wilayah, lokasi_wilayah;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
