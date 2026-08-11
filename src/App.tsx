import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Transaction, 
  Member, 
  BudgetItem, 
  OrganizationSettings,
  AuditLogEntry
} from './types';
import { 
  initialTransactions, 
  initialMembers, 
  initialBudgets, 
  initialSettings 
} from './data/initialData';
import { supabase, KAS_ROW_ID } from './lib/supabaseClient';
import { formatRupiah } from './utils/formatters';
import { computeMemberDuesLedger } from './utils/dues';
import { ToastContainer, ToastItem } from './components/ToastContainer';

// ID unik anti-tabrakan — sebelumnya pakai Date.now() doang, yang bisa
// menghasilkan ID SAMA kalau 2+ data dibuat dalam milidetik yang sama
// (misal nambah beberapa transaksi Rp 8.000 secara cepat berturut-turut).
// Efeknya: hapus/verifikasi satu transaksi ikut mempengaruhi transaksi lain
// yang ID-nya kebetulan sama.
const generateId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};


import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { MembersDuesView } from './components/MembersDuesView';
import { AIAuditView } from './components/AIAuditView';
import { BudgetRABView } from './components/BudgetRABView';
import { PaymentPortalView } from './components/PaymentPortalView';
import { SettingsView } from './components/SettingsView';
import { AuditLogView } from './components/AuditLogView';

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
  Settings as SettingsIcon,
  Sparkles,
  ShieldCheck,
  Menu,
  History,
} from 'lucide-react';

export default function App() {
  // Data kas kelas sekarang disimpan TERPUSAT di Supabase (bukan localStorage lagi),
  // supaya semua anak sekelas yang buka website ini lihat data yang SAMA.
  const [settings, setSettings] = useState<OrganizationSettings>(initialSettings);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [budgets, setBudgets] = useState<BudgetItem[]>(initialBudgets);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: ToastItem['type'] = 'success') => {
    const id = generateId('toast');
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Catat 1 baris riwayat perubahan (audit log), dilihat semua orang biar transparan
  const logAction = (action: string, detail: string) => {
    const entry: AuditLogEntry = {
      id: generateId('log'),
      timestamp: new Date().toISOString(),
      actor: isAdmin ? (loggedInAdminName || settings.treasurerName || 'Admin Bendahara') : 'Sistem',
      action,
      detail,
    };
    setAuditLog((prev) => [entry, ...prev].slice(0, 300)); // simpan maksimal 300 entri terakhir
  };

  const handleClearAuditLog = () => {
    setAuditLog([]);
    // Catat 1 entri baru setelah dibersihkan, biar tetap ada jejak transparansi kapan & oleh siapa log dikosongkan
    logAction('Bersihkan Log', 'Seluruh riwayat perubahan sebelumnya dikosongkan oleh Admin');
    showToast('Riwayat perubahan berhasil dibersihkan', 'success');
  };

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
        if (data.audit_log) setAuditLog(data.audit_log);
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
          if (data.audit_log) setAuditLog(data.audit_log);
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
          audit_log: auditLog,
          updated_at: new Date().toISOString(),
        })
        .eq('id', KAS_ROW_ID);
      if (error) {
        console.error('Gagal menyimpan data kas ke Supabase:', error);
        showToast('Gagal menyimpan perubahan ke database! Cek koneksi internet & coba lagi.', 'error');
      }
    }, 400); // debounce biar nggak spam request tiap ketikan
    return () => clearTimeout(timeout);
  }, [settings, members, transactions, budgets, auditLog]);


  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // RBAC Role State
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedInAdminName, setLoggedInAdminName] = useState<string>('');
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
    // Pengaman tambahan (selain di sisi tampilan): siswa biasa (non-admin) CUMA boleh
    // kirim transaksi lewat alur legit (StudentPaymentModal, yang selalu verified:false
    // & bukan edit). Nggak boleh langsung submit sebagai "Terverifikasi" atau edit transaksi lama,
    // walau ada tombol lain yang kelewatan belum dikunci UI-nya.
    if (!isAdmin && (editingTx || txData.verified)) {
      console.warn('Ditolak: hanya admin yang boleh menyimpan transaksi terverifikasi / mengedit transaksi.');
      return;
    }

    if (editingTx) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === editingTx.id ? { ...txData, id: editingTx.id } : t))
      );
      logAction(
        'Edit Transaksi',
        `${txData.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} "${txData.description}" diubah menjadi Rp ${txData.amount.toLocaleString('id-ID')}`
      );
      showToast('Transaksi berhasil diubah', 'success');
    } else {
      const newTx: Transaction = {
        ...txData,
        id: generateId('tx'),
      };
      setTransactions((prev) => [newTx, ...prev]);
      logAction(
        txData.type === 'pemasukan' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran',
        `"${txData.description}" sebesar Rp ${txData.amount.toLocaleString('id-ID')} (${txData.contributor})`
      );
      showToast(
        txData.type === 'pemasukan' ? 'Pemasukan berhasil dicatat' : 'Pengeluaran berhasil dicatat',
        'success'
      );
    }
    setEditingTx(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setDeletingTxId(id);
  };

  const executeDeleteTransaction = () => {
    if (!deletingTxId) return;
    const targetTx = transactions.find((t) => t.id === deletingTxId);
    const remainingTransactions = transactions.filter((t) => t.id !== deletingTxId);

    // Filter out transaction
    setTransactions(remainingTransactions);

    if (targetTx) {
      logAction(
        'Hapus Transaksi',
        `"${targetTx.description}" sebesar Rp ${targetTx.amount.toLocaleString('id-ID')} (${targetTx.contributor})`
      );
      showToast('Transaksi berhasil dihapus', 'success');
    }

    // Kalau transaksi yang dihapus itu terverifikasi & terkait iuran anggota,
    // hitung ulang status lunas semua bulan anggota itu (termasuk efek carry-over-nya).
    if (targetTx && targetTx.verified) {
      let targetMemberId = targetTx.memberId;
      if (!targetMemberId && targetTx.contributor) {
        const foundMember = members.find(
          (m) => m.name.toLowerCase().trim() === targetTx.contributor!.toLowerCase().trim()
        );
        if (foundMember) targetMemberId = foundMember.id;
      }

      if (targetMemberId) {
        const { paidMonths } = computeMemberDuesLedger(
          targetMemberId,
          remainingTransactions,
          members,
          settings.monthlyDuesStandard
        );
        setMembers((mPrev) =>
          mPrev.map((m) => (m.id === targetMemberId ? { ...m, duesPaidMonths: paidMonths } : m))
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

      // Resolve member if available (untuk update status lunas)
      let targetMemberId = targetTx.memberId;
      if (!targetMemberId && targetTx.contributor) {
        const foundMember = members.find(
          (m) => m.name.toLowerCase().trim() === targetTx.contributor.toLowerCase().trim()
        );
        if (foundMember) targetMemberId = foundMember.id;
      }

      const nextTransactions = prev.map((t) => (t.id === id ? { ...t, verified: nextVerified } : t));

      logAction(
        nextVerified ? 'Verifikasi Transaksi' : 'Batalkan Verifikasi',
        `"${targetTx.description}" sebesar Rp ${targetTx.amount.toLocaleString('id-ID')} (${targetTx.contributor})`
      );
      showToast(nextVerified ? 'Transaksi terverifikasi' : 'Verifikasi dibatalkan', 'success');

      if (targetMemberId) {
        // Hitung ulang status lunas SEMUA bulan untuk anggota ini pakai sistem ledger
        // (otomatis handle: bayar sebagian TIDAK langsung lunas, dan kelebihan bayar
        // di 1 bulan otomatis "nyicil" nutup bulan-bulan berikutnya).
        const { paidMonths } = computeMemberDuesLedger(
          targetMemberId,
          nextTransactions,
          members,
          settings.monthlyDuesStandard
        );

        setMembers((mPrev) =>
          mPrev.map((m) => (m.id === targetMemberId ? { ...m, duesPaidMonths: paidMonths } : m))
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
      logAction('Edit Siswa', `Data "${memberData.name}" diperbarui`);
      showToast('Data siswa berhasil diperbarui', 'success');
    } else {
      const newMember: Member = {
        ...memberData,
        id: generateId('m'),
        duesPaidMonths: [],
      };
      setMembers((prev) => [...prev, newMember]);
      logAction('Tambah Siswa', `"${memberData.name}" ditambahkan ke daftar anggota`);
      showToast(`"${memberData.name}" berhasil ditambahkan`, 'success');
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
      id: generateId('m'),
      name: name.trim(),
      phone: `6289654783${(100 + index).toString().padStart(3, '0')}`,
      role: index === 0 ? 'Ketua Kelas' : index === 1 ? 'Bendahara' : index === 2 ? 'Sekretaris' : 'Siswa',
      avatar: defaultAvatars[index % defaultAvatars.length],
      duesPaidMonths: [],
      monthlyDuesAmount: settings.monthlyDuesStandard || 20000,
    }));

    setMembers((prev) => [...prev, ...newMembers]);
    logAction('Batch Tambah Siswa', `${newMembers.length} siswa ditambahkan sekaligus`);
  };

  const handleDeleteMember = (id: string) => {
    setDeletingMemberId(id);
  };

  const executeDeleteMember = () => {
    if (deletingMemberId) {
      const targetMember = members.find((m) => m.id === deletingMemberId);
      setMembers((prev) => prev.filter((m) => m.id !== deletingMemberId));
      if (targetMember) {
        logAction('Hapus Siswa', `"${targetMember.name}" dihapus dari daftar anggota`);
        showToast(`"${targetMember.name}" dihapus dari daftar siswa`, 'info');
      }
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

        logAction(
          isPaid ? 'Batalkan Status Lunas (Manual)' : 'Tandai Lunas (Manual)',
          `Bulan ${monthKey} untuk "${m.name}"`
        );

        return { ...m, duesPaidMonths: updatedMonths };
      })
    );
  };

  // Budget Handlers
  const handleAddBudget = (budgetData: Omit<BudgetItem, 'id'>) => {
    const newBudget: BudgetItem = {
      ...budgetData,
      id: generateId('b'),
    };
    setBudgets((prev) => [...prev, newBudget]);
    logAction('Tambah Anggaran (RAB)', `"${budgetData.category}" sebesar Rp ${budgetData.allocatedAmount.toLocaleString('id-ID')}`);
    showToast(`Anggaran "${budgetData.category}" berhasil ditambahkan`, 'success');
  };

  const handleDeleteBudget = (id: string) => {
    const targetBudget = budgets.find((b) => b.id === id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    if (targetBudget) {
      logAction('Hapus Anggaran (RAB)', `"${targetBudget.category}" dihapus`);
      showToast(`Anggaran "${targetBudget.category}" dihapus`, 'info');
    }
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
          logAction('Import Backup', 'Data kas dipulihkan dari file backup JSON');
          showToast('Backup data berhasil di-import!', 'success');
        } catch (err) {
          showToast('File JSON backup tidak valid.', 'error');
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
  const pendingTxCount = transactions.filter((t) => !t.verified).length;
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'transactions', label: 'Buku Kas & Transaksi', icon: BookOpen, pendingCount: pendingTxCount },
    { id: 'members', label: 'Iuran Anggota', icon: Users },
    { id: 'ai-audit', label: 'AI Audit & Smart Parser', icon: Bot, badge: 'Gemini' },
    { id: 'rab', label: 'RAB Anggaran', icon: Target },
    { id: 'audit-log', label: 'Riwayat Perubahan', icon: History },
    { id: 'settings', label: 'Pengaturan', icon: SettingsIcon },
  ];

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans overflow-x-hidden">
        {/* Skeleton Header */}
        <div className="bg-slate-950/80 border-b border-white/5 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/5 animate-pulse" />
              <div className="space-y-2">
                <div className="w-40 sm:w-56 h-3.5 rounded-full bg-white/5 animate-pulse" />
                <div className="w-28 h-2.5 rounded-full bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-9 rounded-2xl bg-white/5 animate-pulse" />
              <div className="w-24 h-9 rounded-2xl bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton Nav */}
        <div className="flex gap-2 px-4 sm:px-6 py-3 border-b border-white/5 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-24 h-8 rounded-xl bg-white/5 animate-pulse flex-shrink-0" />
          ))}
        </div>

        {/* Skeleton Content Cards */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-white/5 animate-pulse" />
          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 border border-white/10 px-4 py-2.5 rounded-2xl shadow-xl">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-300 text-xs font-medium">Memuat data kas bersama...</p>
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
    <div className="min-h-screen bg-[#080b1f] text-slate-100 font-sans flex antialiased relative overflow-x-hidden selection:bg-blue-500 selection:text-white">

      {/* Background Ambient Gradient Orbs — tema navy/blue modern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,58,138,0.25),_transparent_60%)] pointer-events-none z-0" />
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-5%] left-[20%] w-[45%] h-[45%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-[40%] left-[-10%] w-[35%] h-[35%] bg-cyan-600/5 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Sidebar Navigation */}
      <Sidebar
        settings={settings}
        totalBalance={totalBalance}
        isAdmin={isAdmin}
        navTabs={navTabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={() => { setIsAdmin(false); setLoggedInAdminName(''); showToast('Berhasil logout', 'info'); }}
        onOpenStudentPay={() => setIsStudentPayOpen(true)}
        onOpenQRIS={() => setActiveTab('payment')}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Top Bar (hamburger + saldo ringkas) */}
      <div className="no-print lg:hidden sticky top-0 z-20 bg-[#0b1230]/90 backdrop-blur-2xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white cursor-pointer"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-widest text-blue-300/80 font-bold">Saldo Kas</p>
          <p className={`text-sm font-black ${totalBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatRupiah(totalBalance)}
          </p>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 min-w-0 lg:pl-72 w-full py-8 z-10">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
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
                transactions={transactions}
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
                isAdmin={isAdmin}
                onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
              />
            )}

            {activeTab === 'rab' && (
              <BudgetRABView
                budgets={budgets}
                transactions={transactions}
                onAddBudget={handleAddBudget}
                onDeleteBudget={handleDeleteBudget}
                isAdmin={isAdmin}
                onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
              />
            )}

            {activeTab === 'payment' && (
              <PaymentPortalView settings={settings} />
            )}

            {activeTab === 'audit-log' && (
              <AuditLogView
                auditLog={auditLog}
                isAdmin={isAdmin}
                onClearLog={handleClearAuditLog}
                onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
              />
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
        </div>
      </main>

      {/* App Footer */}
      <footer className="lg:ml-72 bg-white/5 backdrop-blur-xl border-t border-white/10 py-6 text-center text-xs text-slate-400 z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-slate-200">{settings.name}</span> • Transparansi Kas Berbasis Frosted Glass & AI
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
        onLoginSuccess={(adminName) => {
          setIsAdmin(true);
          setLoggedInAdminName(adminName);
          showToast(`Login berhasil sebagai ${adminName}`, 'success');
        }}
        currentPin={settings.adminPin || '262009'}
        admins={settings.admins || []}
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

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
