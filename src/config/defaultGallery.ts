import kegiatanSholatDhuhaImg from '../assets/images/gallery/kegiatan_sholat_dhuha.jpg';
import kegiatanKreasiSiswaImg from '../assets/images/gallery/kegiatan_kreasi_siswa.jpg';
import kegiatanProyekP5Img from '../assets/images/gallery/kegiatan_proyek_p5.jpg';
import kegiatanPresentasiKelasImg from '../assets/images/gallery/kegiatan_presentasi_kelas.jpg';
import kegiatanKaryaKelas4Img from '../assets/images/gallery/kegiatan_karya_kelas4.jpg';
import kegiatanKelasKebersihanImg from '../assets/images/gallery/kegiatan_kelas_kebersihan.jpg';
import type { CustomGalleryItem } from '../types/spmb';

export const BASE_GALLERY_ASSET_MAP: Record<string, string> = {
  'sholat-dhuha': kegiatanSholatDhuhaImg,
  'kreasi-siswa': kegiatanKreasiSiswaImg,
  'proyek-p5': kegiatanProyekP5Img,
  'presentasi-kelas': kegiatanPresentasiKelasImg,
  'karya-kelas4': kegiatanKaryaKelas4Img,
  'kelas-kebersihan': kegiatanKelasKebersihanImg,
};

export const DEFAULT_GALLERY_ITEMS: CustomGalleryItem[] = [
  {
    id: 'sholat-dhuha',
    title: 'Pembiasaan Sholat Dhuha Berjamaah',
    category: 'Ibadah & Adab',
    context: 'Kegiatan Harian Siswa',
    caption:
      'Peserta didik dibimbing langsung oleh guru melaksanakan sholat berjamaah dengan tertib untuk membangun kedisiplinan ibadah sejak dini.',
    imageUrl: kegiatanSholatDhuhaImg,
    hidden: false,
    hasCustomImage: false,
  },
  {
    id: 'kreasi-siswa',
    title: 'Kreasi Seni & Motorik Siswa',
    category: 'Seni & Kreativitas',
    context: 'Pembelajaran Kelas',
    caption:
      'Siswi SDIT Insan Cendikia Kalibaru melatih kreativitas dan kerja sama melalui praktik melukis tangan yang menyenangkan di dalam kelas.',
    imageUrl: kegiatanKreasiSiswaImg,
    hidden: false,
    hasCustomImage: false,
  },
  {
    id: 'proyek-p5',
    title: 'Proyek P5 Daur Ulang Plastik',
    category: 'Proyek P5',
    context: 'Kelas 1',
    caption:
      'Siswa kelas 1 berkreasi mengolah bahan plastik bekas menjadi karya hiasan bertema kupu-kupu dan lebah sekaligus menumbuhkan kepedulian lingkungan.',
    imageUrl: kegiatanProyekP5Img,
    hidden: false,
    hasCustomImage: false,
  },
  {
    id: 'presentasi-kelas',
    title: 'Presentasi Pembelajaran IPAS & Bahasa',
    category: 'Literasi & Presentasi',
    context: 'Kelas Aktif',
    caption:
      'Peserta didik berlatih menyampaikan gagasan dan hasil belajar IPAS serta Bahasa Indonesia secara percaya diri di depan teman-temannya.',
    imageUrl: kegiatanPresentasiKelasImg,
    hidden: false,
    hasCustomImage: false,
  },
  {
    id: 'karya-kelas4',
    title: 'Pameran Karya Produk Kreatif',
    category: 'Proyek Kelas',
    context: 'Kelas 4',
    caption:
      'Siswa kelas 4 merancang dan mempresentasikan produk kerajinan fungsional hasil kolaborasi kelompok bersama wali kelas.',
    imageUrl: kegiatanKaryaKelas4Img,
    hidden: false,
    hasCustomImage: false,
  },
  {
    id: 'kelas-kebersihan',
    title: 'Pentas Lagu Edukatif Hidup Bersih',
    category: 'Karakter & Budaya Bersih',
    context: 'Kelas 2',
    caption:
      'Pembiasaan hidup bersih dan sehat dikemas melalui nyanyian tematik dan gerak bersama agar mudah dipraktikkan setiap hari.',
    imageUrl: kegiatanKelasKebersihanImg,
    hidden: false,
    hasCustomImage: false,
  },
];

export function resolveGalleryImageSrc(item: CustomGalleryItem): string {
  if (!item.hasCustomImage && BASE_GALLERY_ASSET_MAP[item.id]) {
    return BASE_GALLERY_ASSET_MAP[item.id];
  }
  return item.imageUrl || BASE_GALLERY_ASSET_MAP[item.id] || '';
}
