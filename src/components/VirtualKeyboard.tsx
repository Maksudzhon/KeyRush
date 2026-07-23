import React, { useEffect, useState } from 'react';

interface VirtualKeyboardProps {
  targetChar?: string;
  theme?: string;
}

// Finger classifications for proper touch-typing guidance
type Finger = 'lp' | 'lr' | 'lm' | 'li' | 't' | 'ri' | 'rm' | 'rr' | 'rp';

interface KeyConfig {
  code: string;
  label: string;
  shiftedLabel?: string;
  width?: string; // Tailwind class for width
  finger: Finger;
}

const KEYBOARD_ROWS: KeyConfig[][] = [
  // Row 0
  [
    { code: 'Backquote', label: '`', shiftedLabel: '~', finger: 'lp' },
    { code: 'Digit1', label: '1', shiftedLabel: '!', finger: 'lp' },
    { code: 'Digit2', label: '2', shiftedLabel: '@', finger: 'lr' },
    { code: 'Digit3', label: '3', shiftedLabel: '#', finger: 'lm' },
    { code: 'Digit4', label: '4', shiftedLabel: '$', finger: 'li' },
    { code: 'Digit5', label: '5', shiftedLabel: '%', finger: 'li' },
    { code: 'Digit6', label: '6', shiftedLabel: '^', finger: 'ri' },
    { code: 'Digit7', label: '7', shiftedLabel: '&', finger: 'ri' },
    { code: 'Digit8', label: '8', shiftedLabel: '*', finger: 'rm' },
    { code: 'Digit9', label: '9', shiftedLabel: '(', finger: 'rr' },
    { code: 'Digit0', label: '0', shiftedLabel: ')', finger: 'rp' },
    { code: 'Minus', label: '-', shiftedLabel: '_', finger: 'rp' },
    { code: 'Equal', label: '=', shiftedLabel: '+', finger: 'rp' },
    { code: 'Backspace', label: '←', width: 'flex-1 min-w-[42px] sm:min-w-[70px]', finger: 'rp' },
  ],
  // Row 1
  [
    { code: 'Tab', label: 'Tab', width: 'w-[32px] sm:w-[42px] md:w-[52px]', finger: 'lp' },
    { code: 'KeyQ', label: 'Q', finger: 'lp' },
    { code: 'KeyW', label: 'W', finger: 'lr' },
    { code: 'KeyE', label: 'E', finger: 'lm' },
    { code: 'KeyR', label: 'R', finger: 'li' },
    { code: 'KeyT', label: 'T', finger: 'li' },
    { code: 'KeyY', label: 'Y', finger: 'ri' },
    { code: 'KeyU', label: 'U', finger: 'ri' },
    { code: 'KeyI', label: 'I', finger: 'rm' },
    { code: 'KeyO', label: 'O', finger: 'rr' },
    { code: 'KeyP', label: 'P', finger: 'rp' },
    { code: 'BracketLeft', label: '[', shiftedLabel: '{', finger: 'rp' },
    { code: 'BracketRight', label: ']', shiftedLabel: '}', finger: 'rp' },
    { code: 'Backslash', label: '\\', shiftedLabel: '|', width: 'flex-1 min-w-[30px]', finger: 'rp' },
  ],
  // Row 2
  [
    { code: 'CapsLock', label: 'Caps', width: 'w-[36px] sm:w-[50px] md:w-[64px]', finger: 'lp' },
    { code: 'KeyA', label: 'A', finger: 'lp' },
    { code: 'KeyS', label: 'S', finger: 'lr' },
    { code: 'KeyD', label: 'D', finger: 'lm' },
    { code: 'KeyF', label: 'F', finger: 'li' },
    { code: 'KeyG', label: 'G', finger: 'li' },
    { code: 'KeyH', label: 'H', finger: 'ri' },
    { code: 'KeyJ', label: 'J', finger: 'ri' },
    { code: 'KeyK', label: 'K', finger: 'rm' },
    { code: 'KeyL', label: 'L', finger: 'rr' },
    { code: 'Semicolon', label: ';', shiftedLabel: ':', finger: 'rp' },
    { code: 'Quote', label: "'", shiftedLabel: '"', finger: 'rp' },
    { code: 'Enter', label: '↵', width: 'flex-1 min-w-[45px] sm:min-w-[75px]', finger: 'rp' },
  ],
  // Row 3
  [
    { code: 'ShiftLeft', label: 'Shift', width: 'w-[42px] sm:w-[60px] md:w-[80px]', finger: 'lp' },
    { code: 'KeyZ', label: 'Z', finger: 'lp' },
    { code: 'KeyX', label: 'X', finger: 'lr' },
    { code: 'KeyC', label: 'C', finger: 'lm' },
    { code: 'KeyV', label: 'V', finger: 'li' },
    { code: 'KeyB', label: 'B', finger: 'li' },
    { code: 'KeyN', label: 'N', finger: 'ri' },
    { code: 'KeyM', label: 'M', finger: 'ri' },
    { code: 'Comma', label: ',', shiftedLabel: '<', finger: 'rm' },
    { code: 'Period', label: '.', shiftedLabel: '>', finger: 'rr' },
    { code: 'Slash', label: '/', shiftedLabel: '?', finger: 'rp' },
    { code: 'ShiftRight', label: 'Shift', width: 'flex-1 min-w-[42px] sm:min-w-[80px]', finger: 'rp' },
  ],
  // Row 4
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 'w-[32px] sm:w-[42px] md:w-[52px]', finger: 'lp' },
    { code: 'MetaLeft', label: '⊞', width: 'w-[28px] sm:w-[35px] md:w-[40px]', finger: 'lp' },
    { code: 'AltLeft', label: 'Alt', width: 'w-[30px] sm:w-[38px] md:w-[45px]', finger: 't' },
    { code: 'Space', label: 'Space', width: 'w-[120px] sm:w-[200px] md:w-[320px]', finger: 't' },
    { code: 'AltRight', label: 'Alt', width: 'w-[30px] sm:w-[38px] md:w-[45px]', finger: 't' },
    { code: 'MetaRight', label: '⊞', width: 'w-[28px] sm:w-[35px] md:w-[40px]', finger: 'rp' },
    { code: 'ControlRight', label: 'Ctrl', width: 'flex-1', finger: 'rp' },
  ]
];

// Helper to find the physical codes to highlight for a character
function getCodesForChar(char?: string): string[] {
  if (!char) return [];
  if (char === ' ') return ['Space'];
  if (char === '\n') return ['Enter'];

  const lowerChar = char.toLowerCase();
  const codes: string[] = [];

  if (lowerChar >= 'a' && lowerChar <= 'z') {
    codes.push('Key' + lowerChar.toUpperCase());
  } else if (lowerChar >= '0' && lowerChar <= '9') {
    codes.push('Digit' + lowerChar);
  } else {
    const specialMap: Record<string, string> = {
      '`': 'Backquote', '~': 'Backquote',
      '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', '$': 'Digit4', '%': 'Digit5',
      '^': 'Digit6', '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0',
      '-': 'Minus', '_': 'Minus',
      '=': 'Equal', '+': 'Equal',
      '[': 'BracketLeft', '{': 'BracketLeft',
      ']': 'BracketRight', '}': 'BracketRight',
      '\\': 'Backslash', '|': 'Backslash',
      ';': 'Semicolon', ':': 'Semicolon',
      "'": 'Quote', '"': 'Quote',
      ',': 'Comma', '<': 'Comma',
      '.': 'Period', '>': 'Period',
      '/': 'Slash', '?': 'Slash'
    };
    if (specialMap[char]) {
      codes.push(specialMap[char]);
    }
  }

  // If uppercase or shifted special symbol, highlight Shift too!
  const isShifted = /[A-Z!@#$%^&*()_+{}|:"<>?]/.test(char);
  if (isShifted) {
    // Standard touch typing rules suggest using opposite Shift,
    // but highlighting Left Shift is a great standard indicator.
    codes.push('ShiftLeft');
  }

  return codes;
}

// Finger styling definitions
const FINGER_STYLES: Record<Finger, { name: string; color: string; hover: string }> = {
  lp: { name: 'Left Pinky', color: 'border-pink-500/20 text-pink-400 bg-pink-500/5', hover: 'group-hover:border-pink-500' },
  lr: { name: 'Left Ring', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5', hover: 'group-hover:border-amber-500' },
  lm: { name: 'Left Middle', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5', hover: 'group-hover:border-emerald-500' },
  li: { name: 'Left Index', color: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5', hover: 'group-hover:border-cyan-500' },
  t: { name: 'Thumbs', color: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5', hover: 'group-hover:border-indigo-500' },
  ri: { name: 'Right Index', color: 'border-sky-500/20 text-sky-400 bg-sky-500/5', hover: 'group-hover:border-sky-500' },
  rm: { name: 'Right Middle', color: 'border-teal-500/20 text-teal-400 bg-teal-500/5', hover: 'group-hover:border-teal-500' },
  rr: { name: 'Right Ring', color: 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5', hover: 'group-hover:border-yellow-500' },
  rp: { name: 'Right Pinky', color: 'border-purple-500/20 text-purple-400 bg-purple-500/5', hover: 'group-hover:border-purple-500' }
};

export default function VirtualKeyboard({ targetChar, theme = 'carbon' }: VirtualKeyboardProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  // Listen to physical keyboard events to highlight key presses in real-time
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid tracking modifiers by themselves inside activeKeys if they block keyup
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(e.code);
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
    };

    const handleWindowBlur = () => {
      setActiveKeys(new Set()); // Reset on focus loss
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  const targetCodes = getCodesForChar(targetChar);

  // Compute theme colors dynamically to look pristine and authentic
  const isLightTheme = theme === 'sakura' || theme === 'carbon-light';
  
  const keyboardBgClass = theme === 'carbon' ? 'bg-slate-950/40 border-slate-900'
    : theme === 'carbon-light' ? 'bg-slate-50 border-slate-200'
    : theme === 'cyberpunk' ? 'bg-purple-950/20 border-purple-950/50'
    : theme === 'matrix' ? 'bg-black border-emerald-950'
    : theme === 'sakura' ? 'bg-rose-50/30 border-rose-100'
    : 'bg-slate-950/40 border-slate-900';

  const keyBaseClass = isLightTheme 
    ? 'bg-white border-slate-200 text-slate-700 shadow-sm'
    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]';

  const fingerColorDot = (f: Finger) => {
    switch (f) {
      case 'lp': return 'bg-pink-400';
      case 'lr': return 'bg-amber-400';
      case 'lm': return 'bg-emerald-400';
      case 'li': return 'bg-cyan-400';
      case 't': return 'bg-indigo-400';
      case 'ri': return 'bg-sky-400';
      case 'rm': return 'bg-teal-400';
      case 'rr': return 'bg-yellow-400';
      case 'rp': return 'bg-purple-400';
    }
  };

  return (
    <div 
      id="virtual-keyboard-container" 
      className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 ${keyboardBgClass}`}
    >
      {/* Title & Legend Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <h4 className={`text-xs font-bold uppercase tracking-widest ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
            Interactive Virtual Keyboard
          </h4>
        </div>
        
        {/* Finger Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] select-none opacity-85">
          <span className={`${isLightTheme ? 'text-slate-500' : 'text-slate-400'} font-semibold mr-1`}>Fingers:</span>
          {(['lp', 'lr', 'lm', 'li', 't'] as Finger[]).map((f) => (
            <span key={f} className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
              <span className={`w-1.5 h-1.5 rounded-full ${fingerColorDot(f)}`} />
              {f === 'lp' ? 'Pinky' : f === 'lr' ? 'Ring' : f === 'lm' ? 'Middle' : f === 'li' ? 'Index' : 'Thumb'}
            </span>
          ))}
        </div>
      </div>

      {/* Keyboard Grid */}
      <div className="flex flex-col gap-1 md:gap-1.5 select-none font-sans overflow-x-auto no-scrollbar pb-1 max-w-full">
        {KEYBOARD_ROWS.map((row, rIndex) => (
          <div key={rIndex} className="flex gap-0.5 sm:gap-1 md:gap-1.5 justify-center">
            {row.map((k) => {
              const isActive = activeKeys.has(k.code);
              const isTarget = targetCodes.includes(k.code);
              const finger = FINGER_STYLES[k.finger];

              // Target Key style (glowing pulse based on theme)
              let targetStyleClass = '';
              if (isTarget) {
                targetStyleClass = theme === 'cyberpunk'
                  ? 'border-pink-500 text-pink-300 shadow-[0_0_12px_#ec4899] bg-pink-500/10 scale-[1.02]'
                  : theme === 'matrix'
                  ? 'border-emerald-500 text-emerald-400 shadow-[0_0_12px_#10b981] bg-emerald-950/20 scale-[1.02]'
                  : theme === 'sakura'
                  ? 'border-rose-400 text-rose-600 bg-rose-50 shadow-[0_0_8px_rgba(244,63,94,0.15)] scale-[1.02]'
                  : 'border-cyan-500 text-cyan-300 shadow-[0_0_12px_#22d3ee] bg-cyan-950/20 scale-[1.02]';
              }

              // Active Key style (the physically pressed down key)
              let activeStyleClass = '';
              if (isActive) {
                activeStyleClass = theme === 'cyberpunk'
                  ? 'bg-yellow-400 text-black border-yellow-300 scale-95 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
                  : theme === 'matrix'
                  ? 'bg-emerald-500 text-black border-emerald-400 scale-95 shadow-[0_0_15px_#10b981]'
                  : theme === 'sakura'
                  ? 'bg-rose-500 text-white border-rose-400 scale-95'
                  : 'bg-cyan-500 text-slate-950 border-cyan-400 scale-95 shadow-[0_0_10px_#22d3ee] font-bold';
              }

              // Finger-coded subtle borders to guide touch typing
              const borderGuideClass = !isActive && !isTarget
                ? `hover:border-slate-500/40 border-slate-800/50 ${finger.color}`
                : '';

              return (
                <div
                  key={k.code}
                  id={`key-${k.code}`}
                  className={`h-7 sm:h-8 md:h-10 lg:h-11 ${k.width || 'w-5 sm:w-7 md:w-9 lg:w-11'} rounded-md sm:rounded-lg border text-[7px] sm:text-[9px] md:text-[11px] font-bold flex flex-col items-center justify-center relative transition-all duration-100 ease-out shrink-0 ${keyBaseClass} ${borderGuideClass} ${targetStyleClass} ${activeStyleClass}`}
                >
                  {/* Shifted symbol layout */}
                  {k.shiftedLabel ? (
                    <div className="flex flex-col items-center leading-none justify-between h-[18px] sm:h-[22px] md:h-[26px]">
                      <span className={`text-[6px] sm:text-[8px] md:text-[9px] opacity-60 ${isActive ? 'text-current' : ''}`}>
                        {k.shiftedLabel}
                      </span>
                      <span className="text-[7px] sm:text-[10px] md:text-[11px]">
                        {k.label}
                      </span>
                    </div>
                  ) : (
                    <span>{k.label}</span>
                  )}

                  {/* Proper finger color-coding indicator dot */}
                  {!isActive && !isTarget && (
                    <span 
                      className={`absolute bottom-1 right-1 w-1 h-1 rounded-full opacity-40 ${fingerColorDot(k.finger)}`}
                      title={finger.name}
                    />
                  )}

                  {/* Cute ghost visual helper icon on target */}
                  {isTarget && !isActive && (
                     animatePulse(
                      <span className="absolute -top-1.5 -right-1 text-[8px] filter drop-shadow bg-cyan-900 border border-cyan-500/30 px-0.5 rounded select-none text-cyan-300 pointer-events-none z-10 animate-bounce">
                        🎯
                      </span>
                    )
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function animatePulse(el: React.ReactNode) {
  return el;
}
