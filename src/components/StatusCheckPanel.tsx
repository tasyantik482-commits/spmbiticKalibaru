import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Search,
} from 'lucide-react';
import { lookupRegistrationStatus } from '../services/spmbService';
import type { StatusLookupResult } from '../types/spmb';

interface StatusCheckPanelProps {
  initialNoPendaftaran?: string;
  initialNoTelepon?: string;
}

export default function StatusCheckPanel({
  initialNoPendaftaran = '',
  initialNoTelepon = '',
}: StatusCheckPanelProps) {
  const [noPendaftaran, setNoPendaftaran] = useState(initialNoPendaftaran);
  const [noTelepon, setNoTelepon] = useState(initialNoTelepon);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusLookupResult | null>(null);

  useEffect(() => {
    if (initialNoPendaftaran) setNoPendaftaran(initialNoPendaftaran);
    if (initialNoTelepon) setNoTelepon(initialNoTelepon);
  }, [initialNoPendaftaran, initialNoTelepon]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!noPendaftaran.trim() || !noTelepon.trim()) {
      setError('Masukkan Nomor Pendaftaran dan Nomor Telepon/WhatsApp yang digunakan saat mendaftar.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await lookupRegistrationStatus(noPendaftaran, noTelepon);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memeriksa status pendaftaran.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('diterima') || normalized.includes('lengkap')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E6245]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{status}</span>
        </span>
      );
    }
    if (normalized.includes('perbaikan') || normalized.includes('tolak')) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B91C1C]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B45309]">
        <Clock className="w-4 h-4 shrink-0" />
        <span>{status}</span>
      </span>
    );
  };

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

  return (
    <div className="bg-white border border-[#DCE4DE] rounded-xl p-6 sm:p-10 space-y-8">
      <div className="max-w-2xl space-y-2">
        <h3 className="font-display text-lg font-semibold text-[#0F2419]">
          Cek Status Pendaftaran SPMB
        </h3>
        <p className="text-sm text-[#4A5D52] leading-relaxed">
          Masukkan <strong className="font-medium text-[#0F2419]">Nomor Pendaftaran</strong> dan{' '}
          <strong className="font-medium text-[#0F2419]">Nomor Telepon / WhatsApp</strong> yang didaftarkan untuk melihat hasil verifikasi berkas dan arahan panitia.
        </p>
      </div>

      <form onSubmit={handleSearch} noValidate className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5">
          <label htmlFor="cek-no-pendaftaran" className="block text-sm font-medium text-[#1D3126] mb-1.5">
            Nomor Pendaftaran
          </label>
          <input
            id="cek-no-pendaftaran"
            type="text"
            value={noPendaftaran}
            onChange={(e) => setNoPendaftaran(e.target.value)}
            placeholder="Contoh: SPMB-IC-2026-0001"
            className="w-full px-3.5 py-2.5 text-sm font-mono uppercase text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:normal-case placeholder:font-sans placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
          />
        </div>

        <div className="md:col-span-5">
          <label htmlFor="cek-no-telepon" className="block text-sm font-medium text-[#1D3126] mb-1.5">
            Nomor Telepon / WhatsApp
          </label>
          <input
            id="cek-no-telepon"
            type="tel"
            value={noTelepon}
            onChange={(e) => setNoTelepon(e.target.value)}
            placeholder="Contoh: 081234567890"
            className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg placeholder:font-sans placeholder:text-[#8A9B90] focus:outline-none focus:border-[#0E6245] focus:ring-2 focus:ring-[#0E6245]/15 transition-colors"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Mencari...' : 'Periksa'}</span>
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-[#F2C6C6] bg-[#FEF6F6] px-4 py-3 text-sm text-[#991B1B]"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="pt-8 border-t border-[#E6ECE7] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E6ECE7]">
            <div>
              <div className="text-xs font-medium text-[#5A6D62]">Nomor Pendaftaran</div>
              <div className="mt-1 font-mono text-xl font-semibold text-[#0F2419] tabular-nums">
                {result.noPendaftaran}
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs font-medium text-[#5A6D62]">Status Verifikasi</div>
              <div className="mt-1">{renderStatusBadge(result.statusVerifikasi)}</div>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 text-sm">
            <div>
              <dt className="text-xs font-medium text-[#5A6D62]">Nama Calon Murid</dt>
              <dd className="mt-1 font-semibold text-[#0F2419]">{result.namaCalonMurid}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5A6D62]">Nama Orang Tua / Wali</dt>
              <dd className="mt-1 font-semibold text-[#0F2419]">{result.namaOrangTua}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5A6D62]">Tanggal Pendaftaran</dt>
              <dd className="mt-1 text-[#0F2419]">{formatTanggal(result.waktuDaftar)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5A6D62]">Data Fisik (TB / BB / LK)</dt>
              <dd className="mt-1 font-mono text-xs sm:text-sm text-[#0F2419] tabular-nums">
                {result.tinggiBadan} cm · {result.beratBadan} kg · {result.lingkarKepala} cm
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5A6D62]">Asal TK / PAUD</dt>
              <dd className="mt-1 text-[#0F2419]">{result.asalTkPaud || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5A6D62]">Nomor Telepon / WA</dt>
              <dd className="mt-1 font-mono text-[#0F2419] tabular-nums">{result.noTelepon}</dd>
            </div>
          </dl>

          <div className="rounded-lg bg-[#F4F7F5] border border-[#DCE4DE] p-4 space-y-1">
            <div className="text-xs font-semibold text-[#0F2419]">Catatan Panitia SPMB</div>
            <p className="text-sm text-[#2D4035] leading-relaxed">{result.catatanPanitia}</p>
          </div>

          {(result.urlKartuKeluarga || result.urlAktaKelahiran || result.urlPasFoto) && (
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <span className="font-medium text-[#5A6D62]">Berkas Terunggah:</span>
              {result.urlKartuKeluarga && (
                <a
                  href={result.urlKartuKeluarga}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#0E6245] hover:underline"
                >
                  <span>Kartu Keluarga</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {result.urlAktaKelahiran && (
                <a
                  href={result.urlAktaKelahiran}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#0E6245] hover:underline"
                >
                  <span>Akta Kelahiran</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {result.urlPasFoto && (
                <a
                  href={result.urlPasFoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#0E6245] hover:underline"
                >
                  <span>Pas Foto 4×6</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
