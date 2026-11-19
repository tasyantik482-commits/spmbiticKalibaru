import type { AdminApplicantRecord } from '../types/spmb';

export type CsvExportMode = 'excel_id' | 'standard_upload';

function cleanText(val: unknown): string {
  const raw = String(val ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return raw === '-' ? '' : raw;
}

function cleanDigits(val: unknown): string {
  return cleanText(val)
    .replace(/^'+/, '')
    .replace(/[\s.-]/g, '');
}

function formatGenderDapodik(val: unknown): string {
  const lower = cleanText(val).toLowerCase();
  if (!lower) return '';
  if (lower === 'l' || lower.startsWith('laki')) return 'L';
  if (lower === 'p' || lower.startsWith('perempuan')) return 'P';
  return cleanText(val);
}

function formatDateYmd(val: unknown): string {
  const raw = cleanText(val);
  if (!raw) return '';
  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch && !raw.includes('T')) {
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  return year && month && day ? `${year}-${month}-${day}` : raw;
}

function splitRtRw(val: unknown): { rt: string; rw: string } {
  const raw = cleanText(val);
  if (!raw) return { rt: '', rw: '' };
  const matches = raw.match(/\d+/g);
  if (!matches || matches.length === 0) return { rt: '', rw: '' };
  const padPart = (num: string) => num.padStart(3, '0');
  const rt = padPart(matches[0]);
  const rw = matches[1] ? padPart(matches[1]) : '';
  return { rt, rw };
}

export const DAPODIK_HEADERS = [
  'No',
  'Nomor Pendaftaran',
  'Gelombang',
  'Status Verifikasi',
  'Nama Lengkap',
  'Nama Panggilan',
  'Jenis Kelamin (L/P)',
  'NIK',
  'Tempat Lahir',
  'Tanggal Lahir (YYYY-MM-DD)',
  'Agama',
  'Berkebutuhan Khusus',
  'Alamat Jalan',
  'RT',
  'RW',
  'Desa/Kelurahan',
  'Kecamatan',
  'Kabupaten/Kota',
  'Provinsi',
  'Tempat Tinggal',
  'Anak Ke-',
  'Jumlah Saudara Kandung',
  'Status Anak',
  'Tinggi Badan (cm)',
  'Berat Badan (kg)',
  'Lingkar Kepala (cm)',
  'Golongan Darah',
  'Hobi',
  'Cita-cita',
  'Asal TK/PAUD',
  'Alamat TK/PAUD',
  'No. HP/WhatsApp',
  'Email',
  'Nama Ayah',
  'NIK Ayah',
  'Pendidikan Ayah',
  'Pekerjaan Ayah',
  'Penghasilan Ayah',
  'Nama Ibu',
  'NIK Ibu',
  'Pendidikan Ibu',
  'Pekerjaan Ibu',
  'Penghasilan Ibu',
  'Nama Wali',
  'Pendidikan Wali',
  'Pekerjaan Wali',
  'Penghasilan Wali',
  'Kepemilikan Rumah',
  'Jumlah Kendaraan',
  'Tanggal Daftar (YYYY-MM-DD)',
  'Metode Pembayaran',
  'Tanggal Pembayaran',
  'Nominal Pembayaran',
  'Nama Pengirim Pembayaran',
  'Tanggal Observasi',
  'Waktu Observasi',
  'Catatan Sekolah',
  'Catatan Panitia',
  'Link KK',
  'Link Akta Kelahiran',
  'Link Pas Foto 3x4',
  'Link KTP Ortu/Wali',
  'Link Bukti Pembayaran',
];

// Indeks kolom teks angka panjang: NIK, RT, RW, No. HP, NIK Ayah, NIK Ibu
const LONG_NUMERIC_COLUMNS = new Set([7, 13, 14, 31, 34, 39]);

// Indeks kolom angka murni untuk sheet Excel
const PURE_INTEGER_COLUMNS = new Set([0, 20, 21, 23, 24, 25, 52]);

function prepareSortedDapodikRows(records: AdminApplicantRecord[]): string[][] {
  const sorted = [...records].sort((a, b) =>
    (a.noPendaftaran || '').localeCompare(b.noPendaftaran || '', 'id', {
      numeric: true,
    })
  );

  return sorted.map((r, index) => {
    const { rt, rw } = splitRtRw(r.rtRw);
    return [
      String(index + 1),
      cleanText(r.noPendaftaran),
      cleanText(r.gelombang || 'Gelombang 1'),
      cleanText(r.statusVerifikasi),
      cleanText(r.namaCalonMurid),
      cleanText(r.namaPanggilan),
      formatGenderDapodik(r.jenisKelamin),
      cleanDigits(r.nikCalonMurid),
      cleanText(r.tempatLahir),
      formatDateYmd(r.tanggalLahir),
      cleanText(r.agama),
      cleanText(r.berkebutuhanKhusus),
      cleanText(r.alamatSaatIni),
      rt,
      rw,
      cleanText(r.desaKelurahan),
      cleanText(r.kecamatan),
      cleanText(r.kabupatenKota),
      cleanText(r.provinsi),
      cleanText(r.tinggalDengan),
      r.anakKe ? String(r.anakKe) : '',
      r.jumlahSaudara !== undefined && r.jumlahSaudara !== null
        ? String(r.jumlahSaudara)
        : '',
      cleanText(r.statusAnak),
      r.tinggiBadan ? String(r.tinggiBadan) : '',
      r.beratBadan ? String(r.beratBadan) : '',
      r.lingkarKepala ? String(r.lingkarKepala) : '',
      cleanText(r.golonganDarah),
      cleanText(r.hobi),
      cleanText(r.citaCita),
      cleanText(r.asalTkPaud),
      cleanText(r.alamatSekolahAsal),
      cleanDigits(r.noTelepon),
      cleanText(r.email),
      cleanText(r.namaAyah),
      cleanDigits(r.nikAyah),
      cleanText(r.pendidikanAyah),
      cleanText(r.pekerjaanAyah),
      cleanText(r.penghasilanAyah),
      cleanText(r.namaIbu),
      cleanDigits(r.nikIbu),
      cleanText(r.pendidikanIbu),
      cleanText(r.pekerjaanIbu),
      cleanText(r.penghasilanIbu),
      cleanText(r.namaWali),
      cleanText(r.pendidikanWali),
      cleanText(r.pekerjaanWali),
      cleanText(r.penghasilanWali),
      cleanText(r.statusKepemilikan),
      cleanText(r.jumlahKendaraan),
      formatDateYmd(r.waktuDaftar),
      cleanText(r.metodePembayaran),
      formatDateYmd(r.tanggalPembayaran),
      r.nominalPembayaran ? String(r.nominalPembayaran) : '',
      cleanText(r.namaPengirimPembayaran),
      formatDateYmd(r.tanggalObservasi),
      cleanText(r.waktuObservasi),
      cleanText(r.catatanSekolah),
      cleanText(r.catatanPanitia),
      cleanText(r.urlKartuKeluarga),
      cleanText(r.urlAktaKelahiran),
      cleanText(r.urlPasFoto),
      cleanText(r.urlKtpOrangTua),
      cleanText(r.urlBuktiPembayaran),
    ];
  });
}

function formatExcelSafeCell(
  val: string,
  isLongNumericText: boolean,
  mode: CsvExportMode
): string {
  if (!val) return '""';
  if (mode === 'excel_id' && isLongNumericText) {
    return `"=""${val.replace(/"/g, '""')}"""`;
  }
  return `"${val.replace(/"/g, '""')}"`;
}

export function buildDapodikCsvContent(
  records: AdminApplicantRecord[],
  mode: CsvExportMode
): string {
  const delimiter = mode === 'excel_id' ? ';' : ',';
  const rows = prepareSortedDapodikRows(records);

  const headerLine = DAPODIK_HEADERS.map(
    (h) => `"${h.replace(/"/g, '""')}"`
  ).join(delimiter);

  const dataLines = rows.map((cells) =>
    cells
      .map((val, colIdx) =>
        formatExcelSafeCell(val, LONG_NUMERIC_COLUMNS.has(colIdx), mode)
      )
      .join(delimiter)
  );

  return '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
}

export async function downloadDapodikExcelXlsx(
  records: AdminApplicantRecord[]
): Promise<void> {
  const XLSX = await import('xlsx');
  const rows = prepareSortedDapodikRows(records);

  const typedRows: Array<Array<string | number>> = rows.map((cells) =>
    cells.map((val, colIdx) => {
      if (PURE_INTEGER_COLUMNS.has(colIdx) && val !== '' && !Number.isNaN(Number(val))) {
        return Number(val);
      }
      return val;
    })
  );

  const sheetData: Array<Array<string | number>> = [
    DAPODIK_HEADERS,
    ...typedRows,
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Pastikan seluruh sel NIK, No. HP, RT, RW bertipe string ('s') agar tidak pernah jadi 3.51E+15
  for (let r = 1; r <= rows.length; r++) {
    LONG_NUMERIC_COLUMNS.forEach((colIdx) => {
      const addr = XLSX.utils.encode_cell({ r, c: colIdx });
      const cell = worksheet[addr];
      if (cell && cell.v !== '') {
        cell.t = 's';
        cell.v = String(cell.v);
        cell.z = '@';
      }
    });
  }

  // Hitung lebar kolom otomatis agar rapi langsung saat dibuka
  worksheet['!cols'] = DAPODIK_HEADERS.map((header, colIdx) => {
    let maxLen = header.length;
    for (let i = 0; i < rows.length; i++) {
      const cellLen = (rows[i][colIdx] || '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    const capped = Math.min(Math.max(maxLen + 3, 10), 42);
    return { wch: capped };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Dapodik SPMB');

  const fileName = `data-dapodik-spmb-sditic-${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
