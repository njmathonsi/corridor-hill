/**
 * Strongly-typed mirror of the Supabase schema.
 * Run `npx supabase gen types typescript --project-id qnfdqnipasvpxycsvseo`
 * after connecting the CLI to regenerate this file automatically.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      /** View 1 — Student Room Intake allocations */
      allocations: {
        Row: {
          id: string;
          created_at: string;
          ref: string;
          student_name: string;
          student_num: string;
          sa_id_masked: string;
          funding: string;
          block: string;
          unit: string;
          room: string;
          status: "active" | "vacated";
        };
        Insert: {
          id?: string;
          created_at?: string;
          ref: string;
          student_name: string;
          student_num: string;
          sa_id_masked: string;
          funding: string;
          block: string;
          unit: string;
          room: string;
          status?: "active" | "vacated";
        };
        Update: {
          id?: string;
          created_at?: string;
          ref?: string;
          student_name?: string;
          student_num?: string;
          sa_id_masked?: string;
          funding?: string;
          block?: string;
          unit?: string;
          room?: string;
          status?: "active" | "vacated";
        };
      };

      /** View 3 — Night-Out / Weekend Pass records */
      pass_records: {
        Row: {
          id: string;
          created_at: string;
          student_name: string;
          student_num: string;
          block: string;
          room_code: string;
          departure: string;
          return_date: string;
          destination: string;
          status: "out" | "in" | "overdue";
        };
        Insert: {
          id?: string;
          created_at?: string;
          student_name: string;
          student_num: string;
          block: string;
          room_code: string;
          departure: string;
          return_date: string;
          destination: string;
          status?: "out" | "in" | "overdue";
        };
        Update: {
          id?: string;
          created_at?: string;
          student_name?: string;
          student_num?: string;
          block?: string;
          room_code?: string;
          departure?: string;
          return_date?: string;
          destination?: string;
          status?: "out" | "in" | "overdue";
        };
      };

      /** View 4 — Move-out inspection reports */
      inspections: {
        Row: {
          id: string;
          created_at: string;
          ref: string;
          block: string;
          unit: string;
          room: string;
          inspector_name: string;
          inspection_date: string;
          student_name: string | null;
          student_sig: string | null;
          notes: string | null;
          deduction: number;
          conditions: Json; // { [itemKey]: "Good" | "Damaged" }
          score: number;
          status: "draft" | "submitted";
        };
        Insert: {
          id?: string;
          created_at?: string;
          ref: string;
          block: string;
          unit: string;
          room: string;
          inspector_name: string;
          inspection_date: string;
          student_name?: string | null;
          student_sig?: string | null;
          notes?: string | null;
          deduction?: number;
          conditions: Json;
          score: number;
          status?: "draft" | "submitted";
        };
        Update: {
          id?: string;
          created_at?: string;
          ref?: string;
          block?: string;
          unit?: string;
          room?: string;
          inspector_name?: string;
          inspection_date?: string;
          student_name?: string | null;
          student_sig?: string | null;
          notes?: string | null;
          deduction?: number;
          conditions?: Json;
          score?: number;
          status?: "draft" | "submitted";
        };
      };

      /** View 2 — Biometric appointment bookings */
      appointments: {
        Row: {
          id: string;
          created_at: string;
          student_ref: string;
          appointment_date: string;
          appointment_time: string;
          status: "confirmed" | "cancelled" | "completed";
        };
        Insert: {
          id?: string;
          created_at?: string;
          student_ref: string;
          appointment_date: string;
          appointment_time: string;
          status?: "confirmed" | "cancelled" | "completed";
        };
        Update: {
          id?: string;
          created_at?: string;
          student_ref?: string;
          appointment_date?: string;
          appointment_time?: string;
          status?: "confirmed" | "cancelled" | "completed";
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
