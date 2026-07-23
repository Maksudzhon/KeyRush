import React, { useState } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  Keyboard, 
  CheckCircle2, 
  Target, 
  Flame, 
  Zap, 
  BarChart2, 
  Lightbulb
} from 'lucide-react';
import { THEME_STYLES } from '../types';

interface TroubleshootSectionProps {
  errorHeatmap: Record<string, number>;
  totalErrors?: number;
  activeTheme?: string;
  title?: string;
  subtitle?: string;
}

// Standard keyboard row representation for the visual heatmap keyboard
const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

export default function TroubleshootSection({
  errorHeatmap = {},
  totalErrors,
  activeTheme = 'carbon',
  title = "Troubleshoot & Key Accuracy Analytics",
  subtitle = "Character frequency heatmap highlighting which keys are typed incorrectly most often."
}: TroubleshootSectionProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'keyboard'>('cards');
  const [selectedKeyTip, setSelectedKeyTip] = useState<string | null>(null);

  const theme = THEME_STYLES[activeTheme] || THEME_STYLES['carbon'];

  const heatmapEntries = Object.entries(errorHeatmap).sort((a, b) => b[1] - a[1]);
  
  const computedTotalErrors = totalErrors !== undefined 
    ? totalErrors 
    : heatmapEntries.reduce((acc, [_, count]) => acc + count, 0);

  const maxErrorCount = heatmapEntries.length > 0 ? Math.max(...heatmapEntries.map(([_, c]) => c)) : 1;

  // Format key label for display
  const formatKeyName = (key: string) => {
    if (key === ' ') return 'Space';
    if (key === '\n' || key === 'Enter') return 'Enter';
    if (key === '\t' || key === 'Tab') return 'Tab';
    return key;
  };

  // Get intensity color class
  const getIntensityClass = (count: number) => {
    const ratio = count / maxErrorCount;
    if (ratio >= 0.7 || count >= 5) {
      return {
        bg: 'bg-rose-500/15 border-rose-500/40 hover:border-rose-500',
        badge: 'bg-rose-500/30 text-rose-400 border-rose-500/50',
        bar: 'bg-gradient-to-r from-rose-600 to-rose-400',
        level: 'Critical Mistake Zone'
      };
    }
    if (ratio >= 0.35 || count >= 3) {
      return {
        bg: 'bg-amber-500/15 border-amber-500/40 hover:border-amber-500',
        badge: 'bg-amber-500/30 text-amber-400 border-amber-500/50',
        bar: 'bg-gradient-to-r from-amber-600 to-amber-400',
        level: 'Moderate Error Frequency'
      };
    }
    return {
      bg: `${theme.subCardBg} ${theme.subCardBorder} hover:border-cyan-500/60`,
      badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      bar: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
      level: 'Low Typo Frequency'
    };
  };

  // Top weak keys for actionable advice
  const topWeakKeys = heatmapEntries.slice(0, 3);

  return (
    <div id="troubleshoot-section" className={`p-5 md:p-6 rounded-2xl border backdrop-blur-md space-y-5 transition-all ${theme.cardBg}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b ${theme.subCardBorder} pb-4`}>
        <div>
          <div className="flex items-center gap-2">
            <Wrench size={18} className="text-amber-400 animate-pulse" />
            <h3 className={`text-sm md:text-base font-bold uppercase tracking-wider ${theme.headerText}`}>
              {title}
            </h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
              <Flame size={10} className="text-amber-400" />
              HEATMAP
            </span>
          </div>
          <p className={`text-xs ${theme.mutedText} mt-1`}>
            {subtitle}
          </p>
        </div>

        {/* View Switcher Controls */}
        {heatmapEntries.length > 0 && (
          <div className={`flex items-center gap-1 p-1 ${theme.subCardBg} border ${theme.subCardBorder} rounded-xl text-xs font-mono font-bold self-end sm:self-auto`}>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? `${theme.buttonAccent} shadow-md font-extrabold`
                  : `${theme.mutedText} hover:${theme.headerText}`
              }`}
            >
              <BarChart2 size={13} />
              Frequency List
            </button>
            <button
              onClick={() => setViewMode('keyboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'keyboard'
                  ? `${theme.buttonAccent} shadow-md font-extrabold`
                  : `${theme.mutedText} hover:${theme.headerText}`
              }`}
            >
              <Keyboard size={13} />
              Keyboard View
            </button>
          </div>
        )}
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3 rounded-xl border ${theme.subCardBg} ${theme.subCardBorder}`}>
          <span className={`text-[10px] uppercase font-bold ${theme.mutedText} block mb-1 flex items-center gap-1`}>
            <AlertTriangle size={12} className="text-rose-400" />
            Total Missed Keys
          </span>
          <span className="text-xl font-mono font-black text-rose-400">
            {computedTotalErrors}
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${theme.subCardBg} ${theme.subCardBorder}`}>
          <span className={`text-[10px] uppercase font-bold ${theme.mutedText} block mb-1 flex items-center gap-1`}>
            <Target size={12} className="text-amber-400" />
            Unique Error Keys
          </span>
          <span className="text-xl font-mono font-black text-amber-400">
            {heatmapEntries.length}
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${theme.subCardBg} ${theme.subCardBorder}`}>
          <span className={`text-[10px] uppercase font-bold ${theme.mutedText} block mb-1 flex items-center gap-1`}>
            <Flame size={12} className="text-rose-500" />
            Top Error Character
          </span>
          <span className={`text-xl font-mono font-black ${theme.headerText}`}>
            {heatmapEntries.length > 0 ? (
              <span className="text-rose-400 font-bold">
                '{formatKeyName(heatmapEntries[0][0])}' ({heatmapEntries[0][1]}x)
              </span>
            ) : (
              <span className="text-emerald-400 text-sm font-sans font-semibold">None</span>
            )}
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${theme.subCardBg} ${theme.subCardBorder}`}>
          <span className={`text-[10px] uppercase font-bold ${theme.mutedText} block mb-1 flex items-center gap-1`}>
            <Zap size={12} className="text-cyan-400" />
            Typo Frequency Index
          </span>
          <span className="text-xl font-mono font-black text-cyan-400">
            {computedTotalErrors > 0 && heatmapEntries.length > 0
              ? `${(computedTotalErrors / heatmapEntries.length).toFixed(1)}/key`
              : '0.0'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {heatmapEntries.length === 0 ? (
        /* Empty State: Perfect Typing */
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-950/10 text-center space-y-2">
          <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce">
            <CheckCircle2 size={32} />
          </div>
          <h4 className="text-base font-bold text-emerald-400 tracking-tight">
            Flawless Accuracy — No Typo Hotspots Detected!
          </h4>
          <p className={`text-xs ${theme.mutedText} max-w-md`}>
            You executed all keystrokes with absolute accuracy. No character errors recorded in the troubleshooting heatmap. Keep up the flawless muscle memory!
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Frequency List / Cards View */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
            {heatmapEntries.map(([key, count]) => {
              const intensity = getIntensityClass(count);
              const percentOfTotal = computedTotalErrors > 0 
                ? Math.round((count / computedTotalErrors) * 100) 
                : 0;
              const barWidth = Math.max(8, Math.round((count / maxErrorCount) * 100));

              return (
                <div
                  key={key}
                  onClick={() => setSelectedKeyTip(selectedKeyTip === key ? null : key)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${intensity.bg}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg border ${theme.subCardBg} ${theme.subCardBorder} flex items-center justify-center font-mono text-sm font-bold shadow-inner ${theme.headerText}`}>
                        {key === ' ' ? '␣' : key}
                      </div>
                      <div>
                        <span className={`text-xs font-bold font-mono tracking-wide block ${theme.headerText}`}>
                          '{formatKeyName(key)}'
                        </span>
                        <span className={`text-[10px] ${theme.mutedText} font-mono`}>
                          {percentOfTotal}% of total errors
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${intensity.badge}`}>
                        {count} {count === 1 ? 'error' : 'errors'}
                      </span>
                    </div>
                  </div>

                  {/* Relative Error Frequency Bar */}
                  <div className="mt-2.5 space-y-1">
                    <div className={`w-full ${theme.subCardBg} h-1.5 rounded-full overflow-hidden border ${theme.subCardBorder}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${intensity.bar}`} 
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className={`flex justify-between items-center text-[9px] font-mono ${theme.mutedText}`}>
                      <span>{intensity.level}</span>
                      <span>{count} / {maxErrorCount} max</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Visual Keyboard Heatmap View */
        <div className={`p-4 rounded-xl border ${theme.subCardBg} ${theme.subCardBorder} space-y-3`}>
          <div className={`text-xs font-semibold ${theme.headerText} flex items-center justify-between`}>
            <span className="flex items-center gap-1.5">
              <Keyboard size={14} className="text-cyan-400" />
              Keyboard Layout Error Heatmap:
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Med
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block" /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded ${theme.subCardBg} border ${theme.subCardBorder} inline-block`} /> None
              </span>
            </div>
          </div>

          <div className="space-y-1.5 max-w-xl mx-auto py-2">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1">
                {row.map((char) => {
                  const errorCount = errorHeatmap[char] || errorHeatmap[char.toUpperCase()] || 0;
                  let keyBg = `${theme.subCardBg} ${theme.subCardBorder} ${theme.mutedText}`;
                  if (errorCount >= 5) {
                    keyBg = 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30 font-extrabold animate-pulse';
                  } else if (errorCount >= 3) {
                    keyBg = 'bg-amber-600 text-slate-950 border-amber-400 font-bold';
                  } else if (errorCount >= 1) {
                    keyBg = 'bg-cyan-900/80 text-cyan-200 border-cyan-500/60 font-semibold';
                  }

                  return (
                    <div
                      key={char}
                      title={errorCount > 0 ? `'${char}': ${errorCount} errors` : `'${char}': 0 errors`}
                      className={`w-7 h-8 sm:w-9 sm:h-10 rounded-md border text-xs sm:text-sm font-mono flex flex-col items-center justify-center transition-all cursor-pointer ${keyBg}`}
                    >
                      <span>{char.toUpperCase()}</span>
                      {errorCount > 0 && (
                        <span className="text-[8px] font-extrabold leading-none opacity-90">
                          {errorCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Space key representation */}
            <div className="flex justify-center pt-1">
              {(() => {
                const spaceErrors = errorHeatmap[' '] || 0;
                let spaceBg = `${theme.subCardBg} ${theme.subCardBorder} ${theme.mutedText}`;
                if (spaceErrors >= 5) spaceBg = 'bg-rose-600 text-white border-rose-400 font-bold';
                else if (spaceErrors >= 3) spaceBg = 'bg-amber-600 text-slate-950 border-amber-400 font-bold';
                else if (spaceErrors >= 1) spaceBg = 'bg-cyan-900/80 text-cyan-200 border-cyan-500/60 font-semibold';

                return (
                  <div
                    title={spaceErrors > 0 ? `Spacebar: ${spaceErrors} errors` : `Spacebar: 0 errors`}
                    className={`w-40 sm:w-56 h-8 rounded-md border text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${spaceBg}`}
                  >
                    <span>SPACE</span>
                    {spaceErrors > 0 && (
                      <span className="text-[10px] font-extrabold bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                        {spaceErrors} errors
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Actionable Practice Tips for Top Weak Keys */}
      {topWeakKeys.length > 0 && (
        <div className={`p-4 rounded-xl border ${theme.subCardBg} ${theme.subCardBorder} space-y-2`}>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Lightbulb size={15} className="text-amber-400" />
            Troubleshooting & Practice Tip:
          </div>
          <p className={`text-xs ${theme.mutedText} leading-relaxed`}>
            Your most common typing mistakes occurred on keys:{' '}
            {topWeakKeys.map(([k, c]) => (
              <span key={k} className="font-mono font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 mx-0.5">
                '{formatKeyName(k)}' ({c}x)
              </span>
            ))}
            . Try positioning your hands back on the home row (<code className={theme.accentText}>ASDF JKL;</code>) and practicing deliberate slow typing on words containing these characters.
          </p>
        </div>
      )}
    </div>
  );
}
