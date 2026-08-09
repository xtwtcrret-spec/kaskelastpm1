import React, { useState } from 'react';
import { X, Users, UserPlus } from 'lucide-react';

interface BatchMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchAdd: (namesList: string[]) => void;
}

export const BatchMemberModal: React.FC<BatchMemberModalProps> = ({
  isOpen,
  onClose,
  onBatchAdd,
}) => {
  const [rawText, setRawText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const names = rawText
      .split('\n')
      .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim()) // remove leading numbering like 1. or 1)
      .filter((name) => name.length > 0);

    if (names.length === 0) return;

    onBatchAdd(names);
    setRawText('');
    onClose();
  };

  const parsedCount = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/10 text-white space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Input Banyak Nama Siswa Sekaligus</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Tempel (paste) daftar nama siswa kelas <strong>12 TPM 1</strong> (satu nama per baris). Sistem akan otomatis membuat data siswa dengan kas mulai dari Rp 0.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold">Daftar Nama Siswa (1 Nama Per Baris)</label>
              <span className="text-[11px] font-bold text-indigo-400">{parsedCount} Nama Terdeteksi</span>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Contoh:\n1. Adit Pratama\n2. Bintang Wijaya\n3. Candra Gunawan\n4. Denny Saputra\n5. Eka Maulana`}
              className="w-full p-3.5 rounded-2xl border border-white/10 bg-white/5 text-white font-sans placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 font-semibold hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={parsedCount === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Simpan {parsedCount} Siswa Kebagian Kas</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
