import React, { useState, Component } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

// Error Boundary to prevent any child view from ever crashing the whole screen
class PlatformErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Platform view error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-slate-900/90 border border-amber-500/40 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
            ⚠
          </div>
          <h2 className="text-lg font-bold text-white">Platform View Recovered</h2>
          <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto text-left">
            {this.state.error?.message || 'An unexpected rendering issue occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Reload View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// 13 Multi-Page Platform Views
import DashboardView from './DashboardView';
import AIAnalysisView from './AIAnalysisView';
import BulkUploadView from './BulkUploadView';
import AllReportsView from './AllReportsView';
import WeekSignalsView from './WeekSignalsView';
import StrongReportView from './StrongReportView';
import SIFPrecursorsView from './SIFPrecursorsView';
import AlertsView from './AlertsView';
import CorrectiveActionsView from './CorrectiveActionsView';
import AnalyticsView from './AnalyticsView';
import RiskHeatmapView from './RiskHeatmapView';
import LifeSavingRulesView from './LifeSavingRulesView';
import SettingsView from './SettingsView';

export default function OrganizationPlatform({ 
  currentPath = '/dashboard', 
  onNavigate, 
  onExitPlatform 
}) {
  const { user } = useAuth();
  const isAdmin = Boolean(
    user?.is_admin || 
    user?.role === 'ADMINISTRATOR' || 
    user?.role_name === 'Administrator' || 
    (user?.email && user.email.toLowerCase().includes('admin'))
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('safetyai_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('safetyai_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Render the appropriate view based on the current route path
  const renderCurrentView = () => {
    switch (currentPath) {
      case '/dashboard':
        return <DashboardView onNavigate={onNavigate} />;

      case '/ai-analysis':
        return <AIAnalysisView onNavigate={onNavigate} />;

      case '/incident-map':
      case '/map':
        return <DashboardView onNavigate={onNavigate} />;

      case '/bulk-upload':
        return <BulkUploadView onNavigate={onNavigate} />;

      case '/reports':
        return <AllReportsView onNavigate={onNavigate} />;

      case '/week-signals':
        return <WeekSignalsView onNavigate={onNavigate} />;

      case '/strong-report':
        return <StrongReportView onNavigate={onNavigate} />;

      case '/admin':
      case '/admin-dashboard':
      case '/sif-precursors':
        return <SIFPrecursorsView onNavigate={onNavigate} />;

      case '/critical-alerts':
        return <AlertsView onNavigate={onNavigate} />;

      case '/corrective-actions':
        return <CorrectiveActionsView onNavigate={onNavigate} />;

      case '/analytics':
        return <AnalyticsView onNavigate={onNavigate} />;

      case '/risk-heatmap':
        return <RiskHeatmapView onNavigate={onNavigate} />;

      case '/life-saving-rules':
        return <LifeSavingRulesView onNavigate={onNavigate} />;

      case '/settings':
        return <SettingsView onNavigate={onNavigate} />;

      default:
        return <DashboardView onNavigate={onNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-800 flex flex-col font-sans selection:bg-orange-100 selection:text-[#FF5A36]">
      
      {/* 1. Shared Left Enterprise Sidebar with dark navy palette (Static & Fixed) */}
      <Sidebar 
        currentPath={currentPath}
        onNavigate={onNavigate}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        onExitPlatform={onExitPlatform}
      />

      {/* 2. Main Content Area with Clean Light Gray Canvas (Offset by lg:pl-64 or lg:pl-20 for collapsed sidebar) */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen bg-[#F4F6F8] transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Shared Top Header */}
        <Header 
          currentPath={currentPath}
          onNavigate={onNavigate}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          onToggleSidebar={toggleSidebarCollapse}
          isSidebarCollapsed={isSidebarCollapsed}
          onExitPlatform={onExitPlatform}
        />

        {/* Dynamic Route View Page */}
        <main className="flex-1 bg-[#F4F6F8]">
          <PlatformErrorBoundary onReset={() => onNavigate && onNavigate('/dashboard')}>
            {renderCurrentView()}
          </PlatformErrorBoundary>
        </main>
      </div>

    </div>
  );
}
