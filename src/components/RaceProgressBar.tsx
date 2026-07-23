import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Trophy, ShieldAlert, Zap } from 'lucide-react';
import { Player } from '../types';
import { THEME_STYLES } from '../types';

interface RaceProgressBarProps {
  players: Player[];
  selfId: string;
  totalLength: number;
  activeTheme?: keyof typeof THEME_STYLES;
}

export default function RaceProgressBar({ players, selfId, totalLength, activeTheme = 'carbon' }: RaceProgressBarProps) {
  const styles = THEME_STYLES[activeTheme] || THEME_STYLES['carbon'];
  const isLight = activeTheme === 'carbon-light' || activeTheme === 'sakura';

  // Sort players by progress desc, completed players first
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return b.progress - a.progress;
  });

  return (
    <div 
      id="race-track-board"
      className={`space-y-4 p-5 rounded-2xl border backdrop-blur-md ${styles.cardBg}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-sm font-semibold tracking-wider uppercase flex items-center gap-1.5 ${styles.cardTitle}`}>
          <Trophy size={14} className="text-amber-500 animate-pulse" />
          Racetrack Lanes
        </h3>
        <span className={`text-xs font-mono ${styles.mutedText}`}>
          Players: {players.length}
        </span>
      </div>

      <div className="space-y-3">
        {sortedPlayers.map((player) => {
          const isSelf = player.id === selfId;
          const progressPercent = totalLength > 0 
            ? Math.min(100, Math.round((player.progress / totalLength) * 100)) 
            : 0;

          // Check if player has warning/cheating suffix
          const isFlagged = player.name.includes('⚠️');

          return (
            <div
              key={player.id}
              id={`race-lane-${player.id}`}
              className={`relative p-3 rounded-xl transition-all duration-300 border ${
                isSelf
                  ? `${styles.accentBg} ${styles.accentBorder}`
                  : `${styles.subCardBg} ${styles.subCardBorder}`
              }`}
            >
              {/* Lane Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-2.5 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0 border border-black/10 shadow-sm" 
                    style={{ backgroundColor: player.color }}
                  />
                  <span className={`font-bold tracking-wide truncate max-w-[140px] sm:max-w-[200px] ${isSelf ? styles.accentText : styles.headerText}`}>
                    {player.name}
                  </span>
                  {isSelf && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${styles.accentBg} ${styles.accentText} border ${styles.accentBorder} shrink-0`}>
                      You
                    </span>
                  )}
                  {isFlagged && (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5 text-[10px] font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                      <ShieldAlert size={11} />
                      CAPPED
                    </span>
                  )}
                </div>

                <div className={`flex items-center gap-2.5 sm:gap-4 font-mono text-xs flex-wrap ${styles.mutedText}`}>
                  <span>
                    Progress: <strong className={`font-black ${styles.headerText}`}>{progressPercent}%</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap size={12} className="text-amber-500 shrink-0" />
                    Speed: <strong className={`font-black ${styles.headerText}`}>{player.wpm} WPM</strong>
                  </span>
                  {player.completed && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      ★ Finished
                    </span>
                  )}
                </div>
              </div>

              {/* Race Progress Bar Track */}
              <div className={`relative h-4 rounded-full overflow-hidden border ${isLight ? 'bg-slate-200 border-slate-300 shadow-inner' : 'bg-slate-950 border-slate-800 shadow-inner'}`}>
                {/* Visual Track Marks */}
                <div className="absolute inset-0 flex justify-between px-4 pointer-events-none opacity-20">
                  <div className={`h-full w-[1px] ${isLight ? 'bg-slate-400' : 'bg-slate-700'}`} />
                  <div className={`h-full w-[1px] ${isLight ? 'bg-slate-400' : 'bg-slate-700'}`} />
                  <div className={`h-full w-[1px] ${isLight ? 'bg-slate-400' : 'bg-slate-700'}`} />
                  <div className={`h-full w-[1px] ${isLight ? 'bg-slate-400' : 'bg-slate-700'}`} />
                  <div className={`h-full w-[1px] ${isLight ? 'bg-slate-400' : 'bg-slate-700'}`} />
                </div>

                {/* Glowing Progress Fill */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 rounded-full"
                  style={{
                    backgroundColor: player.color,
                    boxShadow: `0 0 12px ${player.color}90`,
                    transformOrigin: 'left center'
                  }}
                  initial={false}
                  animate={{ 
                    width: `${progressPercent}%`,
                  }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 90, 
                    damping: 18,
                    mass: 0.4
                  }}
                />

                {/* Sliding Racing Rocket/Car Indicator */}
                {progressPercent > 0 && (
                  <motion.div
                    className="absolute -translate-y-1/2 top-1/2 z-10 pointer-events-none"
                    initial={false}
                    animate={{ 
                      x: `calc(${progressPercent}% - 14px)`,
                      scale: player.completed ? 1.25 : 1
                    }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 90, 
                      damping: 18,
                      mass: 0.4
                    }}
                  >
                    <div 
                      className="p-1 rounded-full shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-110"
                      style={{ 
                        backgroundColor: player.color,
                        boxShadow: `0 0 14px ${player.color}`
                      }}
                    >
                      <Rocket size={10} className="text-white transform rotate-45" />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
