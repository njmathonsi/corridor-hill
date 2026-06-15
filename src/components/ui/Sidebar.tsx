"use client";

interface SidebarProps {
  activeView: string;
  onSetView: (view: string) => void;
  passOutCount: number;
}

export function Sidebar({ activeView, onSetView, passOutCount }: SidebarProps) {
  const nav = (view: string) => (
    <div
      className={`nav-item${activeView === view ? " active" : ""}`}
      onClick={() => onSetView(view)}
    >
      {view === "intake" && <><span className="nav-icon">🏠</span> Room Intake <span className="tier-tag tier-std">STD</span></>}
      {view === "biometric" && <><span className="nav-icon">🪪</span> Biometric Hub <span className="tier-tag tier-std">STD</span></>}
      {view === "passes" && (
        <>
          <span className="nav-icon">🌙</span> Pass Tracker
          <span className="nav-badge">{passOutCount}</span>
        </>
      )}
      {view === "inspection" && <><span className="nav-icon">🔍</span> Move-Out Audit <span className="tier-tag tier-prm">PRO</span></>}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">CH</div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">Corridor Hill</div>
          <div className="sidebar-brand-sub">Ecosystem v2.4</div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Student Portal</div>
        {nav("intake")}
        {nav("biometric")}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Administration</div>
        {nav("passes")}
        {nav("inspection")}
      </div>

      <div className="sidebar-footer">
        <div className="admin-chip">
          <div className="admin-avatar">SA</div>
          <div className="admin-info">
            <div className="admin-name">Site Admin</div>
            <div className="admin-role">Corridor Hill eMalahleni</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
