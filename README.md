# Sistem Pendaftaran PPL FKIP UIJ

Aplikasi Pendaftaran Praktik Pengalaman Lapangan (PPL) Fakultas Keguruan dan Ilmu Pendidikan, Universitas Islam Jember.

## 🚀 Panduan Integrasi & Deploy ke Vercel

Aplikasi ini menggunakan **React 19 + Vite** dan telah dilengkapi konfigurasi `vercel.json` untuk *Single Page Application* (SPA) dengan *clean routing* dan *cache control*.

### Cara 1: Deploy Otomatis via GitHub (Direkomendasikan)
1. Export proyek ini ke repository GitHub Anda (bisa melalui tombol **Export to GitHub** di menu Google AI Studio).
2. Buka dashboard [Vercel](https://vercel.com) dan login dengan akun Anda.
3. Klik tombol **"Add New..."** lalu pilih **"Project"**.
4. Import repository GitHub aplikasi ini.
5. Vercel akan secara otomatis mendeteksi framework **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Klik **"Deploy"**. Dalam hitungan detik, aplikasi akan tayang di domain kustom Vercel Anda (contoh: `https://ppl-fkip-uij.vercel.app`).

---

### Cara 2: Deploy Cepat via Vercel CLI
Jika Anda mengunduh kode ke komputer lokal:
```bash
# 1. Install Vercel CLI (jika belum ada)
npm i -g vercel

# 2. Login ke Vercel
vercel login

# 3. Jalankan deploy
vercel

# 4. Untuk deploy langsung ke production:
vercel --prod
```

---

## 🛠 Fitur Aplikasi
- **Pendaftaran Mandiri Mahasiswa**: Tanpa login, validasi berkas otomatis (KRS, Slip UKT, Transkrip, Pasfoto).
- **Cetak Bukti PDF Otomatis**: Dilengkapi kop surat resmi, template logo, judul kustom, dan tanda tangan (TTD) panitia pelaksana.
- **Link WhatsApp Grup PPL**: Banner undangan langsung untuk komunikasi mahasiswa & panitia.
- **Dashboard Admin & Pengaturan Sistem**: Edit kop surat, judul bukti, logo, tanda tangan panitia, dan sinkronisasi data ke Google Spreadsheet & Drive.
