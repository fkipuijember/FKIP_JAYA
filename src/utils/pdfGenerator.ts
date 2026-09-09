import { jsPDF } from 'jspdf';
import { RegistrationRecord, DashboardConfig } from '../types';

export interface GeneratePdfOptions {
  record: RegistrationRecord;
  dashboardConfig?: DashboardConfig;
}

/**
 * Helper to sanitize filename string for safe download across operating systems
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Formats date into standard Indonesian locale representation
 */
function formatDateId(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatDateTimeId(dateString: string): string {
  try {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} pukul ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
  } catch {
    return dateString;
  }
}

/**
 * Generates and automatically downloads the official Registration Proof PDF (Kartu Bukti PPL FKIP UIJ)
 */
export async function downloadRegistrationCardPdf(
  record: RegistrationRecord,
  dashboardConfig?: DashboardConfig
): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm
  let currentY = 14;

  // ----------------------------------------------------
  // 1. KOP SURAT RESMI FKIP UNIVERSITAS ISLAM JEMBER
  // ----------------------------------------------------
  // Emerald institution accent strip at top
  doc.setFillColor(6, 95, 70); // #065f46 (emerald-800)
  doc.rect(margin, currentY, contentWidth, 2, 'F');
  currentY += 6;

  // Render Template Logo if available
  const logoData = dashboardConfig?.logoTemplateUrl;
  let hasLogo = false;
  if (logoData && typeof logoData === 'string' && logoData.startsWith('data:image/')) {
    try {
      const match = logoData.match(/^data:image\/([a-zA-Z+]+);base64,/);
      let imgType = match ? match[1].toUpperCase() : 'PNG';
      if (imgType === 'JPG') imgType = 'JPEG';
      doc.addImage(logoData, imgType, margin + 2, currentY + 0.5, 17, 17);
      hasLogo = true;
    } catch (err) {
      console.warn('Gagal menambahkan template logo ke PDF:', err);
    }
  }

  const textCenterX = hasLogo ? (pageWidth / 2 + 7) : (pageWidth / 2);

  // Institution text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('UNIVERSITAS ISLAM JEMBER', textCenterX, currentY + 3.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text('FAKULTAS KEGURUAN DAN ILMU PENDIDIKAN', textCenterX, currentY + 8.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    dashboardConfig?.lokasiKampus || 'Jl. Kyai Mojo No. 101, Kaliwates, Jember, Jawa Timur 68133',
    textCenterX,
    currentY + 12.5,
    { align: 'center' }
  );

  const contactInfo = [
    dashboardConfig?.emailPanitia ? `Email: ${dashboardConfig.emailPanitia}` : 'Email: fkip@uij.ac.id',
    dashboardConfig?.nomorWaPanitia ? `WhatsApp Panitia: ${dashboardConfig.nomorWaPanitia}` : 'Telp: (0331) 487224'
  ].join(' | ');
  doc.text(contactInfo, textCenterX, currentY + 16.5, { align: 'center' });

  currentY += 19;

  // Double horizontal rule (Garpu Kop Surat)
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.8);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 1;
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // ----------------------------------------------------
  // 2. JUDUL DOKUMEN & TAHUN AKADEMIK
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  const customTitle = (dashboardConfig?.judulBuktiPendaftaran?.trim()) || 'TANDA BUKTI PENDAFTARAN RESMI';
  doc.text(customTitle.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(6, 95, 70);
  const displayTahun = dashboardConfig?.tahunAkademik?.trim() || 'Tahun 2025/2026';
  const customSubtitle = (dashboardConfig?.subjudulBuktiPendaftaran?.trim()) || `PRAKTIK PENGALAMAN LAPANGAN (PPL) - ${displayTahun.toUpperCase()}`;
  doc.text(
    customSubtitle.toUpperCase(),
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 6;

  // ----------------------------------------------------
  // 3. REGISTRATION NUMBER & STATUS BOX
  // ----------------------------------------------------
  const regBoxHeight = 16;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(110, 231, 183); // emerald-300
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, regBoxHeight, 2, 2, 'FD');

  // Left column: Nomor Registrasi
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('NOMOR REGISTRASI RESMI PPL', margin + 5, currentY + 5.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(6, 78, 59); // emerald-900
  doc.text(record.id, margin + 5, currentY + 12);

  // Right column: Timestamp & Status
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Waktu Pendaftaran: ${formatDateTimeId(record.timestamp)}`, pageWidth - margin - 5, currentY + 5.5, {
    align: 'right',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87);
  doc.text('STATUS: TERDAFTAR & TERVERIFIKASI SISTEM', pageWidth - margin - 5, currentY + 11.5, {
    align: 'right',
  });

  currentY += regBoxHeight + 6;

  // ----------------------------------------------------
  // 4. BIODATA MAHASISWA & FOTO 3X4
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('A. BIODATA LENGKAP MAHASISWA', margin, currentY);
  currentY += 3;

  const photoWidth = 30;
  const photoHeight = 40;
  const photoX = pageWidth - margin - photoWidth;
  const photoY = currentY;

  // Render 3x4 Photo Frame
  doc.setFillColor(220, 38, 38); // red-600
  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(0.4);
  doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 1, 1, 'FD');

  let hasImage = false;
  const photoBase64 = record.dataPendukung.fotoAlmamater3x4?.base64Data;
  if (photoBase64 && typeof photoBase64 === 'string' && photoBase64.startsWith('data:image/')) {
    try {
      const match = photoBase64.match(/^data:image\/([a-zA-Z]+);base64,/);
      const imageFormat = match && match[1] ? match[1].toUpperCase() : 'JPEG';
      doc.addImage(photoBase64, imageFormat, photoX, photoY, photoWidth, photoHeight);
      hasImage = true;
    } catch {
      hasImage = false;
    }
  }

  if (!hasImage) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('PASFOTO 3X4', photoX + photoWidth / 2, photoY + photoHeight / 2 - 2, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text('JAS ALMAMATER', photoX + photoWidth / 2, photoY + photoHeight / 2 + 3, { align: 'center' });
  }

  // Label below photo
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Foto Resmi 3x4', photoX + photoWidth / 2, photoY + photoHeight + 3.5, { align: 'center' });

  // Biodata details on the left of the photo
  const bioWidth = contentWidth - photoWidth - 8;
  const bioYStart = currentY;
  let bioY = bioYStart;

  const biodataItems = [
    { label: 'Nama Lengkap', value: record.biodata.namaLengkap },
    { label: 'Nomor Induk Mahasiswa (NIM)', value: record.biodata.nim },
    { label: 'Program Studi', value: record.biodata.programStudi },
    { label: 'Nomor WhatsApp Aktif', value: record.biodata.nomorWhatsApp },
    { label: 'Alamat Email', value: record.biodata.email },
    { label: 'Alamat Rumah / Domisili', value: record.biodata.alamatLengkap },
  ];

  doc.setFontSize(8.5);
  biodataItems.forEach((item) => {
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(item.label, margin, bioY + 4);

    doc.text(':', margin + 46, bioY + 4);

    // Value (handles wrapping for long address)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const valueLines = doc.splitTextToSize(item.value || '-', bioWidth - 50);
    doc.text(valueLines, margin + 49, bioY + 4);

    const itemHeight = Math.max(6.5, valueLines.length * 4.2 + 2);
    // Subtle separator line
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, bioY + itemHeight, margin + bioWidth, bioY + itemHeight);

    bioY += itemHeight;
  });

  currentY = Math.max(bioY + 4, photoY + photoHeight + 8);

  // ----------------------------------------------------
  // 5. KELENGKAPAN BERKAS PERSYARATAN
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('B. STATUS KELENGKAPAN BERKAS PERSYARATAN', margin, currentY);
  currentY += 3;

  // Table header
  const tableHeaderY = currentY;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.rect(margin, tableHeaderY, contentWidth, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('NO', margin + 3, tableHeaderY + 4.2);
  doc.text('JENIS DOKUMEN / BERKAS', margin + 12, tableHeaderY + 4.2);
  doc.text('NAMA BERKAS DIGITAL TERUNGGAH', margin + 80, tableHeaderY + 4.2);
  doc.text('STATUS', pageWidth - margin - 15, tableHeaderY + 4.2, { align: 'center' });

  currentY += 6;

  const docs = [
    {
      no: '1',
      title: 'Transkrip Nilai Akademik Terakhir',
      fileName: record.dataPendukung.transkripNilai?.fileName || 'transkrip_nilai.pdf',
    },
    {
      no: '2',
      title: 'Kartu Rencana Studi (KRS) Semester Terakhir',
      fileName: record.dataPendukung.krsTerakhir?.fileName || 'krs_terakhir.pdf',
    },
    {
      no: '3',
      title: 'Bukti Pembayaran Pendaftaran PPL',
      fileName: record.dataPendukung.buktiPembayaran?.fileName || 'bukti_bayar_ppl.jpg',
    },
    {
      no: '4',
      title: 'Pasfoto 3x4 Jas Almamater (Background Merah)',
      fileName: record.dataPendukung.fotoAlmamater3x4?.fileName || 'pasfoto_3x4.jpg',
    },
  ];

  doc.setFontSize(7.5);
  docs.forEach((d) => {
    const rowHeight = 6;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, rowHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(d.no, margin + 4, currentY + 4.2);
    doc.text(d.title, margin + 12, currentY + 4.2);

    doc.setTextColor(15, 23, 42);
    const truncatedFile = doc.splitTextToSize(d.fileName, 70)[0] || d.fileName;
    doc.text(truncatedFile, margin + 80, currentY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text('TERVERIFIKASI', pageWidth - margin - 15, currentY + 4.2, { align: 'center' });

    currentY += rowHeight;
  });

  currentY += 5;

  // ----------------------------------------------------
  // 6. CATATAN & PETUNJUK RESMI + INFORMASI WA GRUP PPL
  // ----------------------------------------------------
  const hasWaLink = Boolean(dashboardConfig?.linkWaGrup && dashboardConfig.linkWaGrup.trim().length > 0);
  const notesHeight = hasWaLink ? 22 : 14;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, notesHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CATATAN DAN KETENTUAN PANITIA:', margin + 4, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    '1. Kartu ini merupakan dokumen bukti sah bahwa mahasiswa telah terdaftar pada PPL FKIP UIJ.',
    margin + 4,
    currentY + 8
  );
  doc.text(
    '2. Simpan file PDF ini dengan baik dan tunjukkan saat verifikasi berkas / pembekalan PPL.',
    margin + 4,
    currentY + 11.5
  );

  if (hasWaLink && dashboardConfig?.linkWaGrup) {
    const waUrl = dashboardConfig.linkWaGrup.trim();
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text('3. Link WhatsApp Grup Resmi PPL:', margin + 4, currentY + 15.5);
    
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(2, 132, 199); // blue link
    doc.textWithLink(waUrl, margin + 55, currentY + 15.5, { url: waUrl });

    if (dashboardConfig.pesanWaGrup) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      const pesanSnippet = doc.splitTextToSize(`* ${dashboardConfig.pesanWaGrup}`, contentWidth - 8)[0];
      doc.text(pesanSnippet, margin + 4, currentY + 19.5);
    }
  }

  currentY += notesHeight + 5;

  // ----------------------------------------------------
  // 7. LEMBAR TANDA TANGAN (MAHASISWA & PANITIA)
  // ----------------------------------------------------
  const sigY = currentY;
  const col1X = margin + 25;
  const col2X = pageWidth - margin - 45;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  // Left: Mahasiswa
  doc.text('Mahasiswa Pendaftar,', col1X, sigY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(record.biodata.namaLengkap, col1X, sigY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIM: ${record.biodata.nim}`, col1X, sigY + 24, { align: 'center' });

  // Right: Panitia PPL
  const tanggalSurat = formatDateId(record.timestamp);
  const jabatanPanitia = dashboardConfig?.jabatanPanitiaPpl || 'Panitia PPL FKIP UIJ';
  const namaPanitia = dashboardConfig?.namaPanitiaPpl || '( Panitia PPL FKIP )';
  const nidnPanitia = dashboardConfig?.nidnPanitiaPpl ? `NIDN/NIY: ${dashboardConfig.nidnPanitiaPpl}` : 'NIDN / Panitia Pelaksana';

  doc.text(`Jember, ${tanggalSurat}`, col2X, sigY, { align: 'center' });
  doc.text(`${jabatanPanitia},`, col2X, sigY + 4, { align: 'center' });

  // Tanda Tangan Panitia PPL (Image or Stempel Resmi)
  const ttdData = dashboardConfig?.ttdPanitiaUrl;
  let hasTtd = false;
  if (ttdData && typeof ttdData === 'string' && ttdData.startsWith('data:image/')) {
    try {
      const match = ttdData.match(/^data:image\/([a-zA-Z+]+);base64,/);
      let imgType = match ? match[1].toUpperCase() : 'PNG';
      if (imgType === 'JPG') imgType = 'JPEG';
      doc.addImage(ttdData, imgType, col2X - 16, sigY + 5.5, 32, 13);
      hasTtd = true;
    } catch (err) {
      console.warn('Gagal menambahkan tanda tangan panitia ke PDF:', err);
    }
  }

  // Jika tidak ada TTD upload, gambar stempel resmi terverifikasi
  if (!hasTtd) {
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.4);
    doc.roundedRect(col2X - 18, sigY + 6, 36, 12, 2, 2, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(5, 150, 105);
    doc.text('PANITIA PPL FKIP UIJ', col2X, sigY + 11, { align: 'center' });
    doc.setFontSize(5.5);
    doc.text('DOKUMEN SAH TERVERIFIKASI', col2X, sigY + 15, { align: 'center' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(namaPanitia, col2X, sigY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(nidnPanitia, col2X, sigY + 24, { align: 'center' });

  // ----------------------------------------------------
  // 8. FOOTER RESMI DOKUMEN
  // ----------------------------------------------------
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen digital resmi diterbitkan otomatis oleh Sistem Informasi Pendaftaran PPL FKIP UIJ pada ${formatDateTimeId(
      new Date().toISOString()
    )}`,
    pageWidth / 2,
    287,
    { align: 'center' }
  );

  // Generate clean filename
  const safeNim = sanitizeFileName(record.biodata.nim || 'Mahasiswa');
  const safeNama = sanitizeFileName(record.biodata.namaLengkap || 'PPL');
  const fileName = `Bukti_Pendaftaran_PPL_${safeNim}_${safeNama}.pdf`;

  // Trigger automatic download
  doc.save(fileName);
  return fileName;
}
