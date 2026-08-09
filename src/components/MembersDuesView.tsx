import React, { useState } from 'react';
import { Member, OrganizationSettings } from '../types';
import { formatRupiah } from '../utils/formatters';
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Send, 
  Phone, 
  Search, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ListPlus,
  Lock
} from 'lucide-react';
import { BatchMemberModal } from './modals/BatchMemberModal';

interface MembersDuesViewProps {
  members: Member[];
  settings: OrganizationSettings;
  isAdmin?: boolean;
  onOpenAdminLogin?: () => void;
  onToggleDuesMonth: (memberId: string, monthKey: string) => void;
  onOpenAddMember: () => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onOpenWhatsAppReminder: (member: Member) => void;
  onBatchAddMembers?: (namesList: string[]) => void;
}

const MONTHS_LIST = [
  { key: '2026-01', label: 'Jan' },
  { key: '2026-02', label: 'Feb' },
  { key: '2026-03', label: 'Mar' },
  { key: '2026-04', label: 'Apr' },
  { key: '2026-05', label: 'Mei' },
  { key: '2026-06', label: 'Jun' },
  { key: '2026-07', label: 'Jul' },
  { key: '2026-08', label: 'Agu' },
  { key: '2026-09', label: 'Sep' },
  { key: '2026-10', label: 'Okt' },
  { key: '2026-11', label: 'Nov' },
  { key: '2026-12', label: 'Des' },
];

export const MembersDuesView: React.FC<MembersDuesViewProps> = ({
  members,
  settings,
  isAdmin = false,
  onOpenAdminLogin,
  onToggleDuesMonth,
  onOpenAddMember,
  onEditMember,
  onDeleteMember,
  onOpenWhatsAppReminder,
  onBatchAddMembers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMonth, setActiveMonth] = useState('2026-08');
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics for selected active month
  const paidCountInActiveMonth = members.filter((m) =>
    m.duesPaidMonths.includes(activeMonth)
  ).length;

  const totalCollectedInActiveMonth = paidCountInActiveMonth * settings.monthlyDuesStandard;
  const totalTargetInActiveMonth = members.length * settings.monthlyDuesStandard;
  const collectionPercentage = members.length > 0
    ? Math.round((paidCountInActiveMonth / members.length) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-amber-500/30 shadow-xl metallic-card">
        <div>
          <h2 className="text-xl font-black font-tech uppercase tracking-wide text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            Matriks Siswa & Iuran Kas 12 TPM 1
          </h2>
          <p className="text-xs text-slate-300">
            Standar Iuran Kas: <span className="font-mono-tech font-bold text-amber-300">{formatRupiah(settings.monthlyDuesStandard)}/bulan</span> per siswa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer font-mono-tech"
              >
                <ListPlus className="w-4 h-4 text-amber-400" />
                <span>+ Batch Paste Siswa</span>
              </button>

              <button
                onClick={onOpenAddMember}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>+ Tambah Siswa</span>
              </button>
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
        </div>
      </div>

      {/* Progress & Month Selector Card */}
      <div className="bg-slate-900/90 backdrop-blur-2xl text-white p-5 sm:p-6 rounded-3xl shadow-2xl border border-amber-500/30 space-y-4 metallic-card-amber">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono-tech font-bold uppercase tracking-wider text-amber-400 mb-1">
              PENCAPAIAN IURAN KAS 2026
            </div>
            <div className="text-xl sm:text-2xl font-mono-tech font-black tracking-tight break-words text-white">
              {formatRupiah(totalCollectedInActiveMonth)}{' '}
              <span className="text-xs sm:text-sm font-normal text-slate-400 block sm:inline">
                / {formatRupiah(totalTargetInActiveMonth)} Target
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-400">Tingkat Pelunasan</div>
              <div className="text-xl font-mono-tech font-black text-emerald-400">{collectionPercentage}%</div>
            </div>

            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-500/40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center font-mono-tech font-black text-sm sm:text-base text-emerald-400 shadow-inner flex-shrink-0">
              {collectionPercentage}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950/80 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${collectionPercentage}%` }}
          />
        </div>

        {/* Month Selector Tabs */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-slate-400 font-semibold mr-1 flex-shrink-0">Pilih Bulan:</span>
          {MONTHS_LIST.map((m) => {
            const isSelected = activeMonth === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setActiveMonth(m.key)}
                className={`text-xs font-bold px-3.5 py-2 rounded-2xl transition flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-500/30 text-white border border-indigo-500/50 shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Matrix Checklist Table */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl overflow-hidden space-y-4 p-4 sm:p-5">
        
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama anggota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500" /> Lunas
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/50 inline-block" /> Menunggak
            </span>
          </div>
        </div>

        {/* Matrix Grid */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Belum Ada Siswa Terdaftar di Kelas 12 TPM 1</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Aplikasi kas sudah mulai dari Rp 0! Tambahkan nama-nama siswa kelas Anda satu per satu atau paste sekaligus dari daftar absensi.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <ListPlus className="w-4 h-4" />
                <span>Paste Daftar Banyak Siswa</span>
              </button>
              <button
                onClick={onOpenAddMember}
                className="bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Tambah Siswa Satu per Satu</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-white/10 border-b border-white/10 text-slate-300 font-bold uppercase">
                  <th className="py-3 px-3 min-w-[180px]">Siswa</th>
                  <th className="py-3 px-3 text-center">Jabatan</th>
                  {MONTHS_LIST.map((m) => (
                    <th 
                      key={m.key} 
                      className={`py-3 px-1.5 text-center min-w-[42px] ${
                        activeMonth === m.key ? 'bg-indigo-500/20 text-indigo-300 font-extrabold border-x border-indigo-500/30' : ''
                      }`}
                    >
                      {m.label}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[110px]">Aksi WA / Edit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredMembers.map((member) => {
                  const isPaidInActiveMonth = member.duesPaidMonths.includes(activeMonth);

                  return (
                    <tr key={member.id} className="hover:bg-white/10 transition">
                      
                      {/* Member Profile */}
                      <td className="py-3 px-3 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white">{member.name}</div>
                            <div className="text-[10px] text-slate-400">{member.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3 text-center">
                        <span className="bg-white/10 text-slate-200 px-2 py-0.5 rounded-md text-[10px] font-medium border border-white/10">
                          {member.role}
                        </span>
                      </td>

                      {/* Months Checkboxes */}
                      {MONTHS_LIST.map((m) => {
                        const isPaid = member.duesPaidMonths.includes(m.key);
                        const isCurrentActive = activeMonth === m.key;

                        return (
                          <td
                            key={m.key}
                            className={`py-2 px-1 text-center ${
                              isCurrentActive ? 'bg-indigo-500/10 border-x border-indigo-500/20' : ''
                            }`}
                          >
                            <button
                              onClick={() => {
                                if (isAdmin) {
                                  onToggleDuesMonth(member.id, m.key);
                                } else if (onOpenAdminLogin) {
                                  onOpenAdminLogin();
                                }
                              }}
                              className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition cursor-pointer active:scale-90 ${
                                isPaid
                                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                                  : 'bg-white/5 text-slate-600 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10'
                              }`}
                              title={`Status ${m.label}: ${isPaid ? 'Sudah Lunas' : 'Belum Lunas'} (${isAdmin ? 'Klik untuk ubah' : 'Butuh login Admin untuk ubah'})`}
                            >
                              {isPaid ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        );
                      })}

                      {/* Actions: WA Reminder & Edit */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaidInActiveMonth ? (
                            <button
                              onClick={() => onOpenWhatsAppReminder(member)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                              title="Tagih Iuran via WhatsApp"
                            >
                              <Send className="w-3 h-3" />
                              <span>Tagih WA</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-500/30">
                              ✓ Lunas
                            </span>
                          )}

                          {isAdmin ? (
                            <>
                              <button
                                onClick={() => onEditMember(member)}
                                className="p-1 text-slate-400 hover:bg-white/10 rounded-lg transition cursor-pointer"
                                title="Edit Siswa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onDeleteMember(member.id)}
                                className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={onOpenAdminLogin}
                              className="p-1 text-slate-500 hover:text-slate-300 rounded-lg transition cursor-pointer"
                              title="Login Admin untuk edit/hapus"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      <BatchMemberModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchAdd={(namesList) => {
          if (onBatchAddMembers) onBatchAddMembers(namesList);
        }}
      />

    </div>
  );
};
