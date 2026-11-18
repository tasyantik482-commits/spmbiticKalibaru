import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Loader2,
  MessageCircle,
  Printer,
  QrCode,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  buildWhatsAppUrl,
  formatBytesToKb,
  formatRupiah,
  readFileAsPayloadWithInfo,
  submitRegistration,
} from '../services/spmbService';
import {
  GELOMBANG_OPTIONS,
  type AdminApplicantRecord,
  type GelombangPendaftaran,
  type RegistrationResult,
  type UploadedFilePayload,
} from '../types/spmb';
import PrintableRegistrationCard from './PrintableRegistrationCard';

interface RegistrationFormProps {
  onGoToStatusCheck: (noPendaftaran: string, noTelepon: string) => void;
  activeWave?: GelombangPendaftaran;
  waGroupTitle?: string;
  waGroupUrl?: string;
}

type FileSlotKey =
  | 'kartuKeluarga'
  | 'aktaKelahiran'
  | 'pasFoto'
  | 'ktpOrangTua'
  | 'buktiPembayaran';

interface FileSlotConfig {
  key: FileSlotKey;
  label: string;
  helper: string;
  accept: string;
}

interface UploadedFileMeta {
  payload: UploadedFilePayload;
  wasCompressed: boolean;
  originalSizeBytes: number;
}

const QRIS_IMAGE_PATH = '/assets/aistudio/image_fbafdcb7.png';
const OFFICIAL_FEE_AMOUNT = 50000;
const BANK_JATIM_REKENING = '1592015532';

const PENDIDIKAN_OPTIONS = [
  'SD / Sederajat',
  'SMP / Sederajat',
  'SMA / SMK / Sederajat',
  'D1 / D2 / D3',
  'S1 / D4',
  'S2 / S3',
  'Lainnya',
];

const PENGHASILAN_OPTIONS = [
  'Kurang dari Rp 1.000.000',
  'Rp 1.000.000 – Rp 2.500.000',
  'Rp 2.500.000 – Rp 5.000.000',
  'Rp 5.000.000 – Rp 10.000.000',
  'Lebih dari Rp 10.000.000',
  'Tidak Berpenghasilan',
];

const FILE_SLOTS: FileSlotConfig[] = [
  {
    key: 'kartuKeluarga',
    label: '1. Kartu Keluarga (KK)',
    helper: 'Foto JPG/PNG atau PDF · Foto kamera HP otomatis dikompres ringkas',
    accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
  },
  {
    key: 'aktaKelahiran',
    label: '2. Akta Kelahiran Calon Murid',
    helper: 'Foto JPG/PNG atau PDF · Foto kamera HP otomatis dikompres ringkas',
    accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
  },
  {
    key: 'pasFoto',
    label: '3. Pas Foto Calon Murid Ukuran 3 × 4',
    helper: 'Format JPG atau PNG (latar polos rapi)',
    accept: '.jpg,.jpeg,.png,image/jpeg,image/png',
  },
  {
    key: 'ktpOrangTua',
    label: '4. KTP Orang Tua / Wali',
    helper: 'Foto JPG/PNG atau PDF KTP salah satu orang tua atau wali',
    accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
  },
  {
    key: 'buktiPembayaran',
    label: '5. Bukti Pembayaran Biaya Pendaftaran (Rp 50.000,-)',
    helper: 'Struk transfer Bank Jatim, screenshot QRIS, atau kuitansi Sekretariat',
    accept: '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf',
  },
];

export default function RegistrationForm({
  onGoToStatusCheck,
  activeWave = 'Gelombang 1',
  waGroupTitle = 'Grup WA SPMB SDIT INSAN CENDIKIA 27/28',
  waGroupUrl = '',
}: RegistrationFormProps) {
  // Bagian A: Data Calon Murid Baru
  const [gelombang, setGelombang] = useState<GelombangPendaftaran>(activeWave);
  const [namaCalonMurid, setNamaCalonMurid] = useState('');
  const [namaPanggilan, setNamaPanggilan] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'' | 'Laki-laki' | 'Perempuan'>('');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [nikCalonMurid, setNikCalonMurid] = useState('');
  const [anakKe, setAnakKe] = useState('1');
  const [jumlahSaudara, setJumlahSaudara] = useState('0');
  const [statusAnak, setStatusAnak] = useState<
    'Tidak termasuk ketiganya' | 'Yatim' | 'Piatu' | 'Yatim Piatu'
  >('Tidak termasuk ketiganya');
  const [berkebutuhanKhusus, setBerkebutuhanKhusus] = useState<'Tidak' | 'Ya'>('Tidak');
  const [agama, setAgama] = useState('Islam');
  const [golonganDarah, setGolonganDarah] = useState('');
  const [hobi, setHobi] = useState('');
  const [citaCita, setCitaCita] = useState('');
  const [tinggiBadan, setTinggiBadan] = useState('');
  const [beratBadan, setBeratBadan] = useState('');
  const [lingkarKepala, setLingkarKepala] = useState('');

  // Bagian B: Data Orang Tua / Wali
  const [namaAyah, setNamaAyah] = useState('');
  const [nikAyah, setNikAyah] = useState('');
  const [pekerjaanAyah, setPekerjaanAyah] = useState('');
  const [pendidikanAyah, setPendidikanAyah] = useState('');
  const [penghasilanAyah, setPenghasilanAyah] = useState('');

  const [namaIbu, setNamaIbu] = useState('');
  const [nikIbu, setNikIbu] = useState('');
  const [pekerjaanIbu, setPekerjaanIbu] = useState('');
  const [pendidikanIbu, setPendidikanIbu] = useState('');
  const [penghasilanIbu, setPenghasilanIbu] = useState('');

  const [noTelepon, setNoTelepon] = useState('');
  const [email, setEmail] = useState('');

  const [showWaliSection, setShowWaliSection] = useState(false);
  const [namaWali, setNamaWali] = useState('');
  const [pekerjaanWali, setPekerjaanWali] = useState('');
  const [pendidikanWali, setPendidikanWali] = useState('');
  const [penghasilanWali, setPenghasilanWali] = useState('');

  // Bagian C: Data Tempat Tinggal
  const [tinggalDengan, setTinggalDengan] = useState('Orang tua kandung');
  const [alamatSaatIni, setAlamatSaatIni] = useState('');
  const [rtRw, setRtRw] = useState('');
  const [desaKelurahan, setDesaKelurahan] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupatenKota, setKabupatenKota] = useState('Banyuwangi');
  const [provinsi, setProvinsi] = useState('Jawa Timur');
  const [statusKepemilikan, setStatusKepemilikan] = useState('Milik Sendiri');
  const [jumlahKendaraan, setJumlahKendaraan] = useState('1');

  // Bagian D: Pendidikan Sebelumnya
  const [asalTkPaud, setAsalTkPaud] = useState('');
  const [alamatSekolahAsal, setAlamatSekolahAsal] = useState('');
  const [catatanSekolah, setCatatanSekolah] = useState('');

  // Bagian E: Konfirmasi Pembayaran & Upload 5 Berkas
  const [metodePembayaran, setMetodePembayaran] = useState<
    'Transfer Bank Jatim' | 'QRIS Sekolah' | 'Di Sekretariat Sekolah'
  >('Transfer Bank Jatim');
  const [tanggalPembayaran, setTanggalPembayaran] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [namaPengirimPembayaran, setNamaPengirimPembayaran] = useState('');
  const [copiedRekening, setCopiedRekening] = useState(false);
  const [showQrisZoom, setShowQrisZoom] = useState(false);

  const [persetujuan, setPersetujuan] = useState(false);

  const [files, setFiles] = useState<Partial<Record<FileSlotKey, UploadedFileMeta>>>({});
  const [processingSlot, setProcessingSlot] = useState<FileSlotKey | null>(null);
  const [fileErrors, setFileErrors] = useState<Partial<Record<FileSlotKey, string>>>({});
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [receipt, setReceipt] = useState<RegistrationResult | null>(null);
  const [receiptCardData, setReceiptCardData] = useState<AdminApplicantRecord | null>(null);
  const [showPrintCard, setShowPrintCard] = useState(false);
  const [copiedRegNo, setCopiedRegNo] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    setGelombang(activeWave);
  }, [activeWave]);

  useEffect(() => {
    if (!showQrisZoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowQrisZoom(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showQrisZoom]);

  const fileInputRefs = useRef<Record<FileSlotKey, HTMLInputElement | null>>({
    kartuKeluarga: null,
    aktaKelahiran: null,
    pasFoto: null,
    ktpOrangTua: null,
    buktiPembayaran: null,
  });

  const uploadedCount = FILE_SLOTS.filter((slot) => Boolean(files[slot.key])).length;

  const inputClass = (fieldId: string, isMono = false) =>
    `w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm ${
      isMono ? 'font-mono tabular-nums placeholder:font-sans' : ''
    } text-[#0F2419] bg-white border rounded-lg placeholder:text-[#8A9B90] focus:outline-none focus:ring-2 transition-colors ${
      invalidField === fieldId
        ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
        : 'border-[#CCD6CE] focus:border-[#0E6245] focus:ring-[#0E6245]/15'
    }`;

  const flagInvalidField = (elementId: string, message: string) => {
    setInvalidField(elementId);
    setFormError(message);
    setTimeout(() => {
      const target = document.getElementById(elementId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLSelectElement ||
          target instanceof HTMLTextAreaElement
        ) {
          target.focus({ preventScroll: true });
        }
      }
    }, 40);
  };

  const clearFieldError = (fieldId: string) => {
    if (invalidField === fieldId) {
      setInvalidField(null);
    }
  };

  const handleCopyRekening = async () => {
    try {
      await navigator.clipboard.writeText(BANK_JATIM_REKENING);
      setCopiedRekening(true);
      setTimeout(() => setCopiedRekening(false), 2000);
    } catch {
      // Abaikan jika clipboard diblokir browser
    }
  };

  const handleFileChange = async (
    slot: FileSlotConfig,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFileErrors((prev) => ({ ...prev, [slot.key]: undefined }));
    setFormError(null);
    clearFieldError(`slot-${slot.key}`);

    if (slot.key === 'pasFoto' && selected.type === 'application/pdf') {
      setFileErrors((prev) => ({
        ...prev,
        [slot.key]: 'Pas Foto 3 × 4 harus berupa gambar JPG atau PNG.',
      }));
      event.target.value = '';
      return;
    }

    setProcessingSlot(slot.key);
    try {
      const result = await readFileAsPayloadWithInfo(selected);
      setFiles((prev) => ({ ...prev, [slot.key]: result }));
    } catch (err) {
      setFileErrors((prev) => ({
        ...prev,
        [slot.key]: err instanceof Error ? err.message : 'Gagal memproses berkas.',
      }));
      event.target.value = '';
    } finally {
      setProcessingSlot(null);
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
    setInvalidField(null);

    // Validasi Bagian A
    if (!namaCalonMurid.trim()) {
      flagInvalidField('namaCalonMurid', 'Nama lengkap calon murid wajib diisi.');
      return;
    }
    if (!namaPanggilan.trim()) {
      flagInvalidField('namaPanggilan', 'Nama panggilan calon murid wajib diisi.');
      return;
    }
    if (!jenisKelamin) {
      flagInvalidField('jenisKelamin', 'Jenis kelamin calon murid wajib dipilih.');
      return;
    }
    if (!tempatLahir.trim()) {
      flagInvalidField('tempatLahir', 'Tempat lahir calon murid wajib diisi.');
      return;
    }
    if (!tanggalLahir) {
      flagInvalidField('tanggalLahir', 'Tanggal lahir calon murid wajib diisi.');
      return;
    }
    const nikMuridDigits = nikCalonMurid.replace(/\D/g, '');
    if (nikMuridDigits.length !== 16) {
      flagInvalidField('nikCalonMurid', 'NIK calon murid wajib berisi 16 digit angka sesuai KK.');
      return;
    }
    const parsedAnakKe = Number(anakKe);
    if (!parsedAnakKe || parsedAnakKe < 1) {
      flagInvalidField('anakKe', 'Urutan anak ke- wajib diisi (minimal 1).');
      return;
    }
    if (jumlahSaudara === '' || Number(jumlahSaudara) < 0) {
      flagInvalidField('jumlahSaudara', 'Jumlah saudara kandung wajib diisi (isi 0 jika anak tunggal).');
      return;
    }
    if (!agama.trim()) {
      flagInvalidField('agama', 'Agama calon murid wajib diisi.');
      return;
    }

    const tb = Number(tinggiBadan);
    if (!tb || tb < 50 || tb > 200) {
      flagInvalidField('tinggiBadan', 'Mohon isi tinggi badan calon murid (50–200 cm).');
      return;
    }
    const bb = Number(beratBadan);
    if (!bb || bb < 5 || bb > 120) {
      flagInvalidField('beratBadan', 'Mohon isi berat badan calon murid (5–120 kg).');
      return;
    }
    const lk = lingkarKepala.trim() ? Number(lingkarKepala) : 0;
    if (lingkarKepala.trim() && (lk < 30 || lk > 75)) {
      flagInvalidField('lingkarKepala', 'Lingkar kepala diisi antara 30–75 cm (atau kosongkan jika tidak diukur).');
      return;
    }

    // Validasi Bagian B
    if (!namaAyah.trim()) {
      flagInvalidField('namaAyah', 'Nama Ayah kandung wajib diisi.');
      return;
    }
    if (nikAyah.replace(/\D/g, '').length !== 16) {
      flagInvalidField('nikAyah', 'NIK Ayah wajib berisi 16 digit angka.');
      return;
    }
    if (!pekerjaanAyah.trim()) {
      flagInvalidField('pekerjaanAyah', 'Pekerjaan Ayah wajib diisi.');
      return;
    }
    if (!pendidikanAyah) {
      flagInvalidField('pendidikanAyah', 'Pendidikan terakhir Ayah wajib dipilih.');
      return;
    }
    if (!penghasilanAyah) {
      flagInvalidField('penghasilanAyah', 'Rentang penghasilan Ayah wajib dipilih.');
      return;
    }

    if (!namaIbu.trim()) {
      flagInvalidField('namaIbu', 'Nama Ibu kandung wajib diisi.');
      return;
    }
    if (nikIbu.replace(/\D/g, '').length !== 16) {
      flagInvalidField('nikIbu', 'NIK Ibu wajib berisi 16 digit angka.');
      return;
    }
    if (!pekerjaanIbu.trim()) {
      flagInvalidField('pekerjaanIbu', 'Pekerjaan Ibu wajib diisi.');
      return;
    }
    if (!pendidikanIbu) {
      flagInvalidField('pendidikanIbu', 'Pendidikan terakhir Ibu wajib dipilih.');
      return;
    }
    if (!penghasilanIbu) {
      flagInvalidField('penghasilanIbu', 'Rentang penghasilan Ibu wajib dipilih.');
      return;
    }

    const phoneDigits = noTelepon.replace(/\D/g, '');
    if (!noTelepon.trim() || phoneDigits.length < 9 || phoneDigits.length > 15) {
      flagInvalidField(
        'noTelepon',
        'Masukkan nomor WhatsApp / HP aktif yang valid (minimal 9 digit angka).'
      );
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      flagInvalidField('email', 'Format alamat email tidak valid.');
      return;
    }

    // Validasi Bagian C
    if (!alamatSaatIni.trim()) {
      flagInvalidField('alamatSaatIni', 'Alamat tempat tinggal saat ini wajib diisi.');
      return;
    }
    if (!rtRw.trim()) {
      flagInvalidField('rtRw', 'RT / RW alamat saat ini wajib diisi.');
      return;
    }
    if (!desaKelurahan.trim()) {
      flagInvalidField('desaKelurahan', 'Nama Desa / Kelurahan wajib diisi.');
      return;
    }
    if (!kecamatan.trim()) {
      flagInvalidField('kecamatan', 'Nama Kecamatan wajib diisi.');
      return;
    }
    if (!kabupatenKota.trim()) {
      flagInvalidField('kabupatenKota', 'Nama Kabupaten / Kota wajib diisi.');
      return;
    }
    if (!provinsi.trim()) {
      flagInvalidField('provinsi', 'Nama Provinsi wajib diisi.');
      return;
    }

    // Validasi Bagian D
    if (!asalTkPaud.trim()) {
      flagInvalidField(
        'asalTkPaud',
        'Nama TK / RA / PAUD asal wajib diisi (tulis "Belum Pernah" jika langsung dari rumah).'
      );
      return;
    }

    // Validasi Bagian E: Konfirmasi Pembayaran & 5 Berkas
    if (!tanggalPembayaran) {
      flagInvalidField('tanggalPembayaran', 'Tanggal pembayaran biaya pendaftaran wajib diisi.');
      return;
    }
    if (!namaPengirimPembayaran.trim()) {
      flagInvalidField(
        'namaPengirimPembayaran',
        'Nama pengirim / pembayar biaya pendaftaran wajib diisi.'
      );
      return;
    }

    if (!files.kartuKeluarga) {
      flagInvalidField('slot-kartuKeluarga', 'Berkas Kartu Keluarga (KK) wajib dilampirkan.');
      return;
    }
    if (!files.aktaKelahiran) {
      flagInvalidField('slot-aktaKelahiran', 'Berkas Akta Kelahiran wajib dilampirkan.');
      return;
    }
    if (!files.pasFoto) {
      flagInvalidField('slot-pasFoto', 'Berkas Pas Foto ukuran 3 × 4 wajib dilampirkan.');
      return;
    }
    if (!files.ktpOrangTua) {
      flagInvalidField('slot-ktpOrangTua', 'Berkas KTP Orang Tua / Wali wajib dilampirkan.');
      return;
    }
    if (!files.buktiPembayaran) {
      flagInvalidField(
        'slot-buktiPembayaran',
        'Bukti Pembayaran biaya pendaftaran (Rp 50.000,-) wajib diunggah sebelum mengirim formulir.'
      );
      return;
    }

    if (!persetujuan) {
      flagInvalidField(
        'persetujuan-box',
        'Centang pernyataan persetujuan bahwa data benar dan sekolah diperbolehkan menghubungi Anda.'
      );
      return;
    }

    const summaryNamaOrtu = [namaAyah.trim(), namaIbu.trim()].filter(Boolean).join(' / ');

    setIsSubmitting(true);
    try {
      const kkPayload = files.kartuKeluarga.payload;
      const aktaPayload = files.aktaKelahiran.payload;
      const fotoPayload = files.pasFoto.payload;
      const ktpPayload = files.ktpOrangTua.payload;
      const buktiPayload = files.buktiPembayaran.payload;

      const result = await submitRegistration({
        gelombang,
        namaCalonMurid: namaCalonMurid.trim(),
        namaPanggilan: namaPanggilan.trim(),
        jenisKelamin,
        tempatLahir: tempatLahir.trim(),
        tanggalLahir,
        nikCalonMurid: nikMuridDigits,
        anakKe: parsedAnakKe,
        jumlahSaudara: Number(jumlahSaudara) || 0,
        statusAnak,
        berkebutuhanKhusus,
        agama: agama.trim(),
        golonganDarah,
        hobi: hobi.trim(),
        citaCita: citaCita.trim(),
        tinggiBadan: tb,
        beratBadan: bb,
        lingkarKepala: lk,

        namaAyah: namaAyah.trim(),
        nikAyah: nikAyah.replace(/\D/g, ''),
        pekerjaanAyah: pekerjaanAyah.trim(),
        pendidikanAyah,
        penghasilanAyah,

        namaIbu: namaIbu.trim(),
        nikIbu: nikIbu.replace(/\D/g, ''),
        pekerjaanIbu: pekerjaanIbu.trim(),
        pendidikanIbu,
        penghasilanIbu,

        namaOrangTua: summaryNamaOrtu,
        noTelepon: noTelepon.trim(),
        email: email.trim(),

        namaWali: namaWali.trim(),
        pekerjaanWali: pekerjaanWali.trim(),
        pendidikanWali,
        penghasilanWali,

        tinggalDengan,
        alamatSaatIni: alamatSaatIni.trim(),
        rtRw: rtRw.trim(),
        desaKelurahan: desaKelurahan.trim(),
        kecamatan: kecamatan.trim(),
        kabupatenKota: kabupatenKota.trim(),
        provinsi: provinsi.trim(),
        statusKepemilikan,
        jumlahKendaraan,

        asalTkPaud: asalTkPaud.trim(),
        alamatSekolahAsal: alamatSekolahAsal.trim(),
        catatanSekolah: catatanSekolah.trim(),

        metodePembayaran,
        tanggalPembayaran,
        nominalPembayaran: OFFICIAL_FEE_AMOUNT,
        namaPengirimPembayaran: namaPengirimPembayaran.trim(),

        persetujuan,
        files: {
          kartuKeluarga: kkPayload,
          aktaKelahiran: aktaPayload,
          pasFoto: fotoPayload,
          ktpOrangTua: ktpPayload,
          buktiPembayaran: buktiPayload,
        },
      });

      const localPhotoDataUrl = `data:${fotoPayload.mimeType};base64,${fotoPayload.base64}`;
      const localKkDataUrl = `data:${kkPayload.mimeType};base64,${kkPayload.base64}`;
      const localAktaDataUrl = `data:${aktaPayload.mimeType};base64,${aktaPayload.base64}`;
      const localKtpDataUrl = `data:${ktpPayload.mimeType};base64,${ktpPayload.base64}`;
      const localBuktiDataUrl = `data:${buktiPayload.mimeType};base64,${buktiPayload.base64}`;

      setReceipt(result);
      setReceiptCardData({
        noPendaftaran: result.noPendaftaran,
        waktuDaftar: result.waktuDaftar,
        gelombang: result.gelombang || gelombang,
        namaCalonMurid: result.namaCalonMurid,
        namaPanggilan: namaPanggilan.trim(),
        jenisKelamin,
        tempatLahir: tempatLahir.trim(),
        tanggalLahir,
        nikCalonMurid: nikMuridDigits,
        anakKe: parsedAnakKe,
        jumlahSaudara: Number(jumlahSaudara) || 0,
        statusAnak,
        berkebutuhanKhusus,
        agama: agama.trim(),
        golonganDarah,
        hobi: hobi.trim(),
        citaCita: citaCita.trim(),
        tinggiBadan: tb,
        beratBadan: bb,
        lingkarKepala: lk,

        namaAyah: namaAyah.trim(),
        nikAyah: nikAyah.replace(/\D/g, ''),
        pekerjaanAyah: pekerjaanAyah.trim(),
        pendidikanAyah,
        penghasilanAyah,

        namaIbu: namaIbu.trim(),
        nikIbu: nikIbu.replace(/\D/g, ''),
        pekerjaanIbu: pekerjaanIbu.trim(),
        pendidikanIbu,
        penghasilanIbu,

        namaOrangTua: result.namaOrangTua,
        noTelepon: result.noTelepon,
        email: email.trim() || '-',

        namaWali: namaWali.trim() || '-',
        pekerjaanWali: pekerjaanWali.trim() || '-',
        pendidikanWali: pendidikanWali || '-',
        penghasilanWali: penghasilanWali || '-',

        tinggalDengan,
        alamatSaatIni: alamatSaatIni.trim(),
        rtRw: rtRw.trim(),
        desaKelurahan: desaKelurahan.trim(),
        kecamatan: kecamatan.trim(),
        kabupatenKota: kabupatenKota.trim(),
        provinsi: provinsi.trim(),
        statusKepemilikan,
        jumlahKendaraan,

        asalTkPaud: asalTkPaud.trim(),
        alamatSekolahAsal: alamatSekolahAsal.trim() || '-',
        catatanSekolah: catatanSekolah.trim() || '-',

        metodePembayaran,
        tanggalPembayaran,
        nominalPembayaran: OFFICIAL_FEE_AMOUNT,
        namaPengirimPembayaran: namaPengirimPembayaran.trim(),

        urlKartuKeluarga: result.urlKartuKeluarga || localKkDataUrl,
        downloadKartuKeluarga: localKkDataUrl,
        kkFileName: kkPayload.fileName,
        urlAktaKelahiran: result.urlAktaKelahiran || localAktaDataUrl,
        downloadAktaKelahiran: localAktaDataUrl,
        aktaFileName: aktaPayload.fileName,
        urlPasFoto: localPhotoDataUrl,
        downloadPasFoto: localPhotoDataUrl,
        fotoFileName: fotoPayload.fileName,
        urlKtpOrangTua: result.urlKtpOrangTua || localKtpDataUrl,
        downloadKtpOrangTua: localKtpDataUrl,
        ktpFileName: ktpPayload.fileName,
        urlBuktiPembayaran: result.urlBuktiPembayaran || localBuktiDataUrl,
        downloadBuktiPembayaran: localBuktiDataUrl,
        buktiBayarFileName: buktiPayload.fileName,

        statusVerifikasi: result.statusVerifikasi,
        catatanPanitia: result.catatanPanitia,
        tanggalObservasi: '',
        waktuObservasi: '',
        source: result.source,
      });
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

  const handleCopySummary = async () => {
    if (!receipt) return;
    const text = [
      'BUKTI PENDAFTARAN SPMB 2027/2028',
      'SDIT Insan Cendikia Kalibaru',
      `No. Pendaftaran: ${receipt.noPendaftaran}`,
      `Gelombang: ${receipt.gelombang || gelombang}`,
      `Calon Murid: ${receipt.namaCalonMurid}`,
      `Orang Tua/Wali: ${receipt.namaOrangTua}`,
      `No. WhatsApp: ${receipt.noTelepon}`,
      `Pembayaran: ${receipt.metodePembayaran || metodePembayaran} (${formatRupiah(
        receipt.nominalPembayaran || OFFICIAL_FEE_AMOUNT
      )})`,
      `Status: ${receipt.statusVerifikasi}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Abaikan jika clipboard diblokir browser
    }
  };

  const handleResetForm = () => {
    setReceipt(null);
    setReceiptCardData(null);
    setShowPrintCard(false);
    setGelombang(activeWave);
    setNamaCalonMurid('');
    setNamaPanggilan('');
    setJenisKelamin('');
    setTempatLahir('');
    setTanggalLahir('');
    setNikCalonMurid('');
    setAnakKe('1');
    setJumlahSaudara('0');
    setStatusAnak('Tidak termasuk ketiganya');
    setBerkebutuhanKhusus('Tidak');
    setAgama('Islam');
    setGolonganDarah('');
    setHobi('');
    setCitaCita('');
    setTinggiBadan('');
    setBeratBadan('');
    setLingkarKepala('');
    setNamaAyah('');
    setNikAyah('');
    setPekerjaanAyah('');
    setPendidikanAyah('');
    setPenghasilanAyah('');
    setNamaIbu('');
    setNikIbu('');
    setPekerjaanIbu('');
    setPendidikanIbu('');
    setPenghasilanIbu('');
    setNoTelepon('');
    setEmail('');
    setShowWaliSection(false);
    setNamaWali('');
    setPekerjaanWali('');
    setPendidikanWali('');
    setPenghasilanWali('');
    setTinggalDengan('Orang tua kandung');
    setAlamatSaatIni('');
    setRtRw('');
    setDesaKelurahan('');
    setKecamatan('');
    setKabupatenKota('Banyuwangi');
    setProvinsi('Jawa Timur');
    setStatusKepemilikan('Milik Sendiri');
    setJumlahKendaraan('1');
    setAsalTkPaud('');
    setAlamatSekolahAsal('');
    setCatatanSekolah('');
    setMetodePembayaran('Transfer Bank Jatim');
    setTanggalPembayaran(new Date().toISOString().slice(0, 10));
    setNamaPengirimPembayaran('');
    setPersetujuan(false);
    setFiles({});
    setFileErrors({});
    setInvalidField(null);
    setFormError(null);
  };

  if (receipt) {
    const cleanWaGroupUrl = waGroupUrl.trim();
    const fallbackAdminWaUrl = buildWhatsAppUrl(
      '085236000000',
      `Assalamu'alaikum Panitia SPMB SDIT Insan Cendikia Kalibaru, saya wali dari *${receipt.namaCalonMurid}* (No. Pendaftaran: *${receipt.noPendaftaran}*). Mohon tautan undangan *${waGroupTitle}*.`
    );

    return (
      <>
        <div className="bg-white border border-[#DCE4DE] rounded-xl p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-8 border-b border-[#E6ECE7]">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0E6245]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Pendaftaran SPMB Berhasil Dikirim · {receipt.gelombang || gelombang}</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F2419]">
                Bukti Pendaftaran Calon Murid Baru
              </h3>
              <p className="text-sm text-[#4A5D52] max-w-xl">
                Simpan nomor pendaftaran berikut untuk memeriksa status verifikasi berkas, pembayaran, serta jadwal observasi calon murid secara berkala.
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
              <dt className="text-xs font-medium text-[#5A6D62]">Gelombang Pendaftaran</dt>
              <dd className="mt-1 font-semibold text-[#0F2419]">{receipt.gelombang || gelombang}</dd>
            </div>
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
              <dt className="text-xs font-medium text-[#5A6D62]">Pembayaran Pendaftaran</dt>
              <dd className="mt-1 font-medium text-[#0F2419]">
                {receipt.metodePembayaran || metodePembayaran} ·{' '}
                <span className="font-mono tabular-nums">
                  {formatRupiah(receipt.nominalPembayaran || OFFICIAL_FEE_AMOUNT)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5A6D62]">Status Saat Ini</dt>
              <dd className="mt-1 font-semibold text-[#B45309]">{receipt.statusVerifikasi}</dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs font-medium text-[#5A6D62]">Keterangan</dt>
              <dd className="mt-1 text-[#2D4035]">{receipt.catatanPanitia}</dd>
            </div>
          </dl>

          {/* Perbaikan #3: Arahkan ke Grup WA SPMB SDIT INSAN CENDIKIA 27/28 */}
          <div className="no-print mt-6 rounded-xl border border-[#B9DEC7] bg-[#F2F9F4] p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#0E6245]">
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Langkah Wajib Berikutnya</span>
              </div>
              <h4 className="font-display text-base sm:text-lg font-semibold text-[#0F2419]">
                Gabung {waGroupTitle}
              </h4>
              <p className="text-xs sm:text-sm text-[#355242] max-w-2xl leading-relaxed">
                Seluruh informasi resmi terkait jadwal observasi calon murid, pengumuman hasil seleksi, dan daftar ulang akan dibagikan melalui grup WhatsApp wali calon murid baru.
              </p>
            </div>
            <div className="shrink-0">
              {cleanWaGroupUrl ? (
                <a
                  href={cleanWaGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-2.5 text-sm font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Gabung {waGroupTitle}</span>
                </a>
              ) : (
                <div className="space-y-1.5 text-xs text-[#355242]">
                  <a
                    href={fallbackAdminWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Hubungi Panitia untuk Link Grup WA</span>
                  </a>
                  <p className="text-[11px] text-[#5A6D62]">
                    Tautan grup dapat diatur langsung oleh Panitia di Panel Admin.
                  </p>
                </div>
              )}
            </div>
          </div>

          {receipt.source === 'local_preview' && (
            <div className="mt-6 rounded-lg border border-[#E5D5B5] bg-[#FDF9F0] px-4 py-3 text-xs text-[#7C4A10]">
              Catatan: Data saat ini tersimpan di pratinjau browser lokal karena <code className="font-mono">VITE_APPS_SCRIPT_URL</code> belum diatur. Untuk menyimpan langsung ke Google Spreadsheet SDIT Insan Cendikia Kalibaru, lengkapi URL Web App Apps Script di Vercel atau melalui menu Pengaturan Apps Script pada <strong>Panel Admin</strong>.
            </div>
          )}

          <div className="no-print mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPrintCard(true)}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan Kartu Resmi</span>
              </button>
              <button
                type="button"
                onClick={() => onGoToStatusCheck(receipt.noPendaftaran, receipt.noTelepon)}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm font-semibold text-[#0F2419] bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg hover:bg-[#E5EFE9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Cek Status Pendaftaran
              </button>
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 text-sm font-medium text-[#0F2419] bg-white border border-[#CFD9D2] rounded-lg hover:bg-[#F4F7F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedSummary ? <Check className="w-4 h-4 text-[#0E6245]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSummary ? 'Info Tersalin' : 'Salin Info Bukti'}</span>
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

        <PrintableRegistrationCard
          applicant={showPrintCard ? receiptCardData : null}
          onClose={() => setShowPrintCard(false)}
        />
      </>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-[#DCE4DE] rounded-xl p-5 sm:p-8 lg:p-10 space-y-10"
      >
        {/* BAGIAN A: DATA CALON MURID BARU */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-3 border-b border-[#E6ECE7]">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#0F2419]">
                Bagian A. Data Calon Murid Baru
              </h3>
              <p className="text-xs text-[#5A6D62] mt-0.5">
                Pilih gelombang pendaftaran dan lengkapi identitas sesuai Akta Kelahiran / Kartu Keluarga.
              </p>
            </div>
            <span className="text-xs text-[#5A6D62] shrink-0">Tanda * wajib diisi</span>
          </div>

          {/* Pilihan Gelombang (Perbaikan #1) */}
          <div className="bg-[#F7FAF8] border border-[#DCE4DE] rounded-lg p-4 sm:p-5 space-y-2.5">
            <div className="text-sm font-medium text-[#1D3126]">
              Gelombang Pendaftaran <span className="text-[#B91C1C]">*</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GELOMBANG_OPTIONS.map((opt) => {
                const selected = gelombang === opt;
                const estMonth = opt === 'Gelombang 1' ? 'Februari 2027' : 'April 2027';
                return (
                  <label
                    key={opt}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      selected
                        ? 'border-[#0E6245] bg-white ring-2 ring-[#0E6245]/15'
                        : 'border-[#CCD6CE] bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="gelombang"
                        value={opt}
                        checked={selected}
                        onChange={() => setGelombang(opt)}
                        className="h-4 w-4 text-[#0E6245] focus:ring-[#0E6245] cursor-pointer"
                      />
                      <div>
                        <div className="text-sm font-semibold text-[#0F2419]">{opt}</div>
                        <div className="text-xs text-[#5A6D62]">
                          {opt === activeWave
                            ? `Dibuka saat ini · Perkiraan observasi: ${estMonth}`
                            : `Perkiraan observasi: ${estMonth} (tgl menyusul)`}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <label htmlFor="namaCalonMurid" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                1. Nama Lengkap Calon Murid <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="namaCalonMurid"
                type="text"
                required
                value={namaCalonMurid}
                onChange={(e) => {
                  setNamaCalonMurid(e.target.value);
                  clearFieldError('namaCalonMurid');
                }}
                placeholder="Sesuai Akta Kelahiran / KK"
                className={inputClass('namaCalonMurid')}
              />
            </div>

            <div>
              <label htmlFor="namaPanggilan" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                2. Nama Panggilan <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="namaPanggilan"
                type="text"
                required
                value={namaPanggilan}
                onChange={(e) => {
                  setNamaPanggilan(e.target.value);
                  clearFieldError('namaPanggilan');
                }}
                placeholder="Contoh: Zaidan"
                className={inputClass('namaPanggilan')}
              />
            </div>

            <div>
              <label htmlFor="jenisKelamin" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                3. Jenis Kelamin <span className="text-[#B91C1C]">*</span>
              </label>
              <select
                id="jenisKelamin"
                required
                value={jenisKelamin}
                onChange={(e) => {
                  setJenisKelamin(e.target.value as '' | 'Laki-laki' | 'Perempuan');
                  clearFieldError('jenisKelamin');
                }}
                className={inputClass('jenisKelamin')}
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label htmlFor="tempatLahir" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                4. Tempat Lahir <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="tempatLahir"
                type="text"
                required
                value={tempatLahir}
                onChange={(e) => {
                  setTempatLahir(e.target.value);
                  clearFieldError('tempatLahir');
                }}
                placeholder="Contoh: Banyuwangi"
                className={inputClass('tempatLahir')}
              />
            </div>

            <div>
              <label htmlFor="tanggalLahir" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                5. Tanggal Lahir <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="tanggalLahir"
                type="date"
                required
                value={tanggalLahir}
                onChange={(e) => {
                  setTanggalLahir(e.target.value);
                  clearFieldError('tanggalLahir');
                }}
                className={inputClass('tanggalLahir')}
              />
            </div>

            <div>
              <label htmlFor="nikCalonMurid" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                6. NIK Calon Murid (16 Digit) <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="nikCalonMurid"
                type="text"
                inputMode="numeric"
                maxLength={16}
                required
                value={nikCalonMurid}
                onChange={(e) => {
                  setNikCalonMurid(e.target.value.replace(/\D/g, ''));
                  clearFieldError('nikCalonMurid');
                }}
                placeholder="3510xxxxxxxxxxxx"
                className={inputClass('nikCalonMurid', true)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="anakKe" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                  7. Anak ke- <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="anakKe"
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={anakKe}
                  onChange={(e) => {
                    setAnakKe(e.target.value);
                    clearFieldError('anakKe');
                  }}
                  className={inputClass('anakKe', true)}
                />
              </div>
              <div>
                <label htmlFor="jumlahSaudara" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                  Saudara <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="jumlahSaudara"
                  type="number"
                  min={0}
                  max={20}
                  required
                  value={jumlahSaudara}
                  onChange={(e) => {
                    setJumlahSaudara(e.target.value);
                    clearFieldError('jumlahSaudara');
                  }}
                  className={inputClass('jumlahSaudara', true)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="statusAnak" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                8. Status Anak <span className="text-[#B91C1C]">*</span>
              </label>
              <select
                id="statusAnak"
                value={statusAnak}
                onChange={(e) =>
                  setStatusAnak(
                    e.target.value as
                      | 'Tidak termasuk ketiganya'
                      | 'Yatim'
                      | 'Piatu'
                      | 'Yatim Piatu'
                  )
                }
                className={inputClass('statusAnak')}
              >
                <option value="Tidak termasuk ketiganya">Tidak termasuk ketiganya</option>
                <option value="Yatim">Yatim</option>
                <option value="Piatu">Piatu</option>
                <option value="Yatim Piatu">Yatim Piatu</option>
              </select>
            </div>

            <div>
              <label htmlFor="berkebutuhanKhusus" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                9. Anak Berkebutuhan Khusus <span className="text-[#B91C1C]">*</span>
              </label>
              <select
                id="berkebutuhanKhusus"
                value={berkebutuhanKhusus}
                onChange={(e) => setBerkebutuhanKhusus(e.target.value as 'Tidak' | 'Ya')}
                className={inputClass('berkebutuhanKhusus')}
              >
                <option value="Tidak">Tidak</option>
                <option value="Ya">Ya (tuliskan detail pada Catatan Sekolah)</option>
              </select>
            </div>

            <div>
              <label htmlFor="agama" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                10. Agama <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="agama"
                type="text"
                required
                value={agama}
                onChange={(e) => {
                  setAgama(e.target.value);
                  clearFieldError('agama');
                }}
                className={inputClass('agama')}
              />
            </div>

            <div>
              <label htmlFor="golonganDarah" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                11. Golongan Darah <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
              </label>
              <select
                id="golonganDarah"
                value={golonganDarah}
                onChange={(e) => setGolonganDarah(e.target.value)}
                className={inputClass('golonganDarah')}
              >
                <option value="">Belum diketahui</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>

            <div>
              <label htmlFor="hobi" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                12. Hobi <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
              </label>
              <input
                id="hobi"
                type="text"
                value={hobi}
                onChange={(e) => setHobi(e.target.value)}
                placeholder="Contoh: Membaca, menggambar"
                className={inputClass('hobi')}
              />
            </div>

            <div>
              <label htmlFor="citaCita" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                13. Cita-cita <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
              </label>
              <input
                id="citaCita"
                type="text"
                value={citaCita}
                onChange={(e) => setCitaCita(e.target.value)}
                placeholder="Contoh: Dokter, Guru, Hafizh"
                className={inputClass('citaCita')}
              />
            </div>

            <div>
              <label htmlFor="tinggiBadan" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                14. Tinggi Badan (TB) <span className="text-[#B91C1C]">*</span>
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
                  onChange={(e) => {
                    setTinggiBadan(e.target.value);
                    clearFieldError('tinggiBadan');
                  }}
                  placeholder="115"
                  className={`${inputClass('tinggiBadan', true)} pr-12`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5A6D62]">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="beratBadan" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                15. Berat Badan (BB) <span className="text-[#B91C1C]">*</span>
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
                  onChange={(e) => {
                    setBeratBadan(e.target.value);
                    clearFieldError('beratBadan');
                  }}
                  placeholder="21"
                  className={`${inputClass('beratBadan', true)} pr-12`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5A6D62]">
                  kg
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="lingkarKepala" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Lingkar Kepala <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
              </label>
              <div className="relative">
                <input
                  id="lingkarKepala"
                  type="number"
                  inputMode="decimal"
                  min={30}
                  max={75}
                  step="0.1"
                  value={lingkarKepala}
                  onChange={(e) => {
                    setLingkarKepala(e.target.value);
                    clearFieldError('lingkarKepala');
                  }}
                  placeholder="50"
                  className={`${inputClass('lingkarKepala', true)} pr-12`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#5A6D62]">
                  cm
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* BAGIAN B: DATA ORANG TUA / WALI */}
        <section className="pt-8 border-t border-[#E6ECE7] space-y-6">
          <div className="pb-3 border-b border-[#E6ECE7]">
            <h3 className="font-display text-lg font-semibold text-[#0F2419]">
              Bagian B. Data Orang Tua / Wali
            </h3>
            <p className="text-xs text-[#5A6D62] mt-0.5">
              Isikan biodata Ayah Kandung, Ibu Kandung, dan nomor WhatsApp aktif untuk komunikasi panitia.
            </p>
          </div>

          {/* Ayah Kandung */}
          <div className="p-4 sm:p-5 rounded-lg border border-[#E6ECE7] bg-[#FAFBF9] space-y-4">
            <div className="text-sm font-semibold text-[#0F2419]">1. Data Ayah Kandung</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="namaAyah" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Nama Ayah Kandung <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="namaAyah"
                  type="text"
                  required
                  value={namaAyah}
                  onChange={(e) => {
                    setNamaAyah(e.target.value);
                    clearFieldError('namaAyah');
                  }}
                  placeholder="Sesuai KTP / KK"
                  className={inputClass('namaAyah')}
                />
              </div>
              <div>
                <label htmlFor="nikAyah" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  NIK Ayah (16 Digit) <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="nikAyah"
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  required
                  value={nikAyah}
                  onChange={(e) => {
                    setNikAyah(e.target.value.replace(/\D/g, ''));
                    clearFieldError('nikAyah');
                  }}
                  placeholder="3510xxxxxxxxxxxx"
                  className={inputClass('nikAyah', true)}
                />
              </div>
              <div>
                <label htmlFor="pekerjaanAyah" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Pekerjaan Ayah <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="pekerjaanAyah"
                  type="text"
                  required
                  value={pekerjaanAyah}
                  onChange={(e) => {
                    setPekerjaanAyah(e.target.value);
                    clearFieldError('pekerjaanAyah');
                  }}
                  placeholder="Contoh: Wiraswasta / Guru / Karyawan"
                  className={inputClass('pekerjaanAyah')}
                />
              </div>
              <div>
                <label htmlFor="pendidikanAyah" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Pendidikan Terakhir Ayah <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  id="pendidikanAyah"
                  required
                  value={pendidikanAyah}
                  onChange={(e) => {
                    setPendidikanAyah(e.target.value);
                    clearFieldError('pendidikanAyah');
                  }}
                  className={inputClass('pendidikanAyah')}
                >
                  <option value="">Pilih pendidikan terakhir</option>
                  {PENDIDIKAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label htmlFor="penghasilanAyah" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Rentang Penghasilan Ayah / Bulan <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  id="penghasilanAyah"
                  required
                  value={penghasilanAyah}
                  onChange={(e) => {
                    setPenghasilanAyah(e.target.value);
                    clearFieldError('penghasilanAyah');
                  }}
                  className={inputClass('penghasilanAyah')}
                >
                  <option value="">Pilih rentang penghasilan</option>
                  {PENGHASILAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ibu Kandung */}
          <div className="p-4 sm:p-5 rounded-lg border border-[#E6ECE7] bg-[#FAFBF9] space-y-4">
            <div className="text-sm font-semibold text-[#0F2419]">2. Data Ibu Kandung</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="namaIbu" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Nama Ibu Kandung <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="namaIbu"
                  type="text"
                  required
                  value={namaIbu}
                  onChange={(e) => {
                    setNamaIbu(e.target.value);
                    clearFieldError('namaIbu');
                  }}
                  placeholder="Sesuai KTP / KK"
                  className={inputClass('namaIbu')}
                />
              </div>
              <div>
                <label htmlFor="nikIbu" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  NIK Ibu (16 Digit) <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="nikIbu"
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  required
                  value={nikIbu}
                  onChange={(e) => {
                    setNikIbu(e.target.value.replace(/\D/g, ''));
                    clearFieldError('nikIbu');
                  }}
                  placeholder="3510xxxxxxxxxxxx"
                  className={inputClass('nikIbu', true)}
                />
              </div>
              <div>
                <label htmlFor="pekerjaanIbu" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Pekerjaan Ibu <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="pekerjaanIbu"
                  type="text"
                  required
                  value={pekerjaanIbu}
                  onChange={(e) => {
                    setPekerjaanIbu(e.target.value);
                    clearFieldError('pekerjaanIbu');
                  }}
                  placeholder="Contoh: Ibu Rumah Tangga / Guru"
                  className={inputClass('pekerjaanIbu')}
                />
              </div>
              <div>
                <label htmlFor="pendidikanIbu" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Pendidikan Terakhir Ibu <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  id="pendidikanIbu"
                  required
                  value={pendidikanIbu}
                  onChange={(e) => {
                    setPendidikanIbu(e.target.value);
                    clearFieldError('pendidikanIbu');
                  }}
                  className={inputClass('pendidikanIbu')}
                >
                  <option value="">Pilih pendidikan terakhir</option>
                  {PENDIDIKAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label htmlFor="penghasilanIbu" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Rentang Penghasilan Ibu / Bulan <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  id="penghasilanIbu"
                  required
                  value={penghasilanIbu}
                  onChange={(e) => {
                    setPenghasilanIbu(e.target.value);
                    clearFieldError('penghasilanIbu');
                  }}
                  className={inputClass('penghasilanIbu')}
                >
                  <option value="">Pilih rentang penghasilan</option>
                  {PENGHASILAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Kontak Aktif */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="noTelepon" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Nomor WhatsApp / HP Aktif <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="noTelepon"
                type="tel"
                inputMode="tel"
                required
                value={noTelepon}
                onChange={(e) => {
                  setNoTelepon(e.target.value);
                  clearFieldError('noTelepon');
                }}
                placeholder="Contoh: 081234567890"
                className={inputClass('noTelepon', true)}
              />
              <p className="mt-1 text-xs text-[#5A6D62]">
                Digunakan untuk konfirmasi panitia, jadwal observasi, dan pengecekan status.
              </p>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Alamat Email <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                placeholder="orangtua@contoh.com"
                className={inputClass('email')}
              />
            </div>
          </div>

          {/* Data Wali (Opsional) */}
          <div className="border border-[#DCE4DE] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowWaliSection((prev) => !prev)}
              aria-expanded={showWaliSection}
              className="w-full min-h-[48px] px-4 py-3 bg-[#F7FAF8] hover:bg-[#F0F5F2] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
            >
              <div className="text-sm font-medium text-[#0F2419]">
                3. Data Wali Murid{' '}
                <span className="text-xs font-normal text-[#5A6D62]">(Opsional — isi bila calon murid tinggal bersama wali)</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E6245] shrink-0">
                <span>{showWaliSection ? 'Tutup' : 'Isi Data Wali'}</span>
                {showWaliSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            {showWaliSection && (
              <div className="p-4 sm:p-5 bg-white border-t border-[#E6ECE7] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="namaWali" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                    Nama Wali
                  </label>
                  <input
                    id="namaWali"
                    type="text"
                    value={namaWali}
                    onChange={(e) => setNamaWali(e.target.value)}
                    placeholder="Nama lengkap wali"
                    className={inputClass('namaWali')}
                  />
                </div>
                <div>
                  <label htmlFor="pekerjaanWali" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                    Pekerjaan Wali
                  </label>
                  <input
                    id="pekerjaanWali"
                    type="text"
                    value={pekerjaanWali}
                    onChange={(e) => setPekerjaanWali(e.target.value)}
                    placeholder="Pekerjaan wali"
                    className={inputClass('pekerjaanWali')}
                  />
                </div>
                <div>
                  <label htmlFor="pendidikanWali" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                    Pendidikan Terakhir Wali
                  </label>
                  <select
                    id="pendidikanWali"
                    value={pendidikanWali}
                    onChange={(e) => setPendidikanWali(e.target.value)}
                    className={inputClass('pendidikanWali')}
                  >
                    <option value="">Pilih pendidikan</option>
                    {PENDIDIKAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="penghasilanWali" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                    Rentang Penghasilan Wali
                  </label>
                  <select
                    id="penghasilanWali"
                    value={penghasilanWali}
                    onChange={(e) => setPenghasilanWali(e.target.value)}
                    className={inputClass('penghasilanWali')}
                  >
                    <option value="">Pilih rentang penghasilan</option>
                    {PENGHASILAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* BAGIAN C: DATA TEMPAT TINGGAL */}
        <section className="pt-8 border-t border-[#E6ECE7] space-y-6">
          <div className="pb-3 border-b border-[#E6ECE7]">
            <h3 className="font-display text-lg font-semibold text-[#0F2419]">
              Bagian C. Data Tempat Tinggal
            </h3>
            <p className="text-xs text-[#5A6D62] mt-0.5">
              Alamat domisili calon murid saat ini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label htmlFor="tinggalDengan" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                1. Bertempat Tinggal Dengan <span className="text-[#B91C1C]">*</span>
              </label>
              <select
                id="tinggalDengan"
                value={tinggalDengan}
                onChange={(e) => setTinggalDengan(e.target.value)}
                className={inputClass('tinggalDengan')}
              >
                <option value="Orang tua kandung">Orang tua kandung</option>
                <option value="Wali">Wali</option>
                <option value="Keluarga lain">Keluarga lain / Kakek-Nenek</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="alamatSaatIni" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                2. Alamat Jalan / Dusun Saat Ini <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="alamatSaatIni"
                type="text"
                required
                value={alamatSaatIni}
                onChange={(e) => {
                  setAlamatSaatIni(e.target.value);
                  clearFieldError('alamatSaatIni');
                }}
                placeholder="Contoh: Jl. Pahlawan / Dusun Krajan"
                className={inputClass('alamatSaatIni')}
              />
            </div>

            <div>
              <label htmlFor="rtRw" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                RT / RW <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="rtRw"
                type="text"
                required
                value={rtRw}
                onChange={(e) => {
                  setRtRw(e.target.value);
                  clearFieldError('rtRw');
                }}
                placeholder="Contoh: 001 / 006"
                className={inputClass('rtRw', true)}
              />
            </div>

            <div>
              <label htmlFor="desaKelurahan" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Desa / Kelurahan <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="desaKelurahan"
                type="text"
                required
                value={desaKelurahan}
                onChange={(e) => {
                  setDesaKelurahan(e.target.value);
                  clearFieldError('desaKelurahan');
                }}
                placeholder="Contoh: Kalibaru Kulon"
                className={inputClass('desaKelurahan')}
              />
            </div>

            <div>
              <label htmlFor="kecamatan" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Kecamatan <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="kecamatan"
                type="text"
                required
                value={kecamatan}
                onChange={(e) => {
                  setKecamatan(e.target.value);
                  clearFieldError('kecamatan');
                }}
                placeholder="Contoh: Kalibaru"
                className={inputClass('kecamatan')}
              />
            </div>

            <div>
              <label htmlFor="kabupatenKota" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Kabupaten / Kota <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="kabupatenKota"
                type="text"
                required
                value={kabupatenKota}
                onChange={(e) => {
                  setKabupatenKota(e.target.value);
                  clearFieldError('kabupatenKota');
                }}
                className={inputClass('kabupatenKota')}
              />
            </div>

            <div>
              <label htmlFor="provinsi" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Provinsi <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="provinsi"
                type="text"
                required
                value={provinsi}
                onChange={(e) => {
                  setProvinsi(e.target.value);
                  clearFieldError('provinsi');
                }}
                className={inputClass('provinsi')}
              />
            </div>

            <div>
              <label htmlFor="statusKepemilikan" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Status Kepemilikan Rumah
              </label>
              <select
                id="statusKepemilikan"
                value={statusKepemilikan}
                onChange={(e) => setStatusKepemilikan(e.target.value)}
                className={inputClass('statusKepemilikan')}
              >
                <option value="Milik Sendiri">Milik Sendiri</option>
                <option value="Rumah Orang Tua / Keluarga">Rumah Orang Tua / Keluarga</option>
                <option value="Sewa / Kontrak">Sewa / Kontrak</option>
                <option value="Rumah Dinas">Rumah Dinas</option>
              </select>
            </div>

            <div>
              <label htmlFor="jumlahKendaraan" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Jumlah Kendaraan Keluarga
              </label>
              <select
                id="jumlahKendaraan"
                value={jumlahKendaraan}
                onChange={(e) => setJumlahKendaraan(e.target.value)}
                className={inputClass('jumlahKendaraan')}
              >
                <option value="0 (Tidak ada)">0 (Tidak ada)</option>
                <option value="1">1 kendaraan</option>
                <option value="2">2 kendaraan</option>
                <option value="3 atau lebih">3 atau lebih</option>
              </select>
            </div>
          </div>
        </section>

        {/* BAGIAN D: PENDIDIKAN SEBELUMNYA */}
        <section className="pt-8 border-t border-[#E6ECE7] space-y-6">
          <div className="pb-3 border-b border-[#E6ECE7]">
            <h3 className="font-display text-lg font-semibold text-[#0F2419]">
              Bagian D. Pendidikan Sebelumnya
            </h3>
            <p className="text-xs text-[#5A6D62] mt-0.5">
              Riwayat TK, RA, atau PAUD asal calon murid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="asalTkPaud" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Nama TK / RA / PAUD Asal <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="asalTkPaud"
                type="text"
                required
                value={asalTkPaud}
                onChange={(e) => {
                  setAsalTkPaud(e.target.value);
                  clearFieldError('asalTkPaud');
                }}
                placeholder="Contoh: TK Islam Al-Hikmah (atau tulis Belum Pernah)"
                className={inputClass('asalTkPaud')}
              />
            </div>

            <div>
              <label htmlFor="alamatSekolahAsal" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Alamat TK / RA / PAUD Asal{' '}
                <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
              </label>
              <input
                id="alamatSekolahAsal"
                type="text"
                value={alamatSekolahAsal}
                onChange={(e) => setAlamatSekolahAsal(e.target.value)}
                placeholder="Contoh: Kec. Kalibaru, Banyuwangi"
                className={inputClass('alamatSekolahAsal')}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="catatanSekolah" className="block text-sm font-medium text-[#1D3126] mb-1.5">
                Catatan untuk Sekolah{' '}
                <span className="text-xs font-normal text-[#5A6D62]">(Opsional)</span>
              </label>
              <textarea
                id="catatanSekolah"
                rows={2}
                value={catatanSekolah}
                onChange={(e) => setCatatanSekolah(e.target.value)}
                placeholder="Tuliskan informasi kesehatan, alergi, atau kebutuhan pendampingan khusus bila ada."
                className="w-full px-3.5 py-2.5 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* BAGIAN E: BIAYA PENDAFTARAN, PEMBAYARAN & UPLOAD 5 BERKAS WAJIB */}
        <section className="pt-8 border-t border-[#E6ECE7] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-3 border-b border-[#E6ECE7]">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#0F2419]">
                Bagian E. Biaya Pendaftaran &amp; Upload 5 Berkas Wajib
              </h3>
              <p className="text-xs text-[#5A6D62] mt-0.5">
                Lakukan pembayaran biaya pendaftaran resmi lalu unggah bukti bayar bersama keempat dokumen lainnya.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0E6245] font-mono tabular-nums shrink-0">
              {uploadedCount}/5 berkas terlampir
            </span>
          </div>

          {/* Banner Nominal Resmi */}
          <div className="rounded-xl border border-[#CFE0D5] bg-[#F2F7F4] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#0E6245]">
                Biaya Pendaftaran Resmi SPMB
              </div>
              <p className="text-xs sm:text-sm text-[#2D4035]">
                Nominal resmi pendaftaran. <strong>Tanpa biaya seragam dan tanpa biaya tambahan lain.</strong>
              </p>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#0F2419] tabular-nums shrink-0">
              Rp 50.000,-
            </div>
          </div>

          {/* 3 Pilihan Pembayaran: Sekretariat, Transfer Bank Jatim, QRIS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Opsi 1: Sekretariat */}
            <div className="rounded-xl border border-[#DCE4DE] bg-[#FAFBF9] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F2419]">
                <Building2 className="w-4 h-4 text-[#0E6245] shrink-0" />
                <span>1. Di Sekretariat Sekolah</span>
              </div>
              <p className="text-xs text-[#4A5D52] leading-relaxed">
                Kantor Sekretariat SDIT Insan Cendikia Kalibaru (Jl. Pahlawan RT 001 / RW 006, Kalibaru Kulon).
              </p>
              <div className="pt-1 text-xs text-[#1D3126] space-y-0.5 font-mono">
                <div>Senin–Kamis: 07.00 – 15.00 WIB</div>
                <div>Jumat: 07.00 – 12.30 WIB</div>
              </div>
            </div>

            {/* Opsi 2: Transfer Bank Jatim */}
            <div className="rounded-xl border border-[#DCE4DE] bg-[#FAFBF9] p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F2419]">
                <Banknote className="w-4 h-4 text-[#0E6245] shrink-0" />
                <span>2. Transfer Bank Jatim</span>
              </div>
              <div className="space-y-1 text-xs text-[#4A5D52]">
                <div>a.n. <strong className="text-[#0F2419]">SDIT INSAN CENDEKIA PPDB</strong></div>
                <div className="flex items-center justify-between gap-2 bg-white border border-[#DCE4DE] rounded-lg px-3 py-2">
                  <span className="font-mono text-sm font-bold text-[#0F2419] tabular-nums">
                    {BANK_JATIM_REKENING}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRekening}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-md hover:bg-[#E4EFE8] cursor-pointer"
                  >
                    {copiedRekening ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRekening ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Opsi 3: QRIS Resmi Sekolah */}
            <div className="rounded-xl border border-[#DCE4DE] bg-[#FAFBF9] p-4 flex items-center justify-between gap-3">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F2419]">
                  <QrCode className="w-4 h-4 text-[#0E6245] shrink-0" />
                  <span>3. QRIS Sekolah (Kode A01)</span>
                </div>
                <p className="text-xs text-[#4A5D52] leading-relaxed">
                  Scan menggunakan aplikasi m-Banking atau e-Wallet, lalu simpan bukti pembayaran.
                </p>
                <button
                  type="button"
                  onClick={() => setShowQrisZoom(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E6245] hover:underline cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Perbesar QRIS</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowQrisZoom(true)}
                aria-label="Perbesar kode QRIS pembayaran sekolah"
                className="w-24 h-24 p-1 rounded-lg border border-[#CCD6CE] bg-white overflow-hidden shrink-0 cursor-pointer hover:border-[#0E6245] transition-colors"
              >
                <img
                  src={QRIS_IMAGE_PATH}
                  alt="QRIS Pembayaran SPMB SDIT Insan Cendikia Kalibaru (NMID: ID2026566193416)"
                  className="w-full h-full object-contain"
                />
              </button>
            </div>
          </div>

          {/* Formulir Konfirmasi Pembayaran */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#DCE4DE] bg-white space-y-4">
            <div className="text-sm font-semibold text-[#0F2419]">
              Konfirmasi Pembayaran Biaya Pendaftaran
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="metodePembayaran" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Metode Pembayaran <span className="text-[#B91C1C]">*</span>
                </label>
                <select
                  id="metodePembayaran"
                  value={metodePembayaran}
                  onChange={(e) =>
                    setMetodePembayaran(
                      e.target.value as
                        | 'Transfer Bank Jatim'
                        | 'QRIS Sekolah'
                        | 'Di Sekretariat Sekolah'
                    )
                  }
                  className={inputClass('metodePembayaran')}
                >
                  <option value="Transfer Bank Jatim">Transfer Bank Jatim</option>
                  <option value="QRIS Sekolah">QRIS Sekolah</option>
                  <option value="Di Sekretariat Sekolah">Di Sekretariat Sekolah</option>
                </select>
              </div>

              <div>
                <label htmlFor="tanggalPembayaran" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Tanggal Pembayaran <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="tanggalPembayaran"
                  type="date"
                  required
                  value={tanggalPembayaran}
                  onChange={(e) => {
                    setTanggalPembayaran(e.target.value);
                    clearFieldError('tanggalPembayaran');
                  }}
                  className={inputClass('tanggalPembayaran')}
                />
              </div>

              <div>
                <label htmlFor="nominalPembayaran" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Nominal Biaya Pendaftaran
                </label>
                <input
                  id="nominalPembayaran"
                  type="text"
                  readOnly
                  value="Rp 50.000,-"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm font-mono font-semibold text-[#0E6245] bg-[#F7FAF8] border border-[#DCE4DE] rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="namaPengirimPembayaran" className="block text-xs font-medium text-[#1D3126] mb-1.5">
                  Nama Pengirim / Pembayar <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="namaPengirimPembayaran"
                  type="text"
                  required
                  value={namaPengirimPembayaran}
                  onChange={(e) => {
                    setNamaPengirimPembayaran(e.target.value);
                    clearFieldError('namaPengirimPembayaran');
                  }}
                  placeholder="Nama rekening pengirim / wali"
                  className={inputClass('namaPengirimPembayaran')}
                />
              </div>
            </div>
          </div>

          {/* Daftar Upload 5 Berkas Wajib */}
          <div className="divide-y divide-[#E6ECE7] border border-[#DCE4DE] rounded-lg overflow-hidden">
            {FILE_SLOTS.map((slot) => {
              const uploaded = files[slot.key];
              const errMsg = fileErrors[slot.key];
              const isSlotProcessing = processingSlot === slot.key;
              const isSlotInvalid = invalidField === `slot-${slot.key}`;
              const isImage = Boolean(
                uploaded && uploaded.payload.mimeType.startsWith('image/')
              );
              const previewSrc =
                uploaded && isImage
                  ? `data:${uploaded.payload.mimeType};base64,${uploaded.payload.base64}`
                  : '';

              return (
                <div
                  key={slot.key}
                  id={`slot-${slot.key}`}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${
                    isSlotInvalid ? 'bg-[#FEF6F6]' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {previewSrc && (
                      <img
                        src={previewSrc}
                        alt={`Pratinjau ${slot.label}`}
                        className="w-12 h-14 object-cover rounded-md border border-[#CCD6CE] bg-[#F7FAF8] shrink-0"
                      />
                    )}
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm font-medium text-[#0F2419]">
                        {slot.label} <span className="text-[#B91C1C]">*</span>
                      </div>
                      <div className="text-xs text-[#5A6D62]">{slot.helper}</div>
                      {isSlotProcessing && (
                        <div className="pt-1 flex items-center gap-1.5 text-xs font-medium text-[#0E6245]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span>Mengoptimalkan ukuran foto agar siap unggah...</span>
                        </div>
                      )}
                      {uploaded && !isSlotProcessing && (
                        <div className="pt-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#0E6245]">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate font-medium max-w-[210px] sm:max-w-[300px]">
                              {uploaded.payload.fileName}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums shrink-0">
                              {formatBytesToKb(uploaded.payload.sizeBytes)}
                            </span>
                          </div>
                          {uploaded.wasCompressed && (
                            <div className="text-[11px] text-[#4A5D52]">
                              Dikompres otomatis dari{' '}
                              <span className="font-mono tabular-nums">
                                {formatBytesToKb(uploaded.originalSizeBytes)}
                              </span>{' '}
                              menjadi{' '}
                              <span className="font-mono tabular-nums font-medium text-[#0E6245]">
                                {formatBytesToKb(uploaded.payload.sizeBytes)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {errMsg && (
                        <div className="pt-1 flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errMsg}</span>
                        </div>
                      )}
                    </div>
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
                      className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                        isSlotInvalid
                          ? 'text-[#991B1B] bg-white border-[#DC2626]'
                          : 'text-[#0F2419] bg-[#F4F7F5] border-[#CCD6CE] hover:bg-[#E7EFEA]'
                      }`}
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

          {/* Persetujuan Wajib */}
          <div id="persetujuan-box">
            <label
              className={`flex items-start gap-3.5 p-4 rounded-lg border cursor-pointer transition-colors ${
                invalidField === 'persetujuan-box'
                  ? 'border-[#DC2626] bg-[#FEF6F6]'
                  : 'border-[#DCE4DE] bg-[#F7FAF8]'
              }`}
            >
              <input
                type="checkbox"
                checked={persetujuan}
                onChange={(e) => {
                  setPersetujuan(e.target.checked);
                  clearFieldError('persetujuan-box');
                }}
                className="mt-0.5 h-5 w-5 sm:h-4 sm:w-4 rounded border-[#9EB0A3] text-[#0E6245] focus:ring-[#0E6245] shrink-0 cursor-pointer"
              />
              <span className="text-sm leading-relaxed text-[#1D3126]">
                Saya menyatakan bahwa seluruh data dan 5 berkas yang dilampirkan (termasuk bukti pembayaran biaya pendaftaran) adalah benar, serta memberikan izin kepada pihak{' '}
                <strong className="font-semibold text-[#0F2419]">SDIT Insan Cendikia Kalibaru</strong>{' '}
                untuk menghubungi saya melalui WhatsApp, telepon, atau email terkait proses SPMB.{' '}
                <span className="text-[#B91C1C]">*</span>
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
            Nomor pendaftaran dan undangan {waGroupTitle} ditampilkan setelah formulir dikirim.
          </p>
          <button
            type="submit"
            disabled={isSubmitting || processingSlot !== null}
            className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSubmitting ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran SPMB'}</span>
          </button>
        </div>
      </form>

      {/* Modal Zoom QRIS Sekolah */}
      {showQrisZoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kode QRIS Resmi SDIT Insan Cendikia Kalibaru"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setShowQrisZoom(false)}
        >
          <div
            className="bg-white border border-[#DCE4DE] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-[#E6ECE7] flex items-center justify-between gap-3">
              <div>
                <h4 className="font-display text-sm font-semibold text-[#0F2419]">
                  QRIS Pembayaran SPMB (Kode A01)
                </h4>
                <p className="text-xs text-[#5A6D62]">Nominal Resmi: Rp 50.000,-</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrisZoom(false)}
                aria-label="Tutup tampilan QRIS"
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg border border-[#DCE4DE] text-[#0F2419] hover:bg-[#F2F6F3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-[#F7FAF8] flex justify-center">
              <img
                src={QRIS_IMAGE_PATH}
                alt="QRIS Pembayaran SPMB SDIT Insan Cendikia Kalibaru (NMID: ID2026566193416)"
                className="max-h-[65vh] w-auto object-contain rounded-lg border border-[#DCE4DE] bg-white"
              />
            </div>
            <div className="px-5 py-3 border-t border-[#E6ECE7] flex items-center justify-between gap-2">
              <a
                href={QRIS_IMAGE_PATH}
                download="QRIS-SPMB-SDIT-Insan-Cendikia.png"
                className="inline-flex items-center justify-center min-h-[40px] px-4 py-1.5 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg hover:bg-[#E4EFE8]"
              >
                Simpan Gambar QRIS
              </a>
              <button
                type="button"
                onClick={() => setShowQrisZoom(false)}
                className="min-h-[40px] px-4 py-1.5 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#F2F6F3] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
