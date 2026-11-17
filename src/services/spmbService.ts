import { DEFAULT_SITE_PROFILE } from '../config/defaultSiteProfile';
import type {
  AdminApplicantRecord,
  RegistrationFormPayload,
  RegistrationResult,
  SiteProfileConfig,
  StatusLookupResult,
  UploadedFilePayload,
} from '../types/spmb';

export const MAX_FILE_SIZE_BYTES = 900 * 1024; // 900 KB maks per file di Apps Script
export const TARGET_IMAGE_COMPRESS_BYTES = 480 * 1024; // Target kompresi ~480 KB agar 5 berkas tetap ringan
export const SPREADSHEET_ID =
  import.meta.env.VITE_SPREADSHEET_ID || '1b9aQUoVH1PSunV63VvaoMUt2S38DlSgYgc--CpqAhsw';

const ADMIN_USER = 'Tasya';
const ADMIN_PASS = 'Love_Tasya';

const STORAGE_URL_KEY = 'sditic_apps_script_url';
const STORAGE_RECORDS_KEY = 'sditic_spmb_local_records';
const STORAGE_ADMIN_SESSION_KEY = 'sditic_admin_session';
const STORAGE_SITE_PROFILE_KEY = 'sditic_site_profile_v1';
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

export function formatRupiah(amount: number): string {
  return `Rp ${Number(amount || 0).toLocaleString('id-ID')},-`;
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

async function compressImageUnderLimit(
  file: File,
  targetBytes = TARGET_IMAGE_COMPRESS_BYTES
): Promise<File> {
  const img = await loadImageFromFile(file);
  const maxDimensions = [1600, 1280, 1024, 820, 680];
  const qualities = [0.82, 0.7, 0.58, 0.45];

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
      if (blob.size <= targetBytes || blob.size <= MAX_FILE_SIZE_BYTES) {
        if (blob.size <= targetBytes) {
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'berkas';
          return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
        }
      }
    }
  }

  // Fallback hingga MAX_FILE_SIZE_BYTES jika targetBytes sangat ketat
  for (const maxDim of [1024, 800]) {
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
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.55);
    if (blob.size <= MAX_FILE_SIZE_BYTES) {
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'berkas';
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
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
  file: File,
  targetImageBytes = TARGET_IMAGE_COMPRESS_BYTES
): Promise<PreparedFileResult> {
  const originalSizeBytes = file.size;
  let targetFile = file;
  let wasCompressed = false;

  const isCompressibleImage =
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/webp';

  if (isCompressibleImage && file.size > targetImageBytes) {
    targetFile = await compressImageUnderLimit(file, targetImageBytes);
    wasCompressed = targetFile.size < file.size;
  } else if (!isCompressibleImage && file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Ukuran PDF "${file.name}" (${formatBytesToKb(file.size)}) melebihi batas maksimal 900 KB. Kompres PDF terlebih dahulu atau unggah dalam format foto JPG/PNG.`
    );
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

export interface AppsScriptPingResult {
  ok: boolean;
  message?: string;
  scriptVersion?: string;
  supportsDelete?: boolean;
  supportsSiteConfig?: boolean;
  supportsObservationSchedule?: boolean;
  spreadsheetTitle?: string;
  totalPendaftar?: number;
  error?: string;
}

export async function pingAppsScript(url: string): Promise<AppsScriptPingResult> {
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
        gelombang: item.gelombang || 'Gelombang 1',
        downloadKartuKeluarga:
          item.downloadKartuKeluarga || toDriveDownloadUrl(item.urlKartuKeluarga),
        downloadAktaKelahiran:
          item.downloadAktaKelahiran || toDriveDownloadUrl(item.urlAktaKelahiran),
        downloadPasFoto:
          item.downloadPasFoto || toDriveDownloadUrl(item.urlPasFoto),
        downloadKtpOrangTua:
          item.downloadKtpOrangTua || toDriveDownloadUrl(item.urlKtpOrangTua),
        downloadBuktiPembayaran:
          item.downloadBuktiPembayaran || toDriveDownloadUrl(item.urlBuktiPembayaran),
        tanggalObservasi: item.tanggalObservasi || '',
        waktuObservasi: item.waktuObservasi || '',
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
        fotoFileName: files?.fotoFileName || `${item.noPendaftaran}_PasFoto_3x4`,
        urlKtpOrangTua: files?.ktpOrangTuaDataUrl,
        downloadKtpOrangTua: files?.ktpOrangTuaDataUrl,
        ktpFileName: files?.ktpFileName || `${item.noPendaftaran}_KTP_Ortu`,
        urlBuktiPembayaran: files?.buktiPembayaranDataUrl,
        downloadBuktiPembayaran: files?.buktiPembayaranDataUrl,
        buktiBayarFileName:
          files?.buktiBayarFileName || `${item.noPendaftaran}_Bukti_Pembayaran`,
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
  catatanPanitia: string,
  tanggalObservasi = '',
  waktuObservasi = ''
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
        tanggalObservasi,
        waktuObservasi,
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
      ? {
          ...item,
          statusVerifikasi,
          catatanPanitia,
          tanggalObservasi,
          waktuObservasi,
        }
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
          'Script Google Apps Script Anda masih menggunakan versi lama yang belum mendukung fitur hapus. Buka "Pengaturan & Kode Apps Script", salin Code.gs terbaru (v2.0.0), lalu klik Terapkan > Kelola deployment > Edit > Versi Baru.'
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

/* ============================================================================
 * PENGATURAN PROFIL SEKOLAH, GELOMBANG & LINK GRUP WA (PERBAIKAN #7)
 * ============================================================================ */

function mergeSiteProfile(partial?: Partial<SiteProfileConfig> | null): SiteProfileConfig {
  if (!partial) return DEFAULT_SITE_PROFILE;

  const rawWaveNote = (partial.waveInfoNote || '').trim();
  const waveInfoNote =
    !rawWaveNote ||
    rawWaveNote === 'Pendaftaran dibuka dalam 2 gelombang untuk Tahun Ajaran 2026/2027.'
      ? DEFAULT_SITE_PROFILE.waveInfoNote
      : rawWaveNote.replace(/Tahun Ajaran 2026\/2027/gi, 'Tahun Pelajaran 2027/2028');

  const rawWaTitle = (partial.waGroupTitle || '').trim();
  const waGroupTitle =
    !rawWaTitle || rawWaTitle === 'Grup WA SPMB SDIT INSAN CENDEKIA 27/28'
      ? DEFAULT_SITE_PROFILE.waGroupTitle
      : rawWaTitle.replace(/INSAN CENDEKIA/g, 'INSAN CENDIKIA');

  const extracurriculars = Array.isArray(partial.extracurriculars)
    ? partial.extracurriculars.map((item) =>
        item.title === 'Pramuka SIT (Pangkalan Insan Cendekia)'
          ? { ...item, title: 'Pramuka SIT (Pangkalan Insan Cendikia)' }
          : item
      )
    : DEFAULT_SITE_PROFILE.extracurriculars;

  return {
    activeWave: partial.activeWave === 'Gelombang 2' ? 'Gelombang 2' : 'Gelombang 1',
    waveInfoNote,
    waGroupTitle,
    waGroupUrl: typeof partial.waGroupUrl === 'string' ? partial.waGroupUrl : DEFAULT_SITE_PROFILE.waGroupUrl,
    programs: Array.isArray(partial.programs) ? partial.programs : DEFAULT_SITE_PROFILE.programs,
    extracurriculars,
    achievements: Array.isArray(partial.achievements) ? partial.achievements : [],
    news: Array.isArray(partial.news) ? partial.news : [],
    customGallery: Array.isArray(partial.customGallery) ? partial.customGallery : [],
    updatedAt: partial.updatedAt,
  };
}

export function getCachedSiteProfile(): SiteProfileConfig {
  try {
    const raw = localStorage.getItem(STORAGE_SITE_PROFILE_KEY);
    if (!raw) return DEFAULT_SITE_PROFILE;
    return mergeSiteProfile(JSON.parse(raw));
  } catch {
    return DEFAULT_SITE_PROFILE;
  }
}

export async function fetchSiteProfile(): Promise<SiteProfileConfig> {
  const cached = getCachedSiteProfile();
  const scriptUrl = getConfiguredAppsScriptUrl();
  if (!scriptUrl) {
    return cached;
  }

  try {
    const separator = scriptUrl.includes('?') ? '&' : '?';
    const res = await fetch(`${scriptUrl}${separator}action=getSiteConfig`, {
      method: 'GET',
    });
    if (!res.ok) return cached;
    const json = await res.json();
    if (json && json.ok && json.data) {
      const merged = mergeSiteProfile(json.data);
      try {
        localStorage.setItem(STORAGE_SITE_PROFILE_KEY, JSON.stringify(merged));
      } catch {
        // Abaikan jika storage penuh
      }
      return merged;
    }
    return cached;
  } catch {
    return cached;
  }
}

export async function saveSiteProfile(
  config: SiteProfileConfig,
  galleryUpload?: UploadedFilePayload
): Promise<SiteProfileConfig> {
  const scriptUrl = getConfiguredAppsScriptUrl();
  const creds = getSessionCredentials();

  if (!verifyAdminCredentials(creds.user, creds.pass)) {
    throw new Error('Sesi admin tidak valid.');
  }

  const nextConfig: SiteProfileConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };

  if (scriptUrl) {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'saveSiteConfig',
        adminUser: creds.user,
        adminPass: creds.pass,
        config: nextConfig,
        galleryUpload: galleryUpload || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gagal menyimpan profil sekolah (HTTP ${response.status}).`);
    }

    const json = await response.json();
    if (!json.ok) {
      const errMsg = String(json.error || '');
      if (errMsg.includes('Nama calon murid, nama orang tua/wali')) {
        throw new Error(
          'Apps Script masih versi lama. Perbarui Code.gs ke v2.0.0 dan Deploy Versi Baru agar perubahan profil sekolah tersimpan untuk semua pengunjung.'
        );
      }
      throw new Error(errMsg || 'Gagal menyimpan profil sekolah ke Google Spreadsheet.');
    }

    const saved = mergeSiteProfile(json.data || nextConfig);
    try {
      localStorage.setItem(STORAGE_SITE_PROFILE_KEY, JSON.stringify(saved));
    } catch {
      // Abaikan
    }
    return saved;
  }

  // Mode pratinjau lokal
  if (galleryUpload && nextConfig.customGallery.length > 0) {
    const lastIdx = nextConfig.customGallery.length - 1;
    if (nextConfig.customGallery[lastIdx].imageUrl === '__PENDING_UPLOAD__') {
      nextConfig.customGallery[lastIdx] = {
        ...nextConfig.customGallery[lastIdx],
        imageUrl: `data:${galleryUpload.mimeType};base64,${galleryUpload.base64}`,
      };
    }
  }

  localStorage.setItem(STORAGE_SITE_PROFILE_KEY, JSON.stringify(nextConfig));
  return nextConfig;
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

type StoredLocalRecord = Omit<
  AdminApplicantRecord,
  | 'urlKartuKeluarga'
  | 'downloadKartuKeluarga'
  | 'kkFileName'
  | 'urlAktaKelahiran'
  | 'downloadAktaKelahiran'
  | 'aktaFileName'
  | 'urlPasFoto'
  | 'downloadPasFoto'
  | 'fotoFileName'
  | 'urlKtpOrangTua'
  | 'downloadKtpOrangTua'
  | 'ktpFileName'
  | 'urlBuktiPembayaran'
  | 'downloadBuktiPembayaran'
  | 'buktiBayarFileName'
  | 'source'
>;

interface StoredLocalFiles {
  noPendaftaran: string;
  kartuKeluargaDataUrl: string;
  kkFileName: string;
  aktaKelahiranDataUrl: string;
  aktaFileName: string;
  pasFotoDataUrl: string;
  fotoFileName: string;
  ktpOrangTuaDataUrl?: string;
  ktpFileName?: string;
  buktiPembayaranDataUrl?: string;
  buktiBayarFileName?: string;
}

function getLocalRecords(): StoredLocalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          ...item,
          gelombang: item.gelombang || 'Gelombang 1',
          tanggalObservasi: item.tanggalObservasi || '',
          waktuObservasi: item.waktuObservasi || '',
        }))
      : [];
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
  const catatanPanitia = `Data (${payload.gelombang}) tersimpan di Pratinjau Lokal. Atur URL Apps Script pada Panel Admin / Vercel (VITE_APPS_SCRIPT_URL) agar otomatis tersimpan ke Google Spreadsheet.`;

  const newRecord: StoredLocalRecord = {
    noPendaftaran,
    waktuDaftar,
    gelombang: payload.gelombang,
    namaCalonMurid: payload.namaCalonMurid.trim(),
    namaPanggilan: payload.namaPanggilan.trim(),
    jenisKelamin: payload.jenisKelamin || '-',
    tempatLahir: payload.tempatLahir.trim(),
    tanggalLahir: payload.tanggalLahir || '-',
    nikCalonMurid: payload.nikCalonMurid.trim(),
    anakKe: payload.anakKe,
    jumlahSaudara: payload.jumlahSaudara,
    statusAnak: payload.statusAnak,
    berkebutuhanKhusus: payload.berkebutuhanKhusus,
    agama: payload.agama.trim(),
    golonganDarah: payload.golonganDarah.trim() || '-',
    hobi: payload.hobi.trim() || '-',
    citaCita: payload.citaCita.trim() || '-',
    tinggiBadan: payload.tinggiBadan,
    beratBadan: payload.beratBadan,
    lingkarKepala: payload.lingkarKepala || 0,

    namaAyah: payload.namaAyah.trim(),
    nikAyah: payload.nikAyah.trim(),
    pekerjaanAyah: payload.pekerjaanAyah.trim(),
    pendidikanAyah: payload.pendidikanAyah.trim(),
    penghasilanAyah: payload.penghasilanAyah.trim(),

    namaIbu: payload.namaIbu.trim(),
    nikIbu: payload.nikIbu.trim(),
    pekerjaanIbu: payload.pekerjaanIbu.trim(),
    pendidikanIbu: payload.pendidikanIbu.trim(),
    penghasilanIbu: payload.penghasilanIbu.trim(),

    namaOrangTua: payload.namaOrangTua.trim(),
    noTelepon: normalizedPhone,
    email: payload.email.trim() || '-',

    namaWali: payload.namaWali.trim() || '-',
    pekerjaanWali: payload.pekerjaanWali.trim() || '-',
    pendidikanWali: payload.pendidikanWali.trim() || '-',
    penghasilanWali: payload.penghasilanWali.trim() || '-',

    tinggalDengan: payload.tinggalDengan.trim(),
    alamatSaatIni: payload.alamatSaatIni.trim(),
    rtRw: payload.rtRw.trim(),
    desaKelurahan: payload.desaKelurahan.trim(),
    kecamatan: payload.kecamatan.trim(),
    kabupatenKota: payload.kabupatenKota.trim(),
    provinsi: payload.provinsi.trim(),
    statusKepemilikan: payload.statusKepemilikan.trim(),
    jumlahKendaraan: payload.jumlahKendaraan.trim(),

    asalTkPaud: payload.asalTkPaud.trim() || '-',
    alamatSekolahAsal: payload.alamatSekolahAsal.trim() || '-',
    catatanSekolah: payload.catatanSekolah.trim() || '-',

    metodePembayaran: payload.metodePembayaran,
    tanggalPembayaran: payload.tanggalPembayaran,
    nominalPembayaran: payload.nominalPembayaran,
    namaPengirimPembayaran: payload.namaPengirimPembayaran.trim(),

    persetujuanInfo: `Disetujui pada ${new Date().toLocaleString('id-ID')}`,
    statusVerifikasi,
    catatanPanitia,
    tanggalObservasi: '',
    waktuObservasi: '',
  };

  records.push(newRecord);
  localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));

  const kkDataUrl = `data:${payload.files.kartuKeluarga.mimeType};base64,${payload.files.kartuKeluarga.base64}`;
  const aktaDataUrl = `data:${payload.files.aktaKelahiran.mimeType};base64,${payload.files.aktaKelahiran.base64}`;
  const fotoDataUrl = `data:${payload.files.pasFoto.mimeType};base64,${payload.files.pasFoto.base64}`;
  const ktpDataUrl = `data:${payload.files.ktpOrangTua.mimeType};base64,${payload.files.ktpOrangTua.base64}`;
  const buktiDataUrl = `data:${payload.files.buktiPembayaran.mimeType};base64,${payload.files.buktiPembayaran.base64}`;

  await saveLocalFilesToIdb({
    noPendaftaran,
    kartuKeluargaDataUrl: kkDataUrl,
    kkFileName: payload.files.kartuKeluarga.fileName,
    aktaKelahiranDataUrl: aktaDataUrl,
    aktaFileName: payload.files.aktaKelahiran.fileName,
    pasFotoDataUrl: fotoDataUrl,
    fotoFileName: payload.files.pasFoto.fileName,
    ktpOrangTuaDataUrl: ktpDataUrl,
    ktpFileName: payload.files.ktpOrangTua.fileName,
    buktiPembayaranDataUrl: buktiDataUrl,
    buktiBayarFileName: payload.files.buktiPembayaran.fileName,
  });

  return {
    noPendaftaran,
    waktuDaftar,
    gelombang: newRecord.gelombang,
    namaCalonMurid: newRecord.namaCalonMurid,
    namaOrangTua: newRecord.namaOrangTua,
    noTelepon: newRecord.noTelepon,
    statusVerifikasi,
    catatanPanitia,
    metodePembayaran: newRecord.metodePembayaran,
    nominalPembayaran: newRecord.nominalPembayaran,
    urlKartuKeluarga: kkDataUrl,
    urlAktaKelahiran: aktaDataUrl,
    urlPasFoto: fotoDataUrl,
    urlKtpOrangTua: ktpDataUrl,
    urlBuktiPembayaran: buktiDataUrl,
    source: 'local_preview',
  };
}

async function lookupLocalPreviewRegistration(
  noPendaftaran: string,
  normalizedPhone: string
): Promise<StatusLookupResult> {
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

  const files = await getLocalFilesFromIdb(found.noPendaftaran);

  return {
    noPendaftaran: found.noPendaftaran,
    waktuDaftar: found.waktuDaftar,
    gelombang: found.gelombang || 'Gelombang 1',
    namaCalonMurid: found.namaCalonMurid,
    namaPanggilan: found.namaPanggilan,
    namaOrangTua: found.namaOrangTua,
    noTelepon: found.noTelepon,
    tinggiBadan: found.tinggiBadan,
    beratBadan: found.beratBadan,
    lingkarKepala: found.lingkarKepala,
    email: found.email,
    tanggalLahir: found.tanggalLahir,
    tempatLahir: found.tempatLahir,
    jenisKelamin: found.jenisKelamin,
    asalTkPaud: found.asalTkPaud,
    catatanSekolah: found.catatanSekolah,
    metodePembayaran: found.metodePembayaran,
    tanggalPembayaran: found.tanggalPembayaran,
    nominalPembayaran: found.nominalPembayaran,
    namaPengirimPembayaran: found.namaPengirimPembayaran,
    urlKartuKeluarga: files?.kartuKeluargaDataUrl,
    urlAktaKelahiran: files?.aktaKelahiranDataUrl,
    urlPasFoto: files?.pasFotoDataUrl,
    urlKtpOrangTua: files?.ktpOrangTuaDataUrl,
    urlBuktiPembayaran: files?.buktiPembayaranDataUrl,
    statusVerifikasi: found.statusVerifikasi,
    catatanPanitia: found.catatanPanitia,
    tanggalObservasi: found.tanggalObservasi,
    waktuObservasi: found.waktuObservasi,
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
