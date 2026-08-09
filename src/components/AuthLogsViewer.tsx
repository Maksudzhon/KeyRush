import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, ShieldAlert, Key, UserCheck, 
  LogIn, UserPlus, RefreshCw, Activity, Clock, Globe
} from 'lucide-react';
import { AuthLog } from '../types';
import { THEME_STYLES } from '../types';
import { safeFetchJson } from '../utils/api';

interface AuthLogsViewerProps {
  activeTheme: string;
  socket: WebSocket | null;
}

export default function AuthLogsViewer({ activeTheme, socket }: AuthLogsViewerProps) {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');

  const styles = THEME_STYLES[activeTheme as keyof typeof THEME_STYLES] || THEME_STYLES.carbon;
  const isLight = activeTheme === 'carbon-light' || activeTheme === 'sakura';

  const fetchAuthLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/logs');
      const data = await safeFetchJson(res);
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      // Catch network or parse error silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthLogs();
  }, []);

  // Listen for real-time auth log broadcasts over WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'auth_log_event' && data.log) {
          setLogs((prev) => [data.log, ...prev].slice(0, 50));
        }
      } catch (err) {
        // ignore non-json messages
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'SUCCESS') return log.status === 'SUCCESS';
    if (filter === 'FAILED') return log.status === 'FAILED';
    return true;
  });

  const getActionIcon = (action: string, status: string) => {
    if (status === 'FAILED') return <ShieldAlert size={14} className="text-rose-500 shrink-0" />;
    switch (action) {
      case 'REGISTER':
        return <UserPlus size={14} className="text-cyan-400 shrink-0" />;
      case 'LOGIN_SUCCESS':
        return <LogIn size={14} className="text-emerald-400 shrink-0" />;
      case 'OAUTH_CONNECT':
        return <UserCheck size={14} className="text-purple-400 shrink-0" />;
      default:
        return <Key size={14} className="text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className={`p-5 rounded-2xl border backdrop-blur-md space-y-4 ${styles.cardBg}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-800/40">
        <div className="flex items-center gap-2">
          <Activity size={16} className={`${styles.accentText} animate-pulse`} />
          <h3 className={`text-xs font-bold uppercase tracking-widest ${styles.cardTitle}`}>
            Real-Time DB Auth Activity Log
          </h3>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            LIVE DB
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filters */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg border text-[10px] font-bold bg-slate-900/50 border-slate-800">
            {(['ALL', 'SUCCESS', 'FAILED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-slate-800 text-white shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAuthLogs}
            disabled={isLoading}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer hover:bg-slate-800 ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
            title="Refresh database logs"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
        {filteredLogs.length === 0 ? (
          <div className={`p-6 text-center text-xs font-mono rounded-xl border border-dashed ${styles.mutedText}`}>
            No database authentication logs recorded yet.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredLogs.map((log) => {
              const isSuccess = log.status === 'SUCCESS';
              const logTime = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-2.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 transition-all ${
                    isSuccess
                      ? isLight ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-emerald-950/20 border-emerald-900/40'
                      : isLight ? 'bg-rose-50/60 border-rose-200/80' : 'bg-rose-950/20 border-rose-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getActionIcon(log.action, log.status)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold tracking-tight truncate max-w-[130px] ${styles.headerText}`}>
                          {log.userName}
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-slate-800/40 px-1.5 py-0.5 rounded text-slate-300 font-extrabold border border-slate-700/50">
                          {log.action}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase">
                          {log.authProvider}
                        </span>
                      </div>
                      {log.details && (
                        <p className={`text-[10px] leading-tight truncate max-w-[260px] sm:max-w-[340px] mt-0.5 ${styles.mutedText}`}>
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px] ml-auto shrink-0">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Globe size={11} className="text-slate-500" />
                      {log.ip}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 border-l border-slate-700/50 pl-2">
                      <Clock size={11} className="text-slate-500" />
                      {logTime}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border ${
                      isSuccess
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
