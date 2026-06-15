"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { IntakeView } from "@/components/views/IntakeView";
import { BiometricView } from "@/components/views/BiometricView";
import { PassView } from "@/components/views/PassView";
import { InspectionView } from "@/components/views/InspectionView";

type ViewId = "intake" | "biometric" | "passes" | "inspection";

const CRUMB_MAP: Record<ViewId, string> = {
  intake: "Room Intake",
  biometric: "Biometric Hub",
  passes: "Pass Tracker",
  inspection: "Move-Out Audit",
};

export default function Home() {
  const [activeView, setActiveView] = useState<ViewId>("intake");
  const [passOutCount, setPassOutCount] = useState(0);

  const handleOutCountChange = useCallback((count: number) => {
    setPassOutCount(count);
  }, []);

  return (
    <div style={{ display: "flex", overflow: "hidden" }}>
      <Sidebar
        activeView={activeView}
        onSetView={(v) => setActiveView(v as ViewId)}
        passOutCount={passOutCount}
      />

      <div className="main-wrap">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <span>Corridor Hill</span>
            <span className="sep">›</span>
            <span className="current">{CRUMB_MAP[activeView]}</span>
          </div>
          <div className="topbar-actions">
            <div className="topbar-chip">
              <div className="dot" />
              System Online
            </div>
            <div className="topbar-chip">🏢 Blocks A B C D E F</div>
          </div>
        </header>

        {/* Content area */}
        <div className="content-area">
          {activeView === "intake" && <IntakeView />}
          {activeView === "biometric" && <BiometricView />}
          {activeView === "passes" && (
            <PassView onOutCountChange={handleOutCountChange} />
          )}
          {activeView === "inspection" && <InspectionView />}
        </div>
      </div>
    </div>
  );
}
