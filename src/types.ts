export interface Player {
  id: string;
  name: string;
  progress: number; // Character index typed correctly
  errorsCount: number;
  wpm: number;
  accuracy: number;
  completed: boolean;
  color: string;
}

export interface Room {
  id: string;
  text: string;
  language: string;
  difficulty: string;
  players: Player[];
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  countdown: number;
  createdAt: number;
}

export interface KeystrokeLog {
  key: string;
  timestampMs: number;
  inputLength: number;
  isCorrect: boolean;
  expectedChar?: string;
}

export interface GameStats {
  wpm: number;
  accuracy: number;
  cpm: number;
  errors: number;
  elapsedMs: number;
  errorHeatmap: Record<string, number>;
  wpmHistory: { time: number; wpm: number; accuracy: number }[];
  keystrokes?: KeystrokeLog[];
}

export interface RaceReplay {
  id: string;
  date: string;
  text: string;
  wpm: number;
  accuracy: number;
  cpm: number;
  errors: number;
  elapsedMs: number;
  language?: string;
  difficulty?: string;
  category?: string;
  keystrokes: KeystrokeLog[];
}

export interface TextItem {
  id: string;
  text: string;
  language: 'uz' | 'en' | 'ru' | 'code';
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface UserStats {
  racesCompleted: number;
  averageWpm: number;
  maxWpm: number;
  averageAccuracy: number;
  recentRaces: {
    date: string;
    wpm: number;
    accuracy: number;
    language: string;
  }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatar: string; // avatar emoji or icon name
  authProvider?: 'email' | 'google' | 'discord' | 'telegram';
  createdAt: string;
  stats?: UserStats;
}

export interface AuthLog {
  id: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  authProvider: string;
  action: 'REGISTER' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'OAUTH_CONNECT' | 'ACCOUNT_DELETED';
  ip: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  details?: string;
}

// Theme configurations for whole application
export const THEME_STYLES: Record<string, {
  appBg: string;
  headerBg: string;
  headerText: string;
  cardBg: string;
  cardTitle: string;
  accentText: string;
  accentBorder: string;
  accentBg: string;
  glowClass: string;
  inputBg: string;
  buttonAccent: string;
  logoGlow: string;
  subCardBg: string;
  subCardBorder: string;
  mutedText: string;
  footerBg: string;
  footerBorder: string;
}> = {
  carbon: {
    appBg: 'bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200',
    headerBg: 'bg-slate-950/80 border-slate-900',
    headerText: 'text-white',
    cardBg: 'bg-slate-900/40 border-slate-800',
    cardTitle: 'text-slate-400',
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-500/40',
    accentBg: 'bg-cyan-500/10',
    glowClass: 'shadow-[0_0_12px_rgba(6,182,212,0.15)]',
    inputBg: 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-500/50',
    buttonAccent: 'bg-gradient-to-tr from-cyan-500 to-indigo-500 text-slate-950 shadow-cyan-500/15',
    logoGlow: 'from-cyan-500 to-indigo-500 shadow-cyan-500/15',
    subCardBg: 'bg-slate-950/60',
    subCardBorder: 'border-slate-800/80',
    mutedText: 'text-slate-400',
    footerBg: 'bg-slate-950/60',
    footerBorder: 'border-slate-900'
  },
  'carbon-light': {
    appBg: 'bg-slate-100 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900',
    headerBg: 'bg-white/95 border-slate-200/90 shadow-sm',
    headerText: 'text-slate-950 font-black',
    cardBg: 'bg-white border-slate-200/80 shadow-sm',
    cardTitle: 'text-slate-600 font-bold',
    accentText: 'text-indigo-600 font-black',
    accentBorder: 'border-indigo-300',
    accentBg: 'bg-indigo-50',
    glowClass: 'shadow-sm',
    inputBg: 'bg-slate-50 border-slate-300 text-slate-950 focus:border-indigo-500',
    buttonAccent: 'bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 shadow-sm',
    logoGlow: 'from-indigo-600 to-slate-900 shadow-sm',
    subCardBg: 'bg-slate-50/90',
    subCardBorder: 'border-slate-200',
    mutedText: 'text-slate-500',
    footerBg: 'bg-white',
    footerBorder: 'border-slate-200'
  },
  cyberpunk: {
    appBg: 'bg-[#090215] text-[#ecf0f1] selection:bg-pink-500/30 selection:text-pink-200',
    headerBg: 'bg-[#0e0321]/80 border-purple-950/50 shadow-[0_0_15px_rgba(236,72,153,0.05)]',
    headerText: 'text-fuchsia-100',
    cardBg: 'bg-purple-950/15 border-purple-900/40 shadow-[0_0_15px_rgba(236,72,153,0.03)]',
    cardTitle: 'text-purple-400',
    accentText: 'text-fuchsia-400',
    accentBorder: 'border-pink-500/30',
    accentBg: 'bg-pink-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(236,72,153,0.15)]',
    inputBg: 'bg-[#15042d] border-purple-900/50 text-pink-100 focus:border-pink-500',
    buttonAccent: 'bg-gradient-to-tr from-pink-500 to-yellow-500 text-slate-950 shadow-pink-500/20',
    logoGlow: 'from-pink-500 to-fuchsia-500 shadow-pink-500/15',
    subCardBg: 'bg-[#15042d]/80',
    subCardBorder: 'border-purple-900/50',
    mutedText: 'text-purple-300/80',
    footerBg: 'bg-[#0e0321]/80',
    footerBorder: 'border-purple-950/60'
  },
  matrix: {
    appBg: 'bg-black text-[#33ff33] font-mono selection:bg-emerald-500/30 selection:text-emerald-200',
    headerBg: 'bg-black border-emerald-950/80 shadow-[0_0_10px_rgba(16,185,129,0.05)]',
    headerText: 'text-[#33ff33]',
    cardBg: 'bg-black border-emerald-950/70 shadow-[0_0_10px_rgba(16,185,129,0.02)]',
    cardTitle: 'text-emerald-500',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/20',
    accentBg: 'bg-emerald-950/20',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    inputBg: 'bg-black border-emerald-950 text-emerald-400 focus:border-emerald-500',
    buttonAccent: 'bg-emerald-500 text-black shadow-emerald-500/15 font-black uppercase hover:bg-emerald-400',
    logoGlow: 'from-emerald-500 to-emerald-700 shadow-emerald-500/15',
    subCardBg: 'bg-black',
    subCardBorder: 'border-emerald-950',
    mutedText: 'text-emerald-600',
    footerBg: 'bg-black',
    footerBorder: 'border-emerald-950'
  },
  sakura: {
    appBg: 'bg-[#fff5f6] text-[#4a2327] selection:bg-rose-200 selection:text-rose-900',
    headerBg: 'bg-white/95 border-rose-200/80 shadow-[0_2px_10px_rgba(244,63,94,0.06)]',
    headerText: 'text-rose-950 font-black',
    cardBg: 'bg-white border-rose-200/80 shadow-sm',
    cardTitle: 'text-rose-900 font-bold',
    accentText: 'text-rose-600 font-extrabold',
    accentBorder: 'border-rose-300',
    accentBg: 'bg-rose-50',
    glowClass: 'shadow-[0_4px_16px_rgba(244,63,94,0.08)]',
    inputBg: 'bg-rose-50/60 border-rose-200 text-rose-950 focus:border-rose-400',
    buttonAccent: 'bg-rose-500 text-white font-extrabold hover:bg-rose-600 shadow-md shadow-rose-500/20',
    logoGlow: 'from-rose-400 to-rose-600 shadow-md',
    subCardBg: 'bg-rose-50/50',
    subCardBorder: 'border-rose-200/80',
    mutedText: 'text-rose-800/70',
    footerBg: 'bg-white',
    footerBorder: 'border-rose-200'
  }
};
