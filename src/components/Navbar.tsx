import React from 'react';
import { GraduationCap, ShieldCheck, Database, FileText, CheckCircle2, Lock, LogOut } from 'lucide-react';
import { DashboardConfig } from '../types';

interface NavbarProps {
  activeTab: 'form' | 'admin';
  setActiveTab: (tab: 'form' | 'admin') => void;
  onOpenSyncModal: () => void;
  isDriveSyncConfigured: boolean;
  isAdminAuthenticated: boolean;
  onLogout: () => void;
  dashboardConfig?: DashboardConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSyncModal,
  isDriveSyncConfigured,
  isAdminAuthenticated,
  onLogout,
  dashboardConfig
}) => {
  const displayTahun = dashboardConfig?.tahunAkademik?.trim()
    ? (/^tahun/i.test(dashboardConfig.tahunAkademik.trim())
        ? dashboardConfig.tahunAkademik.trim()
        : `Tahun ${dashboardConfig.tahunAkademik.trim()}`)
    : 'Tahun 2025/2026';

  return (
    <header className="bg-emerald-900 text-white shadow-md border-b border-emerald-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Identity */}
          <div 
            id="brand-header"
            onClick={() => setActiveTab('form')}
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-inner border border-emerald-400/40">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white leading-tight">
                  PPL FKIP UIJ
                </h1>
                <span 
                  id="navbar-tahun-akademik"
                  className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-700 text-emerald-100 border border-emerald-600 tracking-wide"
                >
                  {displayTahun}
                </span>
              </div>
              <p className="text-xs text-emerald-200 font-medium">
                {dashboardConfig?.subjudul || 'Fakultas Keguruan dan Ilmu Pendidikan • Universitas Islam Jember'}
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Google Sync Status Pill */}
            <button
              id="btn-google-sync-status"
              onClick={onOpenSyncModal}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isDriveSyncConfigured
                  ? 'bg-emerald-800/80 border-emerald-600 text-emerald-100 hover:bg-emerald-800'
                  : 'bg-amber-900/40 border-amber-600/50 text-amber-200 hover:bg-amber-900/60'
              }`}
              title="Pengaturan Google Drive & Spreadsheet"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isDriveSyncConfigured ? 'Drive & Sheet Terhubung' : 'Atur Drive & Sheet'}</span>
              {isDriveSyncConfigured && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Tab Switches */}
            <div className="bg-emerald-950/60 p-1 rounded-xl border border-emerald-800 flex items-center space-x-1">
              <button
                id="tab-form-pendaftaran"
                onClick={() => setActiveTab('form')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'form'
                    ? 'bg-white text-emerald-950 shadow-sm font-semibold'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Formulir</span>
              </button>

              <button
                id="tab-admin-portal"
                onClick={() => setActiveTab('admin')}
                className={`relative flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-white text-emerald-950 shadow-sm font-semibold'
                    : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                }`}
              >
                {isAdminAuthenticated ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-emerald-300" />
                )}
                <span>Portal Panitia</span>
              </button>

              {isAdminAuthenticated && (
                <button
                  type="button"
                  id="btn-navbar-logout"
                  onClick={onLogout}
                  className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors ml-1"
                  title="Keluar dari Portal Panitia"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
