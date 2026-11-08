-- Baseline skema produksi DARADIK (diturunkan dari prisma/schema.prisma + supabase_schema.sql)
-- Dipakai HANYA oleh harness pengujian keamanan lokal (PGlite). Bukan migrasi produksi.

CREATE TABLE IF NOT EXISTS public.anonymous_reports (
  id                         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ticket_code                TEXT NOT NULL UNIQUE,
  school_id                  TEXT NOT NULL,
  school_name                TEXT NOT NULL,
  school_npsn                TEXT NOT NULL,
  kabupaten                  TEXT NOT NULL,
  kecamatan                  TEXT NOT NULL,
  category                   TEXT NOT NULL,
  requester_role             TEXT NOT NULL,
  notes_encrypted            TEXT NOT NULL,
  encryption_iv              TEXT,
  encryption_salt            TEXT,
  encryption_algorithm       TEXT DEFAULT 'TLS-1.3 + PostgreSQL RLS',
  status                     TEXT NOT NULL DEFAULT 'QUEUED',
  waiting_additional_info    BOOLEAN NOT NULL DEFAULT FALSE,
  is_forwarded               BOOLEAN NOT NULL DEFAULT FALSE,
  forwarded_to               TEXT,
  ocr_text                   TEXT,
  ocr_bosp_fact              TEXT,
  rejection_reason           TEXT,
  resolution_outcome         TEXT,
  public_resolution_note     TEXT,
  skip_inspection_reason     TEXT,
  field_inspection_conducted BOOLEAN NOT NULL DEFAULT FALSE,
  inspection_methods         JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachment_count           INTEGER NOT NULL DEFAULT 0,
  attachments_json           JSONB,
  letter_document            JSONB,
  opened_at                  TIMESTAMPTZ,
  opened_by                  UUID,
  opened_by_name             TEXT,
  resolved_at                TIMESTAMPTZ,
  resolved_by                UUID,
  resolved_by_name           TEXT,
  version                    INTEGER NOT NULL DEFAULT 1,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kondisi produksi sebelum hardening: kebijakan lama yang longgar pada tabel laporan
-- dan data sekolah dibuat oleh supabase_schema.sql / supabase_reports_migration.sql.
DROP VIEW IF EXISTS public.schools_all CASCADE;


