import React from 'react';
import { OrganizationSettings } from '../types';
import { formatRupiah } from '../utils/formatters';
import { 
  PlusCircle, 
  QrCode, 
  ShieldCheck, 
  TrendingUp,
  Lock,
  LogOut,
  User,
  CreditCard,
  Cog,
  Wrench,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';
import { LiveClock } from './LiveClock';

interface HeaderProps {
  settings: OrganizationSettings;
  totalBalance: number;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenStudentPay: () => void;
  onOpenAddTx: () => void;
  onOpenSmartNote: () => void;
  onOpenAudit: () => void;
  onOpenQRIS: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  totalBalance,
  isAdmin,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenStudentPay,
  onOpenAddTx,
  onOpenSmartNote,
  onOpenAudit,
  onOpenQRIS,
}) => {
  return (
    <header className="no-print bg-slate-950/80 backdrop-blur-2xl border-b border-amber-500/20 text-white sticky top-0 z-30 shadow-2xl relative overflow-hidden">
      {/* Background Decorative Blueprint Accent */}
      <div className="absolute inset-0 bg-blueprint-grid opacity-30 pointer-events-none" />
      <div className="absolute -left-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between py-3.5 gap-3">
          
          {/* Left: Brand / Machine Engineering Title & Admin Badge */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Mechanical Gear Logo with Spin */}
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex-shrink-0 relative group cursor-pointer"
            >
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <Cog className="w-6 h-6 text-amber-400 animate-spin-gear" />
                <Wrench className="w-3 h-3 text-cyan-400 absolute inset-auto top-1.5 right-1.5" />
              </div>
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-black font-tech tracking-wider text-white leading-tight break-words uppercase flex items-center gap-2">
                  <span>{settings.name}</span>
                </h1>
                
                {/* Mechanical Engineering Badge Tag */}
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono-tech font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  <Cpu className="w-3 h-3" /> TEKNIK PEMESINAN
                </span>

                {/* Mode Role Pill */}
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex-shrink-0 shadow-sm">
                    <ShieldCheck className="w-3 h-3 text-amber-400" /> Mode Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
                    <User className="w-3 h-3 text-cyan-400" /> Mode Siswa
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate max-w-[280px] sm:max-w-none">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Center/Right: Balance Pill & Industrial Quick Actions */}
          <div className="flex flex-wrap items-center justify-between md:justify-end w-full md:w-auto gap-2.5">

            <LiveClock />
            
            {/* Balance Gauge Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-slate-900/90 border border-amber-500/30 rounded-2xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-lg shadow-black/40"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-mono-tech uppercase tracking-widest text-amber-400/90 font-bold block">
                    SALDO KAS RESMI
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className={`text-base sm:text-lg font-mono-tech font-black tracking-tight ${totalBalance >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                  {formatRupiah(totalBalance)}
                </span>
              </div>
            </motion.div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Student Payment Button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenStudentPay}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black px-3.5 py-2.5 rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer border border-amber-300/40"
              >
                <CreditCard className="w-4 h-4" />
                <span>Setor / Bayar Kas</span>
              </motion.button>

              {isAdmin ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onOpenAddTx}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-2.5 rounded-2xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">+ Catat Kas</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onLogoutAdmin}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-2.5 rounded-2xl transition flex items-center gap-1 cursor-pointer"
                    title="Keluar dari mode admin"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onOpenAdminLogin}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  title="Login khusus Bendahara / Wali Kelas"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Login Admin</span>
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenQRIS}
                className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-semibold px-3 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
                title="Info QRIS & Transfer Bank"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">QRIS</span>
              </motion.button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};


