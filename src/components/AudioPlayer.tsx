"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Square, Volume2, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface AudioPlayerProps {
  text: string;
  title?: string;
  className?: string;
  onClose?: () => void;
  language?: string;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5];

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function AudioPlayer({
  text,
  title,
  className = "",
  language: propLanguage,
}: AudioPlayerProps) {
  const { language: contextLanguage, t } = useTranslation();
  const effectiveLanguage = propLanguage || contextLanguage;
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // If text or language changes, reset active audio so we don't play stale language audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setAudioUrl(null);
    setCurrentTime(0);
    setDuration(0);
    setErrorMsg(null);
  }, [text, effectiveLanguage]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Fetch synthesized audio on demand (NO autoplay on page load)
  const fetchAudio = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language: effectiveLanguage,
          speed,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.audioUrl) {
        throw new Error(data.error || t("culturalHeritage.ttsUnavailable"));
      }

      setAudioUrl(data.audioUrl);
      return data.audioUrl;
    } catch (err: any) {
      const msg = err.message || t("culturalHeritage.ttsUnavailable");
      setErrorMsg(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [text, effectiveLanguage, speed, t]);

  const handlePlayPause = async () => {
    setErrorMsg(null);

    // If audio element already exists and has source
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          audioRef.current.playbackRate = speed;
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.error("Playback error:", e);
        }
      }
      return;
    }

    // First time clicking Play -> generate audio
    const url = await fetchAudio();
    if (!url) return;

    // Create / load audio element
    if (!audioRef.current) {
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration || 0);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setErrorMsg(t("culturalHeritage.ttsUnavailable"));
      };
    } else {
      audioRef.current.src = url;
    }

    try {
      audioRef.current.playbackRate = speed;
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`bg-white/95 backdrop-blur-md border border-[var(--light-sage)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 ${className}`}
    >
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--sage)] text-[var(--forest)] flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--charcoal)] leading-tight">
              {title || t("culturalHeritage.badge")}
            </h4>
            <span className="text-[10px] font-medium text-[var(--slate)]">
              {isPlaying ? "Playing narration" : "Audio narration"}
            </span>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[var(--cream)] p-1 rounded-lg border border-[var(--light-sage)]">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSpeedChange(s)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                speed === s
                  ? "bg-[var(--forest)] text-white shadow-2xs"
                  : "text-[var(--slate)] hover:text-[var(--charcoal)]"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-[var(--error)] bg-[var(--error-bg)] px-3 py-2 rounded-xl border border-[var(--error)]/20 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Controls & Progress */}
      <div className="space-y-2">
        {/* Progress Bar */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-[var(--slate)] w-10 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!audioUrl || loading}
              className="w-full h-1.5 bg-[var(--light-sage)] rounded-lg appearance-none cursor-pointer accent-[var(--forest)] disabled:opacity-40"
              style={{
                background: `linear-gradient(to right, var(--forest) 0%, var(--forest) ${progressPercent}%, var(--light-sage) ${progressPercent}%, var(--light-sage) 100%)`,
              }}
            />
          </div>
          <span className="text-[11px] font-mono text-[var(--slate)] w-10 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={loading}
              className="btn-primary text-xs py-1.5 px-4 flex items-center gap-2 font-bold shadow-2xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing Voice...
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Listen
                </>
              )}
            </button>

            {(isPlaying || currentTime > 0) && (
              <button
                type="button"
                onClick={handleStop}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-[var(--slate)] hover:text-[var(--error)]"
                title="Stop Audio"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            )}
          </div>

          <span className="text-[11px] text-[var(--slate)] font-medium">
            Native Regional Audio
          </span>
        </div>
      </div>
    </div>
  );
}
