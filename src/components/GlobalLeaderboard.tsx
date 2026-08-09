import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw, Flame, Target, Award, ShieldCheck, Zap, User } from 'lucide-react';
import { THEME_STYLES } from '../types';
import { safeFetchJson } from '../utils/api';

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  authProvider?: string;
  maxWpm: number;
  averageWpm: number;
  racesCompleted: number;
  averageAccuracy: number;
}

interface GlobalLeaderboardProps {
  activeTheme?: string;
  currentUserId?: string | null;
}

export default function GlobalLeaderboard({
  activeTheme = 'carbon',
  currentUserId = null,
}: GlobalLeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await safeFetchJson(res);
      if (data.success && Array.isArray(data.leaderboard)) {
        setUsers(data.leaderboard);
        setError(null);
      } else {
        setError('Could not load global rankings.');
      }
    } catch (err) {
      setError('Server connection error.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const styles = THEME_STYLES[activeTheme] || THEME_STYLES['carbon'];

  return (
    <div id="global-leaderboard-container" className={`p-5 sm:p-6 rounded-2xl border backdrop-blur-md transition-all ${styles.cardBg}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b ${styles.subCardBorder}`}>
        <div>
          <h3 className={`text-base font-bold uppercase tracking-wider flex items-center gap-2 ${styles.cardTitle}`}>
            <Trophy size={18} className="text-amber-400 animate-pulse" />
            Global Leaderboards
          </h3>
          <p className={`text-xs ${styles.mutedText} mt-0.5`}>
            Top 10 fastest typists worldwide verified in KeyRush database
          </p>
        </div>

        <button
          onClick={fetchLeaderboard}
          disabled={isRefreshing}
          className={`self-start sm:self-auto px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${styles.subCardBg} ${styles.subCardBorder} ${styles.headerText} hover:border-amber-500/50`}
        >
          <RefreshCw size={13} className={`text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Standings'}</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <RefreshCw size={24} className="animate-spin text-amber-400 mb-2" />
          <span className="text-xs font-medium">Fetching global typists...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-slate-400 text-xs">
          No records registered yet. Be the first to claim #1 place on the global leaderboard!
        </div>
      ) : (
        <div className="space-y-2.5">
          {users.map((user, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const isCurrentUser = currentUserId && user.id === currentUserId;

            // Rank badge styling
            let rankBadge = null;
            if (rank === 1) {
              rankBadge = (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  🥇
                </div>
              );
            } else if (rank === 2) {
              rankBadge = (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shrink-0">
                  🥈
                </div>
              );
            } else if (rank === 3) {
              rankBadge = (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-black text-sm flex items-center justify-center shadow-md shrink-0">
                  🥉
                </div>
              );
            } else {
              rankBadge = (
                <div className={`w-8 h-8 rounded-xl border font-mono font-extrabold text-xs flex items-center justify-center shrink-0 ${styles.subCardBg} ${styles.subCardBorder} ${styles.mutedText}`}>
                  #{rank}
                </div>
              );
            }

            return (
              <div
                key={user.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 hover:scale-[1.01] ${
                  isCurrentUser
                    ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10'
                    : isTop3
                    ? `${styles.subCardBg} border-amber-500/30 hover:border-amber-500/60`
                    : `${styles.subCardBg} ${styles.subCardBorder} hover:border-slate-700`
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {rankBadge}

                  <div className={`w-9 h-9 rounded-xl border ${styles.subCardBg} ${styles.subCardBorder} flex items-center justify-center shrink-0 text-base font-bold text-amber-400`}>
                    {user.avatar && user.avatar !== 'default' ? (
                      <span>{user.avatar}</span>
                    ) : (
                      <User size={18} className="text-amber-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate ${styles.headerText}`}>
                        {user.name}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
                          YOU
                        </span>
                      )}
                      {user.authProvider && (
                        <span className={`text-[8px] uppercase tracking-wider font-mono ${styles.subCardBg} ${styles.mutedText} px-1.5 py-0.5 rounded border ${styles.subCardBorder}`}>
                          {user.authProvider}
                        </span>
                      )}
                    </div>
                    {user.bio ? (
                      <p className={`text-[10px] truncate max-w-xs ${styles.mutedText}`}>
                        {user.bio}
                      </p>
                    ) : (
                      <p className={`text-[10px] ${styles.mutedText}`}>
                        Verified KeyRush Competitor
                      </p>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto font-mono text-xs">
                  <div className="text-center">
                    <span className={`block text-[8px] uppercase font-bold tracking-wider ${styles.mutedText}`}>
                      MAX SPEED
                    </span>
                    <strong className="text-sm font-extrabold text-amber-400 flex items-center justify-center gap-0.5">
                      <Flame size={12} className="text-amber-500 shrink-0" />
                      {user.maxWpm} <span className={`text-[9px] font-normal ${styles.mutedText}`}>WPM</span>
                    </strong>
                  </div>

                  <div className="text-center">
                    <span className={`block text-[8px] uppercase font-bold tracking-wider ${styles.mutedText}`}>
                      AVG WPM
                    </span>
                    <span className={`font-bold ${styles.headerText}`}>
                      {user.averageWpm}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className={`block text-[8px] uppercase font-bold tracking-wider ${styles.mutedText}`}>
                      ACCURACY
                    </span>
                    <span className="font-bold text-emerald-400">
                      {user.averageAccuracy}%
                    </span>
                  </div>

                  <div className="text-center hidden sm:block">
                    <span className={`block text-[8px] uppercase font-bold tracking-wider ${styles.mutedText}`}>
                      RACES
                    </span>
                    <span className={`font-bold ${styles.mutedText}`}>
                      {user.racesCompleted}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
