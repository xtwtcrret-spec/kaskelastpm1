import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatTwoDigits(n: number): string {
  return n.toString().padStart(2, '0');
}

export const LiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateLabel = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const timeLabel = `${formatTwoDigits(now.getHours())}:${formatTwoDigits(now.getMinutes())}:${formatTwoDigits(now.getSeconds())}`;

  return (
    <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 border border-white/10 rounded-2xl px-3.5 py-1.5 shadow-lg shadow-black/30">
      <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30 flex-shrink-0">
        <Clock className="w-3.5 h-3.5" />
      </div>
      <div className="leading-tight">
        <div className="text-[10px] text-slate-400 font-medium">{dateLabel}</div>
        <div className="text-sm font-mono-tech font-bold text-cyan-300 tabular-nums">{timeLabel}</div>
      </div>
    </div>
  );
};
