import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { 
  Trophy, 
  Target, 
  Activity, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  Award, 
  TrendingUp,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Send,
  X
} from 'lucide-react';
import { GameStats, Achievement, THEME_STYLES } from '../types';
import TroubleshootSection from './TroubleshootSection';
import GlobalLeaderboard from './GlobalLeaderboard';

interface DashboardProps {
  stats: GameStats;
  onRestart: () => void;
  onWatchReplay?: () => void;
  isMultiplayer?: boolean;
  achievements: Achievement[];
  recentRaces?: {
    date: string;
    wpm: number;
    accuracy: number;
    language: string;
  }[];
  activeTheme?: string;
}

export default function Dashboard({ 
  stats, 
  onRestart, 
  onWatchReplay,
  isMultiplayer = false, 
  achievements,
  recentRaces = [],
  activeTheme = 'carbon'
}: DashboardProps) {
  // Theme styles
  const theme = THEME_STYLES[activeTheme] || THEME_STYLES['carbon'];
  const isLight = activeTheme === 'carbon-light' || activeTheme === 'sakura';

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Format the duration beautifully
  const durationSecs = (stats.elapsedMs / 1000).toFixed(1);

  // Generate unique share URL starting with custom brand domain
  const getUniqueShareUrl = () => {
    try {
      const payload = JSON.stringify({
        wpm: stats.wpm,
        acc: stats.accuracy,
        cpm: stats.cpm,
        err: stats.errors,
        ts: Date.now()
      });
      const encoded = btoa(payload).replace(/=/g, '');
      return `https://keyrush.io/race?share=${encoded}`;
    } catch {
      return `https://keyrush.io/race?wpm=${stats.wpm}&acc=${stats.accuracy}`;
    }
  };

  const shareUrl = getUniqueShareUrl();
  const shareText = `⚡ I just typed ${stats.wpm} WPM with ${stats.accuracy}% accuracy on KeyRush Speed Typing! Can you beat my record?`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopySnippet = () => {
    const snippet = `🚀 KeyRush Speed Typing Result:\n⚡ Speed: ${stats.wpm} WPM\n🎯 Accuracy: ${stats.accuracy}%\n⚡ CPM: ${stats.cpm}\nChallenge me here: ${shareUrl}`;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Colors for recharts based on theme
  const chartGridColor = isLight ? '#cbd5e1' : '#1e293b';
  const chartAxisColor = isLight ? '#475569' : '#64748b';
  const tooltipStyle = isLight 
    ? { backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', fontFamily: 'monospace', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
    : { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontFamily: 'monospace', fontSize: '11px' };

  return (
    <div id="analytics-dashboard" className="space-y-6 animate-fade-in">
      {/* Top Banner Success */}
      <div className={`flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl border backdrop-blur-md gap-4 transition-all ${theme.cardBg}`}>
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider ${theme.accentText}`}>
            {isMultiplayer ? 'MULTIPLAYER RACE RESULT' : 'FINAL ANALYSIS & PERFORMANCE STATS'}
          </span>
          <h2 className={`text-2xl md:text-3xl font-extrabold ${theme.headerText} mt-1`}>
            Congratulations! Practice completed.
          </h2>
          <p className={`text-sm ${theme.mutedText} mt-1`}>
            Your results have been successfully analyzed. Review your core typing metrics below.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {onWatchReplay && (
            <button
              onClick={onWatchReplay}
              id="watch-replay-button"
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-purple-500/25 active:scale-95 cursor-pointer"
            >
              <Activity size={16} />
              <span>Watch Race Replay</span>
            </button>
          )}
          <button
            onClick={() => setIsShareModalOpen(true)}
            id="share-result-button"
            className="flex items-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-cyan-500/25 active:scale-95 cursor-pointer"
          >
            <Share2 size={16} />
            <span>Share Result</span>
          </button>
          <button
            onClick={onRestart}
            id="restart-button"
            className={`flex items-center gap-2 px-5 py-3 ${theme.buttonAccent} font-bold rounded-xl transition-all duration-300 shadow-lg active:scale-95 whitespace-nowrap cursor-pointer`}
          >
            <RotateCcw size={16} />
            <span>Start New Practice</span>
          </button>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* WPM */}
        <div id="stat-wpm" className={`p-4 rounded-xl border backdrop-blur-md ${theme.subCardBg} ${theme.subCardBorder}`}>
          <div className={`flex items-center gap-1.5 ${theme.mutedText} text-xs font-medium uppercase tracking-wider mb-1`}>
            <Trophy size={14} className="text-cyan-400" />
            WPM (Words/min)
          </div>
          <div className={`text-3xl md:text-4xl font-extrabold ${theme.headerText} tracking-tight`}>
            {stats.wpm}
          </div>
          <span className={`text-[10px] ${theme.mutedText} font-mono`}>
            Net Typing Speed
          </span>
        </div>

        {/* Accuracy */}
        <div id="stat-accuracy" className={`p-4 rounded-xl border backdrop-blur-md ${theme.subCardBg} ${theme.subCardBorder}`}>
          <div className={`flex items-center gap-1.5 ${theme.mutedText} text-xs font-medium uppercase tracking-wider mb-1`}>
            <Target size={14} className="text-emerald-400" />
            Accuracy
          </div>
          <div className={`text-3xl md:text-4xl font-extrabold ${theme.headerText} tracking-tight`}>
            {stats.accuracy}%
          </div>
          <span className={`text-[10px] ${theme.mutedText} font-mono`}>
            Keystroke Accuracy
          </span>
        </div>

        {/* CPM */}
        <div id="stat-cpm" className={`p-4 rounded-xl border backdrop-blur-md ${theme.subCardBg} ${theme.subCardBorder}`}>
          <div className={`flex items-center gap-1.5 ${theme.mutedText} text-xs font-medium uppercase tracking-wider mb-1`}>
            <Activity size={14} className="text-purple-400" />
            CPM (Chars/min)
          </div>
          <div className={`text-3xl md:text-4xl font-extrabold ${theme.headerText} tracking-tight`}>
            {stats.cpm}
          </div>
          <span className={`text-[10px] ${theme.mutedText} font-mono`}>
            Characters Per Minute
          </span>
        </div>

        {/* Time */}
        <div id="stat-time" className={`p-4 rounded-xl border backdrop-blur-md ${theme.subCardBg} ${theme.subCardBorder}`}>
          <div className={`flex items-center gap-1.5 ${theme.mutedText} text-xs font-medium uppercase tracking-wider mb-1`}>
            <Clock size={14} className="text-amber-400" />
            Time Elapsed
          </div>
          <div className={`text-3xl md:text-4xl font-extrabold ${theme.headerText} tracking-tight`}>
            {durationSecs} <span className={`text-lg font-normal ${theme.mutedText}`}>seconds</span>
          </div>
          <span className={`text-[10px] ${theme.mutedText} font-mono`}>
            Total Time Taken
          </span>
        </div>

        {/* Errors */}
        <div id="stat-errors" className={`p-4 rounded-xl border backdrop-blur-md col-span-2 md:col-span-1 ${theme.subCardBg} ${theme.subCardBorder}`}>
          <div className={`flex items-center gap-1.5 ${theme.mutedText} text-xs font-medium uppercase tracking-wider mb-1`}>
            <AlertCircle size={14} className="text-rose-400" />
            Mistakes
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-rose-500 tracking-tight">
            {stats.errors}
          </div>
          <span className={`text-[10px] ${theme.mutedText} font-mono`}>
            Total Typo Keys
          </span>
        </div>
      </div>

      {/* Main Graph & Troubleshoot section */}
      <div className="space-y-6">
        {/* Speed Chart */}
        <div id="speed-chart-container" className={`p-5 rounded-2xl border backdrop-blur-md ${theme.cardBg}`}>
          <h3 className={`text-sm font-semibold tracking-wider uppercase mb-4 flex items-center gap-2 ${theme.cardTitle}`}>
            <Activity size={16} className="text-cyan-400" />
            Speed Progression Curve (WPM & Accuracy)
          </h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.wpmHistory}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis 
                  dataKey="time" 
                  stroke={chartAxisColor} 
                  fontSize={10} 
                  tickFormatter={(val) => `${val}s`}
                />
                <YAxis stroke={chartAxisColor} fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area 
                  type="monotone" 
                  dataKey="wpm" 
                  name="Speed (WPM)"
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWpm)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dedicated Troubleshoot Section displaying character frequency heatmap */}
        <TroubleshootSection 
          errorHeatmap={stats.errorHeatmap || {}} 
          totalErrors={stats.errors} 
          activeTheme={activeTheme}
        />
      </div>

      {/* WPM Growth dynamics across last 10 games */}
      {recentRaces && recentRaces.length > 0 && (
        <div id="wpm-growth-dynamics" className={`p-5 rounded-2xl border backdrop-blur-md ${theme.cardBg}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className={`text-sm font-semibold tracking-wider uppercase flex items-center gap-2 ${theme.cardTitle}`}>
                <TrendingUp size={16} className="text-emerald-400" />
                WPM Speed Trend (Last 10 Races)
              </h3>
              <p className={`text-[10px] ${theme.mutedText} mt-0.5`}>
                Progression curve illustrating your net typing speed across successive tests (oldest to newest).
              </p>
            </div>
            <div className={`px-3 py-1 border rounded-xl text-xs font-bold font-mono ${theme.subCardBg} ${theme.subCardBorder} ${theme.accentText}`}>
              Personal Best: {Math.max(...recentRaces.map(r => r.wpm), 0)} WPM
            </div>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[...recentRaces].reverse().map((r, i) => ({
                  ...r,
                  gameNumber: `Race ${i + 1}`,
                  displayLabel: `${r.wpm} WPM (${r.accuracy}%)`
                }))}
                margin={{ top: 10, right: 15, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis 
                  dataKey="gameNumber" 
                  stroke={chartAxisColor} 
                  fontSize={10} 
                  tickLine={false}
                />
                <YAxis 
                  stroke={chartAxisColor} 
                  fontSize={10} 
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => {
                    if (name === 'wpm') return [`${value} WPM`, 'Speed'];
                    if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                    return [value, name];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="wpm" 
                  name="wpm"
                  stroke="#10b981" 
                  strokeWidth={3}
                  activeDot={{ r: 7 }}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 1, stroke: chartGridColor }}
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  name="accuracy"
                  stroke="#06b6d4" 
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  activeDot={{ r: 5 }}
                  dot={{ r: 3, fill: '#06b6d4', strokeWidth: 1, stroke: chartGridColor }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Achievements Section */}
      <div id="achievements-dashboard" className={`p-5 rounded-2xl border backdrop-blur-md ${theme.cardBg}`}>
        <h3 className={`text-sm font-semibold tracking-wider uppercase mb-4 flex items-center gap-2 ${theme.cardTitle}`}>
          <Award size={16} className="text-amber-500 animate-pulse" />
          Achievements & Trophies ({achievements.filter(a => a.unlocked).length} / {achievements.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl cursor-pointer group ${
                item.unlocked
                  ? `${theme.accentBg} ${theme.accentBorder}`
                  : `${theme.subCardBg} ${theme.subCardBorder} opacity-50 hover:opacity-85`
              }`}
            >
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 transition-transform duration-300 transform group-hover:scale-125 group-hover:rotate-6">
                <span className="text-lg">{item.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className={`text-xs font-bold ${theme.headerText}`}>{item.title}</h4>
                  {item.unlocked && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold ${theme.accentText} bg-amber-500/20`}>
                      UNLOCKED
                    </span>
                  )}
                </div>
                <p className={`text-[10px] ${theme.mutedText} mt-1`}>{item.description}</p>
                {item.unlocked && item.unlockedAt && (
                  <span className={`text-[8px] ${theme.mutedText} block mt-1 font-mono`}>
                    Unlocked on {new Date(item.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Leaderboards Standings */}
      <GlobalLeaderboard activeTheme={activeTheme} />

      {/* Share Result Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`relative w-full max-w-md p-6 rounded-2xl border shadow-2xl ${theme.cardBg}`}>
            <button
              onClick={() => setIsShareModalOpen(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-500/10 ${theme.mutedText} transition-colors cursor-pointer`}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Share2 size={22} />
              </div>
              <div>
                <h3 className={`text-lg font-extrabold ${theme.headerText}`}>Share Your Performance</h3>
                <p className={`text-xs ${theme.mutedText}`}>Share your unique speed typing score with friends</p>
              </div>
            </div>

            {/* Performance Stats Card */}
            <div className={`grid grid-cols-3 gap-2 p-3.5 rounded-xl border mb-5 ${theme.subCardBg} ${theme.subCardBorder}`}>
              <div className="text-center">
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${theme.mutedText}`}>SPEED</span>
                <span className="text-xl font-black text-cyan-400">{stats.wpm} <span className="text-xs font-normal">WPM</span></span>
              </div>
              <div className="text-center">
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${theme.mutedText}`}>ACCURACY</span>
                <span className="text-xl font-black text-emerald-400">{stats.accuracy}%</span>
              </div>
              <div className="text-center">
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${theme.mutedText}`}>CPM</span>
                <span className="text-xl font-black text-purple-400">{stats.cpm}</span>
              </div>
            </div>

            {/* Social Media Share Shortcuts */}
            <div className="space-y-2 mb-5">
              <label className={`text-xs font-bold uppercase tracking-wider block ${theme.mutedText}`}>
                Direct Share to Social Media:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#1DA1F2]/15 text-[#1DA1F2] border border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/25 font-bold text-xs transition-colors"
                >
                  <ExternalLink size={13} />
                  X / Twitter
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/30 hover:bg-[#229ED9]/25 font-bold text-xs transition-colors"
                >
                  <Send size={13} />
                  Telegram
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#0A66C2]/15 text-[#0A66C2] border border-[#0A66C2]/30 hover:bg-[#0A66C2]/25 font-bold text-xs transition-colors"
                >
                  <ExternalLink size={13} />
                  LinkedIn
                </a>
              </div>
            </div>

            {/* Unique Link Input Box */}
            <div className="space-y-2 mb-4">
              <label className={`text-xs font-bold uppercase tracking-wider block ${theme.mutedText}`}>
                Your Unique Share URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className={`w-full p-2.5 text-xs font-mono rounded-xl border bg-slate-950/60 text-slate-200 focus:outline-none truncate border-slate-700/60`}
                />
                <button
                  onClick={handleCopyLink}
                  id="copy-share-url-button"
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer transition-all active:scale-95 ${
                    copiedLink 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
                  }`}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Chat Snippet Copy */}
            <div>
              <button
                onClick={handleCopySnippet}
                id="copy-snippet-button"
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${theme.subCardBg} ${theme.subCardBorder} ${theme.headerText} hover:bg-slate-500/10 active:scale-98`}
              >
                {copiedSnippet ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedSnippet ? 'Snippet Copied!' : 'Copy Chat Card Snippet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
