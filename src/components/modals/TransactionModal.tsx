import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMethod } from '../../types';
import { X, Plus, Save, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  initialTx?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTx,
}) => {
  const [type, setType] = useState<TransactionType>('pemasukan');
  const [amount, setAmount] = useState<number>(50000);
  const [category, setCategory] = useState<string>('Iuran Anggota');
  const [description, setDescription] = useState<string>('');
  const [contributor, setContributor] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer Bank');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [verified, setVerified] = useState<boolean>(true);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialTx) {
      setType(initialTx.type);
      setAmount(initialTx.amount);
      setCategory(initialTx.category);
      setDescription(initialTx.description);
      setContributor(initialTx.contributor);
      setPaymentMethod(initialTx.paymentMethod);
      setDate(initialTx.date);
      setVerified(initialTx.verified);
      setReceiptUrl(initialTx.receiptUrl || null);
    } else {
      setType('pemasukan');
      setAmount(50000);
      setCategory('Iuran Anggota');
      setDescription('');
      setContributor('');
      setPaymentMethod('Transfer Bank');
      setDate(new Date().toISOString().split('T')[0]);
      setVerified(true);
      setReceiptUrl(null);
    }
    setErrors({});
  }, [initialTx, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar (Maksimal 8MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Deskripsi wajib diisi.';
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Nominal harus lebih dari Rp 0.';
    } else if (amount > 500000000) {
      newErrors.amount = 'Nominal kelihatannya kebesaran, cek lagi angkanya (maks Rp 500.000.000).';
    }

    if (!date) {
      newErrors.date = 'Tanggal wajib diisi.';
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const maxFutureDate = new Date();
      maxFutureDate.setDate(maxFutureDate.getDate() + 1);
      maxFutureDate.setHours(23, 59, 59, 999);
      if (selectedDate > maxFutureDate) {
        newErrors.date = 'Tanggal nggak boleh jauh di masa depan.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    onSave({
      type,
      amount,
      category,
      description: description.trim(),
      contributor: contributor.trim() || 'Pengurus',
      paymentMethod,
      date,
      verified,
      receiptUrl: receiptUrl || undefined,
    });

    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/10 text-white space-y-4 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">
            {initialTx ? 'Edit Transaksi Kas' : 'Pencatatan Transaksi Kas Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Type Toggle */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Jenis Transaksi</label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setType('pemasukan');
                  setCategory('Iuran Anggota');
                }}
                className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                  type === 'pemasukan'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pemasukan (+)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('pengeluaran');
                  setCategory('Konsumsi & Acara');
                }}
                className={`py-2 rounded-xl font-bold transition cursor-pointer ${
                  type === 'pengeluaran'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pengeluaran (-)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Amount */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Nominal (Rp)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={`w-full p-3 rounded-2xl border bg-white/5 font-black text-emerald-400 text-sm focus:outline-none focus:ring-2 ${
                  errors.amount ? 'border-rose-500/60 focus:ring-rose-500' : 'border-white/10 focus:ring-indigo-500'
                }`}
                step={1000}
                required
              />
              {errors.amount && <p className="text-rose-400 text-[11px] mt-1">{errors.amount}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {type === 'pemasukan' ? (
                  <>
                    <option value="Iuran Anggota" className="bg-slate-900">Iuran Anggota</option>
                    <option value="Donasi/Sponsor" className="bg-slate-900">Donasi/Sponsor</option>
                    <option value="Bunga Bank/Cashback" className="bg-slate-900">Bunga Bank/Cashback</option>
                    <option value="Pemasukan Lainnya" className="bg-slate-900">Pemasukan Lainnya</option>
                  </>
                ) : (
                  <>
                    <option value="Konsumsi & Acara" className="bg-slate-900">Konsumsi & Acara</option>
                    <option value="Peralatan & ATK" className="bg-slate-900">Peralatan & ATK</option>
                    <option value="Operasional & Kebersihan" className="bg-slate-900">Operasional & Kebersihan</option>
                    <option value="Transportasi & Logistik" className="bg-slate-900">Transportasi & Logistik</option>
                    <option value="Kesehatan & Darurat" className="bg-slate-900">Kesehatan & Darurat</option>
                    <option value="Pengeluaran Lainnya" className="bg-slate-900">Pengeluaran Lainnya</option>
                  </>
                )}
              </select>
            </div>

          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Deskripsi Keterangan Transaksi</label>
            <input
              type="text"
              placeholder="e.g. Pembelian snack rapat evaluasi bulanan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full p-3 rounded-2xl border bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                errors.description ? 'border-rose-500/60 focus:ring-rose-500' : 'border-white/10 focus:ring-indigo-500'
              }`}
              required
            />
            {errors.description && <p className="text-rose-400 text-[11px] mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Contributor */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Penanggung Jawab / Donatur</label>
              <input
                type="text"
                placeholder="Nama Orang / Pihak"
                value={contributor}
                onChange={(e) => setContributor(e.target.value)}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Tunai" className="bg-slate-900">Tunai</option>
                <option value="Transfer Bank" className="bg-slate-900">Transfer Bank</option>
                <option value="QRIS" className="bg-slate-900">QRIS</option>
                <option value="e-Wallet (GoPay/OVO/Dana)" className="bg-slate-900">e-Wallet (GoPay/OVO/Dana)</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full p-3 rounded-2xl border bg-white/5 text-white focus:outline-none focus:ring-2 ${
                  errors.date ? 'border-rose-500/60 focus:ring-rose-500' : 'border-white/10 focus:ring-indigo-500'
                }`}
                required
              />
              {errors.date && <p className="text-rose-400 text-[11px] mt-1">{errors.date}</p>}
            </div>

            {/* Verified Checkbox */}
            <div className="flex items-center gap-2.5 pt-6">
              <input
                type="checkbox"
                id="verifiedCheck"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="verifiedCheck" className="text-slate-200 font-semibold cursor-pointer">
                Status Terverifikasi (Lunas/Disetujui)
              </label>
            </div>
          </div>

          {/* Proof Image / Foto Nota */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Foto Bukti Transfer / Nota Pengeluaran (Opsional)</label>
            {receiptUrl ? (
              <div className="relative group rounded-2xl border border-amber-500/40 bg-slate-950 p-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img src={receiptUrl} alt="Bukti Nota" className="w-12 h-12 object-cover rounded-xl border border-white/10 flex-shrink-0" />
                  <span className="text-amber-300 font-mono-tech text-xs truncate">✓ Foto Bukti Terlampir</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptUrl(null)}
                  className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl border border-rose-500/30 cursor-pointer flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border border-dashed border-white/20 hover:border-amber-500/50 bg-white/5 hover:bg-white/10 rounded-2xl p-3 flex items-center justify-center gap-2 cursor-pointer transition text-center">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300 text-xs font-semibold">Lampirkan Foto Bukti / Nota</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>


          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-400 font-semibold hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Transaksi</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
