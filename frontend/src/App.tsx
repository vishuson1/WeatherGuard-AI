import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { LiveForecastPage } from './pages/LiveForecastPage';
import { ConfidenceMapPage } from './pages/ConfidenceMapPage';
import { ForecastBustPage } from './pages/ForecastBustPage';
import { HistoricalVerificationPage } from './pages/HistoricalVerificationPage';
import { ExplainableAIPage } from './pages/ExplainableAIPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { DatasetsPage } from './pages/DatasetsPage';
import { ApiDocsPage } from './pages/ApiDocsPage';
import { AdminPage } from './pages/AdminPage';
import { HealthStatus } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [health, setHealth] = useState<HealthStatus | null>(null);

  // Poll health status every 30 seconds
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await api.getHealth();
        setHealth(data);
      } catch (err) {
        console.warn('Health check warning (backend starting up):', err);
        setHealth({
          status: 'CONNECTING',
          mode: 'DEMO / RESEARCH MODE',
          database_status: 'INITIALIZING',
          active_model: 'WeatherGuard-Ensemble',
          last_data_update: 'Just now',
          next_update: '5 min',
          data_health: 'GOOD'
        });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'live_forecast':
        return <LiveForecastPage />;
      case 'confidence_map':
        return <ConfidenceMapPage />;
      case 'forecast_busts':
        return <ForecastBustPage />;
      case 'historical_verification':
        return <HistoricalVerificationPage />;
      case 'explainable_ai':
        return <ExplainableAIPage />;
      case 'model_performance':
        return <ModelPerformancePage />;
      case 'datasets':
        return <DatasetsPage />;
      case 'api_docs':
        return <ApiDocsPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <DashboardPage onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Operations Center Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        health={health}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {renderContent()}
      </main>

      {/* Meteorological Operations Command Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400 font-mono">WeatherGuard AI</span>
            <span>&bull;</span>
            <span>AI-Powered Medium-Range Forecast Confidence &amp; Bust Detection System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Decision Support Layer (Non-Replacement of Official Forecasts)</span>
            <span>&bull;</span>
            <span className="text-cyan-500 font-mono">SHAP Explainability Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
