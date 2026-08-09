export type TransactionType = 'pemasukan' | 'pengeluaran';

export type PaymentMethod = 
  | 'Tunai' 
  | 'Transfer Bank' 
  | 'QRIS' 
  | 'e-Wallet (GoPay/OVO/Dana)';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  contributor: string;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  receiptUrl?: string;
  verified: boolean;
  notes?: string;
  memberId?: string;
  forMonth?: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatar: string;
  duesPaidMonths: string[]; // Array of YYYY-MM strings, e.g., ["2026-01", "2026-02"]
  monthlyDuesAmount: number;
}

export interface BudgetItem {
  id: string;
  category: string;
  allocatedAmount: number;
  period: string;
}

export interface OrganizationSettings {
  name: string;
  tagline: string;
  monthlyDuesStandard: number;
  qrisImageUrl: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  treasurerName: string;
  treasurerPhone: string;
  adminPin?: string;
}

export interface AIAuditReport {
  healthScore: number;
  healthStatus: 'Sangat Sehat' | 'Sehat' | 'Perlu Perhatian' | 'Kritis' | string;
  summary: string;
  keyInsights: string[];
  anomaliesOrRisks: string[];
  recommendations: string[];
  projection3Month: string;
  generatedAt?: string;
}

export interface ParsedAINote {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  contributor: string;
  paymentMethod: PaymentMethod;
  date: string;
}

export interface AdminLoginLog {
  id: string;
  timestamp: string;
  status: 'Berhasil' | 'Gagal (PIN Salah)';
  deviceInfo: string;
  ipAddress?: string;
}

