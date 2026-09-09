export type ProgramStudi =
  | 'Bimbingan dan Konseling'
  | 'Pendidikan Matematika'
  | 'Pendidikan Biologi'
  | 'Pendidikan Bahasa Inggris';

export interface FileData {
  fileName: string;
  fileSize: number;
  fileType: string;
  base64Data: string; // data URL or base64 string
  uploadedAt: string;
  driveFileUrl?: string;
}

export interface BiodataForm {
  namaLengkap: string;
  nim: string;
  programStudi: ProgramStudi | '';
  alamatLengkap: string;
  nomorWhatsApp: string;
  email: string;
}

export interface DataPendukungForm {
  transkripNilai: FileData | null;
  krsTerakhir: FileData | null;
  buktiPembayaran: FileData | null;
  fotoAlmamater3x4: FileData | null;
}

export interface RegistrationRecord {
  id: string; // e.g. PPL-UIJ-2025-001
  timestamp: string;
  biodata: BiodataForm;
  dataPendukung: {
    transkripNilai: FileData;
    krsTerakhir: FileData;
    buktiPembayaran: FileData;
    fotoAlmamater3x4: FileData;
  };
  statusVerifikasi?: 'Menunggu Verifikasi' | 'Memenuhi Syarat' | 'Perlu Revisi';
  catatanPanitia?: string;
  syncedToGoogle: {
    status: 'success' | 'pending' | 'failed' | 'not_configured';
    driveFolderUrl?: string;
    spreadsheetRow?: number;
    syncedAt?: string;
    errorMessage?: string;
  };
}

export interface GoogleSyncConfig {
  webAppUrl: string;
  spreadsheetUrl?: string;
  spreadsheetId?: string;
  driveFolderId?: string;
  autoSync: boolean;
}

export interface DashboardConfig {
  judulKegiatan: string;
  subjudul: string;
  tahunAkademik: string;
  periodePendaftaran: string;
  petunjukUmum: string;
  catatanFoto: string;
  rekeningPembayaran: string;
  nomorWaPanitia: string;
  emailPanitia: string;
  lokasiKampus: string;
  // Menu Edit Bukti Pendaftaran
  judulBuktiPendaftaran?: string;
  subjudulBuktiPendaftaran?: string;
  logoTemplateUrl?: string;
  linkWaGrup?: string;
  namaWaGrup?: string;
  pesanWaGrup?: string;
  namaPanitiaPpl?: string;
  nidnPanitiaPpl?: string;
  jabatanPanitiaPpl?: string;
  ttdPanitiaUrl?: string;
}
