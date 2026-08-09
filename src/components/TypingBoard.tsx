import React, { useRef, useEffect } from 'react';
import { Keyboard, AlertCircle, Smartphone, AlertTriangle } from 'lucide-react';

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
  consecutiveErrors?: number;
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
  consecutiveErrors = 0,
}: TypingBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus hidden input on mobile & desktop when isFocused changes
  useEffect(() => {
    if (isFocused && !completed && hiddenInputRef.current) {
      const activeElement = document.activeElement;
      if (activeElement && activeElement !== hiddenInputRef.current) {
        const tag = activeElement.tagName ? activeElement.tagName.toLowerCase() : '';
        if ((tag === 'input' || tag === 'textarea') && activeElement.id !== 'hidden-mobile-typing-input') {
          return;
        }
      }
      hiddenInputRef.current.focus({ preventScroll: true });
    }
  }, [isFocused, completed]);

  // Bind global keydown listener as fallback
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement === hiddenInputRef.current) {
        // Let hidden textarea handle event directly to avoid duplicate dispatching
        return;
      }

      if (activeElement) {
        const tag = activeElement.tagName ? activeElement.tagName.toLowerCase() : '';
        const isInputOrTextArea = 
          (tag === 'input' || tag === 'textarea' || activeElement.getAttribute('contenteditable') === 'true') &&
          activeElement.id !== 'hidden-mobile-typing-input';

        if (isInputOrTextArea) {
          return;
        }
      }

      if (isFocused && !completed) {
        if (e.key === ' ' || e.key === 'Backspace') {
          e.preventDefault();
        }
        onKeyDown(e);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isFocused, onKeyDown, completed]);

  // Click handler to trigger focus and open mobile soft keyboard
  const handleContainerClick = () => {
    setIsFocused(true);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  // Handle mobile keyboard typed text via input change
  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (!val) return;

    for (let i = 0; i < val.length; i++) {
      const char = val[i];
      const syntheticEvent = new KeyboardEvent('keydown', {
        key: char,
        bubbles: true,
        cancelable: true,
      });
      onKeyDown(syntheticEvent);
    }

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
  };

  // Handle special mobile keys (Backspace, Enter, Space)
  const handleHiddenInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const syntheticEvent = new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true,
        cancelable: true,
      });
      onKeyDown(syntheticEvent);
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      const syntheticEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      onKeyDown(syntheticEvent);
    } else if (e.key === 'Enter') {
      e.preventDefault();
    }
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
      {/* Invisible textarea to capture mobile software keyboard input */}
      <textarea
        ref={hiddenInputRef}
        id="hidden-mobile-typing-input"
        defaultValue=""
        onChange={handleHiddenInputChange}
        onKeyDown={handleHiddenInputKeyDown}
        onFocus={() => setIsFocused(true)}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        tabIndex={0}
        aria-label="Mobile typing software keyboard input"
        className="absolute opacity-0 pointer-events-auto w-full h-full inset-0 z-10 cursor-pointer resize-none overflow-hidden"
      />

      {/* Real-time Typo Mistake Hint Banner */}
      {lastTypoHint && !completed && isFocused && (
        <div 
          id="typo-hint-banner"
          className="relative z-20 mb-3 px-3.5 py-2 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-fade-in"
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

      {/* 5+ Consecutive Errors Warning Alert Toast */}
      {consecutiveErrors >= 5 && !completed && isFocused && (
        <div 
          id="consecutive-errors-alert-toast"
          className="relative z-20 mb-3 px-3.5 py-2.5 rounded-xl bg-amber-950/90 border border-amber-500/70 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-bounce"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 animate-pulse" />
            <span className="font-sans">
              <strong className="text-amber-300 font-bold">{consecutiveErrors} Consecutive Typos!</strong> Take a breath and slow down for better accuracy.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 shrink-0 uppercase tracking-wider">
            Slow Down
          </span>
        </div>
      )}

      {/* Mobile Keyboard Trigger Quick Bar on small screens when focused */}
      {isFocused && !completed && (
        <div className="sm:hidden relative z-20 mb-2.5 flex items-center justify-between px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <Smartphone size={13} className="animate-pulse text-cyan-400" />
            <span>Mobile Keyboard Active</span>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              hiddenInputRef.current?.focus();
            }}
            className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 hover:bg-cyan-500/30 text-[11px] font-bold text-cyan-200 transition-colors"
          >
            Re-open Keyboard
          </button>
        </div>
      )}

      {/* Blurred "Click to focus" Overlay when not focused */}
      {!isFocused && !completed && (
        <div 
          id="focus-overlay"
          className={`absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300 ${
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
            <span>Tap to start typing practice</span>
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
              // Incorrect character style (typo with subtle visual highlight & shadow pulse)
              charClass = theme === 'cyberpunk' 
                ? 'text-yellow-300 bg-fuchsia-950/80 border-b-2 border-yellow-400 font-extrabold shadow-[0_0_10px_rgba(234,179,8,0.5)] ring-1 ring-yellow-400/40 animate-pulse px-0.5 rounded-sm'
                : theme === 'matrix' 
                ? 'text-red-200 bg-red-950/90 border-b-2 border-red-500 font-black shadow-[0_0_10px_rgba(239,68,68,0.6)] ring-1 ring-red-500/50 animate-pulse px-0.5 rounded-sm'
                : theme === 'sakura' 
                ? 'text-rose-700 bg-rose-100/90 border-b-2 border-rose-500 font-black shadow-[0_0_8px_rgba(244,63,94,0.35)] ring-1 ring-rose-400/50 animate-pulse px-0.5 rounded-sm'
                : theme === 'carbon-light' 
                ? 'text-rose-700 bg-rose-100/90 border-b-2 border-rose-500 font-black shadow-[0_0_8px_rgba(244,63,94,0.35)] ring-1 ring-rose-400/50 animate-pulse px-0.5 rounded-sm'
                : 'text-rose-400 bg-rose-950/60 border-b-2 border-rose-500/80 font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)] ring-1 ring-rose-500/40 animate-pulse px-0.5 rounded-sm';
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
