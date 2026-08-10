import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import {
  History,
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Users,
  Target,
  ShieldQuestion,
  Lock,
} from 'lucide-react';
import { ConfirmModal } from './modals/ConfirmModal';

interface AuditLogViewProps {
  auditLog: AuditLogEntry[];
  isAdmin?: boolean;
  onClearLog?: () => void;
  onOpenAdminLogin?: () => void;
}

function getActionIcon(action: string) {
  const a = action.toLowerCase();
  if (a.includes('hapus')) return { Icon: Trash2, color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
  if (a.includes('edit')) return { Icon: Edit3, color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' };
  if (a.includes('batalkan')) return { Icon: XCircle, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
  if (a.includes('verifikasi') || a.includes('lunas')) return { Icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
  if (a.includes('siswa')) return { Icon: Users, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' };
  if (a.includes('anggaran')) return { Icon: Target, color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' };
  if (a.includes('tambah')) return { Icon: PlusCircle, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
  return { Icon: ShieldQuestion, color: 'text-slate-400 bg-white/5 border-white/10' };
}

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLog, isAdmin = false, onClearLog, onOpenAdminLogin }) => {
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const handleClearClick = () => {
    if (!isAdmin) {
      onOpenAdminLogin?.();
      return;
    }
    setIsClearConfirmOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-amber-500/30 shadow-xl metallic-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black font-tech uppercase tracking-wide text-white flex items-center gap-2">
              <History className="w-6 h-6 text-amber-400" />
              Riwayat Perubahan (Audit Log)
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Catatan transparan semua perubahan data kas — siapa nambah/edit/hapus/verifikasi apa, dan kapan. Bisa dilihat semua orang.
            </p>
          </div>

          {auditLog.length > 0 && (
            <button
              onClick={handleClearClick}
              className={`text-xs font-bold px-3.5 py-2 rounded-2xl transition flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                isAdmin
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10'
              }`}
              title={isAdmin ? 'Bersihkan seluruh riwayat' : 'Login Admin untuk membersihkan riwayat'}
            >
              {isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Bersihkan Log</span>
            </button>
          )}
        </div>
      </div>

      {auditLog.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center text-slate-500 text-sm">
          Belum ada riwayat perubahan tercatat.
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden">
          <div className="divide-y divide-white/5 max-h-[70vh] overflow-y-auto scrollbar-thin">
            {auditLog.map((entry) => {
              const { Icon, color } = getActionIcon(entry.action);
              return (
                <div key={entry.id} className="flex items-start gap-3 p-4 hover:bg-white/5 transition">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-bold text-white">{entry.action}</span>
                      <span className="text-[10px] text-slate-500">oleh {entry.actor}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 break-words">{entry.detail}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0 font-mono-tech">
                    {formatLogTime(entry.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => onClearLog?.()}
        title="Bersihkan Seluruh Riwayat?"
        message="Semua catatan perubahan (tambah/edit/hapus/verifikasi) akan dihapus permanen dan nggak bisa dikembalikan. Setelah dibersihkan, akan tetap dicatat 1 entri baru sebagai jejak kapan & oleh siapa log ini dikosongkan."
        confirmText="Ya, Bersihkan"
      />
    </div>
  );
};
