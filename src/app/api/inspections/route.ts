import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sanitize, computeScore, INSPECTION_ITEMS } from "@/lib/utils";
import type { ConditionMap } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const block = req.nextUrl.searchParams.get("block");

    let query = supabase
      .from("inspections")
      .select("*")
      .order("created_at", { ascending: false });

    if (block && block !== "ALL") {
      query = query.eq("block", block);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/inspections]", err);
    return NextResponse.json(
      { error: "Failed to fetch inspections" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ref,
      block,
      unit,
      room,
      inspectorName,
      inspectionDate,
      studentName,
      studentSig,
      notes,
      deduction,
      conditions,
    } = body;

    if (!ref || !block || !unit || !room || !inspectorName || !inspectionDate) {
      return NextResponse.json(
        { error: "Missing required inspection fields" },
        { status: 400 }
      );
    }

    // Validate conditions object — only accept known item keys
    const sanitizedConditions: ConditionMap = {};
    for (const key of Object.keys(INSPECTION_ITEMS)) {
      const val = conditions?.[key];
      if (val === "Good" || val === "Damaged") {
        sanitizedConditions[key] = val;
      }
    }

    const score = computeScore(sanitizedConditions);

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("inspections")
      .insert({
        ref: sanitize(ref),
        block: sanitize(block),
        unit: sanitize(unit),
        room: sanitize(room),
        inspector_name: sanitize(inspectorName),
        inspection_date: inspectionDate,
        student_name: sanitize(studentName) || null,
        student_sig: sanitize(studentSig) || null,
        notes: sanitize(notes) || null,
        deduction: parseFloat(String(deduction)) || 0,
        conditions: sanitizedConditions,
        score,
        status: "submitted",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, score }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/inspections]", err);
    return NextResponse.json(
      { error: "Failed to save inspection" },
      { status: 500 }
    );
  }
}
