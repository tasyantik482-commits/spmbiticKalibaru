import type { SiteProfileConfig } from '../types/spmb';

export const DEFAULT_SITE_PROFILE: SiteProfileConfig = {
  activeWave: 'Gelombang 1',
  waveInfoNote: 'Pendaftaran dibuka dalam 2 gelombang untuk Tahun Ajaran 2026/2027.',
  waGroupTitle: 'Grup WA SPMB SDIT INSAN CENDEKIA 27/28',
  waGroupUrl: '',
  programs: [
    {
      id: 'prog-1',
      title: 'Ibadah, akhlak, dan Al-Qur’an',
      description:
        'Membekali peserta didik agar taat beribadah, berakhlak mulia, dan mencintai Al-Qur’an.',
    },
    {
      id: 'prog-2',
      title: 'Pembelajaran menyenangkan dan prestatif',
      description:
        'Mengembangkan proses belajar yang menyenangkan serta mendukung kecerdasan intelektual dan emosional (IQ dan EQ).',
    },
    {
      id: 'prog-3',
      title: 'Hidup bersih dan disiplin',
      description:
        'Menumbuhkan kebiasaan menjaga kebersihan dan disiplin dalam kegiatan sehari-hari (AQ).',
    },
  ],
  extracurriculars: [
    {
      id: 'eks-1',
      title: 'Tahfidz & Tilawah Al-Qur’an',
      subtitle: 'Pembinaan Al-Qur’an',
      description:
        'Pendampingan hafalan surat-surat Al-Qur’an serta perbaikan bacaan sesuai kaidah tajwid.',
    },
    {
      id: 'eks-2',
      title: 'Pramuka SIT (Pangkalan Insan Cendekia)',
      subtitle: 'Kemandirian & Kepemimpinan',
      description:
        'Pembentukan karakter tangguh, kemandirian, dan kerja sama tim melalui kegiatan kepanduan.',
    },
    {
      id: 'eks-3',
      title: 'Seni Islami, Kreativitas & Olahraga',
      subtitle: 'Minat & Bakat',
      description:
        'Mengembangkan ekspresi seni, keterampilan motorik, serta kebugaran jasmani siswa.',
    },
  ],
  achievements: [],
  news: [],
  customGallery: [],
};
