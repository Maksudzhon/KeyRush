import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, FastForward, Volume2, VolumeX, 
  X, Clock, Award, Target, Activity, Download, Share2, Sparkles, Flame, CheckCircle, AlertCircle
} from 'lucide-react';
import { RaceReplay, KeystrokeLog } from '../types';
import { playSwitchSound, playErrorSound, SwitchType } from '../utils/soundEngine';

interface RaceReplayModalProps {
  replay: RaceReplay;
  isOpen: boolean;
  onClose: () => void;
  soundType?: SwitchType;
  onTrySameText?: (text: string) => void;
}

export default function RaceReplayModal({
  replay,
  isOpen,
  onClose,
  soundType = 'mechanical',
  onTrySameText,
}: RaceReplayModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentMs, setCurrentMs] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalDurationMs = useMemo(() => {
    if (replay.elapsedMs && replay.elapsedMs > 0) return replay.elapsedMs;
    if (replay.keystrokes.length > 0) {
      return replay.keystrokes[replay.keystrokes.length - 1].timestampMs + 500;
    }
    return 10000;
  }, [replay]);

  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);
  const prevKeystrokeIndexRef = useRef<number>(-1);

  // Filter keystrokes up to currentMs
  const activeKeystrokes = useMemo(() => {
    return replay.keystrokes.filter((k) => k.timestampMs <= currentMs);
  }, [replay.keystrokes, currentMs]);

  // Derive user typed text at currentMs
  const currentTypedText = useMemo(() => {
    let text = '';
    for (const log of activeKeystrokes) {
      if (log.key === 'Backspace') {
        text = text.slice(0, -1);
      } else if (log.isCorrect) {
        text += log.key;
      }
    }
    return text;
  }, [activeKeystrokes]);

  // Compute live stats at currentMs
  const liveStats = useMemo(() => {
    const keystrokesCount = activeKeystrokes.length;
    const errorsCount = activeKeystrokes.filter((k) => !k.isCorrect).length;
    const correctKeystrokes = keystrokesCount - errorsCount;
    const accuracy = keystrokesCount > 0 ? Math.max(0, Math.round((correctKeystrokes / keystrokesCount) * 100)) : 100;

    let wpm = 0;
    if (currentMs >= 1000) {
      const minutes = currentMs / 60000;
      const words = currentTypedText.length / 5;
      wpm = Math.round(words / minutes);
    }

    return {
      wpm,
      accuracy,
      errorsCount,
      keystrokesCount,
    };
  }, [activeKeystrokes, currentTypedText, currentMs]);

  // Play sound effects as playback passes keystroke indices
  useEffect(() => {
    const currentIndex = activeKeystrokes.length - 1;
    if (currentIndex > prevKeystrokeIndexRef.current && !isMuted) {
      const lastKey = activeKeystrokes[currentIndex];
      if (lastKey) {
        if (!lastKey.isCorrect) {
          playErrorSound();
        } else {
          playSwitchSound(soundType);
        }
      }
    }
    prevKeystrokeIndexRef.current = currentIndex;
  }, [activeKeystrokes, isMuted, soundType]);

  // Replay Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      lastTickTimeRef.current = null;
      return;
    }

    const loop = (now: number) => {
      if (lastTickTimeRef.current === null) {
        lastTickTimeRef.current = now;
      }
      const delta = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;

      setCurrentMs((prev) => {
        const next = prev + delta * playbackSpeed;
        if (next >= totalDurationMs) {
          setIsPlaying(false);
          return totalDurationMs;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalDurationMs]);

  // Reset when replay object changes
  useEffect(() => {
    setCurrentMs(0);
    setIsPlaying(true);
    prevKeystrokeIndexRef.current = -1;
  }, [replay]);

  if (!isOpen) return null;

  const handleRestart = () => {
    setCurrentMs(0);
    setIsPlaying(true);
    prevKeystrokeIndexRef.current = -1;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentMs(val);
    if (val >= totalDurationMs) {
      setIsPlaying(false);
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(replay, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KeyRush_RaceReplay_${replay.date.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const text = `🏎️ KeyRush Race Replay\n⚡ Speed: ${replay.wpm} WPM | 🎯 Accuracy: ${replay.accuracy}%\nWatch my race replay: https://keyrush.io/replay/${replay.id}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPercent = Math.min(100, (currentMs / totalDurationMs) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Bar Header */}
          <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg text-white">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">Race Replay Mode</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {replay.language || 'EN'} • {replay.difficulty || 'Medium'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Recorded on {replay.date} • {replay.keystrokes.length} keystrokes logged
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Replay Body */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {/* Live Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-cyan-500/20 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Flame size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Live Speed</div>
                  <div className="text-xl font-mono font-extrabold text-cyan-300">{liveStats.wpm} <span className="text-xs font-normal text-cyan-400/70">WPM</span></div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-emerald-500/20 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Target size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Accuracy</div>
                  <div className="text-xl font-mono font-extrabold text-emerald-300">{liveStats.accuracy}%</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-rose-500/20 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Errors</div>
                  <div className="text-xl font-mono font-extrabold text-rose-300">{liveStats.errorsCount}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-indigo-500/20 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Elapsed</div>
                  <div className="text-xl font-mono font-extrabold text-indigo-300">
                    {(currentMs / 1000).toFixed(1)}s <span className="text-xs font-normal text-slate-500">/ {(totalDurationMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Replay Text Box */}
            <div className="relative p-5 rounded-2xl bg-slate-950 border border-slate-800 text-lg sm:text-2xl font-mono leading-relaxed tracking-wide min-h-[140px] break-words select-none">
              {replay.text.split('').map((char, index) => {
                const isTyped = index < currentTypedText.length;
                const isCurrent = index === currentTypedText.length;

                let charClass = 'text-slate-600';
                if (isTyped) {
                  charClass = 'text-emerald-400 font-bold';
                }

                return (
                  <span key={index} className={`relative transition-colors duration-75 ${charClass}`}>
                    {isCurrent && (
                      <span className="absolute left-0 top-[10%] bottom-[10%] w-[2.5px] bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee] z-10" />
                    )}
                    {char}
                  </span>
                );
              })}
            </div>

            {/* Video Player Style Controls */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              {/* Progress Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={totalDurationMs}
                  value={currentMs}
                  onChange={handleSeek}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{(currentMs / 1000).toFixed(2)}s</span>
                  <span className="text-cyan-400 font-bold">{Math.round(progressPercent)}%</span>
                  <span>{(totalDurationMs / 1000).toFixed(2)}s</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRestart}
                    title="Restart Replay"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-md transition-all"
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={16} />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Unmute Typing Audio' : 'Mute Typing Audio'}
                    className={`p-2 rounded-lg border transition-colors ${
                      isMuted ? 'bg-rose-950/40 border-rose-500/30 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>

                {/* Speed Selectors */}
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400 px-2">Speed:</span>
                  {[0.5, 1.0, 1.5, 2.0, 4.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                        playbackSpeed === speed
                          ? 'bg-cyan-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Keystroke History Log Stream Ticker */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
                <span>Keystroke Event Stream ({activeKeystrokes.length} / {replay.keystrokes.length})</span>
                <span className="text-cyan-400 text-[11px]">Real-time Timestamps</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
                {activeKeystrokes.slice(-12).map((k, i) => (
                  <div
                    key={i}
                    className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-xs font-mono flex flex-col items-center min-w-[54px] animate-fade-in ${
                      k.isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/50 text-rose-300 animate-pulse'
                    }`}
                  >
                    <span className="font-extrabold text-sm">{k.key === ' ' ? 'Space' : k.key}</span>
                    <span className="text-[9px] text-slate-400 font-normal">+{k.timestampMs}ms</span>
                  </div>
                ))}
                {activeKeystrokes.length === 0 && (
                  <span className="text-xs text-slate-500 font-mono italic">Start replay to watch keystrokes live...</span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
              >
                {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                <span>{copied ? 'Copied Stats!' : 'Share Replay'}</span>
              </button>
            </div>

            {onTrySameText && (
              <button
                onClick={() => {
                  onTrySameText(replay.text);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
              >
                <RotateCcw size={14} />
                <span>Practice Same Text Again</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
