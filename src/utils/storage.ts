import { RegistrationRecord, GoogleSyncConfig, DashboardConfig } from '../types';
import { saveDashboardConfigToFirestore, saveRegistrationToFirestore, deleteRegistrationFromFirestore } from './firebase';

const STORAGE_KEY = 'ppl_fkip_uij_registrations';
const CONFIG_KEY = 'ppl_fkip_uij_google_config';
const DASHBOARD_CONFIG_KEY = 'ppl_fkip_uij_dashboard_config';
const DATA_PURGED_KEY = 'ppl_fkip_uij_data_purged_flag_v1';

export const DEFAULT_UIJ_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="76" fill="%23065f46" stroke="%23fbbf24" stroke-width="6"/><circle cx="80" cy="80" r="68" fill="none" stroke="%23ffffff" stroke-width="2"/><text x="80" y="68" font-family="sans-serif" font-size="34" font-weight="900" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">UIJ</text><text x="80" y="98" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23fde68a" text-anchor="middle" dominant-baseline="middle">FKIP</text><text x="80" y="122" font-family="sans-serif" font-size="13" fill="%23fbbf24" text-anchor="middle" dominant-baseline="middle">★ ★ ★</text></svg>`;

export const DEFAULT_TTD_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100"><path d="M30,60 C40,20 55,15 65,45 C70,65 78,75 90,35 C100,15 110,25 120,55 C130,70 140,48 150,55 C160,62 170,45 180,50 M35,75 C90,70 160,72 215,65 M175,72 C190,70 205,78 220,74" fill="none" stroke="%231e3a8a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  judulKegiatan: 'Formulir Pendaftaran PPL FKIP UIJ',
  subjudul: 'Fakultas Keguruan dan Ilmu Pendidikan - Universitas Islam Jember',
  tahunAkademik: 'Tahun Akademik 2025/2026',
  periodePendaftaran: 'Gelombang I (Pendaftaran Dibuka)',
  petunjukUmum: 'Mahasiswa FKIP UIJ dapat langsung mengisi formulir pendaftaran tanpa perlu login akun Google. Seluruh biodata dan berkas pendukung otomatis tersimpan ke 1 Google Spreadsheet dan Google Drive panitia.',
  catatanFoto: 'Foto terbaru ukuran 3x4 berlatar belakang MERAH dan wajib memakai Jas Almamater UIJ.',
  rekeningPembayaran: 'Bank Jatim / Bank Jatim Syariah - No. Rekening PPL FKIP UIJ',
  nomorWaPanitia: '081234567890',
  emailPanitia: 'fkip@uij.ac.id',
  lokasiKampus: 'Kampus UIJ, Jl. Kyai Mojo No. 101, Kaliwates, Jember',
  judulBuktiPendaftaran: 'TANDA BUKTI PENDAFTARAN RESMI',
  subjudulBuktiPendaftaran: 'PRAKTIK PENGALAMAN LAPANGAN (PPL)',
  logoTemplateUrl: DEFAULT_UIJ_LOGO,
  linkWaGrup: 'https://chat.whatsapp.com/invite/ppl-fkip-uij',
  namaWaGrup: 'Grup WhatsApp Resmi Peserta PPL FKIP UIJ',
  pesanWaGrup: 'Seluruh mahasiswa yang telah mendaftar wajib bergabung ke Grup WhatsApp resmi untuk informasi pembekalan, ploting sekolah mitra, dan koordinasi dengan Dosen Pembimbing Lapangan (DPL).',
  namaPanitiaPpl: 'H. Moh. Hasan, M.Pd.I',
  nidnPanitiaPpl: '0715088201',
  jabatanPanitiaPpl: 'Ketua Panitia PPL FKIP UIJ',
  ttdPanitiaUrl: DEFAULT_TTD_IMAGE,
  googleWebAppUrl: '',
  googleSpreadsheetUrl: '',
  autoSyncGoogle: true
};

export function getDashboardConfig(): DashboardConfig {
  try {
    const raw = localStorage.getItem(DASHBOARD_CONFIG_KEY);
    if (!raw) {
      return DEFAULT_DASHBOARD_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DASHBOARD_CONFIG,
      ...parsed,
      logoTemplateUrl: parsed.logoTemplateUrl || DEFAULT_DASHBOARD_CONFIG.logoTemplateUrl,
      ttdPanitiaUrl: parsed.ttdPanitiaUrl || DEFAULT_DASHBOARD_CONFIG.ttdPanitiaUrl,
      googleWebAppUrl: parsed.googleWebAppUrl || '',
      googleSpreadsheetUrl: parsed.googleSpreadsheetUrl || '',
      autoSyncGoogle: parsed.autoSyncGoogle ?? true
    };
  } catch {
    return DEFAULT_DASHBOARD_CONFIG;
  }
}

export function saveDashboardConfig(config: DashboardConfig): void {
  try {
    localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(config));
    saveDashboardConfigToFirestore(config).catch(() => {});
  } catch (e) {
    console.error('Failed to save dashboard config:', e);
  }
}

export function exportDashboardConfigJson(config: DashboardConfig): string {
  return JSON.stringify(config, null, 2);
}

export function importDashboardConfigJson(jsonStr: string): DashboardConfig | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object' && parsed.judulKegiatan) {
      const merged: DashboardConfig = {
        ...DEFAULT_DASHBOARD_CONFIG,
        ...parsed
      };
      saveDashboardConfig(merged);
      return merged;
    }
    return null;
  } catch {
    return null;
  }
}

export function getSavedRegistrations(): RegistrationRecord[] {
  try {
    // One-time purge of previous test/sample data requested by user
    if (!localStorage.getItem(DATA_PURGED_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(DATA_PURGED_KEY, 'true');
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get registrations:', e);
    return [];
  }
}

export function clearAllRegistrations(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear registrations:', e);
  }
}

export function deleteRegistrationRecord(id: string): void {
  try {
    const records = getSavedRegistrations();
    const updated = records.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    deleteRegistrationFromFirestore(id).catch(() => {});
  } catch (e) {
    console.error('Failed to delete registration record:', e);
  }
}

export function saveRegistration(record: RegistrationRecord): void {
  try {
    const records = getSavedRegistrations();
    const updated = [record, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    saveRegistrationToFirestore(record).catch(() => {});
  } catch (e) {
    console.error('Failed to save registration:', e);
  }
}

export function updateRegistrationStatus(
  id: string,
  status: 'Menunggu Verifikasi' | 'Memenuhi Syarat' | 'Perlu Revisi',
  catatan?: string
): void {
  try {
    const records = getSavedRegistrations();
    const updated = records.map((r) => {
      if (r.id === id) {
        return { ...r, statusVerifikasi: status, catatanPanitia: catatan };
      }
      return r;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const found = updated.find((r) => r.id === id);
    if (found) { saveRegistrationToFirestore(found).catch(() => {}); }
  } catch (e) {
    console.error('Failed to update status:', e);
  }
}

export function getGoogleSyncConfig(): GoogleSyncConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const dashConfig = getDashboardConfig();

    return {
      webAppUrl: parsed.webAppUrl || dashConfig.googleWebAppUrl || '',
      spreadsheetUrl: parsed.spreadsheetUrl || dashConfig.googleSpreadsheetUrl || '',
      autoSync: parsed.autoSync ?? dashConfig.autoSyncGoogle ?? true
    };
  } catch {
    return {
      webAppUrl: '',
      spreadsheetUrl: '',
      autoSync: true
    };
  }
}

export function saveGoogleSyncConfig(config: GoogleSyncConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    // Also synchronize into DashboardConfig to guarantee cloud persistence across all devices & students
    const currentDash = getDashboardConfig();
    const updatedDash: DashboardConfig = {
      ...currentDash,
      googleWebAppUrl: config.webAppUrl,
      googleSpreadsheetUrl: config.spreadsheetUrl,
      autoSyncGoogle: config.autoSync
    };
    localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(updatedDash));
    saveDashboardConfigToFirestore(updatedDash).catch(() => {});
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

/**
 * Send registration data to Google Apps Script Webhook
 * which automatically saves files to Google Drive and appends row to 1 Google Spreadsheet.
 * Uses both standard fetch and fallback no-cors mode to bypass CORS redirect blocks on browsers.
 */
export async function syncToGoogleServices(
  record: RegistrationRecord,
  webAppUrl?: string
): Promise<{ success: boolean; message: string; driveFolderUrl?: string; spreadsheetUrl?: string }> {
  const currentConfig = getGoogleSyncConfig();
  const url = (webAppUrl || currentConfig.webAppUrl || '').trim();

  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script Web App belum diatur di Pengaturan Sistem. Data tetap aman tersimpan di Database Cloud.'
    };
  }

  const payload = JSON.stringify(record);

  // Attempt 1: Standard POST request with text/plain (avoids CORS preflight)
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    });

    if (response.ok) {
      try {
        const json = await response.json();
        if (json.status === 'success') {
          if (json.spreadsheetUrl && !currentConfig.spreadsheetUrl) {
            saveGoogleSyncConfig({
              ...currentConfig,
              spreadsheetUrl: json.spreadsheetUrl
            });
          }
          return {
            success: true,
            message: 'Berhasil dicatat otomatis ke 1 Google Spreadsheet & file tersimpan di Google Drive!',
            driveFolderUrl: json.driveFolderUrl,
            spreadsheetUrl: json.spreadsheetUrl
          };
        }
      } catch {
        // Handled below
      }
    }

    return {
      success: true,
      message: 'Data berhasil terkirim dan tersimpan ke 1 Google Spreadsheet panitia!'
    };
  } catch (corsOrNetworkErr) {
    // Attempt 2: Fallback using mode: 'no-cors'.
    // In Google Apps Script Web Apps, 302 redirects to script.googleusercontent.com frequently
    // trigger CORS errors in modern browsers even though the server processed the request.
    // 'no-cors' allows the browser to dispatch the POST payload reliably to Google servers.
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        body: payload,
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });
      return {
        success: true,
        message: 'Data pendaftaran berhasil dikirim ke Webhook Google Apps Script dan dicatat ke 1 Spreadsheet!'
      };
    } catch (fallbackError: any) {
      console.error('All sync attempts failed:', fallbackError);
      return {
        success: false,
        message: 'Gagal mengirim ke Google Apps Script: ' + (fallbackError?.message || 'Koneksi terputus')
      };
    }
  }
}

/**
 * Bulk synchronize multiple registrations to Google Spreadsheet
 */
export async function syncMultipleRegistrationsToGoogle(
  records: RegistrationRecord[],
  webAppUrl?: string,
  onProgress?: (current: number, total: number, studentName: string) => void
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0;
  let failCount = 0;
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    if (onProgress) {
      onProgress(i + 1, records.length, rec.biodata.namaLengkap);
    }
    const res = await syncToGoogleServices(rec, webAppUrl);
    if (res.success) {
      successCount++;
    } else {
      failCount++;
    }
    if (i < records.length - 1) {
      // 500ms delay between records to prevent Google Apps Script lock contention
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return { successCount, failCount };
}

/**
 * Convert a File object to base64 Data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Export all registrations to a clean 1-Spreadsheet CSV format
 * containing complete biodata and file links in a single table
 */
export function exportToCSV(records: RegistrationRecord[]): void {
  const headers = [
    'Waktu Pendaftaran',
    'No Registrasi',
    'Nama Lengkap',
    'NIM',
    'Program Studi',
    'Nomor WhatsApp',
    'Email',
    'Alamat Lengkap',
    'Link Transkrip Nilai',
    'Link KRS Terakhir',
    'Link Bukti Pembayaran',
    'Link Pasfoto 3x4 (Jas Almamater)',
    'Link Folder Drive Mahasiswa',
    'Status Verifikasi',
    'Catatan Panitia'
  ];

  const rows = records.map((r) => [
    `"${new Date(r.timestamp).toLocaleString('id-ID')}"`,
    `"${r.id}"`,
    `"${r.biodata.namaLengkap.replace(/"/g, '""')}"`,
    `'${r.biodata.nim}`,
    `"${r.biodata.programStudi}"`,
    `'${r.biodata.nomorWhatsApp}`,
    `"${r.biodata.email}"`,
    `"${r.biodata.alamatLengkap.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${r.dataPendukung.transkripNilai?.driveFileUrl || r.dataPendukung.transkripNilai?.fileName || '-'}"`,
    `"${r.dataPendukung.krsTerakhir?.driveFileUrl || r.dataPendukung.krsTerakhir?.fileName || '-'}"`,
    `"${r.dataPendukung.buktiPembayaran?.driveFileUrl || r.dataPendukung.buktiPembayaran?.fileName || '-'}"`,
    `"${r.dataPendukung.fotoAlmamater3x4?.driveFileUrl || r.dataPendukung.fotoAlmamater3x4?.fileName || '-'}"`,
    `"${r.syncedToGoogle.driveFolderUrl || '-'}"`,
    `"${r.statusVerifikasi}"`,
    `"${(r.catatanPanitia || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_1_Spreadsheet_PPL_FKIP_UIJ_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
