import { Transaction, Member, BudgetItem, OrganizationSettings } from '../types';

export const initialSettings: OrganizationSettings = {
  name: "Kas kelas 12 tpm 1",
  tagline: "Transparansi Uang Kas & Keuangan Kelas 12 TPM 1",
  monthlyDuesStandard: 20000,
  qrisImageUrl: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=500&auto=format&fit=crop&q=80",
  bankName: "DANA / GoPay / Bank Transfer",
  bankAccountNo: "0896-5478-3556",
  bankAccountName: "Bendahara Kelas 12 TPM 1",
  treasurerName: "Bendahara 12 TPM 1",
  treasurerPhone: "6289654783556",
  adminPin: "262009",
  admins: [],
};

export const initialMembers: Member[] = [];

export const initialTransactions: Transaction[] = [];

export const initialBudgets: BudgetItem[] = [];

