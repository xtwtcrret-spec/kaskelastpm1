import React, { useState } from 'react';
import { OrganizationSettings } from '../types';
import { formatRupiah } from '../utils/formatters';
import { QrCode, Copy, Check, CreditCard, Building, User, Phone, Calculator, ExternalLink } from 'lucide-react';

interface PaymentPortalViewProps {
  settings: OrganizationSettings;
}

export const PaymentPortalView: React.FC<PaymentPortalViewProps> = ({ settings }) => {
  const [copiedBank, setCopiedBank] = useState(false);
  const [monthCount, setMonthCount] = useState<number>(1);

  const handleCopyBank = () => {
    navigator.clipboard.writeText(settings.bankAccountNo);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const calculatedTotal = monthCount * settings.monthlyDuesStandard;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <QrCode className="w-6 h-6 text-indigo-400" />
          Info Transfer Bank & QRIS Resmi Kas
        </h2>
        <p className="text-xs text-slate-400">
          Gunakan kanal pembayaran resmi berikut untuk menyetor iuran kas atau donasi ke bendahara
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: QRIS Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl p-6 flex flex-col items-center text-center space-y-4">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-emerald-500/20">
            QRIS Kas Digital
          </div>

          <div className="p-3 bg-white/10 border border-white/10 rounded-2xl shadow-inner w-56 h-56 flex items-center justify-center">
            <img
              src={settings.qrisImageUrl}
              alt="QRIS Code"
              className="w-full h-full object-cover rounded-xl shadow-md"
            />
          </div>

          <p className="text-xs text-slate-400 max-w-xs">
            Mendukung pembayaran via BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, LinkAja, & ShopeePay.
          </p>
        </div>

        {/* Col 2: Bank Transfer Details */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Rekening Bank Resmi
            </h3>

            {/* Bank Card */}
            <div className="bg-gradient-to-tr from-indigo-950/80 via-slate-900/90 to-purple-950/80 text-white rounded-2xl p-5 shadow-2xl border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">{settings.bankName}</span>
                <Building className="w-5 h-5 text-indigo-400" />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Nomor Rekening / Transfer</span>
                <div className="flex flex-wrap items-center justify-between gap-2 mt-0.5">
                  <span className="text-lg sm:text-xl font-mono font-bold tracking-widest text-white break-all">
                    {settings.bankAccountNo}
                  </span>
                  <button
                    onClick={handleCopyBank}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-md shadow-emerald-500/20"
                  >
                    {copiedBank ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBank ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Atas Nama:</span>
                <span className="font-bold text-white">{settings.bankAccountName}</span>
              </div>
            </div>
          </div>

          {/* Treasurer Contact */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-xs font-bold text-white block">Bendahara Penanggung Jawab:</span>
            <div className="text-xs text-slate-300 flex items-center justify-between">
              <span>{settings.treasurerName} ({settings.treasurerPhone})</span>
              <a
                href={`https://wa.me/${settings.treasurerPhone}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline font-bold inline-flex items-center gap-1"
              >
                Chat WA <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Col 3: Interactive Payment Calculator */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-xl p-6 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-purple-400" />
              Kalkulator Total Iuran
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Hitung total rupiah jika ingin menyetor iuran kas untuk beberapa bulan sekaligus.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Jumlah Bulan Pembayaran
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((num) => (
                    <button
                      key={num}
                      onClick={() => setMonthCount(num)}
                      className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        monthCount === num
                          ? 'bg-purple-500/30 text-white border-purple-500/50 shadow-lg shadow-purple-500/20'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {num} Bulan
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs text-purple-200">
                  <span>Iuran Per Bulan:</span>
                  <span className="font-semibold">{formatRupiah(settings.monthlyDuesStandard)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-purple-200">
                  <span>Periode:</span>
                  <span className="font-semibold">{monthCount} Bulan</span>
                </div>
                <div className="pt-2 border-t border-purple-500/30 flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-100">Total Nominal Setoran:</span>
                  <span className="text-lg font-black text-purple-300">
                    {formatRupiah(calculatedTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic text-center">
            Setiap pembayaran iuran akan langsung diverifikasi dan diterbitkan kuitansi resminya.
          </p>
        </div>

      </div>

    </div>
  );
};
