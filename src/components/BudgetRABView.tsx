import React, { useState } from 'react';
import { Transaction, BudgetItem } from '../types';
import { formatRupiah } from '../utils/formatters';
import { Target, Plus, AlertCircle, CheckCircle2, TrendingUp, Edit3, Trash2 } from 'lucide-react';

interface BudgetRABViewProps {
  budgets: BudgetItem[];
  transactions: Transaction[];
  onAddBudget: (budget: Omit<BudgetItem, 'id'>) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetRABView: React.FC<BudgetRABViewProps> = ({
  budgets,
  transactions,
  onAddBudget,
  onDeleteBudget,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('Konsumsi & Acara');
  const [allocatedAmount, setAllocatedAmount] = useState<number>(1000000);
  const [period, setPeriod] = useState('Agustus 2026');

  // Calculate actual spending per category (Verified expenses only)
  const actualSpentMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'pengeluaran' && t.verified)
    .forEach((t) => {
      actualSpentMap[t.category] = (actualSpentMap[t.category] || 0) + t.amount;
    });

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || allocatedAmount <= 0) return;

    onAddBudget({
      category,
      allocatedAmount,
      period,
    });

    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-amber-500/30 shadow-xl metallic-card">
        <div>
          <h2 className="text-xl font-black font-tech uppercase tracking-wide text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-400" />
            Rencana Anggaran Biaya (RAB) 12 TPM 1
          </h2>
          <p className="text-xs text-slate-300">
            Plafon alokasi bahan baku, perawatan alat mesin, dan operasional kelas
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>+ Tambah Anggaran Kategori</span>
        </button>
      </div>

      {/* Grid of Category Budgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((item) => {
          const spent = actualSpentMap[item.category] || 0;
          const percentage = Math.min(Math.round((spent / item.allocatedAmount) * 100), 100);
          const isOver = spent > item.allocatedAmount;
          const isWarning = percentage >= 80 && !isOver;

          let statusBadge = {
            label: 'Aman',
            color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            barColor: 'bg-emerald-400',
          };

          if (isOver) {
            statusBadge = {
              label: 'OVER BUDGET!',
              color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
              barColor: 'bg-rose-500',
            };
          } else if (isWarning) {
            statusBadge = {
              label: 'Hampir Habis (≥80%)',
              color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              barColor: 'bg-amber-400',
            };
          }

          return (
            <div
              key={item.id}
              className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl hover:border-amber-500/40 transition flex flex-col justify-between metallic-card"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-mono-tech">{item.period}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono-tech font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    <button
                      onClick={() => onDeleteBudget(item.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                      title="Hapus Target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black font-tech uppercase text-white mb-4">{item.category}</h3>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Realisasi Pengeluaran</span>
                    <span className={`font-mono-tech font-bold ${isOver ? 'text-rose-400' : 'text-white'}`}>
                      {formatRupiah(spent)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Plafon Anggaran</span>
                    <span className="font-mono-tech font-semibold text-slate-300">{formatRupiah(item.allocatedAmount)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-3 border border-white/10">
                  <div
                    className={`h-full transition-all duration-500 ${statusBadge.barColor}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Penggunaan: <strong className="text-white">{percentage}%</strong></span>
                <span>
                  Sisa: <strong className={item.allocatedAmount - spent < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {formatRupiah(item.allocatedAmount - spent)}
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Budget */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/10 text-white space-y-4">
            <h3 className="text-lg font-bold text-white">Tambah Target Anggaran RAB</h3>

            <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Konsumsi & Acara" className="bg-slate-900">Konsumsi & Acara</option>
                  <option value="Peralatan & ATK" className="bg-slate-900">Peralatan & ATK</option>
                  <option value="Operasional & Kebersihan" className="bg-slate-900">Operasional & Kebersihan</option>
                  <option value="Transportasi & Logistik" className="bg-slate-900">Transportasi & Logistik</option>
                  <option value="Kesehatan & Darurat" className="bg-slate-900">Kesehatan & Darurat</option>
                  <option value="Pengeluaran Lainnya" className="bg-slate-900">Pengeluaran Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Plafon Anggaran (Rp)</label>
                <input
                  type="number"
                  value={allocatedAmount}
                  onChange={(e) => setAllocatedAmount(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  step={50000}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Periode</label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Agustus 2026"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 font-semibold hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
