import React, { useState } from 'react';
import { X, Send, QrCode, CreditCard, Check, AlertCircle, Copy, Sparkles, Building2, User, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Member, OrganizationSettings, PaymentMethod, Transaction } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface StudentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OrganizationSettings;
  members: Member[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onAutoPayDuesMonth?: (memberId: string, monthKey: string) => void;
}

export const StudentPaymentModal: React.FC<StudentPaymentModalProps> = ({
  isOpen,
  onClose,
  settings,
  members,
  onAddTransaction,
  onAutoPayDuesMonth,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [customName, setCustomName] = useState('');
  const [amount, setAmount] = useState<number>(settings.monthlyDuesStandard || 20000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [forMonth, setForMonth] = useState('2026-08');
  const [notes, setNotes] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  if (!isOpen) return null;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(settings.bankAccountNo);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar (Maksimal 8MB). Silakan gunakan gambar lain.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedMember = members.find((m) => m.id === selectedMemberId);
    const studentName = selectedMember ? selectedMember.name : customName.trim() || 'Siswa Kelas 12 TPM 1';

    // 1. Create Transaction Entry with Pending status (verified: false) & proofImage
    onAddTransaction({
      type: 'pemasukan',
      amount: Number(amount),
      category: 'Iuran Anggota',
      description: `Bayar Kas ${forMonth ? `Bulan ${forMonth}` : ''} - ${studentName}`,
      contributor: studentName,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      verified: false, // Default to Pending until Admin verifies!
      notes: notes.trim() ? notes : undefined,
      receiptUrl: proofImage || undefined,
      memberId: selectedMember ? selectedMember.id : undefined,
      forMonth: forMonth || undefined,
    });

    setSubmittedSuccess(true);
  };

  const handleReset = () => {
    setSubmittedSuccess(false);
    setSelectedMemberId('');
    setCustomName('');
    setNotes('');
    setProofImage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-500/30 text-white space-y-4 my-8 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Konfirmasi & Setor Kas Digital</h3>
              <p className="text-[11px] text-slate-400">Bayar iuran kas siswa kelas 12 TPM 1</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[11px] mb-2">
                ⏳ Status: Pending Konfirmasi Admin
              </div>
              <h4 className="text-lg font-extrabold text-white">Setoran Kas Berhasil Dikirim!</h4>
              <p className="text-xs text-slate-300 max-w-xs mx-auto mt-1 leading-relaxed">
                Setoran kas Anda telah tercatat di sistem dengan status <strong className="text-amber-300">Pending Konfirmasi</strong>. Bendahara / Admin kelas akan memeriksa mutasi pembayaran dan mengonfirmasinya.
              </p>

              {proofImage && (
                <div className="mt-3 p-2 bg-slate-950/80 rounded-2xl border border-emerald-500/30 max-w-xs mx-auto">
                  <div className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center justify-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> Bukti Transfer Terlampir
                  </div>
                  <img src={proofImage} alt="Bukti Transfer" className="max-h-36 rounded-xl mx-auto object-cover border border-white/10" />
                </div>
              )}
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl transition shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95 text-xs"
            >
              Selesai & Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Account / Transfer Info Card */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-950/80 rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wider">
                Info Rekening / Transfer Bendahara
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">{settings.bankName}</div>
                  <div className="text-base font-mono font-black text-emerald-400 tracking-wider">
                    {settings.bankAccountNo}
                  </div>
                  <div className="text-[11px] text-slate-400">a.n {settings.bankAccountName}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBank ? 'Tersalin' : 'Salin Nomor'}</span>
                </button>
              </div>
            </div>

            {/* Select Student Name */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Pilih Nama Siswa / Pembayar *
              </label>
              {members.length > 0 ? (
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    if (e.target.value !== '') setCustomName('');
                  }}
                  className="w-full p-3 rounded-2xl border border-white/10 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">-- Pilih Nama Siswa dari Daftar Kelas --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              ) : null}

              {(!selectedMemberId || members.length === 0) && (
                <input
                  type="text"
                  required={!selectedMemberId}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ketik nama lengkap siswa..."
                  className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-2"
                />
              )}
            </div>

            {/* Amount & Month Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nominal Iuran (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Untuk Bulan *
                </label>
                <select
                  value={forMonth}
                  onChange={(e) => setForMonth(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-white/10 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="2026-08">Agustus 2026</option>
                  <option value="2026-09">September 2026</option>
                  <option value="2026-10">Oktober 2026</option>
                  <option value="2026-11">November 2026</option>
                  <option value="2026-12">Desember 2026</option>
                  <option value="2026-07">Juli 2026</option>
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['QRIS', 'Transfer Bank', 'e-Wallet (GoPay/OVO/Dana)', 'Tunai'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition cursor-pointer flex items-center justify-between ${
                      paymentMethod === method
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <span>{method}</span>
                    {paymentMethod === method && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Bukti Transfer (Foto / Screenshot) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Upload Bukti Transfer (Foto / Screenshot)
              </label>
              
              {proofImage ? (
                <div className="relative group rounded-2xl border border-emerald-500/40 bg-slate-950 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={proofImage} alt="Bukti Transfer" className="w-14 h-14 object-cover rounded-xl border border-white/10 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-emerald-400 font-bold block text-xs truncate">✓ Bukti Transfer Ter-upload</span>
                      <span className="text-[10px] text-slate-400 block truncate">Klik tombol hapus jika ingin mengganti foto</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProofImage(null)}
                    className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl border border-rose-500/30 cursor-pointer flex-shrink-0 transition"
                    title="Hapus Foto Bukti"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-white/20 hover:border-emerald-500/60 bg-white/5 hover:bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block text-xs">Pilih atau Drag Foto Bukti Transfer</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WebP (Maksimal 8MB)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Note / Proof message */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sudah ditransfer via GoPay jam 14:30"
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 font-semibold hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Setoran Kas ({formatRupiah(amount)})</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

