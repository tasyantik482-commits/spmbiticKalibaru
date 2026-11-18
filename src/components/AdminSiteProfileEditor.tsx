import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  DEFAULT_GALLERY_ITEMS,
  resolveGalleryImageSrc,
} from '../config/defaultGallery';
import {
  readFileAsPayloadWithInfo,
  saveSiteProfile,
} from '../services/spmbService';
import {
  GELOMBANG_OPTIONS,
  type CustomGalleryItem,
  type GelombangPendaftaran,
  type SiteHighlightItem,
  type SiteProfileConfig,
  type UploadedFilePayload,
} from '../types/spmb';

interface AdminSiteProfileEditorProps {
  profile: SiteProfileConfig;
  onProfileSaved: (updated: SiteProfileConfig) => void;
}

export default function AdminSiteProfileEditor({
  profile,
  onProfileSaved,
}: AdminSiteProfileEditorProps) {
  const [draft, setDraft] = useState<SiteProfileConfig>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // State tambah Galeri Kegiatan baru
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState('Kegiatan Sekolah');
  const [galContext, setGalContext] = useState('Dokumentasi Terbaru');
  const [galCaption, setGalCaption] = useState('');
  const [galUrl, setGalUrl] = useState('');
  const [galPendingFile, setGalPendingFile] = useState<UploadedFilePayload | null>(null);
  const [isAddingGallery, setIsAddingGallery] = useState(false);
  const galFileInputRef = useRef<HTMLInputElement | null>(null);

  // State edit / ganti foto / hapus item Galeri yang sudah ada
  const [editingGalId, setEditingGalId] = useState<string | null>(null);
  const [editGalTitle, setEditGalTitle] = useState('');
  const [editGalCategory, setEditGalCategory] = useState('');
  const [editGalContext, setEditGalContext] = useState('');
  const [editGalCaption, setEditGalCaption] = useState('');
  const [editGalUrl, setEditGalUrl] = useState('');
  const [editGalPendingFile, setEditGalPendingFile] =
    useState<UploadedFilePayload | null>(null);
  const [isSavingEditGal, setIsSavingEditGal] = useState(false);
  const [confirmDeleteGalId, setConfirmDeleteGalId] = useState<string | null>(null);
  const editGalFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const handleSaveProfile = async (
    nextConfig = draft,
    galleryUpload?: UploadedFilePayload
  ) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const saved = await saveSiteProfile(nextConfig, galleryUpload);
      setDraft(saved);
      onProfileSaved(saved);
      setSaveSuccess(
        'Pengaturan profil sekolah, gelombang, dan link Grup WA berhasil disimpan.'
      );
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Gagal menyimpan pengaturan profil sekolah.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateListItem = (
    listKey: 'programs' | 'extracurriculars' | 'achievements' | 'news',
    idx: number,
    patch: Partial<SiteHighlightItem>
  ) => {
    setDraft((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    }));
  };

  const addListItem = (
    listKey: 'programs' | 'extracurriculars' | 'achievements' | 'news',
    template: SiteHighlightItem
  ) => {
    setDraft((prev) => ({
      ...prev,
      [listKey]: [...prev[listKey], template],
    }));
  };

  const removeListItem = (
    listKey: 'programs' | 'extracurriculars' | 'achievements' | 'news',
    idx: number
  ) => {
    setDraft((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((_, i) => i !== idx),
    }));
  };

  const handleSelectGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaveError(null);
    try {
      const prepared = await readFileAsPayloadWithInfo(file, 450 * 1024);
      setGalPendingFile(prepared.payload);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal memproses foto galeri.');
      e.target.value = '';
    }
  };

  const handleAddGalleryItem = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    if (!galTitle.trim()) {
      setSaveError('Judul foto kegiatan wajib diisi.');
      return;
    }
    if (!galPendingFile && !galUrl.trim()) {
      setSaveError('Unggah foto kegiatan atau masukkan URL gambar terlebih dahulu.');
      return;
    }

    const newItem: CustomGalleryItem = {
      id: `custom-gal-${Date.now()}`,
      title: galTitle.trim(),
      category: galCategory.trim() || 'Kegiatan Sekolah',
      context: galContext.trim() || 'Dokumentasi Terbaru',
      caption: galCaption.trim() || galTitle.trim(),
      imageUrl: galPendingFile ? '__PENDING_UPLOAD__' : galUrl.trim(),
      hidden: false,
      hasCustomImage: true,
    };

    const nextConfig: SiteProfileConfig = {
      ...draft,
      customGallery: [...draft.customGallery, newItem],
      galleryInitialized: true,
    };

    setIsAddingGallery(true);
    try {
      const saved = await saveSiteProfile(nextConfig, galPendingFile || undefined);
      setDraft(saved);
      onProfileSaved(saved);
      setGalTitle('');
      setGalCaption('');
      setGalUrl('');
      setGalPendingFile(null);
      if (galFileInputRef.current) galFileInputRef.current.value = '';
      setSaveSuccess('Foto kegiatan berhasil ditambahkan ke galeri portal SPMB.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menambahkan foto galeri.');
    } finally {
      setIsAddingGallery(false);
    }
  };

  const startEditGalleryItem = (item: CustomGalleryItem) => {
    setEditingGalId(item.id);
    setConfirmDeleteGalId(null);
    setEditGalTitle(item.title);
    setEditGalCategory(item.category);
    setEditGalContext(item.context);
    setEditGalCaption(item.caption);
    setEditGalUrl(item.hasCustomImage ? item.imageUrl : '');
    setEditGalPendingFile(null);
    if (editGalFileInputRef.current) editGalFileInputRef.current.value = '';
  };

  const cancelEditGalleryItem = () => {
    setEditingGalId(null);
    setEditGalPendingFile(null);
    if (editGalFileInputRef.current) editGalFileInputRef.current.value = '';
  };

  const handleSelectEditGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaveError(null);
    try {
      const prepared = await readFileAsPayloadWithInfo(file, 450 * 1024);
      setEditGalPendingFile(prepared.payload);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal memproses foto pengganti.');
      e.target.value = '';
    }
  };

  const handleSaveEditGalleryItem = async (item: CustomGalleryItem) => {
    setSaveError(null);
    setSaveSuccess(null);

    if (!editGalTitle.trim()) {
      setSaveError('Judul foto kegiatan tidak boleh kosong.');
      return;
    }

    const trimmedUrl = editGalUrl.trim();
    const isReplacingWithFile = Boolean(editGalPendingFile);
    const isReplacingWithUrl =
      !isReplacingWithFile && Boolean(trimmedUrl) && trimmedUrl !== item.imageUrl;

    const updatedGallery = draft.customGallery.map((g) => {
      if (g.id !== item.id) return g;
      return {
        ...g,
        title: editGalTitle.trim(),
        category: editGalCategory.trim() || 'Kegiatan Sekolah',
        context: editGalContext.trim() || 'Dokumentasi Sekolah',
        caption: editGalCaption.trim() || editGalTitle.trim(),
        imageUrl: isReplacingWithFile
          ? '__PENDING_UPLOAD__'
          : isReplacingWithUrl
            ? trimmedUrl
            : g.imageUrl,
        hasCustomImage: isReplacingWithFile || isReplacingWithUrl ? true : g.hasCustomImage,
      };
    });

    const nextConfig: SiteProfileConfig = {
      ...draft,
      customGallery: updatedGallery,
      galleryInitialized: true,
    };

    setIsSavingEditGal(true);
    try {
      const saved = await saveSiteProfile(
        nextConfig,
        editGalPendingFile || undefined
      );
      setDraft(saved);
      onProfileSaved(saved);
      cancelEditGalleryItem();
      setSaveSuccess(`Foto galeri "${editGalTitle.trim()}" berhasil diperbarui.`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal memperbarui foto galeri.');
    } finally {
      setIsSavingEditGal(false);
    }
  };

  const handleToggleHideGalleryItem = async (item: CustomGalleryItem) => {
    const nextHidden = !item.hidden;
    const nextConfig: SiteProfileConfig = {
      ...draft,
      customGallery: draft.customGallery.map((g) =>
        g.id === item.id ? { ...g, hidden: nextHidden } : g
      ),
      galleryInitialized: true,
    };
    setDraft(nextConfig);
    await handleSaveProfile(nextConfig);
    setSaveSuccess(
      nextHidden
        ? `Foto "${item.title}" disembunyikan dari halaman utama.`
        : `Foto "${item.title}" kembali ditampilkan di halaman utama.`
    );
  };

  const handleRemoveGalleryItem = async (id: string) => {
    const target = draft.customGallery.find((g) => g.id === id);
    const nextConfig: SiteProfileConfig = {
      ...draft,
      customGallery: draft.customGallery.filter((g) => g.id !== id),
      galleryInitialized: true,
    };
    setConfirmDeleteGalId(null);
    if (editingGalId === id) {
      cancelEditGalleryItem();
    }
    setDraft(nextConfig);
    await handleSaveProfile(nextConfig);
    if (target) {
      setSaveSuccess(`Foto "${target.title}" berhasil dihapus dari galeri.`);
    }
  };

  const handleRestoreMissingDefaults = async () => {
    const existingIds = new Set(draft.customGallery.map((g) => g.id));
    const missing = DEFAULT_GALLERY_ITEMS.filter((d) => !existingIds.has(d.id));
    if (missing.length === 0) {
      const unhiddenConfig: SiteProfileConfig = {
        ...draft,
        customGallery: draft.customGallery.map((g) => ({ ...g, hidden: false })),
        galleryInitialized: true,
      };
      setDraft(unhiddenConfig);
      await handleSaveProfile(unhiddenConfig);
      setSaveSuccess('Seluruh foto galeri ditampilkan kembali.');
      return;
    }
    const nextConfig: SiteProfileConfig = {
      ...draft,
      customGallery: [...missing, ...draft.customGallery],
      galleryInitialized: true,
    };
    setDraft(nextConfig);
    await handleSaveProfile(nextConfig);
    setSaveSuccess(`${missing.length} foto galeri awal berhasil dipulihkan.`);
  };

  return (
    <div className="no-print space-y-6">
      {saveSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-[#CFE0D5] bg-[#F2F7F4] px-4 py-3 text-xs sm:text-sm text-[#0E6245]"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[#F2C6C6] bg-[#FEF6F6] px-4 py-3 text-xs sm:text-sm text-[#991B1B]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 1. Gelombang Aktif & Link Grup WA */}
      <div className="bg-white border border-[#DCE4DE] rounded-xl p-5 sm:p-6 space-y-5">
        <div className="border-b border-[#E6ECE7] pb-3">
          <h2 className="font-display text-lg font-semibold text-[#0F2419]">
            Gelombang Pendaftaran &amp; Undangan Grup WhatsApp
          </h2>
          <p className="text-xs text-[#5A6D62] mt-0.5">
            Atur gelombang SPMB yang sedang aktif dan tautan undangan {draft.waGroupTitle}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cfg-active-wave" className="block text-xs font-semibold text-[#0F2419] mb-1.5">
              Gelombang Pendaftaran Aktif
            </label>
            <select
              id="cfg-active-wave"
              value={draft.activeWave}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  activeWave: e.target.value as GelombangPendaftaran,
                }))
              }
              className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245]"
            >
              {GELOMBANG_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cfg-wa-title" className="block text-xs font-semibold text-[#0F2419] mb-1.5">
              Nama Grup WhatsApp Wali Murid
            </label>
            <input
              id="cfg-wa-title"
              type="text"
              value={draft.waGroupTitle}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, waGroupTitle: e.target.value }))
              }
              className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cfg-wa-url" className="block text-xs font-semibold text-[#0F2419] mb-1.5">
              Tautan Undangan Grup WA (https://chat.whatsapp.com/...)
            </label>
            <input
              id="cfg-wa-url"
              type="url"
              value={draft.waGroupUrl}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, waGroupUrl: e.target.value }))
              }
              placeholder="https://chat.whatsapp.com/..."
              className="w-full min-h-[44px] px-3.5 py-2 text-sm font-mono text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cfg-wave-note" className="block text-xs font-semibold text-[#0F2419] mb-1.5">
              Catatan Jadwal Gelombang (ditampilkan di halaman depan)
            </label>
            <input
              id="cfg-wave-note"
              type="text"
              value={draft.waveInfoNote}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, waveInfoNote: e.target.value }))
              }
              className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg focus:outline-none focus:border-[#0E6245]"
            />
          </div>
        </div>
      </div>

      {/* 2. Program & Fokus Pendidikan */}
      <div className="bg-white border border-[#DCE4DE] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6ECE7] pb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0F2419]">
              Fokus Pendidikan &amp; Program Sekolah
            </h2>
            <p className="text-xs text-[#5A6D62]">
              Daftar poin program utama yang tampil pada bagian Profil Sekolah.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              addListItem('programs', {
                id: `prog-${Date.now()}`,
                title: '',
                description: '',
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg hover:bg-[#E4EFE8] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Program</span>
          </button>
        </div>

        <div className="space-y-3">
          {draft.programs.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded-lg border border-[#E6ECE7] bg-[#FAFBF9] space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-[#0E6245]">
                  Program #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeListItem('programs', idx)}
                  className="inline-flex items-center gap-1 text-xs text-[#B91C1C] hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateListItem('programs', idx, { title: e.target.value })}
                placeholder="Judul program..."
                className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#CCD6CE] rounded-lg"
              />
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) =>
                  updateListItem('programs', idx, { description: e.target.value })
                }
                placeholder="Deskripsi singkat program..."
                className="w-full px-3 py-2 text-sm bg-white border border-[#CCD6CE] rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Ekstrakurikuler */}
      <div className="bg-white border border-[#DCE4DE] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6ECE7] pb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0F2419]">
              Ekstrakurikuler Sekolah
            </h2>
            <p className="text-xs text-[#5A6D62]">
              Daftar kegiatan ekstrakurikuler yang tersedia bagi peserta didik.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              addListItem('extracurriculars', {
                id: `eks-${Date.now()}`,
                title: '',
                subtitle: 'Minat & Bakat',
                description: '',
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg hover:bg-[#E4EFE8] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Ekstrakurikuler</span>
          </button>
        </div>

        <div className="space-y-3">
          {draft.extracurriculars.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded-lg border border-[#E6ECE7] bg-[#FAFBF9] space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-[#0E6245]">
                  Ekstrakurikuler #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeListItem('extracurriculars', idx)}
                  className="inline-flex items-center gap-1 text-xs text-[#B91C1C] hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) =>
                    updateListItem('extracurriculars', idx, { title: e.target.value })
                  }
                  placeholder="Nama ekstrakurikuler..."
                  className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#CCD6CE] rounded-lg"
                />
                <input
                  type="text"
                  value={item.subtitle || ''}
                  onChange={(e) =>
                    updateListItem('extracurriculars', idx, { subtitle: e.target.value })
                  }
                  placeholder="Kategori (mis. Minat & Bakat)"
                  className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#CCD6CE] rounded-lg"
                />
              </div>
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) =>
                  updateListItem('extracurriculars', idx, { description: e.target.value })
                }
                placeholder="Penjelasan kegiatan..."
                className="w-full px-3 py-2 text-sm bg-white border border-[#CCD6CE] rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Prestasi Siswa & Berita Sekolah */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prestasi */}
        <div className="bg-white border border-[#DCE4DE] rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[#E6ECE7] pb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-[#0F2419]">
                Prestasi Siswa
              </h2>
              <p className="text-xs text-[#5A6D62]">
                Tampil di halaman portal bila diisi.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                addListItem('achievements', {
                  id: `pres-${Date.now()}`,
                  title: '',
                  subtitle: 'Tingkat Kecamatan / Kabupaten',
                  date: String(new Date().getFullYear()),
                  description: '',
                })
              }
              className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg hover:bg-[#E4EFE8] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {draft.achievements.length === 0 ? (
            <p className="text-xs text-[#64746B] py-4 text-center border border-dashed border-[#DCE4DE] rounded-lg">
              Belum ada data prestasi ditambahkan. Klik &ldquo;Tambah&rdquo; untuk menampilkan prestasi siswa terbaru.
            </p>
          ) : (
            <div className="space-y-3">
              {draft.achievements.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-[#E6ECE7] bg-[#FAFBF9] space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#0E6245]">
                      Prestasi #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeListItem('achievements', idx)}
                      className="text-xs text-[#B91C1C] hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      updateListItem('achievements', idx, { title: e.target.value })
                    }
                    placeholder="Judul prestasi (mis. Juara 1 MHQ...)"
                    className="w-full min-h-[38px] px-3 py-1.5 text-sm bg-white border border-[#CCD6CE] rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={item.subtitle || ''}
                      onChange={(e) =>
                        updateListItem('achievements', idx, { subtitle: e.target.value })
                      }
                      placeholder="Tingkat"
                      className="w-full min-h-[38px] px-3 py-1.5 text-xs bg-white border border-[#CCD6CE] rounded-lg"
                    />
                    <input
                      type="text"
                      value={item.date || ''}
                      onChange={(e) =>
                        updateListItem('achievements', idx, { date: e.target.value })
                      }
                      placeholder="Tahun / Tanggal"
                      className="w-full min-h-[38px] px-3 py-1.5 text-xs bg-white border border-[#CCD6CE] rounded-lg"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) =>
                      updateListItem('achievements', idx, { description: e.target.value })
                    }
                    placeholder="Keterangan singkat..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#CCD6CE] rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Berita & Pengumuman Sekolah */}
        <div className="bg-white border border-[#DCE4DE] rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[#E6ECE7] pb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-[#0F2419]">
                Berita &amp; Pengumuman Sekolah
              </h2>
              <p className="text-xs text-[#5A6D62]">
                Tampil di halaman portal bila diisi.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                addListItem('news', {
                  id: `news-${Date.now()}`,
                  title: '',
                  date: new Date().toISOString().slice(0, 10),
                  description: '',
                })
              }
              className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg hover:bg-[#E4EFE8] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {draft.news.length === 0 ? (
            <p className="text-xs text-[#64746B] py-4 text-center border border-dashed border-[#DCE4DE] rounded-lg">
              Belum ada berita atau pengumuman tambahan. Klik &ldquo;Tambah&rdquo; untuk menerbitkan kabar sekolah.
            </p>
          ) : (
            <div className="space-y-3">
              {draft.news.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-[#E6ECE7] bg-[#FAFBF9] space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#0E6245]">
                      Berita #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeListItem('news', idx)}
                      className="text-xs text-[#B91C1C] hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      updateListItem('news', idx, { title: e.target.value })
                    }
                    placeholder="Judul berita / pengumuman..."
                    className="w-full min-h-[38px] px-3 py-1.5 text-sm bg-white border border-[#CCD6CE] rounded-lg"
                  />
                  <input
                    type="date"
                    value={item.date || ''}
                    onChange={(e) =>
                      updateListItem('news', idx, { date: e.target.value })
                    }
                    className="w-full min-h-[38px] px-3 py-1.5 text-xs bg-white border border-[#CCD6CE] rounded-lg"
                  />
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) =>
                      updateListItem('news', idx, { description: e.target.value })
                    }
                    placeholder="Isi ringkas berita atau pengumuman..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#CCD6CE] rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Kelola Seluruh Galeri Kegiatan (6 Foto Awal + Foto Tambahan) */}
      <div className="bg-white border border-[#DCE4DE] rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E6ECE7] pb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0F2419]">
              Kelola Galeri Dokumentasi Sekolah
            </h2>
            <p className="text-xs text-[#5A6D62] mt-0.5">
              Edit judul &amp; keterangan, ganti foto, sembunyikan sementara, hapus, atau tambahkan foto baru untuk seluruh galeri di halaman utama.
            </p>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleRestoreMissingDefaults}
            className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-lg hover:bg-[#E4EFE8] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Pulihkan / Tampilkan Foto Awal</span>
          </button>
        </div>

        {/* Form Tambah Foto Baru */}
        <div className="p-4 rounded-lg border border-[#DCE4DE] bg-[#F7FAF8] space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#0E6245]">
            Tambah Foto Kegiatan Baru
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={galTitle}
              onChange={(e) => setGalTitle(e.target.value)}
              placeholder="Judul foto kegiatan *"
              className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#CCD6CE] rounded-lg"
            />
            <input
              type="text"
              value={galCategory}
              onChange={(e) => setGalCategory(e.target.value)}
              placeholder="Kategori (mis. Ibadah & Adab)"
              className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#CCD6CE] rounded-lg"
            />
            <input
              type="text"
              value={galContext}
              onChange={(e) => setGalContext(e.target.value)}
              placeholder="Konteks (mis. Kelas 1 / P5)"
              className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-[#CCD6CE] rounded-lg"
            />
          </div>

          <textarea
            rows={2}
            value={galCaption}
            onChange={(e) => setGalCaption(e.target.value)}
            placeholder="Keterangan / deskripsi singkat kegiatan..."
            className="w-full px-3 py-2 text-sm bg-white border border-[#CCD6CE] rounded-lg"
          />

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              ref={galFileInputRef}
              id="admin-gallery-upload"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleSelectGalleryFile}
              className="sr-only"
            />
            <label
              htmlFor="admin-gallery-upload"
              className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#EFF3F0] cursor-pointer whitespace-nowrap shrink-0"
            >
              <ImagePlus className="w-4 h-4 text-[#0E6245]" />
              <span>
                {galPendingFile ? galPendingFile.fileName : 'Pilih Foto dari Perangkat'}
              </span>
            </label>

            <span className="text-xs text-[#5A6D62] text-center">atau</span>

            <input
              type="url"
              value={galUrl}
              onChange={(e) => setGalUrl(e.target.value)}
              placeholder="Tempel URL gambar (opsional jika sudah pilih file)"
              className="flex-1 min-h-[40px] px-3 py-2 text-xs font-mono bg-white border border-[#CCD6CE] rounded-lg"
            />

            <button
              type="button"
              disabled={isAddingGallery}
              onClick={handleAddGalleryItem}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isAddingGallery ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Unggah &amp; Tambahkan Foto</span>
            </button>
          </div>
        </div>

        {/* Daftar Seluruh Foto Galeri (6 Foto Awal + Tambahan) */}
        {draft.customGallery.length === 0 ? (
          <p className="text-xs text-[#64746B] py-6 text-center border border-dashed border-[#DCE4DE] rounded-lg">
            Belum ada foto di galeri. Tambahkan foto baru di atas atau klik &ldquo;Pulihkan / Tampilkan Foto Awal&rdquo;.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {draft.customGallery.map((g, idx) => {
              const isEditing = editingGalId === g.id;
              const isConfirmDelete = confirmDeleteGalId === g.id;
              const previewSrc =
                isEditing && editGalPendingFile
                  ? `data:${editGalPendingFile.mimeType};base64,${editGalPendingFile.base64}`
                  : isEditing && editGalUrl.trim()
                    ? editGalUrl.trim()
                    : resolveGalleryImageSrc(g);

              return (
                <div
                  key={g.id}
                  className={`border rounded-xl overflow-hidden bg-white flex flex-col transition-opacity ${
                    g.hidden
                      ? 'border-[#E6ECE7] bg-[#FAFBF9]'
                      : 'border-[#DCE4DE]'
                  }`}
                >
                  <div className="relative aspect-[16/10] bg-[#E8EFEA] overflow-hidden">
                    <img
                      src={previewSrc}
                      alt={g.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover ${
                        g.hidden && !isEditing ? 'opacity-45 grayscale-[35%]' : ''
                      }`}
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-white/95 text-[#0F2419] rounded border border-[#DCE4DE]">
                        #{idx + 1}
                      </span>
                      {g.hidden ? (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] rounded border border-[#F59E0B]/40">
                          Disembunyikan
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#EBF5EF] text-[#0E6245] rounded border border-[#B9DEC7]">
                          Tampil di Portal
                        </span>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="p-4 space-y-3 bg-[#FAFBF9] flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0E6245]">
                          Edit Galeri #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={cancelEditGalleryItem}
                          className="text-xs text-[#5A6D62] hover:text-[#0F2419] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Batal</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        value={editGalTitle}
                        onChange={(e) => setEditGalTitle(e.target.value)}
                        placeholder="Judul kegiatan *"
                        className="w-full min-h-[38px] px-3 py-1.5 text-sm font-medium bg-white border border-[#CCD6CE] rounded-lg"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editGalCategory}
                          onChange={(e) => setEditGalCategory(e.target.value)}
                          placeholder="Kategori"
                          className="w-full min-h-[38px] px-3 py-1.5 text-xs bg-white border border-[#CCD6CE] rounded-lg"
                        />
                        <input
                          type="text"
                          value={editGalContext}
                          onChange={(e) => setEditGalContext(e.target.value)}
                          placeholder="Konteks / Kelas"
                          className="w-full min-h-[38px] px-3 py-1.5 text-xs bg-white border border-[#CCD6CE] rounded-lg"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={editGalCaption}
                        onChange={(e) => setEditGalCaption(e.target.value)}
                        placeholder="Keterangan / deskripsi..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-[#CCD6CE] rounded-lg"
                      />

                      <div className="space-y-2 pt-1 border-t border-[#E6ECE7]">
                        <div className="text-[11px] font-semibold text-[#1D3126]">
                          Ganti Foto (opsional — biarkan kosong jika tetap pakai foto ini)
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            ref={editGalFileInputRef}
                            id={`edit-gal-file-${g.id}`}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            onChange={handleSelectEditGalleryFile}
                            className="sr-only"
                          />
                          <label
                            htmlFor={`edit-gal-file-${g.id}`}
                            className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#EFF3F0] cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <ImagePlus className="w-3.5 h-3.5 text-[#0E6245]" />
                            <span className="truncate max-w-[160px]">
                              {editGalPendingFile
                                ? editGalPendingFile.fileName
                                : 'Pilih Foto Baru'}
                            </span>
                          </label>
                          <input
                            type="url"
                            value={editGalUrl}
                            onChange={(e) => {
                              setEditGalUrl(e.target.value);
                              setEditGalPendingFile(null);
                            }}
                            placeholder="atau tempel URL foto baru"
                            className="flex-1 min-h-[36px] px-2.5 py-1.5 text-xs font-mono bg-white border border-[#CCD6CE] rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={cancelEditGalleryItem}
                          disabled={isSavingEditGal}
                          className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-lg hover:bg-[#EFF3F0] cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isSavingEditGal}
                          onClick={() => handleSaveEditGalleryItem(g)}
                          className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] disabled:opacity-60 cursor-pointer"
                        >
                          {isSavingEditGal ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          <span>Simpan Perubahan</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-[#0E6245]">
                          {g.category} · {g.context}
                        </div>
                        <div className="text-sm font-semibold text-[#0F2419]">{g.title}</div>
                        <p className="text-xs text-[#4A5D52] leading-relaxed line-clamp-3">
                          {g.caption}
                        </p>
                      </div>

                      {isConfirmDelete ? (
                        <div className="pt-2 border-t border-[#E6ECE7] flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-[#991B1B]">
                            Hapus foto ini permanen?
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteGalId(null)}
                              className="px-2.5 py-1 text-xs font-semibold text-[#0F2419] bg-white border border-[#CCD6CE] rounded-md cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleRemoveGalleryItem(g.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-[#B91C1C] rounded-md hover:bg-[#991B1B] cursor-pointer"
                            >
                              Ya, Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-[#E6ECE7] flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditGalleryItem(g)}
                            className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 text-xs font-semibold text-[#0E6245] bg-[#F2F7F4] border border-[#CFE0D5] rounded-md hover:bg-[#E4EFE8] cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit / Ganti Foto</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleToggleHideGalleryItem(g)}
                            className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 text-xs font-semibold text-[#1D3126] bg-white border border-[#CCD6CE] rounded-md hover:bg-[#F2F6F3] cursor-pointer"
                          >
                            {g.hidden ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Tampilkan</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Sembunyikan</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteGalId(g.id)}
                            className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 text-xs font-semibold text-[#B91C1C] bg-white border border-[#EBCACA] rounded-md hover:bg-[#FEF6F6] cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tombol Simpan Utama */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleSaveProfile(draft)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-2.5 text-sm font-semibold text-white bg-[#0E6245] rounded-lg hover:bg-[#0B4F37] disabled:opacity-60 cursor-pointer"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Profil Sekolah'}</span>
        </button>
      </div>
    </div>
  );
}
