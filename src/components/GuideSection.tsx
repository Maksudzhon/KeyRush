import React from 'react';
import { motion } from 'motion/react';
import { 
  Rocket, Keyboard, Cpu, Users, Brain, Volume2, 
  Sparkles, Trophy, ShieldCheck, Flame, Ghost, Zap, 
  HelpCircle, ArrowRight, CheckCircle2, Command, Globe
} from 'lucide-react';
import { THEME_STYLES } from '../types';

interface GuideSectionProps {
  activeTheme: string;
  isLightTheme: boolean;
  onStartSinglePlayer: () => void;
  onStartBotArena: () => void;
  onStartMultiplayer: () => void;
  onStartQuiz: () => void;
}

export default function GuideSection({
  activeTheme,
  isLightTheme,
  onStartSinglePlayer,
  onStartBotArena,
  onStartMultiplayer,
  onStartQuiz
}: GuideSectionProps) {
  const theme = THEME_STYLES[activeTheme as keyof typeof THEME_STYLES] || THEME_STYLES.carbon;

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* 1. HERO BANNER */}
      <div className={`p-6 sm:p-10 rounded-3xl border backdrop-blur-md relative overflow-hidden transition-all duration-300 ${theme.cardBg} ${theme.glowClass}`}>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
            style={{
              backgroundColor: isLightTheme ? 'rgba(6, 182, 212, 0.08)' : 'rgba(6, 182, 212, 0.15)',
              borderColor: isLightTheme ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.4)'
            }}>
            <Sparkles size={14} className={theme.accentText} />
            <span className={theme.accentText}>Welcome to KeyRush Engine</span>
          </div>

          <h1 className={`text-3xl sm:text-5xl font-black tracking-tight leading-tight ${theme.headerText}`}>
            The Ultimate Next-Gen <br className="hidden sm:inline" />
            <span className={theme.accentText}>Speed Typing</span> Platform
          </h1>

          <p className={`text-sm sm:text-base leading-relaxed ${theme.mutedText} max-w-2xl`}>
            KeyRush is an open-source, zero-latency typing platform designed to boost your words per minute (WPM), muscle memory, and coding syntax speed through real-time multiplayer races, bot battles, and technical quiz challenges.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onStartSinglePlayer}
              className={`px-6 py-3.5 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${theme.buttonAccent}`}
            >
              <Zap size={16} />
              <span>Start Solo Practice</span>
            </button>
            <button
              onClick={onStartBotArena}
              className={`px-6 py-3.5 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all border cursor-pointer flex items-center gap-2 ${theme.subCardBg} ${theme.subCardBorder} ${theme.headerText} hover:opacity-80`}
            >
              <Cpu size={16} className={theme.accentText} />
              <span>Race Bot Arena</span>
            </button>
          </div>
        </div>

        {/* Ambient background accent orb */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* 2. CORE GAMEPLAY MODES GRID */}
      <div>
        <div className="mb-4">
          <h2 className={`text-xl font-extrabold flex items-center gap-2 ${theme.headerText}`}>
            <Rocket size={20} className={theme.accentText} />
            Explore Game Modes
          </h2>
          <p className={`text-xs ${theme.mutedText} mt-1`}>
            Choose how you want to train your speed and accuracy today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Solo Practice */}
          <div 
            onClick={onStartSinglePlayer}
            className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group ${theme.cardBg} hover:border-cyan-500/50`}
          >
            <div>
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-3 group-hover:scale-110 transition-transform">
                <Keyboard size={20} />
              </div>
              <h3 className={`text-base font-bold ${theme.headerText}`}>Solo Speed Test</h3>
              <p className={`text-xs ${theme.mutedText} mt-1.5 leading-relaxed`}>
                Test your WPM & accuracy with standard passages, custom topic generators, or real code snippets. Includes Ghost PB racer.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/20 flex items-center justify-between text-xs font-bold text-cyan-400">
              <span>Start Practice</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Bot Arena */}
          <div 
            onClick={onStartBotArena}
            className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group ${theme.cardBg} hover:border-amber-500/50`}
          >
            <div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 w-fit mb-3 group-hover:scale-110 transition-transform">
                <Cpu size={20} />
              </div>
              <h3 className={`text-base font-bold ${theme.headerText}`}>Bot Arena Simulator</h3>
              <p className={`text-xs ${theme.mutedText} mt-1.5 leading-relaxed`}>
                Head-to-head racing against computer bots across 4 difficulty levels ranging from Easy (38 WPM) to Extreme (135 WPM).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/20 flex items-center justify-between text-xs font-bold text-amber-500">
              <span>Challenge Bots</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Live Multiplayer */}
          <div 
            onClick={onStartMultiplayer}
            className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group ${theme.cardBg} hover:border-purple-500/50`}
          >
            <div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-3 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <h3 className={`text-base font-bold ${theme.headerText}`}>Live Multiplayer Rooms</h3>
              <p className={`text-xs ${theme.mutedText} mt-1.5 leading-relaxed`}>
                Create private or public race rooms. Invite friends with room codes, chat in real-time, and track live track positions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/20 flex items-center justify-between text-xs font-bold text-purple-400">
              <span>Join Lobbies</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Quiz Test Quest */}
          <div 
            onClick={onStartQuiz}
            className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group ${theme.cardBg} hover:border-pink-500/50`}
          >
            <div>
              <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 w-fit mb-3 group-hover:scale-110 transition-transform">
                <Brain size={20} />
              </div>
              <h3 className={`text-base font-bold ${theme.headerText}`}>Code & Quiz Quest</h3>
              <p className={`text-xs ${theme.mutedText} mt-1.5 leading-relaxed`}>
                Type exact syntax answers to JavaScript, Python, Linux, and Web Dev questions under a 15s timer for combo streak points.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/20 flex items-center justify-between text-xs font-bold text-pink-400">
              <span>Take Quiz Test</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. KEY FEATURES & SHORTCUTS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Features Checklist */}
        <div className={`p-6 rounded-3xl border ${theme.cardBg} lg:col-span-2 space-y-4`}>
          <h3 className={`text-base font-bold uppercase tracking-wider flex items-center gap-2 ${theme.headerText}`}>
            <ShieldCheck size={18} className={theme.accentText} />
            Platform Capabilities & Highlights
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { title: 'Zero Latency Typing Engine', desc: 'Instant character feedback with high precision WPM calculations.' },
              { title: 'Custom Mechanical Sounds', desc: 'Choose between Mechanical Blue, Creamy Yellow, Silent Pink, Typewriter switches.' },
              { title: 'Smart Topic Generator', desc: 'Generates custom passages tailored to any topic you enter.' },
              { title: 'Ghost Mode PB Racer', desc: 'Phantom cursor showing your top personal best speed during tests.' },
              { title: '5 Aesthetic Themes', desc: 'Toggle between Carbon, Carbon Light, Cyberpunk, Matrix, and Sakura.' },
              { title: 'Anti-Cheat Engine', desc: 'Paste prevention and speed spike detection for fair rankings.' }
            ].map((feat, i) => (
              <div key={i} className={`p-3.5 rounded-xl border flex items-start gap-3 ${theme.subCardBg} ${theme.subCardBorder}`}>
                <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${theme.accentText}`} />
                <div>
                  <h4 className={`text-xs font-bold ${theme.headerText}`}>{feat.title}</h4>
                  <p className={`text-[11px] ${theme.mutedText} mt-0.5 leading-relaxed`}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts Card */}
        <div className={`p-6 rounded-3xl border ${theme.cardBg} space-y-4`}>
          <h3 className={`text-base font-bold uppercase tracking-wider flex items-center gap-2 ${theme.headerText}`}>
            <Command size={18} className={theme.accentText} />
            Keyboard Hotkeys
          </h3>

          <div className="space-y-2.5 pt-2">
            {[
              { label: 'Restart Race', shortcut: 'Ctrl + Enter', desc: 'Instantly resets the test board' },
              { label: 'Open Chatroom', shortcut: 'Alt + C', desc: 'Quick focus for multiplayer chat' },
              { label: 'Refocus Typing', shortcut: 'Escape', desc: 'Brings focus back to board' }
            ].map((hk, i) => (
              <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${theme.subCardBg} ${theme.subCardBorder}`}>
                <div>
                  <span className={`text-xs font-bold block ${theme.headerText}`}>{hk.label}</span>
                  <span className={`text-[10px] ${theme.mutedText}`}>{hk.desc}</span>
                </div>
                <span className={`text-[11px] font-mono font-extrabold px-2 py-1 rounded-lg border ${theme.accentBg} ${theme.accentText} ${theme.accentBorder}`}>
                  {hk.shortcut}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
