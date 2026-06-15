import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import "@/App.css";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import IPIntel from "@/pages/tools/IPIntel";
import URLScan from "@/pages/tools/URLScan";
import EmailForensics from "@/pages/tools/EmailForensics";
import HashVerify from "@/pages/tools/HashVerify";
import CaseReport from "@/pages/tools/CaseReport";
import PortScan from "@/pages/tools/PortScan";
import IPv6Convert from "@/pages/tools/IPv6Convert";
import BreachCheck from "@/pages/tools/BreachCheck";
import ToolsDirectory from "@/pages/ToolsDirectory";
import HistoryPage from "@/pages/History";
import AnalysisDetail from "@/pages/AnalysisDetail";
import Cases from "@/pages/Cases";
import CaseDetail from "@/pages/CaseDetail";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="cs-shell grid min-h-screen place-items-center">
        <div className="cs-blink text-sm text-[var(--cs-muted)]">Loading Cyber Shield…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/tools/ip-intel" element={<Protected><IPIntel /></Protected>} />
      <Route path="/tools/url-scan" element={<Protected><URLScan /></Protected>} />
      <Route path="/tools/email-forensics" element={<Protected><EmailForensics /></Protected>} />
      <Route path="/tools/hash-verify" element={<Protected><HashVerify /></Protected>} />
      <Route path="/tools/port-scan" element={<Protected><PortScan /></Protected>} />
      <Route path="/tools/ipv6-convert" element={<Protected><IPv6Convert /></Protected>} />
      <Route path="/tools/breach-check" element={<Protected><BreachCheck /></Protected>} />
      <Route path="/tools/case-report" element={<Protected><CaseReport /></Protected>} />
      <Route path="/tools-directory" element={<Protected><ToolsDirectory /></Protected>} />
      <Route path="/history" element={<Protected><HistoryPage /></Protected>} />
      <Route path="/history/:id" element={<Protected><AnalysisDetail /></Protected>} />
      <Route path="/cases" element={<Protected><Cases /></Protected>} />
      <Route path="/cases/:id" element={<Protected><CaseDetail /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}
