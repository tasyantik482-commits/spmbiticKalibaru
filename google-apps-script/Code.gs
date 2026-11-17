/**
 * ============================================================================
 * GOOGLE APPS SCRIPT — PORTAL SPMB SDIT INSAN CENDIKIA KALIBARU (v2.0.0)
 * ============================================================================
 * Target Spreadsheet ID : 1b9aQUoVH1PSunV63VvaoMUt2S38DlSgYgc--CpqAhsw
 * Fitur Utama:
 * 1. Penomoran pendaftaran otomatis & atomik (LockService) -> SPMB-IC-2026-0001
 * 2. Mendukung Gelombang 1 & Gelombang 2 serta form lengkap (Bagian A–E)
 * 3. Validasi & unggah 5 berkas wajib ke Google Drive (maks 900 KB/file):
 *    KK, Akta Kelahiran, Pas Foto 3x4, KTP Orang Tua/Wali, & Bukti Pembayaran
 * 4. Pengaturan Tanggal & Waktu Jadwal Observasi oleh Admin
 * 5. Pengaturan Profil Sekolah, Program, Ekstrakurikuler, Prestasi, Berita & Galeri oleh Admin
 * 6. Hapus Data Pendaftar (jika tidak jadi daftar ulang) beserta folder Drive (Trash)
 * ============================================================================
 */

const SCRIPT_VERSION = '2.0.0';
const SPREADSHEET_ID = '1b9aQUoVH1PSunV63VvaoMUt2S38DlSgYgc--CpqAhsw';
const SHEET_NAME = 'Pendaftar_SPMB';
const CONFIG_SHEET_NAME = 'Pengaturan_Sekolah';
const DRIVE_FOLDER_NAME = 'Berkas_SPMB_SDIT_IC_Kalibaru';
const DRIVE_FOLDER_ID = ''; // Opsional: isi ID folder Drive jika ingin mengarahkan ke folder tertentu
const REG_PREFIX = 'SPMB-IC-2026-';
const MAX_FILE_BYTES = 900 * 1024; // 900 KB

const ADMIN_USER = 'Tasya';
const ADMIN_PASS = 'Love_Tasya';

// Kolom 1-20 dipertahankan urutannya agar baris lama tetap terbaca tanpa bergeser.
// Kolom 21-64 ditambahkan otomatis di sebelah kanan kolom lama.
const HEADERS = [
  'Nomor Pendaftaran',          // 0 (Col 1)
  'Waktu Daftar',               // 1 (Col 2)
  'Nama Lengkap Calon Murid',   // 2 (Col 3)
  'Nama Orang Tua/Wali',        // 3 (Col 4)
  'Nomor Telepon/WhatsApp',     // 4 (Col 5)
  'Tinggi Badan (cm)',          // 5 (Col 6)
  'Berat Badan (kg)',           // 6 (Col 7)
  'Lingkar Kepala (cm)',        // 7 (Col 8)
  'Email',                      // 8 (Col 9)
  'Tanggal Lahir',              // 9 (Col 10)
  'Jenis Kelamin',              // 10 (Col 11)
  'Asal TK/PAUD',               // 11 (Col 12)
  'Catatan untuk Sekolah',      // 12 (Col 13)
  'URL Kartu Keluarga',         // 13 (Col 14)
  'URL Akta Kelahiran',         // 14 (Col 15)
  'URL Pas Foto 3x4',           // 15 (Col 16)
  'Persetujuan Data & Kontak',  // 16 (Col 17)
  'Status Verifikasi',          // 17 (Col 18)
  'Catatan Panitia',            // 18 (Col 19)
  'Folder Berkas Drive',        // 19 (Col 20)
  'Gelombang Pendaftaran',      // 20 (Col 21)
  'Nama Panggilan',             // 21 (Col 22)
  'Tempat Lahir',               // 22 (Col 23)
  'NIK Calon Murid',            // 23 (Col 24)
  'Anak Ke',                    // 24 (Col 25)
  'Jumlah Saudara Kandung',     // 25 (Col 26)
  'Status Anak',                // 26 (Col 27)
  'Anak Berkebutuhan Khusus',   // 27 (Col 28)
  'Agama',                      // 28 (Col 29)
  'Golongan Darah',             // 29 (Col 30)
  'Hobi',                       // 30 (Col 31)
  'Cita-cita',                  // 31 (Col 32)
  'Nama Ayah',                  // 32 (Col 33)
  'NIK Ayah',                   // 33 (Col 34)
  'Pekerjaan Ayah',             // 34 (Col 35)
  'Pendidikan Ayah',            // 35 (Col 36)
  'Penghasilan Ayah',           // 36 (Col 37)
  'Nama Ibu',                   // 37 (Col 38)
  'NIK Ibu',                    // 38 (Col 39)
  'Pekerjaan Ibu',              // 39 (Col 40)
  'Pendidikan Ibu',             // 40 (Col 41)
  'Penghasilan Ibu',            // 41 (Col 42)
  'Nama Wali',                  // 42 (Col 43)
  'Pekerjaan Wali',             // 43 (Col 44)
  'Pendidikan Wali',            // 44 (Col 45)
  'Penghasilan Wali',           // 45 (Col 46)
  'Bertempat Tinggal Dengan',   // 46 (Col 47)
  'Alamat Saat Ini',            // 47 (Col 48)
  'RT / RW',                    // 48 (Col 49)
  'Desa / Kelurahan',           // 49 (Col 50)
  'Kecamatan',                  // 50 (Col 51)
  'Kabupaten / Kota',           // 51 (Col 52)
  'Provinsi',                   // 52 (Col 53)
  'Status Kepemilikan Rumah',   // 53 (Col 54)
  'Jumlah Kendaraan',           // 54 (Col 55)
  'Alamat TK/PAUD Asal',        // 55 (Col 56)
  'URL KTP Orang Tua/Wali',     // 56 (Col 57)
  'URL Bukti Pembayaran',       // 57 (Col 58)
  'Metode Pembayaran',          // 58 (Col 59)
  'Tanggal Pembayaran',         // 59 (Col 60)
  'Nominal Pembayaran',         // 60 (Col 61)
  'Nama Pengirim / Pembayar',   // 61 (Col 62)
  'Tanggal Observasi',          // 62 (Col 63)
  'Waktu Observasi'             // 63 (Col 64)
];

/**
 * Inisialisasi awal sheet & header (opsional dijalankan manual sekali,
 * atau otomatis terpanggil saat ada pendaftar pertama).
 */
function setupSpreadsheet() {
  const sheet = getOrCreateSheet_();
  getOrCreateConfigSheet_();
  getOrCreateRootFolder_();
  return {
    status: 'ok',
    version: SCRIPT_VERSION,
    sheetName: sheet.getName(),
    spreadsheetId: SPREADSHEET_ID
  };
}

/**
 * Endpoint GET:
 * - ?action=ping -> Mengecek koneksi & versi Apps Script, Spreadsheet, dan Google Drive
 * - ?action=getSiteConfig -> Mengambil pengaturan profil sekolah & link grup WA
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
        scriptVersion: SCRIPT_VERSION,
        supportsDelete: true,
        supportsSiteConfig: true,
        supportsObservationSchedule: true,
        message: driveOk
          ? 'Koneksi Apps Script v' + SCRIPT_VERSION + ', Spreadsheet, dan Google Drive aktif.'
          : driveNote,
        error: driveOk ? '' : driveNote,
        spreadsheetTitle: ss.getName(),
        spreadsheetId: SPREADSHEET_ID,
        totalPendaftar: totalPendaftar
      });
    }

    if (action === 'getSiteConfig') {
      const cfg = readSiteConfig_();
      return jsonResponse_({
        ok: true,
        data: cfg
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

      const numCols = Math.max(sheet.getLastColumn(), HEADERS.length);
      const rows = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
      const list = [];
      for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i];
        if (!row[0]) continue;
        const kkUrl = String(row[13] || '');
        const aktaUrl = String(row[14] || '');
        const fotoUrl = String(row[15] || '');
        const ktpUrl = String(row[56] || '');
        const buktiBayarUrl = String(row[57] || '');

        list.push({
          noPendaftaran: String(row[0] || ''),
          waktuDaftar: formatDateIso_(row[1]),
          gelombang: String(row[20] || 'Gelombang 1'),
          namaCalonMurid: String(row[2] || ''),
          namaPanggilan: String(row[21] || ''),
          jenisKelamin: String(row[10] || ''),
          tempatLahir: String(row[22] || ''),
          tanggalLahir: row[9] ? formatShortDate_(row[9]) : '',
          nikCalonMurid: String(row[23] || '').replace(/^'/, ''),
          anakKe: Number(row[24]) || 0,
          jumlahSaudara: Number(row[25]) || 0,
          statusAnak: String(row[26] || ''),
          berkebutuhanKhusus: String(row[27] || ''),
          agama: String(row[28] || ''),
          golonganDarah: String(row[29] || ''),
          hobi: String(row[30] || ''),
          citaCita: String(row[31] || ''),
          tinggiBadan: Number(row[5]) || 0,
          beratBadan: Number(row[6]) || 0,
          lingkarKepala: Number(row[7]) || 0,

          namaAyah: String(row[32] || ''),
          nikAyah: String(row[33] || '').replace(/^'/, ''),
          pekerjaanAyah: String(row[34] || ''),
          pendidikanAyah: String(row[35] || ''),
          penghasilanAyah: String(row[36] || ''),

          namaIbu: String(row[37] || ''),
          nikIbu: String(row[38] || '').replace(/^'/, ''),
          pekerjaanIbu: String(row[39] || ''),
          pendidikanIbu: String(row[40] || ''),
          penghasilanIbu: String(row[41] || ''),

          namaOrangTua: String(row[3] || ''),
          noTelepon: String(row[4] || '').replace(/^'/, ''),
          email: String(row[8] || ''),

          namaWali: String(row[42] || ''),
          pekerjaanWali: String(row[43] || ''),
          pendidikanWali: String(row[44] || ''),
          penghasilanWali: String(row[45] || ''),

          tinggalDengan: String(row[46] || ''),
          alamatSaatIni: String(row[47] || ''),
          rtRw: String(row[48] || ''),
          desaKelurahan: String(row[49] || ''),
          kecamatan: String(row[50] || ''),
          kabupatenKota: String(row[51] || ''),
          provinsi: String(row[52] || ''),
          statusKepemilikan: String(row[53] || ''),
          jumlahKendaraan: String(row[54] || ''),

          asalTkPaud: String(row[11] || ''),
          alamatSekolahAsal: String(row[55] || ''),
          catatanSekolah: String(row[12] || ''),

          metodePembayaran: String(row[58] || ''),
          tanggalPembayaran: row[59] ? formatShortDate_(row[59]) : '',
          nominalPembayaran: Number(row[60]) || 0,
          namaPengirimPembayaran: String(row[61] || ''),

          urlKartuKeluarga: kkUrl,
          downloadKartuKeluarga: toDriveDownloadUrl_(kkUrl),
          urlAktaKelahiran: aktaUrl,
          downloadAktaKelahiran: toDriveDownloadUrl_(aktaUrl),
          urlPasFoto: fotoUrl,
          downloadPasFoto: toDriveDownloadUrl_(fotoUrl),
          urlKtpOrangTua: ktpUrl,
          downloadKtpOrangTua: toDriveDownloadUrl_(ktpUrl),
          urlBuktiPembayaran: buktiBayarUrl,
          downloadBuktiPembayaran: toDriveDownloadUrl_(buktiBayarUrl),

          persetujuanInfo: String(row[16] || ''),
          statusVerifikasi: String(row[17] || 'Menunggu Verifikasi'),
          catatanPanitia: String(row[18] || ''),
          folderUrl: String(row[19] || ''),
          tanggalObservasi: row[62] ? formatShortDate_(row[62]) : '',
          waktuObservasi: String(row[63] || '')
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

      const numCols = Math.max(sheet.getLastColumn(), HEADERS.length);
      const rows = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
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
              gelombang: String(row[20] || 'Gelombang 1'),
              namaCalonMurid: row[2],
              namaPanggilan: String(row[21] || ''),
              namaOrangTua: row[3],
              noTelepon: String(row[4] || '').replace(/^'/, ''),
              tinggiBadan: Number(row[5]) || 0,
              beratBadan: Number(row[6]) || 0,
              lingkarKepala: Number(row[7]) || 0,
              email: row[8] || '-',
              tanggalLahir: row[9] ? formatShortDate_(row[9]) : '-',
              tempatLahir: String(row[22] || '-'),
              jenisKelamin: row[10] || '-',
              asalTkPaud: row[11] || '-',
              catatanSekolah: row[12] || '-',
              metodePembayaran: String(row[58] || '-'),
              tanggalPembayaran: row[59] ? formatShortDate_(row[59]) : '-',
              nominalPembayaran: Number(row[60]) || 0,
              namaPengirimPembayaran: String(row[61] || '-'),
              urlKartuKeluarga: row[13],
              urlAktaKelahiran: row[14],
              urlPasFoto: row[15],
              urlKtpOrangTua: String(row[56] || ''),
              urlBuktiPembayaran: String(row[57] || ''),
              statusVerifikasi: row[17] || 'Menunggu Verifikasi',
              catatanPanitia: row[18] || 'Berkas telah diterima sistem. Panitia SPMB SDIT Insan Cendikia akan melakukan verifikasi dan menghubungi melalui WhatsApp.',
              tanggalObservasi: row[62] ? formatShortDate_(row[62]) : '',
              waktuObservasi: String(row[63] || '')
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
 * - action === 'updateStatus' -> Memperbarui status, tanggal/waktu observasi & catatan panitia oleh Admin
 * - action === 'deleteRegistration' -> Menghapus baris pendaftar & memindahkan folder Drive ke Trash
 * - action === 'saveSiteConfig' -> Menyimpan pengaturan profil sekolah (program, ekskul, prestasi, berita, galeri, link WA)
 * - default -> Menerima pendaftaran baru beserta 5 berkas Base64 (maks 900 KB/berkas)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: 'Payload request kosong.' });
    }

    const payload = JSON.parse(e.postData.contents);

    // 1. Update Status & Jadwal Observasi oleh Admin
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
      const obsDate = String(payload.tanggalObservasi || '').trim();
      const obsTime = String(payload.waktuObservasi || '').trim();

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
          sheet.getRange(rowIndex, 63).setValue(obsDate);
          sheet.getRange(rowIndex, 64).setValue(obsTime);
          return jsonResponse_({
            ok: true,
            data: {
              noPendaftaran: targetNo,
              statusVerifikasi: newStatus,
              catatanPanitia: newNote,
              tanggalObservasi: obsDate,
              waktuObservasi: obsTime
            }
          });
        }
      }

      return jsonResponse_({ ok: false, error: 'Nomor pendaftaran tidak ditemukan.' });
    }

    // 2. Hapus Pendaftar oleh Admin (mis. siswa tidak jadi daftar ulang)
    if (payload.action === 'deleteRegistration') {
      if (!isValidAdmin_(payload.adminUser, payload.adminPass)) {
        return jsonResponse_({
          ok: false,
          error: 'Akses ditolak. Username atau password admin tidak valid.'
        });
      }

      const targetNo = String(payload.noPendaftaran || '').trim().toUpperCase();
      if (!targetNo) {
        return jsonResponse_({
          ok: false,
          error: 'Nomor pendaftaran wajib diisi.'
        });
      }

      const sheet = getOrCreateSheet_();
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return jsonResponse_({ ok: false, error: 'Data pendaftar tidak ditemukan.' });
      }

      const rows = sheet.getRange(2, 1, lastRow - 1, 20).getValues();
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][0] || '').trim().toUpperCase() === targetNo) {
          const rowIndex = i + 2;
          const folderUrl = String(rows[i][19] || '');
          let folderTrashed = false;

          if (folderUrl) {
            const folderMatch =
              folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/) ||
              folderUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (folderMatch && folderMatch[1]) {
              try {
                DriveApp.getFolderById(folderMatch[1]).setTrashed(true);
                folderTrashed = true;
              } catch (trashErr) {
                // Tetap lanjut menghapus baris Spreadsheet meski folder Drive dibatasi/sudah hilang
              }
            }
          }

          sheet.deleteRow(rowIndex);
          return jsonResponse_({
            ok: true,
            data: {
              noPendaftaran: targetNo,
              folderTrashed: folderTrashed
            }
          });
        }
      }

      return jsonResponse_({ ok: false, error: 'Nomor pendaftaran tidak ditemukan.' });
    }

    // 3. Simpan Pengaturan Profil Sekolah & Link Grup WA (Admin)
    if (payload.action === 'saveSiteConfig') {
      if (!isValidAdmin_(payload.adminUser, payload.adminPass)) {
        return jsonResponse_({
          ok: false,
          error: 'Akses ditolak. Username atau password admin tidak valid.'
        });
      }

      const config = payload.config || {};
      let uploadedGalleryUrl = '';

      if (payload.galleryUpload && payload.galleryUpload.base64) {
        validateFilePayload_(payload.galleryUpload, 'Foto Galeri Sekolah');
        const rootFolder = getOrCreateRootFolder_();
        const mediaFolder = getOrCreateSubfolder_(rootFolder, 'Profil_Sekolah_Media');
        const safeTag = 'Galeri_' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss');
        const driveFile = saveBase64ToDriveWithMeta_(mediaFolder, payload.galleryUpload, safeTag);
        uploadedGalleryUrl = 'https://drive.google.com/thumbnail?id=' + driveFile.getId() + '&sz=w1200';
      }

      if (uploadedGalleryUrl && Array.isArray(config.customGallery) && config.customGallery.length > 0) {
        const lastIdx = config.customGallery.length - 1;
        if (!config.customGallery[lastIdx].imageUrl || config.customGallery[lastIdx].imageUrl === '__PENDING_UPLOAD__') {
          config.customGallery[lastIdx].imageUrl = uploadedGalleryUrl;
        }
      }

      config.updatedAt = new Date().toISOString();
      writeSiteConfig_(config);

      return jsonResponse_({
        ok: true,
        data: config
      });
    }

    // 4. Pendaftaran Murid Baru (Default POST)
    const gelombang = String(payload.gelombang || 'Gelombang 1').trim();
    const namaCalonMurid = String(payload.namaCalonMurid || '').trim();
    const namaPanggilan = String(payload.namaPanggilan || '').trim();
    const jenisKelamin = String(payload.jenisKelamin || '').trim();
    const tempatLahir = String(payload.tempatLahir || '').trim();
    const tanggalLahir = String(payload.tanggalLahir || '').trim();
    const nikCalonMurid = String(payload.nikCalonMurid || '').trim();
    const anakKe = Number(payload.anakKe) || 1;
    const jumlahSaudara = Number(payload.jumlahSaudara);
    const statusAnak = String(payload.statusAnak || 'Tidak termasuk ketiganya').trim();
    const berkebutuhanKhusus = String(payload.berkebutuhanKhusus || 'Tidak').trim();
    const agama = String(payload.agama || 'Islam').trim();
    const golonganDarah = String(payload.golonganDarah || '').trim();
    const hobi = String(payload.hobi || '').trim();
    const citaCita = String(payload.citaCita || '').trim();
    const tinggiBadan = Number(payload.tinggiBadan);
    const beratBadan = Number(payload.beratBadan);
    const lingkarKepala = Number(payload.lingkarKepala) || 0;

    const namaAyah = String(payload.namaAyah || '').trim();
    const nikAyah = String(payload.nikAyah || '').trim();
    const pekerjaanAyah = String(payload.pekerjaanAyah || '').trim();
    const pendidikanAyah = String(payload.pendidikanAyah || '').trim();
    const penghasilanAyah = String(payload.penghasilanAyah || '').trim();

    const namaIbu = String(payload.namaIbu || '').trim();
    const nikIbu = String(payload.nikIbu || '').trim();
    const pekerjaanIbu = String(payload.pekerjaanIbu || '').trim();
    const pendidikanIbu = String(payload.pendidikanIbu || '').trim();
    const penghasilanIbu = String(payload.penghasilanIbu || '').trim();

    const namaWali = String(payload.namaWali || '').trim();
    const pekerjaanWali = String(payload.pekerjaanWali || '').trim();
    const pendidikanWali = String(payload.pendidikanWali || '').trim();
    const penghasilanWali = String(payload.penghasilanWali || '').trim();

    const namaOrangTua =
      String(payload.namaOrangTua || '').trim() ||
      [namaAyah, namaIbu].filter(Boolean).join(' / ') ||
      namaWali;
    const noTeleponRaw = String(payload.noTelepon || '').trim();
    const email = String(payload.email || '').trim();

    const tinggalDengan = String(payload.tinggalDengan || '').trim();
    const alamatSaatIni = String(payload.alamatSaatIni || '').trim();
    const rtRw = String(payload.rtRw || '').trim();
    const desaKelurahan = String(payload.desaKelurahan || '').trim();
    const kecamatan = String(payload.kecamatan || '').trim();
    const kabupatenKota = String(payload.kabupatenKota || '').trim();
    const provinsi = String(payload.provinsi || '').trim();
    const statusKepemilikan = String(payload.statusKepemilikan || '').trim();
    const jumlahKendaraan = String(payload.jumlahKendaraan || '').trim();

    const asalTkPaud = String(payload.asalTkPaud || '').trim();
    const alamatSekolahAsal = String(payload.alamatSekolahAsal || '').trim();
    const catatanSekolah = String(payload.catatanSekolah || '').trim();

    const metodePembayaran = String(payload.metodePembayaran || '').trim();
    const tanggalPembayaran = String(payload.tanggalPembayaran || '').trim();
    const nominalPembayaran = Number(payload.nominalPembayaran) || 50000;
    const namaPengirimPembayaran = String(payload.namaPengirimPembayaran || '').trim();

    const persetujuan = Boolean(payload.persetujuan);

    if (!namaCalonMurid || !namaOrangTua || !noTeleponRaw) {
      return jsonResponse_({
        ok: false,
        error: 'Nama calon murid, nama orang tua/wali, dan nomor telepon wajib diisi.'
      });
    }

    if (!tinggiBadan || tinggiBadan <= 0 || !beratBadan || beratBadan <= 0) {
      return jsonResponse_({
        ok: false,
        error: 'Tinggi badan dan berat badan wajib diisi dengan angka valid.'
      });
    }

    if (!metodePembayaran || !tanggalPembayaran || !namaPengirimPembayaran) {
      return jsonResponse_({
        ok: false,
        error: 'Konfirmasi pembayaran biaya pendaftaran (metode, tanggal, dan nama pengirim/pembayar) wajib diisi.'
      });
    }

    if (!persetujuan) {
      return jsonResponse_({
        ok: false,
        error: 'Persetujuan kebenaran data dan izin kontak panitia wajib dicentang.'
      });
    }

    const files = payload.files || {};
    if (
      !files.kartuKeluarga ||
      !files.aktaKelahiran ||
      !files.pasFoto ||
      !files.ktpOrangTua ||
      !files.buktiPembayaran
    ) {
      return jsonResponse_({
        ok: false,
        error: 'Kelima berkas wajib (KK, Akta Kelahiran, Pas Foto 3x4, KTP Orang Tua/Wali, dan Bukti Pembayaran) harus dilampirkan.'
      });
    }

    validateFilePayload_(files.kartuKeluarga, 'Kartu Keluarga');
    validateFilePayload_(files.aktaKelahiran, 'Akta Kelahiran');
    validateFilePayload_(files.pasFoto, 'Pas Foto 3x4');
    validateFilePayload_(files.ktpOrangTua, 'KTP Orang Tua/Wali');
    validateFilePayload_(files.buktiPembayaran, 'Bukti Pembayaran');

    const sheet = getOrCreateSheet_();
    const noPendaftaran = generateNextRegNumber_(sheet);
    const waktuDaftar = new Date();

    const rootFolder = getOrCreateRootFolder_();
    const safeName = namaCalonMurid.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 40) || 'Pendaftar';
    const applicantFolder = rootFolder.createFolder(noPendaftaran + ' - ' + safeName);

    const kkUrl = saveBase64ToDrive_(applicantFolder, files.kartuKeluarga, noPendaftaran + '_Kartu_Keluarga');
    const aktaUrl = saveBase64ToDrive_(applicantFolder, files.aktaKelahiran, noPendaftaran + '_Akta_Kelahiran');
    const fotoUrl = saveBase64ToDrive_(applicantFolder, files.pasFoto, noPendaftaran + '_Pas_Foto_3x4');
    const ktpUrl = saveBase64ToDrive_(applicantFolder, files.ktpOrangTua, noPendaftaran + '_KTP_Ortu_Wali');
    const buktiBayarUrl = saveBase64ToDrive_(applicantFolder, files.buktiPembayaran, noPendaftaran + '_Bukti_Pembayaran');

    const statusDefault = 'Menunggu Verifikasi';
    const catatanPanitiaDefault =
      'Berkas & bukti pembayaran telah diterima sistem (' +
      gelombang +
      '). Menunggu verifikasi panitia SPMB SDIT Insan Cendikia.';

    const rowData = [
      noPendaftaran,                                      // 0
      waktuDaftar,                                        // 1
      namaCalonMurid,                                     // 2
      namaOrangTua,                                       // 3
      "'" + normalizeDisplayPhone_(noTeleponRaw),         // 4
      tinggiBadan,                                        // 5
      beratBadan,                                         // 6
      lingkarKepala,                                      // 7
      email,                                              // 8
      tanggalLahir,                                       // 9
      jenisKelamin,                                       // 10
      asalTkPaud,                                         // 11
      catatanSekolah,                                     // 12
      kkUrl,                                              // 13
      aktaUrl,                                            // 14
      fotoUrl,                                            // 15
      'Disetujui pada ' + Utilities.formatDate(waktuDaftar, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm') + ' WIB', // 16
      statusDefault,                                      // 17
      catatanPanitiaDefault,                              // 18
      applicantFolder.getUrl(),                           // 19
      gelombang,                                          // 20
      namaPanggilan,                                      // 21
      tempatLahir,                                        // 22
      nikCalonMurid ? "'" + nikCalonMurid : '',           // 23
      anakKe,                                             // 24
      isNaN(jumlahSaudara) ? 0 : jumlahSaudara,           // 25
      statusAnak,                                         // 26
      berkebutuhanKhusus,                                 // 27
      agama,                                              // 28
      golonganDarah,                                      // 29
      hobi,                                               // 30
      citaCita,                                           // 31
      namaAyah,                                           // 32
      nikAyah ? "'" + nikAyah : '',                       // 33
      pekerjaanAyah,                                      // 34
      pendidikanAyah,                                     // 35
      penghasilanAyah,                                    // 36
      namaIbu,                                            // 37
      nikIbu ? "'" + nikIbu : '',                         // 38
      pekerjaanIbu,                                       // 39
      pendidikanIbu,                                      // 40
      penghasilanIbu,                                     // 41
      namaWali,                                           // 42
      pekerjaanWali,                                      // 43
      pendidikanWali,                                     // 44
      penghasilanWali,                                    // 45
      tinggalDengan,                                      // 46
      alamatSaatIni,                                      // 47
      rtRw,                                               // 48
      desaKelurahan,                                      // 49
      kecamatan,                                          // 50
      kabupatenKota,                                      // 51
      provinsi,                                           // 52
      statusKepemilikan,                                  // 53
      jumlahKendaraan,                                    // 54
      alamatSekolahAsal,                                  // 55
      ktpUrl,                                             // 56
      buktiBayarUrl,                                      // 57
      metodePembayaran,                                   // 58
      tanggalPembayaran,                                  // 59
      nominalPembayaran,                                  // 60
      namaPengirimPembayaran,                             // 61
      '',                                                 // 62 (Tanggal Observasi)
      ''                                                  // 63 (Waktu Observasi)
    ];

    sheet.appendRow(rowData);

    return jsonResponse_({
      ok: true,
      data: {
        noPendaftaran: noPendaftaran,
        waktuDaftar: waktuDaftar.toISOString(),
        gelombang: gelombang,
        namaCalonMurid: namaCalonMurid,
        namaOrangTua: namaOrangTua,
        noTelepon: normalizeDisplayPhone_(noTeleponRaw),
        statusVerifikasi: statusDefault,
        catatanPanitia: catatanPanitiaDefault,
        metodePembayaran: metodePembayaran,
        nominalPembayaran: nominalPembayaran,
        urlKartuKeluarga: kkUrl,
        urlAktaKelahiran: aktaUrl,
        urlPasFoto: fotoUrl,
        urlKtpOrangTua: ktpUrl,
        urlBuktiPembayaran: buktiBayarUrl
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
    styleHeaderRange_(sheet.getRange(1, 1, 1, HEADERS.length));
    sheet.setFrozenRows(1);
  } else {
    // Otomatis tambahkan kolom baru di sebelah kanan jika sebelumnya baru 20 kolom
    const currentLastCol = sheet.getLastColumn();
    if (currentLastCol < HEADERS.length) {
      const existingHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
      for (let c = 0; c < HEADERS.length; c++) {
        if (!String(existingHeaders[c] || '').trim()) {
          const cell = sheet.getRange(1, c + 1);
          cell.setValue(HEADERS[c]);
          styleHeaderRange_(cell);
        }
      }
    }
  }
  return sheet;
}

function styleHeaderRange_(range) {
  range.setFontWeight('bold');
  range.setBackground('#0E6245');
  range.setFontColor('#FFFFFF');
}

function getOrCreateConfigSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG_SHEET_NAME);
    sheet.appendRow(['Key', 'Config JSON', 'Diperbarui Pada']);
    styleHeaderRange_(sheet.getRange(1, 1, 1, 3));
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readSiteConfig_() {
  const sheet = getOrCreateConfigSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() === 'site_profile') {
      const rawJson = String(rows[i][1] || '').trim();
      if (!rawJson) return null;
      try {
        return JSON.parse(rawJson);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

function writeSiteConfig_(configObj) {
  const sheet = getOrCreateConfigSheet_();
  const jsonStr = JSON.stringify(configObj);
  const nowStr = new Date().toISOString();
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0] || '').trim() === 'site_profile') {
        const rowIndex = i + 2;
        sheet.getRange(rowIndex, 2).setValue(jsonStr);
        sheet.getRange(rowIndex, 3).setValue(nowStr);
        return;
      }
    }
  }
  sheet.appendRow(['site_profile', jsonStr, nowStr]);
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

function getOrCreateSubfolder_(parentFolder, name) {
  const folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(name);
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

function saveBase64ToDriveWithMeta_(folder, fileObj, baseFileName) {
  const bytes = Utilities.base64Decode(fileObj.base64);
  const ext = getExtensionFromMime_(fileObj.mimeType, fileObj.fileName);
  const blob = Utilities.newBlob(bytes, fileObj.mimeType, baseFileName + ext);
  const createdFile = folder.createFile(blob);
  try {
    createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    // Tetap lanjutkan jika kebijakan domain Workspace membatasi berbagi tautan publik
  }
  return createdFile;
}

function saveBase64ToDrive_(folder, fileObj, baseFileName) {
  return saveBase64ToDriveWithMeta_(folder, fileObj, baseFileName).getUrl();
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
