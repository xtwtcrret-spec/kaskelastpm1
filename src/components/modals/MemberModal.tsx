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
  }, [initialMember, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        name,
        phone,
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
              className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all"
              placeholder="e.g. Budi Santoso"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Nomor WhatsApp (Format: 628...)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all"
              placeholder="628123456789"
              required
            />
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
