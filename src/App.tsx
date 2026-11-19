import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Loader2,
  Menu,
  Newspaper,
  School,
  Sparkles,
  X,
} from 'lucide-react';
import schoolLogoImg from './assets/images/logo_sdit_ic_kalibaru.png';
import heroBannerImg from './assets/images/hero_spmb_insan_cendikia.webp';
import { resolveGalleryImageSrc } from './config/defaultGallery';
import RegistrationForm from './components/RegistrationForm';
import { fetchSiteProfile, getCachedSiteProfile } from './services/spmbService';
import type { SiteProfileConfig } from './types/spmb';

const StatusCheckPanel = lazy(() => import('./components/StatusCheckPanel'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

type PortalTab = 'daftar' | 'status';
type ViewMode = 'portal' | 'admin';

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  category: string;
  context: string;
  caption: string;
  alt: string;
}

const ADMISSION_STEPS = [
  {
    step: '01',
    title: 'Pilih Gelombang & Isi Biodata',
    detail:
      'Pilih Gelombang 1 atau 2 lalu lengkapi identitas calon murid, biodata ayah/ibu/wali, alamat tempat tinggal, serta asal TK/PAUD.',
  },
  {
    step: '02',
    title: 'Biaya Daftar & 5 Berkas Wajib',
    detail:
      'Bayar biaya pendaftaran Rp 50.000,- (Bank Jatim 1592015532, QRIS Sekolah, atau Sekretariat) dan unggah KK, Akta, Pas Foto 3 × 4, KTP Ortu, & Bukti Bayar.',
  },
  {
    step: '03',
    title: 'Nomor Daftar & Grup WA 27/28',
    detail:
      'Sistem menerbitkan Nomor Pendaftaran otomatis dan mengarahkan wali murid bergabung ke Grup WA SPMB SDIT INSAN CENDIKIA 27/28.',
  },
  {
    step: '04',
    title: 'Verifikasi & Jadwal Observasi',
    detail:
      'Pantau hasil verifikasi berkas melalui tab Cek Status. Jadwal observasi akan diumumkan setelah proses verifikasi selesai.',
  },
];

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('portal');
  const [activeTab, setActiveTab] = useState<PortalTab>('daftar');
  const [prefillRegNo, setPrefillRegNo] = useState('');
  const [prefillPhone, setPrefillPhone] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [siteProfile, setSiteProfile] = useState<SiteProfileConfig>(() =>
    getCachedSiteProfile()
  );

  const [heroImgError, setHeroImgError] = useState(false);
  const [logoImgError, setLogoImgError] = useState(false);
  const [brokenGalleryIds, setBrokenGalleryIds] = useState<Record<string, boolean>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetchSiteProfile().then((loaded) => {
      if (active) {
        setSiteProfile(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const allGalleryItems: GalleryItem[] = useMemo(() => {
    return (siteProfile.customGallery || [])
      .filter((g) => !g.hidden)
      .map((g) => ({
        id: g.id,
        src: resolveGalleryImageSrc(g),
        title: g.title,
        category: g.category || 'Kegiatan Sekolah',
        context: g.context || 'Dokumentasi Terbaru',
        caption: g.caption || g.title,
        alt: `${g.title} — SDIT Insan Cendikia Kalibaru`,
      }));
  }, [siteProfile.customGallery]);

  const markGalleryBroken = (id: string) => {
    setBrokenGalleryIds((prev) => ({ ...prev, [id]: true }));
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxIndex(null);
      } else if (event.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % allGalleryItems.length
        );
      } else if (event.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + allGalleryItems.length) % allGalleryItems.length
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, allGalleryItems.length]);

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

  const activeLightboxItem =
    lightboxIndex !== null && allGalleryItems[lightboxIndex]
      ? allGalleryItems[lightboxIndex]
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F7] text-[#112218]">
      {/* Top Bar Contract: 3 zones separated by clean responsive gap */}
      <header className="no-print sticky top-0 z-40 bg-[#F7F9F7]/95 backdrop-blur-sm border-b border-[#E1E8E2]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Zone 1: Single-line brand wordmark with official school emblem */}
          <button
            type="button"
            onClick={() => navigateToSection('beranda')}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-[#0F2419] whitespace-nowrap shrink-0 cursor-pointer min-h-[44px] inline-flex items-center gap-2.5"
          >
            {!logoImgError ? (
              <img
                src={schoolLogoImg}
                alt="Logo SDIT Insan Cendikia Kalibaru"
                referrerPolicy="no-referrer"
                onError={() => setLogoImgError(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-contain shrink-0 bg-white"
              />
            ) : (
              <School className="w-6 h-6 text-[#0E6245] shrink-0" />
            )}
            <span>SDIT Insan Cendikia</span>
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-7 text-[13px] lg:text-sm font-medium text-[#42554A]">
            <button
              type="button"
              onClick={() => navigateToSection('visi-misi')}
              className="hover:text-[#0F2419] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2"
            >
              Visi &amp; Misi
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('galeri')}
              className="hover:text-[#0F2419] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2"
            >
              Galeri
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
              onClick={() => navigateToSection('galeri')}
              className="flex items-center w-full text-left min-h-[44px] px-2 text-sm font-medium text-[#1D3126] rounded-lg active:bg-[#F2F6F3]"
            >
              Galeri Kegiatan
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
          <Suspense
            fallback={
              <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center gap-3 text-sm text-[#4A5D52]">
                <Loader2 className="w-6 h-6 animate-spin text-[#0E6245]" />
                <span>Memuat Panel Admin SPMB...</span>
              </section>
            }
          >
            <AdminDashboard
              onBackToPortal={() => scrollToPortal('daftar')}
              siteProfile={siteProfile}
              onSiteProfileChange={setSiteProfile}
            />
          </Suspense>
        ) : (
          <>
            {/* Hero Section — Full-Bleed Cinematic (Responsif Mobile, Tablet, & Desktop) */}
            <section id="beranda" className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-7 pb-8 sm:pb-10">
              <div className="relative overflow-hidden rounded-2xl border border-[#1E4734] bg-[#0A2117] shadow-sm md:min-h-[420px] lg:min-h-[480px] flex flex-col justify-center">
                {/* Latar Foto Full-Bleed:
                    - Mobile (<768px): proporsi asli 3:2 agar gedung & 4 siswa utuh tanpa terpotong
                    - Tablet & Desktop (md+): menempel full-bleed di kanan & melebur mulus ke kiri */}
                <div className="relative w-full aspect-[3/2] md:aspect-auto md:absolute md:inset-y-0 md:right-0 md:w-[64%] lg:w-[66%] overflow-hidden bg-[#0E2A1C]">
                  {!heroImgError ? (
                    <img
                      src={heroBannerImg}
                      alt="Gedung sekolah dan siswa berprestasi SDIT Insan Cendikia Kalibaru Banyuwangi"
                      referrerPolicy="no-referrer"
                      fetchPriority="high"
                      decoding="async"
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover object-center md:object-[78%_22%] lg:object-[68%_22%] scale-[1.025]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0E4430] via-[#133828] to-[#0A2218] flex items-center justify-center">
                      <School className="w-20 h-20 text-white/15" />
                    </div>
                  )}

                  {/* Gradasi Halus Mobile: hanya di tepi bawah agar foto tetap cerah & menyatu ke blok teks */}
                  <div
                    aria-hidden="true"
                    className="md:hidden pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#0A2117_0%,rgba(10,33,23,0.72)_18%,rgba(10,33,23,0.16)_42%,transparent_72%)]"
                  />

                  {/* Gradasi Sinematik Tablet & Desktop: melebur halus dari hijau pekat kiri ke foto kanan */}
                  <div
                    aria-hidden="true"
                    className="hidden md:block pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#0A2117_0%,rgba(10,33,23,0.95)_24%,rgba(12,39,27,0.62)_45%,rgba(12,39,27,0.14)_66%,transparent_84%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="hidden md:block pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(7,24,16,0.45)_0%,transparent_28%,transparent_82%,rgba(7,24,16,0.20)_100%)]"
                  />
                </div>

                {/* Kolom Teks & CTA */}
                <div className="relative z-10 md:w-[54%] lg:w-[51%] px-5 pb-6 pt-3 sm:px-8 sm:pb-8 sm:pt-4 md:py-10 md:pl-9 md:pr-4 lg:py-12 lg:pl-12 lg:pr-6 space-y-3.5 sm:space-y-4">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs lg:text-sm font-medium text-[#CDE2D5]">
                    <span>SDIT Insan Cendikia Kalibaru</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">NPSN 20573193</span>
                    <span aria-hidden="true">·</span>
                    <span>Akreditasi A</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-white">
                      Aktif: {siteProfile.activeWave}
                    </span>
                  </div>

                  <h1
                    className="font-display font-bold tracking-tight text-white leading-[1.14]"
                    style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.75rem)', textWrap: 'balance' }}
                  >
                    Penerimaan Murid Baru Tahun Pelajaran 2027/2028
                  </h1>

                  <p className="text-xs sm:text-sm lg:text-base text-[#E3EFE7] leading-relaxed max-w-[48ch]">
                    Berlandaskan visi <strong className="font-semibold text-white">“Sholih, Cerdas, Mandiri”</strong>, SDIT Insan Cendikia Kalibaru membuka pendaftaran <strong>Gelombang 1 &amp; Gelombang 2</strong> untuk mendampingi peserta didik bertumbuh dalam ibadah, cinta Al-Qur’an, serta pembiasaan disiplin.
                  </p>

                  {siteProfile.waveInfoNote && (
                    <p className="text-xs sm:text-[13px] text-[#BBD7C6] max-w-[50ch]">
                      {siteProfile.waveInfoNote}
                    </p>
                  )}

                  <div className="pt-1.5 flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-start lg:items-center gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => scrollToPortal('daftar')}
                      className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0E6245] border border-[#24956E] rounded-lg hover:bg-[#127855] shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Isi Formulir Pendaftaran
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToPortal('status')}
                      className="inline-flex items-center justify-center min-h-[44px] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#0A2117]/75 backdrop-blur-xs border border-white/25 rounded-lg hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Cek Status Pendaftaran
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Visi & Misi SDIT Insan Cendikia */}
            <section id="visi-misi" className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-2 pb-10 sm:pb-12">
              <div className="bg-white border border-[#DCE4DE] rounded-xl p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                <div className="lg:col-span-5 space-y-3">
                  <p className="text-xs font-semibold tracking-wide text-[#0E6245]">
                    Visi SDIT Insan Cendikia
                  </p>
                  <h2
                    className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F2419] leading-snug"
                    style={{ textWrap: 'balance' }}
                  >
                    “Sholih, Cerdas, Mandiri.”
                  </h2>
                  <p className="text-sm text-[#4A5D52] leading-relaxed">
                    Pendidikan di SDIT Insan Cendikia Kalibaru diarahkan untuk mendampingi peserta didik mengembangkan ibadah, akhlak mulia, kecintaan kepada Al-Qur’an, kecerdasan, serta kemandirian dalam kehidupan sehari-hari.
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

            {/* Tentang Sekolah & Fokus Pendidikan (Dikelola dari Profil Admin) */}
            <section id="program" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
                <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
                  <div className="space-y-3.5">
                    <p className="text-xs font-semibold tracking-wide text-[#0E6245]">
                      Profil Sekolah
                    </p>
                    <h2
                      className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F2419]"
                      style={{ textWrap: 'balance' }}
                    >
                      Tentang SDIT Insan Cendikia Kalibaru
                    </h2>
                    <p className="text-sm sm:text-base text-[#42554A] leading-relaxed">
                      SDIT Insan Cendikia Kalibaru adalah sekolah dasar Islam terpadu di Kalibaru Kulon, Kabupaten Banyuwangi, yang berada di bawah naungan Yayasan Bina Insan Mulia Kalibaru. Pendidikan di sekolah ini berlandaskan visi “Sholih, Cerdas, Mandiri” dan diarahkan untuk mendampingi peserta didik dalam mengembangkan ibadah, akhlak, kecintaan kepada Al-Qur’an, kecerdasan, serta kemandirian.
                    </p>
                    <p className="text-sm sm:text-base text-[#42554A] leading-relaxed">
                      Arah pendidikan tersebut diwujudkan melalui pembelajaran yang menyenangkan dan mendorong prestasi, disertai pembiasaan hidup bersih dan disiplin. Sekolah berupaya menghadirkan proses belajar yang membantu peserta didik tumbuh dengan nilai-nilai Islami dan bekal untuk menjalani kehidupan sehari-hari.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-display text-lg font-semibold text-[#0F2419]">
                      Fokus Pendidikan &amp; Program Sekolah
                    </h3>
                    <div className="divide-y divide-[#E1E8E2] border-y border-[#E1E8E2]">
                      {siteProfile.programs.map((item, idx) => (
                        <div key={item.id} className="py-4 first:pt-4 last:pb-4 space-y-1">
                          <h4 className="font-display text-base font-semibold text-[#0F2419]">
                            <span className="font-mono text-sm text-[#0E6245] mr-2 tabular-nums">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            {item.title}
                          </h4>
                          <p className="text-sm text-[#4A5D52] leading-relaxed pl-0 sm:pl-7">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  {[0, 1].map((idx) => {
                    const item = allGalleryItems[idx];
                    if (!item) return null;
                    const isBroken = Boolean(brokenGalleryIds[item.id]);
                    return (
                      <figure
                        key={item.id}
                        className="bg-white border border-[#DCE4DE] rounded-xl overflow-hidden flex flex-col"
                      >
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className="group aspect-[16/10] bg-[#E8EFEA] overflow-hidden relative w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E6245]"
                          aria-label={`Perbesar foto ${item.title}`}
                        >
                          {!isBroken ? (
                            <img
                              src={item.src}
                              alt={item.alt}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              onError={() => markGalleryBroken(item.id)}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#E4ECE6] text-[#0E6245]">
                              <Camera className="w-10 h-10 opacity-50" />
                            </div>
                          )}
                        </button>
                        <figcaption className="px-5 py-4 text-xs sm:text-sm text-[#42554A]">
                          <span className="font-semibold text-[#0F2419]">{item.title}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{item.caption}</span>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Ekstrakurikuler, Prestasi & Berita Sekolah (Dikelola oleh Admin) */}
            {(siteProfile.extracurriculars.length > 0 ||
              siteProfile.achievements.length > 0 ||
              siteProfile.news.length > 0) && (
              <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
                {siteProfile.extracurriculars.length > 0 && (
                  <div className="bg-white border border-[#DCE4DE] rounded-xl p-6 sm:p-8 space-y-5">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#0E6245]">
                      <Sparkles className="w-4 h-4" />
                      <span>Kegiatan Ekstrakurikuler SDIT Insan Cendikia</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {siteProfile.extracurriculars.map((eks) => (
                        <div key={eks.id} className="space-y-1.5 border-t border-[#E6ECE7] pt-4">
                          {eks.subtitle && (
                            <div className="text-xs font-medium text-[#0E6245]">
                              {eks.subtitle}
                            </div>
                          )}
                          <h3 className="font-display text-base font-semibold text-[#0F2419]">
                            {eks.title}
                          </h3>
                          <p className="text-sm text-[#4A5D52] leading-relaxed">
                            {eks.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(siteProfile.achievements.length > 0 || siteProfile.news.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {siteProfile.achievements.length > 0 && (
                      <div className="bg-white border border-[#DCE4DE] rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#0E6245]">
                          <Award className="w-4 h-4" />
                          <span>Prestasi Siswa</span>
                        </div>
                        <div className="divide-y divide-[#E6ECE7]">
                          {siteProfile.achievements.map((pres) => (
                            <div key={pres.id} className="py-3.5 first:pt-1 last:pb-1 space-y-1">
                              <div className="text-xs text-[#5A6D62]">
                                {[pres.subtitle, pres.date].filter(Boolean).join(' · ')}
                              </div>
                              <h3 className="font-display text-base font-semibold text-[#0F2419]">
                                {pres.title}
                              </h3>
                              {pres.description && (
                                <p className="text-sm text-[#4A5D52] leading-relaxed">
                                  {pres.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {siteProfile.news.length > 0 && (
                      <div className="bg-white border border-[#DCE4DE] rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#0E6245]">
                          <Newspaper className="w-4 h-4" />
                          <span>Berita &amp; Pengumuman Sekolah</span>
                        </div>
                        <div className="divide-y divide-[#E6ECE7]">
                          {siteProfile.news.map((n) => (
                            <div key={n.id} className="py-3.5 first:pt-1 last:pb-1 space-y-1">
                              {n.date && (
                                <div className="font-mono text-xs text-[#5A6D62] tabular-nums">
                                  {n.date}
                                </div>
                              )}
                              <h3 className="font-display text-base font-semibold text-[#0F2419]">
                                {n.title}
                              </h3>
                              {n.description && (
                                <p className="text-sm text-[#4A5D52] leading-relaxed">
                                  {n.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Dokumentasi Kegiatan Nyata Siswa */}
            <section id="galeri" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <p className="text-xs font-semibold tracking-wide text-[#0E6245]">
                      Dokumentasi Kegiatan Nyata Siswa
                    </p>
                    <h2
                      className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F2419]"
                      style={{ textWrap: 'balance' }}
                    >
                      Aktivitas Belajar &amp; Pembiasaan Anak di SDIT Insan Cendikia Kalibaru
                    </h2>
                    <p className="text-sm text-[#4A5D52] leading-relaxed">
                      Cuplikan dokumentasi asli kegiatan ibadah, proyek kreatif, literasi kelas, dan pembiasaan hidup bersih peserta didik. Ketuk foto untuk melihat tampilan penuh.
                    </p>
                  </div>
                  <a
                    href="https://www.youtube.com/channel/UCtOE7_iytj8rGlIZ3UTHnjA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-semibold text-[#0E6245] bg-white border border-[#DCE4DE] rounded-lg hover:bg-[#F2F6F3] transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
                  >
                    <span>Kanal Resmi Sekolah</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {allGalleryItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {allGalleryItems.map((item, idx) => {
                      const isBroken = Boolean(brokenGalleryIds[item.id]);
                      return (
                        <article
                          key={item.id}
                          className="bg-white border border-[#DCE4DE] rounded-xl overflow-hidden flex flex-col"
                        >
                          <button
                            type="button"
                            onClick={() => setLightboxIndex(idx)}
                            className="group aspect-[16/10] bg-[#E8EFEA] overflow-hidden relative w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E6245]"
                            aria-label={`Lihat foto ${item.title} ukuran penuh`}
                          >
                            {!isBroken ? (
                              <img
                                src={item.src}
                                alt={item.alt}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                onError={() => markGalleryBroken(item.id)}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#E4ECE6] text-[#0E6245] px-4 text-center">
                                <Camera className="w-8 h-8 opacity-50" />
                                <span className="text-xs font-medium">{item.title}</span>
                              </div>
                            )}
                          </button>
                          <div className="p-4 sm:p-5 flex-1 flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-xs font-medium text-[#5A6D62]">
                              <span className="text-[#0E6245]">{item.category}</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.context}</span>
                            </div>
                            <h3 className="font-display text-base font-semibold text-[#0F2419] leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-[#4A5D52] leading-relaxed">
                              {item.caption}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#DCE4DE] bg-white p-8 text-center text-sm text-[#5A6D62]">
                    Foto dokumentasi kegiatan sedang diperbarui oleh panitia sekolah.
                  </div>
                )}
              </div>
            </section>

            {/* Alur Pendaftaran Ringkas */}
            <section id="alur" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
              <div className="bg-white border border-[#DCE4DE] rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 pb-4 border-b border-[#E6ECE7]">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#0F2419]">
                      Alur &amp; Persyaratan 5 Berkas SPMB
                    </h2>
                    <p className="mt-1 text-sm text-[#4A5D52]">
                      Siapkan 5 berkas digital dan biaya pendaftaran resmi Rp 50.000,- (tanpa biaya seragam maupun biaya tambahan lain).
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[#0E6245] shrink-0">
                    <FileCheck2 className="w-4 h-4 shrink-0" />
                    <span>KK · Akta · Foto 3×4 · KTP Ortu · Bukti Bayar</span>
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

                <div className="pt-4 border-t border-[#E6ECE7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#4A5D52]">
                  <span>Butuh bantuan saat pengisian formulir atau konfirmasi pembayaran?</span>
                  <span className="font-medium text-[#0F2419]">
                    Hubungi Sekolah:{' '}
                    <a href="tel:0333897694" className="font-mono text-[#0E6245] hover:underline tabular-nums">
                      (0333) 897694
                    </a>
                    <span aria-hidden="true"> · </span>
                    <a href="mailto:sditic08@gmail.com" className="text-[#0E6245] hover:underline">
                      sditic08@gmail.com
                    </a>
                  </span>
                </div>
              </div>
            </section>

            {/* Portal Formulir & Cek Status */}
            <section id="portal-spmb" className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F2419]">
                    Portal Pendaftaran &amp; Cek Status
                  </h2>
                  <p className="text-sm text-[#4A5D52]">
                    Data pendaftar dan berkas tersimpan terpusat pada database panitia SPMB SDIT Insan Cendikia Kalibaru.
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
                <RegistrationForm
                  onGoToStatusCheck={handleGoToStatusCheck}
                  activeWave={siteProfile.activeWave}
                  waGroupTitle={siteProfile.waGroupTitle}
                  waGroupUrl={siteProfile.waGroupUrl}
                />
              ) : (
                <Suspense
                  fallback={
                    <div className="bg-white border border-[#DCE4DE] rounded-xl p-10 flex items-center justify-center gap-2.5 text-sm text-[#4A5D52]">
                      <Loader2 className="w-5 h-5 animate-spin text-[#0E6245]" />
                      <span>Memuat panel Cek Status...</span>
                    </div>
                  }
                >
                  <StatusCheckPanel
                    initialNoPendaftaran={prefillRegNo}
                    initialNoTelepon={prefillPhone}
                    waGroupTitle={siteProfile.waGroupTitle}
                    waGroupUrl={siteProfile.waGroupUrl}
                  />
                </Suspense>
              )}
            </section>
          </>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="no-print border-t border-[#DCE4DE] bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row md:items-start md:justify-between gap-8 text-sm text-[#4A5D52]">
          <div className="flex items-start gap-3.5 max-w-md">
            {!logoImgError && (
              <img
                src={schoolLogoImg}
                alt="Logo SDIT Insan Cendikia Kalibaru"
                referrerPolicy="no-referrer"
                onError={() => setLogoImgError(true)}
                className="w-11 h-11 rounded-full object-contain shrink-0 bg-white border border-[#DCE4DE]"
              />
            )}
            <div className="space-y-2">
              <div className="font-display text-base font-semibold text-[#0F2419]">
                SD Islam Terpadu Insan Cendikia Kalibaru
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
          </div>
        </div>
      </footer>

      {/* Lightbox Foto Kegiatan Siswa */}
      {activeLightboxItem && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeLightboxItem.title}
          className="no-print fixed inset-0 z-50 bg-[#08150E]/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="bg-white border border-[#DCE4DE] rounded-2xl max-w-4xl w-full overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 sm:px-6 py-3.5 border-b border-[#E6ECE7] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-[#0E6245] truncate">
                  {activeLightboxItem.category} · {activeLightboxItem.context}
                </div>
                <h3 className="font-display text-sm sm:text-base font-semibold text-[#0F2419] truncate">
                  {activeLightboxItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Tutup tampilan foto"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#DCE4DE] text-[#1D3126] hover:bg-[#F2F6F3] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0F2419] aspect-[16/10] sm:aspect-[16/9] max-h-[65vh] w-full flex items-center justify-center overflow-hidden">
              {!brokenGalleryIds[activeLightboxItem.id] ? (
                <img
                  src={activeLightboxItem.src}
                  alt={activeLightboxItem.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/70">
                  <Camera className="w-10 h-10" />
                  <span className="text-xs">Foto tidak dapat dimuat</span>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
              <p className="text-xs sm:text-sm text-[#42554A] leading-relaxed">
                {activeLightboxItem.caption}
              </p>
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <span className="font-mono text-xs text-[#5A6D62] tabular-nums mr-1">
                  {lightboxIndex + 1} / {allGalleryItems.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex(
                      (lightboxIndex - 1 + allGalleryItems.length) % allGalleryItems.length
                    )
                  }
                  aria-label="Foto sebelumnya"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-[#DCE4DE] rounded-lg text-[#0F2419] hover:bg-[#F2F6F3] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((lightboxIndex + 1) % allGalleryItems.length)
                  }
                  aria-label="Foto berikutnya"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center border border-[#DCE4DE] rounded-lg text-[#0F2419] hover:bg-[#F2F6F3] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
