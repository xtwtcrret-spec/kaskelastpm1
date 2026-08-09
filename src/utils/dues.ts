import { Member, Transaction } from '../types';

/** Cari memberId dari sebuah transaksi (langsung dari field, atau dicocokkan dari nama contributor). */
export function resolveTransactionMemberId(t: Transaction, members: Member[]): string | undefined {
  if (t.memberId) return t.memberId;
  const found = members.find(
    (m) => m.name.toLowerCase().trim() === t.contributor.toLowerCase().trim()
  );
  return found?.id;
}

/** Cari bulan (format YYYY-MM) yang dituju sebuah transaksi, dari field forMonth atau dari teks deskripsi. */
export function resolveTransactionMonth(t: Transaction): string | undefined {
  if (t.forMonth) return t.forMonth;
  const match = t.description.match(/Bulan\s+(\d{4}-\d{2})/i);
  return match ? match[1] : undefined;
}

/** Total yang sudah dibayar seorang siswa untuk bulan tertentu (transaksi pemasukan yang sudah diverifikasi). */
export function getMemberMonthPaidTotal(
  memberId: string,
  monthKey: string,
  transactions: Transaction[],
  members: Member[]
): number {
  return transactions
    .filter(
      (t) =>
        t.type === 'pemasukan' &&
        t.verified &&
        resolveTransactionMemberId(t, members) === memberId &&
        resolveTransactionMonth(t) === monthKey
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Total seluruh kontribusi (semua bulan) seorang siswa yang sudah terverifikasi. */
export function getMemberTotalContribution(
  memberId: string,
  transactions: Transaction[],
  members: Member[]
): number {
  return transactions
    .filter(
      (t) =>
        t.type === 'pemasukan' &&
        t.verified &&
        resolveTransactionMemberId(t, members) === memberId
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

/** Urutan bulan kas dalam 1 tahun berjalan, dipakai untuk hitung carry-over kelebihan bayar. */
export const YEAR_MONTHS_ORDER: string[] = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
  '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12',
];

export interface MonthLedgerEntry {
  monthKey: string;
  directPaid: number;   // uang yang memang ditransaksikan untuk bulan ini
  carryIn: number;       // kelebihan bayar dari bulan sebelumnya yang dipakai buat nutup bulan ini
  totalAvailable: number; // directPaid + carryIn
  isPaid: boolean;
  remaining: number;     // sisa kurang kalau belum lunas
  carryOut: number;      // kelebihan yang diteruskan ke bulan berikutnya
}

/**
 * Hitung status lunas per bulan untuk 1 siswa, DENGAN memperhitungkan kelebihan bayar
 * yang otomatis "nyicil" ke bulan-bulan berikutnya.
 * Contoh: standar iuran Rp 8.000/bulan, siswa bayar Rp 16.000 di bulan Agustus (terverifikasi)
 * -> Agustus otomatis Lunas, sisa Rp 8.000 diteruskan (carry) ke September -> September ikut Lunas.
 */
export function computeMemberDuesLedger(
  memberId: string,
  transactions: Transaction[],
  members: Member[],
  monthlyDuesStandard: number,
  monthsOrder: string[] = YEAR_MONTHS_ORDER
): { paidMonths: string[]; detail: Record<string, MonthLedgerEntry> } {
  const paidMonths: string[] = [];
  const detail: Record<string, MonthLedgerEntry> = {};
  let carry = 0;

  for (const monthKey of monthsOrder) {
    const directPaid = transactions
      .filter(
        (t) =>
          t.type === 'pemasukan' &&
          t.verified &&
          resolveTransactionMemberId(t, members) === memberId &&
          resolveTransactionMonth(t) === monthKey
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const carryIn = carry;
    const totalAvailable = directPaid + carryIn;
    const isPaid = totalAvailable >= monthlyDuesStandard;
    const carryOut = isPaid ? totalAvailable - monthlyDuesStandard : 0;
    const remaining = isPaid ? 0 : Math.max(monthlyDuesStandard - totalAvailable, 0);

    detail[monthKey] = { monthKey, directPaid, carryIn, totalAvailable, isPaid, remaining, carryOut };
    if (isPaid) paidMonths.push(monthKey);

    // Kalau belum lunas bulan ini, kelebihan TIDAK ada yang diteruskan (belum ada kelebihan).
    // Kalau lunas, sisa (carryOut) diteruskan buat bantu nutup bulan berikutnya.
    carry = carryOut;
  }

  return { paidMonths, detail };
}


/** Semua transaksi (apapun statusnya) yang terkait seorang siswa, terbaru dulu. */
export function getMemberTransactions(
  memberId: string,
  transactions: Transaction[],
  members: Member[]
): Transaction[] {
  return transactions
    .filter((t) => resolveTransactionMemberId(t, members) === memberId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
