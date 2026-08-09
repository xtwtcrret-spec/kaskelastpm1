import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

// Backsound "lofi room" diambil dari live stream YouTube (Lofi Girl - lofi hip hop
// radio, beats to relax/study to) lewat YouTube IFrame Player API resmi.
// Player-nya disembunyikan secara visual (cuma audio yang kepake), video tetap
// jalan di background biar suaranya kedengeran.
const LOFI_VIDEO_ID = 'jfKfPfyJRdk';

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

export const AmbientSoundToggle: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-lofi-player-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, []);

  const ensurePlayer = async (): Promise<any> => {
    if (playerRef.current) return playerRef.current;

    setIsLoading(true);
    await loadYouTubeIframeAPI();

    return new Promise((resolve) => {
      const player = new window.YT.Player(containerId.current, {
        height: '0',
        width: '0',
        videoId: LOFI_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          loop: 1,
          playlist: LOFI_VIDEO_ID,
        },
        events: {
          onReady: () => {
            playerRef.current = player;
            setIsLoading(false);
            resolve(player);
          },
          onStateChange: (e: any) => {
            // 1 = playing, 2 = paused, 0 = ended
            if (e.data === 1) setIsPlaying(true);
            if (e.data === 2 || e.data === 0) setIsPlaying(false);
          },
        },
      });
    });
  };

  const toggle = async () => {
    if (isLoading) return;

    if (isPlaying && playerRef.current) {
      playerRef.current.pauseVideo();
      return;
    }

    const player = await ensurePlayer();
    try {
      player.setVolume(35); // volume lembut, nggak dominan
      player.playVideo();
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Player YouTube disembunyikan secara visual, tapi tetap perlu ada di DOM biar audio jalan */}
      <div id={containerId.current} className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true" />

      <button
        onClick={toggle}
        disabled={isLoading}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer border flex-shrink-0 ${
          isPlaying
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
        } ${isLoading ? 'opacity-60 cursor-wait' : ''}`}
        title={isPlaying ? 'Matikan backsound Lofi Room' : 'Nyalakan backsound Lofi Room (YouTube)'}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4" />
        )}
      </button>
    </>
  );
};
