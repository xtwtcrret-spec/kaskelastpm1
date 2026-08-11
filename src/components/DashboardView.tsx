import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Transaction, Member, OrganizationSettings } from '../types';
import { formatRupiah, formatDateIndonesian, getCurrentMonthKey } from '../utils/formatters';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Receipt, 
  Users, 
  Plus, 
  Send,
  PieChart as PieIcon,
  BarChart3,
  ExternalLink,
  Check,
  Share2,
  Clock,
  ShieldCheck,
  Lock,
  Cog,
  Cpu
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardViewProps {
  transactions: Transaction[];
  members: Member[];
  settings: OrganizationSettings;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onOpenStudentPay?: () => void;
  onOpenAddTx: () => void;
  onOpenSmartNote: () => void;
  onSelectReceipt: (tx: Transaction) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenWhatsAppReminder: (member: Member) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Konsumsi & Acara': '#f59e0b',
  'Peralatan & ATK': '#06b6d4',
  'Operasional & Kebersihan': '#10b981',
  'Transportasi & Logistik': '#3b82f6',
  'Kesehatan & Darurat': '#ef4444',
  'Pengeluaran Lainnya': '#8b5cf6',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  members,
  settings,
  isAdmin = false,
  onOpenAdminLogin,
  onOpenAddTx,
  onOpenSmartNote,
  onSelectReceipt,
  onNavigateToTab,
  onOpenWhatsAppReminder,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Calculations - ONLY include verified transactions for official total balance
  const verifiedTransactions = transactions.filter((t) => t.verified);

  const totalIncome = verifiedTransactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = verifiedTransactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  // Pending transactions awaiting Admin verification
  const pendingTransactions = transactions.filter((t) => !t.verified);
  const pendingIncomeAmount = pendingTransactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingExpenseAmount = pendingTransactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  // Unpaid Dues calculation for current month
  const currentMonthKey = getCurrentMonthKey();
  const unpaidMembers = members.filter(
    (m) => !m.duesPaidMonths.includes(currentMonthKey)
  );
  const totalUnpaidAmount = unpaidMembers.length * settings.monthlyDuesStandard;

  // Monthly Chart Data Generation (uses verified transactions for accurate financial audit)
  const monthMap: Record<string, { month: string; pemasukan: number; pengeluaran: number }> = {};
  
  // Last 6 months initialization
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    monthMap[key] = { month: monthLabel, pemasukan: 0, pengeluaran: 0 };
  }

  verifiedTransactions.forEach((tx) => {
    const key = tx.date.substring(0, 7); // YYYY-MM
    if (monthMap[key]) {
      if (tx.type === 'pemasukan') {
        monthMap[key].pemasukan += tx.amount;
      } else {
        monthMap[key].pengeluaran += tx.amount;
      }
    }
  });

  const chartData = Object.values(monthMap);

  // Category Pie Chart Data (Verified expenses only)
  const categoryMap: Record<string, number> = {};
  verifiedTransactions
    .filter((t) => t.type === 'pengeluaran')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const pieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Progress kelunasan iuran bulan berjalan (buat progress bar di dashboard)
  const paidThisMonthCount = members.length - unpaidMembers.length;
  const duesProgressPct = members.length > 0 ? Math.round((paidThisMonthCount / members.length) * 100) : 0;

  // Cash Health Status
  let healthBadge = { text: 'Kas Permesinan Sehat (Aman)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  if (totalBalance < 500000 && totalBalance > 0) {
    healthBadge = { text: 'Saldo Menipis (Perlu Topup)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  } else if (totalBalance <= 0) {
    healthBadge = { text: 'Kas Defisit / Perlu Kalibrasi', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  }

  const handleCopyGroupSummary = () => {
    const summaryText = `⚙️ *LAPORAN KAS BENGKEL & KELAS ${settings.name.toUpperCase()}* ⚙️\n----------------------------------\n💰 *Total Saldo Resmi*: ${formatRupiah(totalBalance)}\n🟢 *Total Pemasukan*: ${formatRupiah(totalIncome)}\n🔴 *Total Pengeluaran*: ${formatRupiah(totalExpense)}\n⚠️ *Tunggakan Iuran*: ${formatRupiah(totalUnpaidAmount)} (${unpaidMembers.length} Anggota)\n\n💳 *Info Setor Kas*:\n• Nomor / WA: ${settings.bankAccountNo}\n• Atas Nama: ${settings.bankAccountName}\n• Standar Iuran: ${formatRupiah(settings.monthlyDuesStandard)}/bulan\n\nPresisi & Transparan! Salam Teknik Permesinan! ⚙️🔧`;
    
    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Mechanical Engineering Banner & Quick AI Action */}
      <div className="bg-slate-900/90 backdrop-blur-2xl text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-blue-500/30 relative overflow-hidden glass-card-blue">
        <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
          <Cog className="w-64 h-64 text-blue-400 animate-spin-gear" />
        </div>
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-mono-tech font-bold px-2.5 py-0.5 rounded-full border ${healthBadge.color}`}>
                ● {healthBadge.text}
              </span>
              <span className="text-[11px] font-mono-tech text-blue-400/90 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" /> System Presisi • {transactions.length} Transaksi
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-tech tracking-wide text-white uppercase flex items-center gap-2">
              <span>Konsol Monitoring Kas {settings.name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pencatatan kas transparan & terkalibrasi presisi untuk <strong className="text-blue-300">{settings.name}</strong>. Dilengkapi AI Cash Advisor & kuitansi digital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopyGroupSummary}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20 border border-emerald-400/30"
              title="Salin ringkasan kas untuk dibagikan ke Grup WA"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4 text-emerald-200" />}
              <span>{copiedSummary ? 'Laporan WA Tersalin!' : 'Salin Laporan WA'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigateToTab('ai-audit')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-blue-500 text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer border border-blue-300/40"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Audit AI Gemini</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Pending Transactions Alert Banner */}
      {pendingTransactions.length > 0 && (
        <div className="bg-blue-500/15 border border-blue-500/30 text-blue-200 p-4 rounded-3xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-white text-sm">
                ⏳ {pendingTransactions.length} Setoran Kas Siswa Menunggu Konfirmasi Admin
              </div>
              <div className="text-slate-300 text-xs">
                {isAdmin
                  ? 'Ada setoran kas baru dari siswa yang belum diverifikasi. Silakan periksa dan konfirmasi.'
                  : 'Setoran kas Anda / teman kelas sedang diperiksa dan menunggu konfirmasi Bendahara.'}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('transactions')}
            className="bg-blue-500 hover:bg-blue-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex-shrink-0 cursor-pointer transition shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-1.5"
          >
            <span>{isAdmin ? 'Verifikasi & Konfirmasi Sekarang →' : 'Buka Buku Kas →'}</span>
          </button>
        </div>
      )}

      {/* 4 Key Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Saldo Kas */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Saldo Resmi Terkonfirmasi
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight break-words">
            {formatRupiah(totalBalance)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 inline flex-shrink-0" />
              Terkonfirmasi Admin
            </span>
            {pendingIncomeAmount > 0 && (
              <span className="text-[10px] text-blue-300 font-bold bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                ⏳ +{formatRupiah(pendingIncomeAmount)} Pending
              </span>
            )}
          </div>
        </motion.div>

        {/* Card 2: Total Pemasukan */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Pemasukan Resmi
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight break-words">
            {formatRupiah(totalIncome)}
          </div>
          <p className="text-xs text-slate-400 mt-2 truncate">
            {pendingIncomeAmount > 0 ? (
              <span className="text-blue-300 font-semibold">⏳ {formatRupiah(pendingIncomeAmount)} belum dikonfirmasi</span>
            ) : (
              'Sudah diverifikasi penuh'
            )}
          </p>
        </motion.div>

        {/* Card 3: Total Pengeluaran */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Pengeluaran Resmi
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight break-words">
            {formatRupiah(totalExpense)}
          </div>
          <p className="text-xs text-slate-400 mt-2 truncate">
            Kegiatan & operasional
          </p>
        </motion.div>

        {/* Card 4: Tunggakan Iuran */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-xl hover:bg-white/10 hover:border-white/20 transition-all cursor-default"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Belum Lunas ({unpaidMembers.length} Anggota)
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-400 tracking-tight break-words">
            {formatRupiah(totalUnpaidAmount)}
          </div>
          <button
            onClick={() => onNavigateToTab('members')}
            className="text-xs text-blue-300 hover:underline font-semibold mt-2 inline-flex items-center gap-1 cursor-pointer"
          >
            Lihat & tagih WA &rarr;
          </button>
        </motion.div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart: Arus Kas Bulanan (2 Cols) */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Grafik Arus Kas (Pemasukan vs Pengeluaran)
              </h3>
              <p className="text-xs text-slate-400">
                Visualisasi tren kas selama 6 bulan terakhir
              </p>
            </div>
          </div>

          {/* Progress Kelunasan Iuran Bulan Ini */}
          {members.length > 0 && (
            <div className="mb-4 bg-white/5 border border-white/10 rounded-2xl p-3.5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  Kelunasan Iuran Bulan Ini
                </span>
                <span className="font-mono-tech font-bold text-emerald-400">
                  {paidThisMonthCount}/{members.length} siswa ({duesProgressPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    duesProgressPct >= 80 ? 'bg-emerald-500' : duesProgressPct >= 40 ? 'bg-blue-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${duesProgressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(v) => `${v / 1000}k`} 
                />
                <Tooltip 
                  formatter={(val: any) => [formatRupiah(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255, 255, 255, 0.15)', color: '#f8fafc', borderRadius: '16px', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pemasukan" 
                  name="Pemasukan" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorPemasukan)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="pengeluaran" 
                  name="Pengeluaran" 
                  stroke="#f43f5e" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorPengeluaran)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Kategori Pengeluaran (1 Col) */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <PieIcon className="w-5 h-5 text-purple-400" />
              Alokasi Pengeluaran
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Breakdown pengeluaran berdasarkan kategori
            </p>

            <div className="h-52 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CATEGORY_COLORS[entry.name] || '#64748b'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatRupiah(Number(val))} contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-500">Belum ada data pengeluaran</div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-white/10 max-h-36 overflow-y-auto">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: CATEGORY_COLORS[item.name] || '#64748b' }} 
                  />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-bold text-white flex-shrink-0 ml-2">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Security & Anti-Fraud Pillar Overview Card */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Sistem Keamanan Buku Kas & Proteksi Anti-Kecurangan</h3>
              <p className="text-xs text-slate-400">Jaminan transparansi mutlak dan akurasi keuangan untuk seluruh kelas</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
            ● Status: Aktif & Terlindungi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5">
            <div className="font-bold text-blue-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              1. Isolasi Setoran Pending
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Setoran kas siswa berstatus <strong>Pending</strong> dan tidak langsung menambah Saldo Kas Utama. Uang baru terhitung resmi setelah dikonfirmasi oleh Admin/Bendahara.
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5">
            <div className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-400" />
              2. Autentikasi PIN Bendahara
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Tindakan sensitif seperti konfirmasi setoran, edit nominal, dan hapus transaksi dilindungi PIN keamanan khusus Bendahara untuk mencegah manipulasi data.
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              3. Transparansi & Audit Publik
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Seluruh anggota kelas dapat memantau riwayat setoran, status verifikasi, dan mengunduh laporan kuitansi kapan saja tanpa bisa diubah diam-diam.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 5 Transaksi Terakhir + Anggota Belum Bayar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Transaksi Terakhir */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Catatan Transaksi Terakhir</h3>
              <p className="text-xs text-slate-400">Entry pengeluaran dan pemasukan terbaru</p>
            </div>
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              Lihat Semua ({transactions.length}) &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-white/5 hover:border-white/15 hover:bg-white/10 transition-all gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                    tx.type === 'pemasukan' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}>
                    {tx.type === 'pemasukan' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white line-clamp-1 break-words">{tx.description}</span>
                      <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-md border border-white/10 flex-shrink-0">
                        {tx.category}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-400 flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
                      <span>{formatDateIndonesian(tx.date)}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px] sm:max-w-none">{tx.contributor}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-300">{tx.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between text-right flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 sm:ml-4">
                  <div className={`text-xs sm:text-sm font-bold ${
                    tx.type === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {tx.type === 'pemasukan' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </div>
                  <button
                    onClick={() => onSelectReceipt(tx)}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 justify-end cursor-pointer"
                  >
                    <Receipt className="w-3 h-3" />
                    Kuitansi
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
            {isAdmin ? (
              <button
                onClick={onOpenAddTx}
                className="bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-white/10"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Tambah Transaksi Baru</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10 text-xs font-bold px-4 py-2.5 rounded-2xl transition flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Login Admin buat Catat Transaksi</span>
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick WhatsApp Reminder for Unpaid Dues */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Tunggakan Iuran
              </h3>
              <span className="text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                {unpaidMembers.length} Orang
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Anggota yang belum bayar iuran ({formatRupiah(settings.monthlyDuesStandard)}/bln)
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {unpaidMembers.length > 0 ? (
                unpaidMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{member.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{member.role}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenWhatsAppReminder(member)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 flex-shrink-0"
                      title="Kirim pesan penagihan otomatis ke WA"
                    >
                      <Send className="w-3 h-3" />
                      <span>Tagih WA</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-emerald-300">Semua Anggota Sudah Lunas!</p>
                  <p className="text-[11px] text-emerald-400/80">Iuran bulan ini telah terkumpul 100%.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 mt-4">
            <button
              onClick={() => onNavigateToTab('members')}
              className="w-full text-center text-xs font-bold text-slate-300 hover:text-indigo-400 flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Kelola Seluruh Anggota & Matriks</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
