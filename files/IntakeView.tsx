"use client";

import { useState, useCallback } from "react";
import { BLOCKS, genUnits, getRoomState, maskSAID, sanitize } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";

interface IntakeState {
  block: string | null;
  unit: string | null;
  room: string | null;
  funding: string;
  studentName: string;
  studentNum: string;
  studentId: string;
}

const EMPTY_STATE: IntakeState = {
  block: null, unit: null, room: null,
  funding: "NSFAS",
  studentName: "", studentNum: "", studentId: "",
};

export function IntakeView() {
  const { showToast } = useToast();
  const [state, setState] = useState<IntakeState>(EMPTY_STATE);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRef, setModalRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const units = state.block ? genUnits(state.block) : [];

  const confirmReady =
    state.studentName.trim() &&
    state.studentNum.trim() &&
    state.studentId.length === 13 &&
    state.block && state.unit && state.room;

  const clean = (v: string) => sanitize(v);

  const handleConfirm = useCallback(async () => {
    if (!confirmReady || submitting) return;
    setSubmitting(true);
    const ref = "CH-ALLOC-" + Date.now().toString(36).toUpperCase().slice(-6);
    try {
      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref,
          studentName: clean(state.studentName),
          studentNum: clean(state.studentNum),
          saIdMasked: maskSAID(state.studentId),
          funding: state.funding,
          block: state.block,
          unit: state.unit,
          room: state.room,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Unknown error");
      }
      setModalRef(ref);
      setModalOpen(true);
      showToast(
        "✅",
        "Allocation Confirmed",
        `${clean(state.studentName)} → ${state.block}${state.unit} Room ${state.room}`
      );
    } catch (e: unknown) {
      showToast("⚠️", "Save failed", e instanceof Error ? e.message : "Please try again");
    } finally {
      setSubmitting(false);
    }
  }, [state, confirmReady, submitting, showToast]);

  const reset = () => {
    setState(EMPTY_STATE);
    setModalOpen(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Student Room Intake</div>
          <div className="page-sub">Register a student, choose a block, unit, and room cluster assignment.</div>
        </div>
        <span className="badge badge-emerald">● Standard Tier</span>
      </div>

      <div className="intake-layout">
        {/* LEFT — Student Profile */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <div>
                <div className="card-title">Student Profile</div>
                <div className="card-sub">Personal &amp; academic details</div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input
                className="input-field"
                placeholder="e.g. Sipho Dlamini"
                value={state.studentName}
                onChange={(e) =>
                  setState((s) => ({ ...s, studentName: sanitize(e.target.value) }))
                }
              />
            </div>
            <div className="input-group">
              <label className="input-label">Student Number</label>
              <input
                className="input-field"
                placeholder="e.g. STU2024001234"
                maxLength={16}
                value={state.studentNum}
                onChange={(e) =>
                  setState((s) => ({ ...s, studentNum: sanitize(e.target.value) }))
                }
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                SA ID Number (13 digits){" "}
                <span style={{ color: "var(--text-disabled)", fontSize: 10 }}>POPIA masked</span>
              </label>
              <input
                className="input-field masked"
                placeholder="0001015009087"
                maxLength={13}
                value={state.studentId}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 13);
                  setState((s) => ({ ...s, studentId: v }));
                }}
              />
              {state.studentId.length >= 6 && (
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "'JetBrains Mono',monospace", marginTop: 3, letterSpacing: "0.1em" }}>
                  Stored: {maskSAID(state.studentId)}
                </div>
              )}
            </div>

            <div className="divider" />
            <div className="input-label" style={{ marginBottom: 8 }}>Funding Status</div>
            <div className="funding-toggle">
              {["NSFAS", "Private", "Bursary"].map((f) => (
                <div
                  key={f}
                  className={`funding-option${state.funding === f ? " selected" : ""}`}
                  onClick={() => setState((s) => ({ ...s, funding: f }))}
                >
                  <div className="fo-dot" />
                  <div>
                    <div className="fo-label">{f === "NSFAS" ? "NSFAS" : f === "Private" ? "Private Paying" : "External Bursary"}</div>
                    <div className="fo-sub">{f === "NSFAS" ? "National Student Financial Aid" : f === "Private" ? "Self / family funded" : "Employer / scholarship"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE — Block → Unit → Cluster */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <div><div className="card-title">Block Selection</div></div>
            </div>
            <div className="block-tabs">
              {BLOCKS.map((b) => (
                <div
                  key={b}
                  className={`block-tab${state.block === b ? " active" : ""}`}
                  onClick={() => setState((s) => ({ ...s, block: b, unit: null, room: null }))}
                >
                  Block {b}
                </div>
              ))}
            </div>

            {state.block && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 10 }}>
                  Select a unit in Block {state.block}
                </div>
                <div className="unit-grid">
                  {units.map((u) => (
                    <div
                      key={u}
                      className={`unit-card${state.unit === u ? " selected" : ""}`}
                      onClick={() =>
                        setState((s) => ({ ...s, unit: u, room: null }))
                      }
                    >
                      <div className="uc-label">{state.block}{u}</div>
                      <div className="uc-sub">3 rooms</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.block && state.unit && (
              <>
                <div className="divider" />
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8 }}>
                  Cluster map — Unit {state.block}{state.unit}
                </div>
                <div className="cluster-map">
                  <div className="cluster-label">3-Room Cluster · Shared Common Walkway</div>
                  <div className="cluster-visual">
                    {["A", "B", "C"].map((r) => {
                      const roomState = getRoomState(state.block!, state.unit!, r);
                      const isSelected = state.room === r;
                      return (
                        <div
                          key={r}
                          className={`cluster-room ${isSelected ? "selected" : roomState}`}
                          onClick={() =>
                            roomState !== "occupied" &&
                            setState((s) => ({ ...s, room: r }))
                          }
                        >
                          <div className="cr-letter">R{r}</div>
                          <div className="cr-label">Room {r}</div>
                          <div className="cr-status">
                            {roomState === "occupied" ? "Occupied" : isSelected ? "Selected" : "Available"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="cluster-common">↕ Shared Common Area / Walkway ↕</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — Summary */}
        <div>
          <div className="summary-card">
            <div className="card-title">Selection Summary</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 3 }}>Live allocation path</div>
            <div className="summary-path">
              {state.block && state.unit && state.room ? (
                <>
                  <span className="summary-crumb">Block {state.block}</span>
                  <span className="summary-arrow">›</span>
                  <span className="summary-crumb">{state.block}{state.unit}</span>
                  <span className="summary-arrow">›</span>
                  <span className="summary-crumb" style={{ color: "var(--blue)", borderColor: "var(--blue-ring)" }}>
                    Room {state.room}
                  </span>
                </>
              ) : state.block ? (
                <>
                  <span className="summary-crumb">Block {state.block}</span>
                  <span className="summary-arrow">›</span>
                  <span className="summary-crumb" style={{ color: "var(--text-disabled)" }}>Select unit…</span>
                </>
              ) : (
                <span className="summary-crumb" style={{ color: "var(--text-disabled)" }}>No block selected</span>
              )}
            </div>
            <div className="divider" />
            <div className="summary-row"><span className="sk">Student</span><span className="sv masked">{state.studentName || "—"}</span></div>
            <div className="summary-row"><span className="sk">Student No.</span><span className="sv masked">{state.studentNum || "—"}</span></div>
            <div className="summary-row"><span className="sk">SA ID</span><span className="sv masked">{state.studentId ? maskSAID(state.studentId) : "—"}</span></div>
            <div className="summary-row"><span className="sk">Funding</span><span className="sv">{state.funding}</span></div>
            <div className="summary-row"><span className="sk">Block</span><span className="sv">{state.block || "—"}</span></div>
            <div className="summary-row"><span className="sk">Unit</span><span className="sv">{state.unit ? `${state.block}${state.unit}` : "—"}</span></div>
            <div className="summary-row"><span className="sk">Room</span><span className="sv">{state.room ? `Room ${state.room}` : "—"}</span></div>
            <div className="summary-row">
              <span className="sk">Status</span>
              <span className="sv">
                {state.block && state.unit && state.room
                  ? <span className="badge badge-blue">Room Selected</span>
                  : <span className="badge badge-amber">Pending</span>}
              </span>
            </div>
            <div className="divider" />
            <button
              className="btn btn-emerald"
              style={{ width: "100%" }}
              disabled={!confirmReady || submitting}
              onClick={handleConfirm}
            >
              {submitting ? "⏳ Saving…" : "✓ Confirm Bed Selection"}
            </button>
            <div style={{ fontSize: 10, color: "var(--text-disabled)", textAlign: "center", marginTop: 8 }}>
              All fields must be completed
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {modalOpen && (
        <div className="modal-overlay open">
          <div className="modal-box">
            <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            <div className="modal-icon">🎉</div>
            <div className="modal-title">Bed Successfully Reserved</div>
            <div className="modal-sub">The following allocation has been registered in the Corridor Hill system.</div>
            <div className="modal-ref">{modalRef}</div>
            {[
              { k: "Student Name", v: state.studentName },
              { k: "Student No.", v: state.studentNum },
              { k: "SA ID", v: maskSAID(state.studentId) },
              { k: "Funding", v: state.funding },
              { k: "Block", v: `Block ${state.block}` },
              { k: "Unit", v: `${state.block}${state.unit}` },
              { k: "Room", v: `Room ${state.room}` },
              { k: "Allocation", v: new Date().toLocaleString("en-ZA") },
            ].map((r) => (
              <div className="modal-detail-row" key={r.k}>
                <span className="modal-detail-key">{r.k}</span>
                <span className="modal-detail-val">{r.v}</span>
              </div>
            ))}
            <button className="btn btn-emerald" style={{ width: "100%", marginTop: 16 }} onClick={reset}>
              Done — Start New Application
            </button>
          </div>
        </div>
      )}
    </>
  );
}
