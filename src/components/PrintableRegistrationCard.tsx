import React, { useEffect } from 'react';
import { Download, Printer, X } from 'lucide-react';
import type { AdminApplicantRecord } from '../types/spmb';
import { triggerFileDownload } from '../services/spmbService';

interface PrintableRegistrationCardProps {
  applicant: AdminApplicantRecord | null;
  onClose: () => void;
}

export default function PrintableRegistrationCard({
  applicant,
  onClose,
}: PrintableRegistrationCardProps) {
  useEffect(() => {
    if (!applicant) return;
    document.body.classList.add('printing-receipt');
    return () => {
      document.body.classList.remove('printing-receipt');
    };
  }, [applicant]);

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

  const isLocalImagePhoto =
    applicant.urlPasFoto && applicant.urlPasFoto.startsWith('data:image/');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="printable-proof-title"
    >
      <div className="w-full max-w-3xl bg-white border border-[#DCE4DE] rounded-xl shadow-xl overflow-hidden my-6">
        {/* Toolbar Modal (tidak ikut tercetak) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-[#E6ECE7] bg-[#F7FAF8]">
          <div>
            <h2
              id="printable-proof-title"
              className="font-display text-base font-semibold text-[#0F2419]"
            >
              Pratinjau Cetak Bukti Pendaftaran / Daftar Ulang
            </h2>
            <p className="text-xs text-[#5A6D62]">
              Nomor Pendaftaran: <span className="font-mono">{applicant.noPendaftaran}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {applicant.downloadKartuKeluarga && (
              <button
                type="button"
                onClick={() =>
                  triggerFileDownload(
                    applicant.downloadKartuKeluarga || '',
                    applicant.kkFileName || `${applicant.noPendaftaran}_KK`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#EFF3F0] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download KK</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Bukti / Daftar Ulang</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau cetak"
              className="p-2 text-[#5A6D62] hover:text-[#0F2419] rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
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
            <div className="space-y-1">
              <div className="text-xs font-semibold tracking-wide text-[#0E6245]">
                YAYASAN BINA INSAN MULIA KALIBARU
              </div>
              <h3 className="font-display text-xl font-bold text-[#0F2419]">
                SD ISLAM TERPADU INSAN CENDEKIA KALIBARU
              </h3>
              <p className="text-xs text-[#4A5D52]">
                Jl. Pahlawan RT 001 / RW 006, Kalibaru Kulon, Kec. Kalibaru, Kab. Banyuwangi 68467 · NPSN 20573193 · Akreditasi A
              </p>
              <p className="text-xs text-[#4A5D52]">
                Telp: (0333) 897694 · Email: sditic08@gmail.com
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <div className="text-[11px] font-medium text-[#5A6D62]">
                Dokumen Resmi Panitia SPMB
              </div>
              <div className="mt-1 font-mono text-base font-bold text-[#0F2419] tabular-nums border border-[#0F2419] px-3 py-1.5 rounded">
                {applicant.noPendaftaran}
              </div>
            </div>
          </div>

          <div className="text-center space-y-0.5">
            <h4 className="font-display text-base font-bold uppercase tracking-wide text-[#0F2419]">
              Bukti Pendaftaran & Kartu Daftar Ulang SPMB 2026/2027
            </h4>
            <p className="text-xs text-[#5A6D62]">
              Tanggal Pendaftaran: {formatTanggal(applicant.waktuDaftar)}
            </p>
          </div>

          {/* Data Pendaftar + Slot Pas Foto 4x6 */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            <div className="sm:col-span-9">
              <table className="w-full text-sm border-collapse">
                <tbody className="divide-y divide-[#E5EAE6]">
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62] w-44">
                      Nomor Pendaftaran
                    </td>
                    <td className="py-2 font-mono font-semibold text-[#0F2419] tabular-nums">
                      {applicant.noPendaftaran}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Nama Calon Murid
                    </td>
                    <td className="py-2 font-semibold text-[#0F2419]">
                      {applicant.namaCalonMurid}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Nama Orang Tua / Wali
                    </td>
                    <td className="py-2 text-[#0F2419]">{applicant.namaOrangTua}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      No. Telepon / WhatsApp
                    </td>
                    <td className="py-2 font-mono tabular-nums text-[#0F2419]">
                      {applicant.noTelepon}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Jenis Kelamin / Tgl Lahir
                    </td>
                    <td className="py-2 text-[#0F2419]">
                      {applicant.jenisKelamin || '-'} · {applicant.tanggalLahir || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Asal TK / PAUD
                    </td>
                    <td className="py-2 text-[#0F2419]">{applicant.asalTkPaud || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-xs font-medium text-[#5A6D62]">
                      Data Fisik (TB / BB / LK)
                    </td>
                    <td className="py-2 font-mono text-xs sm:text-sm tabular-nums text-[#0F2419]">
                      {applicant.tinggiBadan} cm · {applicant.beratBadan} kg · {applicant.lingkarKepala} cm
                    </td>
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
                {isLocalImagePhoto ? (
                  <img
                    src={applicant.urlPasFoto}
                    alt={`Pas Foto ${applicant.namaCalonMurid}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center px-2 text-[11px] text-[#5A6D62]">
                    Pas Foto
                    <br />4 × 6 cm
                  </div>
                )}
              </div>
              <span className="mt-1.5 text-[11px] text-[#5A6D62]">Pas Foto 4 × 6</span>
            </div>
          </div>

          {/* Checklist Berkas & Daftar Ulang */}
          <div className="border border-[#DCE4DE] rounded-lg p-4 bg-[#FAFBF9] space-y-2 text-xs">
            <div className="font-semibold text-[#0F2419]">
              Kelengkapan Berkas & Catatan Daftar Ulang
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[#2D4035]">
              <div>[✓] Kartu Keluarga (KK) Terlampir</div>
              <div>[✓] Akta Kelahiran Terlampir</div>
              <div>[✓] Pas Foto 4 × 6 Terlampir</div>
            </div>
            {applicant.catatanPanitia && (
              <p className="pt-1 text-[#2D4035]">
                <span className="font-medium text-[#0F2419]">Catatan Panitia:</span>{' '}
                {applicant.catatanPanitia}
              </p>
            )}
          </div>

          {/* Kolom Tanda Tangan Daftar Ulang */}
          <div className="pt-4 grid grid-cols-2 gap-8 text-xs text-center">
            <div className="space-y-14">
              <div>
                <div className="text-[#5A6D62]">Orang Tua / Wali Calon Murid</div>
              </div>
              <div className="font-semibold text-[#0F2419] border-t border-[#CBD5CE] pt-1.5 mx-6">
                {applicant.namaOrangTua}
              </div>
            </div>
            <div className="space-y-14">
              <div>
                <div className="text-[#5A6D62]">Kalibaru, .......................... 2026</div>
                <div className="font-medium text-[#0F2419]">Panitia SPMB SDIT Insan Cendekia</div>
              </div>
              <div className="font-semibold text-[#0F2419] border-t border-[#CBD5CE] pt-1.5 mx-6">
                Petugas Verifikasi / Daftar Ulang
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
