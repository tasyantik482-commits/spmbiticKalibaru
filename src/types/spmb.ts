export interface UploadedFilePayload {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64: string;
}

export interface RegistrationFormPayload {
  namaCalonMurid: string;
  namaOrangTua: string;
  noTelepon: string;
  tinggiBadan: number;
  beratBadan: number;
  lingkarKepala: number;
  email: string;
  tanggalLahir: string;
  jenisKelamin: '' | 'Laki-laki' | 'Perempuan';
  asalTkPaud: string;
  catatanSekolah: string;
  persetujuan: boolean;
  files: {
    kartuKeluarga: UploadedFilePayload;
    aktaKelahiran: UploadedFilePayload;
    pasFoto: UploadedFilePayload;
  };
}

export interface RegistrationResult {
  noPendaftaran: string;
  waktuDaftar: string;
  namaCalonMurid: string;
  namaOrangTua: string;
  noTelepon: string;
  statusVerifikasi: string;
  catatanPanitia: string;
  urlKartuKeluarga?: string;
  urlAktaKelahiran?: string;
  urlPasFoto?: string;
  source: 'apps_script' | 'local_preview';
}

export interface StatusLookupResult {
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
  urlKartuKeluarga?: string;
  urlAktaKelahiran?: string;
  urlPasFoto?: string;
  statusVerifikasi: string;
  catatanPanitia: string;
  source: 'apps_script' | 'local_preview';
}

export interface AdminApplicantRecord {
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
  urlKartuKeluarga?: string;
  downloadKartuKeluarga?: string;
  kkFileName?: string;
  urlAktaKelahiran?: string;
  downloadAktaKelahiran?: string;
  aktaFileName?: string;
  urlPasFoto?: string;
  downloadPasFoto?: string;
  fotoFileName?: string;
  persetujuanInfo?: string;
  statusVerifikasi: string;
  catatanPanitia: string;
  folderUrl?: string;
  source: 'apps_script' | 'local_preview';
}

export const VERIFICATION_STATUS_OPTIONS = [
  'Menunggu Verifikasi',
  'Berkas Lengkap',
  'Jadwal Observasi',
  'Diterima',
  'Perlu Perbaikan',
] as const;
