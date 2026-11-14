import type {
  AdminApplicantRecord,
  RegistrationFormPayload,
  RegistrationResult,
  StatusLookupResult,
  UploadedFilePayload,
} from '../types/spmb';

export const MAX_FILE_SIZE_BYTES = 900 * 1024; // 900 KB
export const SPREADSHEET_ID =
  import.meta.env.VITE_SPREADSHEET_ID || '1b9aQUoVH1PSunV63VvaoMUt2S38DlSgYgc--CpqAhsw';

const ADMIN_USER = 'Tasya';
const ADMIN_PASS = 'Love_Tasya';

const STORAGE_URL_KEY = 'sditic_apps_script_url';
const STORAGE_RECORDS_KEY = 'sditic_spmb_local_records';
const STORAGE_ADMIN_SESSION_KEY = 'sditic_admin_session';
const IDB_NAME = 'sditic_spmb_preview_files';
const IDB_STORE = 'attachments';

export function verifyAdminCredentials(username: string, password: string): boolean {
  return username.trim() === ADMIN_USER && password === ADMIN_PASS;
}

export function getAdminSession(): { username: string } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.username === ADMIN_USER && parsed.password === ADMIN_PASS) {
      return { username: parsed.username };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAdminSession(username: string, password: string): boolean {
  if (!verifyAdminCredentials(username, password)) return false;
  try {
    sessionStorage.setItem(
      STORAGE_ADMIN_SESSION_KEY,
      JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS })
    );
  } catch {
    // Abaikan jika sessionStorage tidak tersedia
  }
  return true;
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
  } catch {
    // Abaikan
  }
}

function getSessionCredentials(): { user: string; pass: string } {
  try {
    const raw = sessionStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        user: String(parsed.username || ''),
        pass: String(parsed.password || ''),
      };
    }
  } catch {
    // Abaikan
  }
  return { user: '', pass: '' };
}

export function getConfiguredAppsScriptUrl(): string {
  const envUrl = (import.meta.env.VITE_APPS_SCRIPT_URL || '').trim();
  if (envUrl) return envUrl;
  try {
    return (localStorage.getItem(STORAGE_URL_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function setRuntimeAppsScriptUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_URL_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_URL_KEY);
    }
  } catch {
    // Abaikan jika storage tidak tersedia
  }
}

export function isEnvAppsScriptConfigured(): boolean {
  return Boolean((import.meta.env.VITE_APPS_SCRIPT_URL || '').trim());
}

export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (!digits.startsWith('62')) {
    digits = '62' + digits;
  }
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function formatBytesToKb(bytes: number): string {
  return `${Math.round((bytes / 1024) * 10) / 10} KB`;
}

export function extractDriveFileId(url?: string): string {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match && match[1] ? match[1] : '';
}

export function toDriveDownloadUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  const id = extractDriveFileId(url);
  if (id) {
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  return url;
}

export function toDriveThumbnailUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  const id = extractDriveFileId(url);
  if (id) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w600`;
  }
  return '';
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Gagal memproses gambar "${file.name}".`));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal mengompresi gambar.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

async function compressImageUnderLimit(file: File): Promise<File> {
  const img = await loadImageFromFile(file);
  const maxDimensions = [1800, 1400, 1100, 900];
  const qualities = [0.85, 0.72, 0.6, 0.48];

  for (const maxDim of maxDimensions) {
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) break;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    for (const q of qualities) {
      const blob = await canvasToBlob(canvas, 'image/jpeg', q);
      if (blob.size <= MAX_FILE_SIZE_BYTES) {
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'berkas';
        return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
      }
    }
  }

  throw new Error(
    `Ukuran "${file.name}" masih di atas 900 KB setelah kompresi. Mohon pilih foto dengan resolusi lebih kecil.`
  );
}

export interface PreparedFileResult {
  payload: UploadedFilePayload;
  wasCompressed: boolean;
  originalSizeBytes: number;
}

export async function readFileAsPayloadWithInfo(
  file: File
): Promise<PreparedFileResult> {
  const originalSizeBytes = file.size;
  let targetFile = file;
  let wasCompressed = false;

  const isCompressibleImage =
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/webp';

  if (file.size > MAX_FILE_SIZE_BYTES) {
    if (isCompressibleImage) {
      targetFile = await compressImageUnderLimit(file);
      wasCompressed = true;
    } else {
      throw new Error(
        `Ukuran PDF "${file.name}" (${formatBytesToKb(file.size)}) melebihi batas maksimal 900 KB. Kompres PDF terlebih dahulu atau unggah dalam format foto JPG/PNG.`
      );
    }
  }

  const payload = await readFileDirect(targetFile);
  return { payload, wasCompressed, originalSizeBytes };
}

function readFileDirect(file: File): Promise<UploadedFilePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIndex = result.indexOf(',');
      const base64 = commaIndex !== -1 ? result.slice(commaIndex + 1) : result;
      if (!base64) {
        reject(new Error(`Gagal membaca berkas "${file.name}".`));
        return;
      }
      resolve({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        base64,
      });
    };
    reader.onerror = () => reject(new Error(`Gagal membaca berkas "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

export async function readFileAsPayload(file: File): Promise<UploadedFilePayload> {
  const res = await readFileAsPayloadWithInfo(file);
  return res.payload;
}

export async function pingAppsScript(url: string): Promise<{
  ok: boolean;
  message?: string;
  spreadsheetTitle?: string;
  totalPendaftar?: number;
  error?: string;
}> {
  const target = url.trim();
  if (!target) {
    return { ok: false, error: 'URL Web App Apps Script belum diisi.' };
  }
  const separator = target.includes('?') ? '&' : '?';
  const res = await fetch(`${target}${separator}action=ping`, {
    method: 'GET',
  });
  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status} saat menghubungi Apps Script.` };
  }
  return res.json();
}

export async function submitRegistration(
  payload: RegistrationFormPayload
): Promise<RegistrationResult> {
  const scriptUrl = getConfiguredAppsScriptUrl();

  if (scriptUrl) {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Koneksi ke Google Apps Script gagal (HTTP ${response.status}).`);
    }

    const json = await response.json();
    if (!json.ok) {
      throw new Error(json.error || 'Pendaftaran gagal disimpan ke Google Spreadsheet.');
    }

    return {
      ...json.data,
      source: 'apps_script',
    };
  }

  return saveLocalPreviewRegistration(payload);
}

export async function lookupRegistrationStatus(
  noPendaftaran: string,
  noTelepon: string
): Promise<StatusLookupResult> {
  const cleanNo = noPendaftaran.trim().toUpperCase();
  const cleanPhone = normalizePhone(noTelepon);

  if (!cleanNo || !cleanPhone) {
    throw new Error('Masukkan Nomor Pendaftaran dan Nomor Telepon/WhatsApp.');
  }

  const scriptUrl = getConfiguredAppsScriptUrl();

  if (scriptUrl) {
    const separator = scriptUrl.includes('?') ? '&' : '?';
    const query = `action=checkStatus&noPendaftaran=${encodeURIComponent(
      cleanNo
    )}&noTelepon=${encodeURIComponent(cleanPhone)}`;
    const response = await fetch(`${scriptUrl}${separator}${query}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Gagal memeriksa status (HTTP ${response.status}).`);
    }

    const json = await response.json();
    if (!json.ok) {
      throw new Error(
        json.error || 'Data tidak ditemukan atau nomor telepon tidak cocok.'
      );
    }

    return {
      ...json.data,
      source: 'apps_script',
    };
  }

  return lookupLocalPreviewRegistration(cleanNo, cleanPhone);
}

export async function fetchAllRegistrations(): Promise<{
  records: AdminApplicantRecord[];
  source: 'apps_script' | 'local_preview';
}> {
  const scriptUrl = getConfiguredAppsScriptUrl();
  const creds = getSessionCredentials();

  if (!verifyAdminCredentials(creds.user, creds.pass)) {
    throw new Error('Sesi admin tidak valid. Silakan login kembali.');
  }

  if (scriptUrl) {
    const separator = scriptUrl.includes('?') ? '&' : '?';
    const query = `action=listRegistrations&adminUser=${encodeURIComponent(
      creds.user
    )}&adminPass=${encodeURIComponent(creds.pass)}`;
    const response = await fetch(`${scriptUrl}${separator}${query}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Gagal memuat data pendaftar (HTTP ${response.status}).`);
    }

    const json = await response.json();
    if (!json.ok) {
      throw new Error(json.error || 'Gagal mengambil daftar pendaftar dari Apps Script.');
    }

    const records: AdminApplicantRecord[] = (json.data || []).map(
      (item: AdminApplicantRecord) => ({
        ...item,
        downloadKartuKeluarga:
          item.downloadKartuKeluarga || toDriveDownloadUrl(item.urlKartuKeluarga),
        downloadAktaKelahiran:
          item.downloadAktaKelahiran || toDriveDownloadUrl(item.urlAktaKelahiran),
        downloadPasFoto:
          item.downloadPasFoto || toDriveDownloadUrl(item.urlPasFoto),
        source: 'apps_script',
      })
    );

    return { records, source: 'apps_script' };
  }

  // Mode Pratinjau Lokal (ambil dari localStorage + IndexedDB untuk berkas)
  const localRecords = getLocalRecords();
  const enriched = await Promise.all(
    [...localRecords].reverse().map(async (item) => {
      const files = await getLocalFilesFromIdb(item.noPendaftaran);
      return {
        ...item,
        urlKartuKeluarga: files?.kartuKeluargaDataUrl,
        downloadKartuKeluarga: files?.kartuKeluargaDataUrl,
        kkFileName: files?.kkFileName || `${item.noPendaftaran}_KK`,
        urlAktaKelahiran: files?.aktaKelahiranDataUrl,
        downloadAktaKelahiran: files?.aktaKelahiranDataUrl,
        aktaFileName: files?.aktaFileName || `${item.noPendaftaran}_Akta`,
        urlPasFoto: files?.pasFotoDataUrl,
        downloadPasFoto: files?.pasFotoDataUrl,
        fotoFileName: files?.fotoFileName || `${item.noPendaftaran}_PasFoto`,
        persetujuanInfo: item.persetujuanInfo || 'Disetujui saat pendaftaran',
        source: 'local_preview' as const,
      };
    })
  );

  return { records: enriched, source: 'local_preview' };
}

export async function updateRegistrationStatus(
  noPendaftaran: string,
  statusVerifikasi: string,
  catatanPanitia: string
): Promise<void> {
  const scriptUrl = getConfiguredAppsScriptUrl();
  const creds = getSessionCredentials();

  if (!verifyAdminCredentials(creds.user, creds.pass)) {
    throw new Error('Sesi admin tidak valid.');
  }

  if (scriptUrl) {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'updateStatus',
        adminUser: creds.user,
        adminPass: creds.pass,
        noPendaftaran,
        statusVerifikasi,
        catatanPanitia,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gagal memperbarui status (HTTP ${response.status}).`);
    }

    const json = await response.json();
    if (!json.ok) {
      throw new Error(json.error || 'Gagal menyimpan perubahan status.');
    }
    return;
  }

  const records = getLocalRecords();
  const updated = records.map((item) =>
    item.noPendaftaran === noPendaftaran
      ? { ...item, statusVerifikasi, catatanPanitia }
      : item
  );
  localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(updated));
}

export async function deleteRegistration(noPendaftaran: string): Promise<void> {
  const scriptUrl = getConfiguredAppsScriptUrl();
  const creds = getSessionCredentials();

  if (!verifyAdminCredentials(creds.user, creds.pass)) {
    throw new Error('Sesi admin tidak valid.');
  }

  if (scriptUrl) {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'deleteRegistration',
        adminUser: creds.user,
        adminPass: creds.pass,
        noPendaftaran,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gagal menghapus data pendaftar (HTTP ${response.status}).`);
    }

    const json = await response.json();
    if (!json.ok) {
      const errMsg = String(json.error || '');
      if (errMsg.includes('Nama calon murid, nama orang tua/wali')) {
        throw new Error(
          'Script Google Apps Script Anda masih menggunakan versi lama yang belum mendukung fitur hapus. Perbarui Code.gs di editor Apps Script lalu Deploy Versi Baru.'
        );
      }
      throw new Error(errMsg || 'Gagal menghapus data pendaftar dari Google Spreadsheet.');
    }
    return;
  }

  const records = getLocalRecords();
  const filtered = records.filter((item) => item.noPendaftaran !== noPendaftaran);
  localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(filtered));
  await deleteLocalFilesFromIdb(noPendaftaran);
}

export function triggerFileDownload(url: string, fileName: string): void {
  if (!url) return;
  if (url.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  const downloadUrl = toDriveDownloadUrl(url);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ============================================================================
 * LOCAL PREVIEW PERSISTENCE (localStorage + IndexedDB untuk lampiran berkas)
 * ============================================================================ */

interface StoredLocalRecord {
  noPendaftaran: string;
  waktuDaftar: string;
  namaCalonMurid: string;
  namaOrangTua: string;
  noTelepon: string;
  tinggiBadan: number;
  beratBadan: number;
  lingkarKepala: number;
  email: string;
  tanggalLahir: string;
  jenisKelamin: string;
  asalTkPaud: string;
  catatanSekolah: string;
  persetujuanInfo?: string;
  statusVerifikasi: string;
  catatanPanitia: string;
}

interface StoredLocalFiles {
  noPendaftaran: string;
  kartuKeluargaDataUrl: string;
  kkFileName: string;
  aktaKelahiranDataUrl: string;
  aktaFileName: string;
  pasFotoDataUrl: string;
  fotoFileName: string;
}

function getLocalRecords(): StoredLocalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveLocalPreviewRegistration(
  payload: RegistrationFormPayload
): Promise<RegistrationResult> {
  const records = getLocalRecords();
  const nextNumber = records.length + 1;
  const noPendaftaran = `SPMB-IC-2026-${String(nextNumber).padStart(4, '0')}`;
  const waktuDaftar = new Date().toISOString();
  const normalizedPhone = normalizePhone(payload.noTelepon);
  const statusVerifikasi = 'Menunggu Verifikasi';
  const catatanPanitia =
    'Data tersimpan di Pratinjau Lokal. Atur URL Apps Script pada Vercel (VITE_APPS_SCRIPT_URL) agar otomatis tersimpan ke Google Spreadsheet.';

  const newRecord: StoredLocalRecord = {
    noPendaftaran,
    waktuDaftar,
    namaCalonMurid: payload.namaCalonMurid.trim(),
    namaOrangTua: payload.namaOrangTua.trim(),
    noTelepon: normalizedPhone,
    tinggiBadan: payload.tinggiBadan,
    beratBadan: payload.beratBadan,
    lingkarKepala: payload.lingkarKepala,
    email: payload.email.trim() || '-',
    tanggalLahir: payload.tanggalLahir || '-',
    jenisKelamin: payload.jenisKelamin || '-',
    asalTkPaud: payload.asalTkPaud.trim() || '-',
    catatanSekolah: payload.catatanSekolah.trim() || '-',
    persetujuanInfo: `Disetujui pada ${new Date().toLocaleString('id-ID')}`,
    statusVerifikasi,
    catatanPanitia,
  };

  records.push(newRecord);
  localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));

  await saveLocalFilesToIdb({
    noPendaftaran,
    kartuKeluargaDataUrl: `data:${payload.files.kartuKeluarga.mimeType};base64,${payload.files.kartuKeluarga.base64}`,
    kkFileName: payload.files.kartuKeluarga.fileName,
    aktaKelahiranDataUrl: `data:${payload.files.aktaKelahiran.mimeType};base64,${payload.files.aktaKelahiran.base64}`,
    aktaFileName: payload.files.aktaKelahiran.fileName,
    pasFotoDataUrl: `data:${payload.files.pasFoto.mimeType};base64,${payload.files.pasFoto.base64}`,
    fotoFileName: payload.files.pasFoto.fileName,
  });

  return {
    noPendaftaran,
    waktuDaftar,
    namaCalonMurid: newRecord.namaCalonMurid,
    namaOrangTua: newRecord.namaOrangTua,
    noTelepon: newRecord.noTelepon,
    statusVerifikasi,
    catatanPanitia,
    source: 'local_preview',
  };
}

function lookupLocalPreviewRegistration(
  noPendaftaran: string,
  normalizedPhone: string
): StatusLookupResult {
  const records = getLocalRecords();
  const found = records.find(
    (item) =>
      item.noPendaftaran.toUpperCase() === noPendaftaran &&
      normalizePhone(item.noTelepon) === normalizedPhone
  );

  if (!found) {
    throw new Error(
      'Data pendaftar tidak ditemukan pada pratinjau lokal. Pastikan Nomor Pendaftaran dan Nomor Telepon sesuai (atau hubungkan URL Google Apps Script aktif).'
    );
  }

  return {
    ...found,
    source: 'local_preview',
  };
}

function openFilesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'noPendaftaran' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveLocalFilesToIdb(entry: StoredLocalFiles): Promise<void> {
  try {
    const db = await openFilesDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Abaikan jika IndexedDB tidak tersedia
  }
}

async function getLocalFilesFromIdb(
  noPendaftaran: string
): Promise<StoredLocalFiles | null> {
  try {
    const db = await openFilesDb();
    return await new Promise<StoredLocalFiles | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(noPendaftaran);
      req.onsuccess = () => resolve((req.result as StoredLocalFiles) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function deleteLocalFilesFromIdb(noPendaftaran: string): Promise<void> {
  try {
    const db = await openFilesDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(noPendaftaran);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Abaikan jika IndexedDB tidak tersedia
  }
}
