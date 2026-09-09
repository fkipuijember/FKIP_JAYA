import React, { useState, useRef } from 'react';
import { saveDashboardConfigToFirestore } from '../utils/firebase';
import { 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Settings, 
  LayoutDashboard, 
  Database, 
  FileSpreadsheet, 
  Info, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles,
  ExternalLink,
  FileText,
  Upload,
  Trash2,
  MessageCircle,
  Link2,
  Eye,
  Check,
  Image as ImageIcon,
  PenTool,
  UserCheck,
  Type,
  Download,
  Share2,
  Copy,
  Globe,
  UploadCloud,
  Cloud,
  Zap
} from 'lucide-react';
import { DashboardConfig, GoogleSyncConfig } from '../types';
import { 
  getDashboardConfig, 
  saveDashboardConfig, 
  DEFAULT_DASHBOARD_CONFIG, 
  getGoogleSyncConfig, 
  saveGoogleSyncConfig,
  exportDashboardConfigJson,
  importDashboardConfigJson
} from '../utils/storage';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../utils/googleAppsScriptCode';

interface SystemSettingsProps {
  onSaved: () => void;
}

type SectionTab = 'bukti' | 'dashboard' | 'google' | 'vercel' | 'all';

/**
 * Generates an official UIJ emblem as a crisp PNG Data URL
 */
function generateUijEmblemDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Outer green circle
  ctx.fillStyle = '#065f46'; // emerald-800
  ctx.beginPath();
  ctx.arc(80, 80, 76, 0, Math.PI * 2);
  ctx.fill();

  // Gold ring border
  ctx.strokeStyle = '#fbbf24'; // amber-400
  ctx.lineWidth = 6;
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(80, 80, 68, 0, Math.PI * 2);
  ctx.stroke();

  // Center emblem text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UIJ', 80, 64);

  // Subtext FKIP
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('FKIP', 80, 98);

  // Decorative stars
  ctx.fillStyle = '#fbbf24';
  ctx.font = '13px sans-serif';
  ctx.fillText('★ ★ ★', 80, 122);

  return canvas.toDataURL('image/png');
}

/**
 * Generates an elegant sample digital signature as a transparent PNG Data URL
 */
function generateSampleTtdDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, 240, 100);

  // Draw smooth signature curves with dark blue ink
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Initial flourish loop
  ctx.moveTo(30, 60);
  ctx.bezierCurveTo(40, 20, 55, 15, 65, 45);
  ctx.bezierCurveTo(70, 65, 78, 75, 90, 35);
  ctx.bezierCurveTo(100, 15, 110, 25, 120, 55);
  // Swirling letters
  ctx.bezierCurveTo(130, 70, 140, 48, 150, 55);
  ctx.bezierCurveTo(160, 62, 170, 45, 180, 50);
  // Long underline flourish
  ctx.moveTo(35, 75);
  ctx.bezierCurveTo(90, 70, 160, 72, 215, 65);
  ctx.moveTo(175, 72);
  ctx.bezierCurveTo(190, 70, 205, 78, 220, 74);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ onSaved }) => {
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() => getDashboardConfig());
  const [googleConfig, setGoogleConfig] = useState<GoogleSyncConfig>(() => getGoogleSyncConfig());
  const [activeSection, setActiveSection] = useState<SectionTab>('bukti');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [testingUrl, setTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'failed'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ttdInputRef = useRef<HTMLInputElement>(null);

  const handleCopyGoogleScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleTestGoogleWebhook = async () => {
    if (!googleConfig.webAppUrl || !googleConfig.webAppUrl.startsWith('http')) {
      alert('Masukkan URL Web App Google Apps Script yang valid terlebih dahulu.');
      return;
    }
    setTestingUrl(true);
    setTestResult(null);
    try {
      await fetch(googleConfig.webAppUrl.trim(), { method: 'GET', mode: 'no-cors' });
      setTestResult({
        status: 'success',
        message: 'Endpoint Webhook Google Apps Script aktif dan dapat menerima pendaftaran!'
      });
    } catch (e: any) {
      setTestResult({
        status: 'failed',
        message: 'Tidak dapat menghubungi endpoint: ' + (e?.message || 'Periksa kembali URL Web App Anda')
      });
    } finally {
      setTestingUrl(false);
    }
  };

  const handleSave = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    setIsSaving(true);

    try {
      // Synchronize google config directly into DashboardConfig for cloud multi-device persistence
      const mergedDashboard: DashboardConfig = {
        ...dashboardConfig,
        googleWebAppUrl: googleConfig.webAppUrl,
        googleSpreadsheetUrl: googleConfig.spreadsheetUrl,
        autoSyncGoogle: googleConfig.autoSync
      };

      setDashboardConfig(mergedDashboard);
      saveDashboardConfig(mergedDashboard);
      saveGoogleSyncConfig(googleConfig);

      // Trigger app-level refresh
      onSaved();

      // Show success feedback
      setIsSavedNotice(true);
      setTimeout(() => {
        setIsSaving(false);
      }, 500);

      setTimeout(() => {
        setIsSavedNotice(false);
      }, 5000);
    } catch (err: any) {
      setIsSaving(false);
      alert('Gagal menyimpan pengaturan: ' + (err?.message || 'Terjadi kesalahan'));
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan seluruh teks biodata, informasi dashboard, dan bukti pendaftaran ke pengaturan standar FKIP UIJ?')) {
      setDashboardConfig(DEFAULT_DASHBOARD_CONFIG);
      saveDashboardConfig(DEFAULT_DASHBOARD_CONFIG);
      setIsSavedNotice(true);
      onSaved();
      setTimeout(() => {
        setIsSavedNotice(false);
      }, 5000);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap unggah file gambar (PNG, JPG, WebP, atau SVG).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file logo terlalu besar. Harap gunakan gambar berukuran di bawah 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setDashboardConfig((prev) => ({ ...prev, logoTemplateUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setDashboardConfig((prev) => ({ ...prev, logoTemplateUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUsePresetLogo = () => {
    const emblem = generateUijEmblemDataUrl();
    if (emblem) {
      setDashboardConfig((prev) => ({ ...prev, logoTemplateUrl: emblem }));
    }
  };

  const handleTestWaLink = () => {
    if (!dashboardConfig.linkWaGrup || !dashboardConfig.linkWaGrup.trim()) {
      alert('Harap masukkan tautan Link WhatsApp Grup terlebih dahulu.');
      return;
    }
    let url = dashboardConfig.linkWaGrup.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  };

  const handleTtdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap unggah file gambar tanda tangan (PNG, JPG, WebP, atau SVG).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file tanda tangan terlalu besar. Harap gunakan gambar di bawah 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setDashboardConfig((prev) => ({ ...prev, ttdPanitiaUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTtd = () => {
    setDashboardConfig((prev) => ({ ...prev, ttdPanitiaUrl: '' }));
    if (ttdInputRef.current) {
      ttdInputRef.current.value = '';
    }
  };

  const handleUsePresetTtd = () => {
    const sample = generateSampleTtdDataUrl();
    if (sample) {
      setDashboardConfig((prev) => ({ ...prev, ttdPanitiaUrl: sample }));
    }
  };

  // Vercel & Cross-browser sync handlers
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [cloudPushSuccess, setCloudPushSuccess] = useState(false);

  const handlePushToFirebase = async () => {
    setIsPushingCloud(true);
    const success = await saveDashboardConfigToFirestore(dashboardConfig);
    setIsPushingCloud(false);
    if (success) {
      setCloudPushSuccess(true);
      setTimeout(() => setCloudPushSuccess(false), 4000);
    } else {
      alert('Gagal menyinkronkan ke Firebase. Periksa koneksi internet.');
    }
  };

  const handleDownloadAppConfigJson = () => {
    const jsonStr = exportDashboardConfigJson(dashboardConfig);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyShareableUrl = () => {
    try {
      const jsonStr = JSON.stringify(dashboardConfig);
      const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
      const url = `${window.location.origin}${window.location.pathname}#config=${encodeURIComponent(base64)}`;
      navigator.clipboard.writeText(url);
      setCopyFeedback('url');
      setTimeout(() => setCopyFeedback(null), 3500);
    } catch (e: any) {
      alert('Gagal menyalin tautan: ' + e?.message);
    }
  };

  const handleCopyJson = () => {
    const jsonStr = exportDashboardConfigJson(dashboardConfig);
    navigator.clipboard.writeText(jsonStr);
    setCopyFeedback('json');
    setTimeout(() => setCopyFeedback(null), 3500);
  };

  const handleApplyImportedJson = () => {
    if (!importJsonText.trim()) {
      setImportError('Harap tempelkan teks konfigurasi JSON.');
      return;
    }
    const imported = importDashboardConfigJson(importJsonText.trim());
    if (imported) {
      setDashboardConfig(imported);
      setImportError(null);
      setImportJsonText('');
      setIsSavedNotice(true);
      onSaved();
      setTimeout(() => setIsSavedNotice(false), 4000);
    } else {
      setImportError('Format JSON tidak valid atau struktur tidak sesuai.');
    }
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const imported = importDashboardConfigJson(content);
      if (imported) {
        setDashboardConfig(imported);
        setImportError(null);
        setIsSavedNotice(true);
        onSaved();
        setTimeout(() => setIsSavedNotice(false), 4000);
      } else {
        setImportError('File JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 relative">
      {/* Floating Success Toast Notification */}
      {isSavedNotice && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-emerald-800 text-white p-4 rounded-2xl shadow-2xl border border-emerald-600 flex items-center space-x-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Pengaturan Berhasil Disimpan!</p>
            <p className="text-xs text-emerald-100">Template logo, link WA grup, dan informasi sistem telah diperbarui.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsSavedNotice(false)}
            className="text-emerald-200 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Success Alert */}
      {isSavedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Pengaturan bukti pendaftaran, template logo, WA grup, dan sistem berhasil disimpan!</span>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-md">
            Tersimpan
          </span>
        </div>
      )}

      {/* Sub-menu Navigation Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSection('bukti')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all ${
              activeSection === 'bukti'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Bukti Pendaftaran & WA Grup</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold uppercase tracking-wider ${
              activeSection === 'bukti' ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Baru
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeSection === 'dashboard'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Teks & Formulir Depan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('google')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeSection === 'google'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Google Drive & Spreadsheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('vercel')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all ${
              activeSection === 'vercel'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Sinkronisasi Vercel</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold uppercase tracking-wider ${
              activeSection === 'vercel' ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Multi-Device
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
              activeSection === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span>Semua Menu</span>
          </button>
        </div>

        {/* Quick Save Header Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      <form onSubmit={handleSave} noValidate className="space-y-6">
        {/* ========================================================================= */}
        {/* MENU 1: PENGATURAN BUKTI PENDAFTARAN (TEMPLATE LOGO & LINK WA GRUP PPL)    */}
        {/* ========================================================================= */}
        {(activeSection === 'bukti' || activeSection === 'all') && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-emerald-500/40 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Menu Edit Bukti Pendaftaran (Kartu PPL)
                    </h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atur judul bukti pendaftaran, template logo resmi, tautan WhatsApp Grup PPL, dan tanda tangan panitia
                  </p>
                </div>
              </div>
            </div>

            {/* SUB-MENU A: JUDUL & SUBJUDUL BUKTI PENDAFTARAN */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
                      Judul & Subjudul Bukti Pendaftaran
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Ubah teks judul utama dan subjudul kegiatan yang tercetak pada kartu bukti pendaftaran serta lembar PDF
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDashboardConfig(prev => ({
                    ...prev,
                    judulBuktiPendaftaran: 'TANDA BUKTI PENDAFTARAN RESMI',
                    subjudulBuktiPendaftaran: 'PRAKTIK PENGALAMAN LAPANGAN (PPL)'
                  }))}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1 transition-colors"
                  title="Kembalikan ke judul standar PPL"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Judul Standar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Judul Utama Bukti */}
                <div className="space-y-1.5">
                  <label htmlFor="cfg-judul-bukti" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Judul Utama Bukti Pendaftaran
                  </label>
                  <input
                    type="text"
                    id="cfg-judul-bukti"
                    value={dashboardConfig.judulBuktiPendaftaran || ''}
                    onChange={(e) => setDashboardConfig({ ...dashboardConfig, judulBuktiPendaftaran: e.target.value })}
                    placeholder="Contoh: TANDA BUKTI PENDAFTARAN RESMI"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-semibold"
                  />
                  <p className="text-[11px] text-slate-500">
                    Teks judul kartu tanda bukti (layar pendaftar dan heading dokumen PDF).
                  </p>
                </div>

                {/* Subjudul Bukti */}
                <div className="space-y-1.5">
                  <label htmlFor="cfg-subjudul-bukti" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Subjudul / Keterangan Kegiatan
                  </label>
                  <input
                    type="text"
                    id="cfg-subjudul-bukti"
                    value={dashboardConfig.subjudulBuktiPendaftaran || ''}
                    onChange={(e) => setDashboardConfig({ ...dashboardConfig, subjudulBuktiPendaftaran: e.target.value })}
                    placeholder="Contoh: PRAKTIK PENGALAMAN LAPANGAN (PPL)"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <p className="text-[11px] text-slate-500">
                    Sub-heading keterangan program/kegiatan di bawah judul utama.
                  </p>
                </div>
              </div>
            </div>

            {/* SUB-MENU B: TEMPLATE LOGO BUKTI PENDAFTARAN */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <span>Template Logo Bukti Pendaftaran</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Logo akan otomatis tampil pada kop surat bukti pendaftaran (layar mahasiswa) dan tercetak di lembar PDF resmi
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleUsePresetLogo}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1 transition-colors"
                    title="Gunakan lambang resmi UIJ"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gunakan Logo Standar UIJ</span>
                  </button>

                  {dashboardConfig.logoTemplateUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-semibold flex items-center space-x-1 transition-colors"
                      title="Hapus logo kustom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Logo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Dropzone & Live Thumbnail */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Visual Logo Preview */}
                <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Pratinjau Logo Aktif
                  </span>
                  <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                    {dashboardConfig.logoTemplateUrl ? (
                      <img
                        src={dashboardConfig.logoTemplateUrl}
                        alt="Logo Bukti Pendaftaran"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-800 flex items-center justify-center text-white font-black text-xl shadow-xs border border-emerald-700">
                        UIJ
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium mt-2">
                    {dashboardConfig.logoTemplateUrl ? 'Logo Kustom Terpasang' : 'Logo Default UIJ (Badge)'}
                  </span>
                </div>

                {/* Upload Action Area */}
                <div className="md:col-span-2 space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 rounded-xl p-5 text-center cursor-pointer transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="upload-logo-template-input"
                    />
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Klik untuk Pilih / Unggah Template Logo
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Mendukung format PNG, JPG, WebP, atau SVG transparan (Maks. 3MB)
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    💡 <strong>Tips Panitia:</strong> Disarankan menggunakan file PNG dengan latar transparan agar kop surat tanda bukti pendaftaran di layar mahasiswa dan berkas PDF terlihat rapi dan proporsional.
                  </p>
                </div>
              </div>
            </div>

            {/* SUB-MENU B: LINK WA GRUP PPL */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <label htmlFor="cfg-link-wa-grup" className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
                      Link WhatsApp Grup PPL
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Tautan undangan grup WhatsApp agar mahasiswa terhubung langsung setelah registrasi
                    </span>
                  </div>
                </div>

                {dashboardConfig.linkWaGrup && (
                  <button
                    type="button"
                    onClick={handleTestWaLink}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                  >
                    <span>Uji Buka Link WA</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Input Link WA Grup */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="cfg-link-wa-grup" className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1">
                    <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tautan Undangan Grup WhatsApp (Link WA Grup PPL)</span>
                  </label>
                  <input
                    type="url"
                    id="cfg-link-wa-grup"
                    value={dashboardConfig.linkWaGrup || ''}
                    onChange={(e) => setDashboardConfig({ ...dashboardConfig, linkWaGrup: e.target.value })}
                    placeholder="https://chat.whatsapp.com/invite/..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    Contoh: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">https://chat.whatsapp.com/invite/xxxxxx</code>
                  </p>
                </div>

                {/* Nama Grup WA */}
                <div className="space-y-1.5">
                  <label htmlFor="cfg-nama-wa-grup" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Nama / Judul Grup WhatsApp
                  </label>
                  <input
                    type="text"
                    id="cfg-nama-wa-grup"
                    value={dashboardConfig.namaWaGrup || ''}
                    onChange={(e) => setDashboardConfig({ ...dashboardConfig, namaWaGrup: e.target.value })}
                    placeholder="Contoh: Grup WhatsApp Resmi Peserta PPL FKIP UIJ"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Status Tautan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Status Integrasi WA Grup
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {dashboardConfig.linkWaGrup ? 'Tautan Aktif & Siap Digunakan' : 'Belum Ada Tautan WA'}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${dashboardConfig.linkWaGrup ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  </div>
                </div>

                {/* Pesan Ajakan Masuk Grup */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="cfg-pesan-wa-grup" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Pesan Ajakan / Instruksi Masuk Grup (Ditampilkan ke Mahasiswa)
                  </label>
                  <textarea
                    id="cfg-pesan-wa-grup"
                    rows={2}
                    value={dashboardConfig.pesanWaGrup || ''}
                    onChange={(e) => setDashboardConfig({ ...dashboardConfig, pesanWaGrup: e.target.value })}
                    placeholder="Tuliskan instruksi atau alasan penting mahasiswa wajib bergabung ke grup WA..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* SUB-MENU C: NAMA PANITIA, NIDN/NIY, DAN UPLOAD TTD PANITIA PPL */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
                      Nama Panitia, NIDN/NIY & Upload TTD Panitia PPL
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Identitas panitia pelaksana dan tanda tangan resmi pada tanda bukti pendaftaran & berkas cetak PDF
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleUsePresetTtd}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center space-x-1 transition-colors"
                    title="Buat contoh tanda tangan digital otomatis"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Contoh TTD Digital</span>
                  </button>

                  {dashboardConfig.ttdPanitiaUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveTtd}
                      className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-semibold flex items-center space-x-1 transition-colors"
                      title="Hapus tanda tangan panitia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus TTD</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Form Input Data Panitia */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Nama Panitia PPL */}
                <div className="space-y-1.5">
                  <label htmlFor="cfg-nama-panitia" className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Nama Panitia PPL (beserta Gelar)</span>
                  </label>
                  <input
                    type="text"
                    id="cfg-nama-panitia"
                    value={dashboardConfig.namaPanitiaPpl || ''}
                    onChange={(e) => setDashboardConfig({ ...dashboardConfig, namaPanitiaPpl: e.target.value })}
                    placeholder="Contoh: H. Moh. Hasan, M.Pd.I"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <p className="text-[11px] text-slate-500">Nama resmi yang tercetak di atas garis penandatangan.</p>
                </div>

                {/* NIDN / NIY Panitia */}
                <div className="space-y-1.5">
                  <label htmlFor="cfg-nidn-panitia" className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1">
                    <span className="font-mono text-emerald-700 font-extrabold text-[11px]">#</span>
                    <span>NIDN / NIY Panitia</span>
                  </label>
                  <input
                    type="text"
                    id="cfg-nidn-panitia"
                    value={dashboardConfig.nidnPanitiaPpl || ''}
                    onChange={(e) => setDashboardConfig({ ...dashboardConfig, nidnPanitiaPpl: e.target.value })}
                    placeholder="Contoh: 0715088201 / 19820815..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                  />
                  <p className="text-[11px] text-slate-500">Nomor Induk Dosen Nasional atau Nomor Induk Yayasan.</p>
                </div>

                {/* Jabatan Panitia */}
                <div className="space-y-1.5">
                  <label htmlFor="cfg-jabatan-panitia" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Jabatan Panitia PPL
                  </label>
                  <input
                    type="text"
                    id="cfg-jabatan-panitia"
                    value={dashboardConfig.jabatanPanitiaPpl || ''}
                    onChange={(e) => setDashboardConfig({ ...dashboardConfig, jabatanPanitiaPpl: e.target.value })}
                    placeholder="Contoh: Ketua Panitia PPL FKIP UIJ"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <p className="text-[11px] text-slate-500">Posisi/Jabatan struktural panitia pelaksana.</p>
                </div>
              </div>

              {/* Upload Dropzone & Live TTD Thumbnail */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
                {/* Visual TTD Preview */}
                <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Pratinjau Tanda Tangan (TTD)
                  </span>
                  <div className="w-full h-24 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                    {dashboardConfig.ttdPanitiaUrl ? (
                      <img
                        src={dashboardConfig.ttdPanitiaUrl}
                        alt="Tanda Tangan Panitia"
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <PenTool className="w-6 h-6 mb-1 opacity-50" />
                        <span className="text-[11px] font-medium italic">Belum Ada TTD</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium mt-2">
                    {dashboardConfig.ttdPanitiaUrl ? 'TTD Siap Digunakan' : 'Menggunakan Stempel Terverifikasi'}
                  </span>
                </div>

                {/* Upload Action Area */}
                <div className="md:col-span-2 space-y-3">
                  <div
                    onClick={() => ttdInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 rounded-xl p-4 text-center cursor-pointer transition-colors"
                  >
                    <input
                      ref={ttdInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleTtdUpload}
                      className="hidden"
                      id="upload-ttd-panitia-input"
                    />
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-1.5">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Klik untuk Unggah Gambar Tanda Tangan (TTD) Panitia
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Format PNG berlatar belakang transparan sangat dianjurkan (Maks. 3MB)
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    💡 <strong>Tips Panitia:</strong> Jika tanda tangan diunggah, berkas bukti pendaftaran dan dokumen PDF otomatis memuat tanda tangan asli panitia. Jika dikosongkan, sistem secara otomatis menampilkan stempel digital resmi terverifikasi.
                  </p>
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW BANNER: BAGAIMANA TAMPIL DI KARTU BUKTI & PDF */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau Tampilan Kop Surat, Banner WA & TTD Pada Bukti Pendaftaran</span>
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium">
                  Live Preview Mahasiswa & PDF
                </span>
              </div>

              {/* Mock Bukti Card */}
              <div className="bg-white text-slate-900 p-4 rounded-xl shadow-md border border-slate-200 space-y-3">
                {/* Mock Kop Surat */}
                <div className="flex items-center justify-center space-x-3 pb-3 border-b-2 border-slate-900 text-center sm:text-left">
                  {dashboardConfig.logoTemplateUrl ? (
                    <img
                      src={dashboardConfig.logoTemplateUrl}
                      alt="Logo"
                      className="w-12 h-12 object-contain flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-emerald-800 text-white font-black flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                      UIJ
                    </div>
                  )}
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Universitas Islam Jember
                    </h5>
                    <h4 className="text-xs sm:text-sm font-black text-emerald-900 uppercase">
                      Fakultas Keguruan dan Ilmu Pendidikan
                    </h4>
                    <p className="text-[9px] text-slate-500">
                      {dashboardConfig.lokasiKampus || 'Jl. Kyai Mojo No. 101, Kaliwates, Jember'}
                    </p>
                  </div>
                </div>

                {/* Mock Judul Bukti Pendaftaran */}
                <div className="text-center py-0.5">
                  <div className="inline-block bg-slate-100 border border-slate-300 px-3.5 py-1 rounded-md">
                    <span className="font-bold text-xs text-slate-900 tracking-wide uppercase block">
                      {dashboardConfig.judulBuktiPendaftaran?.trim() || `Tanda Bukti Pendaftaran PPL (${dashboardConfig.tahunAkademik || 'Tahun 2025/2026'})`}
                    </span>
                    {dashboardConfig.subjudulBuktiPendaftaran && (
                      <span className="text-[10px] font-semibold text-emerald-800 tracking-wide uppercase block mt-0.5">
                        {dashboardConfig.subjudulBuktiPendaftaran}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mock WA Banner */}
                {dashboardConfig.linkWaGrup && (
                  <div className="bg-gradient-to-r from-emerald-700 to-green-700 text-white p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center space-x-2 text-center sm:text-left">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-900/80 px-1.5 py-0.5 rounded text-emerald-200">
                          Wajib Peserta
                        </span>
                        <h6 className="font-bold text-xs">
                          {dashboardConfig.namaWaGrup || 'Grup WhatsApp Resmi Peserta PPL FKIP UIJ'}
                        </h6>
                        <p className="text-[10px] text-emerald-100 line-clamp-1">
                          {dashboardConfig.pesanWaGrup || 'Wajib bergabung untuk pengumuman pembekalan & DPL.'}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-white text-emerald-900 font-bold text-[11px] rounded-lg shadow-2xs whitespace-nowrap">
                      Gabung WA Grup
                    </span>
                  </div>
                )}

                {/* Mock Signature Preview Block */}
                <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-xs">
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-500 font-medium">Mahasiswa Pendaftar,</p>
                    <div className="h-12 flex items-center justify-center">
                      <span className="text-[10px] text-slate-400 italic">Tertanda Resmi</span>
                    </div>
                    <p className="font-bold underline text-slate-900 text-xs">Ahmad Fajar Shodiq</p>
                    <p className="text-slate-500 text-[10px] font-mono">NIM: 2021110012</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Jember, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[11px] font-medium text-slate-700">
                      {dashboardConfig.jabatanPanitiaPpl || 'Panitia PPL FKIP UIJ'},
                    </p>
                    <div className="h-12 flex items-center justify-center">
                      {dashboardConfig.ttdPanitiaUrl ? (
                        <img
                          src={dashboardConfig.ttdPanitiaUrl}
                          alt="TTD Panitia"
                          className="h-11 max-w-[120px] object-contain drop-shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
                          ✓ Terverifikasi Sistem
                        </span>
                      )}
                    </div>
                    <p className="font-bold underline text-slate-900 text-xs">
                      {dashboardConfig.namaPanitiaPpl || '( Panitia PPL FKIP )'}
                    </p>
                    <p className="text-slate-500 text-[10px] font-mono">
                      {dashboardConfig.nidnPanitiaPpl ? `NIDN/NIY: ${dashboardConfig.nidnPanitiaPpl}` : 'NIDN / Panitia Pelaksana'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MENU 2: PENGATURAN TEKS & BIODATA DASHBOARD HALAMAN AWAL                  */}
        {/* ========================================================================= */}
        {(activeSection === 'dashboard' || activeSection === 'all') && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pengaturan Biodata & Teks Dashboard Halaman Awal
                </h3>
                <p className="text-xs text-slate-500">
                  Ubah informasi judul formulir, tahun akademik, petunjuk pengisian, pasfoto, dan kontak helpdesk
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Judul Kegiatan */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="cfg-judul" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Judul Formulir / Kegiatan PPL
                </label>
                <input
                  type="text"
                  id="cfg-judul"
                  value={dashboardConfig.judulKegiatan}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, judulKegiatan: e.target.value })}
                  placeholder="Contoh: Formulir Pendaftaran PPL FKIP UIJ"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Subjudul / Fakultas */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="cfg-subjudul" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Subjudul / Identitas Lembaga
                </label>
                <input
                  type="text"
                  id="cfg-subjudul"
                  value={dashboardConfig.subjudul}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, subjudul: e.target.value })}
                  placeholder="Contoh: Fakultas Keguruan dan Ilmu Pendidikan - Universitas Islam Jember"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Tahun Akademik */}
              <div className="space-y-1.5">
                <label htmlFor="cfg-tahun" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Tahun Akademik
                </label>
                <input
                  type="text"
                  id="cfg-tahun"
                  value={dashboardConfig.tahunAkademik}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, tahunAkademik: e.target.value })}
                  placeholder="Contoh: Tahun Akademik 2025/2026"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Periode / Gelombang Pendaftaran */}
              <div className="space-y-1.5">
                <label htmlFor="cfg-periode" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Periode / Status Gelombang
                </label>
                <input
                  type="text"
                  id="cfg-periode"
                  value={dashboardConfig.periodePendaftaran}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, periodePendaftaran: e.target.value })}
                  placeholder="Contoh: Gelombang I (Pendaftaran Dibuka)"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Petunjuk Umum */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="cfg-petunjuk" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Petunjuk / Deskripsi Pengisian Mahasiswa
                </label>
                <textarea
                  id="cfg-petunjuk"
                  rows={3}
                  value={dashboardConfig.petunjukUmum}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, petunjukUmum: e.target.value })}
                  placeholder="Tuliskan petunjuk umum untuk mahasiswa yang mengakses halaman formulir..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 leading-relaxed"
                />
              </div>

              {/* Ketentuan Pasfoto */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="cfg-foto" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Ketentuan Khusus Pasfoto (3x4 Jas Almamater)
                </label>
                <input
                  type="text"
                  id="cfg-foto"
                  value={dashboardConfig.catatanFoto}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, catatanFoto: e.target.value })}
                  placeholder="Contoh: Foto terbaru ukuran 3x4 berlatar belakang MERAH dan wajib memakai Jas Almamater UIJ."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Informasi Rekening Pembayaran */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="cfg-rekening" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Informasi Rekening / Biaya Pendaftaran PPL
                </label>
                <input
                  type="text"
                  id="cfg-rekening"
                  value={dashboardConfig.rekeningPembayaran}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, rekeningPembayaran: e.target.value })}
                  placeholder="Contoh: Bank Jatim No Rek 0031002931 a.n. FKIP UIJ"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Nomor WhatsApp Helpdesk */}
              <div className="space-y-1.5">
                <label htmlFor="cfg-wa" className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>No. WhatsApp Helpdesk Panitia</span>
                </label>
                <input
                  type="text"
                  id="cfg-wa"
                  value={dashboardConfig.nomorWaPanitia}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, nomorWaPanitia: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                />
              </div>

              {/* Email Panitia */}
              <div className="space-y-1.5">
                <label htmlFor="cfg-email" className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Email Panitia PPL</span>
                </label>
                <input
                  type="text"
                  id="cfg-email"
                  value={dashboardConfig.emailPanitia}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, emailPanitia: e.target.value })}
                  placeholder="fkip@uij.ac.id"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Lokasi Kampus */}
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="cfg-lokasi" className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Alamat / Lokasi Sekretariat PPL</span>
                </label>
                <input
                  type="text"
                  id="cfg-lokasi"
                  value={dashboardConfig.lokasiKampus}
                  onChange={(e) => setDashboardConfig({ ...dashboardConfig, lokasiKampus: e.target.value })}
                  placeholder="Kampus UIJ, Jl. Kyai Mojo No. 101, Kaliwates, Jember"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MENU 3: PENGATURAN GOOGLE DRIVE & 1 SPREADSHEET                           */}
        {/* ========================================================================= */}
        {(activeSection === 'google' || activeSection === 'all') && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Integrasi 1 Google Spreadsheet & Google Drive
                  </h3>
                  <p className="text-xs text-slate-500">
                    Setiap pendaftaran baru otomatis tersimpan rapi dalam 1 Google Spreadsheet panitia
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyGoogleScript}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {copiedScript ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? 'Kode Berhasil Disalin!' : 'Salin Kode Google Apps Script'}</span>
              </button>
            </div>

            {/* Quick deployment instructions box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-700">
              <p className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Panduan 1 Menit Menghubungkan Google Spreadsheet:</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
                <li>Buka Google Spreadsheet baru (atau spreadsheet panitia yang sudah ada).</li>
                <li>Klik menu <strong>Ekstensi (Extensions)</strong> &rarr; <strong>Apps Script</strong>.</li>
                <li>Hapus kode bawaan, lalu tempel kode skrip (klik tombol <em>"Salin Kode Google Apps Script"</em> di atas).</li>
                <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> &rarr; <strong>Penerapan baru (New deployment)</strong> &rarr; Pilih jenis <strong>Aplikasi Web (Web app)</strong>.</li>
                <li>PENTING: Atur <em>"Siapa yang memiliki akses (Who has access)"</em> ke <strong>"Siapa saja (Anyone)"</strong> &rarr; Klik <strong>Terapkan</strong>.</li>
                <li>Salin URL Aplikasi Web (akhiran <code>/exec</code>) lalu tempel pada isian di bawah ini.</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cfg-webapp" className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
                  <span>URL Google Apps Script Web App (Webhook)</span>
                  {googleConfig.webAppUrl && (
                    <button
                      type="button"
                      onClick={handleTestGoogleWebhook}
                      disabled={testingUrl}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center space-x-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{testingUrl ? 'Menguji...' : 'Uji Koneksi Webhook'}</span>
                    </button>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="cfg-webapp"
                    value={googleConfig.webAppUrl}
                    onChange={(e) => setGoogleConfig({ ...googleConfig, webAppUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestGoogleWebhook}
                    disabled={testingUrl || !googleConfig.webAppUrl}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex-shrink-0 disabled:opacity-50"
                  >
                    {testingUrl ? 'Memeriksa...' : 'Cek Status'}
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
                  URL Web App hasil penerapan skrip Apps Script panitia. Semua pendaftar baru akan otomatis dicatat ke sheet ini.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cfg-sheeturl" className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
                  <span>URL Tautan 1 Google Spreadsheet PPL</span>
                  {googleConfig.spreadsheetUrl && googleConfig.spreadsheetUrl.startsWith('http') && (
                    <a 
                      href={googleConfig.spreadsheetUrl}
                      target="_blank" 
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline inline-flex items-center space-x-1 font-semibold"
                    >
                      <span>Buka Spreadsheet di Tab Baru</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  id="cfg-sheeturl"
                  value={googleConfig.spreadsheetUrl || ''}
                  onChange={(e) => setGoogleConfig({ ...googleConfig, spreadsheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <input
                  type="checkbox"
                  id="cfg-autosync-google"
                  checked={googleConfig.autoSync ?? true}
                  onChange={(e) => setGoogleConfig({ ...googleConfig, autoSync: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="cfg-autosync-google" className="text-xs font-semibold text-emerald-950 cursor-pointer">
                  Aktifkan sinkronisasi otomatis: Setiap pendaftaran baru langsung dikirim ke Google Spreadsheet & Google Drive
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MENU 4: SINKRONISASI VERCEL & MULTI-DEVICE (AGAR TIDAK KEMBALI KE AWAL)   */}
        {/* ========================================================================= */}
        {(activeSection === 'vercel' || activeSection === 'all') && (
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sinkronisasi Vercel & Pengaturan Antar Perangkat
                  </h3>
                  <p className="text-xs text-slate-500">
                    Solusi agar setelan tidak kembali ke awal saat dibuka di HP atau browser lain
                  </p>
                </div>
              </div>
            </div>

            {/* Kotak Informasi Masalah & Solusi */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-2">
              <p className="font-bold flex items-center space-x-1.5 text-amber-950">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Mengapa di Vercel pengaturannya kembali ke awal saat dibuka di browser/HP lain?</span>
              </p>
              <p className="text-amber-800/90 leading-relaxed text-xs">
                Secara *default*, perubahan yang disimpan di dashboard admin disimpan di memori browser lokal (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">localStorage</code>) perangkat yang sedang digunakan. Saat Anda membuka link Vercel di browser lain, HP, atau mode incognito, browser baru tersebut belum memiliki data <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">localStorage</code> sehingga menggunakan setelan bawaan.
              </p>
              <p className="text-amber-800/90 leading-relaxed text-xs font-semibold">
                Gunakan salah satu dari opsi di bawah agar setelan Anda tersinkronisasi dan tampil permanen untuk semua orang:
              </p>
            </div>

            
            {/* KARTU STATUS DATABASE CLOUD FIREBASE */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-5 rounded-2xl shadow-md space-y-3 border border-emerald-600/50">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-emerald-200 uppercase tracking-wide">
                      Cloud Firestore Real-Time Aktif
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white flex items-center space-x-2">
                    <Cloud className="w-5 h-5 text-emerald-300" />
                    <span>Sinkronisasi Database Cloud Otomatis</span>
                  </h4>
                  <p className="text-xs text-emerald-100/90 leading-relaxed max-w-3xl">
                    Aplikasi ini telah terhubung ke database cloud Firebase Firestore. Setiap kali Anda menekan tombol <strong>Simpan Perubahan</strong> di dashboard ini, data akan langsung tersimpan ke cloud dan <strong>otomatis terupdate secara real-time di seluruh HP & browser mahasiswa tanpa perlu redeploy ke Vercel</strong>!
                  </p>
                </div>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePushToFirebase}
                  disabled={isPushingCloud}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-bold flex items-center space-x-2 transition-all shadow-sm active:scale-95"
                >
                  {isPushingCloud ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                      <span>Menyinkronkan ke Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-emerald-700" />
                      <span>{cloudPushSuccess ? '✓ Sukses Tersinkron ke Cloud Firestore!' : 'Kirim Ulang Setelan Saat Ini ke Cloud'}</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-emerald-300 font-mono">
                  Project: gen-lang-client-0086413316
                </span>
              </div>
            </div>

            {/* OPSI 1: UNDUH APP-CONFIG.JSON UNTUK VERCEL */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                    Opsi 1: Paling Direkomendasikan untuk Vercel
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    Jadikan Setelan Bawaan Proyek (Unduh Berkas app-config.json)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Unduh file konfigurasi aktif Anda saat ini. Letakkan file ini di folder <code className="bg-slate-200 text-slate-900 px-1 py-0.5 rounded font-mono text-xs">public/app-config.json</code> proyek GitHub Anda, lalu deploy ulang ke Vercel. Setelah itu, <strong>seluruh mahasiswa dan siapapun yang membuka link Vercel akan otomatis mendapatkan setelan terbaru</strong> tanpa perlu login.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadAppConfigJson}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File app-config.json</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center space-x-2 transition-all"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>{copyFeedback === 'json' ? '✓ Teks JSON Disalin!' : 'Salin Teks JSON'}</span>
                </button>
              </div>
            </div>

            {/* OPSI 2: TAUTAN SINKRONISASI CEPAT */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide bg-blue-100 px-2 py-0.5 rounded-md inline-block">
                Opsi 2: Cepat Antar HP / Laptop
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                Salin Tautan Sinkronisasi Pengaturan Instan
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buat tautan khusus yang membawa data pengaturan Anda. Cukup kirim dan buka tautan tersebut di HP atau browser lain, maka seluruh data logo, judul, WA grup, dan tanda tangan akan otomatis terpasang dalam 1 detik.
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleCopyShareableUrl}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copyFeedback === 'url' ? '✓ Tautan Berhasil Disalin ke Clipboard!' : 'Salin Tautan Sinkronisasi Pengaturan'}</span>
                </button>
                {copyFeedback === 'url' && (
                  <p className="text-xs text-blue-700 font-medium mt-1.5">
                    Tautan telah disalin! Buka tautan tersebut di browser lain untuk langsung menerapkan pengaturan ini.
                  </p>
                )}
              </div>
            </div>

            {/* OPSI 3: IMPOR CADANGAN JSON */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide bg-slate-200 px-2 py-0.5 rounded-md inline-block">
                Opsi 3: Pulihkan dari File Cadangan
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                Impor Pengaturan dari File Cadangan / Teks JSON
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Jika Anda memiliki file JSON cadangan atau teks konfigurasi dari browser lain, Anda dapat mengunggah atau menempelkannya di sini.
              </p>

              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={jsonFileInputRef}
                    onChange={handleJsonFileUpload}
                    accept=".json,application/json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all"
                  >
                    <UploadCloud className="w-4 h-4 text-slate-600" />
                    <span>Pilih Berkas .json</span>
                  </button>
                </div>

                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Atau tempel teks JSON konfigurasi di sini..."
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
                />

                {importError && (
                  <p className="text-xs text-red-600 font-semibold">{importError}</p>
                )}

                {importJsonText.trim() && (
                  <button
                    type="button"
                    onClick={handleApplyImportedJson}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Terapkan Teks Konfigurasi Ini</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            id="btn-reset-default-config"
            onClick={handleResetDefaults}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-600 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Kembalikan ke Teks Standar FKIP UIJ</span>
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            {isSavedNotice && (
              <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tersimpan!</span>
              </span>
            )}

            <button
              type="button"
              id="btn-save-system-config"
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.99] ${
                isSavedNotice
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/30'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isSavedNotice ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Pengaturan Berhasil Disimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Seluruh Pengaturan Sistem</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
