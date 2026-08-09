import React, { useState } from 'react';
import { OrganizationSettings } from '../types';
import { Settings as SettingsIcon, Save, Download, Upload, RotateCcw, CheckCircle, Lock, ShieldAlert } from 'lucide-react';

interface SettingsViewProps {
  settings: OrganizationSettings;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onUpdateSettings: (newSettings: OrganizationSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSampleData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  isAdmin,
  onOpenAdminLogin,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetSampleData,
}) => {
  const [formData, setFormData] = useState<OrganizationSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onOpenAdminLogin();
      return;
    }
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-indigo-400" />
            Pengaturan & Konfigurasi Kelas 12 TPM 1
          </h2>
          <p className="text-xs text-slate-400">
            Konfigurasi nama kelas, iuran standar, nomor rekening, dan PIN Admin
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={onOpenAdminLogin}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95 flex-shrink-0"
          >
            <Lock className="w-4 h-4" />
            <span>Login Admin untuk Edit</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-amber-500/15 border border-amber-500/30 text-amber-200 p-4 rounded-3xl text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Mode Siswa (Lihat Saja):</strong> Anda dapat melihat informasi rekening dan iuran, tetapi membutuhkan Login Admin untuk mengubah pengaturan ini.
            </span>
          </div>
          <button
            onClick={onOpenAdminLogin}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-[11px] flex-shrink-0 cursor-pointer"
          >
            Login Admin
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>Pengaturan dan PIN Admin berhasil diperbarui!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-white/10">
            Profil & Identitas Kas
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Nama Organisasi / Kas</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Tagline / Deskripsi Singkat</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Iuran Bulanan Standar (Rp)</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={formData.monthlyDuesStandard}
                onChange={(e) => setFormData({ ...formData, monthlyDuesStandard: Number(e.target.value) })}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                step={5000}
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                PIN Admin / Bendahara {isAdmin ? '' : '(Rahasia)'}
              </label>
              {isAdmin ? (
                <input
                  type="text"
                  value={formData.adminPin || '262009'}
                  onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                  placeholder="PIN Keamanan Admin"
                  className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-indigo-300 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="w-full p-3 rounded-2xl border border-white/10 bg-slate-900/60 text-slate-400 font-mono font-bold flex items-center justify-between">
                  <span>••••••</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-sans font-medium">
                    Terproteksi (Hanya Admin)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bank & Treasurer Settings */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-white/10">
            Rekening Bank & Kontak Bendahara
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Nama Bank / e-Wallet</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Nomor Rekening / No. HP e-Wallet</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.bankAccountNo}
                onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Atas Nama Rekening</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.bankAccountName}
                onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Nama Bendahara & WhatsApp</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  disabled={!isAdmin}
                  placeholder="Nama Bendahara"
                  value={formData.treasurerName}
                  onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                />
                <input
                  type="text"
                  disabled={!isAdmin}
                  placeholder="Format 628..."
                  value={formData.treasurerPhone}
                  onChange={(e) => setFormData({ ...formData, treasurerPhone: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs px-6 py-3 rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-white/10 active:scale-95"
            >
              <Save className="w-4 h-4 text-emerald-600" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        )}

      </form>

      {/* Backup & Restore Data */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white pb-2 border-b border-white/10">
          Manajemen Data (Backup & Restore)
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-bold text-white block">Export Backup Data</span>
            <span className="text-slate-400">Unduh seluruh catatan transaksi, anggota, dan anggaran dalam file JSON.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExportBackup}
              className="bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON Backup</span>
            </button>

            {isAdmin && (
              <label className="bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={onImportBackup} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-rose-400 block">Reset Data</span>
              <span className="text-slate-400">Kosongkan data untuk memulai catatan kas dari nol.</span>
            </div>

            <button
              onClick={onResetSampleData}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold px-4 py-2 rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Data</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

