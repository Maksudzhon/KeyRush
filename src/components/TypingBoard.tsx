import React, { useRef, useEffect } from 'react';
import { Keyboard, AlertCircle } from 'lucide-react';

interface TypingBoardProps {
  text: string;
  userInput: string;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  completed: boolean;
  ghostIndex?: number | null;
  ghostActive?: boolean;
  theme?: string;
  lastTypoHint?: { typed: string; expected: string; timestamp: number } | null;
  isShaking?: boolean;
}

export default function TypingBoard({
  text,
  userInput,
  isFocused,
  setIsFocused,
  onKeyDown,
  completed,
  ghostIndex = null,
  ghostActive = false,
  theme = 'carbon',
  lastTypoHint = null,
  isShaking = false,
}: TypingBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Bind keydown listener when focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input element, textarea, or contenteditable element
      const activeElement = document.activeElement;
      const tag = activeElement?.tagName ? activeElement.tagName.toLowerCase() : '';
      const isInputOrTextArea = 
        tag === 'input' || 
        tag === 'textarea' || 
        activeElement?.getAttribute('contenteditable') === 'true' ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInputOrTextArea) {
        return; // DO NOT process typing test keystrokes while user is typing in an input/textarea!
      }

      if (isFocused && !completed) {
        // Prevent default space or backspace scroll behavior
        if (e.key === ' ' || e.key === 'Backspace') {
          e.preventDefault();
        }
        onKeyDown(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocused, onKeyDown, completed]);

  // Click handler to trigger focus
  const handleContainerClick = () => {
    setIsFocused(true);
  };

  const isLightTheme = theme === 'sakura' || theme === 'carbon-light';

  // Compute container class based on active theme and focus state
  let containerStyleClass = '';
  if (isFocused) {
    containerStyleClass = theme === 'cyberpunk'
      ? 'bg-[#120727] border-pink-500/80 shadow-[0_0_20px_rgba(236,72,153,0.18)]'
      : theme === 'matrix'
      ? 'bg-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
      : theme === 'sakura'
      ? 'bg-white border-rose-400/80 shadow-[0_4px_20px_rgba(244,63,94,0.08)]'
      : theme === 'carbon-light'
      ? 'bg-white border-slate-400 shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
      : 'bg-slate-900/60 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]';
  } else {
    containerStyleClass = theme === 'cyberpunk'
      ? 'bg-[#0b031b] border-purple-950 hover:border-purple-900/60'
      : theme === 'matrix'
      ? 'bg-black border-emerald-950 hover:border-emerald-900/60'
      : theme === 'sakura'
      ? 'bg-rose-50/20 border-rose-100 hover:border-rose-200'
      : theme === 'carbon-light'
      ? 'bg-slate-100/60 border-slate-200 hover:border-slate-300'
      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40';
  }

  // Caret Styles
  const caretColorClass = theme === 'cyberpunk'
    ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]'
    : theme === 'matrix'
    ? 'bg-[#33ff33] shadow-[0_0_8px_#33ff33]'
    : theme === 'sakura'
    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
    : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';

  return (
    <div
      ref={containerRef}
      id="typing-board-container"
      onClick={handleContainerClick}
      className={`relative min-h-[140px] sm:min-h-[160px] p-4 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${containerStyleClass} ${
        isShaking ? 'animate-shake border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.35)]' : ''
      } backdrop-blur-md`}
    >
      {/* Real-time Typo Mistake Hint Banner */}
      {lastTypoHint && !completed && isFocused && (
        <div 
          id="typo-hint-banner"
          className="mb-3 px-3.5 py-2 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-400 shrink-0 animate-pulse" />
            <span className="font-sans">
              <strong className="text-rose-300 font-bold">Typo Mistake:</strong> You pressed <code className="bg-rose-900/90 text-rose-100 px-1.5 py-0.5 rounded font-mono font-bold border border-rose-700">{lastTypoHint.typed === ' ' ? 'Space' : lastTypoHint.typed}</code>, but expected <code className="bg-emerald-900/90 text-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold border border-emerald-600">{lastTypoHint.expected === ' ' ? 'Space' : lastTypoHint.expected}</code>.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 shrink-0 uppercase tracking-wider">
            Type '{lastTypoHint.expected === ' ' ? 'Space' : lastTypoHint.expected}'
          </span>
        </div>
      )}

      {/* Blurred "Click to focus" Overlay when not focused */}
      {!isFocused && !completed && (
        <div 
          id="focus-overlay"
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300 ${
            isLightTheme ? 'bg-white/90' : 'bg-slate-950/80'
          }`}
        >
          <div className={`flex items-center gap-2 px-4 py-2 border rounded-xl font-medium animate-pulse text-sm ${
            theme === 'cyberpunk'
              ? 'bg-purple-950/50 border-pink-500/30 text-pink-400'
              : theme === 'matrix'
              ? 'bg-black border-emerald-500/30 text-[#33ff33]'
              : theme === 'sakura'
              ? 'bg-rose-50 border-rose-200 text-rose-500'
              : theme === 'carbon-light'
              ? 'bg-white border-slate-300 text-slate-700 shadow-sm'
              : 'bg-slate-900 border-slate-700/50 text-cyan-400'
          }`}>
            <Keyboard size={16} />
            <span>Click to start typing practice</span>
          </div>
        </div>
      )}

      {/* Typing Text Layout */}
      <div 
        id="typing-text-flow"
        className="text-base sm:text-lg md:text-2xl font-mono leading-relaxed select-none tracking-wide break-words"
      >
        {text.split('').map((char, index) => {
          let charClass = '';
          const isCurrent = index === userInput.length;
          const isTyped = index < userInput.length;

          if (isTyped) {
            const typedChar = userInput[index];
            if (typedChar === char) {
              // Correct character style
              charClass = theme === 'cyberpunk' ? 'text-pink-400 font-bold'
                : theme === 'matrix' ? 'text-[#33ff33] font-bold shadow-[0_0_2px_#33ff33]'
                : theme === 'sakura' ? 'text-rose-600 font-extrabold'
                : theme === 'carbon-light' ? 'text-indigo-700 font-extrabold'
                : 'text-emerald-400 font-bold';
            } else {
              // Incorrect character style
              charClass = theme === 'cyberpunk' ? 'text-yellow-400 bg-fuchsia-950/50 border-b-2 border-yellow-400'
                : theme === 'matrix' ? 'text-black bg-red-600 border-b-2 border-red-500 font-extrabold'
                : theme === 'sakura' ? 'text-red-600 bg-red-100 border-b-2 border-red-500 font-extrabold'
                : theme === 'carbon-light' ? 'text-rose-600 bg-rose-100 border-b-2 border-rose-500 font-extrabold'
                : 'text-rose-500 bg-rose-950/30 border-b-2 border-rose-500';
            }
          } else {
            // Untyped character style
            charClass = theme === 'cyberpunk' ? 'text-purple-600/70'
              : theme === 'matrix' ? 'text-[#005500]'
              : theme === 'sakura' ? 'text-rose-300 font-medium'
              : theme === 'carbon-light' ? 'text-slate-400 font-medium'
              : 'text-slate-500';
          }

          return (
            <span
              key={index}
              id={`char-${index}`}
              className={`relative transition-colors duration-100 ${charClass}`}
            >
              {/* Blinking Caret */}
              {isCurrent && isFocused && !completed && (
                <span 
                  id="blinking-caret"
                  className={`absolute left-0 top-[10%] bottom-[10%] w-[2px] animate-[pulse_0.8s_infinite] ${caretColorClass}`} 
                />
              )}
              {/* Ghost Caret */}
              {ghostActive && ghostIndex !== null && index === Math.min(ghostIndex, text.length - 1) && !completed && (
                <span 
                  id="ghost-caret"
                  className={`absolute ${ghostIndex >= text.length - 1 ? 'right-0' : 'left-0'} top-[10%] bottom-[10%] w-[2px] bg-purple-500 animate-[pulse_1s_infinite] shadow-[0_0_8px_#a855f7] z-20`}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] select-none pointer-events-none filter drop-shadow bg-purple-900/80 text-white rounded px-1 py-0.2 select-none border border-purple-500/50">
                    👻 Ghost
                  </span>
                </span>
              )}
              {/* Correct for spaces layout visualization */}
              {char === ' ' && isTyped && userInput[index] !== ' ' ? '␣' : char}
            </span>
          );
        })}
      </div>
    </div>
  );
}
