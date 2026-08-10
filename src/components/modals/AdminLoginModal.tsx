import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldAlert, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { AdminAccount, parseAdminAccounts, authenticateAdmin } from '../../utils/admin';
import { OrganizationSettings } from '../../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (adminName: string) => void;
  settings: OrganizationSettings;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  settings,
}) => {
  const adminAccounts = parseAdminAccounts(settings.adminPin, settings.treasurerName);
  
  const [selectedAdminId, setSelectedAdminId] = useState<string>(adminAccounts[0]?.id || '');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPin, setShowPin] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedAdmin = authenticateAdmin(adminAccounts, pinInput, selectedAdminId);
    
    if (matchedAdmin) {
      setErrorMsg('');
      setPinInput('');
      onLoginSuccess(`${matchedAdmin.name} (${matchedAdmin.role})`);
      onClose();
    } else {
      setErrorMsg('PIN / Password Admin salah. Pastikan memilih profil admin & memasukkan PIN yang benar.');
    }
  };

  const selectedAdmin = adminAccounts.find((a) => a.id === selectedAdminId) || adminAccounts[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-500/30 text-white space-y-5 relative overflow-hidden metallic-card">
        
        {/* Glow Background Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-tech uppercase text-white">Login Multi-Admin Bendahara</h3>
              <p className="text-[10px] text-amber-400 font-mono-tech">Sistem Otentikasi Akses Terverifikasi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Admin Selection list if multiple admins exist */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Pilih Profil Admin ({adminAccounts.length} Terdaftar)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {adminAccounts.map((acc) => {
                const isSelected = acc.id === selectedAdmin?.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedAdminId(acc.id);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/60 text-white shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/10 text-slate-300'
                    }`}>
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs truncate">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{acc.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
              <span>PIN Rahasia ({selectedAdmin?.name || 'Admin'})</span>
              <span className="text-[10px] text-slate-400">Atau ketik PIN langsung</span>
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={`Masukkan PIN ${selectedAdmin?.name || 'Admin'}`}
                className="w-full p-3 pr-10 rounded-2xl border border-white/10 bg-white/5 text-white font-mono tracking-widest text-sm placeholder:tracking-normal placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] mt-2 flex items-start gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Nama Anda (<strong>{selectedAdmin?.name}</strong>) akan secara otomatis tercatat di <strong>Audit Log Transparansi</strong> saat Anda memproses transaksi.</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 font-semibold hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!pinInput.trim()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              <span>Masuk Sebagai {selectedAdmin?.name?.split(' ')[0] || 'Admin'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
