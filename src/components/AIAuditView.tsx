import React, { useState } from 'react';
import { Transaction, Member, OrganizationSettings, AIAuditReport, ParsedAINote } from '../types';
import { formatRupiah } from '../utils/formatters';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  RefreshCw, 
  FileText, 
  PlusCircle, 
  ArrowRight,
  BrainCircuit,
  Bot
} from 'lucide-react';

interface AIAuditViewProps {
  transactions: Transaction[];
  members: Member[];
  settings: OrganizationSettings;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

export const AIAuditView: React.FC<AIAuditViewProps> = ({
  transactions,
  members,
  settings,
  onAddTransaction,
}) => {
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditReport, setAuditReport] = useState<AIAuditReport | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Smart Note Parser State
  const [rawNote, setRawNote] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [parsedNote, setParsedNote] = useState<ParsedAINote | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSuccessMsg, setNoteSuccessMsg] = useState<string | null>(null);

  // Calculations for prompt (verified transactions only)
  const verifiedTx = transactions.filter((t) => t.verified);
  const pendingTx = transactions.filter((t) => !t.verified);

  const totalIncome = verifiedTx
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = verifiedTx
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  const pendingIncome = pendingTx
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  // Unpaid dues
  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const unpaidCount = members.filter((m) => !m.duesPaidMonths.includes(currentMonthKey)).length;
  const unpaidDues = unpaidCount * settings.monthlyDuesStandard;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'pengeluaran')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const handleRunAudit = async () => {
    setLoadingAudit(true);
    setAuditError(null);

    try {
      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: settings.name,
          totalBalance,
          totalIncome,
          totalExpense,
          unpaidDues,
          categoryBreakdown: categoryMap,
          recentTransactions: transactions.slice(0, 10).map((t) => ({
            type: t.type,
            amount: t.amount,
            category: t.category,
            description: t.description,
            date: t.date,
          })),
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAuditReport({
          ...resData.data,
          generatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        });
      } else {
        throw new Error(resData.error || 'Gagal menghasilkan audit kas.');
      }
    } catch (err: any) {
      console.error(err);
      setAuditError(err.message || 'Terjadi kesalahan koneksi AI.');
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleParseNote = async () => {
    if (!rawNote.trim()) return;

    setLoadingNote(true);
    setNoteError(null);
    setNoteSuccessMsg(null);
    setParsedNote(null);

    try {
      const response = await fetch('/api/gemini/parse-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawNote }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setParsedNote(resData.data);
      } else {
        throw new Error(resData.error || 'Gagal memproses catatan.');
      }
    } catch (err: any) {
      console.error(err);
      setNoteError(err.message || 'Gagal menganalisis catatan dengan AI.');
    } finally {
      setLoadingNote(false);
    }
  };

  const handleApplyParsedNote = () => {
    if (!parsedNote) return;

    onAddTransaction({
      type: parsedNote.type,
      amount: Number(parsedNote.amount) || 0,
      category: parsedNote.category || 'Pengeluaran Lainnya',
      description: parsedNote.description || 'Transaksi AI',
      contributor: parsedNote.contributor || 'Pengurus',
      paymentMethod: parsedNote.paymentMethod || 'Tunai',
      date: parsedNote.date || new Date().toISOString().split('T')[0],
      verified: true,
    });

    setNoteSuccessMsg('Transaksi berhasil ditambahkan ke buku kas!');
    setParsedNote(null);
    setRawNote('');
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-slate-900/80 backdrop-blur-2xl text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-purple-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold px-3 py-1 rounded-full">
              <Bot className="w-4 h-4 text-purple-400" /> Powered by Gemini AI (Server-Side)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Penasihat Keuangan & Auditor Kas AI
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Analisis otomatis arus kas, deteksi potensi pemborosan, proyeksi saldo 3 bulan ke depan, dan penginputan transaksi cepat dari pesan WhatsApp atau teks biasa.
            </p>
          </div>

          <button
            onClick={handleRunAudit}
            disabled={loadingAudit}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-purple-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 flex-shrink-0"
          >
            {loadingAudit ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Memproses Audit AI...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-5 h-5" />
                <span>Audit Kas Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: AI Audit Report Results */}
      {auditError && (
        <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{auditError}</span>
        </div>
      )}

      {auditReport && (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Laporan Hasil Audit AI Kas
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Kondisi Kas: {auditReport.healthStatus}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Skor Kesehatan Kas</span>
                <span className="text-2xl font-black text-white">{auditReport.healthScore}/100</span>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-inner ${
                auditReport.healthScore >= 80 ? 'bg-emerald-500' : auditReport.healthScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}>
                {auditReport.healthScore}
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-sm text-slate-200 leading-relaxed">
            <span className="font-bold text-white block mb-1">📌 Ringkasan Eksekutif:</span>
            {auditReport.summary}
          </div>

          {/* Key Insights & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Insights */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Temuan Kunci & Fakta Kas
              </h4>
              <ul className="space-y-2">
                {auditReport.keyInsights.map((insight, idx) => (
                  <li key={idx} className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-xs text-emerald-200 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Potensi Risiko & Pemborosan
              </h4>
              <ul className="space-y-2">
                {auditReport.anomaliesOrRisks.map((risk, idx) => (
                  <li key={idx} className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-xs text-amber-200 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">⚠️</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Recommendations & 3-Month Projection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
            
            {/* Action Recommendations */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Rekomendasi Aksi Bendahara
              </h4>
              <ul className="space-y-2">
                {auditReport.recommendations.map((rec, idx) => (
                  <li key={idx} className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-2xl text-xs text-purple-200 flex items-start gap-2">
                    <span className="font-bold text-purple-400">{idx + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3 Month Projection */}
            <div className="bg-white/5 backdrop-blur-md text-white p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block mb-1">
                  Proyeksi Kas 3 Bulan Ke Depan
                </span>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  {auditReport.projection3Month}
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 text-[10px] text-slate-400 mt-4">
                Diaudit otomatis oleh AI • Tanggal: {auditReport.generatedAt || 'Hari ini'}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 2: AI Smart Note Parser */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Konversi Pesan Teks / WhatsApp Jadi Transaksi (AI Smart Parser)
            </h3>
            <p className="text-xs text-slate-400">
              Paste pesan dari grup WA atau catatan belanja, AI akan otomatis mengekstrak nominal, kategori, dan detailnya.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            rows={3}
            placeholder='Contoh: "Kemarin beli konsumsi rapat evaluasi 150rb via OVO, terus Pak Budi bayar iuran kas 50rb tunai"'
            value={rawNote}
            onChange={(e) => setRawNote(e.target.value)}
            className="w-full text-xs p-3.5 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/10 transition-all"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Tips: Tuliskan nominal, nama orang, dan keperluan dengan bahasa sehari-hari.
            </span>

            <button
              onClick={handleParseNote}
              disabled={loadingNote || !rawNote.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-purple-500/20"
            >
              {loadingNote ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengekstrak AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Ekstrak Data AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {noteError && (
          <div className="text-xs text-rose-300 bg-rose-500/20 p-3 rounded-2xl border border-rose-500/30">
            {noteError}
          </div>
        )}

        {noteSuccessMsg && (
          <div className="text-xs text-emerald-300 bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/30 font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{noteSuccessMsg}</span>
          </div>
        )}

        {/* Display Parsed Preview */}
        {parsedNote && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                Preview Hasil Ekstraksi AI
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                parsedNote.type === 'pemasukan' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {parsedNote.type === 'pemasukan' ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Nominal</span>
                <span className="font-bold text-white text-sm">{formatRupiah(parsedNote.amount)}</span>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Kategori</span>
                <span className="font-semibold text-slate-200">{parsedNote.category}</span>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Penanggung Jawab</span>
                <span className="font-semibold text-slate-200">{parsedNote.contributor}</span>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Metode</span>
                <span className="font-semibold text-slate-200">{parsedNote.paymentMethod}</span>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
              <span className="text-slate-400 block text-[10px]">Deskripsi</span>
              <span className="font-medium text-white">{parsedNote.description}</span>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setParsedNote(null)}
                className="text-xs text-slate-400 hover:text-white font-semibold px-3 py-2 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleApplyParsedNote}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Simpan Transaksi Ini</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
