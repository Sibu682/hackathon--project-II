import { useState } from "react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import StockPage from "./pages/StockPage";
import AlertsPage from "./pages/AlertsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import { useStockData } from "./hooks/useStockData";

function AppShell() {
  const { isDark } = useTheme();
  const [activePage,  setActivePage]  = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    stock, alerts, evidence, activity,
    loading, backendOk, error,
    refetch,
    handleDelivery,
    handleService,
  } = useStockData();

  const pages = {
    dashboard: (
      <Dashboard
        stock={stock}
        activity={activity}
        alerts={alerts}
        evidence={evidence}
        backendOk={backendOk}
        onDelivery={handleDelivery}
        onService={handleService}
        onAgentDone={refetch}
      />
    ),
    stock: (
      <StockPage
        stock={stock}
        onDelivery={handleDelivery}
      />
    ),
    alerts:    <AlertsPage alerts={alerts} />,
    analytics: <AnalyticsPage evidence={evidence} />,
    settings:  <SettingsPage backendOk={backendOk} />,
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0a0f1e]" : "bg-slate-50"}`}>
      <Navbar
        alertCount={alerts.length}
        businessName="So Convenient"
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        backendOk={backendOk}
      />

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        alertCount={alerts.length}
      />

      <main className="md:ml-64 pt-16 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Backend status banner */}
          {!loading && !backendOk && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-500 font-medium">
                Running in demo mode — backend not reachable. Start it with:&nbsp;
                <code className="font-mono bg-amber-500/10 px-1 rounded">
                  uvicorn backend.main:app --reload --port 8000
                </code>
              </p>
            </div>
          )}
          {pages[activePage]}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
