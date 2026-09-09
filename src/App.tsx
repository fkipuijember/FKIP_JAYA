import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RegistrationForm } from './components/RegistrationForm';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { SuccessModal } from './components/SuccessModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { RegistrationRecord, DashboardConfig } from './types';
import { getSavedRegistrations, getGoogleSyncConfig, getDashboardConfig, saveDashboardConfig } from './utils/storage';
import { testFirestoreConnection, subscribeDashboardConfig, subscribeRegistrations } from './utils/firebase';
import { GraduationCap, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'admin'>('form');
  const [records, setRecords] = useState<RegistrationRecord[]>([]);
  const [successRecord, setSuccessRecord] = useState<RegistrationRecord | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isDriveSyncConfigured, setIsDriveSyncConfigured] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() => getDashboardConfig());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('ppl_uij_admin_authenticated') === 'true';
  });
  const [configKey, setConfigKey] = useState(0);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Load records and sync config on mount, check URL config parameter, and fetch /app-config.json
  useEffect(() => {
    // 1. Check if configuration was passed via URL hash (#config=...)
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('config=')) {
        const base64Data = hash.split('config=')[1];
        if (base64Data) {
          const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(base64Data))));
          const parsed = JSON.parse(jsonStr);
          if (parsed && typeof parsed === 'object') {
            const current = getDashboardConfig();
            const merged = { ...current, ...parsed };
            saveDashboardConfig(merged);
            setDashboardConfig(merged);
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      }
    } catch (e) {
      console.warn('URL config parse error:', e);
    }

    // 2. Fetch server /app-config.json so any new browser/device on Vercel gets the latest global config
    fetch('/app-config.json')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((serverConfig) => {
        if (serverConfig && typeof serverConfig === 'object') {
          const hasCustomLocal = localStorage.getItem('ppl_fkip_uij_dashboard_config');
          if (!hasCustomLocal) {
            saveDashboardConfig(serverConfig);
            setDashboardConfig(serverConfig);
          } else {
            // Merge in case new server keys were added
            try {
              const localParsed = JSON.parse(hasCustomLocal);
              const merged = { ...serverConfig, ...localParsed };
              setDashboardConfig(merged);
            } catch {
              setDashboardConfig(serverConfig);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        refreshData();
      });

    
    // 3. Connect to Firebase Cloud Firestore for real-time multi-device sync
    testFirestoreConnection().then((connected) => {
      setIsCloudConnected(connected);
    });

    const unsubConfig = subscribeDashboardConfig((remoteConfig) => {
      if (remoteConfig) {
        setDashboardConfig(remoteConfig);
        setIsCloudConnected(true);
        setConfigKey((k) => k + 1);
      }
    });

    const unsubRegistrations = subscribeRegistrations((remoteRecords) => {
      if (remoteRecords && remoteRecords.length > 0) {
        setRecords(remoteRecords);
        setIsCloudConnected(true);
      }
    });
    refreshData();
    return () => {
      unsubConfig();
      unsubRegistrations();
    };
  }, []);

  const refreshData = () => {
    const data = getSavedRegistrations();
    setRecords(data);
    const config = getGoogleSyncConfig();
    setIsDriveSyncConfigured(Boolean(config.webAppUrl && config.webAppUrl.trim().startsWith('http')));
    setDashboardConfig(getDashboardConfig());
    setConfigKey((k) => k + 1);
  };

  const handleRegistrationSuccess = (newRecord: RegistrationRecord) => {
    refreshData();
    setSuccessRecord(newRecord);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('ppl_uij_admin_authenticated');
    setIsAdminAuthenticated(false);
    setActiveTab('form');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-800">
      {/* Navbar with UIJ Branding */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        isDriveSyncConfigured={isDriveSyncConfigured}
        isAdminAuthenticated={isAdminAuthenticated}
        onLogout={handleAdminLogout}
        dashboardConfig={dashboardConfig}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'form' ? (
          <RegistrationForm
            key={configKey}
            dashboardConfig={dashboardConfig}
            onSuccess={handleRegistrationSuccess}
            onOpenSyncInfo={() => setIsSyncModalOpen(true)}
          />
        ) : !isAdminAuthenticated ? (
          <AdminLogin
            onLoginSuccess={() => setIsAdminAuthenticated(true)}
            onCancel={() => setActiveTab('form')}
          />
        ) : (
          <AdminPanel
            records={records}
            onRefresh={refreshData}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onLogout={handleAdminLogout}
            dashboardConfig={dashboardConfig}
          />
        )}
      </main>

      {/* Success Printable Receipt Modal */}
      <SuccessModal
        record={successRecord}
        onClose={() => setSuccessRecord(null)}
        dashboardConfig={dashboardConfig}
      />

      {/* Google Drive & Spreadsheet Integration Modal */}
      <GoogleSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onConfigSaved={refreshData}
      />

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-100/80 border-t border-emerald-900 mt-12 py-8 text-xs print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3 text-center md:text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Fakultas Keguruan dan Ilmu Pendidikan
                </h4>
                <p className="text-emerald-300 text-[11px]">Universitas Islam Jember (UIJ)</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-emerald-200">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Jl. Kyai Mojo No. 101, Kaliwates, Jember</span>
              </span>
              <span className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>(0331) 484394 / WhatsApp Panitia PPL</span>
              </span>
              <span className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>fkip@uij.ac.id</span>
              </span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-emerald-400">
            <p>© {new Date().getFullYear()} Panitia PPL FKIP UIJ. Hak Cipta Dilindungi.</p>
            <p>Sistem Pendaftaran Mandiri Tanpa Login • Sinkronisasi Otomatis Google Drive & Spreadsheet</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
