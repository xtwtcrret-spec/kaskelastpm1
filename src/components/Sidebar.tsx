import React from 'react';
import { OrganizationSettings } from '../types';
import { formatRupiah } from '../utils/formatters';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Bot,
  Target,
  History,
  Settings as SettingsIcon,
  QrCode,
  Lock,
  LogOut,
  CreditCard,
  Wallet,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';

interface NavTab {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  pendingCount?: number;
}

interface SidebarProps {
  settings: OrganizationSettings;
  totalBalance: number;
  isAdmin: boolean;
  navTabs: NavTab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenStudentPay: () => void;
  onOpenQRIS: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  totalBalance,
  isAdmin,
  navTabs,
  activeTab,
  setActiveTab,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenStudentPay,
  onOpenQRIS,
  isMobileOpen,
  onCloseMobile,
}) => {
  const content = (
    <div className="flex flex-col h-full w-72 bg-[#0b1230]/95 backdrop-blur-2xl border-r border-white/10 relative overflow-hidden">
      {/* Ambient gradient glow accents */}
      <div className="absolute -top-24 -left-16 w-56 h-56 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-24 -right-10 w-48 h-48 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-black text-white tracking-tight truncate">{settings.name}</h1>
          <p className="text-[10px] text-slate-400 truncate">{settings.tagline}</p>
        </div>
        <button onClick={onCloseMobile} className="lg:hidden p-1.5 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Role pill */}
      <div className="relative z-10 px-5 mb-4">
        {isAdmin ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" /> Mode Admin
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full">
            <User className="w-3 h-3" /> Mode Siswa
          </span>
        )}
      </div>

      {/* Balance Card */}
      <div className="relative z-10 mx-5 mb-5 p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-transparent border border-blue-500/20">
        <p className="text-[10px] uppercase tracking-widest text-blue-300/80 font-bold mb-1">Saldo Kas Resmi</p>
        <p className={`text-xl font-black tracking-tight ${totalBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
          {formatRupiah(totalBalance)}
        </p>
      </div>

      {/* Nav Links */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                onCloseMobile();
              }}
              className={`w-full relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActivePill"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-600/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10 flex-shrink-0" />
              <span className="relative z-10 flex-1 text-left truncate">{tab.label}</span>
              {tab.badge && (
                <span className="relative z-10 text-[9px] bg-white/15 text-white font-extrabold px-1.5 py-0.5 rounded-md flex-shrink-0">
                  {tab.badge}
                </span>
              )}
              {!!tab.pendingCount && (
                <span className="relative z-10 text-[9px] bg-rose-500 text-white font-extrabold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 flex-shrink-0">
                  {tab.pendingCount > 99 ? '99+' : tab.pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="relative z-10 p-3 space-y-1.5 border-t border-white/10">
        <button
          onClick={onOpenStudentPay}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20 hover:opacity-90 transition cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>Setor / Bayar Kas</span>
        </button>

        <button
          onClick={onOpenQRIS}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:bg-white/5 transition cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-blue-400" />
          <span>Info QRIS & Transfer</span>
        </button>

        {isAdmin ? (
          <button
            onClick={onLogoutAdmin}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Admin</span>
          </button>
        ) : (
          <button
            onClick={onOpenAdminLogin}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:bg-white/5 transition cursor-pointer"
          >
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Login Admin</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="no-print hidden lg:block fixed inset-y-0 left-0 z-30">{content}</aside>

      {/* Mobile: slide-in drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute inset-y-0 left-0"
          >
            {content}
          </motion.div>
        </div>
      )}
    </>
  );
};
