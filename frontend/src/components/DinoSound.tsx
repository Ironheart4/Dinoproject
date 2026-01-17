// DinoSound.tsx — Play dinosaur roars and audio samples
// Notes:
// - Loads audio via the HTMLAudioElement and exposes play/pause, progress and volume
// - Props: src (audio URL), label (for accessibility), className
// - Handles crossOrigin and network errors gracefully and provides UI fallbacks
import React, { useEffect, useRef, useState } from "react";
import { VolumeX, Volume1, Volume2, Dna, Loader2, XCircle } from "lucide-react";

type Props = {
  src: string | null | undefined;
  className?: string;
  label?: string;
};

// Sound wave bars animation component
function SoundWave({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1 bg-white rounded-full transition-all duration-100 ${
            isPlaying ? 'animate-soundwave' : 'h-1'
          }`}
          style={{
            animationDelay: isPlaying ? `${i * 0.1}s` : '0s',
            height: isPlaying ? undefined : '4px',
          }}
        />
      ))}
    </div>
  );
}

export default function DinoSound({ src, className = "", label = "Dinosaur Roar" }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!src || src === "DEV_PENDING" || !src.startsWith("http")) {
      return;
    }

    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = volume;
    
    // Try loading with src directly - crossOrigin can cause issues
    audio.src = src;
    audioRef.current = audio;
    
    // Log for debugging
    console.log('Loading audio from:', src);

    const onCanPlay = () => setLoaded(true);
    const onError = () => setError(true);
    const onEnded = () => setPlaying(false);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);

    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.pause();
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleToggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  };

  // Format time as mm:ss
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // No sound available
  if (!src || src === "DEV_PENDING" || !src.startsWith("http")) {
    return (
      <div className={`${className} p-4 bg-gray-800 rounded-lg`}>
        <div className="text-gray-400 text-sm flex items-center gap-2">
          <VolumeX size={20} />
          <span>Sound not available yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-4 bg-gray-800 rounded-lg`}>
      <div className="flex items-center gap-4">
        {/* Play/Pause Button with Sound Wave */}
        <button
          onClick={handleToggle}
          disabled={!loaded && !error}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            playing
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
          aria-label={label}
        >
          {playing ? (
            <SoundWave isPlaying={true} />
          ) : (
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <div className="flex-1">
          {/* Label */}
          <div className="text-white font-medium text-sm mb-1 flex items-center gap-1">
            <Dna size={14} className="text-green-400" /> {label}
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-10">{formatTime(currentTime)}</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2 cursor-pointer"
              onClick={(e) => {
                if (audioRef.current && duration > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  audioRef.current.currentTime = percent * duration;
                }
              }}
            >
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{volume > 0.5 ? <Volume2 size={20} /> : volume > 0 ? <Volume1 size={20} /> : <VolumeX size={20} />}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 accent-green-500"
            aria-label="Volume"
          />
        </div>
      </div>

      {!loaded && !error && (
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" /> Loading audio...
        </p>
      )}
      {loaded && !error && (
        <p className="text-xs text-gray-400 mt-2">🎧 Best experienced with headphones</p>
      )}
      {error && (
        <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><XCircle size={12} /> Failed to load audio</p>
      )}
    </div>
  );
}
