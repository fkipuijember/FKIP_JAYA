import React, { useRef, useState } from 'react';
import { 
  CheckCircle2, 
  Printer, 
  X, 
  Download, 
  Copy, 
  Check, 
  FileDown, 
  Loader2, 
  Sparkles,
  FileText,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { RegistrationRecord, DashboardConfig } from '../types';
import { downloadRegistrationCardPdf } from '../utils/pdfGenerator';

interface SuccessModalProps {
  record: RegistrationRecord | null;
  onClose: () => void;
  dashboardConfig?: DashboardConfig;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ record, onClose, dashboardConfig }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState<string>('');

  if (!record) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(record.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Generates and automatically downloads the official PDF proof card
   */
  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const fileName = await downloadRegistrationCardPdf(record, dashboardConfig);
      setDownloadedFileName(fileName);
      setPdfDownloaded(true);
      setTimeout(() => {
        setIsGeneratingPdf(false);
      }, 500);
      setTimeout(() => {
        setPdfDownloaded(false);
      }, 4000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setIsGeneratingPdf(false);
      alert('Gagal membuat file PDF. Membuka dialog cetak browser sebagai alternatif...');
      window.print();
    }
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 print:shadow-none print:border-none">
        {/* Top Header - Not printed */}
        <div className="bg-emerald-800 px-6 py-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Pendaftaran Berhasil Dikirim!</h3>
              <p className="text-xs text-emerald-200">Data otomatis diarsipkan ke sistem panitia PPL FKIP UIJ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div ref={cardRef} className="p-6 sm:p-8 space-y-6 print:p-4 text-slate-800" id="kartu-tanda-bukti">
          {/* Institutional Kop Surat with Optional Template Logo */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-2 text-center sm:text-left">
              {dashboardConfig?.logoTemplateUrl ? (
                <img
                  src={dashboardConfig.logoTemplateUrl}
                  alt="Logo Institusi / Template"
                  className="w-16 h-16 object-contain flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-emerald-800 flex items-center justify-center text-white font-extrabold text-lg shadow-sm flex-shrink-0 border border-emerald-700">
                  UIJ
                </div>
              )}
              <div>
                <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-700">
                  Universitas Islam Jember
                </h4>
                <h2 className="text-base sm:text-xl font-extrabold text-emerald-900 uppercase tracking-tight">
                  Fakultas Keguruan dan Ilmu Pendidikan
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {dashboardConfig?.lokasiKampus || 'Jl. Kyai Mojo No. 101, Kaliwates, Jember, Jawa Timur 68133'}
                </p>
              </div>
            </div>

            <div className="text-center mt-2">
              <div className="inline-block bg-slate-100 border border-slate-300 px-4 py-1.5 rounded-md">
                <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-wide uppercase block">
                  {dashboardConfig?.judulBuktiPendaftaran?.trim() || `Tanda Bukti Pendaftaran PPL ${dashboardConfig?.tahunAkademik ? `(${dashboardConfig.tahunAkademik})` : 'Tahun 2025/2026'}`}
                </span>
                {dashboardConfig?.subjudulBuktiPendaftaran && (
                  <span className="text-[11px] font-semibold text-emerald-800 tracking-wide uppercase block mt-0.5">
                    {dashboardConfig.subjudulBuktiPendaftaran}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Registration Code Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                Nomor Registrasi PPL
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black text-emerald-950">
                {record.id}
              </span>
            </div>

            <div className="flex items-center space-x-2 print:hidden">
              <button
                type="button"
                onClick={handleCopyId}
                className="flex items-center space-x-1 text-xs px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin Nomor'}</span>
              </button>
            </div>
          </div>

          {/* Link WA Grup PPL Invitation Banner */}
          {dashboardConfig?.linkWaGrup && dashboardConfig.linkWaGrup.trim().length > 0 && (
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-800 text-white rounded-2xl p-4 shadow-sm border border-emerald-600/60 flex flex-col sm:flex-row items-center justify-between gap-3.5 print:bg-emerald-50 print:text-emerald-950 print:border-emerald-300">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner print:bg-emerald-700 print:text-white">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-900/80 px-2 py-0.5 rounded-md border border-emerald-400/40 text-emerald-200 print:bg-emerald-200 print:text-emerald-900">
                      Wajib Peserta PPL
                    </span>
                    <h5 className="font-bold text-sm tracking-tight">
                      {dashboardConfig.namaWaGrup || 'Grup WhatsApp Resmi Peserta PPL FKIP UIJ'}
                    </h5>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1 leading-snug print:text-emerald-800">
                    {dashboardConfig.pesanWaGrup || 'Seluruh mahasiswa yang telah mendaftar wajib bergabung ke grup WhatsApp resmi untuk pengumuman pembekalan & pembagian DPL.'}
                  </p>
                </div>
              </div>

              <a
                href={dashboardConfig.linkWaGrup}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white text-emerald-900 font-extrabold text-xs rounded-xl hover:bg-emerald-50 transition-all shadow-sm flex-shrink-0 active:scale-95 print:border print:border-emerald-600"
              >
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>Gabung WA Grup PPL</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              </a>
            </div>
          )}

          {/* Student Biodata & 3x4 Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 items-start">
            {/* 3x4 Photo Preview */}
            <div className="sm:col-span-1 flex flex-col items-center">
              <div className="w-28 h-36 bg-red-600 border-2 border-red-500 rounded-lg overflow-hidden shadow-md flex items-center justify-center relative">
                {record.dataPendukung.fotoAlmamater3x4?.base64Data ? (
                  <img
                    src={record.dataPendukung.fotoAlmamater3x4.base64Data}
                    alt="Pasfoto 3x4 Mahasiswa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs font-bold text-center px-2">
                    Foto 3x4 Jas Almamater
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-1">
                Pasfoto 3x4 (Resmi)
              </span>
            </div>

            {/* Biodata List */}
            <div className="sm:col-span-3 space-y-2 text-xs sm:text-sm">
              <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Nama Lengkap</span>
                <span className="col-span-2 font-bold text-slate-900">{record.biodata.namaLengkap}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">NIM</span>
                <span className="col-span-2 font-mono font-bold text-slate-900">{record.biodata.nim}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Program Studi</span>
                <span className="col-span-2 font-semibold text-emerald-800">{record.biodata.programStudi}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">WhatsApp Aktif</span>
                <span className="col-span-2 font-mono text-slate-800">{record.biodata.nomorWhatsApp}</span>
              </div>
              <div className="grid grid-cols-3 py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="col-span-2 text-slate-800">{record.biodata.email}</span>
              </div>
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-500 font-medium">Alamat</span>
                <span className="col-span-2 text-slate-700 leading-relaxed">{record.biodata.alamatLengkap}</span>
              </div>
            </div>
          </div>

          {/* Uploaded Documents Checklist */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center space-x-1.5">
              <span>Status Kelengkapan Berkas Persyaratan</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="truncate">
                  <span className="font-semibold block">Transkrip Nilai:</span>
                  <span className="text-[11px] text-slate-500 truncate block">
                    {record.dataPendukung.transkripNilai?.fileName}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="truncate">
                  <span className="font-semibold block">KRS Terakhir:</span>
                  <span className="text-[11px] text-slate-500 truncate block">
                    {record.dataPendukung.krsTerakhir?.fileName}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="truncate">
                  <span className="font-semibold block">Bukti Pembayaran:</span>
                  <span className="text-[11px] text-slate-500 truncate block">
                    {record.dataPendukung.buktiPembayaran?.fileName}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="truncate">
                  <span className="font-semibold block">Pasfoto 3x4 Jas Merah:</span>
                  <span className="text-[11px] text-slate-500 truncate block">
                    {record.dataPendukung.fotoAlmamater3x4?.fileName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures for official proof and printing */}
          <div className="grid grid-cols-2 pt-4 border-t border-slate-200 text-xs text-center">
            <div>
              <p className="text-slate-600 font-medium">Mahasiswa Pendaftar,</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-[11px] text-slate-400 italic">Tertanda Resmi</span>
              </div>
              <p className="font-bold underline text-slate-900">{record.biodata.namaLengkap}</p>
              <p className="text-slate-500 font-mono text-[11px]">NIM: {record.biodata.nim}</p>
            </div>
            <div>
              <p className="text-slate-600 font-medium">Jember, {new Date(record.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-slate-600 font-medium">{dashboardConfig?.jabatanPanitiaPpl || 'Panitia PPL FKIP UIJ'},</p>
              <div className="h-14 flex items-center justify-center relative">
                {dashboardConfig?.ttdPanitiaUrl ? (
                  <div className="relative flex items-center justify-center">
                    <img 
                      src={dashboardConfig.ttdPanitiaUrl} 
                      alt="Tanda Tangan Panitia" 
                      className="h-13 max-h-13 max-w-[130px] object-contain drop-shadow-xs" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md border border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-800 tracking-wider uppercase shadow-xs">
                    ✓ Terverifikasi Sistem
                  </span>
                )}
              </div>
              <p className="font-bold underline text-slate-900">{dashboardConfig?.namaPanitiaPpl || '( Panitia PPL FKIP )'}</p>
              <p className="text-slate-500 text-[11px] font-mono">{dashboardConfig?.nidnPanitiaPpl ? `NIDN/NIY: ${dashboardConfig.nidnPanitiaPpl}` : 'NIDN / Panitia Pelaksana'}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions - Not printed */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col gap-3 print:hidden">
          {pdfDownloaded && (
            <div className="w-full bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
              <span className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Kartu Bukti PDF <strong>{downloadedFileName}</strong> otomatis tersimpan di perangkat Anda!</span>
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                Didownload
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Cetak atau download PDF ini sebagai tanda bukti sah keikutsertaan PPL.
            </p>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              {/* Secondary Print via Browser Printer */}
              <button
                type="button"
                id="btn-print-browser"
                onClick={handlePrintBrowser}
                className="px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                title="Cetak langsung menggunakan printer fisik"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Cetak Fisik</span>
              </button>

              {/* Primary: Cetak / Download PDF Otomatis */}
              <button
                type="button"
                id="btn-print-bukti"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-[0.99] text-white ${
                  pdfDownloaded
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/30'
                }`}
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Membuat PDF...</span>
                  </>
                ) : pdfDownloaded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PDF Berhasil Didownload!</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Cetak Kartu Bukti (Unduh PDF)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
