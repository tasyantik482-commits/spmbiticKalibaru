import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import appsScriptCode from '../../google-apps-script/Code.gs?raw';
import {
  buildWhatsAppUrl,
  clearAdminSession,
  deleteRegistration,
  fetchAllRegistrations,
  formatRupiah,
  getAdminSession,
  getConfiguredAppsScriptUrl,
  pingAppsScript,
  saveAdminSession,
  SPREADSHEET_ID,
  toDriveThumbnailUrl,
  triggerFileDownload,
  updateRegistrationStatus,
} from '../services/spmbService';
import {
  GELOMBANG_OPTIONS,
  VERIFICATION_STATUS_OPTIONS,
  type AdminApplicantRecord,
  type SiteProfileConfig,
} from '../types/spmb';
import PrintableRegistrationCard from './PrintableRegistrationCard';
import AppsScriptModal from './AppsScriptModal';
import AdminSiteProfileEditor from './AdminSiteProfileEditor';

interface AdminDashboardProps {
  onBackToPortal: () => void;
  siteProfile: SiteProfileConfig;
  onSiteProfileChange: (next: SiteProfileConfig) => void;
}

type AdminTab = 'pendaftar' | 'profil';

export default function AdminDashboard({
  onBackToPortal,
  siteProfile,
  onSiteProfileChange,
}: AdminDashboardProps) {
  const [session, setSession] = useState<{ username: string } | null>(() =>
    getAdminSession()
  );
  const [adminTab, setAdminTab] = useState<AdminTab>('pendaftar');

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard state
  const [records, setRecords] = useState<AdminApplicantRecord[]>([]);
  const [dataSource, setDataSource] = useState<'apps_script' | 'local_preview'>(
    getConfiguredAppsScriptUrl() ? 'apps_script' : 'local_preview'
  );
  const [needsScriptUpgrade, setNeedsScriptUpgrade] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [waveFilter, setWaveFilter] = useState<string>('Semua');

  // Detail & Print state
  const [selectedApplicant, setSelectedApplicant] =
    useState<AdminApplicantRecord | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editObsDate, setEditObsDate] = useState('');
  const [editObsTime, setEditObsTime] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [printApplicant, setPrintApplicant] =
    useState<AdminApplicantRecord | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] =
    useState<AdminApplicantRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccessNotice, setDeleteSuccessNotice] = useState<string | null>(null);
  const [appsScriptModalOpen, setAppsScriptModalOpen] = useState(false);

  const checkAppsScriptVersion = useCallback(async () => {
    const url = getConfiguredAppsScriptUrl();
    if (!url) {
      setNeedsScriptUpgrade(false);
      return;
    }
    try {
      const res = await pingAppsScript(url);
      if (res.ok && !res.supportsDelete) {
        setNeedsScriptUpgrade(true);
      } else {
        setNeedsScriptUpgrade(false);
      }
    } catch {
      // Abaikan error network ping
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetchAllRegistrations();
      setRecords(res.records);
      setDataSource(res.source);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Gagal memuat data pendaftar.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      loadRegistrations();
      checkAppsScriptVersion();
    }
  }, [session, loadRegistrations, checkAppsScriptVersion]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!saveAdminSession(username, password)) {
      setLoginError('Username atau password admin tidak sesuai.');
      return;
    }
    setSession({ username: 'Tasya' });
    setPassword('');
  };

  const handleLogout = () => {
    clearAdminSession();
    setSession(null);
    setRecords([]);
    setSelectedApplicant(null);
    setPrintApplicant(null);
  };

  const openDetailModal = (item: AdminApplicantRecord) => {
    setSelectedApplicant(item);
    setEditStatus(item.statusVerifikasi || 'Menunggu Verifikasi');
    setEditNote(item.catatanPanitia || '');
    setEditObsDate(item.tanggalObservasi || '');
    setEditObsTime(item.waktuObservasi || '');
    setSaveMessage(null);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;
    setIsSavingStatus(true);
    setSaveMessage(null);
    try {
      await updateRegistrationStatus(
        selectedApplicant.noPendaftaran,
        editStatus,
        editNote,
        editObsDate,
        editObsTime
      );
      setRecords((prev) =>
        prev.map((row) =>
          row.noPendaftaran === selectedApplicant.noPendaftaran
            ? {
                ...row,
                statusVerifikasi: editStatus,
                catatanPanitia: editNote,
                tanggalObservasi: editObsDate,
                waktuObservasi: editObsTime,
              }
            : row
        )
      );
      setSelectedApplicant((prev) =>
        prev
          ? {
              ...prev,
              statusVerifikasi: editStatus,
              catatanPanitia: editNote,
              tanggalObservasi: editObsDate,
              waktuObservasi: editObsTime,
            }
          : null
      );
      setSaveMessage('Status verifikasi & jadwal observasi berhasil diperbarui.');
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan status.'
      );
    } finally {
      setIsSavingStatus(false);
    }
  };

  const openDeleteConfirm = (item: AdminApplicantRecord) => {
    setDeleteTarget(item);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteRegistration(deleteTarget.noPendaftaran);
      setRecords((prev) =>
        prev.filter((row) => row.noPendaftaran !== deleteTarget.noPendaftaran)
      );
      if (selectedApplicant?.noPendaftaran === deleteTarget.noPendaftaran) {
        setSelectedApplicant(null);
      }
      if (printApplicant?.noPendaftaran === deleteTarget.noPendaftaran) {
        setPrintApplicant(null);
      }
      setDeleteSuccessNotice(
        `Data pendaftar atas nama ${deleteTarget.namaCalonMurid} (${deleteTarget.noPendaftaran}) berhasil dihapus.`
      );
      setDeleteTarget(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Gagal menghapus data pendaftar.';
      if (msg.includes('versi lama')) {
        setNeedsScriptUpgrade(true);
      }
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((item) => {
      const matchesStatus =
        statusFilter === 'Semua' ||
        item.statusVerifikasi.toLowerCase() === statusFilter.toLowerCase();
      if (!matchesStatus) return false;

      const itemWave = item.gelombang || 'Gelombang 1';
      const matchesWave =
        waveFilter === 'Semua' || itemWave.toLowerCase() === waveFilter.toLowerCase();
      if (!matchesWave) return false;

      if (!q) return true;
      return (
        item.noPendaftaran.toLowerCase().includes(q) ||
        item.namaCalonMurid.toLowerCase().includes(q) ||
        item.namaOrangTua.toLowerCase().includes(q) ||
        item.noTelepon.toLowerCase().includes(q) ||
        item.asalTkPaud.toLowerCase().includes(q) ||
        (item.nikCalonMurid || '').toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery, statusFilter, waveFilter]);

  const stats = useMemo(() => {
    const total = records.length;
    const menunggu = records.filter((r) =>
      r.statusVerifikasi.toLowerCase().includes('menunggu')
    ).length;
    const proses = records.filter(
      (r) =>
        r.statusVerifikasi.toLowerCase().includes('lengkap') ||
        r.statusVerifikasi.toLowerCase().includes('observasi')
    ).length;
    const diterima = records.filter((r) =>
      r.statusVerifikasi.toLowerCase().includes('diterima')
    ).length;
    return { total, menunggu, proses, diterima };
  }, [records]);

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      'Nomor Pendaftaran',
      'Waktu Daftar',
      'Gelombang',
      'Nama Calon Murid',
      'Nama Panggilan',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'NIK Calon Murid',
      'Anak Ke',
      'Jumlah Saudara',
      'Status Anak',
      'Berkebutuhan Khusus',
      'Agama',
      'Golongan Darah',
      'Hobi',
      'Cita-cita',
      'Tinggi Badan (cm)',
      'Berat Badan (kg)',
      'Lingkar Kepala (cm)',
      'Nama Ayah',
      'NIK Ayah',
      'Pekerjaan Ayah',
      'Pendidikan Ayah',
      'Penghasilan Ayah',
      'Nama Ibu',
      'NIK Ibu',
      'Pekerjaan Ibu',
      'Pendidikan Ibu',
      'Penghasilan Ibu',
      'Nama Wali',
      'No Telepon/WA',
      'Email',
      'Tinggal Dengan',
      'Alamat',
      'RT/RW',
      'Desa/Kelurahan',
      'Kecamatan',
      'Kabupaten/Kota',
      'Provinsi',
      'Status Rumah',
      'Jumlah Kendaraan',
      'Asal TK/PAUD',
      'Alamat TK/PAUD',
      'Catatan Sekolah',
      'Metode Pembayaran',
      'Tanggal Pembayaran',
      'Nominal Pembayaran',
      'Nama Pengirim Pembayaran',
      'Status Verifikasi',
      'Tanggal Observasi',
      'Waktu Observasi',
      'Catatan Panitia',
      'Link KK',
      'Link Akta',
      'Link Pas Foto 3x4',
      'Link KTP Ortu/Wali',
      'Link Bukti Pembayaran',
    ];
    const escapeCsv = (val: unknown) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };
    const rows = filteredRecords.map((r) =>
      [
        r.noPendaftaran,
        r.waktuDaftar,
        r.gelombang || 'Gelombang 1',
        r.namaCalonMurid,
        r.namaPanggilan || '',
        r.jenisKelamin,
        r.tempatLahir || '',
        r.tanggalLahir,
        r.nikCalonMurid || '',
        r.anakKe || '',
        r.jumlahSaudara ?? '',
        r.statusAnak || '',
        r.berkebutuhanKhusus || '',
        r.agama || '',
        r.golonganDarah || '',
        r.hobi || '',
        r.citaCita || '',
        r.tinggiBadan,
        r.beratBadan,
        r.lingkarKepala || '',
        r.namaAyah || '',
        r.nikAyah || '',
        r.pekerjaanAyah || '',
        r.pendidikanAyah || '',
        r.penghasilanAyah || '',
        r.namaIbu || '',
        r.nikIbu || '',
        r.pekerjaanIbu || '',
        r.pendidikanIbu || '',
        r.penghasilanIbu || '',
        r.namaWali || '',
        r.noTelepon,
        r.email,
        r.tinggalDengan || '',
        r.alamatSaatIni || '',
        r.rtRw || '',
        r.desaKelurahan || '',
        r.kecamatan || '',
        r.kabupatenKota || '',
        r.provinsi || '',
        r.statusKepemilikan || '',
        r.jumlahKendaraan || '',
        r.asalTkPaud,
        r.alamatSekolahAsal || '',
        r.catatanSekolah,
        r.metodePembayaran || '',
        r.tanggalPembayaran || '',
        r.nominalPembayaran || '',
        r.namaPengirimPembayaran || '',
        r.statusVerifikasi,
        r.tanggalObservasi || '',
        r.waktuObservasi || '',
        r.catatanPanitia || '',
        r.urlKartuKeluarga || '',
        r.urlAktaKelahiran || '',
        r.urlPasFoto || '',
        r.urlKtpOrangTua || '',
        r.urlBuktiPembayaran || '',
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-pendaftar-spmb-sditic-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStatusCell = (status: string) => {
    const lower = status.toLowerCase();
    if (lower.includes('diterima') || lower.includes('lengkap')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E6245] whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{status}</span>
        </span>
      );
    }
    if (lower.includes('perbaikan') || lower.includes('tolak')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309] whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  };

  const formatTanggal = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getParentWaHref = (
    item: AdminApplicantRecord,
    statusOverride?: string,
    noteOverride?: string,
    obsDateOverride?: string,
    obsTimeOverride?: string
  ) => {
    const statusText = statusOverride || item.statusVerifikasi || 'Menunggu Verifikasi';
    const noteText = (noteOverride ?? item.catatanPanitia ?? '').trim();
    const obsDate = (obsDateOverride ?? item.tanggalObservasi ?? '').trim();
    const obsTime = (obsTimeOverride ?? item.waktuObservasi ?? '').trim();

    const lines = [
      `Assalamu'alaikum Bapak/Ibu ${item.namaOrangTua},`,
      `Kami dari Panitia SPMB SDIT Insan Cendikia Kalibaru menyampaikan informasi pendaftaran (${item.gelombang || 'Gelombang 1'}) atas nama *${item.namaCalonMurid}* (No. Pendaftaran: *${item.noPendaftaran}*).`,
      `Status saat ini: *${statusText}*`,
    ];
    if (obsDate || obsTime) {
      lines.push(
        `Jadwal Observasi: *${obsDate ? formatTanggal(obsDate) : 'Menyusul'}*${
          obsTime ? ` pukul *${obsTime}*` : ''
        } di Kampus SDIT Insan Cendikia Kalibaru.`
      );
    }
    if (noteText) {
      lines.push(`Catatan Panitia: ${noteText}`);
    }
    lines.push('Terima kasih.');
    return buildWhatsAppUrl(item.noTelepon, lines.join('\n\n'));
  };

  // Tampilan Login Admin
  if (!session) {
    return (
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-md mx-auto bg-white border border-[#DCE4DE] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0E6245]">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Akses Panitia SPMB</span>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0F2419]">
              Masuk Dashboard Admin
            </h1>
            <p className="text-sm text-[#4A5D52]">
              Silakan masuk menggunakan akun panitia untuk mengelola pendaftar, jadwal observasi, profil sekolah, dan bukti daftar ulang.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-sm font-medium text-[#1D3126] mb-1.5"
              >
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-[#1D3126] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-[#5A6D62] hover:text-[#0F2419] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-[#F2C6C6] bg-[#FEF6F6] px-3.5 py-2.5 text-xs font-medium text-[#991B1B]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[46px] py-2.5 px-4 text-sm font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] transition-colors cursor-pointer"
            >
              Masuk Dashboard
            </button>
          </form>

          <div className="pt-4 border-t border-[#E6ECE7] text-center">
            <button
              type="button"
              onClick={onBackToPortal}
              className="text-xs font-medium text-[#4A5D52] hover:text-[#0F2419] underline underline-offset-4 cursor-pointer"
            >
              Kembali ke Portal Pendaftaran SPMB
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Tampilan Dashboard Admin Terautentikasi
  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      {/* Header Workspace & Breadcrumb */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#DCE4DE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#5A6D62]">
            <span>Admin</span>
            <span aria-hidden="true">/</span>
            <span>Dashboard SPMB</span>
            <span aria-hidden="true">·</span>
            <span>Masuk sebagai {session.username}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F2419]">
            {adminTab === 'pendaftar'
              ? 'Data Pendaftar & Verifikasi Berkas'
              : 'Kelola Profil & Info Sekolah'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {adminTab === 'pendaftar' && (
            <>
              <button
                type="button"
                onClick={loadRegistrations}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#F2F6F3] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredRecords.length === 0}
                className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#F2F6F3] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh CSV</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setAppsScriptModalOpen(true)}
            className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg hover:bg-[#E4EFE8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pengaturan &amp; Kode Apps Script</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 text-xs font-semibold text-[#991B1B] bg-white border border-[#EBCACA] rounded-lg hover:bg-[#FEF6F6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigasi Dashboard Admin */}
      <div className="no-print flex flex-wrap items-center gap-2 p-1.5 bg-[#E6ECE7] rounded-xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setAdminTab('pendaftar')}
          className={`flex-1 sm:flex-initial min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            adminTab === 'pendaftar'
              ? 'bg-white text-[#0F2419] shadow-xs'
              : 'text-[#4A5D52] hover:text-[#0F2419]'
          }`}
        >
          Data Pendaftar &amp; Verifikasi
        </button>
        <button
          type="button"
          onClick={() => setAdminTab('profil')}
          className={`flex-1 sm:flex-initial min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            adminTab === 'profil'
              ? 'bg-white text-[#0F2419] shadow-xs'
              : 'text-[#4A5D52] hover:text-[#0F2419]'
          }`}
        >
          Kelola Profil &amp; Info Sekolah
        </button>
      </div>

      {/* Peringatan Upgrade Apps Script (Perbaikan #5) */}
      {needsScriptUpgrade && (
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-[#E8C58E] bg-[#FFF8EB] px-4 py-3.5 text-xs sm:text-sm text-[#7C4A10]">
          <div className="space-y-0.5">
            <div className="font-semibold text-[#663A0A]">
              Pembaruan Google Apps Script Diperlukan (v2.0.0)
            </div>
            <p className="text-xs leading-relaxed">
              Deployment Apps Script Anda saat ini masih versi lama sehingga fitur <strong>Hapus Data</strong>, <strong>Jadwal Observasi</strong>, dan <strong>Simpan Profil Sekolah</strong> belum aktif. Buka modal pengaturan lalu terapkan <em>Versi Baru</em> dari <code className="font-mono">Code.gs</code> terbaru.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAppsScriptModalOpen(true)}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#B45309] rounded-lg hover:bg-[#92400E] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Perbarui Kode Apps Script
          </button>
        </div>
      )}

      {adminTab === 'profil' ? (
        <AdminSiteProfileEditor
          profile={siteProfile}
          onProfileSaved={onSiteProfileChange}
        />
      ) : (
        <>
          {/* Info Sumber Data */}
          {dataSource === 'local_preview' && (
            <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-[#E5D5B5] bg-[#FDF9F0] px-4 py-3 text-xs text-[#7C4A10]">
              <span>
                Menampilkan data dari penyimpanan pratinjau lokal browser. Hubungkan URL Web App Apps Script untuk menyinkronkan data langsung dengan Google Spreadsheet{' '}
                <span className="font-mono">{SPREADSHEET_ID}</span>.
              </span>
              <button
                type="button"
                onClick={() => setAppsScriptModalOpen(true)}
                className="text-left sm:text-right font-semibold underline underline-offset-2 text-[#0E6245] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Buka Pengaturan Apps Script
              </button>
            </div>
          )}

          {/* 4-Column Stat Strip */}
          <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#DCE4DE] rounded-xl p-5">
              <div className="text-xs font-medium text-[#5A6D62]">Total Pendaftar</div>
              <div className="mt-2 font-mono text-2xl font-semibold text-[#0F2419] tabular-nums">
                {stats.total}
              </div>
            </div>
            <div className="bg-white border border-[#DCE4DE] rounded-xl p-5">
              <div className="text-xs font-medium text-[#5A6D62]">Menunggu Verifikasi</div>
              <div className="mt-2 font-mono text-2xl font-semibold text-[#B45309] tabular-nums">
                {stats.menunggu}
              </div>
            </div>
            <div className="bg-white border border-[#DCE4DE] rounded-xl p-5">
              <div className="text-xs font-medium text-[#5A6D62]">Lengkap / Observasi</div>
              <div className="mt-2 font-mono text-2xl font-semibold text-[#0F2419] tabular-nums">
                {stats.proses}
              </div>
            </div>
            <div className="bg-white border border-[#DCE4DE] rounded-xl p-5">
              <div className="text-xs font-medium text-[#5A6D62]">Diterima</div>
              <div className="mt-2 font-mono text-2xl font-semibold text-[#0E6245] tabular-nums">
                {stats.diterima}
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="no-print bg-white border border-[#DCE4DE] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="relative flex-1 lg:max-w-md">
                <Search className="w-4 h-4 text-[#64746B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nomor daftar, nama murid, NIK, orang tua, WA..."
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2 text-base sm:text-sm text-[#0F2419] bg-[#F7F9F7] border border-[#CCD6CE] rounded-lg placeholder:text-[#7E8F84] focus:outline-none focus:border-[#0E6245]"
                />
              </div>

              {/* Filter Gelombang (Perbaikan #1) */}
              <div className="flex items-center gap-1 p-1 bg-[#EEF2EF] rounded-lg w-full sm:w-fit overflow-x-auto">
                {['Semua', ...GELOMBANG_OPTIONS].map((wave) => (
                  <button
                    key={wave}
                    type="button"
                    onClick={() => setWaveFilter(wave)}
                    className={`flex-1 sm:flex-initial min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      waveFilter === wave
                        ? 'bg-white text-[#0F2419] shadow-xs'
                        : 'text-[#4A5D52] hover:text-[#0F2419]'
                    }`}
                  >
                    {wave === 'Semua' ? 'Semua Gelombang' : wave}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#EEF2EF] rounded-lg overflow-x-auto max-w-full">
              {['Semua', ...VERIFICATION_STATUS_OPTIONS].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatusFilter(opt)}
                  className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === opt
                      ? 'bg-white text-[#0F2419] shadow-xs'
                      : 'text-[#4A5D52] hover:text-[#0F2419]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Delete Success Notification */}
          {deleteSuccessNotice && (
            <div
              role="status"
              className="no-print flex items-center justify-between gap-3 rounded-xl border border-[#CFE0D5] bg-[#F2F7F4] px-4 py-3 text-xs sm:text-sm text-[#0E6245]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{deleteSuccessNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteSuccessNotice(null)}
                aria-label="Tutup pemberitahuan"
                className="p-1 text-[#0E6245] hover:text-[#0B4F37] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error State */}
          {loadError && (
            <div
              role="alert"
              className="no-print flex items-start gap-3 rounded-xl border border-[#F2C6C6] bg-[#FEF6F6] px-4 py-3 text-sm text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          {/* High-Density Data Table */}
          <div className="no-print bg-white border border-[#DCE4DE] rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3, 4].map((row) => (
                  <div
                    key={row}
                    className="h-11 bg-[#F2F6F3] rounded-md animate-pulse"
                  />
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="font-display text-base font-semibold text-[#0F2419]">
                  {records.length === 0
                    ? 'Belum ada data pendaftar masuk'
                    : 'Tidak ada data yang cocok dengan pencarian'}
                </div>
                <p className="text-sm text-[#5A6D62] max-w-md mx-auto">
                  {records.length === 0
                    ? 'Data pendaftar baru beserta berkas lengkap akan tampil di sini setelah formulir SPMB diisi.'
                    : 'Coba ubah kata kunci pencarian atau pilih filter gelombang/status "Semua".'}
                </p>
                {records.length === 0 && (
                  <button
                    type="button"
                    onClick={onBackToPortal}
                    className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] transition-colors cursor-pointer"
                  >
                    Buka Formulir Pendaftaran
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Card List (< md) */}
                <div className="md:hidden divide-y divide-[#E6ECE7]">
                  {filteredRecords.map((item) => (
                    <div key={item.noPendaftaran} className="p-4 space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-xs font-semibold text-[#0F2419] tabular-nums">
                            {item.noPendaftaran}
                          </div>
                          <div className="text-xs text-[#64746B] mt-0.5">
                            {item.gelombang || 'Gelombang 1'} · {formatTanggal(item.waktuDaftar)}
                          </div>
                        </div>
                        {renderStatusCell(item.statusVerifikasi)}
                      </div>

                      <div className="space-y-1">
                        <div className="text-base font-semibold text-[#0F2419]">
                          {item.namaCalonMurid}
                        </div>
                        <div className="text-xs text-[#4A5D52]">
                          Wali: <span className="font-medium text-[#0F2419]">{item.namaOrangTua}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">{item.noTelepon}</span>
                        </div>
                        <div className="text-xs text-[#5A6D62] font-mono tabular-nums">
                          TB {item.tinggiBadan} cm · BB {item.beratBadan} kg
                          {item.metodePembayaran ? ` · ${item.metodePembayaran}` : ''}
                        </div>
                        {(item.tanggalObservasi || item.waktuObservasi) && (
                          <div className="text-xs font-medium text-[#0E6245]">
                            Observasi: {item.tanggalObservasi ? formatTanggal(item.tanggalObservasi) : ''}{' '}
                            {item.waktuObservasi}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {item.downloadKartuKeluarga ? (
                          <button
                            type="button"
                            onClick={() =>
                              triggerFileDownload(
                                item.downloadKartuKeluarga || '',
                                item.kkFileName || `${item.noPendaftaran}_KK`
                              )
                            }
                            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg active:bg-[#E4EFE8] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span>Download KK</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center justify-center min-h-[42px] px-3 py-2 text-xs text-[#7E8F84] bg-[#F7F9F7] border border-[#E6ECE7] rounded-lg">
                            KK Belum Ada
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setPrintApplicant(item)}
                          className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg active:bg-[#F2F6F3] cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 shrink-0" />
                          <span>Cetak Bukti</span>
                        </button>

                        <a
                          href={getParentWaHref(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 text-xs font-semibold text-[#0E6245] bg-white border border-[#CFE0D5] rounded-lg active:bg-[#F2F7F4]"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Chat WA Wali</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => openDetailModal(item)}
                          className="inline-flex items-center justify-center min-h-[42px] px-3 py-2 text-xs font-semibold text-white bg-[#0E6245] rounded-lg active:bg-[#0B4F37] cursor-pointer"
                        >
                          Verifikasi &amp; Detail
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(item)}
                          className="col-span-2 inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 text-xs font-semibold text-[#B91C1C] bg-white border border-[#EBCACA] rounded-lg active:bg-[#FEF6F6] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Hapus (Tidak Jadi Daftar Ulang)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table (md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E1E8E2] bg-[#F7FAF8] text-xs font-semibold text-[#4A5D52]">
                        <th className="py-3 px-4 whitespace-nowrap">No. Daftar &amp; Gelombang</th>
                        <th className="py-3 px-4 whitespace-nowrap">Calon Murid</th>
                        <th className="py-3 px-4 whitespace-nowrap">Orang Tua &amp; WA</th>
                        <th className="py-3 px-4 whitespace-nowrap">Pembayaran &amp; Observasi</th>
                        <th className="py-3 px-4 whitespace-nowrap">Status</th>
                        <th className="py-3 px-4 whitespace-nowrap">Berkas KK</th>
                        <th className="py-3 px-4 whitespace-nowrap text-right">Aksi &amp; Cetak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6ECE7] text-sm">
                      {filteredRecords.map((item) => (
                        <tr
                          key={item.noPendaftaran}
                          className="hover:bg-[#F9FBF9] transition-colors"
                        >
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <div className="font-mono text-xs font-semibold text-[#0F2419] tabular-nums">
                              {item.noPendaftaran}
                            </div>
                            <div className="text-xs text-[#0E6245] font-medium mt-0.5">
                              {item.gelombang || 'Gelombang 1'}
                            </div>
                            <div className="text-[11px] text-[#64746B]">
                              {formatTanggal(item.waktuDaftar)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <div className="font-semibold text-[#0F2419]">
                              {item.namaCalonMurid}
                            </div>
                            <div className="text-xs text-[#5A6D62] mt-0.5">
                              {item.asalTkPaud && item.asalTkPaud !== '-'
                                ? item.asalTkPaud
                                : 'Asal TK tidak diisi'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <div className="text-[#0F2419]">{item.namaOrangTua}</div>
                            <div className="font-mono text-xs text-[#5A6D62] tabular-nums mt-0.5">
                              {item.noTelepon}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 align-top text-xs">
                            <div className="text-[#0F2419] font-medium">
                              {item.metodePembayaran || '-'}
                            </div>
                            {item.tanggalObservasi || item.waktuObservasi ? (
                              <div className="text-[#0E6245] mt-0.5">
                                Obs: {item.tanggalObservasi ? formatTanggal(item.tanggalObservasi) : ''}{' '}
                                {item.waktuObservasi}
                              </div>
                            ) : (
                              <div className="text-[#7E8F84] mt-0.5">Obs: Belum dijadwalkan</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            {renderStatusCell(item.statusVerifikasi)}
                          </td>

                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            {item.downloadKartuKeluarga ? (
                              <button
                                type="button"
                                onClick={() =>
                                  triggerFileDownload(
                                    item.downloadKartuKeluarga || '',
                                    item.kkFileName || `${item.noPendaftaran}_KK`
                                  )
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-md hover:bg-[#E4EFE8] transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download KK</span>
                              </button>
                            ) : (
                              <span className="text-xs text-[#7E8F84]">Belum tersedia</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <a
                                href={getParentWaHref(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Kirim pesan WhatsApp ke orang tua/wali"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0E6245] bg-white border border-[#CFE0D5] rounded-md hover:bg-[#F2F7F4] transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WA</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => setPrintApplicant(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-md hover:bg-[#F2F6F3] transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openDetailModal(item)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0E6245] rounded-md hover:bg-[#0B4F37] transition-colors cursor-pointer"
                              >
                                Verifikasi
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteConfirm(item)}
                                title="Hapus pendaftar jika tidak jadi daftar ulang"
                                aria-label={`Hapus data ${item.namaCalonMurid}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#B91C1C] bg-white border border-[#EBCACA] rounded-md hover:bg-[#FEF6F6] transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Modal Detail & Verifikasi Pendaftar + Jadwal Observasi (Perbaikan #6) */}
      {selectedApplicant && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-pendaftar-title"
          onClick={() => setSelectedApplicant(null)}
        >
          <div
            className="w-full max-w-3xl bg-white border border-[#DCE4DE] rounded-xl shadow-xl overflow-hidden my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6ECE7]">
              <div>
                <h2
                  id="detail-pendaftar-title"
                  className="font-display text-lg font-semibold text-[#0F2419]"
                >
                  Detail, Berkas &amp; Jadwal Observasi Pendaftar
                </h2>
                <p className="font-mono text-xs text-[#5A6D62] tabular-nums">
                  {selectedApplicant.noPendaftaran} · {selectedApplicant.gelombang || 'Gelombang 1'} · {selectedApplicant.namaCalonMurid}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                aria-label="Tutup detail"
                className="p-2 text-[#5A6D62] hover:text-[#0F2419] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto text-sm">
              {/* Data Ringkas A-E */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-5 border-b border-[#E6ECE7]">
                <div>
                  <dt className="text-xs text-[#5A6D62]">Calon Murid (Panggilan)</dt>
                  <dd className="font-semibold text-[#0F2419]">
                    {selectedApplicant.namaCalonMurid}
                    {selectedApplicant.namaPanggilan && selectedApplicant.namaPanggilan !== '-'
                      ? ` (${selectedApplicant.namaPanggilan})`
                      : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5A6D62]">NIK Calon Murid</dt>
                  <dd className="font-mono tabular-nums text-[#0F2419]">
                    {selectedApplicant.nikCalonMurid || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5A6D62]">TTL &amp; Jenis Kelamin</dt>
                  <dd className="text-[#0F2419]">
                    {selectedApplicant.tempatLahir || '-'}, {selectedApplicant.tanggalLahir || '-'} · {selectedApplicant.jenisKelamin || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5A6D62]">Anak ke / Saudara / Status</dt>
                  <dd className="text-[#0F2419]">
                    Ke-{selectedApplicant.anakKe || '-'} ({selectedApplicant.jumlahSaudara ?? 0} saudara) · {selectedApplicant.statusAnak || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5A6D62]">ABK / Agama / Gol. Darah</dt>
                  <dd className="text-[#0F2419]">
                    ABK: {selectedApplicant.berkebutuhanKhusus || 'Tidak'} · {selectedApplicant.agama || '-'} · {selectedApplicant.golonganDarah || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5A6D62]">TB / BB / LK</dt>
                  <dd className="font-mono tabular-nums text-[#0F2419]">
                    {selectedApplicant.tinggiBadan} cm · {selectedApplicant.beratBadan} kg
                    {selectedApplicant.lingkarKepala ? ` · ${selectedApplicant.lingkarKepala} cm` : ''}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-[#5A6D62]">Ayah Kandung</dt>
                  <dd className="text-[#0F2419]">
                    <div className="font-semibold">{selectedApplicant.namaAyah || '-'}</div>
                    <div className="text-xs text-[#5A6D62]">
                      {selectedApplicant.pekerjaanAyah || '-'} · {selectedApplicant.penghasilanAyah || '-'}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5A6D62]">Ibu Kandung</dt>
                  <dd className="text-[#0F2419]">
                    <div className="font-semibold">{selectedApplicant.namaIbu || '-'}</div>
                    <div className="text-xs text-[#5A6D62]">
                      {selectedApplicant.pekerjaanIbu || '-'} · {selectedApplicant.penghasilanIbu || '-'}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5A6D62]">Kontak WA &amp; Email</dt>
                  <dd className="text-[#0F2419]">
                    <div className="font-mono tabular-nums">{selectedApplicant.noTelepon}</div>
                    <div className="text-xs text-[#5A6D62]">{selectedApplicant.email || '-'}</div>
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#5A6D62]">Alamat Domisili</dt>
                  <dd className="text-xs sm:text-sm text-[#0F2419]">
                    {[
                      selectedApplicant.alamatSaatIni,
                      selectedApplicant.rtRw ? `RT/RW ${selectedApplicant.rtRw}` : '',
                      selectedApplicant.desaKelurahan,
                      selectedApplicant.kecamatan,
                      selectedApplicant.kabupatenKota,
                      selectedApplicant.provinsi,
                    ]
                      .filter(Boolean)
                      .join(', ') || '-'}
                    {selectedApplicant.statusKepemilikan ? ` (${selectedApplicant.statusKepemilikan})` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5A6D62]">Asal TK / PAUD</dt>
                  <dd className="text-[#0F2419]">
                    {selectedApplicant.asalTkPaud || '-'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#5A6D62]">Konfirmasi Pembayaran (Rp 50.000,-)</dt>
                  <dd className="text-[#0F2419]">
                    {selectedApplicant.metodePembayaran || '-'} · Pengirim:{' '}
                    <strong>{selectedApplicant.namaPengirimPembayaran || '-'}</strong> · Tgl:{' '}
                    {selectedApplicant.tanggalPembayaran || '-'} ({formatRupiah(selectedApplicant.nominalPembayaran || 50000)})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5A6D62]">Catatan untuk Sekolah</dt>
                  <dd className="text-[#2D4035]">
                    {selectedApplicant.catatanSekolah || '-'}
                  </dd>
                </div>
              </dl>

              {/* 5 Berkas Lampiran Pendaftar */}
              <div className="space-y-3 pb-5 border-b border-[#E6ECE7]">
                <div className="text-xs font-semibold text-[#0F2419]">
                  5 Berkas Lampiran Pendaftar
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      label: '1. Kartu Keluarga (KK)',
                      downloadLabel: 'Download KK',
                      url: selectedApplicant.urlKartuKeluarga,
                      downloadUrl: selectedApplicant.downloadKartuKeluarga,
                      fileName:
                        selectedApplicant.kkFileName ||
                        `${selectedApplicant.noPendaftaran}_KK`,
                    },
                    {
                      label: '2. Akta Kelahiran',
                      downloadLabel: 'Download Akta',
                      url: selectedApplicant.urlAktaKelahiran,
                      downloadUrl: selectedApplicant.downloadAktaKelahiran,
                      fileName:
                        selectedApplicant.aktaFileName ||
                        `${selectedApplicant.noPendaftaran}_Akta`,
                    },
                    {
                      label: '3. Pas Foto 3 × 4',
                      downloadLabel: 'Download Foto',
                      url: selectedApplicant.urlPasFoto,
                      downloadUrl: selectedApplicant.downloadPasFoto,
                      fileName:
                        selectedApplicant.fotoFileName ||
                        `${selectedApplicant.noPendaftaran}_Foto_3x4`,
                    },
                    {
                      label: '4. KTP Orang Tua / Wali',
                      downloadLabel: 'Download KTP',
                      url: selectedApplicant.urlKtpOrangTua,
                      downloadUrl: selectedApplicant.downloadKtpOrangTua,
                      fileName:
                        selectedApplicant.ktpFileName ||
                        `${selectedApplicant.noPendaftaran}_KTP_Ortu`,
                    },
                    {
                      label: '5. Bukti Pembayaran',
                      downloadLabel: 'Download Bukti',
                      url: selectedApplicant.urlBuktiPembayaran,
                      downloadUrl: selectedApplicant.downloadBuktiPembayaran,
                      fileName:
                        selectedApplicant.buktiBayarFileName ||
                        `${selectedApplicant.noPendaftaran}_Bukti_Bayar`,
                    },
                  ].map((doc) => {
                    const thumbSrc = toDriveThumbnailUrl(doc.url);
                    return (
                      <div
                        key={doc.label}
                        className="p-3 rounded-lg border border-[#DCE4DE] bg-[#F7FAF8] space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-[#0F2419]">
                            {doc.label}
                          </div>
                          {thumbSrc && (
                            <div className="aspect-[4/3] rounded-md overflow-hidden border border-[#DCE4DE] bg-white">
                              <img
                                src={thumbSrc}
                                alt={`Pratinjau ${doc.label}`}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget.parentElement as HTMLElement).style.display =
                                    'none';
                                }}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                        {doc.downloadUrl ? (
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                triggerFileDownload(doc.downloadUrl || '', doc.fileName)
                              }
                              className="inline-flex items-center gap-1 min-h-[36px] text-xs font-semibold text-[#0E6245] hover:underline cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{doc.downloadLabel}</span>
                            </button>
                            {doc.url && !doc.url.startsWith('data:') && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 min-h-[36px] text-xs text-[#4A5D52] hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Lihat</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#7E8F84]">Belum tersedia</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Update Status Verifikasi & Jadwal Observasi (Perbaikan #6) */}
              <form onSubmit={handleSaveStatus} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="edit-status"
                      className="block text-xs font-semibold text-[#0F2419] mb-1.5"
                    >
                      Ubah Status Verifikasi
                    </label>
                    <select
                      id="edit-status"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245]"
                    >
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-obs-date"
                      className="flex items-center gap-1 text-xs font-semibold text-[#0F2419] mb-1.5"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-[#0E6245]" />
                      <span>Tanggal Observasi</span>
                    </label>
                    <input
                      id="edit-obs-date"
                      type="date"
                      value={editObsDate}
                      onChange={(e) => setEditObsDate(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-obs-time"
                      className="block text-xs font-semibold text-[#0F2419] mb-1.5"
                    >
                      Waktu / Sesi Observasi
                    </label>
                    <input
                      id="edit-obs-time"
                      type="text"
                      value={editObsTime}
                      onChange={(e) => setEditObsTime(e.target.value)}
                      placeholder="Contoh: 08.00 – 10.00 WIB"
                      className="w-full min-h-[44px] px-3.5 py-2 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="edit-note"
                    className="block text-xs font-semibold text-[#0F2419] mb-1.5"
                  >
                    Catatan Panitia (tampil pada menu Cek Status)
                  </label>
                  <textarea
                    id="edit-note"
                    rows={3}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Contoh: Berkas dan pembayaran terverifikasi. Mohon hadir membawa dokumen asli saat observasi."
                    className="w-full px-3.5 py-2 text-base sm:text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245]"
                  />
                </div>

                {saveMessage && (
                  <div className="text-xs font-medium text-[#0E6245]">
                    {saveMessage}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5 pt-2">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPrintApplicant(selectedApplicant);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#F2F6F3] cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Bukti</span>
                    </button>
                    <a
                      href={getParentWaHref(
                        selectedApplicant,
                        editStatus,
                        editNote,
                        editObsDate,
                        editObsTime
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg hover:bg-[#E4EFE8]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Kirim WA Wali</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(selectedApplicant)}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 text-xs font-semibold text-[#B91C1C] bg-white border border-[#EBCACA] rounded-lg hover:bg-[#FEF6F6] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Data</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingStatus}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2 text-xs font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Simpan Perubahan &amp; Jadwal</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pendaftar */}
      {deleteTarget && (
        <div
          className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-[#DCE4DE] rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#E6ECE7] flex items-center justify-between">
              <h2
                id="confirm-delete-title"
                className="font-display text-base font-semibold text-[#0F2419]"
              >
                Konfirmasi Hapus Data Pendaftar
              </h2>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                aria-label="Tutup konfirmasi hapus"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#5A6D62] hover:text-[#0F2419] rounded-lg cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-[#2D4035]">
              <p className="leading-relaxed">
                Apakah Anda yakin ingin menghapus data pendaftar ini (misalnya karena siswa tidak jadi daftar ulang)?
              </p>

              <div className="rounded-lg border border-[#E1E8E2] bg-[#F7FAF8] p-3.5 space-y-1 text-xs">
                <div className="font-mono font-semibold text-[#0F2419] tabular-nums">
                  {deleteTarget.noPendaftaran} · {deleteTarget.gelombang || 'Gelombang 1'}
                </div>
                <div className="text-sm font-semibold text-[#0F2419]">
                  {deleteTarget.namaCalonMurid}
                </div>
                <div className="text-[#4A5D52]">
                  Wali: {deleteTarget.namaOrangTua} · Status: {deleteTarget.statusVerifikasi}
                </div>
              </div>

              <p className="text-xs text-[#5A6D62] leading-relaxed">
                Baris data pada Google Spreadsheet akan dihapus dan folder berkasnya di Google Drive akan dipindahkan ke Sampah (Trash).
              </p>

              {deleteError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-[#F2C6C6] bg-[#FEF6F6] px-3.5 py-2.5 text-xs font-medium text-[#991B1B]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#F2F6F3] disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-[#B91C1C] rounded-lg hover:bg-[#991B1B] disabled:opacity-60 cursor-pointer"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Bukti Pendaftaran / Daftar Ulang */}
      <PrintableRegistrationCard
        applicant={printApplicant}
        onClose={() => setPrintApplicant(null)}
      />

      {/* Modal Pengaturan & Kode Apps Script (Khusus Admin) */}
      <AppsScriptModal
        isOpen={appsScriptModalOpen}
        onClose={() => {
          setAppsScriptModalOpen(false);
          checkAppsScriptVersion();
          const hasRemoteUrl = Boolean(getConfiguredAppsScriptUrl());
          if (
            (hasRemoteUrl && dataSource === 'local_preview') ||
            (!hasRemoteUrl && dataSource === 'apps_script')
          ) {
            loadRegistrations();
          }
        }}
        appsScriptCode={appsScriptCode}
      />
    </section>
  );
}
