import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Transaction, 
  Member, 
  BudgetItem, 
  OrganizationSettings 
} from './types';
import { 
  initialTransactions, 
  initialMembers, 
  initialBudgets, 
  initialSettings 
} from './data/initialData';
import { supabase, KAS_ROW_ID } from './lib/supabaseClient';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { MembersDuesView } from './components/MembersDuesView';
import { AIAuditView } from './components/AIAuditView';
import { BudgetRABView } from './components/BudgetRABView';
import { PaymentPortalView } from './components/PaymentPortalView';
import { SettingsView } from './components/SettingsView';

import { TransactionModal } from './components/modals/TransactionModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { WhatsAppReminderModal } from './components/modals/WhatsAppReminderModal';
import { MemberModal } from './components/modals/MemberModal';
import { AdminLoginModal } from './components/modals/AdminLoginModal';
import { StudentPaymentModal } from './components/modals/StudentPaymentModal';
import { ConfirmModal } from './components/modals/ConfirmModal';

import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Bot, 
  Target, 
  QrCode, 
  Settings as SettingsIcon,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  // Data kas kelas sekarang disimpan TERPUSAT di Supabase (bukan localStorage lagi),
  // supaya semua anak sekelas yang buka website ini lihat data yang SAMA.
  const [settings, setSettings] = useState<OrganizationSettings>(initialSettings);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [budgets, setBudgets] = useState<BudgetItem[]>(initialBudgets);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const hasLoadedRef = React.useRef(false);
  const isApplyingRemoteRef = React.useRef(false);

  // Ambil data awal dari Supabase saat pertama kali dibuka
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('kas_data')
        .select('*')
        .eq('id', KAS_ROW_ID)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Gagal memuat data kas dari Supabase:', error);
        setDataLoadError(
          'Gagal terhubung ke database bersama. Cek koneksi internet atau konfigurasi Supabase.'
        );
      } else if (data) {
        isApplyingRemoteRef.current = true;
        if (data.settings && Object.keys(data.settings).length > 0) setSettings(data.settings);
        if (data.members) setMembers(data.members);
        if (data.transactions) setTransactions(data.transactions);
        if (data.budgets) setBudgets(data.budgets);
      }

      hasLoadedRef.current = true;
      setIsLoadingData(false);
    })();

    // Dengarkan perubahan data secara live dari device/browser lain
    const channel = supabase
      .channel('kas_data_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'kas_data', filter: `id=eq.${KAS_ROW_ID}` },
        (payload) => {
          const data = payload.new as any;
          isApplyingRemoteRef.current = true;
          if (data.settings) setSettings(data.settings);
          if (data.members) setMembers(data.members);
          if (data.transactions) setTransactions(data.transactions);
          if (data.budgets) setBudgets(data.budgets);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Simpan balik ke Supabase setiap kali data berubah karena aksi user (bukan karena update dari device lain)
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (isApplyingRemoteRef.current) {
      isApplyingRemoteRef.current = false;
      return;
    }
    const timeout = setTimeout(async () => {
      const { error } = await supabase
        .from('kas_data')
        .update({
          settings,
          members,
          transactions,
          budgets,
          updated_at: new Date().toISOString(),
        })
        .eq('id', KAS_ROW_ID);
      if (error) {
        console.error('Gagal menyimpan data kas ke Supabase:', error);
      }
    }, 400); // debounce biar nggak spam request tiap ketikan
    return () => clearTimeout(timeout);
  }, [settings, members, transactions, budgets]);


  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // RBAC Role State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isStudentPayOpen, setIsStudentPayOpen] = useState(false);

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedWaMember, setSelectedWaMember] = useState<Member | null>(null);

  // Confirm Dialog States
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Total Balance Calculation (Only verified transactions count towards official total balance)
  const totalIncome = transactions
    .filter((t) => t.type === 'pemasukan' && t.verified)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'pengeluaran' && t.verified)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  // Transaction Handlers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'>) => {
    if (editingTx) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === editingTx.id ? { ...txData, id: editingTx.id } : t))
      );
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
    setEditingTx(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setDeletingTxId(id);
  };

  const executeDeleteTransaction = () => {
    if (!deletingTxId) return;
    const targetTx = transactions.find((t) => t.id === deletingTxId);

    // Filter out transaction
    setTransactions((prev) => prev.filter((t) => t.id !== deletingTxId));

    // If transaction was verified and matched member/month, un-mark dues month
    if (targetTx && targetTx.verified) {
      let targetMemberId = targetTx.memberId;
      let targetMonth = targetTx.forMonth;

      if (!targetMemberId && targetTx.contributor) {
        const foundMember = members.find(
          (m) => m.name.toLowerCase().trim() === targetTx.contributor!.toLowerCase().trim()
        );
        if (foundMember) targetMemberId = foundMember.id;
      }

      if (!targetMonth && targetTx.description) {
        const match = targetTx.description.match(/Bulan\s+(\d{4}-\d{2})/i);
        if (match) targetMonth = match[1];
      }

      if (targetMemberId && targetMonth) {
        setMembers((mPrev) =>
          mPrev.map((m) => {
            if (m.id !== targetMemberId) return m;
            return {
              ...m,
              duesPaidMonths: m.duesPaidMonths.filter((month) => month !== targetMonth),
            };
          })
        );
      }
    }

    setDeletingTxId(null);
  };

  const handleToggleVerify = (id: string) => {
    setTransactions((prev) => {
      const targetTx = prev.find((t) => t.id === id);
      if (!targetTx) return prev;

      const nextVerified = !targetTx.verified;

      // Resolve member and month if available
      let targetMemberId = targetTx.memberId;
      let targetMonth = targetTx.forMonth;

      if (!targetMemberId && targetTx.contributor) {
        const foundMember = members.find(
          (m) => m.name.toLowerCase().trim() === targetTx.contributor.toLowerCase().trim()
        );
        if (foundMember) targetMemberId = foundMember.id;
      }

      if (!targetMonth && targetTx.description) {
        const match = targetTx.description.match(/Bulan\s+(\d{4}-\d{2})/i);
        if (match) targetMonth = match[1];
      }

      const nextTransactions = prev.map((t) => (t.id === id ? { ...t, verified: nextVerified } : t));

      if (targetMemberId && targetMonth) {
        // Hitung TOTAL semua transaksi terverifikasi milik anggota ini untuk bulan ini
        // (bukan cuma cek "ada transaksi atau nggak"), supaya bayar sebagian
        // (misal Rp 2.000 dari target Rp 8.000) TIDAK langsung dianggap Lunas.
        const resolveMemberId = (t: Transaction): string | undefined => {
          if (t.memberId) return t.memberId;
          const found = members.find(
            (m) => m.name.toLowerCase().trim() === t.contributor.toLowerCase().trim()
          );
          return found?.id;
        };
        const resolveMonth = (t: Transaction): string | undefined => {
          if (t.forMonth) return t.forMonth;
          const match = t.description.match(/Bulan\s+(\d{4}-\d{2})/i);
          return match ? match[1] : undefined;
        };

        const totalPaidForMonth = nextTransactions
          .filter(
            (t) =>
              t.verified &&
              resolveMemberId(t) === targetMemberId &&
              resolveMonth(t) === targetMonth
          )
          .reduce((sum, t) => sum + t.amount, 0);

        const shouldBePaid = totalPaidForMonth >= settings.monthlyDuesStandard;

        setMembers((mPrev) =>
          mPrev.map((m) => {
            if (m.id !== targetMemberId) return m;
            const alreadyMarked = m.duesPaidMonths.includes(targetMonth!);
            let updatedMonths = m.duesPaidMonths;
            if (shouldBePaid && !alreadyMarked) {
              updatedMonths = [...m.duesPaidMonths, targetMonth!];
            } else if (!shouldBePaid && alreadyMarked) {
              updatedMonths = m.duesPaidMonths.filter((k) => k !== targetMonth);
            }
            return { ...m, duesPaidMonths: updatedMonths };
          })
        );
      }

      return nextTransactions;
    });
  };

  // Member Handlers
  const handleSaveMember = (
    memberData: Omit<Member, 'id' | 'duesPaidMonths'>,
    existingId?: string
  ) => {
    if (existingId) {
      setMembers((prev) =>
        prev.map((m) => (m.id === existingId ? { ...m, ...memberData } : m))
      );
    } else {
      const newMember: Member = {
        ...memberData,
        id: `m-${Date.now()}`,
        duesPaidMonths: [],
      };
      setMembers((prev) => [...prev, newMember]);
    }
    setEditingMember(null);
  };

  const handleBatchAddMembers = (namesList: string[]) => {
    const defaultAvatars = [
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"
    ];

    const newMembers: Member[] = namesList.map((name, index) => ({
      id: `m-${Date.now()}-${index}`,
      name: name.trim(),
      phone: `6289654783${(100 + index).toString().padStart(3, '0')}`,
      role: index === 0 ? 'Ketua Kelas' : index === 1 ? 'Bendahara' : index === 2 ? 'Sekretaris' : 'Siswa',
      avatar: defaultAvatars[index % defaultAvatars.length],
      duesPaidMonths: [],
      monthlyDuesAmount: settings.monthlyDuesStandard || 20000,
    }));

    setMembers((prev) => [...prev, ...newMembers]);
  };

  const handleDeleteMember = (id: string) => {
    setDeletingMemberId(id);
  };

  const executeDeleteMember = () => {
    if (deletingMemberId) {
      setMembers((prev) => prev.filter((m) => m.id !== deletingMemberId));
    }
    setDeletingMemberId(null);
  };

  const handleToggleDuesMonth = (memberId: string, monthKey: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const isPaid = m.duesPaidMonths.includes(monthKey);
        const updatedMonths = isPaid
          ? m.duesPaidMonths.filter((k) => k !== monthKey)
          : [...m.duesPaidMonths, monthKey];

        // Automatically create or record income transaction if newly marked paid!
        if (!isPaid) {
          const newTx: Transaction = {
            id: `tx-iuran-${memberId}-${monthKey}`,
            type: 'pemasukan',
            amount: settings.monthlyDuesStandard,
            category: 'Iuran Anggota',
            description: `Iuran Kas Bulan ${monthKey} oleh ${m.name}`,
            contributor: m.name,
            paymentMethod: 'Transfer Bank',
            date: new Date().toISOString().split('T')[0],
            verified: true,
          };
          setTransactions((t) => [newTx, ...t]);
        }

        return { ...m, duesPaidMonths: updatedMonths };
      })
    );
  };

  // Budget Handlers
  const handleAddBudget = (budgetData: Omit<BudgetItem, 'id'>) => {
    const newBudget: BudgetItem = {
      ...budgetData,
      id: `b-${Date.now()}`,
    };
    setBudgets((prev) => [...prev, newBudget]);
  };

  const handleDeleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  // Export / Import Backup
  const handleExportBackup = () => {
    // If not admin, sanitize settings to prevent leaking admin PIN
    const safeSettings = { ...settings };
    if (!isAdmin) {
      delete safeSettings.adminPin;
    }

    const backupData = {
      settings: safeSettings,
      members,
      transactions,
      budgets,
      exportedAt: new Date().toISOString(),
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `KasKita_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.settings) setSettings(parsed.settings);
          if (parsed.members) setMembers(parsed.members);
          if (parsed.transactions) setTransactions(parsed.transactions);
          if (parsed.budgets) setBudgets(parsed.budgets);
          alert('Backup data KasKita berhasil di-import!');
        } catch (err) {
          alert('File JSON backup tidak valid.');
        }
      };
    }
  };

  const handleResetSampleData = () => {
    setIsResetConfirmOpen(true);
  };

  const executeResetSampleData = () => {
    // Setter di bawah akan otomatis tersimpan ke Supabase lewat efek sync,
    // jadi reset ini juga akan ke-reset untuk semua orang (data bersama).
    setSettings(initialSettings);
    setMembers([]);
    setTransactions([]);
    setBudgets([]);
    setIsResetConfirmOpen(false);
  };

  // Navigation Links
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'transactions', label: 'Buku Kas & Transaksi', icon: BookOpen },
    { id: 'members', label: 'Iuran Anggota', icon: Users },
    { id: 'ai-audit', label: 'AI Audit & Smart Parser', icon: Bot, badge: 'Gemini' },
    { id: 'rab', label: 'RAB Anggaran', icon: Target },
    { id: 'payment', label: 'Info QRIS & Transfer', icon: QrCode },
    { id: 'settings', label: 'Pengaturan', icon: SettingsIcon },
  ];

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Memuat data kas bersama...</p>
        </div>
      </div>
    );
  }

  if (dataLoadError) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <p className="text-red-400 font-semibold">{dataLoadError}</p>
          <p className="text-slate-500 text-sm">
            Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diatur dengan benar, dan tabel `kas_data` sudah dibuat di Supabase.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans flex flex-col antialiased relative overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      
      {/* Background Blueprint Grid & Ambient Glowing Machine Orbs */}
      <div className="fixed inset-0 bg-blueprint-grid opacity-25 pointer-events-none z-0" />
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[15%] w-[35%] h-[35%] bg-amber-600/5 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Header Bar */}
      <Header
        settings={settings}
        totalBalance={totalBalance}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={() => setIsAdmin(false)}
        onOpenStudentPay={() => setIsStudentPayOpen(true)}
        onOpenAddTx={() => {
          setEditingTx(null);
          setIsTxModalOpen(true);
        }}
        onOpenSmartNote={() => setActiveTab('ai-audit')}
        onOpenAudit={() => setActiveTab('ai-audit')}
        onOpenQRIS={() => setActiveTab('payment')}
      />

      {/* Navigation Sub-Header - Mechanical Control Panel */}
      <nav className="bg-slate-950/80 backdrop-blur-2xl border-b border-amber-500/20 sticky top-[77px] z-20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-amber-300 font-tech uppercase tracking-wide'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-amber-500/20 border border-amber-500/40 rounded-2xl shadow-lg shadow-amber-500/10"
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="relative z-10">{tab.label}</span>
                  {tab.badge && (
                    <span className="relative z-10 text-[10px] bg-amber-500/30 text-amber-200 font-mono-tech font-extrabold px-2 py-0.5 rounded-md border border-amber-500/40">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                transactions={transactions}
                members={members}
                settings={settings}
                isAdmin={isAdmin}
                onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
                onOpenStudentPay={() => setIsStudentPayOpen(true)}
                onOpenAddTx={() => {
                  setEditingTx(null);
                  setIsTxModalOpen(true);
                }}
                onOpenSmartNote={() => setActiveTab('ai-audit')}
                onSelectReceipt={(tx) => setSelectedReceiptTx(tx)}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenWhatsAppReminder={(m) => setSelectedWaMember(m)}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                isAdmin={isAdmin}
                onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
                onOpenStudentPay={() => setIsStudentPayOpen(true)}
                onOpenAddTx={() => {
                  setEditingTx(null);
                  setIsTxModalOpen(true);
                }}
                onOpenSmartNote={() => setActiveTab('ai-audit')}
                onSelectReceipt={(tx) => setSelectedReceiptTx(tx)}
                onEditTx={(tx) => {
                  setEditingTx(tx);
                  setIsTxModalOpen(true);
                }}
                onDeleteTx={handleDeleteTransaction}
                onToggleVerify={handleToggleVerify}
              />
            )}

            {activeTab === 'members' && (
              <MembersDuesView
                members={members}
                settings={settings}
                isAdmin={isAdmin}
                onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
                onToggleDuesMonth={handleToggleDuesMonth}
                onOpenAddMember={() => {
                  setEditingMember(null);
                  setIsMemberModalOpen(true);
                }}
                onEditMember={(m) => {
                  setEditingMember(m);
                  setIsMemberModalOpen(true);
                }}
                onDeleteMember={handleDeleteMember}
                onOpenWhatsAppReminder={(m) => setSelectedWaMember(m)}
                onBatchAddMembers={handleBatchAddMembers}
              />
            )}

            {activeTab === 'ai-audit' && (
              <AIAuditView
                transactions={transactions}
                members={members}
                settings={settings}
                onAddTransaction={(txData) => {
                  handleSaveTransaction(txData);
                }}
              />
            )}

            {activeTab === 'rab' && (
              <BudgetRABView
                budgets={budgets}
                transactions={transactions}
                onAddBudget={handleAddBudget}
                onDeleteBudget={handleDeleteBudget}
              />
            )}

            {activeTab === 'payment' && (
              <PaymentPortalView settings={settings} />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                isAdmin={isAdmin}
                onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
                onUpdateSettings={setSettings}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onResetSampleData={handleResetSampleData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* App Footer */}
      <footer className="bg-white/5 backdrop-blur-xl border-t border-white/10 py-6 text-center text-xs text-slate-400 z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-200">KasKita</span> • Transparansi Kas Berbasis Frosted Glass & AI
          </div>
          <div className="text-slate-500">
            Dikelola secara otomatis & terverifikasi untuk {settings.name}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={() => setIsAdmin(true)}
        currentPin={settings.adminPin || '262009'}
      />

      <StudentPaymentModal
        isOpen={isStudentPayOpen}
        onClose={() => setIsStudentPayOpen(false)}
        settings={settings}
        members={members}
        onAddTransaction={handleSaveTransaction}
        onAutoPayDuesMonth={handleToggleDuesMonth}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        initialTx={editingTx}
      />

      <ReceiptModal
        isOpen={!!selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
        transaction={selectedReceiptTx}
        settings={settings}
      />

      <WhatsAppReminderModal
        isOpen={!!selectedWaMember}
        onClose={() => setSelectedWaMember(null)}
        member={selectedWaMember}
        settings={settings}
      />

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
        initialMember={editingMember}
      />

      {/* Confirmation Modals */}
      {(() => {
        const targetTx = transactions.find((t) => t.id === deletingTxId);
        return (
          <ConfirmModal
            isOpen={!!deletingTxId}
            onClose={() => setDeletingTxId(null)}
            onConfirm={executeDeleteTransaction}
            title="Hapus Transaksi Kas"
            message="Apakah Anda yakin ingin menghapus catatan transaksi ini? Data transaksi akan dihapus secara permanen dari buku kas."
            details={
              targetTx ? (
                <div className="space-y-1 font-mono text-[11px]">
                  <div><strong className="text-white">Jenis:</strong> <span className={targetTx.type === 'pemasukan' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{targetTx.type.toUpperCase()}</span></div>
                  <div><strong className="text-white">Deskripsi:</strong> {targetTx.description}</div>
                  {targetTx.contributor && <div><strong className="text-white">Oleh/Penyetor:</strong> {targetTx.contributor}</div>}
                  <div><strong className="text-white">Jumlah:</strong> Rp {targetTx.amount.toLocaleString('id-ID')}</div>
                  <div><strong className="text-white">Tanggal:</strong> {targetTx.date}</div>
                </div>
              ) : null
            }
            confirmText="Ya, Hapus Transaksi"
          />
        );
      })()}

      {(() => {
        const targetMember = members.find((m) => m.id === deletingMemberId);
        return (
          <ConfirmModal
            isOpen={!!deletingMemberId}
            onClose={() => setDeletingMemberId(null)}
            onConfirm={executeDeleteMember}
            title="Hapus Anggota Kelas"
            message="Apakah Anda yakin ingin menghapus anggota ini dari daftar kas?"
            details={
              targetMember ? (
                <div className="space-y-1 text-[11px]">
                  <div><strong className="text-white">Nama:</strong> {targetMember.name}</div>
                  <div><strong className="text-white">Jabatan:</strong> {targetMember.role}</div>
                </div>
              ) : null
            }
            confirmText="Ya, Hapus Anggota"
          />
        );
      })()}

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={executeResetSampleData}
        title="Reset Data Kas"
        message="Apakah Anda yakin ingin mengosongkan / mereset seluruh data transaksi dan anggota kas?"
        confirmText="Ya, Reset Data"
      />

    </div>
  );
}
