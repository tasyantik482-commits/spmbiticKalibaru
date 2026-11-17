import React, { useEffect, useState } from 'react';
import { Download, Printer, X } from 'lucide-react';
import type { AdminApplicantRecord } from '../types/spmb';
import {
  formatRupiah,
  toDriveThumbnailUrl,
  triggerFileDownload,
} from '../services/spmbService';
import schoolLogoImg from '../assets/images/logo_sdit_ic_kalibaru.png';

interface PrintableRegistrationCardProps {
  applicant: AdminApplicantRecord | null;
  onClose: () => void;
}

export default function PrintableRegistrationCard({
  applicant,
  onClose,
}: PrintableRegistrationCardProps) {
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setPhotoError(false);
    if (!applicant) return;
    document.body.classList.add('printing-receipt');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('printing-receipt');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [applicant, onClose]);

  if (!applicant) return null;

  const formatTanggal = (isoString: string) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const photoPreviewSrc = toDriveThumbnailUrl(applicant.urlPasFoto);
  const canShowPhoto = Boolean(photoPreviewSrc) && !photoError;

  const alamatRingkas = [
    applicant.alamatSaatIni,
    applicant.rtRw ? `RT/RW ${applicant.rtRw}` : '',
    applicant.desaKelurahan,
    applicant.kecamatan ? `Kec. ${applicant.kecamatan}` : '',
    applicant.kabupatenKota,
    applicant.provinsi,
  ]
    .filter((v) => v && v !== '-')
    .join(', ');

  const observasiText =
    applicant.tanggalObservasi || applicant.waktuObservasi
      ? [
          applicant.tanggalObservasi ? formatTanggal(applicant.tanggalObservasi) : '',
          applicant.waktuObservasi || '',
        ]
          .filter(Boolean)
          .join(' · ')
      : 'Menunggu penjadwalan panitia';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="printable-proof-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white border border-[#DCE4DE] rounded-xl shadow-2xl overflow-hidden my-3 sm:my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Toolbar Modal (tidak ikut tercetak) — Dilengkapi tombol Tutup yang jelas */}
        <div className="no-print sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-[#DCE4DE] bg-[#F7FAF8]">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <h2
                id="printable-proof-title"
                className="font-display text-sm sm:text-base font-semibold text-[#0F2419] truncate"
              >
                Pratinjau Cetak Bukti Pendaftaran / Daftar Ulang
              </h2>
              <p className="text-xs text-[#5A6D62]">
                No. Pendaftaran: <span className="font-mono">{applicant.noPendaftaran}</span>
                <span aria-hidden="true"> · </span>
                <span>{applicant.gelombang || 'Gelombang 1'}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau cetak"
              className="sm:hidden inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 text-xs font-semibold text-[#991B1B] bg-white border border-[#EBCACA] rounded-lg hover:bg-[#FEF6F6] shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {applicant.downloadKartuKeluarga && (
              <button
                type="button"
                onClick={() =>
                  triggerFileDownload(
                    applicant.downloadKartuKeluarga || '',
                    applicant.kkFileName || `${applicant.noPendaftaran}_KK`
                  )
                }
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#EFF3F0] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download KK</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Bukti / Daftar Ulang</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau cetak"
              className="hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-semibold text-[#991B1B] bg-white border border-[#EBCACA] rounded-lg hover:bg-[#FEF6F6] transition-colors cursor-pointer whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Dokumen Resmi yang Dicetak */}
        <div
          id="printable-proof-area"
          className="p-6 sm:p-10 bg-white text-[#111827] space-y-6"
        >
          {/* Kop Sekolah */}
          <div className="border-b-2 border-[#0F2419] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <img
                src={schoolLogoImg}
                alt="Logo SDIT Insan Cendikia Kalibaru"
                referrerPolicy="no-referrer"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-contain shrink-0 bg-white"
              />
              <div className="space-y-1">
                <div className="text-xs font-semibold tracking-wide text-[#0E6245]">
                  YAYASAN BINA INSAN MULIA KALIBARU
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#0F2419]">
                  SD ISLAM TERPADU INSAN CENDIKIA KALIBARU
                </h3>
                <p className="text-xs text-[#4A5D52]">
                  Jl. Pahlawan RT 001 / RW 006, Kalibaru Kulon, Kec. Kalibaru, Kab. Banyuwangi 68467 · NPSN 20573193 · Akreditasi A
                </p>
                <p className="text-xs text-[#4A5D52]">
                  Telp: (0333) 897694 · Email: sditic08@gmail.com
                </p>
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <div className="text-[11px] font-medium text-[#5A6D62]">
                Dokumen Resmi Panitia SPMB · {applicant.gelombang || 'Gelombang 1'}
              </div>
              <div className="mt-1 font-mono text-base font-bold text-[#0F2419] tabular-nums border border-[#0F2419] px-3 py-1.5 rounded">
                {applicant.noPendaftaran}
              </div>
            </div>
          </div>

          <div className="text-center space-y-0.5">
            <h4 className="font-display text-base font-bold uppercase tracking-wide text-[#0F2419]">
              Bukti Pendaftaran &amp; Kartu Daftar Ulang SPMB 2027/2028
            </h4>
            <p className="text-xs text-[#5A6D62]">
              Tanggal Pendaftaran: {formatTanggal(applicant.waktuDaftar)} · {applicant.gelombang || 'Gelombang 1'}
            </p>
          </div>

          {/* Data Pendaftar + Slot Pas Foto 3x4 */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            <div className="sm:col-span-9">
              <table className="w-full text-sm border-collapse">
                <tbody className="divide-y divide-[#E5EAE6]">
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62] w-44">
                      Nomor Pendaftaran
                    </td>
                    <td className="py-2 font-mono font-semibold text-[#0F2419] tabular-nums">
                      {applicant.noPendaftaran} ({applicant.gelombang || 'Gelombang 1'})
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Nama Calon Murid
                    </td>
                    <td className="py-2 font-semibold text-[#0F2419]">
                      {applicant.namaCalonMurid}
                      {applicant.namaPanggilan && applicant.namaPanggilan !== '-'
                        ? ` (${applicant.namaPanggilan})`
                        : ''}
                    </td>
                  </tr>
                  {applicant.nikCalonMurid && (
                    <tr>
                      <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                        NIK Calon Murid
                      </td>
                      <td className="py-2 font-mono tabular-nums text-[#0F2419]">
                        {applicant.nikCalonMurid}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Tempat, Tanggal Lahir / JK
                    </td>
                    <td className="py-2 text-[#0F2419]">
                      {applicant.tempatLahir && applicant.tempatLahir !== '-'
                        ? `${applicant.tempatLahir}, `
                        : ''}
                      {applicant.tanggalLahir || '-'} · {applicant.jenisKelamin || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Orang Tua / Wali
                    </td>
                    <td className="py-2 text-[#0F2419]">
                      {applicant.namaAyah || applicant.namaIbu
                        ? `Ayah: ${applicant.namaAyah || '-'} · Ibu: ${applicant.namaIbu || '-'}`
                        : applicant.namaOrangTua}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      No. Telepon / WhatsApp
                    </td>
                    <td className="py-2 font-mono tabular-nums text-[#0F2419]">
                      {applicant.noTelepon}
                    </td>
                  </tr>
                  {alamatRingkas && (
                    <tr>
                      <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                        Alamat Tempat Tinggal
                      </td>
                      <td className="py-2 text-xs sm:text-sm text-[#0F2419]">{alamatRingkas}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Asal TK / PAUD / RA
                    </td>
                    <td className="py-2 text-[#0F2419]">{applicant.asalTkPaud || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Data Fisik (TB / BB)
                    </td>
                    <td className="py-2 font-mono text-xs sm:text-sm tabular-nums text-[#0F2419]">
                      {applicant.tinggiBadan} cm · {applicant.beratBadan} kg
                      {applicant.lingkarKepala ? ` · LK ${applicant.lingkarKepala} cm` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Pembayaran Pendaftaran
                    </td>
                    <td className="py-2 text-[#0F2419]">
                      {applicant.metodePembayaran
                        ? `${applicant.metodePembayaran} · ${formatRupiah(
                            applicant.nominalPembayaran || 50000
                          )}${
                            applicant.namaPengirimPembayaran
                              ? ` (${applicant.namaPengirimPembayaran})`
                              : ''
                          }`
                        : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Jadwal Observasi
                    </td>
                    <td className="py-2 font-semibold text-[#0F2419]">{observasiText}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Status Verifikasi
                    </td>
                    <td className="py-2 font-semibold text-[#0E6245]">
                      {applicant.statusVerifikasi}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="sm:col-span-3 flex flex-col items-center">
              <div className="w-[104px] h-[138px] border border-[#9EB0A3] rounded bg-[#F7FAF8] flex items-center justify-center overflow-hidden">
                {canShowPhoto ? (
                  <img
                    src={photoPreviewSrc}
                    alt={`Pas Foto ${applicant.namaCalonMurid}`}
                    referrerPolicy="no-referrer"
                    onError={() => setPhotoError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center px-2 text-[11px] text-[#5A6D62]">
                    Pas Foto
                    <br />3 × 4 cm
                  </div>
                )}
              </div>
              <span className="mt-1.5 text-[11px] text-[#5A6D62]">Pas Foto 3 × 4</span>
            </div>
          </div>

          {/* Checklist Berkas & Daftar Ulang */}
          <div className="border border-[#DCE4DE] rounded-lg p-4 bg-[#FAFBF9] space-y-2 text-xs">
            <div className="font-semibold text-[#0F2419]">
              Kelengkapan 5 Berkas Wajib &amp; Catatan Daftar Ulang
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[#2D4035]">
              <div>[✓] Kartu Keluarga (KK) Terlampir</div>
              <div>[✓] Akta Kelahiran Terlampir</div>
              <div>[✓] Pas Foto 3 × 4 Terlampir</div>
              <div>
                [{applicant.urlKtpOrangTua ? '✓' : ' '}] KTP Orang Tua / Wali
              </div>
              <div>
                [{applicant.urlBuktiPembayaran ? '✓' : ' '}] Bukti Biaya Pendaftaran
              </div>
            </div>
            {applicant.catatanPanitia && (
              <p className="pt-1 text-[#2D4035]">
                <span className="font-medium text-[#0F2419]">Catatan Panitia:</span>{' '}
                {applicant.catatanPanitia}
              </p>
            )}
          </div>

          {/* Kolom Tanda Tangan Daftar Ulang */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-8 text-xs text-center">
            <div className="space-y-12 sm:space-y-14">
              <div>
                <div className="text-[#5A6D62]">Orang Tua / Wali Calon Murid</div>
              </div>
              <div className="font-semibold text-[#0F2419] border-t border-[#CBD5CE] pt-1.5 mx-6">
                {applicant.namaOrangTua}
              </div>
            </div>
            <div className="space-y-12 sm:space-y-14">
              <div>
                <div className="text-[#5A6D62]">Kalibaru, .......................... 2027</div>
                <div className="font-medium text-[#0F2419]">Panitia SPMB SDIT Insan Cendikia</div>
              </div>
              <div className="font-semibold text-[#0F2419] border-t border-[#CBD5CE] pt-1.5 mx-6">
                Petugas Verifikasi / Daftar Ulang
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bawah Pratinjau (tidak ikut tercetak) */}
        <div className="no-print flex items-center justify-between px-4 sm:px-6 py-3 border-t border-[#E6ECE7] bg-[#F7FAF8]">
          <span className="text-xs text-[#5A6D62]">
            Tekan tombol <strong>Cetak</strong> untuk menyimpan sebagai PDF atau mencetak kartu.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#EFF3F0] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup Pratinjau</span>
          </button>
        </div>
      </div>
    </div>
  );
}
