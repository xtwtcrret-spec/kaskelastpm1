import React, { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Backsound ambient dibuat langsung lewat Web Audio API (bukan file MP3),
// jadi nggak butuh hosting file eksternal / masalah hak cipta.
// Beberapa nada lembut (chord pad) + sedikit gerakan volume pelan biar berasa "hidup" tapi tetap tenang.

const CHORD_FREQUENCIES = [130.81, 164.81, 196.0, 261.63]; // C3, E3, G3, C4 (C major, lembut & netral)

export const AmbientSoundToggle: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode }[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);

  const start = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;
    // Fade in pelan-pelan biar nggak kaget
    masterGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2.5);

    const nodes = CHORD_FREQUENCIES.map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 1 / CHORD_FREQUENCIES.length;

      // LFO pelan untuk bikin volume tiap nada naik-turun halus (efek "napas")
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + i * 0.015; // beda-beda dikit tiap nada biar nggak monoton
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start();
      lfo.start();

      return { osc, gain, lfo, lfoGain };
    });

    nodesRef.current = nodes;
    setIsPlaying(true);
  };

  const stop = () => {
    const ctx = audioCtxRef.current;
    const masterGain = masterGainRef.current;
    if (ctx && masterGain) {
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      setTimeout(() => {
        nodesRef.current.forEach(({ osc, lfo }) => {
          osc.stop();
          lfo.stop();
        });
        nodesRef.current = [];
        ctx.close();
        audioCtxRef.current = null;
        masterGainRef.current = null;
      }, 1100);
    }
    setIsPlaying(false);
  };

  const toggle = () => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  };

  return (
    <button
      onClick={toggle}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer border flex-shrink-0 ${
        isPlaying
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
      }`}
      title={isPlaying ? 'Matikan backsound tenang' : 'Nyalakan backsound tenang'}
    >
      {isPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
};
