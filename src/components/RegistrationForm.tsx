import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  Printer,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  formatBytesToKb,
  MAX_FILE_SIZE_BYTES,
  readFileAsPayload,
  submitRegistration,
} from '../services/spmbService';
import type { RegistrationResult, UploadedFilePayload } from '../types/spmb';

interface RegistrationFormProps {
  onGoToStatusCheck: (noPendaftaran: string, noTelepon: string) => void;
}

type FileSlotKey = 'kartuKeluarga' | 'aktaKelahiran' | 'pasFoto';

interface FileSlotConfig {
  key: FileSlotKey;
  label: string;
  helper: string;
  accept: string;
}

const FILE_SLOTS: FileSlotConfig[] = [
  {
    key: 'kartuKeluarga',
    label: 'Kartu Keluarga (KK)',
    helper: 'Format JPG, PNG, atau PDF · Maksimal 900 KB',
    accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
  },
  {
    key: 'aktaKelahiran',
    label: 'Akta Kelahiran',
    helper: 'Format JPG, PNG, atau PDF · Maksimal 900 KB',
    accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
  },
  {
    key: 'pasFoto',
    label: 'Pas Foto Ukuran 4 × 6',
    helper: 'Format JPG atau PNG (latar polos rapi) · Maksimal 900 KB',
    accept: '.jpg,.jpeg,.png,image/jpeg,image/png',
  },
];

export default function RegistrationForm({ onGoToStatusCheck }: RegistrationFormProps) {
  const [namaCalonMurid, setNamaCalonMurid] = useState('');
  const [namaOrangTua, setNamaOrangTua] = useState('');
  const [noTelepon, setNoTelepon] = useState('');
  const [tinggiBadan, setTinggiBadan] = useState('');
  const [beratBadan, setBeratBadan] = useState('');
  const [lingkarKepala, setLingkarKepala] = useState('');

  const [email, setEmail] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'' | 'Laki-laki' | 'Perempuan'>('');
  const [asalTkPaud, setAsalTkPaud] = useState('');
  const [catatanSekolah, setCatatanSekolah] = useState('');
  const [persetujuan, setPersetujuan] = useState(false);

  const [files, setFiles] = useState<Partial<Record<FileSlotKey, UploadedFilePayload>>>({});
  const [fileErrors, setFileErrors] = useState<Partial<Record<FileSlotKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<RegistrationResult | null>(null);
  const [copiedRegNo, setCopiedRegNo] = useState(false);

  const fileInputRefs = useRef<Record<FileSlotKey, HTMLInputElement | null>>({
    kartuKeluarga: null,
    aktaKelahiran: null,
    pasFoto: null,
  });

  const handleFileChange = async (slot: FileSlotConfig, event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFileErrors((prev) => ({ ...prev, [slot.key]: undefined }));
    setFormError(null);

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFileErrors((prev) => ({
        ...prev,
        [slot.key]: `Ukuran berkas ${formatBytesToKb(selected.size)} melebihi batas maksimal 900 KB.`,
      }));
      event.target.value = '';
      return;
    }

    if (slot.key === 'pasFoto' && selected.type === 'application/pdf') {
      setFileErrors((prev) => ({
        ...prev,
        [slot.key]: 'Pas Foto 4 × 6 harus berupa gambar JPG atau PNG.',
      }));
      event.target.value = '';
      return;
    }

    try {
      const payload = await readFileAsPayload(selected);
      setFiles((prev) => ({ ...prev, [slot.key]: payload }));
    } catch (err) {
      setFileErrors((prev) => ({
        ...prev,
        [slot.key]: err instanceof Error ? err.message : 'Gagal memproses berkas.',
      }));
      event.target.value = '';
    }
  };

  const handleRemoveFile = (key: FileSlotKey) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFileErrors((prev) => ({ ...prev, [key]: undefined }));
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!namaCalonMurid.trim() || !namaOrangTua.trim() || !noTelepon.trim()) {
      setFormError('Lengkapi nama calon murid, nama orang tua/wali, dan nomor telepon/WhatsApp.');
      return;
    }

    const phoneDigits = noTelepon.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      setFormError('Format nomor telepon/WhatsApp tidak valid. Gunakan minimal 9 digit angka aktif.');
      return;
    }

    const tb = Number(tinggiBadan);
    const bb = Number(beratBadan);
    const lk = Number(lingkarKepala);
    if (!tb || tb < 50 || tb > 200 || !bb || bb < 5 || bb > 120 || !lk || lk < 30 || lk > 75) {
      setFormError(
        'Mohon isi tinggi badan (50–200 cm), berat badan (5–120 kg), dan lingkar kepala (30–75 cm) dengan nilai yang wajar.'
      );
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Format alamat email tidak valid.');
      return;
    }

    if (!files.kartuKeluarga || !files.aktaKelahiran || !files.pasFoto) {
      setFormError(
        'Seluruh berkas wajib (Kartu Keluarga, Akta Kelahiran, dan Pas Foto 4 × 6) harus dilampirkan.'
      );
      return;
    }

    if (!persetujuan) {
      setFormError(
        'Centang pernyataan persetujuan bahwa data benar dan sekolah diperbolehkan menghubungi Anda.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitRegistration({
        namaCalonMurid: namaCalonMurid.trim(),
        namaOrangTua: namaOrangTua.trim(),
        noTelepon: noTelepon.trim(),
        tinggiBadan: tb,
        beratBadan: bb,
        lingkarKepala: lk,
        email: email.trim(),
        tanggalLahir,
        jenisKelamin,
        asalTkPaud: asalTkPaud.trim(),
        catatanSekolah: catatanSekolah.trim(),
        persetujuan,
        files: {
          kartuKeluarga: files.kartuKeluarga,
          aktaKelahiran: files.aktaKelahiran,
          pasFoto: files.pasFoto,
        },
      });
      setReceipt(result);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Terjadi kendala saat mengirim pendaftaran.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRegNumber = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(receipt.noPendaftaran);
      setCopiedRegNo(true);
      setTimeout(() => setCopiedRegNo(false), 2000);
    } catch {
      // Abaikan jika clipboard diblokir browser
    }
  };

  const handleResetForm = () => {
    setReceipt(null);
    setNamaCalonMurid('');
    setNamaOrangTua('');
    setNoTelepon('');
    setTinggiBadan('');
    setBeratBadan('');
    setLingkarKepala('');
    setEmail('');
    setTanggalLahir('');
    setJenisKelamin('');
    setAsalTkPaud('');
    setCatatanSekolah('');
    setPersetujuan(false);
    setFiles({});
    setFileErrors({});
    setFormError(null);
  };

  if (receipt) {
    return (
      <div className="bg-white border border-[#DCE4DE] rounded-xl p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-[#E6ECE7]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0E6245]">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Pendaftaran SPMB Berhasil Dikirim</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F2419]">
              Bukti Pendaftaran Calon Murid Baru
            </h3>
            <p className="text-sm text-[#4A5D52] max-w-xl">
              Simpan nomor pendaftaran berikut untuk memeriksa status verifikasi berkas dan jadwal observasi secara berkala.
            </p>
          </div>

          <div className="bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg px-4 sm:px-5 py-4 shrink-0">
            <div className="text-xs font-medium text-[#4A5D52]">Nomor Pendaftaran</div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="font-mono text-lg sm:text-xl font-semibold tracking-tight text-[#0F2419] tabular-nums">
                {receipt.noPendaftaran}
              </span>
              <button
                type="button"
                onClick={handleCopyRegNumber}
                className="no-print inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-medium text-[#0E6245] bg-white border border-[#CFE0D5] rounded-md hover:bg-[#EBF4EE] transition-colors cursor-pointer"
                title="Salin nomor pendaftaran"
              >
                {copiedRegNo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRegNo ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 py-8 border-b border-[#E6ECE7] text-sm">
          <div>
            <dt className="text-xs font-medium text-[#5A6D62]">Nama Calon Murid</dt>
            <dd className="mt-1 font-semibold text-[#0F2419]">{receipt.namaCalonMurid}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[#5A6D62]">Nama Orang Tua / Wali</dt>
            <dd className="mt-1 font-semibold text-[#0F2419]">{receipt.namaOrangTua}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[#5A6D62]">Nomor Telepon / WhatsApp</dt>
            <dd className="mt-1 font-mono font-medium text-[#0F2419] tabular-nums">{receipt.noTelepon}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[#5A6D62]">Status Saat Ini</dt>
            <dd className="mt-1 font-semibold text-[#B45309]">{receipt.statusVerifikasi}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-[#5A6D62]">Keterangan</dt>
            <dd className="mt-1 text-[#2D4035]">{receipt.catatanPanitia}</dd>
          </div>
        </dl>

        {receipt.source === 'local_preview' && (
          <div className="mt-6 rounded-lg border border-[#E5D5B5] bg-[#FDF9F0] px-4 py-3 text-xs text-[#7C4A10]">
            Catatan: Data saat ini tersimpan di pratinjau browser lokal karena <code className="font-mono">VITE_APPS_SCRIPT_URL</code> belum diatur. Untuk menyimpan langsung ke Google Spreadsheet SDIT Insan Cendekia Kalibaru, lengkapi URL Web App Apps Script di Vercel atau melalui menu Pengaturan Apps Script di bagian bawah halaman.
          </div>
        )}

        <div className="no-print mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => onGoToStatusCheck(receipt.noPendaftaran, receipt.noTelepon)}
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cek Status Pendaftaran
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 text-sm font-medium text-[#0F2419] bg-white border border-[#CFD9D2] rounded-lg hover:bg-[#F4F7F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Bukti</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetForm}
            className="min-h-[44px] text-sm font-medium text-[#4A5D52] hover:text-[#0F2419] underline underline-offset-4 cursor-pointer text-center sm:text-right"
          >
            Daftarkan Calon Murid Lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-[#DCE4DE] rounded-xl p-5 sm:p-8 lg:p-10 space-y-8 sm:space-y-10"
    >
      {/* 01. Identitas Wajib */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-[#0F2419]">
            01. Identitas Calon Murid & Orang Tua / Wali
          </h3>
          <span className="text-xs text-[#5A6D62]">Tanda * wajib diisi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="md:col-span-2">
            <label htmlFor="namaCalonMurid" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Nama Lengkap Calon Murid <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="namaCalonMurid"
              type="text"
              required
              value={namaCalonMurid}
              onChange={(e) => setNamaCalonMurid(e.target.value)}
              placeholder="Contoh: Ahmad Zaidan Al-Fatih"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="namaOrangTua" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Nama Orang Tua / Wali <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="namaOrangTua"
              type="text"
              required
              value={namaOrangTua}
              onChange={(e) => setNamaOrangTua(e.target.value)}
              placeholder="Contoh: Budi Santoso / Siti Aminah"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="noTelepon" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Nomor Telepon / WhatsApp Aktif <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="noTelepon"
              type="tel"
              inputMode="tel"
              required
              value={noTelepon}
              onChange={(e) => setNoTelepon(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm font-mono tabular-nums text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:font-sans placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
            />
            <p className="mt-1 text-xs text-[#5A6D62]">
              Digunakan untuk konfirmasi panitia & pengecekan status pendaftaran.
            </p>
          </div>
        </div>
      </section>

      {/* 02. Data Antropometri / Fisik Wajib */}
      <section className="pt-8 border-t border-[#E6ECE7] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-[#0F2419]">
            02. Data Kesehatan & Pertumbuhan Fisik
          </h3>
          <span className="text-xs text-[#5A6D62]">Data Dapodik awal (wajib)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          <div>
            <label htmlFor="tinggiBadan" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Tinggi Badan <span className="text-[#B91C1C]">*</span>
            </label>
            <div className="relative">
              <input
                id="tinggiBadan"
                type="number"
                inputMode="decimal"
                min={50}
                max={200}
                step="0.1"
                required
                value={tinggiBadan}
                onChange={(e) => setTinggiBadan(e.target.value)}
                placeholder="115"
                className="w-full min-h-[44px] pl-3.5 pr-12 py-2.5 text-base sm:text-sm font-mono tabular-nums text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5A6D62]">
                cm
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="beratBadan" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Berat Badan <span className="text-[#B91C1C]">*</span>
            </label>
            <div className="relative">
              <input
                id="beratBadan"
                type="number"
                inputMode="decimal"
                min={5}
                max={120}
                step="0.1"
                required
                value={beratBadan}
                onChange={(e) => setBeratBadan(e.target.value)}
                placeholder="21"
                className="w-full min-h-[44px] pl-3.5 pr-12 py-2.5 text-base sm:text-sm font-mono tabular-nums text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5A6D62]">
                kg
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="lingkarKepala" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Lingkar Kepala <span className="text-[#B91C1C]">*</span>
            </label>
            <div className="relative">
              <input
                id="lingkarKepala"
                type="number"
                inputMode="decimal"
                min={30}
                max={75}
                step="0.1"
                required
                value={lingkarKepala}
                onChange={(e) => setLingkarKepala(e.target.value)}
                placeholder="50"
                className="w-full min-h-[44px] pl-3.5 pr-12 py-2.5 text-base sm:text-sm font-mono tabular-nums text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5A6D62]">
                cm
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 03. Berkas Persyaratan Wajib (<= 900 KB) */}
      <section className="pt-8 border-t border-[#E6ECE7] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-[#0F2419]">
            03. Lampiran Berkas Persyaratan
          </h3>
          <span className="text-xs font-medium text-[#0E6245]">
            Batas ukuran maksimal 900 KB per berkas
          </span>
        </div>

        <div className="divide-y divide-[#E6ECE7] border border-[#DCE4DE] rounded-lg">
          {FILE_SLOTS.map((slot) => {
            const uploaded = files[slot.key];
            const errMsg = fileErrors[slot.key];
            return (
              <div key={slot.key} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="text-sm font-medium text-[#0F2419]">
                    {slot.label} <span className="text-[#B91C1C]">*</span>
                  </div>
                  <div className="text-xs text-[#5A6D62]">{slot.helper}</div>
                  {uploaded && (
                    <div className="pt-1 flex items-center gap-2 text-xs text-[#0E6245]">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate font-medium max-w-[240px] sm:max-w-[340px]">
                        {uploaded.fileName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums shrink-0">
                        {formatBytesToKb(uploaded.sizeBytes)}
                      </span>
                    </div>
                  )}
                  {errMsg && (
                    <div className="pt-1 flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errMsg}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <input
                    ref={(el) => {
                      fileInputRefs.current[slot.key] = el;
                    }}
                    type="file"
                    accept={slot.accept}
                    onChange={(e) => handleFileChange(slot, e)}
                    className="sr-only"
                    id={`file-${slot.key}`}
                  />
                  <label
                    htmlFor={`file-${slot.key}`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0F2419] bg-[#F4F7F5] border border-[#CCD6CE] rounded-lg hover:bg-[#E7EFEA] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploaded ? 'Ganti Berkas' : 'Pilih Berkas'}</span>
                  </label>
                  {uploaded && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(slot.key)}
                      aria-label={`Hapus ${slot.label}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#64746B] hover:text-[#B91C1C] border border-[#DCE4DE] sm:border-transparent hover:border-[#F2D0D0] rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 04. Data Opsional & Persetujuan */}
      <section className="pt-8 border-t border-[#E6ECE7] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-[#0F2419]">
            04. Data Pelengkap & Persetujuan
          </h3>
          <span className="text-xs text-[#5A6D62]">Kolom di bawah bersifat opsional</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Alamat Email <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="orangtua@contoh.com"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="tanggalLahir" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Tanggal Lahir Calon Murid <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
            </label>
            <input
              id="tanggalLahir"
              type="date"
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="jenisKelamin" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Jenis Kelamin <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
            </label>
            <select
              id="jenisKelamin"
              value={jenisKelamin}
              onChange={(e) =>
                setJenisKelamin(e.target.value as '' | 'Laki-laki' | 'Perempuan')
              }
              className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
            >
              <option value="">Pilih jenis kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label htmlFor="asalTkPaud" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Asal TK / PAUD / RA <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
            </label>
            <input
              id="asalTkPaud"
              type="text"
              value={asalTkPaud}
              onChange={(e) => setAsalTkPaud(e.target.value)}
              placeholder="Contoh: TK Islam Al-Hikmah Kalibaru"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="catatanSekolah" className="block text-sm font-medium text-[#1D3126] mb-1.5">
              Catatan untuk Sekolah <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
            </label>
            <textarea
              id="catatanSekolah"
              rows={3}
              value={catatanSekolah}
              onChange={(e) => setCatatanSekolah(e.target.value)}
              placeholder="Tuliskan informasi khusus bila ada (misal kondisi kesehatan, alergi, minat program reguler/boarding, atau keterangan lainnya)."
              className="w-full px-3.5 py-2.5 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
            />
          </div>
        </div>

        {/* Persetujuan Wajib */}
        <div className="pt-4">
          <label className="flex items-start gap-3.5 p-4 rounded-lg border border-[#DCE4DE] bg-[#F7FAF8] cursor-pointer">
            <input
              type="checkbox"
              checked={persetujuan}
              onChange={(e) => setPersetujuan(e.target.checked)}
              className="mt-0.5 h-5 w-5 sm:h-4 sm:w-4 rounded border-[#9EB0A3] text-[#0E6245] focus:ring-[#0E6245] shrink-0 cursor-pointer"
            />
            <span className="text-sm leading-relaxed text-[#1D3126]">
              Saya menyatakan bahwa seluruh data dan berkas yang diisi atau dilampirkan adalah benar, serta memberikan izin kepada pihak{' '}
              <strong className="font-semibold text-[#0F2419]">SDIT Insan Cendekia Kalibaru</strong>{' '}
              untuk menghubungi saya melalui WhatsApp, telepon, atau email terkait proses SPMB. <span className="text-[#B91C1C]">*</span>
            </span>
          </label>
        </div>
      </section>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-[#F2C6C6] bg-[#FEF6F6] px-4 py-3 text-sm text-[#991B1B]"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-xs text-[#5A6D62]">
          Nomor pendaftaran diterbitkan secara otomatis setelah berkas terkirim.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isSubmitting ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran SPMB'}</span>
        </button>
      </div>
    </form>
  );
}
