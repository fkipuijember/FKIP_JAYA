import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FolderPlus, 
  RefreshCw, 
  ExternalLink, 
  Check, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Search, 
  ShieldCheck, 
  Save, 
  ArrowUpRight,
  Database,
  CloudCheck,
  Filter
} from 'lucide-react';
import { RegistrationRecord, DashboardConfig, GoogleSyncConfig } from '../types';
import { 
  getGoogleSyncConfig, 
  saveGoogleSyncConfig, 
  syncToGoogleServices, 
  syncMultipleRegistrationsToGoogle,
  saveRegistration
} from '../utils/storage';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../utils/googleAppsScriptCode';

interface DriveSpreadsheetSyncMenuProps {
  records: RegistrationRecord[];
  dashboardConfig?: DashboardConfig;
  onRefresh: () => void;
  onOpenSyncModal: () => void;
}

export const DriveSpreadsheetSyncMenu: React.FC<DriveSpreadsheetSyncMenuProps> = ({
  records,
  dashboardConfig,
  onRefresh,
  onOpenSyncModal
}) => {
  const [config, setConfig] = useState<GoogleSyncConfig>(() => {
    const stored = getGoogleSyncConfig();
    return {
      webAppUrl: stored.webAppUrl || dashboardConfig?.googleWebAppUrl || '',
      spreadsheetUrl: stored.spreadsheetUrl || dashboardConfig?.googleSpreadsheetUrl || '',
      autoSync: stored.autoSync ?? dashboardConfig?.autoSyncGoogle ?? true
    };
  });

  const [copiedScript, setCopiedScript] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'failed'; message: string } | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Bulk sync states
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; student: string } | null>(null);

  // Single sync states
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSyncStatus, setFilterSyncStatus] = useState<'all' | 'synced' | 'unsynced'>('all');
  const [showCodePreview, setShowCodePreview] = useState(false);

  const syncedRecords = records.filter(
    (r) => r.syncedToGoogle && r.syncedToGoogle.status === 'success'
  );
  const unsyncedRecords = records.filter(
    (r) => !r.syncedToGoogle || r.syncedToGoogle.status !== 'success'
  );

  const targetWebhookUrl = (config.webAppUrl || dashboardConfig?.googleWebAppUrl || '').trim();
  const spreadsheetLink = (config.spreadsheetUrl || dashboardConfig?.googleSpreadsheetUrl || '').trim();

  // Filter table
  const filteredList = records.filter((rec) => {
    const isSynced = rec.syncedToGoogle && rec.syncedToGoogle.status === 'success';
    if (filterSyncStatus === 'synced' && !isSynced) return false;
    if (filterSyncStatus === 'unsynced' && isSynced) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.biodata.namaLengkap.toLowerCase().includes(q);
      const matchNim = rec.biodata.nim.toLowerCase().includes(q);
      const matchReg = rec.id.toLowerCase().includes(q);
      const matchProdi = rec.biodata.programStudi.toLowerCase().includes(q);
      return matchName || matchNim || matchReg || matchProdi;
    }
    return true;
  });

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveConfig = () => {
    setIsSavingConfig(true);
    try {
      saveGoogleSyncConfig(config);
      setSaveMessage('Konfigurasi berhasil disimpan dan disinkronkan ke seluruh sistem!');
      setTimeout(() => setSaveMessage(null), 3000);
      onRefresh();
    } catch (e: any) {
      alert('Gagal menyimpan: ' + e?.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.webAppUrl || !config.webAppUrl.startsWith('http')) {
      alert('Harap masukkan URL Google Apps Script Web App yang valid terlebih dahulu.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      await fetch(config.webAppUrl.trim(), { method: 'GET', mode: 'no-cors' });
      setTestResult({
        status: 'success',
        message: 'Endpoint Webhook Google Apps Script aktif dan siap menerima data pendaftaran!'
      });
    } catch (err: any) {
      setTestResult({
        status: 'failed',
        message: 'Tidak dapat menjangkau endpoint: ' + (err?.message || 'Periksa kembali URL Web App')
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSingleSync = async (record: RegistrationRecord) => {
    if (!targetWebhookUrl || !targetWebhookUrl.startsWith('http')) {
      alert('Masukkan dan simpan URL Google Apps Script Web App terlebih dahulu sebelum menyinkronkan data.');
      return;
    }

    setSyncingId(record.id);
    try {
      const res = await syncToGoogleServices(record, targetWebhookUrl);
      if (res.success) {
        record.syncedToGoogle = {
          status: 'success',
          driveFolderUrl: res.driveFolderUrl || record.syncedToGoogle?.driveFolderUrl,
          syncedAt: new Date().toISOString()
        };
        saveRegistration(record);
        alert(`Data ${record.biodata.namaLengkap} berhasil dicatat ke 1 Google Spreadsheet & Drive!`);
        onRefresh();
      } else {
        alert('Kendala sinkronisasi: ' + res.message);
      }
    } catch (e: any) {
      alert('Gagal menyinkronkan: ' + (e?.message || 'Koneksi terputus'));
    } finally {
      setSyncingId(null);
    }
  };

  const handleBulkSync = async (targetList: RegistrationRecord[], label: string) => {
    if (targetList.length === 0) {
      alert(`Tidak ada data pendaftar (${label}) untuk disinkronkan.`);
      return;
    }

    if (!targetWebhookUrl || !targetWebhookUrl.startsWith('http')) {
      alert('Harap isi dan simpan URL Web App Google Apps Script terlebih dahulu pada formulir pengaturan di bawah.');
      return;
    }

    if (!window.confirm(`Mulai sinkronisasi ${targetList.length} data pendaftar ke 1 Google Spreadsheet & Google Drive?`)) {
      return;
    }

    setIsBulkSyncing(true);
    setBulkProgress({ current: 0, total: targetList.length, student: 'Menyiapkan sinkronisasi...' });

    try {
      const { successCount, failCount } = await syncMultipleRegistrationsToGoogle(
        targetList,
        targetWebhookUrl,
        (current, total, student) => {
          setBulkProgress({ current, total, student });
        }
      );

      // Refresh records state
      for (const rec of targetList) {
        rec.syncedToGoogle = {
          status: 'success',
          syncedAt: new Date().toISOString(),
          driveFolderUrl: rec.syncedToGoogle?.driveFolderUrl
        };
        saveRegistration(rec);
      }

      alert(
        `Proses sinkronisasi selesai!\n` +
        `• Berhasil dicatat: ${successCount} pendaftar\n` +
        `• Gagal / kendala: ${failCount} pendaftar\n` +
        `Data sekarang telah terintegrasi di 1 Google Spreadsheet panitia.`
      );
      onRefresh();
    } catch (err: any) {
      alert('Kendala sinkronisasi massal: ' + (err?.message || 'Koneksi terputus'));
    } finally {
      setIsBulkSyncing(false);
      setBulkProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none flex items-center justify-end pr-6">
          <FileSpreadsheet className="w-56 h-56" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-700/80 text-emerald-200 text-xs font-semibold border border-emerald-600/50">
              <Database className="w-3.5 h-3.5" />
              <span>Integrasi Otomatis Google Workspace</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Sinkronisasi ke Google Drive & 1 Google Spreadsheet
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Seluruh pendaftaran mahasiswa FKIP UIJ otomatis dicatat ke dalam <strong>1 Google Spreadsheet panitia</strong> lengkap dengan tautan berkas pendukung di Google Drive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {spreadsheetLink && spreadsheetLink.startsWith('http') && (
              <a
                href={spreadsheetLink}
                target="_blank"
                rel="noreferrer"
                id="btn-open-sheet-top"
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Buka 1 Spreadsheet</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyScript}
              id="btn-copy-script-top"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-700/90 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm transition-colors border border-emerald-500/50 shadow-sm"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedScript ? 'Kode Disalin!' : 'Salin Kode Skrip'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Status Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pendaftar</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Database className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{records.length}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Tersimpan di Cloud Database</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Tersinkronisasi</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-2">{syncedRecords.length}</p>
          <span className="text-[11px] text-emerald-700 mt-1 block">Tercatat di 1 Spreadsheet</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Menunggu Sinkron</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-2">{unsyncedRecords.length}</p>
          <span className="text-[11px] text-amber-700 mt-1 block">Perlu dikirim ke Spreadsheet</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Webhook</span>
            <span className={`p-2 rounded-xl ${targetWebhookUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-3 truncate">
            {targetWebhookUrl ? (
              <span className="inline-flex items-center text-emerald-700 space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Terkoneksi (Aktif)</span>
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-700 space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Belum Terpasang</span>
              </span>
            )}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {config.autoSync ? 'Auto-Sync Aktif' : 'Auto-Sync Nonaktif'}
          </span>
        </div>
      </div>

      {/* Bulk Sync Progress Alert */}
      {bulkProgress && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 text-emerald-950 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 text-emerald-700 animate-spin flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">
                  Sedang Mengirim ke Google Spreadsheet: {bulkProgress.current} dari {bulkProgress.total} Data
                </h4>
                <p className="text-xs text-emerald-800">
                  Memproses: <span className="font-semibold">{bulkProgress.student}</span>
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-800 px-3 py-1 bg-emerald-200/80 rounded-full">
              {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
            </span>
          </div>

          <div className="w-full bg-emerald-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Controls & Fast Synchronization Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-emerald-700" />
              <span>Aksi Sinkronisasi Massal ke Spreadsheet</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kirim pendaftar sekaligus ke 1 Google Spreadsheet panitia dan buatkan folder berkas di Google Drive
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-sync-all-records"
              disabled={isBulkSyncing || records.length === 0}
              onClick={() => handleBulkSync(records, 'Semua')}
              className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                isBulkSyncing || records.length === 0
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isBulkSyncing ? 'animate-spin' : ''}`} />
              <span>{isBulkSyncing ? 'Menyinkronkan...' : `Sinkronkan Semua Data (${records.length})`}</span>
            </button>

            {unsyncedRecords.length > 0 && (
              <button
                type="button"
                id="btn-sync-unsynced-records"
                disabled={isBulkSyncing}
                onClick={() => handleBulkSync(unsyncedRecords, 'Belum Tersinkron')}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold transition-all shadow-sm"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Sinkronkan yang Belum Ada ({unsyncedRecords.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSyncModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-colors border border-slate-300"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Petunjuk Modal</span>
            </button>
          </div>
        </div>

        {/* Sync Settings Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
          {/* Webhook URL Input */}
          <div className="space-y-1.5">
            <label htmlFor="sync-cfg-webapp" className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
              <span>URL Google Apps Script Web App (Webhook)</span>
              {config.webAppUrl && (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center space-x-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="sync-cfg-webapp"
                value={config.webAppUrl}
                onChange={(e) => setConfig({ ...config, webAppUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !config.webAppUrl}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {isTesting ? 'Cek...' : 'Uji'}
              </button>
            </div>
            {testResult && (
              <div className={`p-2.5 rounded-xl text-xs font-medium ${
                testResult.status === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {testResult.message}
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Diperoleh setelah Deploy skrip sebagai Web App dengan akses <em>Anyone (Siapa saja)</em>.
            </p>
          </div>

          {/* Spreadsheet URL Input */}
          <div className="space-y-1.5">
            <label htmlFor="sync-cfg-sheet" className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
              <span>URL 1 Google Spreadsheet Panitia</span>
              {config.spreadsheetUrl && config.spreadsheetUrl.startsWith('http') && (
                <a
                  href={config.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 hover:underline font-bold inline-flex items-center space-x-1"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </label>
            <input
              type="text"
              id="sync-cfg-sheet"
              value={config.spreadsheetUrl || ''}
              onChange={(e) => setConfig({ ...config, spreadsheetUrl: e.target.value })}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
            />
            <p className="text-[11px] text-slate-500">
              Link Google Spreadsheet panitia agar tombol "Buka 1 Spreadsheet" dapat langsung diklik.
            </p>
          </div>
        </div>

        {/* Auto Sync Checkbox & Save Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center space-x-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex-1">
            <input
              type="checkbox"
              id="sync-cfg-autosync"
              checked={config.autoSync}
              onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
              className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="sync-cfg-autosync" className="text-xs font-semibold text-emerald-950 cursor-pointer">
              Aktifkan Sinkronisasi Otomatis: Setiap pendaftaran baru mahasiswa langsung dikirim ke Spreadsheet & Drive
            </label>
          </div>

          <div className="flex items-center space-x-2">
            {saveMessage && (
              <span className="text-xs font-bold text-emerald-700 animate-fade-in">
                {saveMessage}
              </span>
            )}
            <button
              type="button"
              id="btn-save-sync-config"
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingConfig ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guide Box (Panduan 1 Menit & Salin Kode) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 text-xs text-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5 text-emerald-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Panduan 1 Menit Menghubungkan Google Spreadsheet & Google Drive
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowCodePreview(!showCodePreview)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              {showCodePreview ? 'Sembunyikan Kode' : 'Lihat Pratinjau Kode'}
            </button>
            <button
              type="button"
              onClick={handleCopyScript}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'Tersalin' : 'Salin Skrip'}</span>
            </button>
          </div>
        </div>

        <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed font-medium">
          <li>Buka <strong>Google Spreadsheet</strong> baru (atau spreadsheet panitia yang sudah ada).</li>
          <li>Klik menu <strong>Ekstensi (Extensions)</strong> &rarr; <strong>Apps Script</strong>.</li>
          <li>Hapus seluruh kode bawaan, lalu tempelkan kode skrip lengkap (klik tombol <em>"Salin Skrip"</em> di atas).</li>
          <li>Klik <strong>Simpan</strong> (Ctrl+S / Cmd+S), lalu klik tombol biru <strong>Terapkan (Deploy)</strong> &rarr; <strong>Penerapan baru (New deployment)</strong>.</li>
          <li>Pada jenis penerapan, pilih <strong>Aplikasi Web (Web app)</strong>.</li>
          <li>
            <strong className="text-emerald-950">PENTING:</strong> Atur <em>"Jalankan sebagai"</em> = <strong>Saya (Akun Google panitia)</strong> dan <em>"Siapa yang memiliki akses"</em> = <strong className="text-emerald-800">Siapa saja (Anyone)</strong>.
          </li>
          <li>Klik <strong>Terapkan</strong> &rarr; Berikan izin otorisasi &rarr; Salin <strong>URL Aplikasi Web (akhiran <code>/exec</code>)</strong> dan tempel ke kolom di atas.</li>
        </ol>

        {showCodePreview && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] max-h-52 overflow-y-auto">
              <pre>{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Table: Individual Registration Sync Records */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftar Status Sinkronisasi Pendaftar
            </h3>
            <p className="text-xs text-slate-500">
              Periksa status pengiriman dan tautan Google Drive untuk setiap mahasiswa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setFilterSyncStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterSyncStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Semua ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterSyncStatus('synced')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterSyncStatus === 'synced' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Tersinkron ({syncedRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterSyncStatus('unsynced')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterSyncStatus === 'unsynced' ? 'bg-white text-amber-800 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Belum ({unsyncedRecords.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama / NIM..."
                className="pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3.5 text-center w-12">No.</th>
                <th className="py-3 px-3.5">Nama & NIM</th>
                <th className="py-3 px-3.5">Program Studi</th>
                <th className="py-3 px-3.5 text-center">Status Sinkron</th>
                <th className="py-3 px-3.5">Folder Google Drive</th>
                <th className="py-3 px-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data pendaftar yang sesuai kriteria pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((rec, idx) => {
                  const isSynced = rec.syncedToGoogle && rec.syncedToGoogle.status === 'success';
                  const isSyncingCurrent = syncingId === rec.id;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3.5 text-center font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{rec.biodata.namaLengkap}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{rec.biodata.nim} • {rec.id}</div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium">
                          {rec.biodata.programStudi}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {isSynced ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tersimpan di Sheet</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Belum Tersinkron</span>
                          </span>
                        )}
                        {rec.syncedToGoogle?.syncedAt && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(rec.syncedToGoogle.syncedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        {rec.syncedToGoogle?.driveFolderUrl ? (
                          <a
                            href={rec.syncedToGoogle.driveFolderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 hover:underline font-semibold text-xs"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                            <span>Buka Folder Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleSingleSync(rec)}
                          disabled={isSyncingCurrent || isBulkSyncing}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isSyncingCurrent
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs'
                          }`}
                          title="Sinkronkan data ini ke 1 Spreadsheet"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCurrent ? 'animate-spin text-emerald-700' : 'text-emerald-600'}`} />
                          <span>{isSyncingCurrent ? 'Proses...' : 'Sinkron'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
