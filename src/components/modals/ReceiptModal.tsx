import React from 'react';
import { motion } from 'motion/react';
import { Transaction, OrganizationSettings } from '../../types';
import { formatRupiah, formatDateIndonesian } from '../../utils/formatters';
import { X, Printer, ShieldCheck, CheckCircle2, Building, QrCode, Image as ImageIcon } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  settings: OrganizationSettings;
}


export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  settings,
}) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const isVerified = transaction.verified;
  const receiptNo = `KWT-${transaction.date.replace(/-/g, '')}-${transaction.id.replace(/\D/g, '') || '01'}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/10 text-white space-y-6 my-8"
      >
        
        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className={`bg-slate-950/90 border-2 ${isVerified ? 'border-indigo-500/30' : 'border-amber-500/40'} rounded-2xl p-6 relative space-y-5 text-white shadow-2xl overflow-hidden`}>
          
          {/* Watermark stamp */}
          <div className="absolute right-4 bottom-12 opacity-20 pointer-events-none transform -rotate-12 select-none">
            {isVerified ? (
              <div className="border-4 border-emerald-400 text-emerald-400 font-black text-2xl px-4 py-2 rounded-xl text-center tracking-wider">
                LUNAS / VERIFIED<br />KASKITA
              </div>
            ) : (
              <div className="border-4 border-amber-400 text-amber-400 font-black text-xl px-3 py-2 rounded-xl text-center tracking-wider">
                PENDING / UNVERIFIED<br />BELUM LUNAS
              </div>
            )}
          </div>

          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white text-base">
                <ShieldCheck className={`w-5 h-5 ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span>{settings.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{settings.tagline}</p>
            </div>

            <div className="text-right">
              <span className={`text-xs font-black uppercase tracking-wider block ${
                isVerified ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {isVerified ? 'KUITANSI DIGITAL RESMI' : 'BUKTI SETOR (PENDING)'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">No: {receiptNo}</span>
            </div>
          </div>

          {/* Body Fields */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-dashed border-white/10">
              <span className="text-slate-400">Tanggal Transaksi:</span>
              <span className="font-bold text-white">{formatDateIndonesian(transaction.date)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-dashed border-white/10">
              <span className="text-slate-400">Tipe Transaksi:</span>
              <span className={`font-bold uppercase ${
                transaction.type === 'pemasukan' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {transaction.type === 'pemasukan' ? 'Pemasukan (Terima Dari)' : 'Pengeluaran (Dibayar Kepada)'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-dashed border-white/10">
              <span className="text-slate-400">Nama Pihak / Donatur:</span>
              <span className="font-bold text-white">{transaction.contributor}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-dashed border-white/10">
              <span className="text-slate-400">Kategori Kas:</span>
              <span className="font-semibold text-slate-200">{transaction.category}</span>
            </div>

            <div className="py-2 border-b border-dashed border-white/10">
              <span className="text-slate-400 block mb-1">Untuk Pembayaran / Keperluan:</span>
              <p className="font-medium text-white italic bg-white/5 p-2.5 rounded-xl border border-white/10">
                "{transaction.description}"
              </p>
            </div>

            <div className="flex justify-between py-1 border-b border-dashed border-white/10">
              <span className="text-slate-400">Metode Pembayaran:</span>
              <span className="font-semibold text-slate-200">{transaction.paymentMethod}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-dashed border-white/10">
              <span className="text-slate-400">Status Verifikasi:</span>
              {isVerified ? (
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi / LUNAS
                </span>
              ) : (
                <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  ⏳ Pending (Belum Dikonfirmasi Admin)
                </span>
              )}
            </div>

            {/* Total Amount Banner */}
            <div className={`p-3.5 rounded-2xl flex items-center justify-between shadow-lg border ${
              isVerified
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
                : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block">JUMLAH NOMINAL:</span>
                {!isVerified && (
                  <span className="text-[9px] text-amber-300 font-medium">*Belum masuk total saldo resmi</span>
                )}
              </div>
              <span className={`text-lg font-black ${isVerified ? 'text-emerald-300' : 'text-amber-300'}`}>
                {formatRupiah(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-4 flex items-end justify-between text-[11px] text-slate-300">
            <div>
              {isVerified ? (
                <>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi Otomatis
                  </div>
                  <p className="text-[9px] text-slate-500">Sistem Keuangan KasKita</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px]">
                    ⏳ Menunggu Konfirmasi Bendahara
                  </div>
                  <p className="text-[9px] text-slate-500">Status: Belum Sah / Pending</p>
                </>
              )}
            </div>

            <div className="text-center">
              <p className="text-[10px] text-slate-400">Bendahara Kas,</p>
              <div className="my-2 border-b border-white/20 w-28 mx-auto py-2 font-bold text-white">
                {settings.treasurerName}
              </div>
              <p className="text-[9px] text-slate-500">
                {isVerified ? 'Sah & Valid Digital' : 'Menunggu Tanda Tangan/ATC'}
              </p>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 cursor-pointer"
          >
            Tutup
          </button>

          <button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Download Kuitansi</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
