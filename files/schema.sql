-- ═══════════════════════════════════════════════════════════════════════
--  Corridor Hill — Ecosystem Platform  ·  Supabase Schema
--  Run this in the Supabase SQL Editor (project: qnfdqnipasvpxycsvseo)
--
--  Tables:
--    1. allocations   — Student room intake records          (View 1)
--    2. appointments  — Biometric access appointments        (View 2)
--    3. pass_records  — Night-out / weekend passes           (View 3)
--    4. inspections   — Move-out inspection reports          (View 4)
--
--  Auth: NONE — RLS disabled, public read/write via publishable key.
--  All sanitisation is enforced at the API layer (Next.js route handlers).
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
--  1. ALLOCATIONS  (Student Room Intake)
-- ─────────────────────────────────────────────
create table if not exists public.allocations (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  ref          text not null unique,
  student_name text not null,
  student_num  text not null,
  sa_id_masked text not null,
  funding      text not null default 'NSFAS',
  block        text not null,
  unit         text not null,
  room         text not null,
  status       text not null default 'active'
               check (status in ('active','vacated'))
);

-- Disable RLS — open public access (no auth required)
alter table public.allocations disable row level security;

-- Helpful index for filtering by block
create index if not exists idx_allocations_block
  on public.allocations (block);

-- ─────────────────────────────────────────────
--  2. APPOINTMENTS  (Biometric Hub Calendar)
-- ─────────────────────────────────────────────
create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  student_ref      text not null,
  appointment_date date not null,
  appointment_time text not null,
  status           text not null default 'confirmed'
                   check (status in ('confirmed','cancelled','completed'))
);

alter table public.appointments disable row level security;

-- Unique constraint prevents double-booking the same slot
create unique index if not exists idx_appointments_slot_unique
  on public.appointments (appointment_date, appointment_time)
  where status = 'confirmed';

create index if not exists idx_appointments_date
  on public.appointments (appointment_date);

-- ─────────────────────────────────────────────
--  3. PASS_RECORDS  (Night-Out & Weekend Passes)
-- ─────────────────────────────────────────────
create table if not exists public.pass_records (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  student_name  text not null,
  student_num   text not null,
  block         text not null,
  room_code     text not null,
  departure     text not null,   -- stored as formatted datetime string
  return_date   text not null,   -- stored as formatted datetime string
  destination   text not null default 'Not specified',
  status        text not null default 'out'
                check (status in ('out','in','overdue'))
);

alter table public.pass_records disable row level security;

create index if not exists idx_pass_records_block
  on public.pass_records (block);

create index if not exists idx_pass_records_status
  on public.pass_records (status);

-- ─────────────────────────────────────────────
--  4. INSPECTIONS  (Move-Out Inspection Reports)
-- ─────────────────────────────────────────────
create table if not exists public.inspections (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  ref             text not null unique,
  block           text not null,
  unit            text not null,
  room            text not null,
  inspector_name  text not null,
  inspection_date date not null,
  student_name    text,
  student_sig     text,
  notes           text,
  deduction       numeric(10,2) not null default 0,
  -- JSON object: { "walls":"Good","ceiling":"Good","bed-window":"Damaged",
  --               "bed-door":"Good","desk":"Good","wardrobe":"Good",
  --               "door-handle":"Good","door-frame":"Good","floor":"Good" }
  conditions      jsonb not null default '{}',
  score           integer not null default 0
                  check (score >= 0 and score <= 100),
  status          text not null default 'submitted'
                  check (status in ('draft','submitted'))
);

alter table public.inspections disable row level security;

create index if not exists idx_inspections_block
  on public.inspections (block);

create index if not exists idx_inspections_date
  on public.inspections (inspection_date desc);

-- ─────────────────────────────────────────────
--  Seed data — optional starter pass records
--  (matches the SEED_MANIFEST from the original HTML)
-- ─────────────────────────────────────────────
insert into public.pass_records
  (student_name, student_num, block, room_code, departure, return_date, destination, status)
values
  ('Bongani Nkosi',     'STU2024001', 'A', 'A101-Room A', '2024-11-20 17:00', '2024-11-22 18:00', 'Family visit - Soweto',       'out'),
  ('Thembi Shabalala',  'STU2024002', 'B', 'B202-Room C', '2024-11-21 08:00', '2024-11-21 22:00', 'Medical appointment',          'in'),
  ('Sipho Dlamini',     'STU2024003', 'C', 'C303-Room B', '2024-11-19 14:00', '2024-11-20 20:00', 'Weekend at home',              'overdue'),
  ('Nomsa Mahlangu',    'STU2024004', 'D', 'D102-Room A', '2024-11-22 07:00', '2024-11-22 23:00', 'Graduation ceremony',          'out'),
  ('Thabo Molefe',      'STU2024005', 'F', 'F203-Room B', '2024-11-20 12:00', '2024-11-21 12:00', 'Sport tournament - Witbank',   'in')
on conflict do nothing;
