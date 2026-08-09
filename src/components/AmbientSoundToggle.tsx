import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Loader2, AlertTriangle } from 'lucide-react';

// Backsound "lofi room" dari live stream YouTube (Lofi Girl - lofi hip hop radio,
// beats to relax/study to) lewat YouTube IFrame Player API resmi.
// Player disembunyikan secara visual, cuma audionya yang kepake.
const LOFI_VIDEO_ID = 'jfKfPfyJRdk';
const LOFI_WATCH_URL = `https://www.youtube.com/watch?v=${LOFI_VIDEO_ID}`;

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeIframeAPI(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const existingCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (existingCallback) existingCallback();
      resolve();
    };

    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });

  return ytApiPromise;
}

type PlayerStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'error';

export const AmbientSoundToggle: React.FC = () => {
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-lofi-player-${Math.random().toString(36).slice(2, 9)}`);

  // Siapkan player dari AWAL (begitu komponen muncul), bukan pas diklik.
  // Ini penting supaya waktu tombol diklik, playVideo() dipanggil LANGSUNG
  // secara sinkron di dalam event klik user — beberapa browser (terutama Safari/iOS)
  // menolak memutar audio kalau play() dipanggil setelah proses async/menunggu,
  // karena dianggap bukan lagi hasil aksi langsung dari user.
  useEffect(() => {
    let cancelled = false;

    loadYouTubeIframeAPI().then(() => {
      if (cancelled) return;
      const player = new window.YT.Player(containerId.current, {
        height: '0',
        width: '0',
        videoId: LOFI_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            playerRef.current = player;
            player.setVolume(35);
            setStatus('ready');
          },
          onStateChange: (e: any) => {
            if (cancelled) return;
            // 1 = playing, 2 = paused, 0 = ended (stream biasanya nggak pernah "ended", tapi jaga-jaga)
            if (e.data === 1) setStatus('playing');
            else if (e.data === 2 || e.data === 0) setStatus('paused');
          },
          onError: () => {
            if (cancelled) return;
            // Kode error umum: 101/150 = pemilik video mematikan izin embed di situs lain
            setStatus('error');
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, []);

  const toggle = () => {
    if (status === 'error') {
      // Fallback: kalau embed diblokir, buka langsung di YouTube di tab baru
      window.open(LOFI_WATCH_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    if (status === 'loading') return;

    const player = playerRef.current;
    if (!player) return;

    // Panggilan playVideo/pauseVideo di sini SINKRON (langsung, nggak lewat await),
    // supaya browser tetap menganggapnya sebagai aksi langsung dari klik user.
    if (status === 'playing') {
      player.pauseVideo();
    } else {
      player.unMute();
      player.playVideo();
    }
  };

  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';
  const isError = status === 'error';

  return (
    <>
      <div id={containerId.current} className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true" />

      <button
        onClick={toggle}
        disabled={isLoading}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer border flex-shrink-0 ${
          isPlaying
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : isError
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
        } ${isLoading ? 'opacity-60 cursor-wait' : ''}`}
        title={
          isError
            ? 'Backsound nggak bisa diputar langsung di sini — klik untuk buka di YouTube'
            : isPlaying
            ? 'Matikan backsound Lofi Room'
            : 'Nyalakan backsound Lofi Room (YouTube)'
        }
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isError ? (
          <AlertTriangle className="w-4 h-4" />
        ) : isPlaying ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </button>
    </>
  );
};
