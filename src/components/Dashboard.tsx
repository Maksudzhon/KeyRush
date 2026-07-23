import React from 'react';
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
  TrendingUp
} from 'lucide-react';
import { GameStats, Achievement, THEME_STYLES } from '../types';
import TroubleshootSection from './TroubleshootSection';
import GlobalLeaderboard from './GlobalLeaderboard';

interface DashboardProps {
  stats: GameStats;
  onRestart: () => void;
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
  isMultiplayer = false, 
  achievements,
  recentRaces = [],
  activeTheme = 'carbon'
}: DashboardProps) {
  // Theme styles
  const theme = THEME_STYLES[activeTheme] || THEME_STYLES['carbon'];
  const isLight = activeTheme === 'carbon-light' || activeTheme === 'sakura';

  // Format the duration beautifully
  const durationSecs = (stats.elapsedMs / 1000).toFixed(1);

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
        <button
          onClick={onRestart}
          id="restart-button"
          className={`flex items-center gap-2 px-5 py-3 ${theme.buttonAccent} font-bold rounded-xl transition-all duration-300 shadow-lg active:scale-95 whitespace-nowrap cursor-pointer`}
        >
          <RotateCcw size={16} />
          <span>Start New Practice</span>
        </button>
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
    </div>
  );
}
