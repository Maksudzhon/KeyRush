import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, Zap, CheckCircle2, XCircle, Award, RefreshCw, 
  Flame, Clock, Cpu, Sparkles, ChevronRight, Volume2, ShieldCheck,
  Brain, Terminal, Code2, Monitor, Layers, ArrowRight, Trophy
} from 'lucide-react';

export interface QuizQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  answer: string; // Exact answer to type
  hint?: string;
  explanation?: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // --- JAVASCRIPT & WEB DEV ---
  {
    id: 'q_js_1',
    category: 'JavaScript',
    difficulty: 'easy',
    question: "Keyword used to declare a block-scoped constant variable whose value cannot be reassigned?",
    answer: 'const',
    hint: '5-letter keyword (c _ _ _ t)',
    explanation: "'const' is used for variables whose values should not be reassigned."
  },
  {
    id: 'q_js_2',
    category: 'JavaScript',
    difficulty: 'easy',
    question: "React hook used to perform side effects in functional components?",
    answer: 'useEffect',
    hint: 'u _ _ _ _ f f e c t',
    explanation: "'useEffect' manages lifecycle side effects in React components."
  },
  {
    id: 'q_js_3',
    category: 'JavaScript',
    difficulty: 'medium',
    question: "Object representing the eventual completion or failure of an asynchronous operation?",
    answer: 'Promise',
    hint: 'P _ _ _ _ s e',
    explanation: "Promises handle asynchronous calculations in JavaScript."
  },
  {
    id: 'q_js_4',
    category: 'JavaScript',
    difficulty: 'medium',
    question: "Standard JavaScript method that converts a JSON object or value into a string?",
    answer: 'JSON.stringify',
    hint: 'J _ _ N . s t r i n g i f y',
    explanation: "JSON.stringify() converts JavaScript objects into a JSON formatted string."
  },
  {
    id: 'q_js_5',
    category: 'JavaScript',
    difficulty: 'hard',
    question: "Function bundled together with references to its surrounding state (lexical environment)?",
    answer: 'closure',
    hint: 'c _ _ _ u r e',
    explanation: "A closure allows an inner function to access an outer function's scope."
  },

  // --- LINUX & TERMINAL ---
  {
    id: 'q_linux_1',
    category: 'Linux',
    difficulty: 'easy',
    question: "Terminal command to list all files, including hidden files, in detailed long format?",
    answer: 'ls -la',
    hint: 'l s - l a',
    explanation: "'ls -la' lists all directory contents including hidden dotfiles in long format."
  },
  {
    id: 'q_linux_2',
    category: 'Linux',
    difficulty: 'medium',
    question: "CLI tool for searching plain-text data sets for lines that match a regular expression?",
    answer: 'grep',
    hint: 'g _ _ p',
    explanation: "'grep' searches files for lines containing matches to specified patterns."
  },
  {
    id: 'q_linux_3',
    category: 'Linux',
    difficulty: 'easy',
    question: "Terminal command used to create a new folder or directory?",
    answer: 'mkdir',
    hint: 'm k d i r',
    explanation: "'mkdir' stands for make directory."
  },

  // --- PYTHON & BACKEND ---
  {
    id: 'q_py_1',
    category: 'Python',
    difficulty: 'easy',
    question: "Keyword used in Python to define a function?",
    answer: 'def',
    hint: 'd _ f',
    explanation: "'def' introduces a function definition in Python."
  },
  {
    id: 'q_py_2',
    category: 'Python',
    difficulty: 'medium',
    question: "Immutable, ordered sequence data type in Python enclosed in parentheses?",
    answer: 'tuple',
    hint: 't _ _ l e',
    explanation: "Tuples are immutable collections of elements in Python."
  },
  {
    id: 'q_py_3',
    category: 'Backend API',
    difficulty: 'easy',
    question: "HTTP method used to send data to a server to create a new resource?",
    answer: 'POST',
    hint: 'P _ _ T',
    explanation: "POST requests submit entity payloads to the specified server resource."
  },

  // --- HARDWARE & GENERAL TECH ---
  {
    id: 'q_tech_1',
    category: 'Hardware',
    difficulty: 'easy',
    question: "The primary electronic circuitry that executes instructions comprising a computer program (abbreviation)?",
    answer: 'CPU',
    hint: 'C _ U',
    explanation: "Central Processing Unit is the main processor of a computer."
  },
  {
    id: 'q_tech_2',
    category: 'General Tech',
    difficulty: 'medium',
    question: "Process of finding and resolving bugs or defects that prevent correct operation of software?",
    answer: 'debugging',
    hint: 'd _ _ u g g i n g',
    explanation: "Debugging involves identifying, isolating, and fixing software bugs."
  },
  {
    id: 'q_tech_3',
    category: 'CSS & Design',
    difficulty: 'medium',
    question: "One-dimensional CSS layout method for arranging items in rows or columns?",
    answer: 'Flexbox',
    hint: 'F _ _ x b o x',
    explanation: "Flexbox provides an efficient way to lay out, align and distribute space among items."
  }
];

interface QuizBoardProps {
  activeTheme: string;
  isLightTheme: boolean;
  onFinishQuiz: (score: number, accuracy: number, wpm: number) => void;
  playSwitchSound: (type: any) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  soundType: any;
}

export default function QuizBoard({
  activeTheme,
  isLightTheme,
  onFinishQuiz,
  playSwitchSound,
  showToast,
  soundType
}: QuizBoardProps) {
  // Quiz states
  const [quizMode, setQuizMode] = useState<'solo' | 'bot' | 'sprint'>('solo');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userTyped, setUserTyped] = useState('');
  
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [answersLog, setAnswersLog] = useState<{ question: QuizQuestion; typed: string; isCorrect: boolean; timeTakenSec: number }[]>([]);

  // Bot mode state
  const [botProgress, setBotProgress] = useState(0);
  const [botAnswered, setBotAnswered] = useState(false);

  // Question Timer (15 seconds per question)
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const inputRef = useRef<HTMLInputElement>(null);

  // Categories list
  const categories = ['all', 'JavaScript', 'Linux', 'Python', 'Backend API', 'Hardware', 'General Tech', 'CSS & Design'];

  // Start or reset quiz session
  const startQuizSession = useCallback(() => {
    let filtered = selectedCategory === 'all' 
      ? [...QUIZ_QUESTIONS] 
      : QUIZ_QUESTIONS.filter(q => q.category === selectedCategory);

    // Shuffle questions
    filtered = filtered.sort(() => Math.random() - 0.5);

    if (filtered.length === 0) {
      filtered = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
    }

    setQuestions(filtered);
    setCurrentIndex(0);
    setUserTyped('');
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setErrorCount(0);
    setAnswersLog([]);
    setGameStarted(true);
    setGameFinished(false);
    setTimeLeft(15);
    setBotProgress(0);
    setBotAnswered(false);
    startTimeRef.current = Date.now();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [selectedCategory]);

  // Handle countdown per question
  useEffect(() => {
    if (!gameStarted || gameFinished || questions.length === 0) return;

    setTimeLeft(15);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired for this question
          handleQuestionTimeout();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, gameFinished, currentIndex]);

  // Bot simulation loop in bot mode
  useEffect(() => {
    if (!gameStarted || gameFinished || quizMode !== 'bot' || questions.length === 0) return;

    setBotProgress(0);
    setBotAnswered(false);

    // Bot types answer over 3-7 seconds
    const botTime = Math.floor(Math.random() * 4000) + 3500;
    const botTimer = setTimeout(() => {
      setBotAnswered(true);
      setBotProgress(100);
    }, botTime);

    return () => clearTimeout(botTimer);
  }, [gameStarted, gameFinished, quizMode, currentIndex]);

  // Handle timeout
  const handleQuestionTimeout = () => {
    const currentQ = questions[currentIndex];
    setErrorCount(prev => prev + 1);
    setStreak(0);
    
    setAnswersLog(prev => [
      ...prev,
      { question: currentQ, typed: userTyped || '— (Time expired)', isCorrect: false, timeTakenSec: 15 }
    ]);

    playSwitchSound('error');
    advanceToNextQuestion();
  };

  // Check typed input against target answer
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setUserTyped(val);
    playSwitchSound(soundType);

    // Check if user answered correctly
    if (val && currentQ?.answer && val.trim().toLowerCase() === currentQ.answer.toLowerCase()) {
      const timeTakenSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const speedBonus = Math.max(10, (15 - timeTakenSec) * 20);
      const streakBonus = (streak + 1) * 25;
      const questionPoints = 100 + speedBonus + streakBonus;

      setScore(prev => prev + questionPoints);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setCorrectCount(prev => prev + 1);

      setAnswersLog(prev => [
        ...prev,
        { question: currentQ, typed: val, isCorrect: true, timeTakenSec }
      ]);

      showToast(`Correct! +${questionPoints} pts (Streak: ${newStreak}x)`, 'success');
      playSwitchSound('key');

      advanceToNextQuestion();
    }
  };

  // Move to next question or finish
  const advanceToNextQuestion = () => {
    setUserTyped('');
    if (currentIndex + 1 < questions.length && currentIndex + 1 < 10) {
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Quiz completed!
      finishQuiz();
    }
  };

  // Wrap up quiz session
  const finishQuiz = () => {
    setGameFinished(true);
    setGameStarted(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const totalAns = correctCount + errorCount + 1;
    const accuracy = Math.round((correctCount / Math.max(1, totalAns)) * 100);
    const estimatedWpm = Math.round((correctCount * 12));

    onFinishQuiz(score, accuracy, estimatedWpm);
    showToast(`Quiz Test Completed! Final Score: ${score}`, 'info');
  };

  const currentQ = questions[currentIndex];

  // Theme-aware helper styles
  const mainCardStyle = 
    activeTheme === 'cyberpunk' ? 'bg-[#120727]/90 border-purple-900/60 text-pink-100' :
    activeTheme === 'matrix' ? 'bg-black border-emerald-950 text-[#33ff33]' :
    activeTheme === 'sakura' ? 'bg-white border-rose-200/80 text-rose-950 shadow-sm' :
    activeTheme === 'carbon-light' ? 'bg-white border-slate-200 text-slate-900 shadow-sm' :
    'bg-slate-900/60 border-slate-800 text-slate-100';

  const subCardStyle = 
    activeTheme === 'cyberpunk' ? 'bg-[#180a33] border-purple-900/40 text-pink-100' :
    activeTheme === 'matrix' ? 'bg-black border-emerald-900/50 text-[#33ff33]' :
    activeTheme === 'sakura' ? 'bg-rose-50/70 border-rose-200/60 text-rose-950' :
    activeTheme === 'carbon-light' ? 'bg-slate-50 border-slate-200 text-slate-900' :
    'bg-slate-950/60 border-slate-800 text-slate-100';

  const inputStyle = 
    activeTheme === 'cyberpunk' ? 'bg-[#1d0a3d] border-purple-900/80 focus:border-pink-500 text-pink-100 placeholder:text-purple-400/50' :
    activeTheme === 'matrix' ? 'bg-black border-emerald-900 focus:border-[#33ff33] text-[#33ff33] placeholder:text-emerald-800' :
    activeTheme === 'sakura' ? 'bg-white border-rose-200 focus:border-rose-500 text-rose-950 placeholder:text-rose-300' :
    activeTheme === 'carbon-light' ? 'bg-white border-slate-300 focus:border-indigo-600 text-slate-950 placeholder:text-slate-400' :
    'bg-slate-950 border-slate-800 focus:border-cyan-400 text-white placeholder:text-slate-600';

  const titleTextStyle = 
    activeTheme === 'sakura' ? 'text-rose-950' :
    activeTheme === 'carbon-light' ? 'text-slate-900' :
    activeTheme === 'matrix' ? 'text-[#33ff33]' :
    activeTheme === 'cyberpunk' ? 'text-pink-100' :
    'text-white';

  const mutedTextStyle = 
    activeTheme === 'sakura' ? 'text-rose-700/80' :
    activeTheme === 'carbon-light' ? 'text-slate-500' :
    activeTheme === 'matrix' ? 'text-emerald-600' :
    activeTheme === 'cyberpunk' ? 'text-purple-400' :
    'text-slate-400';

  return (
    <div className="space-y-6">
      
      {/* 1. QUIZ MODE SELECTION & HEADER */}
      <div className={`p-4 md:p-6 rounded-2xl border transition-all duration-300 ${mainCardStyle}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${
              activeTheme === 'sakura' ? 'bg-rose-500 text-white shadow-md' :
              activeTheme === 'carbon-light' ? 'bg-indigo-600 text-white shadow-md' :
              activeTheme === 'matrix' ? 'bg-black border border-emerald-500 text-[#33ff33]' :
              activeTheme === 'cyberpunk' ? 'bg-pink-500 text-slate-950 font-bold' :
              'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg'
            }`}>
              <Brain size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-black tracking-tight ${titleTextStyle}`}>
                  Quiz Test Quest
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                  activeTheme === 'sakura' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                  activeTheme === 'carbon-light' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                  'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  NEW MODE
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${mutedTextStyle}`}>
                Type accurate & fast answers to technical questions to achieve maximum WPM & points!
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${subCardStyle}`}>
            <button
              onClick={() => setQuizMode('solo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                quizMode === 'solo' 
                  ? activeTheme === 'sakura' ? 'bg-rose-500 text-white font-bold' : activeTheme === 'carbon-light' ? 'bg-indigo-600 text-white font-bold' : 'bg-cyan-500 text-slate-950 font-bold shadow' 
                  : mutedTextStyle
              }`}
            >
              <Zap size={14} />
              <span>Solo Quiz</span>
            </button>
            <button
              onClick={() => setQuizMode('bot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                quizMode === 'bot' 
                  ? activeTheme === 'sakura' ? 'bg-rose-500 text-white font-bold' : activeTheme === 'carbon-light' ? 'bg-indigo-600 text-white font-bold' : 'bg-cyan-500 text-slate-950 font-bold shadow' 
                  : mutedTextStyle
              }`}
            >
              <Cpu size={14} />
              <span>Bot Battle</span>
            </button>
          </div>

        </div>

        {/* Categories selector */}
        {!gameStarted && !gameFinished && (
          <div className="mt-5 pt-4 border-t border-slate-800/20">
            <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${mutedTextStyle}`}>
              Select Topic Category:
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer capitalize ${
                    selectedCategory === cat
                      ? activeTheme === 'sakura' ? 'bg-rose-500 border-rose-400 text-white shadow-sm' : activeTheme === 'carbon-light' ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' : 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                      : subCardStyle
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. GAME LOBBY / START SCREEN */}
      {!gameStarted && !gameFinished && (
        <div className={`p-8 rounded-2xl border text-center space-y-6 ${mainCardStyle}`}>
          <div className="max-w-md mx-auto space-y-3">
            <div className={`w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center ${
              activeTheme === 'sakura' ? 'bg-rose-100 border-rose-300 text-rose-600' :
              activeTheme === 'carbon-light' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
              'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              <Sparkles size={32} />
            </div>
            <h3 className={`text-xl font-black ${titleTextStyle}`}>
              Are You Ready?
            </h3>
            <p className={`text-xs leading-relaxed ${mutedTextStyle}`}>
              Each question has a 15-second timer. Type the exact answer without typos to unlock combo streak multipliers and bonus points!
            </p>
          </div>

          <button
            onClick={startQuizSession}
            className={`px-8 py-3.5 font-black rounded-2xl text-sm uppercase tracking-wider transition-all transform hover:scale-105 shadow-xl cursor-pointer flex items-center gap-2 mx-auto ${
              activeTheme === 'sakura' ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' :
              activeTheme === 'carbon-light' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20' :
              activeTheme === 'matrix' ? 'bg-[#33ff33] text-black font-extrabold hover:bg-emerald-400' :
              'bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 text-slate-950'
            }`}
          >
            <Zap size={18} />
            <span>Start Quiz Test</span>
          </button>
        </div>
      )}

      {/* 3. ACTIVE QUIZ PLAY AREA */}
      {gameStarted && currentQ && (
        <div className="space-y-6">
          
          {/* Top Live Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${subCardStyle}`}>
              <span className={`text-xs font-bold ${mutedTextStyle}`}>Question:</span>
              <span className={`text-sm font-mono font-extrabold ${
                activeTheme === 'sakura' ? 'text-rose-600' :
                activeTheme === 'carbon-light' ? 'text-indigo-600' :
                'text-cyan-400'
              }`}>
                {currentIndex + 1} / {Math.min(10, questions.length)}
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${subCardStyle}`}>
              <span className={`text-xs font-bold flex items-center gap-1 ${mutedTextStyle}`}>
                <Clock size={14} className={timeLeft <= 5 ? 'text-rose-500 animate-bounce' : 'text-amber-500'} />
                Time Left:
              </span>
              <span className={`text-sm font-mono font-extrabold ${timeLeft <= 5 ? 'text-rose-500' : 'text-amber-500'}`}>
                {timeLeft} s
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${subCardStyle}`}>
              <span className={`text-xs font-bold flex items-center gap-1 ${mutedTextStyle}`}>
                <Flame size={14} className="text-orange-500" />
                Streak:
              </span>
              <span className="text-sm font-mono font-extrabold text-orange-500">
                {streak}x
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${subCardStyle}`}>
              <span className={`text-xs font-bold flex items-center gap-1 ${mutedTextStyle}`}>
                <Award size={14} className="text-emerald-500" />
                Score:
              </span>
              <span className="text-sm font-mono font-extrabold text-emerald-500">
                {score}
              </span>
            </div>
          </div>

          {/* Bot opponent lane in bot mode */}
          {quizMode === 'bot' && (
            <div className={`p-3 rounded-xl border flex items-center justify-between ${subCardStyle}`}>
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-indigo-400" />
                <span className={`text-xs font-bold ${titleTextStyle}`}>🤖 QuizBot 3000</span>
              </div>
              <span className={`text-xs font-mono font-bold ${botAnswered ? 'text-rose-500' : mutedTextStyle}`}>
                {botAnswered ? "Bot Answered!" : "Bot Thinking..."}
              </span>
            </div>
          )}

          {/* Main Question Card */}
          <div className={`p-6 md:p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all duration-300 ${mainCardStyle}`}>
            
            {/* Category & Difficulty Badges */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                activeTheme === 'sakura' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                activeTheme === 'carbon-light' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              }`}>
                {currentQ.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                currentQ.difficulty === 'easy'
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  : currentQ.difficulty === 'medium'
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
              }`}>
                {currentQ.difficulty}
              </span>
            </div>

            {/* Question Text */}
            <h3 className={`text-lg md:text-2xl font-bold leading-relaxed mb-6 ${titleTextStyle}`}>
              {currentQ.question}
            </h3>

            {/* Hint Box if available */}
            {currentQ.hint && (
              <div className={`p-3 rounded-xl border mb-6 text-xs flex items-center gap-2 ${
                activeTheme === 'sakura' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                activeTheme === 'carbon-light' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                'bg-amber-950/20 border-amber-500/30 text-amber-300'
              }`}>
                <HelpCircle size={14} className="shrink-0 text-amber-500" />
                <span>Hint: <strong className="font-mono">{currentQ.hint}</strong></span>
              </div>
            )}

            {/* Typing Answer Input Box */}
            <div className="space-y-3">
              <label className={`text-xs font-bold block uppercase tracking-wider ${mutedTextStyle}`}>
                Enter Answer (Type on Keyboard):
              </label>

              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={userTyped}
                  onChange={handleInputChange}
                  placeholder="Type your answer here..."
                  autoFocus
                  className={`w-full px-5 py-4 rounded-2xl text-base md:text-lg font-mono font-bold border-2 transition-all outline-none ${inputStyle}`}
                />
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className={`text-xs font-mono ${mutedTextStyle}`}>
                    {userTyped.length} / {currentQ.answer.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Time progress bar bottom */}
            <div className={`mt-6 h-1.5 rounded-full overflow-hidden ${
              activeTheme === 'sakura' || activeTheme === 'carbon-light' ? 'bg-slate-200' : 'bg-slate-800'
            }`}>
              <motion.div
                className={`h-full ${timeLeft <= 5 ? 'bg-rose-500' : activeTheme === 'sakura' ? 'bg-rose-500' : activeTheme === 'carbon-light' ? 'bg-indigo-600' : 'bg-cyan-500'}`}
                animate={{ width: `${(timeLeft / 15) * 100}%` }}
                transition={{ ease: 'linear', duration: 1 }}
              />
            </div>

          </div>

        </div>
      )}

      {/* 4. FINAL QUIZ RESULTS SCREEN */}
      {gameFinished && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 md:p-8 rounded-3xl border shadow-2xl space-y-6 ${mainCardStyle}`}
        >
          <div className="text-center space-y-2">
            <div className={`inline-flex p-4 rounded-3xl border mb-2 ${
              activeTheme === 'sakura' ? 'bg-rose-100 border-rose-300 text-rose-600' :
              activeTheme === 'carbon-light' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
              'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            }`}>
              <Trophy size={40} />
            </div>
            <h2 className={`text-2xl md:text-3xl font-black ${titleTextStyle}`}>
              Quiz Test Completed!
            </h2>
            <p className={`text-xs ${mutedTextStyle}`}>
              Your overall score and stats have been computed
            </p>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border text-center ${subCardStyle}`}>
              <span className={`text-xs font-bold block mb-1 ${mutedTextStyle}`}>Total Score</span>
              <span className={`text-2xl font-black font-mono ${
                activeTheme === 'sakura' ? 'text-rose-600' :
                activeTheme === 'carbon-light' ? 'text-indigo-600' :
                'text-cyan-400'
              }`}>{score}</span>
            </div>

            <div className={`p-4 rounded-2xl border text-center ${subCardStyle}`}>
              <span className={`text-xs font-bold block mb-1 ${mutedTextStyle}`}>Correct Answers</span>
              <span className="text-2xl font-black text-emerald-500 font-mono">
                {correctCount} / {answersLog.length}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border text-center ${subCardStyle}`}>
              <span className={`text-xs font-bold block mb-1 ${mutedTextStyle}`}>Max Combo Streak</span>
              <span className="text-2xl font-black text-orange-500 font-mono">{maxStreak}x</span>
            </div>

            <div className={`p-4 rounded-2xl border text-center ${subCardStyle}`}>
              <span className={`text-xs font-bold block mb-1 ${mutedTextStyle}`}>Accuracy</span>
              <span className="text-2xl font-black text-indigo-500 font-mono">
                {Math.round((correctCount / Math.max(1, answersLog.length)) * 100)}%
              </span>
            </div>
          </div>

          {/* Breakdown Review List */}
          <div className="space-y-3 pt-4 border-t border-slate-800/20">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${mutedTextStyle}`}>
              Questions Review:
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {answersLog.map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                    item.isCorrect
                      ? activeTheme === 'sakura' || activeTheme === 'carbon-light'
                        ? 'bg-emerald-50 border-emerald-200 text-slate-800'
                        : 'bg-emerald-950/20 border-emerald-500/20 text-slate-200'
                      : activeTheme === 'sakura' || activeTheme === 'carbon-light'
                        ? 'bg-rose-50 border-rose-200 text-slate-800'
                        : 'bg-rose-950/20 border-rose-500/20 text-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {item.isCorrect ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-bold ${titleTextStyle}`}>{item.question.question}</p>
                      <span className={`text-[10px] block mt-0.5 ${mutedTextStyle}`}>
                        Correct answer: <strong className="text-emerald-500 font-mono">{item.question.answer}</strong> | Your answer: <span className="font-mono">{item.typed}</span>
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono shrink-0 ${mutedTextStyle}`}>
                    {item.timeTakenSec} seconds
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={startQuizSession}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <RefreshCw size={16} />
              <span>Play Again</span>
            </button>
            <button
              onClick={() => {
                setGameFinished(false);
                setGameStarted(false);
              }}
              className={`py-3 px-6 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isLightTheme ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Back to Catalog
            </button>
          </div>

        </motion.div>
      )}

    </div>
  );
}
