import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Transaction, TransactionType } from '../types';
import { formatRupiah, formatDateIndonesian, exportToCSV } from '../utils/formatters';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Printer,
  Sparkles,
  Lock,
  CreditCard,
  Clock,
  ShieldCheck,
  Share2
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onOpenStudentPay?: () => void;
  onOpenAddTx: () => void;
  onOpenSmartNote: () => void;
  onSelectReceipt: (tx: Transaction) => void;
  onEditTx: (tx: Transaction) => void;
  onDeleteTx: (id: string) => void;
  onToggleVerify: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  isAdmin = false,
  onOpenAdminLogin,
  onOpenStudentPay,
  onOpenAddTx,
  onOpenSmartNote,
  onSelectReceipt,
  onEditTx,
  onDeleteTx,
  onToggleVerify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'semua' | TransactionType>('semua');
  const [categoryFilter, setCategoryFilter] = useState('semua');
  const [paymentFilter, setPaymentFilter] = useState('semua');
  const [verifyFilter, setVerifyFilter] = useState<'semua' | 'verified' | 'pending'>('semua');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Available categories for dropdown
  const allCategories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category));
    return Array.from(cats);
  }, [transactions]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch = 
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.contributor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'semua' || t.type === typeFilter;
        const matchesCat = categoryFilter === 'semua' || t.category === categoryFilter;
        const matchesPay = paymentFilter === 'semua' || t.paymentMethod === paymentFilter;
        const matchesVerify = 
          verifyFilter === 'semua' || 
          (verifyFilter === 'verified' && t.verified) || 
          (verifyFilter === 'pending' && !t.verified);

        return matchesSearch && matchesType && matchesCat && matchesPay && matchesVerify;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'highest') return b.amount - a.amount;
        return 0;
      });
  }, [transactions, searchTerm, typeFilter, categoryFilter, paymentFilter, verifyFilter, sortBy]);

  // Reset ke halaman 1 setiap kali filter/pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, categoryFilter, paymentFilter, verifyFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Filter totals
  const filteredVerifiedIncome = filteredTransactions
    .filter((t) => t.type === 'pemasukan' && t.verified)
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredPendingIncome = filteredTransactions
    .filter((t) => t.type === 'pemasukan' && !t.verified)
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredVerifiedExpense = filteredTransactions
    .filter((t) => t.type === 'pengeluaran' && t.verified)
    .reduce((sum, t) => sum + t.amount, 0);

  const handleExportCSV = () => {
    const exportData = filteredTransactions.map((t) => ({
      ID: t.id,
      Tanggal: t.date,
      Tipe: t.type,
      Kategori: t.category,
      Deskripsi: t.description,
      'Penanggung Jawab / Donatur': t.contributor,
      'Nominal (Rp)': t.amount,
      'Metode Pembayaran': t.paymentMethod,
      'Status Verifikasi': t.verified ? 'Terverifikasi' : 'Belum Verifikasi',
    }));
    exportToCSV(`Laporan_KasKita_${new Date().toISOString().split('T')[0]}`, exportData);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const buildWhatsAppShareLink = (tx: Transaction): string => {
    const emoji = tx.type === 'pemasukan' ? '💰' : '📤';
    const label = tx.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    const message =
      `${emoji} *Update Kas 12 TPM 1*\n\n` +
      `${label}: ${tx.description}\n` +
      `Nominal: Rp ${tx.amount.toLocaleString('id-ID')}\n` +
      `Oleh/Penanggung Jawab: ${tx.contributor}\n` +
      `Tanggal: ${formatDateIndonesian(tx.date)}\n` +
      `Status: ${tx.verified ? '✅ Terverifikasi' : '⌛ Menunggu Verifikasi'}\n\n` +
      `_Dikirim otomatis dari Website Kas 12 TPM 1_`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-amber-500/30 shadow-xl metallic-card">
        <div>
          <h2 className="text-xl font-black font-tech uppercase tracking-wide text-white flex items-center gap-2">
            <span>Buku Kas & Log Transaksi 12 TPM 1</span>
          </h2>
          <p className="text-xs text-slate-300">
            Pencatatan riwayat arus kas, pengeluaran alat bengkel, dan setoran iuran terkalibrasi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          {onOpenStudentPay && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenStudentPay}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer border border-emerald-400/30"
            >
              <CreditCard className="w-4 h-4 text-emerald-200" />
              <span>Setor Kas Digital</span>
            </motion.button>
          )}

          {isAdmin ? (
            <>
              <button
                onClick={onOpenSmartNote}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer font-mono-tech"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Smart Paste</span>
              </button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenAddTx}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>+ Catat Transaksi</span>
              </motion.button>
            </>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Login Admin Bendahara</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs font-semibold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 text-xs font-semibold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Anti-Fraud Security Banner */}
      <div className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 metallic-card-amber">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold font-tech uppercase tracking-wide text-white">Sistem Keamanan & Audit Terkalibrasi</h3>
              <span className="text-[10px] font-mono-tech font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Verifikasi Multi-Tahap
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Setoran Pending Tidak Langsung Masuk Total Saldo Kas</strong> — Setiap uang yang disetor siswa wajib diverifikasi oleh Bendahara (Admin). Uang pending diisolasi sehingga saldo resmi kas 100% akurat dan terhindar dari pemalsuan nota/setoran fiktif.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Summary Strip */}
      <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari deskripsi, nama, kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Verification Status Filter */}
          <div>
            <select
              value={verifyFilter}
              onChange={(e) => setVerifyFilter(e.target.value as any)}
              className="w-full text-xs px-3 py-2.5 rounded-2xl border border-white/10 bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="semua">Semua Status Verifikasi</option>
              <option value="pending">⏳ Pending Konfirmasi</option>
              <option value="verified">✓ Sudah Diverifikasi</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full text-xs px-3 py-2.5 rounded-2xl border border-white/10 bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="semua">Semua Tipe Kas</option>
              <option value="pemasukan">Hanya Pemasukan (+)</option>
              <option value="pengeluaran">Hanya Pengeluaran (-)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-2xl border border-white/10 bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="semua">Semua Kategori</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs px-3 py-2.5 rounded-2xl border border-white/10 bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Urutan: Terbaru</option>
              <option value="oldest">Urutan: Terlama</option>
              <option value="highest">Urutan: Nominal Terbesar</option>
            </select>
          </div>

        </div>

        {/* Filter Summary Strip */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between pt-3 border-t border-white/10 text-xs text-slate-400 gap-2">
          <div className="break-words">
            Menampilkan <span className="font-bold text-white">{filteredTransactions.length}</span> dari{' '}
            <span className="font-bold text-white">{transactions.length}</span> total transaksi
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-semibold text-[11px] sm:text-xs">
            <span className="text-emerald-400">
              Pemasukan Terverifikasi: +{formatRupiah(filteredVerifiedIncome)}
            </span>
            {filteredPendingIncome > 0 && (
              <span className="text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                ⌛ Pending: +{formatRupiah(filteredPendingIncome)}
              </span>
            )}
            <span className="text-rose-400">
              Pengeluaran Terverifikasi: -{formatRupiah(filteredVerifiedExpense)}
            </span>
            <span className="text-white font-bold border-l border-white/20 pl-2 sm:pl-3">
              Net Kas Resmi: {formatRupiah(filteredVerifiedIncome - filteredVerifiedExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-white/10 border-b border-white/10 text-slate-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Tipe & Kategori</th>
                <th className="py-3.5 px-4">Deskripsi Transaksi</th>
                <th className="py-3.5 px-4">Penanggung Jawab</th>
                <th className="py-3.5 px-4">Metode</th>
                <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3.5 px-4 text-center">Verifikasi</th>
                <th className="py-3.5 px-4 text-center no-print">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/10 transition">
                    
                    {/* Date */}
                    <td className="py-3.5 px-4 font-medium text-slate-300 whitespace-nowrap">
                      {formatDateIndonesian(tx.date)}
                    </td>

                    {/* Type & Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded-lg border ${
                          tx.type === 'pemasukan' 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {tx.type === 'pemasukan' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        </span>
                        <span className="font-semibold text-white">{tx.category}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-slate-200 font-medium max-w-xs">
                      <p className="line-clamp-2">{tx.description}</p>
                    </td>

                    {/* Contributor */}
                    <td className="py-3.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                      {tx.contributor}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="bg-white/10 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-white/10">
                        {tx.paymentMethod}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className={`text-sm font-bold ${
                        tx.type === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {tx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (isAdmin) {
                            onToggleVerify(tx.id);
                          } else if (onOpenAdminLogin) {
                            onOpenAdminLogin();
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition border shadow-sm ${
                          tx.verified
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                            : isAdmin
                            ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 font-extrabold shadow-amber-500/20 active:scale-95 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                        title={isAdmin ? (tx.verified ? 'Klik untuk batalkan verifikasi' : 'Klik untuk Konfirmasi Pembayaran Setoran Kas') : 'Butuh login Admin untuk mengonfirmasi'}
                      >
                        {tx.verified ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Terverifikasi
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isAdmin ? 'Konfirmasi Setoran' : 'Pending Konfirmasi'}</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectReceipt(tx)}
                          className="p-1.5 text-indigo-400 hover:bg-white/10 rounded-xl transition"
                          title="Cetak/Lihat Kuitansi Official"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        <a
                          href={buildWhatsAppShareLink(tx)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-emerald-400 hover:bg-white/10 rounded-xl transition cursor-pointer inline-flex items-center justify-center"
                          title="Bagikan info transaksi ini ke Grup WhatsApp Kelas"
                        >
                          <Share2 className="w-4 h-4" />
                        </a>

                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => onEditTx(tx)}
                              className="p-1.5 text-slate-300 hover:bg-white/10 rounded-xl transition cursor-pointer"
                              title="Edit Transaksi"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onDeleteTx(tx.id)}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-xl transition cursor-pointer"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={onOpenAdminLogin}
                            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-xl transition cursor-pointer"
                            title="Login Admin untuk edit/hapus"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > ITEMS_PER_PAGE && (
          <div className="no-print flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t border-white/10 flex-wrap">
            <p className="text-[11px] text-slate-500">
              Halaman <span className="text-white font-bold">{currentPage}</span> dari{' '}
              <span className="text-white font-bold">{totalPages}</span> ({filteredTransactions.length} transaksi)
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                ← Prev
              </button>
              <span className="text-xs font-mono-tech text-slate-400 px-2">{currentPage}/{totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
