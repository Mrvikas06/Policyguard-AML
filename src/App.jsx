// ─────────────────────────────────────────────────────────────────────────────
// PolicyGuard AI — AML Intelligence Dashboard (Main App)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { C, formatTime, formatDate } from "./theme/colors";
import { ToastContainer } from "./components/ui/Toast";
import { Button } from "./components/ui/Button";
import { Card, CardContent } from "./components/ui/Card";
import { Input } from "./components/ui/Input";
import { Badge } from "./components/ui/Badge";

// Layout components
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";

// Views
import { OverviewView } from "./views/OverviewView";
import { ThreatsView } from "./views/ThreatsView";
import { TransactionsView } from "./views/TransactionsView";
import { NetworkView } from "./views/NetworkView";
import { PoliciesView } from "./views/PoliciesView";
import { CasesView } from "./views/CasesView";
import { ReportsView } from "./views/ReportsView";
import { ScannerView } from "./views/ScannerView";
import { SentinelView } from "./views/SentinelView";
import { InvestigationView } from "./views/InvestigationView";
import { AuditView } from "./views/AuditView";
import { SettingsView } from "./views/SettingsView";

// API service
import { api } from "./services/api";

// Auth context
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import { BrandMark } from "./components/ui/BrandMark";

const NAV_GROUPS = [
  { label: "Platform", items: [{ id: "overview", label: "Overview", icon: "home" }] },
  { label: "Threat Intelligence", items: [
    { id: "threats", label: "Threats", icon: "alert-triangle" },
    { id: "transactions", label: "Transactions", icon: "credit-card" },
    { id: "network", label: "Network", icon: "git-branch" },
  ]},
  { label: "Compliance", items: [
    { id: "policies", label: "Policies", icon: "file-text" },
    { id: "cases", label: "SAR Cases", icon: "briefcase" },
    { id: "reports", label: "Reports", icon: "bar-chart-2" },
  ]},
  { label: "AI Tools", items: [
    { id: "scanner", label: "AI Scanner", icon: "search" },
    { id: "sentinel", label: "Sentinel", icon: "activity" },
    { id: "investigation", label: "AI Investigation", icon: "brain" },
  ]},
  { label: "System", items: [
    { id: "audit", label: "Audit Log", icon: "clipboard-list" },
    { id: "settings", label: "Settings", icon: "settings" },
  ]},
];


// ─────────────────────────────────────────────────────────────────────────────
// Main App with Auth
// ─────────────────────────────────────────────────────────────────────────────

function AppContent() {
  const { user, logout, loading: authLoading } = useAuth();
  const [page, setPage] = useState("overview");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Last 24 hours");
  const [toasts, setToasts] = useState([]);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const [selectedRiskMetric, setSelectedRiskMetric] = useState("Risk Score");
  const [threatPage, setThreatPage] = useState(1);
  const [_mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const addToast = useCallback((toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openThreat = useCallback((threat) => {
    setSelectedThreat(threat);
    setPage("investigation");
    addToast({ message: `${threat.threat_id} opened in investigation`, type: "info" });
  }, [addToast]);

  const openCase = useCallback((caseItem) => {
    setPage("cases");
    addToast({ message: `Case ${caseItem.case_id} opened`, type: "info" });
  }, [addToast]);

  const runScan = useCallback(async () => {
    setGlobalLoading(true);
    addToast({ message: "AML scan started", type: "info" });
    try {
      await api.scans.start({ tables: ["transactions", "accounts", "beneficiaries"] });
      addToast({ message: "Scan completed successfully", type: "success" });
    } catch {
      addToast({ message: "Scan failed", type: "error" });
    } finally {
      setGlobalLoading(false);
    }
  }, [addToast]);

  const content = useMemo(() => {
    switch (page) {
      case "overview": return <OverviewView setPage={setPage} openThreat={openThreat} threatPage={threatPage} setThreatPage={setThreatPage} selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} selectedRiskMetric={selectedRiskMetric} setSelectedRiskMetric={setSelectedRiskMetric} />;
      case "threats": return <ThreatsView search={search} threatPage={threatPage} setThreatPage={setThreatPage} openThreat={openThreat} />;
      case "transactions": return <TransactionsView search={search} openThreat={openThreat} />;
      case "network": return <NetworkView />;
      case "policies": return <PoliciesView />;
      case "cases": return <CasesView openCase={openCase} />;
      case "reports": return <ReportsView />;
      case "scanner": return <ScannerView onRunScan={runScan} />;
      case "sentinel": return <SentinelView />;
      case "investigation": return <InvestigationView threat={selectedThreat} onClose={() => { setSelectedThreat(null); setPage("threats"); }} />;
      case "audit": return <AuditView />;
      case "settings": return <SettingsView />;
      default: return <OverviewView setPage={setPage} openThreat={openThreat} threatPage={threatPage} setThreatPage={setThreatPage} selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} selectedRiskMetric={selectedRiskMetric} setSelectedRiskMetric={setSelectedRiskMetric} />;
    }
  }, [page, search, selectedThreat, threatPage, selectedPeriod, selectedRiskMetric, openThreat, openCase, runScan]);

  if (authLoading) {
    return (
      <div className="app-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="skeleton" style={{ width: 200, height: 200, borderRadius: "50%" }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="app-layout" style={{ display: "grid", gridTemplateColumns: "auto 1fr", minHeight: "100vh" }}>
        <Sidebar
          page={page}
          setPage={setPage}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          navGroups={NAV_GROUPS}
        />
        
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Topbar
            search={search}
            setSearch={setSearch}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            timeLabel={formatTime(clock)}
            onMenuClick={() => setMobileDrawerOpen(true)}
            user={user}
            onLogout={logout}
            notifications={3}
          />
          
          <main className="page-frame" style={{ padding: 20, display: "grid", gap: 20, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ color: C.textDim, fontSize: 13 }}>
                Environment: Production · {dateFilter} · {formatDate(clock)}
              </div>
              <Badge variant="soft" color={C.brand}>Compliance Ready</Badge>
            </div>
            {globalLoading && (
              <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.brand}, ${C.accent})`, zIndex: C.zSticky, animation: "shimmer 1.5s infinite" }} />
            )}
            {content}
          </main>
        </div>
      </div>
    </div>
  );
}

function LoginPage() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("vikas@policyguard.ai");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (e) {
      setError(e.message || "Invalid credentials");
    }
  };

  return (
    <div className="app-shell" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <Card className="card-elevated" style={{ width: "100%", maxWidth: 420 }}>
        <CardContent style={{ padding: 32, display: "grid", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <BrandMark size={56} />
            <h1 style={{ margin: "16px 0 4px", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: C.text }}>PolicyGuard AI</h1>
            <p style={{ color: C.textDim, fontSize: 14 }}>AML Intelligence Dashboard</p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vikas@policyguard.ai"
                disabled={loading}
              />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
              />
            </div>
            {error && <div className="badge badge-critical" style={{ justifyContent: "center", padding: "8px 12px" }}>{error}</div>}
            <Button type="submit" variant="primary" block size="lg" loading={loading}>
              Sign In
            </Button>
          </form>
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid var(--color-border)`, color: "var(--color-text-dim)", fontSize: 12, textAlign: "center" }}>
            Demo: vikas@policyguard.ai / password123
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}