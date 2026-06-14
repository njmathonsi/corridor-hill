# Corridor Hill — Ecosystem Platform

A Next.js 15 residential management system backed by **Supabase** (no auth — fully open public access via publishable key).

---

## Quick Start

### 1. Install dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
# or simply:
npm install
```

### 2. Environment variables

The `.env.local` file is already configured:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qnfdqnipasvpxycsvseo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Seo2v8BwdlUFn0VZ1MQH0g_4x2zelOu
```

> **Never commit `.env.local`** — it is already in `.gitignore`.

### 3. Create the Supabase tables

Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/qnfdqnipasvpxycsvseo/sql) and paste the contents of:

```
supabase/schema.sql
```

This creates all four tables with RLS disabled and seeds starter pass records.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                  ← Root shell — view router + topbar
│   ├── layout.tsx                ← HTML shell, fonts, ToastProvider
│   ├── globals.css               ← All design tokens + component CSS
│   └── api/
│       ├── allocations/route.ts  ← GET, POST
│       ├── appointments/route.ts ← GET, POST
│       ├── pass-records/route.ts ← GET, POST, PATCH
│       └── inspections/route.ts  ← GET, POST
├── components/
│   ├── ui/
│   │   ├── Sidebar.tsx           ← Navigation sidebar
│   │   └── ToastProvider.tsx     ← Global toast notifications
│   └── views/
│       ├── IntakeView.tsx        ← View 1: Student room allocation
│       ├── BiometricView.tsx     ← View 2: Face scan + appointments
│       ├── PassView.tsx          ← View 3: Night-out pass tracker
│       └── InspectionView.tsx    ← View 4: Move-out inspection wizard
├── lib/
│   ├── supabase-client.ts        ← Browser-side Supabase client
│   ├── supabase-server.ts        ← Server-side Supabase client
│   └── utils.ts                  ← sanitize, maskSAID, BLOCKS, INSPECTION_ITEMS, computeScore
└── types/
    └── database.ts               ← Strongly-typed Supabase schema
```

---

## Supabase Tables

| Table          | Used by          | Key columns                                      |
|----------------|------------------|--------------------------------------------------|
| `allocations`  | Room Intake      | ref, student_name, block, unit, room, status     |
| `appointments` | Biometric Hub    | student_ref, appointment_date, appointment_time  |
| `pass_records` | Pass Tracker     | student_name, block, room_code, departure, status|
| `inspections`  | Move-Out Audit   | ref, block, unit, conditions (jsonb), score      |

All tables have **RLS disabled** — access is controlled at the Next.js API layer with server-side sanitisation.

---

## Blocks & Room Structure

Blocks: **A, B, C, D, E, F**  
Each block has **20 units** (5 floors × 4 units), each unit has **3 rooms** (A, B, C).  
Each room contains **2 inspectable beds**: `Bed (Near Window)` and `Bed (Near Door)`.

### Inspection Checklist (9 items)

| Key           | Label               |
|---------------|---------------------|
| `walls`       | Walls               |
| `ceiling`     | Ceiling             |
| `bed-window`  | Bed (Near Window)   |
| `bed-door`    | Bed (Near Door)     |
| `desk`        | Desk & Chair        |
| `wardrobe`    | Wardrobe            |
| `door-handle` | Door Handles        |
| `door-frame`  | Door Frame          |
| `floor`       | Flooring            |

The **Room Asset Integrity Score** is `(good items / 9) × 100`.

---

## Security Notes

- All user input is sanitised via `sanitize()` in `src/lib/utils.ts` (strips `< > " ' ; -- */`)
- SA ID numbers are POPIA-masked via `maskSAID()` before storage
- Server-side validation rejects unknown inspection item keys
- No authentication is required — all forms are publicly accessible
