export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * SKRIP GOOGLE APPS SCRIPT: INTEGRASI 1 GOOGLE SPREADSHEET & GOOGLE DRIVE
 * PENDAFTARAN PRAKTIK PENGALAMAN LAPANGAN (PPL) FKIP UIJ
 * =========================================================================
 * 
 * PANDUAN PEMASANGAN CEPAT (HANYA 1 MENIT):
 * 1. Buka Google Spreadsheet baru (atau spreadsheet panitia yang sudah ada).
 * 2. Beri nama Spreadsheet, misal: "Data Pendaftar PPL FKIP UIJ 2025-2026".
 * 3. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 4. Hapus semua kode default di Apps Script, lalu TEMPELKAN seluruh skrip ini.
 * 5. Klik ikon "Simpan" (Ctrl+S / Cmd+S).
 * 6. Klik tombol biru "Terapkan" (Deploy) -> "Penerapan baru" (New deployment).
 * 7. Pada ikon Gerigi / roda gigi di sebelah kiri jenis penerapan, pilih "Aplikasi Web" (Web app).
 * 8. PENTING - Atur pengaturan berikut:
 *    - Deskripsi: Integrasi Web PPL FKIP UIJ
 *    - Jalankan sebagai (Execute as): "Saya" (akun Google panitia / Me)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone)
 * 9. Klik "Terapkan" (Deploy) -> Berikan izin akses (Authorize access) jika diminta.
 * 10. Salin URL Aplikasi Web (akhiran /exec) dan tempel ke panel pengaturan di aplikasi web PPL.
 * =========================================================================
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "Webhook PPL FKIP UIJ",
    message: "Endpoint Google Apps Script aktif dan siap mencatat pendaftaran ke Google Spreadsheet!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Data pendaftaran kosong (Empty payload)."
      })).setMimeType(ContentService.MimeType.JSON);
    }

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

    // 2. Simpan Berkas ke Google Drive (Dengan perlindungan try-catch penuh)
    var linkFolder = "";
    var linkTranskrip = "";
    var linkKrs = "";
    var linkPembayaran = "";
    var linkFoto = "";

    try {
      var mainFolderName = "Berkas PPL FKIP UIJ";
      var mainFolders = DriveApp.getFoldersByName(mainFolderName);
      var mainFolder;
      if (mainFolders.hasNext()) {
        mainFolder = mainFolders.next();
      } else {
        mainFolder = DriveApp.createFolder(mainFolderName);
      }

      // Buat subfolder khusus pendaftar: [NIM] - [Nama Mahasiswa]
      var nimStr = (data.biodata && data.biodata.nim) ? data.biodata.nim : "NIM";
      var namaStr = (data.biodata && data.biodata.namaLengkap) ? data.biodata.namaLengkap : "Mahasiswa";
      var studentFolderName = nimStr + " - " + namaStr;
      
      var studentFolder = mainFolder.createFolder(studentFolderName);
      try {
        studentFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (errFolderShare) {
        // Abaikan jika domain Google Workspace membatasi sharing publik
      }
      linkFolder = studentFolder.getUrl();

      // Fungsi simpan base64 ke Google Drive
      function saveBase64File(fileObj, prefix) {
        if (!fileObj || !fileObj.base64Data) return "";
        try {
          var parts = fileObj.base64Data.split(",");
          var base64Content = parts.length > 1 ? parts[1] : parts[0];
          var mimeType = fileObj.fileType || "application/octet-stream";
          var decoded = Utilities.base64Decode(base64Content);
          var ext = fileObj.fileName ? fileObj.fileName.split(".").pop() : "bin";
          var cleanName = prefix + "_" + nimStr + "." + ext;
          
          var blob = Utilities.newBlob(decoded, mimeType, cleanName);
          var createdFile = studentFolder.createFile(blob);
          try {
            createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (errFileShare) {}
          return createdFile.getUrl();
        } catch (err) {
          return "";
        }
      }

      if (data.dataPendukung) {
        linkTranskrip = saveBase64File(data.dataPendukung.transkripNilai, "Transkrip_Nilai");
        linkKrs = saveBase64File(data.dataPendukung.krsTerakhir, "KRS_Terakhir");
        linkPembayaran = saveBase64File(data.dataPendukung.buktiPembayaran, "Bukti_Pembayaran");
        linkFoto = saveBase64File(data.dataPendukung.fotoAlmamater3x4, "Foto_3x4_Jas_Almamater");
      }
    } catch (driveError) {
      Logger.log("Drive folder/file notice: " + driveError);
    }

    // Helper formula hyperlink agar di 1 spreadsheet panitia bisa langsung diklik
    function makeLinkFormula(url, label) {
      if (!url) return "-";
      return '=HYPERLINK("' + url + '"; "' + label + '")';
    }

    var regId = data.id || ("PPL-UIJ-" + new Date().getTime());
    var bio = data.biodata || {};

    // 3. Catat 1 Baris Lengkap: Biodata + Link Berkas ke dalam 1 Spreadsheet
    var rowData = [
      new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      regId,
      bio.namaLengkap || "",
      "'" + (bio.nim || ""),
      bio.programStudi || "",
      "'" + (bio.nomorWhatsApp || ""),
      bio.email || "",
      bio.alamatLengkap || "",
      makeLinkFormula(linkTranskrip, "📄 Buka Transkrip"),
      makeLinkFormula(linkKrs, "📄 Buka KRS"),
      makeLinkFormula(linkPembayaran, "💳 Buka Bukti Bayar"),
      makeLinkFormula(linkFoto, "👤 Buka Pasfoto 3x4"),
      makeLinkFormula(linkFolder, "📁 Buka Folder Drive"),
      data.statusVerifikasi || "Menunggu Verifikasi",
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
      message: "Data pendaftaran otomatis berhasil dicatat ke 1 Spreadsheet PPL!",
      spreadsheetUrl: ss.getUrl(),
      driveFolderUrl: linkFolder,
      rowNumber: lastRow,
      registrationId: regId
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
`;
