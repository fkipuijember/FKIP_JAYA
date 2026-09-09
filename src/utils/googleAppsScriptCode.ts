export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: PENDAFTARAN PPL FKIP UNIVERSITAS ISLAM JEMBER (UIJ)
 * =========================================================================
 * KONSEP SISTEM: CUKUP 1 SPREADSHEET UNTUK SEMUA BIODATA & LINK BERKAS
 * 
 * Skrip ini dipasang langsung pada 1 file Google Spreadsheet panitia.
 * Setiap ada mahasiswa yang mendaftar (TANPA LOGIN MAHASISWA):
 * 1. Berkas otomatis tersimpan rapi ke Google Drive Panitia (Folder: "Berkas PPL FKIP UIJ")
 * 2. Seluruh BIODATA dan TAUTAN LANGSUNG (LINK) ke 4 berkas upload
 *    otomatis dicatat ke dalam 1 BARIS pada SPREADSHEET INI.
 * 
 * CARA PEMASANGAN CEPAT (2 MENIT):
 * 1. Buka 1 Google Spreadsheet baru di akun Google Panitia / FKIP UIJ (misal: "Rekap PPL FKIP UIJ 2025").
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus kode bawaan myFunction(), lalu paste (tempel) seluruh kode di bawah ini.
 * 4. Klik ikon Disket (Simpan).
 * 5. Klik tombol biru "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment).
 * 6. Klik ikon Roda Gigi di samping 'Pilih jenis' > pilih "Aplikasi Web" (Web App).
 * 7. Konfigurasi penerapan:
 *    - Deskripsi: Webhook PPL FKIP UIJ
 *    - Jalankan sebagai (Execute as): "Saya" (Me)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone)
 * 8. Klik "Terapkan", lalu klik "Berikan akses" (Authorize Access) akun Google Anda.
 * 9. Salin URL Aplikasi Web (akhiran /exec) dan tempel ke panel pengaturan di aplikasi web PPL.
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    // 1. Dapatkan Spreadsheet aktif (Cukup 1 Spreadsheet ini)
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Pendaftar PPL";
    var sheet = ss.getSheetByName(sheetName);
    
    // Jika sheet belum ada, buat sheet baru dan atur 15 kolom header rapi
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        "Waktu Pendaftaran",
        "No. Registrasi",
        "Nama Lengkap",
        "NIM",
        "Program Studi",
        "Nomor WhatsApp",
        "Email",
        "Alamat Lengkap",
        "Link Transkrip Nilai",
        "Link KRS Terakhir",
        "Link Bukti Pembayaran",
        "Link Pasfoto 3x4 (Jas Almamater)",
        "Link Folder Drive Mahasiswa",
        "Status Verifikasi",
        "Catatan Panitia"
      ]);
      
      // Styling Header (Hijau UIJ khas FKIP)
      var headerRange = sheet.getRange(1, 1, 1, 15);
      headerRange.setBackground("#047857");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      headerRange.setVerticalAlignment("middle");
      sheet.setRowHeight(1, 36);
      sheet.setFrozenRows(1);
    }

    // 2. Buat / Dapatkan Folder Google Drive Utama Panitia
    var mainFolderName = "Berkas PPL FKIP UIJ";
    var mainFolders = DriveApp.getFoldersByName(mainFolderName);
    var mainFolder;
    if (mainFolders.hasNext()) {
      mainFolder = mainFolders.next();
    } else {
      mainFolder = DriveApp.createFolder(mainFolderName);
    }

    // Buat subfolder khusus pendaftar: [NIM] - [Nama Mahasiswa]
    var studentFolderName = (data.biodata.nim || "NIM") + " - " + (data.biodata.namaLengkap || "Mahasiswa");
    var studentFolder = mainFolder.createFolder(studentFolderName);
    studentFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 3. Simpan 4 Berkas Unggahan ke Google Drive & Ambil URL Langsungnya
    function saveBase64File(fileObj, prefix) {
      if (!fileObj || !fileObj.base64Data) return "";
      try {
        var parts = fileObj.base64Data.split(",");
        var base64Content = parts.length > 1 ? parts[1] : parts[0];
        var mimeType = fileObj.fileType || "application/octet-stream";
        var decoded = Utilities.base64Decode(base64Content);
        var ext = fileObj.fileName ? fileObj.fileName.split(".").pop() : "bin";
        var cleanName = prefix + "_" + (data.biodata.nim || "UIJ") + "." + ext;
        
        var blob = Utilities.newBlob(decoded, mimeType, cleanName);
        var createdFile = studentFolder.createFile(blob);
        createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return createdFile.getUrl();
      } catch (err) {
        return "";
      }
    }

    var linkTranskrip = saveBase64File(data.dataPendukung.transkripNilai, "Transkrip_Nilai");
    var linkKrs = saveBase64File(data.dataPendukung.krsTerakhir, "KRS_Terakhir");
    var linkPembayaran = saveBase64File(data.dataPendukung.buktiPembayaran, "Bukti_Pembayaran");
    var linkFoto = saveBase64File(data.dataPendukung.fotoAlmamater3x4, "Foto_3x4_Jas_Almamater");
    var linkFolder = studentFolder.getUrl();

    // Helper formula hyperlink agar di 1 spreadsheet panitia bisa langsung diklik
    function makeLinkFormula(url, label) {
      if (!url) return "-";
      return '=HYPERLINK("' + url + '"; "' + label + '")';
    }

    // 4. Catat 1 Baris Lengkap: Biodata + Link Berkas ke dalam 1 Spreadsheet
    var rowData = [
      new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      data.id || "PPL-UIJ-" + new Date().getTime(),
      data.biodata.namaLengkap || "",
      "'" + (data.biodata.nim || ""),
      data.biodata.programStudi || "",
      "'" + (data.biodata.nomorWhatsApp || ""),
      data.biodata.email || "",
      data.biodata.alamatLengkap || "",
      makeLinkFormula(linkTranskrip, "📄 Buka Transkrip"),
      makeLinkFormula(linkKrs, "📄 Buka KRS"),
      makeLinkFormula(linkPembayaran, "💳 Buka Bukti Bayar"),
      makeLinkFormula(linkFoto, "👤 Buka Pasfoto 3x4"),
      makeLinkFormula(linkFolder, "📁 Buka Folder Drive"),
      "Menunggu Verifikasi",
      data.catatanPanitia || ""
    ];

    sheet.appendRow(rowData);

    // Format baris baru agar rapi
    var lastRow = sheet.getLastRow();
    var newRowRange = sheet.getRange(lastRow, 1, 1, 15);
    newRowRange.setVerticalAlignment("middle");
    sheet.setRowHeight(lastRow, 28);

    // Respons balik ke aplikasi
    var response = {
      status: "success",
      message: "Data biodata dan link berkas berhasil dicatat ke 1 Spreadsheet PPL!",
      spreadsheetUrl: ss.getUrl(),
      driveFolderUrl: linkFolder,
      files: {
        transkrip: linkTranskrip,
        krs: linkKrs,
        pembayaran: linkPembayaran,
        foto: linkFoto
      }
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errorResponse = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Webhook PPL FKIP UIJ aktif dan siap mencatat ke 1 Spreadsheet.",
    spreadsheetName: ss.getName(),
    spreadsheetUrl: ss.getUrl()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
