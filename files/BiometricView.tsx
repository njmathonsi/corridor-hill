"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { sanitize } from "@/lib/utils";

interface Appointment {
  id: string;
  student_ref: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

const TIMES = [
  "08:00","08:05","08:10","08:15","08:20","08:25","08:30","08:35","08:40","08:45",
  "09:00","09:05","09:10","09:15","09:20","09:25","09:30","09:35","09:40","09:45",
  "10:00","10:05","10:10","10:15","10:30","10:35","10:40","10:45",
  "11:00","11:05","11:10","11:15",
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function BiometricView() {
  const { showToast } = useToast();
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done">("idle");
  const [scanLabel, setScanLabel] = useState("POSITION FACE WITHIN FRAME");
  const [gatesLit, setGatesLit] = useState(false);
  const [bioRef, setBioRef] = useState("");
  const [stuRef, setStuRef] = useState("");

  // Calendar
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Appointments from Supabase
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [booking, setBooking] = useState(false);

  // Compute booked slots set from DB data
  const bookedSet = new Set(
    appointments.map((a) => `${a.appointment_date}|${a.appointment_time}`)
  );

  const fetchAppointments = useCallback(async () => {
    const res = await fetch("/api/appointments");
    const json = await res.json();
    if (json.data) setAppointments(json.data);
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const startScan = () => {
    if (scanState === "scanning") return;
    setScanState("scanning");
    const stages: [number, string][] = [
      [400, "DEPTH MAP ANALYSIS"],
      [900, "ANTI-SPOOFING CHECK"],
      [1400, "TEMPLATE GENERATION"],
      [1900, "GATE SYNC IN PROGRESS"],
    ];
    stages.forEach(([delay, label]) => {
      setTimeout(() => setScanLabel(label), delay);
    });
    setTimeout(() => {
      const ref = "BIO-" + Date.now().toString(36).toUpperCase().slice(-8);
      setBioRef(ref);
      setScanState("done");
      setGatesLit(true);
      showToast("🪪", "Biometric Registered", `Template synced · Ref: ${ref}`);
    }, 2300);
  };

  const resetScan = () => {
    setScanState("idle");
    setScanLabel("POSITION FACE WITHIN FRAME");
    setGatesLit(false);
    setBioRef("");
  };

  const bookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      showToast("⚠️", "Select a date and time slot", "");
      return;
    }
    setBooking(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRef: sanitize(stuRef) || "Walk-in",
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
        }),
      });
      if (res.status === 409) {
        showToast("⚠️", "Slot already booked", "Please choose another time");
        return;
      }
      if (!res.ok) throw new Error("Booking failed");
      await fetchAppointments();
      showToast("📅", "Appointment Booked", `${selectedDate} at ${selectedTime}`);
      setSelectedTime(null);
    } catch {
      showToast("⚠️", "Booking failed", "Please try again");
    } finally {
      setBooking(false);
    }
  };

  // Calendar grid helpers
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  const dateStr = (d: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const isPast = (d: number) =>
    new Date(calYear, calMonth, d) < new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const isBooked = (d: number) => appointments.some((a) => a.appointment_date === dateStr(d));

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Face-Biometric Registration Hub</div>
          <div className="page-sub">3D liveness detection &amp; access gate sync. Fallback appointment booking below.</div>
        </div>
        <span className="badge badge-blue">● Biometric Active</span>
      </div>

      <div className="biometric-layout">
        {/* Camera side */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header"><div className="card-title">Facial Template Capture</div></div>
            <div className="camera-viewport" id="camera-viewport">
              <div className="scan-status-bar">
                <div className="scan-status-dot" style={{ background: scanState === "done" ? "var(--emerald)" : scanState === "scanning" ? "var(--amber)" : "var(--rose)" }} />
                <span className="scan-status-txt">{scanState === "done" ? "VERIFIED" : scanState === "scanning" ? "SCANNING" : "STANDBY"}</span>
              </div>
              <div className="camera-frame">
                <div className="camera-corner tl" /><div className="camera-corner tr" />
                <div className="camera-corner bl" /><div className="camera-corner br" />
                {scanState === "scanning" && <div className="scan-line" style={{ display: "block" }} />}
              </div>
              {scanState !== "done" ? (
                <div className="scan-reticle">
                  <div className="scan-pulse-ring" /><div className="scan-pulse-ring" />
                  <span className="scan-icon">👤</span>
                </div>
              ) : null}
              <div className="camera-label">{scanLabel}</div>

              {scanState === "done" && (
                <div className="scan-success-overlay show">
                  <span className="scan-check">✅</span>
                  <div className="scan-success-title">Facial Template Generated &amp; Synced</div>
                  <div className="scan-success-sub">3D Liveness Verified.<br />Template synced to Block Access Gates.<br />Anti-spoofing: PASS · Confidence: 99.7%</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "var(--text-tertiary)", marginTop: 6 }}>REF: {bioRef}</div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={startScan} disabled={scanState === "scanning"}>
                ⬡ {scanState === "scanning" ? "Scanning…" : "Scan Face"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={resetScan}>Reset</button>
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="input-label" style={{ marginBottom: 6 }}>Student Reference</div>
              <input className="input-field" placeholder="Enter student number for sync" value={stuRef}
                onChange={(e) => setStuRef(sanitize(e.target.value))} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div><div className="card-title">Gate Access Sync Status</div></div></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["A","B","C","D","E","F"].map((b) => (
                <div className="audit-item" key={b}>
                  <div><div className="ai-name">Block {b} — Main Gate</div></div>
                  <span className={`badge ${gatesLit ? "badge-emerald" : "badge-amber"}`}>
                    {gatesLit ? "Synced ✓" : "Pending Sync"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar side */}
        <div>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Book Access Appointment</div>
                <div className="card-sub">For students with lighting or camera issues</div>
              </div>
            </div>
            <div className="appt-calendar">
              <div className="cal-header">
                <button className="cal-nav" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}>‹</button>
                <div className="cal-month">{MONTHS[calMonth]} {calYear}</div>
                <button className="cal-nav" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}>›</button>
              </div>
              <div className="cal-grid">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                  <div className="cal-day-header" key={d}>{d}</div>
                ))}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div className="cal-day empty" key={`e${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = i + 1;
                  const ds = dateStr(d);
                  const past = isPast(d);
                  const today = ds === todayStr;
                  const booked = isBooked(d);
                  const sel = selectedDate === ds;
                  let cls = "cal-day";
                  if (past) cls += " past";
                  else if (booked) cls += " booked";
                  else if (today) cls += " today";
                  if (sel) cls += " selected";
                  return (
                    <div key={d} className={cls} onClick={() => !past && setSelectedDate(ds)}>{d}</div>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="time-slots" style={{ display: "block" }}>
                  <div className="time-slots-header">Available Slots — {selectedDate}</div>
                  <div className="time-slot-grid">
                    {TIMES.map((t) => {
                      const taken = bookedSet.has(`${selectedDate}|${t}`);
                      return (
                        <div
                          key={t}
                          className={`time-slot${taken ? " taken" : selectedTime === t ? " selected" : ""}`}
                          onClick={() => !taken && setSelectedTime(t)}
                        >
                          {t}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={bookAppointment} disabled={booking}>
                      {booking ? "⏳ Booking…" : "Book Selected Slot"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-header"><div><div className="card-title">Upcoming Appointments</div></div></div>
            {appointments.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "center", padding: 12 }}>
                No appointments booked yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {appointments.map((a) => (
                  <div className="audit-item" key={a.id}>
                    <div>
                      <div className="ai-name">{a.appointment_date} · {a.appointment_time}</div>
                      <div className="ai-note">Student: {a.student_ref}</div>
                    </div>
                    <span className="badge badge-blue">Confirmed</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
