import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sanitize } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const block = req.nextUrl.searchParams.get("block");
    const search = req.nextUrl.searchParams.get("search")?.toLowerCase() ?? "";

    let query = supabase
      .from("pass_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (block && block !== "ALL") {
      query = query.eq("block", block);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Apply search filter server-side
    const filtered = search
      ? (data ?? []).filter(
          (r) =>
            r.student_name.toLowerCase().includes(search) ||
            r.student_num.toLowerCase().includes(search)
        )
      : (data ?? []);

    return NextResponse.json({ data: filtered });
  } catch (err) {
    console.error("[GET /api/pass-records]", err);
    return NextResponse.json(
      { error: "Failed to fetch pass records" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentName, studentNum, block, roomCode, departure, returnDate, destination } =
      body;

    if (!studentName || !studentNum || !block || !departure || !returnDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("pass_records")
      .insert({
        student_name: sanitize(studentName),
        student_num: sanitize(studentNum),
        block: sanitize(block),
        room_code: sanitize(roomCode) || `${block}???`,
        departure,
        return_date: returnDate,
        destination: sanitize(destination) || "Not specified",
        status: "out",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/pass-records]", err);
    return NextResponse.json(
      { error: "Failed to log pass" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing record id" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("pass_records")
      .update({ status: "in" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[PATCH /api/pass-records]", err);
    return NextResponse.json(
      { error: "Failed to check in student" },
      { status: 500 }
    );
  }
}
