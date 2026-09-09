import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  FileSpreadsheet, 
  Trash2, 
  Inbox, 
  ExternalLink, 
  RefreshCw, 
  Settings, 
  Phone, 
  Mail, 
  LogOut, 
  X, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Calendar,
  Eye,
  FileDown
} from 'lucide-react';
import { RegistrationRecord, ProgramStudi, DashboardConfig } from '../types';
import { downloadRegistrationCardPdf } from '../utils/pdfGenerator';
import { 
  exportToCSV, 
  syncToGoogleServices, 
  getGoogleSyncConfig, 
  clearAllRegistrations,
  deleteRegistrationRecord 
} from '../utils/storage';
import { SystemSettings } from './SystemSettings';

interface AdminPanelProps {
  records: RegistrationRecord[];
  onRefresh: () => void;
  onOpenSyncModal: () => void;
  onLogout: () => void;
  dashboardConfig?: DashboardConfig;
}

const PROGRAM_STUDI_LIST: ProgramStudi[] = [
  'Bimbingan dan Konseling',
  'Pendidikan Matematika',
  'Pendidikan Biologi',
  'Pendidikan Bahasa Inggris'
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  records,
  onRefresh,
  onOpenSyncModal,
  onLogout,
  dashboardConfig
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'settings'>('data');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProdi, setSelectedProdi] = useState<string>('all');
  const [previewFile, setPreviewFile] = useState<{ title: string; base64: string; type: string } | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<RegistrationRecord | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const googleConfig = getGoogleSyncConfig();

  // Statistics by 4 Study Programs
  const total = records.length;
  const countBK = records.filter((r) => r.biodata.programStudi === 'Bimbingan dan Konseling').length;
  const countMatematika = records.filter((r) => r.biodata.programStudi === 'Pendidikan Matematika').length;
  const countBiologi = records.filter((r) => r.biodata.programStudi === 'Pendidikan Biologi').length;
  const countBahasaInggris = records.filter((r) => r.biodata.programStudi === 'Pendidikan Bahasa Inggris').length;

  // Filtered records
  const filtered = records.filter((record) => {
    const matchSearch =
      record.biodata.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.biodata.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchProdi = selectedProdi === 'all' || record.biodata.programStudi === selectedProdi;

    return matchSearch && matchProdi;
  });

  const handleManualSync = async (record: RegistrationRecord) => {
    setSyncingId(record.id);
    try {
      const res = await syncToGoogleServices(record);
      alert(res.message);
      onRefresh();
    } catch (e: any) {
      alert('Gagal menyinkronkan: ' + e.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleConfirmDeleteSingle = () => {
    if (recordToDelete) {
      deleteRegistrationRecord(recordToDelete.id);
      setRecordToDelete(null);
      onRefresh();
    }
  };

  const handleConfirmClearAll = () => {
    clearAllRegistrations();
    setShowClearConfirm(false);
    onRefresh();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <Users className="w-6 h-6 text-emerald-700" />
              <span>Portal Panitia PPL FKIP UIJ</span>
            </h2>
            {dashboardConfig?.tahunAkademik && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {dashboardConfig.tahunAkademik}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data pendaftar mahasiswa FKIP UIJ tersimpan otomatis dalam 1 Google Spreadsheet & Google Drive
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {googleConfig.spreadsheetUrl && googleConfig.spreadsheetUrl.startsWith('http') && (
            <a
              href={googleConfig.spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              id="btn-open-google-sheet"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold transition-colors"
              title="Buka 1 Google Spreadsheet PPL FKIP UIJ di tab baru"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Buka Google Spreadsheet PPL</span>
              <ExternalLink className="w-3 h-3 text-emerald-600" />
            </a>
          )}

          <button
            type="button"
            id="btn-export-csv"
            onClick={() => exportToCSV(records)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Rekap (.CSV)</span>
          </button>

          {records.length > 0 && activeTab === 'data' && (
            <button
              type="button"
              id="btn-clear-data"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors"
              title="Hapus seluruh data pendaftar lokal"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Hapus Semua</span>
            </button>
          )}

          <button
            type="button"
            id="btn-logout"
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors shadow-sm ml-1"
            title="Keluar dari Portal Panitia"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Data Pendaftar vs Pengaturan Sistem */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          id="tab-sub-data-pendaftar"
          onClick={() => setActiveTab('data')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'data'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Data Pendaftar</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'data' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
          }`}>
            {total}
          </span>
        </button>

        <button
          type="button"
          id="tab-sub-pengaturan-sistem"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan Sistem & Dashboard</span>
        </button>
      </div>

      {activeTab === 'settings' ? (
        /* TAB PENGATURAN SISTEM */
        <SystemSettings onSaved={onRefresh} />
      ) : (
        /* TAB DATA PENDAFTAR */
        <div className="space-y-6">
          {/* Program Studi Distribution Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">Total Pendaftar</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{total}</span>
              <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">Mahasiswa Terdaftar</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-600 font-medium block truncate" title="Bimbingan dan Konseling">
                BK
              </span>
              <span className="text-xl font-bold text-slate-800 mt-1 block">{countBK}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Bimbingan & Konseling</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-600 font-medium block truncate" title="Pendidikan Matematika">
                Pend. Matematika
              </span>
              <span className="text-xl font-bold text-slate-800 mt-1 block">{countMatematika}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Matematika</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-600 font-medium block truncate" title="Pendidikan Biologi">
                Pend. Biologi
              </span>
              <span className="text-xl font-bold text-slate-800 mt-1 block">{countBiologi}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Biologi</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] text-slate-600 font-medium block truncate" title="Pendidikan Bahasa Inggris">
                Pend. Bahasa Inggris
              </span>
              <span className="text-xl font-bold text-slate-800 mt-1 block">{countBahasaInggris}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Bahasa Inggris</span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari berdasarkan Nama Mahasiswa, NIM, atau No Registrasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Prodi Filter (Hanya 4 Prodi FKIP UIJ) */}
            <div className="w-full sm:w-64">
              <select
                value={selectedProdi}
                onChange={(e) => setSelectedProdi(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
              >
                <option value="all">Semua Program Studi</option>
                {PROGRAM_STUDI_LIST.map((prodi) => (
                  <option key={prodi} value={prodi}>
                    {prodi}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Registrations Table (Tanpa Verifikator / Kolom Verifikasi) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-4 text-center w-12">No</th>
                    <th className="py-3.5 px-3 text-center">Foto 3x4</th>
                    <th className="py-3.5 px-4">Nama Mahasiswa & NIM</th>
                    <th className="py-3.5 px-4">Program Studi</th>
                    <th className="py-3.5 px-4">Kontak (WA & Email)</th>
                    <th className="py-3.5 px-4 text-center">Berkas Pendukung</th>
                    <th className="py-3.5 px-4 text-center">Sinkron 1 Spreadsheet</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-500">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-inner">
                          <Inbox className="w-7 h-7" />
                        </div>
                        <p className="font-bold text-base text-slate-800">Belum Ada Data Pendaftar</p>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                          Daftar pendaftar saat ini kosong. Setiap kali mahasiswa FKIP UIJ mengisi formulir di halaman utama, biodata dan berkasnya akan langsung tampil di sini dan tersimpan otomatis ke 1 Google Spreadsheet.
                        </p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <p className="font-semibold text-sm">Tidak ada data pendaftar yang sesuai filter</p>
                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau pilihan program studi.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((record, index) => (
                      <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* No. */}
                        <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                          {index + 1}
                        </td>

                        {/* Foto 3x4 */}
                        <td className="py-3 px-3 text-center">
                          <div 
                            onClick={() => {
                              if (record.dataPendukung.fotoAlmamater3x4?.base64Data) {
                                setPreviewFile({
                                  title: `Pasfoto 3x4: ${record.biodata.namaLengkap}`,
                                  base64: record.dataPendukung.fotoAlmamater3x4.base64Data,
                                  type: 'image'
                                });
                              }
                            }}
                            className="w-9 h-11 rounded bg-red-600 overflow-hidden cursor-pointer border border-red-300 shadow-xs mx-auto flex items-center justify-center hover:opacity-90"
                            title="Klik untuk lihat foto 3x4"
                          >
                            {record.dataPendukung.fotoAlmamater3x4?.base64Data ? (
                              <img
                                src={record.dataPendukung.fotoAlmamater3x4.base64Data}
                                alt="Foto 3x4"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[8px] text-white">3x4</span>
                            )}
                          </div>
                        </td>

                        {/* Nama & NIM */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{record.biodata.namaLengkap}</p>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="font-mono text-xs text-slate-600 font-semibold">{record.biodata.nim}</span>
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-mono border border-emerald-200">
                              {record.id}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Daftar: {new Date(record.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </td>

                        {/* Program Studi */}
                        <td className="py-3 px-4 text-slate-700">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {record.biodata.programStudi}
                          </span>
                        </td>

                        {/* Kontak */}
                        <td className="py-3 px-4 text-xs space-y-1">
                          <a
                            href={`https://wa.me/${record.biodata.nomorWhatsApp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center space-x-1 text-emerald-700 hover:underline font-mono font-medium"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{record.biodata.nomorWhatsApp}</span>
                          </a>
                          <p className="text-slate-500 truncate max-w-[150px] flex items-center space-x-1" title={record.biodata.email}>
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{record.biodata.email}</span>
                          </p>
                        </td>

                        {/* Berkas Unggahan Buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Transkrip */}
                            <button
                              type="button"
                              onClick={() => {
                                if (record.dataPendukung.transkripNilai) {
                                  setPreviewFile({
                                    title: `Transkrip Nilai - ${record.biodata.namaLengkap}`,
                                    base64: record.dataPendukung.transkripNilai.base64Data,
                                    type: record.dataPendukung.transkripNilai.fileType
                                  });
                                }
                              }}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                              title="Buka Transkrip Nilai"
                            >
                              Transkrip
                            </button>

                            {/* KRS */}
                            <button
                              type="button"
                              onClick={() => {
                                if (record.dataPendukung.krsTerakhir) {
                                  setPreviewFile({
                                    title: `KRS Terakhir - ${record.biodata.namaLengkap}`,
                                    base64: record.dataPendukung.krsTerakhir.base64Data,
                                    type: record.dataPendukung.krsTerakhir.fileType
                                  });
                                }
                              }}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                              title="Buka KRS Terakhir"
                            >
                              KRS
                            </button>

                            {/* Bukti Bayar */}
                            <button
                              type="button"
                              onClick={() => {
                                if (record.dataPendukung.buktiPembayaran) {
                                  setPreviewFile({
                                    title: `Bukti Pembayaran - ${record.biodata.namaLengkap}`,
                                    base64: record.dataPendukung.buktiPembayaran.base64Data,
                                    type: record.dataPendukung.buktiPembayaran.fileType
                                  });
                                }
                              }}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                              title="Buka Bukti Bayar"
                            >
                              Bayar
                            </button>
                          </div>
                        </td>

                        {/* Status Sinkron 1 Spreadsheet */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>1 Sheet</span>
                            </span>
                            <button
                              type="button"
                              disabled={syncingId === record.id}
                              onClick={() => handleManualSync(record)}
                              className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Kirim / Sinkron Ulang ke Google Apps Script"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${syncingId === record.id ? 'animate-spin text-emerald-600' : ''}`} />
                            </button>
                          </div>
                        </td>

                        {/* Aksi: Download PDF Bukti & Hapus */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await downloadRegistrationCardPdf(record, dashboardConfig);
                                } catch (err) {
                                  console.error(err);
                                  alert('Gagal mendownload PDF bukti pendaftaran.');
                                }
                              }}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                              title="Download Kartu Bukti PPL (PDF) Mahasiswa Ini"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setRecordToDelete(record)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Hapus data mahasiswa ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal (Pasfoto, Transkrip, KRS, Bukti Bayar) */}
      {previewFile && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-4 border border-slate-300 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">{previewFile.title}</h4>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="min-h-[260px] max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-3">
              {previewFile.type.includes('pdf') ? (
                <iframe
                  src={previewFile.base64}
                  title="PDF Preview"
                  className="w-full h-[60vh] rounded border border-slate-200"
                />
              ) : (
                <img
                  src={previewFile.base64}
                  alt="Berkas Preview"
                  className="max-h-[60vh] max-w-full object-contain rounded shadow-sm"
                />
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={previewFile.base64}
                download={`Berkas_${previewFile.title.replace(/\s+/g, '_')}`}
                className="text-xs text-emerald-700 font-semibold hover:underline"
              >
                Unduh Berkas Ini
              </a>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Record Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">Hapus Data Pendaftar?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda akan menghapus data pendaftaran <strong>{recordToDelete.biodata.namaLengkap}</strong> (NIM: {recordToDelete.biodata.nim}). Tindakan ini tidak dapat dibatalkan pada data lokal.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSingle}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">Hapus Seluruh Data Pendaftar?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tindakan ini akan mengosongkan seluruh riwayat pendaftar yang tersimpan di aplikasi ini. Data yang sebelumnya sudah tersinkron ke Google Drive & Spreadsheet Anda tidak akan terhapus dari akun Google Anda.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
              >
                Ya, Hapus Semua Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
