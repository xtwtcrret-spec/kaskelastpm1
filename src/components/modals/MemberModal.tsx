import React, { useState, useEffect } from 'react';
import { Member } from '../../types';
import { X, UserPlus, Save } from 'lucide-react';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id' | 'duesPaidMonths'>, existingId?: string) => void;
  initialMember?: Member | null;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMember,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Anggota');
  const [avatar, setAvatar] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialMember) {
      setName(initialMember.name);
      setPhone(initialMember.phone);
      setRole(initialMember.role);
      setAvatar(initialMember.avatar);
    } else {
      setName('');
      setPhone('628');
      setRole('Anggota');
      setAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80');
    }
    setErrors({});
  }, [initialMember, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nama wajib diisi.';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Nama kelihatannya terlalu pendek, cek lagi.';
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Nomor WhatsApp wajib diisi.';
    } else if (!/^628\d{7,12}$/.test(cleanPhone)) {
      newErrors.phone = 'Format harus diawali 628, cuma angka, contoh: 628123456789.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    onSave(
      {
        name: name.trim(),
        phone: cleanPhone,
        role,
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        monthlyDuesAmount: 25000,
      },
      initialMember?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/10 text-white space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-base font-bold text-white">
            {initialMember ? 'Edit Anggota Kas' : 'Tambah Anggota Kas Baru'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-3 rounded-2xl border bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:bg-white/10 transition-all ${
                errors.name ? 'border-rose-500/60 focus:ring-rose-500' : 'border-white/10 focus:ring-indigo-500'
              }`}
              placeholder="e.g. Budi Santoso"
              required
            />
            {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Nomor WhatsApp (Format: 628...)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full p-3 rounded-2xl border bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:bg-white/10 transition-all ${
                errors.phone ? 'border-rose-500/60 focus:ring-rose-500' : 'border-white/10 focus:ring-indigo-500'
              }`}
              placeholder="628123456789"
              required
            />
            {errors.phone && <p className="text-rose-400 text-[11px] mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Jabatan / Peran</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Ketua" className="bg-slate-900">Ketua</option>
              <option value="Sekretaris" className="bg-slate-900">Sekretaris</option>
              <option value="Bendahara" className="bg-slate-900">Bendahara</option>
              <option value="Koordinator" className="bg-slate-900">Koordinator</option>
              <option value="Anggota" className="bg-slate-900">Anggota</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">URL Avatar Foto Profil</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 font-semibold hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Anggota</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
