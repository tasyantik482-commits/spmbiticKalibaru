/**
 * ============================================================================
 * GOOGLE APPS SCRIPT — PORTAL SPMB SDIT INSAN CENDEKIA (SD ITIC) KALIBARU
 * ============================================================================
 * Target Spreadsheet ID : 1b9aQUoVH1PSunV63VvaoMUt2S38DlSgYgc--CpqAhsw
 * Fitur Utama:
 * 1. Penomoran pendaftaran otomatis & atomik (LockService) -> SPMB-IC-2026-0001
 * 2. Validasi data wajib & batas ukuran berkas maksimal 900 KB per file
 * 3. Unggah Kartu Keluarga, Akta Kelahiran, dan Pas Foto 4x6 ke Google Drive
 * 4. Pencarian & cek status pendaftar berdasarkan Nomor Pendaftaran + No. HP
 * 5. Endpoint Admin terproteksi (list pendaftar, download berkas, update status)
 * ============================================================================
 */

const SPREADSHEET_ID = '1b9aQUoVH1PSunV63VvaoMUt2S38DlSgYgc--CpqAhsw';
const SHEET_NAME = 'Pendaftar_SPMB';
const DRIVE_FOLDER_NAME = 'Berkas_SPMB_SDIT_IC_Kalibaru';
const DRIVE_FOLDER_ID = ''; // Opsional: isi ID folder Drive jika ingin mengarahkan ke folder tertentu
const REG_PREFIX = 'SPMB-IC-2026-';
const MAX_FILE_BYTES = 900 * 1024; // 900 KB

const ADMIN_USER = 'Tasya';
const ADMIN_PASS = 'Love_Tasya';

const HEADERS = [
  'Nomor Pendaftaran',
  'Waktu Daftar',
  'Nama Lengkap Calon Murid',
  'Nama Orang Tua/Wali',
  'Nomor Telepon/WhatsApp',
  'Tinggi Badan (cm)',
  'Berat Badan (kg)',
  'Lingkar Kepala (cm)',
  'Email',
  'Tanggal Lahir',
  'Jenis Kelamin',
  'Asal TK/PAUD',
  'Catatan untuk Sekolah',
  'URL Kartu Keluarga',
  'URL Akta Kelahiran',
  'URL Pas Foto 4x6',
  'Persetujuan Data & Kontak',
  'Status Verifikasi',
  'Catatan Panitia',
  'Folder Berkas Drive'
];

/**
 * Inisialisasi awal sheet & header (opsional dijalankan manual sekali,
 * atau otomatis terpanggil saat ada pendaftar pertama).
 */
function setupSpreadsheet() {
  const sheet = getOrCreateSheet_();
  getOrCreateRootFolder_();
  return {
    status: 'ok',
    sheetName: sheet.getName(),
    spreadsheetId: SPREADSHEET_ID
  };
}

/**
 * Endpoint GET:
 * - ?action=ping -> Mengecek koneksi Apps Script & Spreadsheet
 * - ?action=checkStatus&noPendaftaran=...&noTelepon=... -> Cek status pendaftar
 * - ?action=listRegistrations&adminUser=...&adminPass=... -> Data dashboard admin
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'checkStatus';

    if (action === 'ping') {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = getOrCreateSheet_();
      const totalPendaftar = Math.max(0, sheet.getLastRow() - 1);
      let driveOk = true;
      let driveNote = 'Akses Google Drive aktif.';
      try {
        getOrCreateRootFolder_();
      } catch (driveErr) {
        driveOk = false;
        driveNote = 'Akses DriveApp bermasalah: ' + driveErr.message;
      }
      return jsonResponse_({
        ok: driveOk,
        message: driveOk
          ? 'Koneksi Apps Script, Spreadsheet, dan Google Drive aktif.'
          : driveNote,
        error: driveOk ? '' : driveNote,
        spreadsheetTitle: ss.getName(),
        spreadsheetId: SPREADSHEET_ID,
        totalPendaftar: totalPendaftar
      });
    }

    if (action === 'listRegistrations') {
      if (!isValidAdmin_(params.adminUser, params.adminPass)) {
        return jsonResponse_({
          ok: false,
          error: 'Akses ditolak. Username atau password admin tidak valid.'
        });
      }

      const sheet = getOrCreateSheet_();
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return jsonResponse_({ ok: true, data: [] });
      }

      const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
      const list = [];
      for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i];
        if (!row[0]) continue;
        const kkUrl = String(row[13] || '');
        const aktaUrl = String(row[14] || '');
        const fotoUrl = String(row[15] || '');

        list.push({
          noPendaftaran: String(row[0] || ''),
          waktuDaftar: formatDateIso_(row[1]),
          namaCalonMurid: String(row[2] || ''),
          namaOrangTua: String(row[3] || ''),
          noTelepon: String(row[4] || ''),
          tinggiBadan: Number(row[5]) || 0,
          beratBadan: Number(row[6]) || 0,
          lingkarKepala: Number(row[7]) || 0,
          email: String(row[8] || ''),
          tanggalLahir: row[9] ? formatShortDate_(row[9]) : '',
          jenisKelamin: String(row[10] || ''),
          asalTkPaud: String(row[11] || ''),
          catatanSekolah: String(row[12] || ''),
          urlKartuKeluarga: kkUrl,
          downloadKartuKeluarga: toDriveDownloadUrl_(kkUrl),
          urlAktaKelahiran: aktaUrl,
          downloadAktaKelahiran: toDriveDownloadUrl_(aktaUrl),
          urlPasFoto: fotoUrl,
          downloadPasFoto: toDriveDownloadUrl_(fotoUrl),
          persetujuanInfo: String(row[16] || ''),
          statusVerifikasi: String(row[17] || 'Menunggu Verifikasi'),
          catatanPanitia: String(row[18] || ''),
          folderUrl: String(row[19] || '')
        });
      }

      return jsonResponse_({ ok: true, data: list });
    }

    if (action === 'checkStatus') {
      const noPendaftaran = String(params.noPendaftaran || '').trim().toUpperCase();
      const noTeleponInput = normalizePhone_(params.noTelepon || '');

      if (!noPendaftaran || !noTeleponInput) {
        return jsonResponse_({
          ok: false,
          error: 'Nomor pendaftaran dan nomor telepon/WhatsApp wajib diisi.'
        });
      }

      const sheet = getOrCreateSheet_();
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return jsonResponse_({
          ok: false,
          error: 'Data pendaftar tidak ditemukan. Periksa kembali nomor pendaftaran dan nomor telepon Anda.'
        });
      }

      const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNo = String(row[0] || '').trim().toUpperCase();
        const rowPhone = normalizePhone_(String(row[4] || ''));

        if (rowNo === noPendaftaran && rowPhone === noTeleponInput) {
          return jsonResponse_({
            ok: true,
            data: {
              noPendaftaran: row[0],
              waktuDaftar: formatDateIso_(row[1]),
              namaCalonMurid: row[2],
              namaOrangTua: row[3],
              noTelepon: row[4],
              tinggiBadan: row[5],
              beratBadan: row[6],
              lingkarKepala: row[7],
              email: row[8] || '-',
              tanggalLahir: row[9] ? formatShortDate_(row[9]) : '-',
              jenisKelamin: row[10] || '-',
              asalTkPaud: row[11] || '-',
              catatanSekolah: row[12] || '-',
              urlKartuKeluarga: row[13],
              urlAktaKelahiran: row[14],
              urlPasFoto: row[15],
              statusVerifikasi: row[17] || 'Menunggu Verifikasi',
              catatanPanitia: row[18] || 'Berkas telah diterima sistem. Panitia SPMB SDIT Insan Cendekia Kalibaru akan melakukan verifikasi dan menghubungi melalui WhatsApp.'
            }
          });
        }
      }

      return jsonResponse_({
        ok: false,
        error: 'Data tidak ditemukan atau kombinasi Nomor Pendaftaran dan Nomor Telepon tidak cocok.'
      });
    }

    return jsonResponse_({ ok: false, error: 'Parameter action tidak dikenal.' });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: 'Terjadi kesalahan server Apps Script: ' + err.message
    });
  }
}

/**
 * Endpoint POST:
 * - action === 'updateStatus' -> Memperbarui status & catatan panitia oleh Admin
 * - default -> Menerima pendaftaran baru beserta 3 berkas Base64 (maks 900 KB/berkas)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: 'Payload request kosong.' });
    }

    const payload = JSON.parse(e.postData.contents);

    // Handler update status oleh Admin
    if (payload.action === 'updateStatus') {
      if (!isValidAdmin_(payload.adminUser, payload.adminPass)) {
        return jsonResponse_({
          ok: false,
          error: 'Akses ditolak. Username atau password admin tidak valid.'
        });
      }

      const targetNo = String(payload.noPendaftaran || '').trim().toUpperCase();
      const newStatus = String(payload.statusVerifikasi || '').trim();
      const newNote = String(payload.catatanPanitia || '').trim();

      if (!targetNo || !newStatus) {
        return jsonResponse_({
          ok: false,
          error: 'Nomor pendaftaran dan status verifikasi wajib diisi.'
        });
      }

      const sheet = getOrCreateSheet_();
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return jsonResponse_({ ok: false, error: 'Data pendaftar tidak ditemukan.' });
      }

      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0] || '').trim().toUpperCase() === targetNo) {
          const rowIndex = i + 2;
          sheet.getRange(rowIndex, 18).setValue(newStatus);
          sheet.getRange(rowIndex, 19).setValue(newNote);
          return jsonResponse_({
            ok: true,
            data: {
              noPendaftaran: targetNo,
              statusVerifikasi: newStatus,
              catatanPanitia: newNote
            }
          });
        }
      }

      return jsonResponse_({ ok: false, error: 'Nomor pendaftaran tidak ditemukan.' });
    }

    // 1. Validasi field wajib pendaftaran baru
    const namaCalonMurid = String(payload.namaCalonMurid || '').trim();
    const namaOrangTua = String(payload.namaOrangTua || '').trim();
    const noTeleponRaw = String(payload.noTelepon || '').trim();
    const tinggiBadan = Number(payload.tinggiBadan);
    const beratBadan = Number(payload.beratBadan);
    const lingkarKepala = Number(payload.lingkarKepala);
    const persetujuan = Boolean(payload.persetujuan);

    if (!namaCalonMurid || !namaOrangTua || !noTeleponRaw) {
      return jsonResponse_({
        ok: false,
        error: 'Nama calon murid, nama orang tua/wali, dan nomor telepon wajib diisi.'
      });
    }

    if (!tinggiBadan || tinggiBadan <= 0 || !beratBadan || beratBadan <= 0 || !lingkarKepala || lingkarKepala <= 0) {
      return jsonResponse_({
        ok: false,
        error: 'Tinggi badan, berat badan, dan lingkar kepala wajib diisi dengan angka valid.'
      });
    }

    if (!persetujuan) {
      return jsonResponse_({
        ok: false,
        error: 'Persetujuan kebenaran data dan izin kontak panitia wajib dicentang.'
      });
    }

    const files = payload.files || {};
    if (!files.kartuKeluarga || !files.aktaKelahiran || !files.pasFoto) {
      return jsonResponse_({
        ok: false,
        error: 'Ketiga berkas wajib (Kartu Keluarga, Akta Kelahiran, dan Pas Foto 4x6) harus dilampirkan.'
      });
    }

    // 2. Validasi ukuran masing-masing berkas <= 900 KB
    validateFilePayload_(files.kartuKeluarga, 'Kartu Keluarga');
    validateFilePayload_(files.aktaKelahiran, 'Akta Kelahiran');
    validateFilePayload_(files.pasFoto, 'Pas Foto 4x6');

    // 3. Siapkan Sheet & Nomor Pendaftaran Otomatis (Atomic)
    const sheet = getOrCreateSheet_();
    const noPendaftaran = generateNextRegNumber_(sheet);
    const waktuDaftar = new Date();

    // 4. Simpan berkas ke Google Drive dalam subfolder per pendaftar
    const rootFolder = getOrCreateRootFolder_();
    const safeName = namaCalonMurid.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 40) || 'Pendaftar';
    const applicantFolder = rootFolder.createFolder(noPendaftaran + ' - ' + safeName);

    const kkUrl = saveBase64ToDrive_(applicantFolder, files.kartuKeluarga, noPendaftaran + '_Kartu_Keluarga');
    const aktaUrl = saveBase64ToDrive_(applicantFolder, files.aktaKelahiran, noPendaftaran + '_Akta_Kelahiran');
    const fotoUrl = saveBase64ToDrive_(applicantFolder, files.pasFoto, noPendaftaran + '_Pas_Foto_4x6');

    // 5. Simpan baris data ke Google Spreadsheet
    const statusDefault = 'Menunggu Verifikasi';
    const catatanPanitiaDefault = 'Berkas telah diterima sistem. Menunggu verifikasi panitia SPMB SDIT Insan Cendekia Kalibaru.';

    const rowData = [
      noPendaftaran,
      waktuDaftar,
      namaCalonMurid,
      namaOrangTua,
      "'" + normalizeDisplayPhone_(noTeleponRaw),
      tinggiBadan,
      beratBadan,
      lingkarKepala,
      String(payload.email || '').trim(),
      String(payload.tanggalLahir || '').trim(),
      String(payload.jenisKelamin || '').trim(),
      String(payload.asalTkPaud || '').trim(),
      String(payload.catatanSekolah || '').trim(),
      kkUrl,
      aktaUrl,
      fotoUrl,
      'Disetujui pada ' + Utilities.formatDate(waktuDaftar, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm') + ' WIB',
      statusDefault,
      catatanPanitiaDefault,
      applicantFolder.getUrl()
    ];

    sheet.appendRow(rowData);

    return jsonResponse_({
      ok: true,
      data: {
        noPendaftaran: noPendaftaran,
        waktuDaftar: waktuDaftar.toISOString(),
        namaCalonMurid: namaCalonMurid,
        namaOrangTua: namaOrangTua,
        noTelepon: normalizeDisplayPhone_(noTeleponRaw),
        statusVerifikasi: statusDefault,
        catatanPanitia: catatanPanitiaDefault,
        urlKartuKeluarga: kkUrl,
        urlAktaKelahiran: aktaUrl,
        urlPasFoto: fotoUrl
      }
    });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (msg.indexOf('DriveApp') !== -1 || msg.indexOf('Access denied') !== -1) {
      return jsonResponse_({
        ok: false,
        error:
          'Izin Google Drive (DriveApp) ditolak oleh Apps Script. Solusi: (1) Jalankan fungsi setupSpreadsheet di editor Apps Script lalu klik Allow; (2) Pada Deploy > Kelola deployment, pastikan "Jalankan sebagai: Saya (Me)" dan terapkan Versi Baru; (3) Jika menggunakan akun belajar.id/Workspace yang membatasi DriveApp, buat deployment Apps Script menggunakan akun Gmail biasa (misal sditic08@gmail.com) yang diberi akses Editor ke Spreadsheet.'
      });
    }
    return jsonResponse_({
      ok: false,
      error: 'Gagal memproses permintaan: ' + msg
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {
      // Abaikan jika lock sudah dilepas
    }
  }
}

/* ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================ */

function isValidAdmin_(user, pass) {
  return String(user || '').trim() === ADMIN_USER && String(pass || '') === ADMIN_PASS;
}

function toDriveDownloadUrl_(url) {
  const str = String(url || '');
  const match = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return 'https://drive.google.com/uc?export=download&id=' + match[1];
  }
  return str;
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#0E6245');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateRootFolder_() {
  if (DRIVE_FOLDER_ID) {
    return DriveApp.getFolderById(DRIVE_FOLDER_ID);
  }
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

function generateNextRegNumber_(sheet) {
  const lastRow = sheet.getLastRow();
  let maxNumber = 0;

  if (lastRow >= 2) {
    const existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < existingIds.length; i++) {
      const val = String(existingIds[i][0] || '').trim();
      if (val.indexOf(REG_PREFIX) === 0) {
        const numPart = parseInt(val.replace(REG_PREFIX, ''), 10);
        if (!isNaN(numPart) && numPart > maxNumber) {
          maxNumber = numPart;
        }
      }
    }
  }

  const nextNum = maxNumber + 1;
  const padded = String(nextNum).padStart(4, '0');
  return REG_PREFIX + padded;
}

function validateFilePayload_(fileObj, label) {
  if (!fileObj || !fileObj.base64 || !fileObj.mimeType) {
    throw new Error('Berkas ' + label + ' tidak valid.');
  }
  const decodedBytes = Utilities.base64Decode(fileObj.base64);
  if (decodedBytes.length > MAX_FILE_BYTES) {
    throw new Error('Ukuran berkas ' + label + ' melebihi batas maksimal 900 KB.');
  }
}

function saveBase64ToDrive_(folder, fileObj, baseFileName) {
  const bytes = Utilities.base64Decode(fileObj.base64);
  const ext = getExtensionFromMime_(fileObj.mimeType, fileObj.fileName);
  const blob = Utilities.newBlob(bytes, fileObj.mimeType, baseFileName + ext);
  const createdFile = folder.createFile(blob);
  try {
    createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    // Tetap lanjutkan jika kebijakan domain Workspace membatasi berbagi tautan publik
  }
  return createdFile.getUrl();
}

function getExtensionFromMime_(mimeType, originalName) {
  const lowerMime = String(mimeType || '').toLowerCase();
  if (lowerMime.indexOf('pdf') !== -1) return '.pdf';
  if (lowerMime.indexOf('png') !== -1) return '.png';
  if (lowerMime.indexOf('jpeg') !== -1 || lowerMime.indexOf('jpg') !== -1) return '.jpg';
  if (originalName && originalName.indexOf('.') !== -1) {
    return originalName.substring(originalName.lastIndexOf('.'));
  }
  return '.bin';
}

function normalizePhone_(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.indexOf('62') === 0) {
    digits = '0' + digits.substring(2);
  }
  return digits;
}

function normalizeDisplayPhone_(raw) {
  const digits = normalizePhone_(raw);
  return digits || String(raw || '').trim();
}

function formatDateIso_(val) {
  if (val instanceof Date) {
    return val.toISOString();
  }
  return String(val || '');
}

function formatShortDate_(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  return String(val || '');
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
