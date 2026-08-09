import React, { useState } from 'react';
import { Member, OrganizationSettings } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { X, Send, Copy, Check, MessageSquare } from 'lucide-react';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  settings: OrganizationSettings;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  member,
  settings,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !member) return null;

  const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());

  const messageText = `Halo ${member.name},
Izin mengingatkan untuk pembayaran iuran kas *${settings.name}* bulan *${monthName}* sebesar *${formatRupiah(settings.monthlyDuesStandard)}*.

Pembayaran dapat ditransfer melalui:
🏦 *${settings.bankName}*: ${settings.bankAccountNo} (a.n. ${settings.bankAccountName})
📱 Atau via QRIS KasKita.

Mohon konfirmasi jika sudah melakukan transfer. Terima kasih banyak atas partisipasinya! 🙏✨`;

  const encodedMessage = encodeURIComponent(messageText);
  const cleanPhone = member.phone.replace(/\D/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/10 text-white space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Tagih Iuran via WhatsApp</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
            <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-white/20" />
            <div>
              <div className="font-bold text-white">{member.name}</div>
              <div className="text-slate-400">{member.phone} • {member.role}</div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Preview Pesan Penagihan</label>
            <textarea
              rows={7}
              readOnly
              value={messageText}
              className="w-full text-xs p-3 rounded-2xl border border-white/10 bg-white/5 text-slate-200 font-sans leading-relaxed focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleCopyText}
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-white/5 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Teks Tersalin!' : 'Salin Teks'}</span>
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Pesan WA</span>
          </a>
        </div>

      </div>
    </div>
  );
};
