import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, Trophy, Target, Activity, Clock, RotateCcw, 
  Award, Keyboard, Users, Volume2, VolumeX, Copy, 
  Plus, Sparkles, Globe, Code, Flame, Send, CheckCircle, FlameKindling, Cpu, ShieldCheck,
  Ghost, Settings, Wifi, LogOut, Check, HelpCircle, Mail, Chrome, Gamepad2, Info, Brain, Menu, X, Sliders, AlertCircle, Trash2, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';

import { Player, Room, GameStats, Achievement, UserStats, TextItem, UserProfile, THEME_STYLES, RaceReplay } from './types';
import { useTypingEngine } from './hooks/useTypingEngine';
import { SwitchType, playSwitchSound } from './utils/soundEngine';
import { TYPING_TEXTS, getRandomText } from './data/texts';
import TypingBoard from './components/TypingBoard';
import RaceProgressBar from './components/RaceProgressBar';
import Dashboard from './components/Dashboard';
import VirtualKeyboard from './components/VirtualKeyboard';
import AuthSystem from './components/AuthSystem';
import QuizBoard from './components/QuizBoard';
import GuideSection from './components/GuideSection';
import TroubleshootSection from './components/TroubleshootSection';
import GlobalLeaderboard from './components/GlobalLeaderboard';
import RaceReplayModal from './components/RaceReplayModal';
import { safeFetchJson } from './utils/api';

// Sound choices
const SWITCHES: { value: SwitchType; label: string; desc: string }[] = [
  { value: 'mechanical', label: 'Mechanical Blue', desc: 'Tactile, clicky & crisp' },
  { value: 'creamy', label: 'Creamy Yellow', desc: 'Smooth, deep & thocky' },
  { value: 'typewriter', label: 'Vintage Typewriter', desc: 'Classic punchy metallic click' },
  { value: 'silent', label: 'Silent Pink', desc: 'Quiet, soft & muffled' },
  { value: 'none', label: 'Muted', desc: 'No switch audio' }
];

// Initial Achievements
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_race', title: 'First Steps', description: 'Complete your first typing speed test.', unlocked: false, icon: '🚀' },
  { id: 'speed_60', title: 'Wind Racer', description: 'Exceed 60 WPM typing speed.', unlocked: false, icon: '💨' },
  { id: 'speed_90', title: 'Speed Commander', description: 'Exceed 90 WPM typing speed.', unlocked: false, icon: '🎯' },
  { id: 'speed_120', title: 'Hyper-Sonic Speed', description: 'Exceed 120 WPM typing speed!', unlocked: false, icon: '⚡' },
  { id: 'accuracy_100', title: 'Flawless Typer', description: 'Complete a typing test with 100% accuracy.', unlocked: false, icon: '✨' },
  { id: 'code_wizard', title: 'Code Wizard', description: 'Complete a typing test in the coding category.', unlocked: false, icon: '💻' },
  { id: 'multiplayer_racer', title: 'Multiplayer Racer', description: 'Participate in any online multiplayer race.', unlocked: false, icon: '🏎️' },
  { id: 'bot_easy', title: 'Defeated Easy Bot', description: 'Outperform the Easy bot in practice mode.', unlocked: false, icon: '🤖' },
  { id: 'bot_medium', title: 'Defeated Medium Bot', description: 'Outperform the Medium bot in practice mode.', unlocked: false, icon: '🎯' },
  { id: 'bot_hard', title: 'Defeated Hard Bot', description: 'Outperform the Hard bot in practice mode.', unlocked: false, icon: '🔥' },
  { id: 'bot_extreme', title: 'Defeated Extreme Bot', description: 'Outperform the legendary Extreme bot!', unlocked: false, icon: '👑' },
  { id: 'auth_linked', title: 'Secured Profile', description: 'Successfully link your account via any auth provider.', unlocked: false, icon: '🛡️' }
];

function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KR-${result}`;
}

const renderAvatar = (avatar: string | undefined, name: string, sizeClass = "w-7 h-7 rounded-lg text-xs") => {
  const firstLetter = name ? name.trim().charAt(0).toUpperCase() : '?';
  const isCustom = avatar && avatar !== 'default' && (avatar.startsWith('data:') || avatar.length > 50);

  if (isCustom) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClass} object-cover rounded-lg border border-slate-800/20`}
        referrerPolicy="no-referrer"
      />
    );
  }

  const gradients = [
    'from-cyan-500 to-blue-600 text-white',
    'from-fuchsia-500 to-pink-600 text-white',
    'from-emerald-500 to-teal-600 text-white',
    'from-amber-500 to-orange-600 text-white',
    'from-indigo-500 to-purple-600 text-white',
    'from-rose-500 to-red-600 text-white',
  ];
  const code = name ? name.charCodeAt(0) : 0;
  const gradient = gradients[code % gradients.length];

  return (
    <div className={`${sizeClass} rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center font-extrabold select-none tracking-wide shadow-sm border border-white/10`}>
      {firstLetter}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'guide' | 'single' | 'bot' | 'multi' | 'quiz' | 'stats'>('guide');
  const [soundType, setSoundType] = useState<SwitchType>(() => {
    const saved = localStorage.getItem('keyrush_sound_preset');
    if (saved && ['mechanical', 'creamy', 'typewriter', 'silent', 'none'].includes(saved)) {
      return saved as SwitchType;
    }
    return 'mechanical';
  });
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(true);

  // Sync sound preset to localStorage
  useEffect(() => {
    localStorage.setItem('keyrush_sound_preset', soundType);
  }, [soundType]);
  
  // --- New Features States ---
  // 1. User Profile & Authentication
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('keyrush_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading user profile");
      }
    }
    return null; // Guest initially
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deleteAccountStep, setDeleteAccountStep] = useState<1 | 2>(1);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Permanently Delete Account Handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmInput.trim() !== 'DELETE') return;
    setIsDeletingAccount(true);
    try {
      const token = localStorage.getItem('keyrush_auth_token');
      const res = await fetch('/api/user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userId: userProfile?.id })
      });
      const data = await safeFetchJson(res);
      if (data.success) {
        localStorage.removeItem('keyrush_auth_token');
        localStorage.removeItem('keyrush_user_profile');
        localStorage.removeItem('keyrush_user_stats');
        setUserProfile(null);
        setPlayerName(`Racer-${Math.floor(100 + Math.random() * 899)}`);
        setIsDeleteAccountModalOpen(false);
        setDeleteAccountStep(1);
        setDeleteConfirmInput('');
        showToast('Account permanently deleted from database.', 'info');
      } else if (userProfile) {
        // Fallback local account deletion if server is unreachable
        localStorage.removeItem('keyrush_auth_token');
        localStorage.removeItem('keyrush_user_profile');
        localStorage.removeItem('keyrush_user_stats');
        setUserProfile(null);
        setPlayerName(`Racer-${Math.floor(100 + Math.random() * 899)}`);
        setIsDeleteAccountModalOpen(false);
        setDeleteAccountStep(1);
        setDeleteConfirmInput('');
        showToast('Account permanently removed.', 'info');
      } else {
        showToast(data.error || 'Failed to delete account.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server to delete account.', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };
  const [pingMs, setPingMs] = useState<number | null>(null);

  // 3. Bot practice states
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('medium');
  const [isBotRacing, setIsBotRacing] = useState(false);
  const [botCountdown, setBotCountdown] = useState<number>(0);
  const [botProgress, setBotProgress] = useState(0);
  const [botCompleted, setBotCompleted] = useState(false);
  const [botWpmState, setBotWpmState] = useState(0);
  const [botFinishedRank, setBotFinishedRank] = useState<'user' | 'bot' | null>(null);

  // Active rooms list in multiplayer
  const [activeRoomsList, setActiveRoomsList] = useState<any[]>([]);
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);
  
  // Game Configuration States
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
  const [customTheme, setCustomTheme] = useState<string>('');
  const [isGeneratingAiText, setIsGeneratingAiText] = useState(false);
  const [currentText, setCurrentText] = useState<string>('');
  const [textCategory, setTextCategory] = useState<string>('Health');

  // Typing focus
  const [isBoardFocused, setIsBoardFocused] = useState(false);

  // User Statistics & Achievements from localStorage
  const [userStats, setUserStats] = useState<UserStats>({
    racesCompleted: 0,
    averageWpm: 0,
    maxWpm: 0,
    averageAccuracy: 0,
    recentRaces: []
  });
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);

  // Ghost Typing & Hotkeys States
  const [enableGhost, setEnableGhost] = useState<boolean>(() => {
    const saved = localStorage.getItem('keyrush_enable_ghost');
    return saved !== null ? saved === 'true' : true;
  });
  const [ghostIndex, setGhostIndex] = useState<number | null>(null);

  const [activeTheme, setActiveTheme] = useState<'carbon' | 'carbon-light' | 'cyberpunk' | 'matrix' | 'sakura'>(() => {
    const saved = localStorage.getItem('keyrush_active_theme');
    return (saved as any) || 'carbon';
  });

  useEffect(() => {
    localStorage.setItem('keyrush_active_theme', activeTheme);
  }, [activeTheme]);

  const [hotkeys, setHotkeys] = useState(() => {
    const saved = localStorage.getItem('keyrush_hotkeys');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading saved hotkeys");
      }
    }
    return {
      restart: { key: 'Enter', ctrlKey: true, shiftKey: false, altKey: false, label: 'Ctrl + Enter' },
      openChat: { key: 'c', ctrlKey: false, shiftKey: false, altKey: true, label: 'Alt + C' },
      focus: { key: 'Escape', ctrlKey: false, shiftKey: false, altKey: false, label: 'Escape' }
    };
  });
  const [bindingHotkey, setBindingHotkey] = useState<'restart' | 'openChat' | 'focus' | null>(null);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Saved Race Replays History State
  const [savedReplays, setSavedReplays] = useState<RaceReplay[]>(() => {
    const saved = localStorage.getItem('keyrush_race_replays');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading saved race replays");
      }
    }
    return [];
  });
  const [activeReplay, setActiveReplay] = useState<RaceReplay | null>(null);
  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Desktop and Mobile Navigation Horizontal Scroll Controls
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const [canDesktopScrollLeft, setCanDesktopScrollLeft] = useState(false);
  const [canDesktopScrollRight, setCanDesktopScrollRight] = useState(false);
  const [canMobileScrollLeft, setCanMobileScrollLeft] = useState(false);
  const [canMobileScrollRight, setCanMobileScrollRight] = useState(false);

  const checkDesktopNavScroll = useCallback(() => {
    if (desktopNavRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = desktopNavRef.current;
      setCanDesktopScrollLeft(scrollLeft > 4);
      setCanDesktopScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  }, []);

  const checkMobileNavScroll = useCallback(() => {
    if (mobileNavRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mobileNavRef.current;
      setCanMobileScrollLeft(scrollLeft > 4);
      setCanMobileScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  }, []);

  useEffect(() => {
    const desktopEl = desktopNavRef.current;
    const mobileEl = mobileNavRef.current;
    
    checkDesktopNavScroll();
    checkMobileNavScroll();

    if (desktopEl) {
      desktopEl.addEventListener('scroll', checkDesktopNavScroll, { passive: true });
    }
    if (mobileEl) {
      mobileEl.addEventListener('scroll', checkMobileNavScroll, { passive: true });
    }

    window.addEventListener('resize', checkDesktopNavScroll);
    window.addEventListener('resize', checkMobileNavScroll);

    // Initial check after render
    const timer = setTimeout(() => {
      checkDesktopNavScroll();
      checkMobileNavScroll();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (desktopEl) desktopEl.removeEventListener('scroll', checkDesktopNavScroll);
      if (mobileEl) mobileEl.removeEventListener('scroll', checkMobileNavScroll);
      window.removeEventListener('resize', checkDesktopNavScroll);
      window.removeEventListener('resize', checkMobileNavScroll);
    };
  }, [checkDesktopNavScroll, checkMobileNavScroll, savedReplays]);

  const scrollNav = (target: 'desktop' | 'mobile', direction: 'left' | 'right') => {
    const el = target === 'desktop' ? desktopNavRef.current : mobileNavRef.current;
    if (el) {
      const amount = direction === 'left' ? -220 : 220;
      el.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Multiplayer States
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [joinRoomInput, setJoinRoomInput] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [playerColor, setPlayerColor] = useState<string>('#3B82F6');
  const [multiRoom, setMultiRoom] = useState<Room | null>(null);
  const [selfPlayerId, setSelfPlayerIdState] = useState<string>('');
  const selfPlayerIdRef = useRef<string>('');
  const setSelfPlayerId = useCallback((val: string) => {
    setSelfPlayerIdState(val);
    selfPlayerIdRef.current = val;
  }, []);
  const [isMultiConnecting, setIsMultiConnecting] = useState(false);
  const [multiCountdown, setMultiCountdown] = useState<number>(0);
  const [isMultiRacing, setIsMultiRacing] = useState(false);
  const [multiFinishedPlayers, setMultiFinishedPlayers] = useState<Player[]>([]);
  
  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: string; message: string; color: string; self: boolean }[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Typing Engine instance for Single Player
  const {
    userInput,
    completed,
    errorsCount,
    totalKeystrokes,
    startTime,
    resetEngine,
    handleKeyDown,
    getWpm,
    getAccuracy,
    getStats,
    wpmHistory,
    lastTypoHint,
    isShaking,
    consecutiveErrors,
    consecutiveErrorAlert,
  } = useTypingEngine(currentText, soundType);

  // Trigger alert toast if user reaches 5 consecutive typos
  useEffect(() => {
    if (consecutiveErrorAlert && consecutiveErrorAlert.count >= 5) {
      showToast(`⚠️ ${consecutiveErrorAlert.count} consecutive typos! Take a breath and slow down to regain precision.`, 'error');
    }
  }, [consecutiveErrorAlert, showToast]);

  // Generate or load standard text
  const loadText = useCallback(async (aiTheme?: string) => {
    resetEngine();
    if (aiTheme) {
      setIsGeneratingAiText(true);
      try {
        const response = await fetch(`/api/generate-text?theme=${encodeURIComponent(aiTheme)}&lang=${selectedLang}&diff=${selectedDifficulty}`);
        const data = await safeFetchJson(response);
        if (data.text) {
          setCurrentText(data.text);
          setTextCategory(`AI Topic Engine: ${data.theme || aiTheme}`);
        } else {
          throw new Error("No text returned");
        }
      } catch (err) {
        console.error("AI text fetch failed, using fallback:", err);
        const fallback = getRandomText(selectedLang, selectedDifficulty);
        setCurrentText(fallback.text);
        setTextCategory(fallback.category || 'General');
      } finally {
        setIsGeneratingAiText(false);
      }
    } else {
      const selected = getRandomText(selectedLang, selectedDifficulty);
      setCurrentText(selected.text);
      setTextCategory(selected.category || 'System Text');
    }
  }, [selectedLang, selectedDifficulty, resetEngine]);

  // Load stats, achievements and DB session on mount
  useEffect(() => {
    // Attempt DB session fetch via bearer token
    const token = localStorage.getItem('keyrush_auth_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => safeFetchJson(res))
      .then(data => {
        if (data.success && data.user) {
          setUserProfile(data.user);
          setPlayerName(data.user.name);
          if (data.user.stats) {
            setUserStats(data.user.stats);
          }
        }
      })
      .catch(() => {});
    }

    const savedStats = localStorage.getItem('keyrush_user_stats');
    if (savedStats) {
      try {
        setUserStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Error loading saved stats");
      }
    } else {
      // Seed random nickname
      setPlayerName(`Racer-${Math.floor(Math.random() * 899 + 100)}`);
    }

    const savedAchievements = localStorage.getItem('keyrush_achievements');
    if (savedAchievements) {
      try {
        const parsed: Achievement[] = JSON.parse(savedAchievements);
        setAchievements(DEFAULT_ACHIEVEMENTS.map(def => {
          const found = parsed.find(p => p.id === def.id);
          return found ? { ...def, unlocked: found.unlocked, unlockedAt: found.unlockedAt } : def;
        }));
      } catch (e) {
        console.error("Error loading achievements");
      }
    }

    // Check for shared score in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');
    if (shareParam) {
      try {
        const decoded = JSON.parse(atob(shareParam));
        if (decoded.wpm) {
          setTimeout(() => {
            showToast(`⚡ Shared Performance Challenge: ${decoded.wpm} WPM (${decoded.acc || 100}% Accuracy)!`, 'info');
          }, 800);
        }
      } catch {
        // Invalid base64 string, ignore
      }
    }

    // Set arbitrary default colors for car
    const colors = ['#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#8B5CF6', '#EF4444'];
    setPlayerColor(colors[Math.floor(Math.random() * colors.length)]);

    // Load initial text
    loadText();
  }, []);

  // Sync active theme with document body
  useEffect(() => {
    document.body.setAttribute('data-theme', activeTheme);
    document.body.className = `theme-${activeTheme}`;
  }, [activeTheme]);


  // --- NEW FEATURES EFFECTS ---

  // Sync user profile with player name & persist
  useEffect(() => {
    if (userProfile) {
      setPlayerName(userProfile.name);
      localStorage.setItem('keyrush_user_profile', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('keyrush_user_profile');
    }
  }, [userProfile]);

  // Measure real-time connection latency (ping)
  useEffect(() => {
    const checkPing = async () => {
      try {
        const start = performance.now();
        const res = await fetch('/api/health');
        if (res.ok) {
          const end = performance.now();
          setPingMs(Math.round(end - start));
        }
      } catch {
        // Silently swallow ping network latency check failures
      }
    };
    checkPing();
    const interval = setInterval(checkPing, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active multiplayer rooms
  const fetchActiveRooms = useCallback(async () => {
    setIsFetchingRooms(true);
    try {
      const res = await fetch('/api/active-rooms');
      const data = await safeFetchJson(res);
      if (Array.isArray(data)) {
        setActiveRoomsList(data);
      } else if (data && Array.isArray(data.rooms)) {
        setActiveRoomsList(data.rooms);
      } else {
        setActiveRoomsList([]);
      }
    } catch (e) {
      setActiveRoomsList([]);
    } finally {
      setIsFetchingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'multi') {
      fetchActiveRooms();
      const interval = setInterval(fetchActiveRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchActiveRooms]);

  // Bot practice mode: Countdown loop
  useEffect(() => {
    if (activeTab === 'bot' && botCountdown > 0) {
      const timer = setTimeout(() => {
        setBotCountdown((prev) => {
          if (prev === 1) {
            setIsBotRacing(true);
            setBotProgress(0);
            setBotCompleted(false);
            setBotFinishedRank(null);
            setIsBoardFocused(true);
            playSwitchSound(soundType);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeTab, botCountdown, soundType]);

  // Bot practice mode: Typing speed physics simulation
  useEffect(() => {
    if (activeTab === 'bot' && isBotRacing && !botCompleted && currentText.length > 0) {
      const botWpm = botDifficulty === 'easy' ? 38 : botDifficulty === 'medium' ? 65 : botDifficulty === 'hard' ? 95 : 135;
      setBotWpmState(botWpm);

      const charsPerSec = (botWpm * 5) / 60;
      const intervalMs = 150;
      const charsPerInterval = charsPerSec * (intervalMs / 1000);

      const interval = setInterval(() => {
        setBotProgress((prev) => {
          const jitter = (Math.random() - 0.45) * charsPerInterval * 0.4;
          const next = prev + Math.max(0, charsPerInterval + jitter);

          if (next >= currentText.length) {
            setBotCompleted(true);
            clearInterval(interval);
            if (!completed) {
              setBotFinishedRank('bot');
            }
            return currentText.length;
          }
          return next;
        });
      }, intervalMs);

      return () => clearInterval(interval);
    }
  }, [activeTab, isBotRacing, botCompleted, botDifficulty, currentText, completed]);

  // Bot practice mode: Handle user completing typing run
  useEffect(() => {
    if (activeTab === 'bot' && completed && isBotRacing) {
      setIsBotRacing(false);
      if (!botFinishedRank) {
        setBotFinishedRank('user');
        if (botDifficulty === 'easy') unlockAchievement('bot_easy');
        else if (botDifficulty === 'medium') unlockAchievement('bot_medium');
        else if (botDifficulty === 'hard') unlockAchievement('bot_hard');
        else if (botDifficulty === 'extreme') unlockAchievement('bot_extreme');
      }

      const finalStats = getStats();
      saveGameResult(finalStats);
    }
  }, [completed, activeTab, isBotRacing, botFinishedRank, botDifficulty]);


  // Sync multiplayer progress to WS server
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN && isMultiRacing && multiRoom) {
      const currentWpm = getWpm();
      const currentAcc = getAccuracy();
      const characterProgress = userInput.length;

      socket.send(JSON.stringify({
        type: "progress",
        progress: characterProgress,
        errorsCount,
        wpm: currentWpm,
        accuracy: currentAcc,
        completed
      }));
    }
  }, [userInput, completed, errorsCount, socket, isMultiRacing, getWpm, getAccuracy, multiRoom]);

  // Handle single player completing
  useEffect(() => {
    if (completed && activeTab === 'single') {
      const finalStats = getStats();
      saveGameResult(finalStats);
    }
  }, [completed, activeTab]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Lobby creation configuration states
  const [lobbyTextMode, setLobbyTextMode] = useState<'random' | 'ai' | 'custom'>('random');
  const [lobbyAiPrompt, setLobbyAiPrompt] = useState<string>('');
  const [lobbyCustomText, setLobbyCustomText] = useState<string>('');
  const [isLobbyCreating, setIsLobbyCreating] = useState<boolean>(false);

  // Connect to Multiplayer room via WebSocket
  const joinMultiplayer = useCallback((targetRoomId: string, customTextOverride?: string) => {
    if (isMultiConnecting) return;
    setIsMultiConnecting(true);
    setChatMessages([]);

    // Close existing socket if open
    if (socket) {
      socket.close();
    }

    // Determine the WS protocol based on URL (WSS for HTTPS)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onerror = (err) => {
      console.warn("Multiplayer WebSocket connection error:", err);
      setIsMultiConnecting(false);
    };

    newSocket.onopen = () => {
      console.log("WebSocket connected successfully");
      newSocket.send(JSON.stringify({
        type: "join",
        roomId: targetRoomId,
        name: playerName,
        color: playerColor,
        language: selectedLang,
        difficulty: selectedDifficulty,
        customText: customTextOverride || undefined
      }));
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "init": {
            setSelfPlayerId(data.selfId);
            setRoomId(data.roomId);
            setCurrentText(data.text);
            resetEngine();
            
            const roomObj: Room = {
              id: data.roomId,
              text: data.text,
              language: selectedLang,
              difficulty: selectedDifficulty,
              players: data.players,
              status: data.status,
              countdown: data.countdown,
              createdAt: data.createdAt || Date.now()
            };
            setMultiRoom(roomObj);
            setIsMultiConnecting(false);

            if (data.status === "countdown") {
              setMultiCountdown(data.countdown);
            } else if (data.status === "racing") {
              setIsMultiRacing(true);
            }
            break;
          }

          case "players_update": {
            setMultiRoom((prev) => prev ? { ...prev, players: data.players } : null);
            break;
          }

          case "countdown": {
            setMultiCountdown(data.seconds);
            setMultiRoom((prev) => prev ? { ...prev, status: "countdown", countdown: data.seconds } : null);
            break;
          }

          case "start_race": {
            setMultiCountdown(0);
            setIsMultiRacing(true);
            setMultiFinishedPlayers([]);
            setMultiRoom((prev) => prev ? { ...prev, status: "racing" } : null);
            setIsBoardFocused(true);
            // Alert user visually/sound
            playSwitchSound(soundType);
            break;
          }

          case "progress_update": {
            setMultiRoom((prev) => prev ? { ...prev, players: data.players } : null);
            break;
          }

          case "chat_message": {
            setChatMessages((prev) => [
              ...prev,
              {
                sender: data.sender,
                message: data.message,
                color: data.color,
                self: data.playerId === selfPlayerIdRef.current
              }
            ]);
            break;
          }

          case "race_finished": {
            setIsMultiRacing(false);
            setMultiRoom((prev) => prev ? { ...prev, status: "finished", players: data.players } : null);
            setMultiFinishedPlayers(data.players);
            
            // Record multiplayer achievement
            unlockAchievement('multiplayer_racer');

            // Save stats
            const selfPlayer = data.players.find((p: Player) => p.id === selfPlayerIdRef.current);
            if (selfPlayer) {
              const multiStats: GameStats = {
                wpm: selfPlayer.wpm,
                accuracy: selfPlayer.accuracy,
                cpm: Math.round(selfPlayer.progress / 5), // rough estimate
                errors: selfPlayer.errorsCount,
                elapsedMs: 30000, // placeholder since we don't have perfect end times for others
                errorHeatmap: {},
                wpmHistory: []
              };
              saveGameResult(multiStats, true);
            }
            break;
          }
        }
      } catch (err) {
        console.error("Error decoding WS frame:", err);
      }
    };

    newSocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsMultiConnecting(false);
      setIsMultiRacing(false);
      setMultiRoom(null);
      setSocket(null);
    };

    setSocket(newSocket);
  }, [playerName, playerColor, selectedLang, selectedDifficulty, resetEngine, soundType]);

  // Handler for creating room with Random Text, AI Text, or Custom Text
  const handleCreateLobbyRoom = async () => {
    const newRoomId = generateRoomId();
    
    if (lobbyTextMode === 'random') {
      joinMultiplayer(newRoomId);
      return;
    }

    if (lobbyTextMode === 'ai') {
      if (!lobbyAiPrompt.trim()) {
        showToast("Please enter a topic prompt for AI text generation!", "error");
        return;
      }
      setIsLobbyCreating(true);
      try {
        const res = await fetch('/api/generate-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: lobbyAiPrompt.trim(), language: selectedLang, difficulty: selectedDifficulty })
        });
        const data = await res.json();
        if (data.text) {
          showToast("AI room passage generated successfully!", "success");
          joinMultiplayer(newRoomId, data.text);
        } else {
          showToast("Issue generating AI text. Using standard passage.", "info");
          joinMultiplayer(newRoomId);
        }
      } catch (e) {
        showToast("Error generating AI text. Room created with standard passage.", "error");
        joinMultiplayer(newRoomId);
      } finally {
        setIsLobbyCreating(false);
      }
      return;
    }

    if (lobbyTextMode === 'custom') {
      if (!lobbyCustomText.trim() || lobbyCustomText.trim().length < 10) {
        showToast("Custom text must contain at least 10 characters!", "error");
        return;
      }
      showToast("Creating room with your custom passage!", "success");
      joinMultiplayer(newRoomId, lobbyCustomText.trim());
      return;
    }
  };

  // Auto-join room from URL search parameters on startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      // Clear query parameters from URL so refreshes don't re-trigger joining
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Delay slightly to allow the app to initialize its player name or configs
      const timer = setTimeout(() => {
        setActiveTab('multi');
        joinMultiplayer(roomParam);
        showToast(`Ulanish kodi aniqlandi: ${roomParam}`, 'info');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [joinMultiplayer, showToast]);

  // Start multiplayer countdown early
  const startMultiplayerCountdown = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "start_race" }));
    }
  };

  // Send Chat message
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: "chat",
      message: chatInput.trim()
    }));
    setChatInput('');
  };

  // Disconnect from Multiplayer
  const leaveMultiplayer = () => {
    if (socket) {
      socket.close();
    }
    setMultiRoom(null);
    setIsMultiRacing(false);
    setMultiFinishedPlayers([]);
    loadText();
  };

  // Copy invitation link to clipboard
  const copyInviteLink = () => {
    const url = `https://keyrush.io/?room=${roomId}`;
    navigator.clipboard.writeText(url);
    showToast(`Room invitation link copied: ${url}`, 'success');
  };

  // Save game result locally and calculate achievements
  const saveGameResult = (stats: GameStats, isMulti: boolean = false) => {
    // Record race replay history if keystrokes were captured
    if (stats.keystrokes && stats.keystrokes.length > 0) {
      const replayItem: RaceReplay = {
        id: `replay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: new Date().toLocaleString(),
        text: currentText,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        cpm: stats.cpm,
        errors: stats.errors,
        elapsedMs: stats.elapsedMs,
        language: isMulti ? 'multiplayer' : selectedLang,
        difficulty: selectedDifficulty,
        category: textCategory,
        keystrokes: stats.keystrokes,
      };

      setSavedReplays((prev) => {
        const nextReplays = [replayItem, ...prev].slice(0, 30);
        localStorage.setItem('keyrush_race_replays', JSON.stringify(nextReplays));
        return nextReplays;
      });

      setActiveReplay(replayItem);
    }

    setUserStats((prev) => {
      const completed = prev.racesCompleted + 1;
      const totalWpm = prev.averageWpm * prev.racesCompleted + stats.wpm;
      const averageWpm = Math.round(totalWpm / completed);
      const maxWpm = Math.max(prev.maxWpm, stats.wpm);
      
      const totalAcc = prev.averageAccuracy * prev.racesCompleted + stats.accuracy;
      const averageAccuracy = Math.round(totalAcc / completed);

      const newRaceLog = {
        date: new Date().toLocaleDateString(),
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        language: isMulti ? 'multiplayer' : selectedLang
      };

      const recentRaces = [newRaceLog, ...prev.recentRaces].slice(0, 10);

      // Accumulate character error frequency heatmap
      const accumulatedHeatmap = { ...(prev.errorHeatmap || {}) };
      if (stats.errorHeatmap) {
        Object.entries(stats.errorHeatmap).forEach(([key, count]) => {
          accumulatedHeatmap[key] = (accumulatedHeatmap[key] || 0) + count;
        });
      }

      const updated = {
        racesCompleted: completed,
        averageWpm,
        maxWpm,
        averageAccuracy,
        recentRaces,
        errorHeatmap: accumulatedHeatmap
      };

      localStorage.setItem('keyrush_user_stats', JSON.stringify(updated));

      // Persist to Real Database API
      const token = localStorage.getItem('keyrush_auth_token');
      if (token || userProfile?.id) {
        fetch('/api/user/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            stats: updated,
            userId: userProfile?.id,
            name: userProfile?.name,
            bio: userProfile?.bio,
            avatar: userProfile?.avatar
          })
        }).catch(err => console.error("Error persisting user stats to DB:", err));
      }

      return updated;
    });

    // Check Achievements
    unlockAchievement('first_race');
    if (stats.wpm >= 60) unlockAchievement('speed_60');
    if (stats.wpm >= 90) unlockAchievement('speed_90');
    if (stats.wpm >= 120) unlockAchievement('speed_120');
    if (stats.accuracy === 100 && currentText.length > 30) unlockAchievement('accuracy_100');
    if (selectedLang === 'code') unlockAchievement('code_wizard');
    if (isMulti) unlockAchievement('multiplayer_racer');
  };

  // Helper to unlock an achievement
  const unlockAchievement = (id: string) => {
    setAchievements((prev) => {
      const updated = prev.map((ach) => {
        if (ach.id === id && !ach.unlocked) {
          return {
            ...ach,
            unlocked: true,
            unlockedAt: new Date().toISOString()
          };
        }
        return ach;
      });
      localStorage.setItem('keyrush_achievements', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRestart = useCallback(() => {
    resetEngine();
    loadText();
    setIsBoardFocused(true);
  }, [resetEngine, loadText]);

  // Save enableGhost setting to localStorage
  useEffect(() => {
    localStorage.setItem('keyrush_enable_ghost', String(enableGhost));
  }, [enableGhost]);

  // Update Ghost Typing position dynamically
  useEffect(() => {
    if (activeTab === 'single' && startTime && !completed && enableGhost) {
      const ghostWpm = userStats.maxWpm > 0 ? userStats.maxWpm : 50;
      const interval = setInterval(() => {
        const elapsedSecs = (Date.now() - startTime) / 1000;
        const charProgress = Math.floor((ghostWpm * elapsedSecs) / 12);
        setGhostIndex(Math.min(charProgress, currentText.length));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setGhostIndex(null);
    }
  }, [startTime, completed, enableGhost, activeTab, userStats.maxWpm, currentText.length]);

  // Capture key press for binding hotkeys
  useEffect(() => {
    if (!bindingHotkey) return;

    const handleBindKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Don't bind on just modifier key presses alone
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

      const updated = {
        ...hotkeys,
        [bindingHotkey]: {
          key: e.key,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          label: `${e.ctrlKey ? 'Ctrl + ' : ''}${e.shiftKey ? 'Shift + ' : ''}${e.altKey ? 'Alt + ' : ''}${e.key === ' ' ? 'Space' : e.key}`
        }
      };

      setHotkeys(updated);
      localStorage.setItem('keyrush_hotkeys', JSON.stringify(updated));
      setBindingHotkey(null);
    };

    window.addEventListener('keydown', handleBindKeyPress, true);
    return () => window.removeEventListener('keydown', handleBindKeyPress, true);
  }, [bindingHotkey, hotkeys]);

  // Global hotkeys handler
  useEffect(() => {
    if (bindingHotkey) return;

    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      const matches = (config: typeof hotkeys.restart) => {
        if (!e?.key || !config?.key) return false;
        return e.key.toLowerCase() === config.key.toLowerCase() &&
               e.ctrlKey === config.ctrlKey &&
               e.shiftKey === config.shiftKey &&
               e.altKey === config.altKey;
      };

      // Restart hotkey
      if (matches(hotkeys.restart)) {
        e.preventDefault();
        handleRestart();
        return;
      }

      // Open Chat hotkey
      if (matches(hotkeys.openChat)) {
        e.preventDefault();
        if (activeTab !== 'multi') {
          setActiveTab('multi');
        }
        setTimeout(() => {
          const chatInputEl = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
          if (chatInputEl) {
            chatInputEl.focus();
          }
        }, 120);
        return;
      }

      // Focus typing board hotkey
      if (matches(hotkeys.focus)) {
        const isInputActive = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
        if (!isInputActive) {
          e.preventDefault();
          setIsBoardFocused(true);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalHotkeys);
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, [hotkeys, bindingHotkey, activeTab, handleRestart]);

  const isLightTheme = activeTheme === 'sakura' || activeTheme === 'carbon-light';

  return (
    <div id="keyrush-app" className={`min-h-screen ${THEME_STYLES[activeTheme].appBg} flex flex-col font-sans transition-all duration-300 relative`}>
      
      {/* 0. DYNAMIC TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: -20, scale: 0.95, x: "-50%" }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-6 left-1/2 z-[9999] flex items-center gap-2 px-3.5 py-2.5 rounded-xl border shadow-xl backdrop-blur-md text-xs font-bold tracking-wide select-none"
            style={{
              backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.94)',
              borderColor: toast.type === 'success' 
                ? 'rgba(16, 185, 129, 0.35)' 
                : toast.type === 'error' 
                ? 'rgba(239, 68, 68, 0.35)' 
                : 'rgba(6, 182, 212, 0.35)',
              color: toast.type === 'success' 
                ? (isLightTheme ? '#059669' : '#34d399') 
                : toast.type === 'error' 
                ? (isLightTheme ? '#dc2626' : '#f87171') 
                : (isLightTheme ? '#0891b2' : '#22d3ee')
            }}
          >
            {toast.type === 'success' ? <CheckCircle size={14} className="shrink-0" /> : <Info size={14} className="shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HEADER SECTION */}
      <header className={`border-b ${THEME_STYLES[activeTheme].headerBg} backdrop-blur-md sticky top-0 z-50 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 min-h-16 py-2 md:py-0 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 lg:gap-4">
          
          {/* Logo */}
          <div id="app-logo" className="flex items-center gap-2.5 shrink-0">
            <div className={`bg-gradient-to-tr ${THEME_STYLES[activeTheme].logoGlow} p-2 rounded-xl shadow-lg transition-all duration-300`}>
              <Rocket className={isLightTheme ? "text-white transform rotate-45" : "text-slate-950 transform rotate-45"} size={18} />
            </div>
            <div>
              <span className={`text-xl font-black tracking-tight ${
                isLightTheme ? 'text-slate-900' : 'bg-gradient-to-r from-white via-cyan-300 to-indigo-200 bg-clip-text text-transparent'
              }`}>
                KeyRush
              </span>
              <span className={`text-[9px] font-bold block leading-none tracking-widest uppercase ${
                activeTheme === 'cyberpunk' ? 'text-pink-400' : activeTheme === 'matrix' ? 'text-emerald-400' : activeTheme === 'sakura' ? 'text-rose-500' : 'text-cyan-400'
              }`}>
                Zero-Latency Engine
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Visible on lg: 1024px and wider) */}
          <nav
            className={`hidden lg:flex items-center gap-1.5 p-1.5 rounded-2xl border transition-all duration-300 shrink-0 ${
              isLightTheme 
                ? 'bg-slate-100/90 border-slate-200 text-slate-600' 
                : 'bg-slate-900/90 border-slate-800 text-slate-400'
            }`}
          >
            <button
              onClick={() => { setActiveTab('guide'); leaveMultiplayer(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer shrink-0 ${
                activeTab === 'guide'
                  ? isLightTheme
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'hover:text-current hover:bg-slate-800/20'
              }`}
            >
              <Info size={14} />
              <span>Guide</span>
            </button>
            <button
              onClick={() => { setActiveTab('single'); leaveMultiplayer(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer shrink-0 ${
                activeTab === 'single'
                  ? isLightTheme
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'hover:text-current hover:bg-slate-800/20'
              }`}
            >
              <Keyboard size={14} />
              <span>Single Player</span>
            </button>
            <button
              onClick={() => { setActiveTab('bot'); leaveMultiplayer(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer shrink-0 ${
                activeTab === 'bot'
                  ? isLightTheme
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'hover:text-current hover:bg-slate-800/20'
              }`}
            >
              <Cpu size={14} />
              <span>Bot Arena</span>
            </button>
            <button
              onClick={() => { setActiveTab('multi'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer shrink-0 ${
                activeTab === 'multi'
                  ? isLightTheme
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-slate-800 text-white shadow-sm'
                  : 'hover:text-current hover:bg-slate-800/20'
              }`}
            >
              <Users size={14} />
              <span>Multiplayer</span>
            </button>
            <button
              onClick={() => { setActiveTab('quiz'); leaveMultiplayer(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer shrink-0 ${
                activeTab === 'quiz'
                  ? isLightTheme
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'hover:text-current hover:bg-slate-800/20'
              }`}
            >
              <Brain size={14} className="text-pink-400 animate-pulse" />
              <span>Quiz</span>
              <span className="text-[8px] bg-pink-500/20 text-pink-400 px-1 py-0.5 rounded font-extrabold uppercase">
                NEW
              </span>
            </button>
            {savedReplays.length > 0 && (
              <button
                onClick={() => {
                  if (savedReplays.length > 0) {
                    setActiveReplay(savedReplays[0]);
                    setIsReplayModalOpen(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer shrink-0 border ${
                  isLightTheme
                    ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                    : 'bg-purple-950/40 text-purple-300 border-purple-500/30 hover:bg-purple-900/50'
                }`}
              >
                <Activity size={14} className="text-purple-400" />
                <span>Replays ({savedReplays.length})</span>
              </button>
            )}
          </nav>

          {/* Theme Selector, Sound Preset & Auth status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto md:ml-0">
            {/* Sound Pack Preset Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSoundMenuOpen(!isSoundMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isLightTheme
                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
                title="Select Sound Pack Preset"
              >
                {soundType === 'none' ? (
                  <VolumeX size={15} className="text-slate-500" />
                ) : (
                  <Volume2 size={15} className="text-cyan-400" />
                )}
                <span className="hidden sm:inline">
                  {SWITCHES.find(s => s.value === soundType)?.label || 'Mechanical'}
                </span>
              </button>

              <AnimatePresence>
                {isSoundMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className={`absolute right-0 mt-2 w-56 p-2 rounded-2xl border shadow-xl z-50 backdrop-blur-md ${
                      isLightTheme ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-slate-950/95 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="px-2 py-1 mb-1 border-b border-slate-800/30 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Sound Switch Presets
                      </span>
                      <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        Saved
                      </span>
                    </div>
                    <div className="space-y-1">
                      {SWITCHES.map((sw) => {
                        const isSelected = soundType === sw.value;
                        return (
                          <button
                            key={sw.value}
                            onClick={() => {
                              setSoundType(sw.value);
                              playSwitchSound(sw.value);
                              setIsSoundMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                              isSelected
                                ? isLightTheme ? 'bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold' : 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold'
                                : isLightTheme ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-900 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{sw.label}</span>
                              </div>
                              <p className="text-[10px] opacity-70 font-normal">{sw.desc}</p>
                            </div>
                            {isSelected && <Check size={14} className="text-cyan-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick theme selector dots */}
            <div className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-xl border transition-all duration-300 ${
              isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
            }`}>
              {[
                { id: 'carbon', name: 'Carbon Dark', color: 'bg-slate-800 border-slate-700', activeRing: 'ring-cyan-400' },
                { id: 'carbon-light', name: 'Carbon Light', color: 'bg-white border-slate-300', activeRing: 'ring-slate-500' },
                { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-purple-950 border-pink-500/50', activeRing: 'ring-pink-500' },
                { id: 'matrix', name: 'Matrix Green', color: 'bg-black border-emerald-500/50', activeRing: 'ring-[#33ff33]' },
                { id: 'sakura', name: 'Sakura Pastel', color: 'bg-rose-50 border-rose-200', activeRing: 'ring-rose-400' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTheme(t.id as any)}
                  title={t.name}
                  className={`w-4 h-4 rounded-full border transition-all cursor-pointer relative ${t.color} ${
                    activeTheme === t.id 
                      ? `ring-1 ring-offset-1 ${isLightTheme ? 'ring-offset-white' : 'ring-offset-slate-950'} ${t.activeRing} scale-110` 
                      : 'hover:scale-110 opacity-75 hover:opacity-100'
                  }`}
                />
              ))}
            </div>

            {/* Mobile Settings Drawer Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className={`md:hidden p-2 rounded-xl border cursor-pointer transition-all ${
                isLightTheme ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
              title="Settings"
            >
              <Sliders size={16} />
            </button>

            {/* Anti Cheat badge */}
            <div className={`hidden lg:flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-xl font-medium border transition-all duration-300 ${
              isLightTheme
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30'
            }`}>
              <ShieldCheck size={12} />
              <span>Anti-Cheat</span>
            </div>

            {/* Authentication Widget Button */}
            {userProfile ? (
              <button
                onClick={() => { setActiveTab('stats'); leaveMultiplayer(); }}
                className={`flex items-center gap-2 p-1 pr-3 rounded-xl border cursor-pointer transition-all ${
                  isLightTheme 
                    ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800' 
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-200'
                }`}
              >
                {renderAvatar(userProfile.avatar, userProfile.name)}
                <span className="text-xs font-bold max-w-[80px] truncate hidden sm:inline">{userProfile.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                <ShieldCheck size={12} />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>

        {/* MOBILE & TABLET SUB-HEADER MODE NAVIGATION BAR (Shown on screens < 1024px) */}
        <div className={`lg:hidden border-t px-3 py-2 transition-all relative ${
          isLightTheme ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-950/95 border-slate-800'
        }`}>
          <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-none flex items-center gap-2 scroll-smooth w-full py-0.5">
            <button
              onClick={() => { setActiveTab('guide'); leaveMultiplayer(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                activeTab === 'guide'
                  ? isLightTheme ? 'bg-white text-slate-900 shadow-sm' : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : isLightTheme ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Info size={14} />
              <span>Guide</span>
            </button>
            <button
              onClick={() => { setActiveTab('single'); leaveMultiplayer(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                activeTab === 'single'
                  ? isLightTheme ? 'bg-white text-slate-900 shadow-sm' : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : isLightTheme ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Keyboard size={14} />
              <span>Single Player</span>
            </button>
            <button
              onClick={() => { setActiveTab('bot'); leaveMultiplayer(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                activeTab === 'bot'
                  ? isLightTheme ? 'bg-white text-slate-900 shadow-sm' : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : isLightTheme ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu size={14} />
              <span>Bot Arena</span>
            </button>
            <button
              onClick={() => { setActiveTab('multi'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                activeTab === 'multi'
                  ? isLightTheme ? 'bg-white text-slate-900 shadow-sm' : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : isLightTheme ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users size={14} />
              <span>Multiplayer</span>
            </button>
            <button
              onClick={() => { setActiveTab('quiz'); leaveMultiplayer(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                activeTab === 'quiz'
                  ? isLightTheme ? 'bg-pink-500 text-white font-bold shadow-sm' : 'bg-pink-500 text-slate-950 font-bold shadow-sm'
                  : isLightTheme ? 'text-pink-600 hover:bg-pink-100/50' : 'text-pink-400 hover:bg-pink-950/30'
              }`}
            >
              <Brain size={14} className="animate-pulse" />
              <span>Quiz</span>
              <span className="text-[8px] bg-pink-500/20 text-pink-400 px-1 py-0.5 rounded font-extrabold uppercase">
                NEW
              </span>
            </button>
            {savedReplays.length > 0 && (
              <button
                onClick={() => {
                  if (savedReplays.length > 0) {
                    setActiveReplay(savedReplays[0]);
                    setIsReplayModalOpen(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 cursor-pointer transition-all ${
                  isLightTheme 
                    ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' 
                    : 'bg-purple-950/60 text-purple-300 border-purple-500/40 hover:bg-purple-900/60'
                }`}
              >
                <Activity size={14} className="text-purple-400" />
                <span>Replays ({savedReplays.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER SETTINGS PANEL */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden border-b backdrop-blur-md px-4 py-4 space-y-4 relative z-40 ${
              isLightTheme ? 'bg-white/95 border-slate-200 shadow-lg' : 'bg-slate-900/95 border-slate-800 shadow-2xl'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>
                Mobile Settings & Modes
              </span>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Themes */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-2">Themes & Color Aesthetics:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'carbon', name: 'Carbon Dark' },
                  { id: 'carbon-light', name: 'Carbon Light' },
                  { id: 'cyberpunk', name: 'Cyberpunk' },
                  { id: 'matrix', name: 'Matrix Green' },
                  { id: 'sakura', name: 'Sakura Pastel' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTheme(t.id as any); setIsMobileDrawerOpen(false); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      activeTheme === t.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                        : isLightTheme ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard sounds */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-2">Mechanical Switch Audio:</span>
              <div className="grid grid-cols-2 gap-2">
                {SWITCHES.map((sw) => (
                  <button
                    key={sw.value}
                    onClick={() => { setSoundType(sw.value); playSwitchSound(sw.value); }}
                    className={`p-2 rounded-xl text-xs border text-left font-bold cursor-pointer ${
                      soundType === sw.value
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : isLightTheme ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {sw.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Replays Access */}
            {savedReplays.length > 0 && (
              <div className="pt-2 border-t border-slate-800/40">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Saved Race Replays:</span>
                <button
                  onClick={() => {
                    setActiveReplay(savedReplays[0]);
                    setIsReplayModalOpen(true);
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-purple-900/50"
                >
                  <Activity size={14} className="text-purple-400" />
                  <span>View Saved Replays ({savedReplays.length})</span>
                </button>
              </div>
            )}

            {/* Virtual Keyboard toggle on mobile */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/40">
              <span className="text-xs font-bold text-slate-300">Virtual Keyboard Display:</span>
              <button
                onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                  showVirtualKeyboard ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {showVirtualKeyboard ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BODY CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8">
        
        <AnimatePresence mode="wait">
          {/* GUIDE & ABOUT SECTION (DEFAULT LANDING VIEW) */}
          {activeTab === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GuideSection
                activeTheme={activeTheme}
                isLightTheme={isLightTheme}
                onStartSinglePlayer={() => setActiveTab('single')}
                onStartBotArena={() => setActiveTab('bot')}
                onStartMultiplayer={() => setActiveTab('multi')}
                onStartQuiz={() => setActiveTab('quiz')}
              />
            </motion.div>
          )}

          {/* A. SINGLE PLAYER MODE */}
          {activeTab === 'single' && (
            <motion.div
              key="single"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Dashboard Result screen after complete */}
              {completed ? (
                <Dashboard 
                  stats={getStats()} 
                  onRestart={handleRestart}
                  onWatchReplay={() => setIsReplayModalOpen(true)}
                  achievements={achievements}
                  recentRaces={userStats.recentRaces}
                  activeTheme={activeTheme}
                />
              ) : (
                <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
                  
                  {/* Right Column Typing board (Appears FIRST on mobile) */}
                  <div className="order-1 lg:order-2 lg:col-span-3 space-y-4 sm:space-y-6 min-w-0 w-full overflow-hidden sm:overflow-visible">
                    
                    {/* Real-time stats header */}
                    <div className={`flex flex-col sm:flex-row items-center justify-between p-3.5 sm:p-4 gap-3 ${THEME_STYLES[activeTheme].cardBg} rounded-2xl backdrop-blur-md transition-all duration-300 shadow-sm`}>
                      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-bold uppercase font-mono ${
                          activeTheme === 'cyberpunk' ? 'bg-pink-950/30 text-pink-400 border-pink-500/20'
                            : activeTheme === 'matrix' ? 'bg-black text-[#33ff33] border-emerald-900/40'
                            : activeTheme === 'sakura' ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-[inset_0_1px_1px_rgba(244,63,94,0.02)]'
                            : activeTheme === 'carbon-light' ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-cyan-900/40 text-cyan-400 border-cyan-500/20 shadow-[inset_0_0_8px_rgba(6,182,212,0.1)]'
                        }`}>
                          Topic: {textCategory}
                        </span>
                      </div>
                      
                      {/* Fast Stats panel */}
                      <div className="grid grid-cols-4 sm:flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-5 font-mono text-sm">
                        <div className="text-center sm:text-right">
                          <span className={`text-[10px] block font-bold ${isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>WPM</span>
                          <span className={`text-base font-extrabold ${
                            activeTheme === 'cyberpunk' ? 'text-pink-400' : activeTheme === 'matrix' ? 'text-emerald-400' : activeTheme === 'sakura' ? 'text-rose-600' : 'text-cyan-400'
                          }`}>{getWpm()}</span>
                        </div>
                        <div className="text-center sm:text-right">
                          <span className={`text-[10px] block font-bold ${isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>ACC</span>
                          <span className={`text-base font-extrabold ${
                            activeTheme === 'cyberpunk' ? 'text-cyan-400' : activeTheme === 'matrix' ? 'text-[#33ff33]' : activeTheme === 'sakura' ? 'text-rose-500' : 'text-emerald-400'
                          }`}>{getAccuracy()}%</span>
                        </div>
                        <div className="text-center sm:text-right">
                          <span className={`text-[10px] block font-bold ${isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>ERRORS</span>
                          <span className="text-base font-extrabold text-rose-500">{errorsCount}</span>
                        </div>
                        <div className="text-center sm:text-right">
                          <span className={`text-[10px] block font-bold ${isLightTheme ? 'text-slate-400' : 'text-slate-500'}`}>CHARS</span>
                          <span className={`text-base font-extrabold ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>{userInput.length} / {currentText.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Typing Canvas board */}
                    {isGeneratingAiText ? (
                      <div className={`min-h-[220px] flex flex-col items-center justify-center rounded-2xl border border-dashed backdrop-blur-md ${
                        isLightTheme ? 'bg-white border-slate-300' : 'bg-slate-950/40 border-slate-800'
                      }`}>
                        <Cpu className={`animate-spin mb-3 ${activeTheme === 'cyberpunk' ? 'text-pink-400' : activeTheme === 'matrix' ? 'text-emerald-400' : activeTheme === 'sakura' ? 'text-rose-500' : 'text-cyan-400'}`} size={32} />
                        <span className={`text-sm font-semibold ${isLightTheme ? 'text-slate-600' : 'text-slate-300'}`}>AI Topic Engine is generating text...</span>
                        <span className="text-xs text-slate-400 mt-1">This will take a few seconds</span>
                      </div>
                    ) : (
                      <TypingBoard
                        text={currentText}
                        userInput={userInput}
                        isFocused={isBoardFocused}
                        setIsFocused={setIsBoardFocused}
                        onKeyDown={handleKeyDown}
                        completed={completed}
                        ghostIndex={ghostIndex}
                        ghostActive={enableGhost && activeTab === 'single' && startTime !== null}
                        theme={activeTheme}
                        lastTypoHint={lastTypoHint}
                        isShaking={isShaking}
                        consecutiveErrors={consecutiveErrors}
                      />
                    )}

                    {/* Quick helper tip */}
                    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] p-3 border rounded-xl gap-2 ${
                      isLightTheme
                        ? 'text-slate-600 bg-white border-slate-200 shadow-sm'
                        : 'text-slate-400 bg-slate-950 border-slate-900'
                    }`}>
                      <span className="max-w-[80%] leading-relaxed">
                        You can quickly restart the practice at any time by pressing <strong className="font-semibold text-cyan-400">Ctrl + Enter</strong> on your keyboard.
                      </span>
                      <button 
                        onClick={handleRestart}
                        className={`font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          activeTheme === 'cyberpunk' ? 'text-pink-400 hover:text-pink-300' : activeTheme === 'matrix' ? 'text-emerald-400 hover:text-emerald-300' : activeTheme === 'sakura' ? 'text-rose-500 hover:text-rose-600' : 'text-cyan-400 hover:text-cyan-300'
                        }`}
                      >
                        <RotateCcw size={12} />
                        Restart
                      </button>
                    </div>

                    {/* Visual Virtual Keyboard */}
                    {!completed && showVirtualKeyboard && (
                      <VirtualKeyboard 
                        targetChar={currentText[userInput.length]}
                        theme={activeTheme}
                      />
                    )}

                  </div>

                  {/* Left Column Config Cards (Appears SECOND on mobile below typing board) */}
                  <div className="order-2 lg:order-1 lg:col-span-1 space-y-4 min-w-0 w-full">
                    
                    {/* Switch simulation controls */}
                    <div className={`p-4 rounded-2xl ${THEME_STYLES[activeTheme].cardBg} backdrop-blur-md`}>
                      <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-3 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
                        <Volume2 size={14} className={activeTheme === 'cyberpunk' ? 'text-pink-400' : activeTheme === 'matrix' ? 'text-emerald-400' : activeTheme === 'sakura' ? 'text-rose-500' : 'text-cyan-400'} />
                        Keyboard Click Sounds
                      </h3>
                      <div className="space-y-1.5">
                        {SWITCHES.map((sw) => {
                          const isSelected = soundType === sw.value;
                          return (
                            <button
                              key={sw.value}
                              onClick={() => { setSoundType(sw.value); playSwitchSound(sw.value); }}
                              className={`w-full text-left p-2.5 rounded-xl text-xs flex flex-col transition-all border cursor-pointer ${
                                isSelected
                                  ? activeTheme === 'cyberpunk'
                                    ? 'bg-pink-950/20 border-pink-500/40 text-pink-200'
                                    : activeTheme === 'matrix'
                                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 shadow-[inset_0_0_8px_rgba(16,185,129,0.1)]'
                                    : activeTheme === 'sakura'
                                    ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                                    : activeTheme === 'carbon-light'
                                    ? 'bg-slate-100 border-slate-300 text-slate-800 font-bold'
                                    : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200 shadow-[inset_0_0_8px_rgba(6,182,212,0.1)]'
                                  : isLightTheme
                                  ? 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                                  : 'bg-slate-950/20 border-transparent hover:bg-slate-900/50 hover:border-slate-800 text-slate-400'
                              }`}
                            >
                              <span className="font-bold">{sw.label}</span>
                              <span className="text-[10px] opacity-75 mt-0.5">{sw.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Configs (Difficulty & Options) */}
                    <div className={`p-4 rounded-2xl ${THEME_STYLES[activeTheme].cardBg} backdrop-blur-md space-y-4`}>
                      
                      {/* Difficulty */}
                      <div>
                          <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
                            <Flame size={14} className={activeTheme === 'cyberpunk' ? 'text-pink-400' : activeTheme === 'matrix' ? 'text-emerald-400' : activeTheme === 'sakura' ? 'text-rose-500' : 'text-cyan-400'} />
                            Difficulty
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {['easy', 'medium', 'hard'].map((lvl) => {
                              const isSelected = selectedDifficulty === lvl;
                              return (
                                <button
                                  key={lvl}
                                  onClick={() => setSelectedDifficulty(lvl)}
                                  className={`py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                                    isSelected
                                      ? activeTheme === 'cyberpunk' ? 'bg-pink-500/10 border-pink-500/50 text-pink-300'
                                        : activeTheme === 'matrix' ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300'
                                        : activeTheme === 'sakura' ? 'bg-rose-50 border-rose-300 text-rose-600'
                                        : activeTheme === 'carbon-light' ? 'bg-slate-100 border-slate-300 text-slate-800'
                                        : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                                      : isLightTheme
                                      ? 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                                  }`}
                                >
                                  {lvl === 'easy' ? 'Easy' : lvl === 'medium' ? 'Medium' : 'Hard'}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      <button
                        onClick={() => loadText()}
                        className={`w-full py-2.5 border font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isLightTheme
                            ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200/60'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <RotateCcw size={12} />
                        Load Standard Passage
                      </button>
                    </div>

                    {/* Ghost Typing Config */}
                    <div className={`p-4 rounded-2xl ${THEME_STYLES[activeTheme].cardBg} backdrop-blur-md`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
                          <Ghost size={14} className="text-purple-400" />
                          Ghost Typing
                        </h3>
                        <button
                          onClick={() => setEnableGhost(!enableGhost)}
                          id="toggle-ghost-button"
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer ${
                            enableGhost ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-800'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 ${
                              enableGhost ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                        Shows your personal best (PB) as a phantom shadow cursor during typing tests. Race against yourself!
                      </p>
                      {enableGhost && (
                        <div className={`p-2.5 rounded-xl border text-[10px] flex items-center justify-between font-mono ${
                          isLightTheme
                            ? 'bg-purple-50 border-purple-100 text-purple-700'
                            : 'bg-purple-950/20 border-purple-900/30 text-purple-300'
                        }`}>
                          <span>Ghost Speed (PB):</span>
                          <strong className="text-purple-600 dark:text-purple-200">{userStats.maxWpm > 0 ? `${userStats.maxWpm} WPM` : "50 WPM (Default)"}</strong>
                        </div>
                      )}
                    </div>

                    {/* Smart Topic generator */}
                    <div className={`p-4 rounded-2xl ${THEME_STYLES[activeTheme].cardBg} backdrop-blur-md`}>
                      <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>
                        <Sparkles size={14} className={activeTheme === 'cyberpunk' ? 'text-pink-400' : activeTheme === 'matrix' ? 'text-emerald-400' : activeTheme === 'sakura' ? 'text-rose-500' : 'text-cyan-400'} />
                        Smart Topic Generator
                      </h3>
                      <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                        Enter any topic and the engine will generate a custom passage tailored for you.
                      </p>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={customTheme}
                          onChange={(e) => setCustomTheme(e.target.value)}
                          placeholder="Topic: space, technology, history..."
                          className={`w-full p-2.5 border rounded-xl text-xs placeholder:text-slate-400 focus:outline-none transition-all ${
                            THEME_STYLES[activeTheme].inputBg
                          } ${
                            activeTheme === 'cyberpunk' ? 'focus:border-pink-500/50' : activeTheme === 'matrix' ? 'focus:border-emerald-500/50' : activeTheme === 'sakura' ? 'focus:border-rose-400/50' : 'focus:border-cyan-500/50'
                          }`}
                        />
                        <button
                          onClick={() => loadText(customTheme)}
                          disabled={isGeneratingAiText || !customTheme.trim()}
                          className={`w-full py-2.5 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isGeneratingAiText || !customTheme.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'
                          } ${THEME_STYLES[activeTheme].buttonAccent}`}
                        >
                          <Sparkles size={13} className={isGeneratingAiText ? 'animate-spin' : ''} />
                          {isGeneratingAiText ? 'Generating Passage...' : 'Generate Passage'}
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* B. BOT PRACTICE MODE */}
          {activeTab === 'bot' && (
            <motion.div
              key="bot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {botFinishedRank ? (
                /* BOT MATCH RESULTS VIEW */
                <div className={`p-6 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg}`}>
                  <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-4">
                    <div className={`p-4 rounded-full ${
                      botFinishedRank === 'user' 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse' 
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}>
                      <Trophy size={40} className="animate-bounce text-amber-400" />
                    </div>

                    <h2 className={`text-2xl font-black tracking-tight ${THEME_STYLES[activeTheme].headerText}`}>
                      {botFinishedRank === 'user' ? "Congratulations! You Won!" : "Bot Outpaced You!"}
                    </h2>
                    
                    <p className={`text-xs max-w-md ${THEME_STYLES[activeTheme].mutedText}`}>
                      {botFinishedRank === 'user' 
                        ? `You proved your speed skills by defeating the ${botDifficulty.toUpperCase()} difficulty AI bot!`
                        : `Try typing faster next time! Keep practicing and challenge the bot again.`}
                    </p>

                    {/* Stats Display */}
                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                      <div className={`p-4 rounded-xl border ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                        <span className={`text-[10px] uppercase font-bold block ${THEME_STYLES[activeTheme].mutedText}`}>Your Speed</span>
                        <strong className={`text-xl font-bold font-mono ${THEME_STYLES[activeTheme].accentText}`}>{getWpm()} WPM</strong>
                        <span className={`text-[9px] block mt-1 ${THEME_STYLES[activeTheme].mutedText}`}>Accuracy: {getAccuracy()}%</span>
                      </div>
                      <div className={`p-4 rounded-xl border ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                        <span className={`text-[10px] uppercase font-bold block ${THEME_STYLES[activeTheme].mutedText}`}>Bot Speed</span>
                        <strong className="text-xl text-amber-500 font-bold font-mono">{botWpmState} WPM</strong>
                        <span className={`text-[9px] block mt-1 ${THEME_STYLES[activeTheme].mutedText}`}>Difficulty: {botDifficulty.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 w-full justify-center pt-4">
                      <button
                        onClick={() => {
                          setBotFinishedRank(null);
                          setBotProgress(0);
                          setBotCompleted(false);
                          setBotCountdown(3);
                          resetEngine();
                        }}
                        className={`px-6 py-3 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md ${THEME_STYLES[activeTheme].buttonAccent}`}
                      >
                        Race Again
                      </button>
                      <button
                        onClick={() => {
                          setBotFinishedRank(null);
                          setBotProgress(0);
                          setBotCompleted(false);
                          setIsBotRacing(false);
                          resetEngine();
                          loadText();
                        }}
                        className={`px-6 py-3 border font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].headerText} hover:opacity-80`}
                      >
                        Back to Settings
                      </button>
                    </div>
                  </div>
                </div>
              ) : isBotRacing || botCountdown > 0 ? (
                /* LIVE BOT RACE VIEW */
                <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
                  {/* Racetrack & Board Column (Primary on mobile) */}
                  <div className="order-1 lg:order-2 lg:col-span-3 space-y-4 sm:space-y-6 min-w-0 w-full overflow-hidden sm:overflow-visible">
                    {/* Bot progress lanes */}
                    <RaceProgressBar
                      players={[
                        {
                          id: 'user_player',
                          name: `${playerName} (You)`,
                          progress: userInput.length,
                          errorsCount: errorsCount,
                          wpm: getWpm(),
                          accuracy: getAccuracy(),
                          completed: completed,
                          color: playerColor
                        },
                        {
                          id: 'bot_player',
                          name: `🤖 ${botDifficulty.toUpperCase()} Bot`,
                          progress: Math.floor(botProgress),
                          errorsCount: 0,
                          wpm: botDifficulty === 'easy' ? 38 : botDifficulty === 'medium' ? 65 : botDifficulty === 'hard' ? 95 : 135,
                          accuracy: 100,
                          completed: botCompleted,
                          color: botDifficulty === 'easy' ? (isLightTheme ? '#64748b' : '#a8a29e') : botDifficulty === 'medium' ? '#f59e0b' : botDifficulty === 'hard' ? '#10b981' : '#ef4444'
                        }
                      ]}
                      selfId="user_player"
                      totalLength={currentText.length}
                      activeTheme={activeTheme}
                    />

                    {/* Bot Countdown Overlay */}
                    {botCountdown > 0 && (
                      <div className={`relative p-8 rounded-2xl border flex flex-col items-center justify-center min-h-[160px] overflow-hidden ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].accentBorder}`}>
                        <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 to-transparent pointer-events-none" />
                        <span className={`text-xs font-semibold uppercase tracking-widest mb-1 ${THEME_STYLES[activeTheme].accentText}`}>Race Starting</span>
                        <span className={`text-6xl font-black font-mono animate-bounce ${THEME_STYLES[activeTheme].headerText}`}>
                          {botCountdown}
                        </span>
                        <span className={`text-[10px] mt-2 ${THEME_STYLES[activeTheme].mutedText}`}>Bot is ready! Get ready to type fast!</span>
                      </div>
                    )}

                    {/* Typing board */}
                    {isBotRacing && (
                      <div className="space-y-4">
                        <div className={`flex items-center justify-between p-3 rounded-xl border font-mono text-xs ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <span className={THEME_STYLES[activeTheme].mutedText}>ACTIVE PRACTICE TEXT</span>
                          <div className={`flex items-center gap-4 ${THEME_STYLES[activeTheme].headerText}`}>
                            <span>Speed: <strong className={THEME_STYLES[activeTheme].accentText}>{getWpm()} WPM</strong></span>
                            <span>Errors: <strong className="text-rose-500">{errorsCount}</strong></span>
                            <span>Accuracy: <strong className="text-emerald-500">{getAccuracy()}%</strong></span>
                          </div>
                        </div>

                        <TypingBoard
                          text={currentText}
                          userInput={userInput}
                          isFocused={isBoardFocused}
                          setIsFocused={setIsBoardFocused}
                          onKeyDown={handleKeyDown}
                          completed={completed}
                          theme={activeTheme}
                          lastTypoHint={lastTypoHint}
                          isShaking={isShaking}
                          consecutiveErrors={consecutiveErrors}
                        />
                      </div>
                    )}
                  </div>

                  {/* Left panel info (Appears SECOND on mobile) */}
                  <div className="order-2 lg:order-1 lg:col-span-1 space-y-4 min-w-0 w-full">
                    <div className={`p-4 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-3 ${THEME_STYLES[activeTheme].cardTitle}`}>
                        <Cpu size={14} className={THEME_STYLES[activeTheme].accentText} />
                        Practice Match
                      </h3>
                      <div className="space-y-3 text-xs">
                        <div className={`flex justify-between border-b pb-2 ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <span className={THEME_STYLES[activeTheme].mutedText}>Opponent Bot:</span>
                          <span className="font-extrabold text-amber-500 capitalize">{botDifficulty} Bot</span>
                        </div>
                        <div className={`flex justify-between border-b pb-2 ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <span className={THEME_STYLES[activeTheme].mutedText}>Bot Speed:</span>
                          <span className={`font-mono font-bold ${THEME_STYLES[activeTheme].headerText}`}>{botDifficulty === 'easy' ? '38' : botDifficulty === 'medium' ? '65' : botDifficulty === 'hard' ? '95' : '135'} WPM</span>
                        </div>
                        <button
                          onClick={() => {
                            setIsBotRacing(false);
                            setBotCountdown(0);
                            setBotProgress(0);
                            setBotCompleted(false);
                            resetEngine();
                            loadText();
                          }}
                          className="w-full mt-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-300/40 font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Exit Match
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* BOT SELECTION & CONFIGURATION VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Bot Level Card selector */}
                  <div className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg} lg:col-span-1 space-y-4`}>
                    <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2 ${THEME_STYLES[activeTheme].cardTitle}`}>
                      <Cpu size={14} className={THEME_STYLES[activeTheme].accentText} />
                      Select Bot Level
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2">
                      {[
                        { id: 'easy', label: 'Easy', wpm: 38, desc: 'For kids and absolute beginners', activeBg: 'bg-slate-500/15 border-slate-400/80' },
                        { id: 'medium', label: 'Medium', wpm: 65, desc: 'Experienced keyboard typists', activeBg: 'bg-amber-500/15 border-amber-500/80' },
                        { id: 'hard', label: 'Hard', wpm: 95, desc: 'Fast typists and professionals', activeBg: 'bg-emerald-500/15 border-emerald-500/80' },
                        { id: 'extreme', label: 'Extreme', wpm: 135, desc: 'Beyond human limits android!', activeBg: 'bg-rose-500/15 border-rose-500/80' }
                      ].map((lvl) => {
                        const isSelected = botDifficulty === lvl.id;
                        return (
                          <button
                            key={lvl.id}
                            onClick={() => setBotDifficulty(lvl.id as any)}
                            className={`w-full text-left p-3.5 rounded-xl border flex flex-col transition-all cursor-pointer ${
                              isSelected 
                                ? `${lvl.activeBg} font-bold` 
                                : `${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].headerText} hover:border-slate-400`
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-bold text-xs ${isSelected ? (isLightTheme ? 'text-slate-900' : 'text-white') : THEME_STYLES[activeTheme].headerText}`}>{lvl.label}</span>
                              <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                                isSelected 
                                  ? (isLightTheme ? 'bg-white/80 border-slate-300 text-slate-800' : 'bg-black/40 border-slate-700 text-white') 
                                  : `${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].mutedText}`
                              }`}>{lvl.wpm} WPM</span>
                            </div>
                            <span className={`text-[10px] mt-1 leading-relaxed ${THEME_STYLES[activeTheme].mutedText}`}>{lvl.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* General Practice Configs & AI triggers */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className={`p-6 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg} space-y-6`}>
                      <div className={`flex items-center justify-between border-b pb-4 ${THEME_STYLES[activeTheme].subCardBorder}`}>
                        <div>
                          <h2 className={`text-lg font-bold ${THEME_STYLES[activeTheme].headerText}`}>Bot Arena Simulator</h2>
                          <p className={`text-xs mt-1 ${THEME_STYLES[activeTheme].mutedText}`}>Boost your typing speed by racing head-to-head against computer AI bots.</p>
                        </div>
                        <Cpu className={`animate-pulse hidden sm:block ${THEME_STYLES[activeTheme].accentText}`} size={28} />
                      </div>

                      {/* Configs (Difficulty selection) */}
                      <div className="grid grid-cols-1 gap-6">

                        {/* Text difficulty */}
                        <div>
                          <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2.5 ${THEME_STYLES[activeTheme].cardTitle}`}>
                            <Target size={14} className={THEME_STYLES[activeTheme].accentText} />
                            Text Difficulty
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'easy', label: 'Easy' },
                              { id: 'medium', label: 'Medium' },
                              { id: 'hard', label: 'Hard' }
                            ].map((diff) => {
                              const isSelected = selectedDifficulty === diff.id;
                              const isCodeMode = selectedLang === 'code';
                              return (
                                <button
                                  key={diff.id}
                                  disabled={isCodeMode}
                                  onClick={() => setSelectedDifficulty(diff.id)}
                                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                    isSelected
                                      ? `${THEME_STYLES[activeTheme].accentBg} ${THEME_STYLES[activeTheme].accentBorder} ${THEME_STYLES[activeTheme].accentText} font-bold`
                                      : `${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].mutedText} hover:opacity-100`
                                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                  {diff.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Topic Generator custom Theme prompt */}
                      <div className={`p-4 rounded-xl border space-y-3 ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                        <div className="flex items-center justify-between">
                          <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${THEME_STYLES[activeTheme].cardTitle}`}>
                            <Sparkles size={12} className="text-amber-400" />
                            Topic Generator (Optional)
                          </label>
                          <span className="text-[9px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Smart Engine</span>
                        </div>
                        <p className={`text-[10px] leading-relaxed ${THEME_STYLES[activeTheme].mutedText}`}>
                          Enter any specific topic you would like to type. The topic engine will generate a complete customized passage!
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customTheme}
                            onChange={(e) => setCustomTheme(e.target.value)}
                            placeholder="e.g. Deep Space, History of Automobiles, Cryptocurrency..."
                            className={`flex-1 p-2.5 rounded-xl text-xs border focus:outline-none transition-all ${THEME_STYLES[activeTheme].inputBg}`}
                          />
                          {customTheme && (
                            <button
                              onClick={() => setCustomTheme('')}
                              className={`px-2.5 rounded-xl border text-xs transition-colors ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].mutedText} hover:opacity-100`}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={async () => {
                            if (customTheme.trim()) {
                              await loadText(customTheme.trim());
                            } else {
                              await loadText();
                            }
                            setBotCountdown(3);
                          }}
                          disabled={isGeneratingAiText}
                          className={`w-full py-3.5 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${THEME_STYLES[activeTheme].buttonAccent}`}
                        >
                          {isGeneratingAiText ? (
                            <>
                              <div className="w-4 h-4 border-2 border-slate-500 border-t-slate-200 rounded-full animate-spin" />
                              <span>Generating Race Text...</span>
                            </>
                          ) : (
                            <>
                              <Cpu size={14} />
                              <span>Start Race with Bot</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* B. MULTIPLAYER RACING MODE */}
          {activeTab === 'multi' && (
            <motion.div
              key="multi"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* LOBBY / ROOM ENTRY SELECTOR */}
              {!multiRoom ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Join Public Match card */}
                    <div className={`p-6 rounded-2xl border backdrop-blur-md flex flex-col justify-between ${THEME_STYLES[activeTheme].cardBg}`}>
                      <div>
                        <div className="bg-cyan-500/10 text-cyan-500 p-3 rounded-xl w-fit mb-4">
                          <FlameKindling size={24} />
                        </div>
                        <h3 className={`text-lg font-bold ${THEME_STYLES[activeTheme].headerText}`}>Quick Matchmaking</h3>
                        <p className={`text-xs ${THEME_STYLES[activeTheme].mutedText} mt-2 leading-relaxed`}>
                          Race against active players from around the world. Rooms fill up automatically and start in real-time.
                        </p>
                      </div>
                      <div className="mt-6">
                        <button
                          onClick={() => joinMultiplayer('public')}
                          disabled={isMultiConnecting}
                          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/10 cursor-pointer disabled:opacity-50"
                        >
                          {isMultiConnecting ? 'Connecting...' : 'Join Quick Match'}
                        </button>
                      </div>
                    </div>

                    {/* Create Private Match card */}
                    <div className={`p-6 rounded-2xl border backdrop-blur-md flex flex-col justify-between ${THEME_STYLES[activeTheme].cardBg}`}>
                      <div>
                        <div className="bg-purple-500/10 text-purple-500 p-2.5 rounded-xl w-fit mb-3 flex items-center gap-2">
                          <Plus size={20} />
                          <span className="text-xs font-bold uppercase tracking-wider">Create Room</span>
                        </div>
                        <h3 className={`text-lg font-bold ${THEME_STYLES[activeTheme].headerText}`}>Create Private Match</h3>
                        <p className={`text-xs ${THEME_STYLES[activeTheme].mutedText} mt-1 leading-relaxed`}>
                          Choose a passage source to compete with your friends:
                        </p>

                        {/* 3 Text Mode Selector Buttons */}
                        <div className={`grid grid-cols-3 gap-1.5 mt-4 p-1 rounded-xl border ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <button
                            type="button"
                            onClick={() => setLobbyTextMode('random')}
                            className={`p-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                              lobbyTextMode === 'random'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : `${THEME_STYLES[activeTheme].mutedText} hover:opacity-100`
                            }`}
                          >
                            <Globe size={14} />
                            <span>Random</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLobbyTextMode('ai')}
                            className={`p-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                              lobbyTextMode === 'ai'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : `${THEME_STYLES[activeTheme].mutedText} hover:opacity-100`
                            }`}
                          >
                            <Sparkles size={14} />
                            <span>Topic Generator</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLobbyTextMode('custom')}
                            className={`p-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                              lobbyTextMode === 'custom'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : `${THEME_STYLES[activeTheme].mutedText} hover:opacity-100`
                            }`}
                          >
                            <Code size={14} />
                            <span>Custom Text</span>
                          </button>
                        </div>

                        {/* Mode-specific Input UI */}
                        <div className="mt-3 min-h-[52px]">
                          {lobbyTextMode === 'random' && (
                            <p className={`text-[10px] ${THEME_STYLES[activeTheme].mutedText} italic leading-relaxed pt-1`}>
                              🎲 Uses a random passage based on your selected language ({selectedLang.toUpperCase()}) and difficulty.
                            </p>
                          )}

                          {lobbyTextMode === 'ai' && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-purple-500 block">Custom Topic Prompt:</label>
                              <input
                                type="text"
                                value={lobbyAiPrompt}
                                onChange={(e) => setLobbyAiPrompt(e.target.value)}
                                placeholder="e.g. Automobiles, Space Exploration, History..."
                                className={`w-full p-2 rounded-xl text-xs border focus:outline-none ${THEME_STYLES[activeTheme].inputBg}`}
                              />
                            </div>
                          )}

                          {lobbyTextMode === 'custom' && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase text-purple-500 block">Your Custom Passage:</label>
                              <textarea
                                value={lobbyCustomText}
                                onChange={(e) => setLobbyCustomText(e.target.value)}
                                rows={2}
                                placeholder="Enter any custom passage for your room here..."
                                className={`w-full p-2 rounded-xl text-xs border focus:outline-none resize-none ${THEME_STYLES[activeTheme].inputBg}`}
                              />
                            </div>
                          )}
                        </div>

                      </div>
                      <div className="mt-4">
                        <button
                          onClick={handleCreateLobbyRoom}
                          disabled={isMultiConnecting || isLobbyCreating}
                          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all border border-purple-500 shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isLobbyCreating ? (
                            <>
                              <Sparkles size={14} className="animate-spin" />
                              <span>Generating Topic Passage...</span>
                            </>
                          ) : isMultiConnecting ? (
                            'Connecting...'
                          ) : (
                            'Create & Join Room'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Join by ID card */}
                    <div className={`p-6 rounded-2xl border backdrop-blur-md flex flex-col justify-between ${THEME_STYLES[activeTheme].cardBg}`}>
                      <div>
                        <div className="bg-amber-500/10 text-amber-500 p-3 rounded-xl w-fit mb-4">
                          <Users size={24} />
                        </div>
                        <h3 className={`text-lg font-bold ${THEME_STYLES[activeTheme].headerText}`}>Join Room with Code</h3>
                        <p className={`text-xs ${THEME_STYLES[activeTheme].mutedText} mt-2 leading-relaxed`}>
                          Were you invited? Enter the unique room code to join their lobby directly.
                        </p>
                      </div>
                      <div className="space-y-3 mt-6">
                        <input
                          type="text"
                          value={joinRoomInput}
                          onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                          placeholder="KR-XXXXXX"
                          className={`w-full p-3 rounded-xl text-xs text-center font-mono focus:outline-none transition-all uppercase border ${THEME_STYLES[activeTheme].inputBg}`}
                        />
                        <button
                          onClick={() => joinMultiplayer(joinRoomInput)}
                          disabled={isMultiConnecting || !joinRoomInput.trim()}
                          className={`w-full py-3 font-extrabold rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer disabled:opacity-40 ${THEME_STYLES[activeTheme].buttonAccent}`}
                        >
                          Join Lobby
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Active Rooms Lobby List */}
                  <div className={`p-6 rounded-2xl border backdrop-blur-md space-y-4 ${THEME_STYLES[activeTheme].cardBg}`}>
                    <div className={`flex items-center justify-between border-b pb-3 ${THEME_STYLES[activeTheme].subCardBorder}`}>
                      <div>
                        <h3 className={`text-sm font-bold flex items-center gap-2 ${THEME_STYLES[activeTheme].headerText}`}>
                          <Users size={16} className={THEME_STYLES[activeTheme].accentText} />
                          Active Game Lobbies
                        </h3>
                        <p className={`text-[10px] ${THEME_STYLES[activeTheme].mutedText} mt-0.5`}>Room list refreshes automatically every 5 seconds.</p>
                      </div>
                      <button
                        onClick={fetchActiveRooms}
                        disabled={isFetchingRooms}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer flex items-center gap-1 ${THEME_STYLES[activeTheme].accentBg} ${THEME_STYLES[activeTheme].accentText} ${THEME_STYLES[activeTheme].accentBorder}`}
                      >
                        {isFetchingRooms ? (
                          <div className="w-2.5 h-2.5 border border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                        ) : 'Refresh'}
                      </button>
                    </div>

                    {activeRoomsList.length === 0 ? (
                      <div className={`text-center py-6 text-xs border border-dashed rounded-xl ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].mutedText}`}>
                        No active rooms on the server yet. Create a room above to start the first lobby!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeRoomsList.map((room) => (
                          <div 
                            key={room.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-extrabold ${THEME_STYLES[activeTheme].accentText}`}>{room.id}</span>
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  room.status === 'waiting' 
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                }`}>
                                  {room.status === 'waiting' ? 'Waiting' : 'In Progress'}
                                </span>
                              </div>
                              <p className={`text-[10px] ${THEME_STYLES[activeTheme].mutedText}`}>
                                Players: <strong className={`font-bold ${THEME_STYLES[activeTheme].headerText}`}>{room.playersCount}</strong>
                              </p>
                            </div>
                            <button
                              onClick={() => joinMultiplayer(room.id)}
                              disabled={isMultiConnecting}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border cursor-pointer transition-colors ${THEME_STYLES[activeTheme].buttonAccent}`}
                            >
                              Join
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* LIVE MULTIPLAYER RACE VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* Left Column: Game controls & Info */}
                  <div className="space-y-4">
                    
                    {/* Room Info card */}
                    <div className={`p-4 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-3 ${THEME_STYLES[activeTheme].cardTitle}`}>
                        <Users size={14} className={THEME_STYLES[activeTheme].accentText} />
                        RACE METADATA
                      </h3>
                      
                      <div className="space-y-3.5 text-xs">
                        <div className={`flex items-center justify-between border-b pb-2 ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <span className={THEME_STYLES[activeTheme].mutedText}>Room Code:</span>
                          <div className="flex items-center gap-1 font-mono">
                            <span className={`font-extrabold ${THEME_STYLES[activeTheme].accentText}`}>{roomId}</span>
                            <button 
                              onClick={copyInviteLink}
                              className={`${THEME_STYLES[activeTheme].mutedText} hover:opacity-100 p-0.5 rounded transition-colors`}
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between border-b pb-2 ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <span className={THEME_STYLES[activeTheme].mutedText}>Lobby Status:</span>
                          <span className="font-bold uppercase text-amber-500 text-[10px]">
                            {multiRoom.status === 'waiting' && 'Waiting'}
                            {multiRoom.status === 'countdown' && 'Ready'}
                            {multiRoom.status === 'racing' && 'Active Race'}
                            {multiRoom.status === 'finished' && 'Finished'}
                          </span>
                        </div>

                        {multiRoom.status === 'waiting' && (
                          <div className="pt-2">
                            <p className={`text-[10px] ${THEME_STYLES[activeTheme].mutedText} leading-relaxed mb-3`}>
                              At least 2 players are required to start the race. If you are waiting for your friends, you can start the race immediately.
                            </p>
                            <button
                              onClick={startMultiplayerCountdown}
                              className={`w-full py-2.5 font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 ${THEME_STYLES[activeTheme].buttonAccent}`}
                            >
                              Start Race Immediately
                            </button>
                          </div>
                        )}

                        <button
                          onClick={leaveMultiplayer}
                          className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-300 font-bold rounded-xl text-xs transition-all mt-2"
                        >
                          Leave Lobby
                        </button>
                      </div>
                    </div>

                    {/* Chat engine */}
                    <div className={`p-4 rounded-2xl border backdrop-blur-md flex flex-col h-[280px] ${THEME_STYLES[activeTheme].cardBg}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2.5 ${THEME_STYLES[activeTheme].cardTitle}`}>
                        <Send size={14} className={THEME_STYLES[activeTheme].accentText} />
                        Lobby Chatroom
                      </h3>
                      
                      {/* Message stream */}
                      <div className="flex-1 overflow-y-auto mb-2 space-y-2 pr-1 text-xs">
                        {chatMessages.length === 0 ? (
                          <div className={`text-center py-8 ${THEME_STYLES[activeTheme].mutedText}`}>
                            Chat is empty. Say hello!
                          </div>
                        ) : (
                          chatMessages.map((msg, idx) => (
                            <div 
                              key={idx}
                              className={`p-1.5 rounded-lg max-w-[90%] break-words border ${
                                msg.self 
                                  ? `${THEME_STYLES[activeTheme].accentBg} ${THEME_STYLES[activeTheme].accentBorder} ${THEME_STYLES[activeTheme].headerText} ml-auto` 
                                  : `${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].headerText} mr-auto`
                              }`}
                            >
                              <div className="font-bold text-[10px] truncate" style={{ color: msg.color }}>
                                {msg.sender}
                              </div>
                              <div className="mt-0.5">{msg.message}</div>
                            </div>
                          ))
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Input form */}
                      <form onSubmit={sendChatMessage} className="flex gap-1">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type a message..."
                          className={`flex-1 p-2 border rounded-lg text-xs focus:outline-none ${THEME_STYLES[activeTheme].inputBg}`}
                        />
                        <button
                          type="submit"
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${THEME_STYLES[activeTheme].buttonAccent}`}
                        >
                          Send
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* Right Column: Dynamic racing track and typing board */}
                  <div className="lg:col-span-3 space-y-6">
                    
                    {/* Race track lanes */}
                    <RaceProgressBar
                      players={multiRoom.players}
                      selfId={selfPlayerId}
                      totalLength={currentText.length}
                      activeTheme={activeTheme}
                    />

                    {/* Countdown Overlay */}
                    {multiRoom.status === 'countdown' && (
                      <div className={`relative p-8 rounded-2xl border flex flex-col items-center justify-center min-h-[160px] overflow-hidden ${THEME_STYLES[activeTheme].accentBg} ${THEME_STYLES[activeTheme].accentBorder}`}>
                        <span className={`text-xs font-semibold uppercase tracking-widest mb-1 ${THEME_STYLES[activeTheme].accentText}`}>Race Starting</span>
                        <span className={`text-6xl font-black font-mono animate-bounce ${THEME_STYLES[activeTheme].headerText}`}>
                          {multiCountdown}
                        </span>
                        <span className={`text-[10px] ${THEME_STYLES[activeTheme].mutedText} mt-2`}>Good luck everyone! Prepare your keyboard!</span>
                      </div>
                    )}

                    {/* Typing board */}
                    {multiRoom.status === 'racing' && (
                      <div className="space-y-4">
                        <div className={`flex items-center justify-between p-3 rounded-xl border font-mono text-xs ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <span className={THEME_STYLES[activeTheme].mutedText}>ACTIVE RACE TEXT</span>
                          <div className={`flex items-center gap-4 ${THEME_STYLES[activeTheme].headerText}`}>
                            <span>Your Speed: <strong className={THEME_STYLES[activeTheme].accentText}>{getWpm()} WPM</strong></span>
                            <span>Your Accuracy: <strong className="text-emerald-500">{getAccuracy()}%</strong></span>
                          </div>
                        </div>

                        <TypingBoard
                          text={currentText}
                          userInput={userInput}
                          isFocused={isBoardFocused}
                          setIsFocused={setIsBoardFocused}
                          onKeyDown={handleKeyDown}
                          completed={completed}
                          theme={activeTheme}
                          lastTypoHint={lastTypoHint}
                          isShaking={isShaking}
                          consecutiveErrors={consecutiveErrors}
                        />
                      </div>
                    )}

                    {/* Finished Results Board */}
                    {multiRoom.status === 'finished' && (
                      <div className={`p-6 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg}`}>
                        <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${THEME_STYLES[activeTheme].headerText}`}>
                          <Trophy size={18} className="text-amber-500" />
                          Race Winners & Scoreboard
                        </h3>

                        <div className="space-y-2">
                          {multiFinishedPlayers.map((player, idx) => {
                            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏎️';
                            return (
                              <div 
                                key={player.id}
                                className={`flex items-center justify-between p-3 rounded-xl border ${
                                  player.id === selfPlayerId
                                    ? `${THEME_STYLES[activeTheme].accentBg} ${THEME_STYLES[activeTheme].accentBorder}`
                                    : `${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">{medal}</span>
                                  <span className={`font-bold text-sm ${THEME_STYLES[activeTheme].headerText}`}>
                                    {player.name}
                                  </span>
                                </div>
                                <div className={`flex items-center gap-5 font-mono text-xs ${THEME_STYLES[activeTheme].mutedText}`}>
                                  <span>WPM: <strong className={THEME_STYLES[activeTheme].headerText}>{player.wpm}</strong></span>
                                  <span>Accuracy: <strong className={THEME_STYLES[activeTheme].headerText}>{player.accuracy}%</strong></span>
                                  <span>Errors: <strong className="text-rose-500">{player.errorsCount}</strong></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            onClick={leaveMultiplayer}
                            className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all ${THEME_STYLES[activeTheme].buttonAccent}`}
                          >
                            Return to Lobby
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* C. QUIZ TEST QUEST TAB */}
          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <QuizBoard
                activeTheme={activeTheme}
                isLightTheme={isLightTheme}
                onFinishQuiz={(score, accuracy, wpm) => {
                  const newRace = {
                    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    wpm: wpm,
                    accuracy: accuracy,
                    language: 'quiz'
                  };
                  const updatedRaces = [newRace, ...userStats.recentRaces].slice(0, 20);
                  const newRacesCount = userStats.racesCompleted + 1;
                  const newAvgWpm = Math.round((userStats.averageWpm * userStats.racesCompleted + wpm) / newRacesCount);
                  const newMaxWpm = Math.max(userStats.maxWpm, wpm);
                  const newAvgAcc = Math.round((userStats.averageAccuracy * userStats.racesCompleted + accuracy) / newRacesCount);

                  const updatedStats: UserStats = {
                    racesCompleted: newRacesCount,
                    averageWpm: newAvgWpm,
                    maxWpm: newMaxWpm,
                    averageAccuracy: newAvgAcc,
                    recentRaces: updatedRaces
                  };

                  setUserStats(updatedStats);
                  localStorage.setItem('keyrush_user_stats', JSON.stringify(updatedStats));
                  unlockAchievement('first_race');
                  if (accuracy === 100) unlockAchievement('perfect_accuracy');
                }}
                playSwitchSound={playSwitchSound}
                showToast={showToast}
                soundType={soundType}
              />
            </motion.div>
          )}

          {/* D. PROFILES, CREDENTIALS & STATS PANEL */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* Profile details & Credentials linking */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Column 1: Config & Connection Stack */}
                <div className="space-y-6">
                  {/* Premium Profile card */}
                  <div className={`p-5 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg}`}>
                    <div className={`flex items-center justify-between border-b pb-3.5 mb-4 ${THEME_STYLES[activeTheme].subCardBorder}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${THEME_STYLES[activeTheme].cardTitle}`}>
                        <Users size={14} className={THEME_STYLES[activeTheme].accentText} />
                        Profile Details
                      </h3>
                      {userProfile && (
                        <button
                          onClick={() => setIsSignOutConfirmOpen(true)}
                          title="Sign Out (Logout)"
                          className={`p-1 rounded border transition-all cursor-pointer ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].mutedText} hover:text-rose-500`}
                        >
                          <LogOut size={12} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Avatar & Name Edit */}
                      <div className="flex items-center gap-4">
                        <div className="relative group select-none">
                          {renderAvatar(userProfile?.avatar, playerName || 'Guest', "w-14 h-14 rounded-2xl text-xl")}
                          {userProfile && (
                            <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-slate-950 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black border border-slate-950">
                              ✓
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <span className={`text-[9px] uppercase font-bold tracking-widest ${THEME_STYLES[activeTheme].mutedText}`}>User ID</span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className={`text-xs font-bold ${THEME_STYLES[activeTheme].headerText}`}>{userProfile ? userProfile.id : 'Guest Player'}</span>
                            {userProfile && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(userProfile.id);
                                  showToast(`Copied User ID: ${userProfile.id}`, 'success');
                                }}
                                className={`${THEME_STYLES[activeTheme].mutedText} hover:opacity-100 p-0.5`}
                                title="Copy ID"
                              >
                                <Copy size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Display name input */}
                      <div>
                        <label className={`text-[10px] uppercase font-bold block mb-1.5 ${THEME_STYLES[activeTheme].mutedText}`}>Your Nickname</label>
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => {
                            setPlayerName(e.target.value);
                            localStorage.setItem('keyrush_player_name', e.target.value);
                            if (userProfile) {
                              setUserProfile(prev => prev ? { ...prev, name: e.target.value } : null);
                            }
                          }}
                          placeholder="Enter your nickname..."
                          className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none transition-all ${THEME_STYLES[activeTheme].inputBg}`}
                        />
                      </div>

                      {/* Bio input */}
                      <div>
                        <label className={`text-[10px] uppercase font-bold block mb-1.5 ${THEME_STYLES[activeTheme].mutedText}`}>About You (Bio)</label>
                        <textarea
                          value={userProfile ? userProfile.bio : "Guest racer. Register/login now to persist statistics, save speed records, and claim rare badges!"}
                          disabled={!userProfile}
                          onChange={(e) => {
                            if (userProfile) {
                              setUserProfile({ ...userProfile, bio: e.target.value });
                            }
                          }}
                          placeholder="Write about your typing style or setup..."
                          rows={2}
                          className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none resize-none transition-all ${
                            !userProfile ? 'opacity-55' : ''
                          } ${THEME_STYLES[activeTheme].inputBg}`}
                        />
                      </div>

                      {/* Custom Image Upload */}
                      {userProfile && (
                        <div className="space-y-2">
                          <label className={`text-[10px] uppercase font-bold block ${THEME_STYLES[activeTheme].mutedText}`}>Upload Profile Photo</label>
                          <div className="flex items-center gap-2">
                            <label className={`flex-1 text-center py-2 border border-dashed rounded-xl text-xs font-semibold cursor-pointer transition-all ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                              <span className={THEME_STYLES[activeTheme].mutedText}>Choose Image File...</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 256 * 1024) {
                                      showToast("Please upload an image smaller than 256KB to save storage!", "error");
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      if (typeof reader.result === 'string') {
                                        setUserProfile(prev => prev ? { ...prev, avatar: reader.result } : null);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {userProfile.avatar !== 'default' && (
                              <button
                                onClick={() => setUserProfile({ ...userProfile, avatar: 'default' })}
                                className="px-3.5 py-2 bg-rose-500/10 border border-rose-300 text-rose-500 text-xs font-bold rounded-xl transition-all hover:bg-rose-500/20 cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <span className={`text-[9px] block ${THEME_STYLES[activeTheme].mutedText}`}>Supports JPG, PNG (Max 256KB). Replaces sticker/emoji presets.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connected Accounts & Login Section */}
                  <div className={`p-5 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-4 ${THEME_STYLES[activeTheme].cardTitle}`}>
                      <ShieldCheck size={14} className={THEME_STYLES[activeTheme].accentText} />
                      Connected Auth Accounts
                    </h3>

                    {userProfile ? (
                      <div className="space-y-2.5">
                        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <div className="flex items-center gap-2">
                            {userProfile.authProvider === 'email' && <Mail className={THEME_STYLES[activeTheme].accentText} size={14} />}
                            {userProfile.authProvider === 'google' && <Chrome className="text-red-500" size={14} />}
                            {userProfile.authProvider === 'discord' && <Gamepad2 className="text-indigo-400" size={14} />}
                            {userProfile.authProvider === 'telegram' && <Send className="text-sky-400 transform rotate-[-30deg]" size={14} />}
                            <span className={`font-bold capitalize ${THEME_STYLES[activeTheme].headerText}`}>{userProfile.authProvider}</span>
                          </div>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">Connected</span>
                        </div>
                        {userProfile.email && (
                          <div className={`text-[10px] font-mono text-center ${THEME_STYLES[activeTheme].mutedText}`}>
                            Linked Email: {userProfile.email}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button
                            onClick={() => setIsSignOutConfirmOpen(true)}
                            className={`py-2 px-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isLightTheme
                                ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                : 'border-slate-700/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800/80'
                            }`}
                          >
                            <LogOut size={13} />
                            <span>Sign Out</span>
                          </button>

                          <button
                            onClick={() => {
                              setDeleteAccountStep(1);
                              setDeleteConfirmInput('');
                              setIsDeleteAccountModalOpen(true);
                            }}
                            className={`py-2 px-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isLightTheme
                                ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-sm font-black'
                                : 'border-rose-500/40 bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 hover:text-rose-300 font-bold'
                            }`}
                          >
                            <Trash2 size={13} />
                            <span>Delete Account</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-center">
                        <p className={`text-[10px] ${THEME_STYLES[activeTheme].mutedText} leading-relaxed`}>
                          You are currently playing as a Guest. Log in via Email, Google, Discord, or Telegram to secure your profile and track WPM history.
                        </p>
                        <button
                          onClick={() => setIsAuthModalOpen(true)}
                          className={`w-full py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer ${THEME_STYLES[activeTheme].buttonAccent}`}
                        >
                          Authenticate / Sign In
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                  {/* Connected Accounts & Achievements Side */}
                  <div className="md:col-span-2 space-y-6">
                    
                    {/* Overall Stats grid */}
                    <div className={`p-5 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-4 ${THEME_STYLES[activeTheme].cardTitle}`}>
                        <Activity size={14} className={THEME_STYLES[activeTheme].accentText} />
                        Achieved Racing Statistics
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className={`p-3 rounded-xl border ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <span className={`text-[9px] block uppercase font-bold ${THEME_STYLES[activeTheme].mutedText}`}>TOTAL TESTS</span>
                          <strong className={`text-2xl font-bold tracking-tight font-mono ${THEME_STYLES[activeTheme].headerText}`}>{userStats.racesCompleted}</strong>
                        </div>

                        <div className={`p-3 rounded-xl border ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <span className={`text-[9px] block uppercase font-bold ${THEME_STYLES[activeTheme].mutedText}`}>AVERAGE WPM</span>
                          <strong className={`text-2xl font-bold tracking-tight font-mono ${THEME_STYLES[activeTheme].accentText}`}>{userStats.averageWpm}</strong>
                        </div>

                        <div className={`p-3 rounded-xl border ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <span className={`text-[9px] block uppercase font-bold ${THEME_STYLES[activeTheme].mutedText}`}>MAX WPM</span>
                          <strong className="text-2xl text-amber-500 font-bold tracking-tight font-mono">{userStats.maxWpm}</strong>
                        </div>

                        <div className={`p-3 rounded-xl border ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                          <span className={`text-[9px] block uppercase font-bold ${THEME_STYLES[activeTheme].mutedText}`}>AVG ACCURACY</span>
                          <strong className="text-2xl text-emerald-500 font-bold tracking-tight font-mono">{userStats.averageAccuracy}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Achievements Grid */}
                    <div className={`p-5 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-4 ${THEME_STYLES[activeTheme].cardTitle}`}>
                        <Award size={14} className="text-amber-500 animate-pulse" />
                        Achievements & Badges ({achievements.filter(a => a.unlocked).length} / {achievements.length})
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {achievements.map((ach) => (
                          <div 
                            key={ach.id}
                            className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-pointer group ${
                              ach.unlocked 
                                ? `${THEME_STYLES[activeTheme].accentBg} ${THEME_STYLES[activeTheme].accentBorder} hover:border-amber-500/60 hover:shadow-amber-500/10` 
                                : `opacity-50 hover:opacity-85 ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} hover:border-slate-600`
                            }`}
                          >
                            <div className="text-2xl select-none transform group-hover:scale-125 group-hover:rotate-6 transition-transform duration-300">{ach.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold truncate ${THEME_STYLES[activeTheme].headerText}`}>{ach.title}</span>
                                {ach.unlocked ? (
                                  <span className={`text-[8px] font-mono font-bold ${THEME_STYLES[activeTheme].accentText}`}>Unlocked</span>
                                ) : (
                                  <span className="text-[8px] font-mono font-bold text-slate-500">Locked</span>
                                )}
                              </div>
                              <p className={`text-[10px] truncate ${THEME_STYLES[activeTheme].mutedText}`}>{ach.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Global Leaderboard Standings Row */}
                <GlobalLeaderboard 
                  activeTheme={activeTheme} 
                  currentUserId={userProfile?.id} 
                />

                {/* Troubleshoot Section in Stats Dashboard */}
                <TroubleshootSection 
                  errorHeatmap={userStats.errorHeatmap || {}} 
                  activeTheme={activeTheme}
                />

                {/* Keyboard hotkeys and historical races list row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Hotkeys Panel */}
                  <div className={`p-5 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-3.5 ${THEME_STYLES[activeTheme].cardTitle}`}>
                      <Settings size={14} className="text-purple-500" />
                      Keyboard Shortcuts
                    </h3>
                    <p className={`text-[10px] ${THEME_STYLES[activeTheme].mutedText} leading-relaxed mb-4`}>
                      Configure custom shortcuts to speed up actions on the platform. Click a shortcut button and press any key to bind a new key.
                    </p>
                    
                    <div className="space-y-2.5">
                      {/* Restart */}
                      <div className={`flex items-center justify-between p-2.5 rounded-xl border ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                        <div>
                          <span className={`text-xs font-bold block ${THEME_STYLES[activeTheme].headerText}`}>Restart Test</span>
                          <span className={`text-[9px] ${THEME_STYLES[activeTheme].mutedText}`}>Ctrl + Enter</span>
                        </div>
                        <button
                          onClick={() => setBindingHotkey(bindingHotkey === 'restart' ? null : 'restart')}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                            bindingHotkey === 'restart' ? 'bg-purple-600 border-purple-500 text-white animate-pulse' : `${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].accentText}`
                          }`}
                        >
                          {bindingHotkey === 'restart' ? 'Press key...' : hotkeys.restart.label}
                        </button>
                      </div>

                      {/* Chat */}
                      <div className={`flex items-center justify-between p-2.5 rounded-xl border ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}>
                        <div>
                          <span className={`text-xs font-bold block ${THEME_STYLES[activeTheme].headerText}`}>Toggle Chat</span>
                          <span className={`text-[9px] ${THEME_STYLES[activeTheme].mutedText} font-medium`}>Alt + C</span>
                        </div>
                        <button
                          onClick={() => setBindingHotkey(bindingHotkey === 'openChat' ? null : 'openChat')}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                            bindingHotkey === 'openChat' ? 'bg-purple-600 border-purple-500 text-white animate-pulse' : `${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].accentText}`
                          }`}
                        >
                          {bindingHotkey === 'openChat' ? 'Press key...' : hotkeys.openChat.label}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Recent races list */}
                  <div className={`p-5 rounded-2xl border backdrop-blur-md ${THEME_STYLES[activeTheme].cardBg} lg:col-span-2`}>
                    <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mb-3.5 ${THEME_STYLES[activeTheme].cardTitle}`}>
                      <Clock size={14} className={THEME_STYLES[activeTheme].accentText} />
                      Recent 10 Race Results
                    </h3>

                    {userStats.recentRaces.length === 0 ? (
                      <div className={`text-center py-6 text-xs font-medium border border-dashed rounded-xl ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].mutedText}`}>
                        No race history yet. Complete some typing tests to see your progress!
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {userStats.recentRaces.map((race, idx) => (
                          <div 
                            key={idx}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`text-[10px] font-mono font-bold ${THEME_STYLES[activeTheme].mutedText}`}>#{idx+1}</span>
                              <span className={`text-xs font-medium ${THEME_STYLES[activeTheme].headerText}`}>{race.date}</span>
                              <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].mutedText}`}>
                                {race.language}
                              </span>
                            </div>
                            <div className={`flex items-center gap-5 font-mono text-xs ${THEME_STYLES[activeTheme].mutedText}`}>
                              <span>Speed: <strong className={THEME_STYLES[activeTheme].accentText}>{race.wpm} WPM</strong></span>
                              <span>Accuracy: <strong className="text-emerald-500">{race.accuracy}%</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* 4. AUTH SYSTEM MODAL OVERLAY */}
      <AuthSystem
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(profile) => {
          setUserProfile(profile);
          setPlayerName(profile.name);
          if (profile.stats) {
            setUserStats(profile.stats);
            localStorage.setItem('keyrush_user_stats', JSON.stringify(profile.stats));
          }
          setIsAuthModalOpen(false);
          // Unlock achievement for linking
          unlockAchievement('auth_linked');
        }}
        activeTheme={activeTheme}
      />

      {/* 5. SIGN OUT CONFIRMATION MODAL */}
      {isSignOutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl transition-all ${THEME_STYLES[activeTheme].cardBg}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertCircle size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${THEME_STYLES[activeTheme].headerText}`}>
                  Confirm Account Sign-Out
                </h3>
                <p className={`text-xs ${THEME_STYLES[activeTheme].mutedText}`}>
                  Prevent accidental session disconnections
                </p>
              </div>
            </div>

            <p className={`text-xs ${THEME_STYLES[activeTheme].mutedText} mb-6 leading-relaxed ${THEME_STYLES[activeTheme].subCardBg} p-3.5 rounded-xl border ${THEME_STYLES[activeTheme].subCardBorder}`}>
              Are you sure you want to sign out from <strong className={THEME_STYLES[activeTheme].headerText}>{userProfile?.email || userProfile?.name || 'your profile'}</strong>? Your offline race progress will remain preserved on this device, but active database sync will pause until you sign in again.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsSignOutConfirmOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${THEME_STYLES[activeTheme].subCardBg} ${THEME_STYLES[activeTheme].subCardBorder} ${THEME_STYLES[activeTheme].headerText} hover:bg-slate-800`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('keyrush_auth_token');
                  setUserProfile(null);
                  setPlayerName(`Racer-${Math.floor(Math.random() * 899 + 100)}`);
                  setIsSignOutConfirmOpen(false);
                  showToast('Successfully signed out of account session', 'info');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <LogOut size={14} />
                <span>Yes, Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DOUBLE CONFIRMATION DELETE ACCOUNT MODAL */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className={`max-w-md w-full p-6 rounded-2xl border shadow-2xl transition-all ${THEME_STYLES[activeTheme].cardBg}`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${isLightTheme ? 'bg-rose-100 border border-rose-300 text-rose-700' : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'} shrink-0`}>
                  <AlertTriangle size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className={`text-base font-extrabold flex items-center gap-2 ${THEME_STYLES[activeTheme].headerText}`}>
                    <span>Delete Account</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-black ${
                      deleteAccountStep === 1 
                        ? (isLightTheme ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30')
                        : (isLightTheme ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30')
                    }`}>
                      Step {deleteAccountStep} of 2
                    </span>
                  </h3>
                  <p className={`text-xs ${THEME_STYLES[activeTheme].mutedText}`}>
                    {deleteAccountStep === 1 ? 'Initial Warning & Policy Review' : 'Final Irreversible Confirmation'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDeleteAccountModalOpen(false);
                  setDeleteAccountStep(1);
                  setDeleteConfirmInput('');
                }}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isLightTheme ? 'hover:bg-slate-100 border-slate-200 text-slate-600' : 'hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content depending on Step 1 vs Step 2 */}
            {deleteAccountStep === 1 ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2.5 ${
                  isLightTheme 
                    ? 'bg-rose-50/90 border-rose-200/90 text-rose-950 shadow-sm' 
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                }`}>
                  <p className="font-bold text-sm flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <AlertCircle size={16} />
                    Permanent Account Destruction
                  </p>
                  <p>
                    Are you sure you want to delete your account <strong className="underline decoration-rose-500/50">{userProfile?.email || userProfile?.name}</strong>? This action is <strong className="uppercase">permanent</strong> and <strong className="uppercase">cannot be undone</strong>.
                  </p>
                  <div className="pt-2 border-t border-rose-500/20 text-[11px] space-y-1.5 opacity-90 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>All race history, typing speed graphs, and accuracy metrics will be purged.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Unlocked trophies and special achievement badges will be wiped permanently.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Your rank will be removed from the Global Speed Leaderboard.</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Step 1 */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsDeleteAccountModalOpen(false);
                      setDeleteAccountStep(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isLightTheme 
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeleteAccountStep(2)}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>I Understand, Proceed (1/2)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-3 ${
                  isLightTheme 
                    ? 'bg-amber-50 border-amber-200 text-amber-950 shadow-sm' 
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}>
                  <p className="font-bold text-xs flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <ShieldCheck size={16} />
                    Final Security Check: Type "DELETE"
                  </p>
                  <p className={THEME_STYLES[activeTheme].mutedText}>
                    To complete the deletion process, please type <strong className="font-mono text-rose-500 font-black">DELETE</strong> into the field below:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder="Type DELETE to confirm..."
                    autoFocus
                    className={`w-full p-3 border rounded-xl text-xs font-mono font-bold focus:outline-none transition-all tracking-wider ${
                      isLightTheme 
                        ? 'bg-white border-rose-300 text-rose-950 focus:border-rose-500' 
                        : 'bg-slate-950 border-rose-500/50 text-rose-200 focus:border-rose-400'
                    }`}
                  />
                </div>

                {/* Action Buttons for Step 2 */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setDeleteAccountStep(1)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isLightTheme 
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800' 
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    ← Back to Step 1
                  </button>
                  <button
                    disabled={deleteConfirmInput.trim() !== 'DELETE' || isDeletingAccount}
                    onClick={handleDeleteAccount}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                      deleteConfirmInput.trim() === 'DELETE' && !isDeletingAccount
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 cursor-pointer animate-pulse'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Trash2 size={14} />
                    <span>{isDeletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Network Latency Badge (ms) */}
      {pingMs !== null && (
        <div 
          title="Network connection latency (ms)"
          className={`fixed bottom-4 right-4 z-40 flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl font-mono border backdrop-blur-md shadow-lg transition-all duration-300 ${
            isLightTheme 
              ? 'bg-white/90 border-slate-200 text-slate-700 shadow-slate-200/50' 
              : 'bg-slate-900/90 border-slate-800 text-slate-300 shadow-black/50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            pingMs < 80 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : pingMs < 150 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
          } animate-pulse`} />
          <span className="font-bold">{pingMs} ms</span>
        </div>
      )}

      {/* Race Replay Modal */}
      {isReplayModalOpen && activeReplay && (
        <RaceReplayModal
          replay={activeReplay}
          isOpen={isReplayModalOpen}
          onClose={() => setIsReplayModalOpen(false)}
          soundType={soundType}
          onTrySameText={(text) => {
            setCurrentText(text);
            resetEngine();
            setActiveTab('single');
            setIsBoardFocused(true);
            showToast("Loaded replay passage for practice!", "info");
          }}
        />
      )}

      {/* 3. FOOTER SECTION */}
      <footer className={`border-t py-6 mt-12 text-center transition-colors ${THEME_STYLES[activeTheme].footerBg} ${THEME_STYLES[activeTheme].footerBorder}`}>
        <div className="max-w-7xl mx-auto px-4 text-xs space-y-2">
          <p className={THEME_STYLES[activeTheme].mutedText}>© 2026 KeyRush Platform. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
