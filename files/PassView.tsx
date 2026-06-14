"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { sanitize, BLOCKS } from "@/lib/utils";

interface PassRecord {
  id: string;
  student_name: string;
  student_num: string;
  block: string;
  room_code: string;
  departure: string;
  return_date: string;
  destination: string;
  status: "out" | "in" | "overdue";
}

interface PassViewProps {
  onOutCountChange: (count: number) => void;
}

export function PassView({ onOutCountChange }: PassViewProps) {
  const { showToast } = useToast();
  const [records, setRecords] = useState<PassRecord[]>([]);
  const [filterBlock, setFilterBlock] = useState("ALL");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "", snum: "", block: "", room: "",
    departure: "", returnDate: "", dest: "",
  });

  const fetchRecords = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterBlock !== "ALL") params.set("block", filterBlock);
    if (search) params.set("search", search);
    const res = await fetch(`/api/pass-records?${params}`);
    const json = await res.json();
    if (json.data) setRecords(json.data);
  }, [filterBlock, search]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Keep sidebar badge in sync
  useEffect(() => {
    const out = records.filter((r) => r.status === "out" || r.status === "overdue").length;
    onOutCountChange(out);
  }, [records, onOutCountChange]);

  const logPass = async () => {
    if (!form.name || !form.snum || !form.block || !form.departure || !form.returnDate) {
      showToast("⚠️", "All required fields must be filled", "");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/pass-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: sanitize(form.name),
          studentNum: sanitize(form.snum),
          block: form.block,
          roomCode: sanitize(form.room),
          departure: form.departure,
          returnDate: form.returnDate,
          destination: sanitize(form.dest),
        }),
      });
      if (!res.ok) throw new Error("Failed to log pass");
      setForm({ name: "", snum: "", block: "", room: "", departure: "", returnDate: "", dest: "" });
      await fetchRecords();
      showToast("🌙", "Pass Logged", `${sanitize(form.name)} checked out`);
    } catch {
      showToast("⚠️", "Failed to log pass", "Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const checkIn = async (record: PassRecord) => {
    try {
      const res = await fetch("/api/pass-records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id }),
      });
      if (!res.ok) throw new Error();
      await fetchRecords();
      showToast("✅", "Student Checked In", `${record.student_name} marked as returned`);
    } catch {
      showToast("⚠️", "Check-in failed", "");
    }
  };

  const stBadge = (s: string) => {
    if (s === "in") return <span className="badge badge-emerald">In Building</span>;
    if (s === "overdue") return <span className="badge badge-rose">Overdue</span>;
    return <span className="badge badge-amber">Out of Building</span>;
  };

  const inCnt = records.filter((r) => r.status === "in").length;
  const outCnt = records.filter((r) => r.status === "out").length;
  const overdue = records.filter((r) => r.status === "overdue").length;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Night-Out &amp; Weekend Pass Tracker</div>
          <div className="page-sub">Log student departures and manage the real-time building manifest.</div>
        </div>
        <span className="badge badge-violet">● Admin — Secure</span>
      </div>

      <div className="pass-layout">
        {/* Form */}
        <div>
          <div className="card">
            <div className="card-header"><div className="card-title">Log New Pass</div></div>
            <div className="input-group">
              <label className="input-label">Student Name</label>
              <input className="input-field" placeholder="Full name" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: sanitize(e.target.value) }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Student Number</label>
              <input className="input-field" placeholder="STU2024…" value={form.snum}
                onChange={(e) => setForm((f) => ({ ...f, snum: sanitize(e.target.value) }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Block</label>
              <select className="input-field" value={form.block}
                onChange={(e) => setForm((f) => ({ ...f, block: e.target.value }))}>
                <option value="">Select block…</option>
                {BLOCKS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Room Code</label>
              <input className="input-field" placeholder="e.g. A101-Room B" value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: sanitize(e.target.value) }))} />
            </div>
            <div className="grid-2" style={{ gap: 10 }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Departure</label>
                <input className="input-field" type="datetime-local" value={form.departure}
                  onChange={(e) => setForm((f) => ({ ...f, departure: e.target.value }))} />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Return</label>
                <input className="input-field" type="datetime-local" value={form.returnDate}
                  onChange={(e) => setForm((f) => ({ ...f, returnDate: e.target.value }))} />
              </div>
            </div>
            <div className="input-group" style={{ marginTop: 10 }}>
              <label className="input-label">Destination / Reason</label>
              <input className="input-field" placeholder="e.g. Family visit — Emalahleni" value={form.dest}
                onChange={(e) => setForm((f) => ({ ...f, dest: sanitize(e.target.value) }))} />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 6 }}
              onClick={logPass} disabled={submitting}>
              {submitting ? "⏳ Logging…" : "+ Log Departure"}
            </button>
          </div>
        </div>

        {/* Manifest */}
        <div>
          <div className="stats-strip">
            <div className="stat-tile"><div className="st-val" style={{ color: "var(--emerald)" }}>{inCnt}</div><div className="st-label">In Building</div></div>
            <div className="stat-tile"><div className="st-val" style={{ color: "var(--amber)" }}>{outCnt}</div><div className="st-label">Out of Building</div></div>
            <div className="stat-tile"><div className="st-val" style={{ color: "var(--rose)" }}>{overdue}</div><div className="st-label">Overdue Return</div></div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Live Building Manifest</div>
              <button className="btn btn-ghost btn-sm"
                onClick={() => showToast("⬇", "Manifest Exported", "CSV download simulated")}>
                ⬇ Export
              </button>
            </div>

            <div className="search-bar-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Search by name or student number…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="filter-row">
              {["ALL", ...BLOCKS].map((b) => (
                <div
                  key={b}
                  className={`filter-chip${filterBlock === b ? " active" : ""}`}
                  onClick={() => setFilterBlock(b)}
                >
                  {b === "ALL" ? "All Blocks" : `Block ${b}`}
                </div>
              ))}
            </div>

            <div className="manifest-table-wrap">
              <table className="manifest-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Block / Room</th><th>Departure</th>
                    <th>Expected Return</th><th>Destination</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-disabled)" }}>
                      No pass records found.
                    </td></tr>
                  ) : records.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="student-name">{r.student_name}</div>
                        <div className="student-id">{r.student_num}</div>
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: 10 }}>Block {r.block}</span>{" "}
                        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{r.room_code}</span>
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{r.departure}</td>
                      <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{r.return_date}</td>
                      <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={r.destination}>{r.destination}</td>
                      <td>{stBadge(r.status)}</td>
                      <td>
                        {r.status !== "in" && (
                          <button className="btn btn-ghost btn-sm" onClick={() => checkIn(r)}>Check In</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
