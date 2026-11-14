# Panduan Integrasi Google Apps Script, GitHub & Vercel
**Portal SPMB SDIT Insan Cendekia (SD ITIC) Kalibaru**

---

## 1. Setup Google Apps Script & Google Spreadsheet

1. Buka Google Spreadsheet Anda:
   `https://docs.google.com/spreadsheets/d/1b9aQUoVH1PSunV63VvaoMUt2S38DlSgYgc--CpqAhsw/edit`
2. Pada menu Spreadsheet, klik **Ekstensi (Extensions)** > **Apps Script**.
3. Hapus isi default di editor `Code.gs`, lalu salin seluruh isi file `google-apps-script/Code.gs` ke dalamnya dan tekan **Simpan (Ctrl+S)**.
4. Di dropdown fungsi bagian atas editor Apps Script, pilih **`setupSpreadsheet`** lalu klik **Jalankan (Run)**.
   - Saat diminta izin (*Authorization required*), klik **Review Permissions** > pilih akun Google Anda > **Advanced** > **Go to ... (unsafe)** > **Allow**.
   - Langkah ini otomatis membuat tab `Pendaftar_SPMB` beserta header kolom berformat dan folder Google Drive `Berkas_SPMB_SDIT_IC_Kalibaru`.
5. Klik tombol **Terapkan (Deploy)** > **Deployment baru (New deployment)**:
   - Pilih jenis: **Aplikasi web (Web app)**.
   - Deskripsi: `SPMB SDIT IC Kalibaru v1`.
   - Jalankan sebagai (*Execute as*): **Saya (Me)**.
   - Yang memiliki akses (*Who has access*): **Siapa saja (Anyone)**.
   - Klik **Terapkan (Deploy)** dan salin **URL Aplikasi Web** yang berakhiran `/exec`.

---

## 2. Upload Kode ke GitHub

1. Buat repository baru di GitHub (misal: `spmb-sdit-ic-kalibaru`).
2. Pastikan file `.env` lokal tidak ikut ter-commit (`.gitignore` sudah mengabaikannya).
3. Jalankan perintah git dari folder proyek:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Portal SPMB SDIT Insan Cendekia Kalibaru"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/spmb-sdit-ic-kalibaru.git
   git push -u origin main
   ```

---

## 3. Deploy & Koneksikan di Vercel

1. Masuk ke [vercel.com](https://vercel.com) menggunakan akun GitHub Anda.
2. Klik **Add New...** > **Project** > pilih repository `spmb-sdit-ic-kalibaru`.
3. Pada bagian **Build & Output Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Buka bagian **Environment Variables**, tambahkan variabel berikut:
   - **Key:** `VITE_APPS_SCRIPT_URL`
   - **Value:** *(tempel URL Web App Apps Script yang berakhiran `/exec` dari langkah 1)*
   - **Key:** `VITE_SPREADSHEET_ID`
   - **Value:** `1b9aQUoVH1PSunV63VvaoMUt2S38DlSgYgc--CpqAhsw`
5. Klik **Deploy**. Setelah proses build selesai, website SPMB SDIT Insan Cendekia Kalibaru langsung aktif dan terhubung ke Google Spreadsheet + Google Drive.

---

## 4. Cara Mengubah Status Pendaftar (Untuk Panitia)

Panitia cukup membuka tab `Pendaftar_SPMB` di Google Spreadsheet:
- Ubah kolom **Status Verifikasi** (misal: `Menunggu Verifikasi`, `Berkas Lengkap`, `Jadwal Observasi`, `Diterima`, atau `Perlu Perbaikan`).
- Isi kolom **Catatan Panitia** (misal jadwal observasi atau catatan berkas).
- Orang tua/wali yang mengecek melalui menu **Cek Status** di website akan langsung melihat pembaruan tersebut secara real-time.

---

## 5. Mengatasi Error `Access denied: DriveApp`

Jika muncul pesan `Access denied: DriveApp` saat mengirim formulir:
1. **Pastikan sudah menjalankan `setupSpreadsheet` di editor Apps Script** dan menekan **Allow / Izinkan** untuk izin Google Drive & Spreadsheet (setiap kali kode `Code.gs` diubah, simpan lalu buat **Versi Baru** di **Terapkan > Kelola deployment > Edit (ikon pensil) > Versi: Versi baru**).
2. **Periksa setelan "Jalankan sebagai" (`Execute as`)**: wajib dipilih **Saya (`Me`)**, bukan *Pengguna yang mengakses aplikasi web*.
3. **Jika memakai akun Google Workspace / `@*.belajar.id`**: beberapa domain `belajar.id` membatasi akses `DriveApp` atau berbagi tautan publik dari Web App eksternal. Solusinya:
   - Bagikan Spreadsheet ke akun Gmail sekolah biasa (misal `sditic08@gmail.com`) dengan akses **Editor**, lalu
   - Buka Spreadsheet menggunakan akun Gmail tersebut, tempel `Code.gs`, jalankan `setupSpreadsheet`, dan **Deploy** Web App dari akun Gmail tersebut (lalu perbarui `VITE_APPS_SCRIPT_URL` di Vercel).

