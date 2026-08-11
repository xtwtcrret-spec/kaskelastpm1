import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldAlert, Eye, EyeOff, UserCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (adminName: string) => void;
  currentPin: string;
  admins?: { name: string; pin: string }[];
}

type SelectedAccount = { name: string; pin: string } | 'legacy' | null;

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentPin,
  admins = [],
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [selected, setSelected] = useState<SelectedAccount>(null);

  const resetState = () => {
    setPinInput('');
    setErrorMsg('');
    setShowPin(false);
    setSelected(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  // Kalau belum ada daftar multi-admin sama sekali, langsung anggap "legacy" (PIN utama)
  // biar nggak nampilin langkah pilih akun yang nggak perlu.
  const hasMultiAdmin = admins.length > 0;
  const effectiveSelected: SelectedAccount = hasMultiAdmin ? selected : 'legacy';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pinInput.trim();

    if (effectiveSelected === 'legacy') {
      const targetPin = (currentPin || '262009').trim();
      if (trimmed === targetPin) {
        onLoginSuccess('Admin');
        handleClose();
      } else {
        setErrorMsg('PIN salah. Coba lagi.');
      }
      return;
    }

    if (effectiveSelected && typeof effectiveSelected === 'object') {
      if (trimmed === effectiveSelected.pin.trim()) {
        onLoginSuccess(effectiveSelected.name);
        handleClose();
      } else {
        setErrorMsg(`PIN salah untuk masuk sebagai "${effectiveSelected.name}". Coba lagi.`);
      }
    }
  };

  const accountLabel =
    effectiveSelected === 'legacy'
      ? 'Admin (PIN Utama)'
      : effectiveSelected && typeof effectiveSelected === 'object'
      ? effectiveSelected.name
      : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-indigo-500/30 text-white space-y-4 relative overflow-hidden">

        {/* Glow Background Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            {hasMultiAdmin && effectiveSelected ? (
              <button
                onClick={() => { setSelected(null); setErrorMsg(''); setPinInput(''); }}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                title="Kembali pilih akun"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Lock className="w-4 h-4" />
              </div>
            )}
            <h3 className="text-base font-bold text-white">
              {hasMultiAdmin && !effectiveSelected ? 'Login Sebagai Siapa?' : 'Login Bendahara / Admin'}
            </h3>
          </div>
          <button onClick={handleClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Pilih akun (cuma muncul kalau ada multi-admin dan belum milih) */}
        {hasMultiAdmin && !effectiveSelected && (
          <div className="space-y-2 relative z-10">
            <p className="text-xs text-slate-300 leading-relaxed mb-1">
              Pilih akun admin kamu, baru masukin PIN-nya.
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
              {admins.map((admin, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setSelected(admin); setErrorMsg(''); setPinInput(''); }}
                  className="w-full flex items-center gap-3 bg-white/5 hover:bg-indigo-500/15 border border-white/10 hover:border-indigo-500/40 rounded-2xl p-3 transition cursor-pointer text-left group"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 flex-shrink-0 group-hover:bg-indigo-500/30">
                    <UserCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-white flex-1 truncate">{admin.name}</span>
                  <KeyRound className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 flex-shrink-0" />
                </button>
              ))}

              {/* Opsi PIN utama / fallback lama */}
              <button
                type="button"
                onClick={() => { setSelected('legacy'); setErrorMsg(''); setPinInput(''); }}
                className="w-full flex items-center gap-3 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 rounded-2xl p-3 transition cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 flex-shrink-0 group-hover:bg-amber-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-white flex-1 truncate">Admin (PIN Utama)</span>
                <KeyRound className="w-4 h-4 text-slate-500 group-hover:text-amber-300 flex-shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Input PIN buat akun yang dipilih */}
        {effectiveSelected && (
          <>
            {hasMultiAdmin && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 relative z-10">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
                  <UserCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">{accountLabel}</span>
              </div>
            )}

            {!hasMultiAdmin && (
              <p className="text-xs text-slate-300 leading-relaxed">
                Masukkan PIN atau Password Admin untuk membuka akses pengeditan kas, kelola siswa, dan pengaturan.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs relative z-10">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  PIN / Password
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
                    placeholder="Masukkan PIN / Password"
                    className="w-full p-3 pr-10 rounded-2xl border border-white/10 bg-white/5 text-white font-mono tracking-widest placeholder:tracking-normal placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {errorMsg}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-slate-400 font-semibold hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Masuk</span>
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};
