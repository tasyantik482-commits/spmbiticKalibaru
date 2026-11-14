import React, { useState } from 'react';
import { BookOpen, FileCheck2, Menu, School, ShieldCheck, X } from 'lucide-react';
import heroCampusImg from './assets/images/hero_itic_school_campus_1794616635107.jpg';
import programTahfidzImg from './assets/images/program_tahfidz_learning_1794616621064.jpg';
import programGreenImg from './assets/images/program_green_campus_1794616621569.jpg';
import appsScriptCode from '../google-apps-script/Code.gs?raw';
import RegistrationForm from './components/RegistrationForm';
import StatusCheckPanel from './components/StatusCheckPanel';
import AppsScriptModal from './components/AppsScriptModal';
import AdminDashboard from './components/AdminDashboard';

type PortalTab = 'daftar' | 'status';
type ViewMode = 'portal' | 'admin';

const PROGRAMS = [
  {
    number: '01.',
    title: 'Kurikulum Terpadu & Akreditasi A',
    description:
      'Memadukan Kurikulum Merdeka (Dinas Pendidikan) dan standar Ke-JSIT-an untuk membangun kecakapan akademik dan kemandirian belajar sejak kelas awal.',
  },
  {
    number: '02.',
    title: 'Tahfidzul Qur’an & Bina Pribadi Islami',
    description:
      'Pembelajaran Al-Qur’an intensif, pembiasaan ibadah harian, serta pembinaan akhlaqul karimah dalam keseharian warga sekolah.',
  },
  {
    number: '03.',
    title: 'Lingkungan Green School yang Nyaman',
    description:
      'Kawasan belajar asri dan tertib di Kalibaru Kulon dengan pembiasaan budaya hidup sehat, rapi, serta 12 pilihan ekstrakurikuler pengembangan bakat.',
  },
  {
    number: '04.',
    title: 'Layanan Reguler & Boarding School',
    description:
      'Tersedia pilihan kelas reguler harian maupun program boarding school terstruktur sesuai kesiapan peserta didik dan dukungan orang tua.',
  },
];

const ADMISSION_STEPS = [
  {
    step: '01',
    title: 'Lengkapi Biodata',
    detail: 'Isi identitas calon murid, nama orang tua/wali, nomor WhatsApp aktif, serta data tinggi badan, berat badan, dan lingkar kepala.',
  },
  {
    step: '02',
    title: 'Unggah 3 Berkas Wajib',
    detail: 'Lampirkan Kartu Keluarga, Akta Kelahiran, dan Pas Foto 4 × 6 dengan ukuran maksimal 900 KB per berkas.',
  },
  {
    step: '03',
    title: 'Nomor Pendaftaran Otomatis',
    detail: 'Sistem menerbitkan Nomor Pendaftaran unik (SPMB-IC-2026-XXXX) secara langsung setelah data dikirim.',
  },
  {
    step: '04',
    title: 'Verifikasi & Cek Status',
    detail: 'Pantau status verifikasi berkas dan jadwal observasi kapan saja menggunakan Nomor Pendaftaran dan Nomor Telepon.',
  },
];

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('portal');
  const [activeTab, setActiveTab] = useState<PortalTab>('daftar');
  const [prefillRegNo, setPrefillRegNo] = useState('');
  const [prefillPhone, setPrefillPhone] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [heroImgError, setHeroImgError] = useState(false);
  const [tahfidzImgError, setTahfidzImgError] = useState(false);
  const [greenImgError, setGreenImgError] = useState(false);

  const navigateToSection = (sectionId: string) => {
    setViewMode('portal');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 30);
  };

  const scrollToPortal = (tab: PortalTab) => {
    setViewMode('portal');
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById('portal-spmb');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 30);
  };

  const openAdminView = () => {
    setViewMode('admin');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToStatusCheck = (noPendaftaran: string, noTelepon: string) => {
    setPrefillRegNo(noPendaftaran);
    setPrefillPhone(noTelepon);
    scrollToPortal('status');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F7] text-[#112218]">
      {/* Top Bar Contract: 3 zones separated by clean responsive gap */}
      <header className="no-print sticky top-0 z-40 bg-[#F7F9F7]/95 backdrop-blur-sm border-b border-[#E1E8E2]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => navigateToSection('beranda')}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-[#0F2419] whitespace-nowrap shrink-0 cursor-pointer min-h-[44px] flex items-center"
          >
            SDIT Insan Cendekia
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-7 text-[13px] lg:text-sm font-medium text-[#42554A]">
            <button
              type="button"
              onClick={() => navigateToSection('beranda')}
              className="hover:text-[#0F2419] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('visi-misi')}
              className="hover:text-[#0F2419] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2"
            >
              Visi &amp; Misi
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('alur')}
              className="hover:text-[#0F2419] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2"
            >
              Alur Daftar
            </button>
            <button
              type="button"
              onClick={() => scrollToPortal('status')}
              className="hover:text-[#0F2419] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2"
            >
              Cek Status
            </button>
            <button
              type="button"
              onClick={openAdminView}
              className={`hover:text-[#0F2419] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2 ${
                viewMode === 'admin' ? 'text-[#0E6245] font-semibold underline' : ''
              }`}
            >
              Admin
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollToPortal('daftar')}
              className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Daftar Sekarang
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Buka menu navigasi"
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[#0F2419] border border-[#D4DDD6] rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E1E8E2] bg-white px-4 py-3 space-y-1">
            <button
              type="button"
              onClick={() => navigateToSection('beranda')}
              className="flex items-center w-full text-left min-h-[44px] px-2 text-sm font-medium text-[#1D3126] rounded-lg active:bg-[#F2F6F3]"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('visi-misi')}
              className="flex items-center w-full text-left min-h-[44px] px-2 text-sm font-medium text-[#1D3126] rounded-lg active:bg-[#F2F6F3]"
            >
              Visi &amp; Misi
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('alur')}
              className="flex items-center w-full text-left min-h-[44px] px-2 text-sm font-medium text-[#1D3126] rounded-lg active:bg-[#F2F6F3]"
            >
              Alur Daftar
            </button>
            <button
              type="button"
              onClick={() => scrollToPortal('status')}
              className="flex items-center w-full text-left min-h-[44px] px-2 text-sm font-medium text-[#1D3126] rounded-lg active:bg-[#F2F6F3]"
            >
              Cek Status
            </button>
            <button
              type="button"
              onClick={openAdminView}
              className="flex items-center w-full text-left min-h-[44px] px-2 text-sm font-semibold text-[#0E6245] rounded-lg active:bg-[#F2F6F3]"
            >
              Admin
            </button>
            <div className="pt-2 pb-1">
              <button
                type="button"
                onClick={() => scrollToPortal('daftar')}
                className="w-full min-h-[44px] py-2.5 text-sm font-semibold text-white bg-[#0E6245] rounded-lg"
              >
                Daftar Sekarang
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {viewMode === 'admin' ? (
          <AdminDashboard onBackToPortal={() => scrollToPortal('daftar')} />
        ) : (
          <>
        {/* Hero Section */}
        <section id="beranda" className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-8 sm:pb-10">
          <div className="relative overflow-hidden rounded-2xl border border-[#D7E0D9] bg-[#10291D] min-h-[430px] sm:min-h-[480px] lg:min-h-[540px] flex items-end">
            {!heroImgError ? (
              <img
                src={heroCampusImg}
                alt="Lingkungan kampus hijau SDIT Insan Cendekia Kalibaru Banyuwangi"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0E4430] via-[#133828] to-[#0A2218] flex items-center justify-center">
                <School className="w-20 h-20 text-white/15" />
              </div>
            )}

            {/* Measured contrast scrim */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#081A12]/92 via-[#0A2016]/78 to-[#0A2016]/35 lg:bg-gradient-to-r lg:from-[#081A12]/92 lg:via-[#0A2016]/72 lg:to-transparent"
            />

            <div className="relative z-10 w-full p-5 sm:p-10 lg:p-14 max-w-3xl space-y-4 sm:space-y-5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm font-medium text-[#CDE2D5]">
                <span>SD Islam Terpadu Insan Cendekia</span>
                <span aria-hidden="true">·</span>
                <span>Kec. Kalibaru, Banyuwangi</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">NPSN 20573193</span>
                <span aria-hidden="true">·</span>
                <span>Akreditasi A</span>
              </div>

              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.15]"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 3.35rem)', textWrap: 'balance' }}
              >
                Penerimaan Murid Baru Tahun Ajaran 2026/2027
              </h1>

              <p className="text-sm sm:text-base text-[#E3EFE7] leading-relaxed max-w-2xl">
                Bersama mewujudkan generasi <strong className="font-semibold text-white">“Sholih, Cerdas, Mandiri”</strong> — membekali ananda taat beribadah, berakhlak mulia, dan cinta Al-Qur’an melalui pembelajaran yang menyenangkan serta prestatif (IQ &amp; EQ), dan pembiasaan hidup bersih serta disiplin (AQ).
              </p>

              <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => scrollToPortal('daftar')}
                  className="inline-flex items-center justify-center min-h-[46px] px-6 py-3 text-sm font-semibold text-white bg-[#0E6245] border border-[#197B59] rounded-lg hover:bg-[#127855] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Isi Formulir Pendaftaran
                </button>
                <button
                  type="button"
                  onClick={() => scrollToPortal('status')}
                  className="inline-flex items-center justify-center min-h-[46px] px-5 py-3 text-sm font-medium text-white bg-white/10 border border-white/25 rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cek Status Pendaftaran
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Visi & Misi SDIT Insan Cendekia */}
        <section id="visi-misi" className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-2 pb-10 sm:pb-12">
          <div className="bg-white border border-[#DCE4DE] rounded-xl p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-3">
              <p className="text-xs font-semibold tracking-wide text-[#0E6245]">
                Visi SDIT Insan Cendekia
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2419] leading-snug"
                style={{ textWrap: 'balance' }}
              >
                “Sholih, Cerdas, Mandiri.”
              </h2>
              <p className="text-sm text-[#4A5D52] leading-relaxed">
                Komitmen pendidikan terpadu di Kalibaru dalam memadukan pembinaan ruhiyah (taat beribadah dan cinta Al-Qur’an), kecerdasan intelektual serta emosional (IQ &amp; EQ), dan ketangguhan karakter disiplin (AQ).
              </p>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <p className="text-xs font-semibold tracking-wide text-[#0E6245]">
                Misi Sekolah
              </p>
              <ol className="divide-y divide-[#E6ECE7] border-y border-[#E6ECE7]">
                <li className="py-3.5 flex items-start gap-3.5">
                  <span className="font-mono text-xs font-semibold text-[#0E6245] pt-0.5 shrink-0 tabular-nums">
                    01.
                  </span>
                  <span className="text-sm sm:text-base text-[#1D3126] leading-relaxed">
                    Membekali peserta didik taat beribadah, berakhlak mulia, dan cinta Al-Qur’an.
                  </span>
                </li>
                <li className="py-3.5 flex items-start gap-3.5">
                  <span className="font-mono text-xs font-semibold text-[#0E6245] pt-0.5 shrink-0 tabular-nums">
                    02.
                  </span>
                  <span className="text-sm sm:text-base text-[#1D3126] leading-relaxed">
                    Mengembangkan proses pembelajaran yang menyenangkan dan prestatif (IQ dan EQ).
                  </span>
                </li>
                <li className="py-3.5 flex items-start gap-3.5">
                  <span className="font-mono text-xs font-semibold text-[#0E6245] pt-0.5 shrink-0 tabular-nums">
                    03.
                  </span>
                  <span className="text-sm sm:text-base text-[#1D3126] leading-relaxed">
                    Membiasakan hidup bersih dan disiplin (AQ).
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Profil & Program Unggulan */}
        <section id="program" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-wide text-[#0E6245]">
                  Profil Pendidikan Sekolah
                </p>
                <h2
                  className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F2419]"
                  style={{ textWrap: 'balance' }}
                >
                  Membentuk Generasi Prestatif, Disiplin, dan Berakhlaqul Karimah
                </h2>
                <p className="text-sm sm:text-base text-[#42554A] leading-relaxed">
                  Di bawah naungan Yayasan Bina Insan Mulia Kalibaru, SDIT Insan Cendekia memadukan kecerdasan intelektual, emosional, dan spiritual dalam lingkungan belajar yang rapi dan nyaman.
                </p>
              </div>

              <div className="divide-y divide-[#E1E8E2] border-y border-[#E1E8E2]">
                {PROGRAMS.map((item) => (
                  <div key={item.number} className="py-4 first:pt-4 last:pb-4 space-y-1">
                    <h3 className="font-display text-base font-semibold text-[#0F2419]">
                      <span className="font-mono text-sm text-[#0E6245] mr-2 tabular-nums">
                        {item.number}
                      </span>
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#4A5D52] leading-relaxed pl-0 sm:pl-7">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              <figure className="bg-white border border-[#DCE4DE] rounded-xl overflow-hidden flex flex-col">
                <div className="aspect-[16/10] bg-[#E8EFEA] overflow-hidden relative">
                  {!tahfidzImgError ? (
                    <img
                      src={programTahfidzImg}
                      alt="Kegiatan literasi dan pembelajaran Al-Qur'an siswa SDIT Insan Cendekia Kalibaru"
                      referrerPolicy="no-referrer"
                      onError={() => setTahfidzImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#E4ECE6] text-[#0E6245]">
                      <BookOpen className="w-10 h-10 opacity-50" />
                    </div>
                  )}
                </div>
                <figcaption className="px-5 py-4 text-xs sm:text-sm text-[#42554A]">
                  <span className="font-semibold text-[#0F2419]">Pembelajaran Aktif & Pembiasaan Qur’ani</span>
                  <span aria-hidden="true"> · </span>
                  <span>Pendampingan intensif oleh guru penggerak dan pembina ibadah</span>
                </figcaption>
              </figure>

              <figure className="bg-white border border-[#DCE4DE] rounded-xl overflow-hidden flex flex-col">
                <div className="aspect-[16/10] bg-[#E8EFEA] overflow-hidden relative">
                  {!greenImgError ? (
                    <img
                      src={programGreenImg}
                      alt="Halaman hijau dan ruang kelas nyaman SDIT Insan Cendekia Kalibaru"
                      referrerPolicy="no-referrer"
                      onError={() => setGreenImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#E4ECE6] text-[#0E6245]">
                      <ShieldCheck className="w-10 h-10 opacity-50" />
                    </div>
                  )}
                </div>
                <figcaption className="px-5 py-4 text-xs sm:text-sm text-[#42554A]">
                  <span className="font-semibold text-[#0F2419]">Lingkungan Belajar Sehat & Asri</span>
                  <span aria-hidden="true"> · </span>
                  <span>Ruang belajar terbuka yang mendukung karakter rapi dan cinta lingkungan</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Alur Pendaftaran Ringkas */}
        <section id="alur" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="bg-white border border-[#DCE4DE] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 pb-4 border-b border-[#E6ECE7]">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#0F2419]">
                  Alur & Persyaratan Berkas SPMB
                </h2>
                <p className="mt-1 text-sm text-[#4A5D52]">
                  Siapkan tiga berkas digital dalam ukuran maksimal 900 KB per file sebelum mengisi formulir.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#0E6245] shrink-0">
                <FileCheck2 className="w-4 h-4" />
                <span>KK · Akta Kelahiran · Pas Foto 4 × 6</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-1">
              {ADMISSION_STEPS.map((item) => (
                <div key={item.step} className="space-y-2">
                  <div className="font-mono text-xs font-semibold text-[#0E6245] tabular-nums">
                    Langkah {item.step}
                  </div>
                  <h3 className="font-display text-base font-semibold text-[#0F2419]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#4A5D52] leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portal Formulir & Cek Status */}
        <section id="portal-spmb" className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F2419]">
                Portal Pendaftaran & Cek Status
              </h2>
              <p className="text-sm text-[#4A5D52]">
                Data pendaftar dan berkas tersimpan terpusat pada database panitia SPMB SDIT Insan Cendekia Kalibaru.
              </p>
            </div>

            {/* Interactive Segmented Tab Control */}
            <div
              role="tablist"
              aria-label="Layanan Portal SPMB"
              className="no-print grid grid-cols-2 sm:inline-flex items-center p-1 bg-[#E6ECE7] rounded-lg w-full sm:w-auto"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'daftar'}
                onClick={() => setActiveTab('daftar')}
                className={`min-h-[42px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center ${
                  activeTab === 'daftar'
                    ? 'bg-white text-[#0F2419] shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#0F2419]'
                }`}
              >
                Formulir Pendaftaran
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'status'}
                onClick={() => setActiveTab('status')}
                className={`min-h-[42px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center ${
                  activeTab === 'status'
                    ? 'bg-white text-[#0F2419] shadow-xs'
                    : 'text-[#4A5D52] hover:text-[#0F2419]'
                }`}
              >
                Cek Status
              </button>
            </div>
          </div>

          {activeTab === 'daftar' ? (
            <RegistrationForm onGoToStatusCheck={handleGoToStatusCheck} />
          ) : (
            <StatusCheckPanel
              initialNoPendaftaran={prefillRegNo}
              initialNoTelepon={prefillPhone}
            />
          )}
        </section>
          </>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="no-print border-t border-[#DCE4DE] bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row md:items-start md:justify-between gap-8 text-sm text-[#4A5D52]">
          <div className="space-y-2 max-w-md">
            <div className="font-display text-base font-semibold text-[#0F2419]">
              SD Islam Terpadu Insan Cendekia Kalibaru
            </div>
            <p className="text-xs sm:text-sm leading-relaxed">
              Jl. Pahlawan RT 001 / RW 006, Desa Kalibaru Kulon, Kec. Kalibaru, Kab. Banyuwangi, Jawa Timur 68467
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5A6D62]">
              <span>Yayasan Bina Insan Mulia Kalibaru</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">NPSN 20573193</span>
              <span aria-hidden="true">·</span>
              <span>Akreditasi A</span>
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm md:text-right">
            <div className="font-medium text-[#0F2419]">
              Telp: <span className="font-mono tabular-nums">(0333) 897694</span> · Email: sditic08@gmail.com
            </div>
            <div>
              <a
                href="http://www.sdit-insancendekia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0E6245] hover:underline"
              >
                sdit-insancendekia.com
              </a>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-xs font-medium text-[#4A5D52] hover:text-[#0F2419] underline underline-offset-4 cursor-pointer"
              >
                Pengaturan & Kode Apps Script (Admin)
              </button>
            </div>
          </div>
        </div>
      </footer>

      <AppsScriptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        appsScriptCode={appsScriptCode}
      />
    </div>
  );
}
