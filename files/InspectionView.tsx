"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import {
  BLOCKS, genUnits, sanitize,
  INSPECTION_ITEMS, computeScore,
  type ConditionMap, type ConditionValue,
} from "@/lib/utils";

type WizardStep = 1 | 2 | 3 | 4;

interface FormState {
  block: string;
  unit: string;
  room: string;
  inspectorName: string;
  inspectionDate: string;
  studentName: string;
  notes: string;
  deduction: string;
  studentSig: string;
}

const EMPTY_FORM: FormState = {
  block: "", unit: "", room: "Room A",
  inspectorName: "", inspectionDate: "",
  studentName: "", notes: "", deduction: "", studentSig: "",
};

export function InspectionView() {
  const { showToast } = useToast();
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, inspectionDate: new Date().toISOString().split("T")[0] });
  const [conditions, setConditions] = useState<ConditionMap>({});
  const [reportRef, setReportRef] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const units = form.block ? genUnits(form.block) : [];

  const setField = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: sanitize(v) }));

  const setCondition = (item: string, cond: ConditionValue) =>
    setConditions((c) => ({ ...c, [item]: cond }));

  const wizNext = (n: WizardStep) => {
    if (n === 2) {
      if (!form.block || !form.unit || !form.room || !form.inspectorName) {
        showToast("⚠️", "Fill in all room & inspector details", "");
        return;
      }
    }
    setStep(n);
  };

  const score = computeScore(conditions);
  const scoreColor = score > 80 ? "var(--emerald)" : score > 50 ? "var(--amber)" : "var(--rose)";

  const itemKeys = Object.keys(INSPECTION_ITEMS);
  const damaged = itemKeys.filter((k) => conditions[k] === "Damaged");
  const good = itemKeys.filter((k) => conditions[k] === "Good");

  const generateReport = async () => {
    setSubmitting(true);
    const ref = "INSP-" + Date.now().toString(36).toUpperCase().slice(-8);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref,
          block: form.block,
          unit: form.unit,
          room: form.room,
          inspectorName: form.inspectorName,
          inspectionDate: form.inspectionDate || new Date().toISOString().split("T")[0],
          studentName: form.studentName,
          studentSig: form.studentSig,
          notes: form.notes,
          deduction: parseFloat(form.deduction || "0"),
          conditions,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setReportRef(ref);
      setReportOpen(true);
      showToast("📄", "Report Generated", `${ref} · Logged to maintenance`);
    } catch {
      showToast("⚠️", "Failed to save report", "Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setForm({ ...EMPTY_FORM, inspectionDate: new Date().toISOString().split("T")[0] });
    setConditions({});
    setReportRef("");
    setReportOpen(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Move-Out Inspection Wizard</div>
          <div className="page-sub">Tablet-optimised audit tool for building staff. Generates logged PDF report.</div>
        </div>
        <span className="badge badge-violet">● Pro Tier</span>
      </div>

      <div className="inspection-layout">
        <div className="card" style={{ marginBottom: 14 }}>
          {/* Wizard header */}
          <div className="wizard-header">
            {([1, 2, 3, 4] as WizardStep[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`wizard-step${s < step ? " done" : s === step ? " current" : ""}`}>
                  {s < step ? "✓" : s}
                </div>
                <span className="wizard-step-label">
                  {["Target Room", "Audit Items", "Inspector Notes", "Generate Report"][i]}
                </span>
                {i < 3 && <div className={`wizard-connector${s < step ? " done" : ""}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1 — Room selection */}
          {step === 1 && (
            <div>
              <div className="audit-section">
                <div className="audit-section-header">Target Room Selection</div>
                <div className="grid-3" style={{ gap: 10 }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Block</label>
                    <select className="input-field" value={form.block}
                      onChange={(e) => setForm((f) => ({ ...f, block: e.target.value, unit: "" }))}>
                      <option value="">Select…</option>
                      {BLOCKS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Unit</label>
                    <select className="input-field" value={form.unit}
                      onChange={(e) => setField("unit", e.target.value)}>
                      <option value="">Select block first…</option>
                      {units.map((u) => <option key={u} value={u}>{form.block}{u}</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Room</label>
                    <select className="input-field" value={form.room}
                      onChange={(e) => setField("room", e.target.value)}>
                      <option>Room A</option><option>Room B</option><option>Room C</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="input-group">
                    <label className="input-label">Inspector Name</label>
                    <input className="input-field" placeholder="Staff member name" value={form.inspectorName}
                      onChange={(e) => setField("inspectorName", e.target.value)} />
                  </div>
                  <div className="grid-2" style={{ gap: 10 }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Inspection Date</label>
                      <input className="input-field" type="date" value={form.inspectionDate}
                        onChange={(e) => setField("inspectionDate", e.target.value)} />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">Student Being Checked Out</label>
                      <input className="input-field" placeholder="Name or student no." value={form.studentName}
                        onChange={(e) => setField("studentName", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={() => wizNext(2)}>Next: Audit Items →</button>
              </div>
            </div>
          )}

          {/* Step 2 — Audit items (9 items: walls, ceiling, 2 beds, desk, wardrobe, 2 doors, floor) */}
          {step === 2 && (
            <div>
              <AuditSection title="Walls &amp; Ceiling" items={["walls", "ceiling"]} conditions={conditions} onSet={setCondition} />
              <AuditSection title="Furniture" items={["bed-window", "bed-door", "desk", "wardrobe"]} conditions={conditions} onSet={setCondition} />
              <AuditSection title="Doors &amp; Access" items={["door-handle", "door-frame"]} conditions={conditions} onSet={setCondition} />
              <AuditSection title="Flooring" items={["floor"]} conditions={conditions} onSet={setCondition} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button className="btn btn-ghost" onClick={() => wizNext(1)}>← Back</button>
                <button className="btn btn-primary" onClick={() => wizNext(3)}>Next: Notes →</button>
              </div>
            </div>
          )}

          {/* Step 3 — Notes */}
          {step === 3 && (
            <div>
              <div className="audit-section">
                <div className="audit-section-header">Inspector Notes &amp; Evidence</div>
                <div className="input-group">
                  <label className="input-label">General Observations</label>
                  <textarea className="input-field" rows={4} style={{ resize: "vertical" }}
                    placeholder="Describe any damage, missing items, cleanliness issues, or notable observations…"
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Deductions Recommended (ZAR)</label>
                  <input className="input-field" type="number" min="0" max="99999" placeholder="0.00"
                    style={{ fontFamily: "'JetBrains Mono',monospace" }}
                    value={form.deduction}
                    onChange={(e) => setField("deduction", e.target.value)} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label className="input-label" style={{ marginBottom: 8 }}>Photo Evidence Placeholders</label>
                  <div className="photo-strip">
                    {[0,1,2].map((i) => <div key={i} className="photo-placeholder" title="Tap to attach photo">📷</div>)}
                    <div className="photo-placeholder" title="Add more" style={{ borderStyle: "solid", borderColor: "var(--blue-ring)", color: "var(--blue)" }}>+</div>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Student Signature (Reference)</label>
                  <input className="input-field" placeholder="Type student full name as signature confirmation"
                    value={form.studentSig}
                    onChange={(e) => setField("studentSig", e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button className="btn btn-ghost" onClick={() => wizNext(2)}>← Back</button>
                <button className="btn btn-primary" onClick={() => wizNext(4)}>Review &amp; Generate →</button>
              </div>
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div>
              <div className="audit-section">
                <div className="audit-section-header">Pre-submission Review</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  <div className="summary-row"><span className="sk">Target Room</span><span className="sv">Block {form.block} · {form.block}{form.unit} · {form.room}</span></div>
                  <div className="summary-row"><span className="sk">Inspector</span><span className="sv">{form.inspectorName}</span></div>
                  <div className="summary-row"><span className="sk">Date</span><span className="sv">{form.inspectionDate}</span></div>
                  <div className="summary-row"><span className="sk">Student</span><span className="sv">{form.studentName || "—"}</span></div>
                  <div className="divider" />
                  {itemKeys.map((k) => (
                    <div className="summary-row" key={k}>
                      <span className="sk">{INSPECTION_ITEMS[k]}</span>
                      <span className="sv" style={{ color: conditions[k] === "Damaged" ? "var(--rose)" : "var(--emerald)" }}>
                        {conditions[k] || "Not assessed"}
                      </span>
                    </div>
                  ))}
                  <div className="divider" />
                  <div className="summary-row"><span className="sk">Asset Integrity Score</span><span className="sv" style={{ color: scoreColor }}>{score}%</span></div>
                  <div className="summary-row"><span className="sk">Deduction</span><span className="sv" style={{ color: "var(--amber)" }}>R {parseFloat(form.deduction || "0").toFixed(2)}</span></div>
                  <div className="summary-row"><span className="sk">Notes</span><span className="sv" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.notes || "None"}</span></div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => wizNext(3)}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={generateReport} disabled={submitting}>
                  {submitting ? "⏳ Saving…" : "📄 Generate PDF & Log Maintenance"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportOpen && (
        <div className="modal-overlay open">
          <div className="modal-box" style={{ maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
            <button className="modal-close" onClick={() => setReportOpen(false)}>✕</button>
            <div className="report-header">
              <div className="report-logo">◆ Corridor Hill Ecosystem</div>
              <div className="report-title">Move-Out Inspection Report</div>
              <div className="report-meta">REF: {reportRef} · Date: {form.inspectionDate} · Inspector: {form.inspectorName || "—"}</div>
            </div>

            <div className="report-section">
              <div className="report-section-title">Property Details</div>
              <div className="report-item"><span className="ri-key">Location</span><span>Block {form.block} · Unit {form.block}{form.unit} · {form.room}</span></div>
              <div className="report-item"><span className="ri-key">Student</span><span>{form.studentName || "—"}</span></div>
              <div className="report-item"><span className="ri-key">Inspection Date</span><span>{form.inspectionDate}</span></div>
              <div className="report-item"><span className="ri-key">Report Reference</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "var(--blue)" }}>{reportRef}</span></div>
            </div>

            <div className="report-score">
              <div className="report-score-num" style={{ color: scoreColor }}>{score}%</div>
              <div className="report-score-label">Room Asset Integrity Score · {good.length}/{itemKeys.length} Items Good</div>
            </div>

            <div className="report-section">
              <div className="report-section-title">Audit Results</div>
              {itemKeys.map((k) => (
                <div className="report-item" key={k}>
                  <span className="ri-key">{INSPECTION_ITEMS[k]}</span>
                  <span className={`badge ${conditions[k] === "Damaged" ? "badge-rose" : conditions[k] === "Good" ? "badge-emerald" : "badge-amber"}`}>
                    {conditions[k] || "Not assessed"}
                  </span>
                </div>
              ))}
            </div>

            {damaged.length > 0 && (
              <div className="report-section">
                <div className="report-section-title">⚠ Maintenance Actions Required</div>
                {damaged.map((k) => (
                  <div className="report-item" key={k}>
                    <span className="ri-key">{INSPECTION_ITEMS[k]}</span>
                    <span style={{ color: "var(--rose)" }}>Maintenance Required</span>
                  </div>
                ))}
              </div>
            )}

            <div className="report-section">
              <div className="report-section-title">Financial Summary</div>
              <div className="report-item"><span className="ri-key">Recommended Deduction</span><span style={{ fontWeight: 700, color: "var(--amber)" }}>R {parseFloat(form.deduction || "0").toFixed(2)}</span></div>
            </div>

            {form.notes && (
              <div className="report-section">
                <div className="report-section-title">Inspector Notes</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, padding: 8, background: "var(--bg-raised)", borderRadius: "var(--r-sm)" }}>{form.notes}</div>
              </div>
            )}

            <div className="report-section">
              <div className="report-section-title">Signatures</div>
              <div className="report-item"><span className="ri-key">Inspector</span><span>{form.inspectorName || "—"}</span></div>
              <div className="report-item"><span className="ri-key">Student</span><span>{form.studentSig || "Pending"}</span></div>
              <div className="report-item"><span className="ri-key">Generated</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{new Date().toLocaleString("en-ZA")}</span></div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => showToast("📄", "PDF Generated", "Report saved to maintenance log")}>
                ⬇ Save PDF Report
              </button>
              <button className="btn btn-ghost" onClick={() => { setReportOpen(false); resetWizard(); }}>
                Close &amp; Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* Sub-component: renders one audit section with its condition buttons */
import React from "react";

function AuditSection({
  title, items, conditions, onSet,
}: {
  title: string;
  items: string[];
  conditions: ConditionMap;
  onSet: (item: string, cond: ConditionValue) => void;
}) {
  const notes: Record<string, string> = {
    walls: "Paint, markings, damage, holes",
    ceiling: "Cracks, stains, bulb condition",
    "bed-window": "Frame, base, mattress — window-side unit",
    "bed-door": "Frame, base, mattress — door-side unit",
    desk: "Surface scratches, structural damage",
    wardrobe: "Hinges, shelves, exterior",
    "door-handle": "Operation, damage, key return",
    "door-frame": "Warping, damage, seals",
    floor: "Tiles, vinyl, carpet condition",
  };

  return (
    <div className="audit-section">
      <div className="audit-section-header" dangerouslySetInnerHTML={{ __html: title }} />
      {items.map((item) => (
        <div className="audit-item" key={item}>
          <div>
            <div className="ai-name">{INSPECTION_ITEMS[item]}</div>
            <div className="ai-note">{notes[item]}</div>
          </div>
          <div className="condition-toggle">
            <button
              className={`cond-btn${conditions[item] === "Good" ? " good" : ""}`}
              onClick={() => onSet(item, "Good")}
            >
              Good
            </button>
            <button
              className={`cond-btn${conditions[item] === "Damaged" ? " damaged" : ""}`}
              onClick={() => onSet(item, "Damaged")}
            >
              Damaged
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
