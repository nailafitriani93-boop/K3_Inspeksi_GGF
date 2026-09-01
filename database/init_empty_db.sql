-- Initial PostgreSQL bootstrap for a freshly created database.
-- This is intentionally not a Prisma migration and does not drop or modify
-- existing tables/data. It only creates the sequence required by the
-- Prisma default for master_aktivitas.kode_aktivitas.

CREATE SEQUENCE IF NOT EXISTS public.master_aktivitas_kode_seq
  AS bigint
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;
