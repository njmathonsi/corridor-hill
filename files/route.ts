import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sanitize } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const block = req.nextUrl.searchParams.get("block");

    let query = supabase
      .from("allocations")
      .select("*")
      .order("created_at", { ascending: false });

    if (block && block !== "ALL") {
      query = query.eq("block", block);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/allocations]", err);
    return NextResponse.json(
      { error: "Failed to fetch allocations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ref,
      studentName,
      studentNum,
      saIdMasked,
      funding,
      block,
      unit,
      room,
    } = body;

    // Server-side sanitization
    if (!ref || !studentName || !studentNum || !saIdMasked || !block || !unit || !room) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("allocations")
      .insert({
        ref: sanitize(ref),
        student_name: sanitize(studentName),
        student_num: sanitize(studentNum),
        sa_id_masked: sanitize(saIdMasked),
        funding: sanitize(funding),
        block: sanitize(block),
        unit: sanitize(unit),
        room: sanitize(room),
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/allocations]", err);
    return NextResponse.json(
      { error: "Failed to save allocation" },
      { status: 500 }
    );
  }
}
