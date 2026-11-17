import React, { useState } from 'react';
import { Check, CheckCircle2, Copy, Loader2, X, AlertCircle } from 'lucide-react';
import {
  getConfiguredAppsScriptUrl,
  isEnvAppsScriptConfigured,
  pingAppsScript,
  setRuntimeAppsScriptUrl,
  SPREADSHEET_ID,
} from '../services/spmbService';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appsScriptCode: string;
}

export default function AppsScriptModal({
  isOpen,
  onClose,
  appsScriptCode,
}: AppsScriptModalProps) {
  const [urlInput, setUrlInput] = useState(() => getConfiguredAppsScriptUrl());
  const [testing, setTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const envConfigured = isEnvAppsScriptConfigured();

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestFeedback(null);
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setRuntimeAppsScriptUrl('');
      setTestFeedback({
        ok: true,
        text: 'URL lokal dikosongkan. Sistem kembali menggunakan mode pratinjau lokal.',
      });
      return;
    }

    setTesting(true);
    try {
      const res = await pingAppsScript(trimmed);
      if (res.ok) {
        setRuntimeAppsScriptUrl(trimmed);
        setTestFeedback({
          ok: true,
          text: `Terhubung ke "${res.spreadsheetTitle || 'Spreadsheet'}" · Total pendaftar tercatat: ${res.totalPendaftar ?? 0}.`,
        });
      } else {
        setTestFeedback({
          ok: false,
          text: res.error || 'Gagal terhubung ke Apps Script.',
        });
      }
    } catch (err) {
      setTestFeedback({
        ok: false,
        text:
          err instanceof Error
            ? `Gagal menghubungi URL Apps Script: ${err.message}`
            : 'Gagal menghubungi URL Apps Script.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(appsScriptCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Abaikan jika clipboard dibatasi
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-apps-script-title"
    >
      <div className="w-full max-w-3xl bg-white border border-[#DCE4DE] rounded-xl shadow-xl overflow-hidden my-4 sm:my-8">
        <div className="flex items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#E6ECE7]">
          <div className="min-w-0">
            <h2 id="modal-apps-script-title" className="font-display text-base sm:text-lg font-semibold text-[#0F2419]">
              Integrasi Google Apps Script & Vercel
            </h2>
            <p className="text-xs text-[#5A6D62] break-all">
              Spreadsheet ID: <span className="font-mono">{SPREADSHEET_ID}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#5A6D62] hover:text-[#0F2419] rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm text-[#2D4035]">
          <form onSubmit={handleSaveAndTest} className="space-y-3 p-4 rounded-lg bg-[#F7FAF8] border border-[#DCE4DE]">
            <label htmlFor="gas-url-input" className="block text-xs font-semibold text-[#0F2419]">
              Uji & Hubungkan URL Web App Apps Script (Opsional untuk Pratinjau Browser)
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="gas-url-input"
                type="url"
                value={urlInput}
                disabled={envConfigured}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 min-h-[44px] px-3 py-2 text-base sm:text-xs font-mono bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245] disabled:bg-[#EFF3F0]"
              />
              {!envConfigured && (
                <button
                  type="submit"
                  disabled={testing}
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {testing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{testing ? 'Menguji...' : 'Simpan & Uji Koneksi'}</span>
                </button>
              )}
            </div>
            {envConfigured && (
              <p className="text-xs text-[#0E6245]">
                URL sudah terkunci dari Environment Variable <code className="font-mono">VITE_APPS_SCRIPT_URL</code>.
              </p>
            )}
            {testFeedback && (
              <div
                className={`flex items-start gap-2 text-xs font-medium ${
                  testFeedback.ok ? 'text-[#0E6245]' : 'text-[#B91C1C]'
                }`}
              >
                {testFeedback.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{testFeedback.text}</span>
              </div>
            )}
          </form>

          <div className="space-y-3">
            <h3 className="font-semibold text-[#0F2419]">Alur Deploy Google Apps Script → GitHub → Vercel</h3>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm leading-relaxed">
              <li>
                Buka Google Spreadsheet <span className="font-mono text-xs break-all">{SPREADSHEET_ID}</span>, klik{' '}
                <strong>Ekstensi &gt; Apps Script</strong>, lalu tempel kode <code className="font-mono text-xs">Code.gs</code> di bawah.
              </li>
              <li>
                Jalankan fungsi <code className="font-mono text-xs">setupSpreadsheet</code> sekali untuk membuat sheet{' '}
                <code className="font-mono text-xs">Pendaftar_SPMB</code> dan folder Drive berkas pendaftar.
              </li>
              <li>
                Klik <strong>Terapkan &gt; Deployment baru &gt; Aplikasi web</strong> (atau <strong>Kelola deployment &gt; Edit (ikon pensil) &gt; Versi baru</strong> bila memperbarui script lama), pilih{' '}
                <em>Jalankan sebagai: Saya</em> dan <em>Yang memiliki akses: Siapa saja (Anyone)</em>, lalu salin URL <code className="font-mono text-xs">/exec</code>.
              </li>
              <li>
                Push proyek ini ke repository <strong>GitHub</strong>, lalu hubungkan ke <strong>Vercel</strong> dan isi Environment Variable{' '}
                <code className="font-mono text-xs">VITE_APPS_SCRIPT_URL</code> dengan URL <code className="font-mono text-xs">/exec</code> tersebut.
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#0F2419]">
                Kode Google Apps Script (google-apps-script/Code.gs)
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-md hover:bg-[#E5F0E9] cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Kode Tersalin' : 'Salin Code.gs'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-[#0F2419] text-[#E6F1EA] text-xs font-mono overflow-x-auto max-h-64 leading-relaxed">
              <code>{appsScriptCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
