import React, { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  Send, 
  AlertCircle, 
  FileCheck, 
  CheckCircle2, 
  Info,
  Phone,
  Mail,
  MapPin,
  BookOpen
} from 'lucide-react';
import { BiodataForm, DataPendukungForm, ProgramStudi, RegistrationRecord, DashboardConfig } from '../types';
import { FileUploadField } from './FileUploadField';
import { saveRegistration, syncToGoogleServices, getGoogleSyncConfig, getDashboardConfig } from '../utils/storage';
import { saveRegistrationToFirestore } from '../utils/firebase';

interface RegistrationFormProps {
  onSuccess: (record: RegistrationRecord) => void;
  onOpenSyncInfo: () => void;
  dashboardConfig?: DashboardConfig;
}

const PROGRAM_STUDI_OPTIONS: ProgramStudi[] = [
  'Bimbingan dan Konseling',
  'Pendidikan Matematika',
  'Pendidikan Biologi',
  'Pendidikan Bahasa Inggris'
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  onOpenSyncInfo,
  dashboardConfig: propDashboardConfig
}) => {
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(
    () => propDashboardConfig || getDashboardConfig()
  );

  useEffect(() => {
    if (propDashboardConfig) {
      setDashboardConfig(propDashboardConfig);
    } else {
      setDashboardConfig(getDashboardConfig());
    }
  }, [propDashboardConfig]);

  // Form State
  const [biodata, setBiodata] = useState<BiodataForm>({
    namaLengkap: '',
    nim: '',
    programStudi: '',
    alamatLengkap: '',
    nomorWhatsApp: '',
    email: ''
  });

  const [dataPendukung, setDataPendukung] = useState<DataPendukungForm>({
    transkripNilai: null,
    krsTerakhir: null,
    buktiPembayaran: null,
    fotoAlmamater3x4: null
  });

  const [persetujuan, setPersetujuan] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string>('');

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!biodata.namaLengkap.trim()) {
      errs.namaLengkap = 'Nama lengkap wajib diisi sesuai identitas resmi.';
    }

    if (!biodata.nim.trim()) {
      errs.nim = 'NIM mahasiswa wajib diisi.';
    } else if (biodata.nim.trim().length < 5) {
      errs.nim = 'NIM minimal 5 karakter/digit.';
    }

    if (!biodata.programStudi) {
      errs.programStudi = 'Pilih salah satu program studi FKIP UIJ.';
    }

    if (!biodata.alamatLengkap.trim()) {
      errs.alamatLengkap = 'Alamat lengkap wajib diisi (domisili/asal).';
    }

    if (!biodata.nomorWhatsApp.trim()) {
      errs.nomorWhatsApp = 'Nomor WhatsApp aktif wajib diisi.';
    } else if (!/^[0-9+-\s]{9,16}$/.test(biodata.nomorWhatsApp.trim())) {
      errs.nomorWhatsApp = 'Format nomor WhatsApp tidak valid (misal: 081234567890).';
    }

    if (!biodata.email.trim()) {
      errs.email = 'Alamat email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(biodata.email.trim())) {
      errs.email = 'Format alamat email tidak valid.';
    }

    // Berkas validation
    if (!dataPendukung.transkripNilai) {
      errs.transkripNilai = 'File transkrip nilai wajib diunggah.';
    }

    if (!dataPendukung.krsTerakhir) {
      errs.krsTerakhir = 'File KRS semester terakhir wajib diunggah.';
    }

    if (!dataPendukung.buktiPembayaran) {
      errs.buktiPembayaran = 'File bukti pembayaran pendaftaran PPL wajib diunggah.';
    }

    if (!dataPendukung.fotoAlmamater3x4) {
      errs.fotoAlmamater3x4 = 'Foto warna 3x4 berjas almamater (background merah) wajib diunggah.';
    }

    if (!persetujuan) {
      errs.persetujuan = 'Anda harus menyetujui pernyataan kebenaran data.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`wrapper-${firstErrorKey}`) || document.getElementById(firstErrorKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitStep('Memverifikasi kelengkapan berkas...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setSubmitStep('Menyiapkan pendaftaran tanpa login...');

      // Generate unique registration ID
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const regId = `PPL-UIJ-${year}-${randomSuffix}`;

      const newRecord: RegistrationRecord = {
        id: regId,
        timestamp: new Date().toISOString(),
        biodata: { ...biodata },
        dataPendukung: {
          transkripNilai: dataPendukung.transkripNilai!,
          krsTerakhir: dataPendukung.krsTerakhir!,
          buktiPembayaran: dataPendukung.buktiPembayaran!,
          fotoAlmamater3x4: dataPendukung.fotoAlmamater3x4!
        },
        statusVerifikasi: 'Menunggu Verifikasi',
        syncedToGoogle: {
          status: 'pending'
        }
      };

      setSubmitStep('Menyimpan data dan menyinkronkan ke Google Drive & Spreadsheet...');

      // Save locally first
      saveRegistration(newRecord);

      // Trigger sync to Google Apps Script / Drive & Sheets
      const syncConfig = getGoogleSyncConfig();
      const syncResult = await syncToGoogleServices(newRecord, syncConfig.webAppUrl);

      if (syncResult.success) {
        newRecord.syncedToGoogle = {
          status: 'success',
          driveFolderUrl: syncResult.driveFolderUrl,
          syncedAt: new Date().toISOString()
        };
      }

      await new Promise((r) => setTimeout(r, 600));
      setIsSubmitting(false);
      setSubmitStep('');

      // Open Success Modal
      onSuccess(newRecord);

      // Reset form
      setBiodata({
        namaLengkap: '',
        nim: '',
        programStudi: '',
        alamatLengkap: '',
        nomorWhatsApp: '',
        email: ''
      });
      setDataPendukung({
        transkripNilai: null,
        krsTerakhir: null,
        buktiPembayaran: null,
        fotoAlmamater3x4: null
      });
      setPersetujuan(false);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setSubmitStep('');
      alert('Terjadi kesalahan saat memproses pendaftaran. Silakan coba beberapa saat lagi.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Informational Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-700/80 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-100 border border-emerald-500/40 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>{dashboardConfig.tahunAkademik || 'Tahun Akademik 2025/2026'} • {dashboardConfig.periodePendaftaran || 'Gelombang I'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {dashboardConfig.judulKegiatan || 'Formulir Pendaftaran PPL FKIP UIJ'}
          </h2>
          <p className="text-emerald-200 text-xs font-medium mt-0.5">
            {dashboardConfig.subjudul || 'Fakultas Keguruan dan Ilmu Pendidikan - Universitas Islam Jember'}
          </p>
          <p className="text-emerald-100/90 text-sm mt-2 max-w-2xl leading-relaxed">
            {dashboardConfig.petunjukUmum || 'Mahasiswa dapat langsung mengisi formulir pendaftaran tanpa perlu login. Semua biodata dan berkas pendukung akan otomatis tersimpan rapi ke Google Drive dan Google Spreadsheet panitia.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-emerald-200">
            <span className="flex items-center space-x-1 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Bebas Akun / Langsung Isi</span>
            </span>
            <span className="flex items-center space-x-1 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-700/50">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Arsip Folder Otomatis di Drive</span>
            </span>
            <span className="flex items-center space-x-1 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-700/50">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Cetak Kartu Tanda Bukti Langsung</span>
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" id="form-ppl-uij">
        {/* BAGIAN A: BIODATA MAHASISWA */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200" id="section-biodata">
          <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
              A
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <User className="w-5 h-5 text-emerald-700" />
                <span>Biodata Mahasiswa</span>
              </h3>
              <p className="text-xs text-slate-500">
                Isi data diri dengan teliti sesuai dokumen akademik Universitas Islam Jember
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nama Lengkap */}
            <div className="sm:col-span-2 space-y-1.5" id="wrapper-namaLengkap">
              <label htmlFor="namaLengkap" className="block text-sm font-semibold text-slate-800">
                Nama Lengkap <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="namaLengkap"
                  placeholder="Contoh: Muhammad Ilham Pratama"
                  value={biodata.namaLengkap}
                  onChange={(e) => setBiodata({ ...biodata, namaLengkap: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.namaLengkap
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                  }`}
                />
              </div>
              {errors.namaLengkap && (
                <p className="text-xs text-red-600 flex items-center space-x-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.namaLengkap}</span>
                </p>
              )}
            </div>

            {/* NIM */}
            <div className="space-y-1.5" id="wrapper-nim">
              <label htmlFor="nim" className="block text-sm font-semibold text-slate-800">
                Nomor Induk Mahasiswa (NIM) <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="nim"
                  placeholder="Contoh: 2110203014"
                  value={biodata.nim}
                  onChange={(e) => setBiodata({ ...biodata, nim: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-mono ${
                    errors.nim
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                  }`}
                />
              </div>
              {errors.nim && (
                <p className="text-xs text-red-600 flex items-center space-x-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.nim}</span>
                </p>
              )}
            </div>

            {/* Program Studi */}
            <div className="space-y-1.5" id="wrapper-programStudi">
              <label htmlFor="programStudi" className="block text-sm font-semibold text-slate-800">
                Program Studi FKIP <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  id="programStudi"
                  value={biodata.programStudi}
                  onChange={(e) => setBiodata({ ...biodata, programStudi: e.target.value as ProgramStudi })}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.programStudi
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                  }`}
                >
                  <option value="">-- Pilih Program Studi --</option>
                  {PROGRAM_STUDI_OPTIONS.map((prodi) => (
                    <option key={prodi} value={prodi}>
                      {prodi}
                    </option>
                  ))}
                </select>
              </div>
              {errors.programStudi && (
                <p className="text-xs text-red-600 flex items-center space-x-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.programStudi}</span>
                </p>
              )}
            </div>

            {/* Nomor WhatsApp */}
            <div className="space-y-1.5" id="wrapper-nomorWhatsApp">
              <label htmlFor="nomorWhatsApp" className="block text-sm font-semibold text-slate-800">
                Nomor WhatsApp yang Aktif <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  id="nomorWhatsApp"
                  placeholder="081234567890"
                  value={biodata.nomorWhatsApp}
                  onChange={(e) => setBiodata({ ...biodata, nomorWhatsApp: e.target.value })}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.nomorWhatsApp
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Akan digunakan untuk pembagian kelompok PPL dan informasi Dosen Pembimbing Lapangan (DPL).
              </p>
              {errors.nomorWhatsApp && (
                <p className="text-xs text-red-600 flex items-center space-x-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.nomorWhatsApp}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5" id="wrapper-email">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
                Alamat Email Aktif <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  placeholder="mahasiswa@gmail.com"
                  value={biodata.email}
                  onChange={(e) => setBiodata({ ...biodata, email: e.target.value })}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 flex items-center space-x-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Alamat Lengkap */}
            <div className="sm:col-span-2 space-y-1.5" id="wrapper-alamatLengkap">
              <label htmlFor="alamatLengkap" className="block text-sm font-semibold text-slate-800">
                Alamat Lengkap <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  id="alamatLengkap"
                  rows={2}
                  placeholder="Nama jalan, RT/RW, Dusun/Kelurahan, Kecamatan, Kabupaten/Kota"
                  value={biodata.alamatLengkap}
                  onChange={(e) => setBiodata({ ...biodata, alamatLengkap: e.target.value })}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    errors.alamatLengkap
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                  }`}
                />
              </div>
              {errors.alamatLengkap && (
                <p className="text-xs text-red-600 flex items-center space-x-1 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.alamatLengkap}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* BAGIAN B: DATA PENDUKUNG */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200" id="section-data-pendukung">
          <div className="flex items-center space-x-3 pb-4 mb-6 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base">
              B
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-amber-700" />
                <span>Data Pendukung & Berkas Persyaratan</span>
              </h3>
              <p className="text-xs text-slate-500">
                Unggah 4 berkas wajib berikut. Berkas akan otomatis diarsipkan di folder Google Drive Anda.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* 1. Transkrip Nilai */}
            <FileUploadField
              id="transkripNilai"
              label="1. Transkrip Nilai Sementara"
              sublabel="Scan atau unduhan resmi transkrip nilai akademik dari SIAKAD (PDF atau Gambar)"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              value={dataPendukung.transkripNilai}
              onChange={(file) => setDataPendukung({ ...dataPendukung, transkripNilai: file })}
              required
              error={errors.transkripNilai}
            />

            {/* 2. KRS Terakhir */}
            <FileUploadField
              id="krsTerakhir"
              label="2. KRS Semester Terakhir"
              sublabel="Kartu Rencana Studi (KRS) yang memprogram mata kuliah PPL (PDF atau Gambar)"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              value={dataPendukung.krsTerakhir}
              onChange={(file) => setDataPendukung({ ...dataPendukung, krsTerakhir: file })}
              required
              error={errors.krsTerakhir}
            />

            {/* 3. Bukti Pembayaran */}
            <FileUploadField
              id="buktiPembayaran"
              label="3. Bukti Pembayaran PPL"
              sublabel={dashboardConfig.rekeningPembayaran || "Slip setoran bank / bukti transfer biaya pendaftaran PPL FKIP UIJ"}
              accept=".pdf,image/png,image/jpeg,image/jpg"
              value={dataPendukung.buktiPembayaran}
              onChange={(file) => setDataPendukung({ ...dataPendukung, buktiPembayaran: file })}
              required
              error={errors.buktiPembayaran}
            />

            {/* 4. Foto 3x4 Jas Almamater (Background Merah) */}
            <FileUploadField
              id="fotoAlmamater3x4"
              label="4. Foto Warna 3x4 Berjas Almamater"
              sublabel="Wajib memakai jas almamater Universitas Islam Jember dengan latar belakang MERAH polos"
              accept="image/png,image/jpeg,image/jpg"
              isImageOnly
              isFoto3x4
              value={dataPendukung.fotoAlmamater3x4}
              onChange={(file) => setDataPendukung({ ...dataPendukung, fotoAlmamater3x4: file })}
              required
              error={errors.fotoAlmamater3x4}
            />
          </div>

          {/* Photo requirement note box */}
          <div className="mt-5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start space-x-3 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Ketentuan Pasfoto:</span>
              <p className="mt-0.5 text-amber-800">
                {dashboardConfig.catatanFoto || 'Foto berwarna terbaru ukuran 3x4 berlatar belakang MERAH dengan memakai Jas Almamater hijau UIJ.'}
              </p>
            </div>
          </div>
        </div>

        {/* BAGIAN C: PERNYATAAN & SUBMIT */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200" id="section-pernyataan">
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                id="checkbox-persetujuan"
                checked={persetujuan}
                onChange={(e) => setPersetujuan(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Saya menyatakan bahwa seluruh biodata dan berkas yang saya unggah adalah benar, sah, dan sesuai 
                dengan ketentuan Fakultas Keguruan dan Ilmu Pendidikan Universitas Islam Jember. Apabila di kemudian hari 
                ditemukan data yang tidak benar, saya bersedia menerima sanksi akademik sesuai aturan yang berlaku.
              </span>
            </label>

            {errors.persetujuan && (
              <p className="text-xs text-red-600 flex items-center space-x-1 pl-7">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.persetujuan}</span>
              </p>
            )}
          </div>

          {/* Google Sync Notice */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Otomatis tercatat dalam 1 Spreadsheet & Google Drive Panitia</span>
              <button
                type="button"
                onClick={onOpenSyncInfo}
                className="text-emerald-700 underline hover:text-emerald-800 ml-1"
              >
                Pelajari
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-submit-pendaftaran"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center space-x-2 transition-all shadow-md ${
                isSubmitting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] shadow-emerald-700/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{submitStep || 'Memproses Pendaftaran...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Pendaftaran PPL Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Pusat Bantuan & Kontak Panitia */}
      {(dashboardConfig.nomorWaPanitia || dashboardConfig.emailPanitia || dashboardConfig.lokasiKampus) && (
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Pusat Informasi & Helpdesk PPL FKIP UIJ</p>
              <p className="text-slate-500">{dashboardConfig.lokasiKampus || 'Kampus UIJ, Jl. Kyai Mojo No. 101, Kaliwates, Jember'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
            {dashboardConfig.nomorWaPanitia && (
              <a
                href={`https://wa.me/${dashboardConfig.nomorWaPanitia.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WA: {dashboardConfig.nomorWaPanitia}</span>
              </a>
            )}
            {dashboardConfig.emailPanitia && (
              <a
                href={`mailto:${dashboardConfig.emailPanitia}`}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{dashboardConfig.emailPanitia}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
