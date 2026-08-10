import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  currentPin: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentPin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPin, setShowPin] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPin = currentPin || '262009';
    if (pinInput.trim() === targetPin) {
      setErrorMsg('');
      setPinInput('');
      onLoginSuccess();
      onClose();
    } else {
      setErrorMsg('PIN / Password Admin salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-indigo-500/30 text-white space-y-4 relative overflow-hidden">
        
        {/* Glow Background Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Login Bendahara / Admin</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Masukkan PIN atau Password Admin untuk membuka akses pengeditan kas, kelola siswa, dan pengaturan.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              PIN / Password Admin
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
                placeholder="Masukkan PIN / Password Admin"
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
              onClick={onClose}
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
              <span>Masuk Sebagai Admin</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
