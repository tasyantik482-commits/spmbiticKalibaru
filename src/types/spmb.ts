export interface UploadedFilePayload {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64: string;
}

export type GelombangPendaftaran = 'Gelombang 1' | 'Gelombang 2';

export interface RegistrationFormPayload {
  gelombang: GelombangPendaftaran;
  // A. Data Calon Murid Baru
  namaCalonMurid: string;
  namaPanggilan: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  tempatLahir: string;
  tanggalLahir: string;
  nikCalonMurid: string;
  anakKe: number;
  jumlahSaudara: number;
  statusAnak: 'Tidak termasuk ketiganya' | 'Yatim' | 'Piatu' | 'Yatim Piatu';
  berkebutuhanKhusus: 'Tidak' | 'Ya';
  agama: string;
  golonganDarah: string;
  hobi: string;
  citaCita: string;
  tinggiBadan: number;
  beratBadan: number;
  lingkarKepala: number;

  // B. Data Orang Tua / Wali
  namaAyah: string;
  nikAyah: string;
  pekerjaanAyah: string;
  pendidikanAyah: string;
  penghasilanAyah: string;

  namaIbu: string;
  nikIbu: string;
  pekerjaanIbu: string;
  pendidikanIbu: string;
  penghasilanIbu: string;

  namaOrangTua: string; // Ringkasan untuk kompatibilitas tampilan & sheet
  noTelepon: string;
  email: string;

  namaWali: string;
  pekerjaanWali: string;
  pendidikanWali: string;
  penghasilanWali: string;

  // C. Data Tempat Tinggal
  tinggalDengan: string;
  alamatSaatIni: string;
  rtRw: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  statusKepemilikan: string;
  jumlahKendaraan: string;

  // D. Pendidikan Sebelumnya
  asalTkPaud: string;
  alamatSekolahAsal: string;
  catatanSekolah: string;

  // E. Konfirmasi Pembayaran Biaya Pendaftaran
  metodePembayaran: 'Transfer Bank Jatim' | 'QRIS Sekolah' | 'Di Sekretariat Sekolah';
  tanggalPembayaran: string;
  nominalPembayaran: number;
  namaPengirimPembayaran: string;

  persetujuan: boolean;
  files: {
    kartuKeluarga: UploadedFilePayload;
    aktaKelahiran: UploadedFilePayload;
    pasFoto: UploadedFilePayload;
    ktpOrangTua: UploadedFilePayload;
    buktiPembayaran: UploadedFilePayload;
  };
}

export interface RegistrationResult {
  noPendaftaran: string;
  waktuDaftar: string;
  gelombang: string;
  namaCalonMurid: string;
  namaOrangTua: string;
  noTelepon: string;
  statusVerifikasi: string;
  catatanPanitia: string;
  tanggalObservasi?: string;
  waktuObservasi?: string;
  metodePembayaran?: string;
  nominalPembayaran?: number;
  urlKartuKeluarga?: string;
  urlAktaKelahiran?: string;
  urlPasFoto?: string;
  urlKtpOrangTua?: string;
  urlBuktiPembayaran?: string;
  source: 'apps_script' | 'local_preview';
}

export interface StatusLookupResult {
  noPendaftaran: string;
  waktuDaftar: string;
  gelombang: string;
  namaCalonMurid: string;
  namaPanggilan?: string;
  namaOrangTua: string;
  noTelepon: string;
  tinggiBadan: number;
  beratBadan: number;
  lingkarKepala: number;
  email: string;
  tanggalLahir: string;
  tempatLahir?: string;
  jenisKelamin: string;
  asalTkPaud: string;
  catatanSekolah: string;
  metodePembayaran?: string;
  tanggalPembayaran?: string;
  nominalPembayaran?: number;
  namaPengirimPembayaran?: string;
  urlKartuKeluarga?: string;
  urlAktaKelahiran?: string;
  urlPasFoto?: string;
  urlKtpOrangTua?: string;
  urlBuktiPembayaran?: string;
  statusVerifikasi: string;
  catatanPanitia: string;
  tanggalObservasi?: string;
  waktuObservasi?: string;
  source: 'apps_script' | 'local_preview';
}

export interface AdminApplicantRecord {
  noPendaftaran: string;
  waktuDaftar: string;
  gelombang: string;
  namaCalonMurid: string;
  namaPanggilan: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  nikCalonMurid: string;
  anakKe: number;
  jumlahSaudara: number;
  statusAnak: string;
  berkebutuhanKhusus: string;
  agama: string;
  golonganDarah: string;
  hobi: string;
  citaCita: string;
  tinggiBadan: number;
  beratBadan: number;
  lingkarKepala: number;

  namaAyah: string;
  nikAyah: string;
  pekerjaanAyah: string;
  pendidikanAyah: string;
  penghasilanAyah: string;

  namaIbu: string;
  nikIbu: string;
  pekerjaanIbu: string;
  pendidikanIbu: string;
  penghasilanIbu: string;

  namaOrangTua: string;
  noTelepon: string;
  email: string;

  namaWali: string;
  pekerjaanWali: string;
  pendidikanWali: string;
  penghasilanWali: string;

  tinggalDengan: string;
  alamatSaatIni: string;
  rtRw: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  statusKepemilikan: string;
  jumlahKendaraan: string;

  asalTkPaud: string;
  alamatSekolahAsal: string;
  catatanSekolah: string;

  metodePembayaran: string;
  tanggalPembayaran: string;
  nominalPembayaran: number;
  namaPengirimPembayaran: string;

  urlKartuKeluarga?: string;
  downloadKartuKeluarga?: string;
  kkFileName?: string;
  urlAktaKelahiran?: string;
  downloadAktaKelahiran?: string;
  aktaFileName?: string;
  urlPasFoto?: string;
  downloadPasFoto?: string;
  fotoFileName?: string;
  urlKtpOrangTua?: string;
  downloadKtpOrangTua?: string;
  ktpFileName?: string;
  urlBuktiPembayaran?: string;
  downloadBuktiPembayaran?: string;
  buktiBayarFileName?: string;

  persetujuanInfo?: string;
  statusVerifikasi: string;
  catatanPanitia: string;
  tanggalObservasi: string;
  waktuObservasi: string;
  folderUrl?: string;
  source: 'apps_script' | 'local_preview';
}

export interface SiteHighlightItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  date?: string;
}

export interface CustomGalleryItem {
  id: string;
  title: string;
  category: string;
  context: string;
  caption: string;
  imageUrl: string;
  hidden?: boolean;
  hasCustomImage?: boolean;
}

export interface SiteProfileConfig {
  activeWave: GelombangPendaftaran;
  waveInfoNote: string;
  waGroupTitle: string;
  waGroupUrl: string;
  programs: SiteHighlightItem[];
  extracurriculars: SiteHighlightItem[];
  achievements: SiteHighlightItem[];
  news: SiteHighlightItem[];
  customGallery: CustomGalleryItem[];
  galleryInitialized?: boolean;
  updatedAt?: string;
}

export const VERIFICATION_STATUS_OPTIONS = [
  'Menunggu Verifikasi',
  'Berkas Lengkap',
  'Jadwal Observasi',
  'Diterima',
  'Perlu Perbaikan',
] as const;

export const GELOMBANG_OPTIONS: readonly GelombangPendaftaran[] = [
  'Gelombang 1',
  'Gelombang 2',
];
