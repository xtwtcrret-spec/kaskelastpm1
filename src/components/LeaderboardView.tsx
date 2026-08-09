import React from 'react';
import { Member, Transaction } from '../types';
import { formatRupiah } from '../utils/formatters';
import { getMemberTotalContribution } from '../utils/dues';
import { Trophy, Medal, Award, Wallet, CalendarCheck } from 'lucide-react';

interface LeaderboardViewProps {
  members: Member[];
  transactions: Transaction[];
}

const RANK_STYLES = [
  { badge: '🥇', ring: 'border-amber-400/60 shadow-amber-500/30', label: 'Juara 1' },
  { badge: '🥈', ring: 'border-slate-300/50 shadow-slate-400/20', label: 'Juara 2' },
  { badge: '🥉', ring: 'border-orange-400/50 shadow-orange-500/20', label: 'Juara 3' },
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ members, transactions }) => {
  const ranked = [...members]
    .map((m) => ({
      member: m,
      monthsPaid: m.duesPaidMonths.length,
      totalContribution: getMemberTotalContribution(m.id, transactions, members),
    }))
    .sort((a, b) => {
      if (b.monthsPaid !== a.monthsPaid) return b.monthsPaid - a.monthsPaid;
      return b.totalContribution - a.totalContribution;
    });

  const maxMonths = Math.max(1, ...ranked.map((r) => r.monthsPaid));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-amber-500/30 shadow-xl metallic-card">
        <h2 className="text-xl font-black font-tech uppercase tracking-wide text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          Papan Peringkat Iuran Kas
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Ranking siswa paling rajin bayar iuran — diurutkan dari jumlah bulan lunas terbanyak, biar makin semangat nggak nunggak 💪
        </p>
      </div>

      {ranked.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center text-slate-500 text-sm">
          Belum ada data siswa untuk ditampilkan.
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((entry, index) => {
            const rankStyle = RANK_STYLES[index];
            const progressPct = Math.round((entry.monthsPaid / maxMonths) * 100);

            return (
              <div
                key={entry.member.id}
                className={`flex items-center gap-4 bg-white/5 backdrop-blur-xl rounded-2xl border p-4 transition ${
                  rankStyle ? `${rankStyle.ring} bg-gradient-to-r from-white/[0.07] to-transparent shadow-lg` : 'border-white/10'
                }`}
              >
                {/* Rank number / badge */}
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                  {rankStyle ? (
                    <span className="text-2xl" title={rankStyle.label}>{rankStyle.badge}</span>
                  ) : (
                    <span className="text-sm font-mono-tech font-bold text-slate-500">#{index + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <img
                  src={entry.member.avatar}
                  alt={entry.member.name}
                  className="w-11 h-11 rounded-full object-cover border border-white/20 flex-shrink-0"
                />

                {/* Name & progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white truncate">{entry.member.name}</span>
                    <span className="text-[10px] text-slate-400">{entry.member.role}</span>
                  </div>
                  <div className="w-full bg-slate-950/80 h-1.5 rounded-full overflow-hidden mt-1.5 border border-white/5">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-emerald-400 font-mono-tech font-bold text-sm">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {entry.monthsPaid} Bulan
                    </div>
                    <div className="text-[10px] text-slate-500">Lunas</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-300 font-mono-tech font-bold text-sm">
                      <Wallet className="w-3.5 h-3.5" />
                      {formatRupiah(entry.totalContribution)}
                    </div>
                    <div className="text-[10px] text-slate-500">Total Kontribusi</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
