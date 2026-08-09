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
