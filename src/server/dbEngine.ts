import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserProfile, UserStats, AuthLog } from '../types';

export interface DBUser extends UserProfile {
  passwordHash?: string;
  salt?: string;
  token?: string;
  stats: UserStats;
}

export interface DatabaseSchema {
  users: DBUser[];
  authLogs: AuthLog[];
  sessions: Record<string, { userId: string; createdAt: number }>;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'keyrush_db.json');

const DEFAULT_STATS: UserStats = {
  racesCompleted: 0,
  averageWpm: 0,
  maxWpm: 0,
  averageAccuracy: 100,
  recentRaces: []
};

let dbCache: DatabaseSchema | null = null;

// Initialize Database directory and file
export function initDb(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    // Generate initial default system user
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync('admin123', salt, 64).toString('hex');

    const defaultUser: DBUser = {
      id: 'KR-10001',
      name: 'KeyRush Admin',
      email: 'admin@keyrush.io',
      passwordHash,
      salt,
      bio: 'Official KeyRush Master Typist & Speed Benchmark Record Holder.',
      avatar: 'default',
      authProvider: 'email',
      createdAt: new Date().toLocaleDateString(),
      stats: {
        racesCompleted: 42,
        averageWpm: 124,
        maxWpm: 168,
        averageAccuracy: 98,
        recentRaces: [
          { date: '2026-07-22', wpm: 142, accuracy: 99, language: 'uz' },
          { date: '2026-07-21', wpm: 135, accuracy: 98, language: 'en' },
          { date: '2026-07-20', wpm: 128, accuracy: 97, language: 'code' }
        ]
      }
    };

    const benchmarkUsers: DBUser[] = [
      defaultUser,
      {
        id: 'KR-10002',
        name: 'SpeedDemon',
        email: 'speed@keyrush.io',
        passwordHash,
        salt,
        bio: 'Mechanical keyboard enthusiast. Reached 150+ WPM on custom Lubed switches.',
        avatar: '⚡',
        authProvider: 'google',
        createdAt: '2026-07-21',
        stats: { racesCompleted: 88, averageWpm: 138, maxWpm: 154, averageAccuracy: 99, recentRaces: [] }
      },
      {
        id: 'KR-10003',
        name: 'TypeNinja',
        email: 'ninja@keyrush.io',
        passwordHash,
        salt,
        bio: 'Silent, swift, accurate. Touch-typing since 2018.',
        avatar: '🥷',
        authProvider: 'discord',
        createdAt: '2026-07-20',
        stats: { racesCompleted: 64, averageWpm: 128, maxWpm: 142, averageAccuracy: 98, recentRaces: [] }
      },
      {
        id: 'KR-10004',
        name: 'CyberFingers',
        email: 'cyber@keyrush.io',
        passwordHash,
        salt,
        bio: 'Coding at 130 WPM with Neovim shortcuts.',
        avatar: '🤖',
        authProvider: 'telegram',
        createdAt: '2026-07-19',
        stats: { racesCompleted: 52, averageWpm: 122, maxWpm: 135, averageAccuracy: 97, recentRaces: [] }
      },
      {
        id: 'KR-10005',
        name: 'QuantumKeys',
        email: 'quantum@keyrush.io',
        passwordHash,
        salt,
        bio: 'Typing enthusiast practicing 15 minutes every morning.',
        avatar: '🌌',
        authProvider: 'email',
        createdAt: '2026-07-18',
        stats: { racesCompleted: 35, averageWpm: 115, maxWpm: 128, averageAccuracy: 98, recentRaces: [] }
      }
    ];

    const initialLog: AuthLog = {
      id: `LOG-${Date.now()}`,
      userId: defaultUser.id,
      userName: defaultUser.name,
      userEmail: defaultUser.email,
      authProvider: 'system',
      action: 'REGISTER',
      ip: '127.0.0.1',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      details: 'System Database initialized with default admin and benchmark records.'
    };

    dbCache = {
      users: benchmarkUsers,
      authLogs: [initialLog],
      sessions: {}
    };

    saveDb(dbCache);
  } else {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse database file, reinitializing:', err);
      dbCache = { users: [], authLogs: [], sessions: {} };
    }
  }

  return dbCache!;
}

// Persist Database atomically to disk
export function saveDb(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

// Password hashing helper
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
}

// Generate Auth Session Token
function generateToken(userId: string): string {
  return `TOKEN-${userId}-${crypto.randomBytes(24).toString('hex')}`;
}

// --- PUBLIC AUTH & USER API METHODS ---

// 1. Register User
export function registerUser(params: {
  name: string;
  email: string;
  password?: string;
  bio?: string;
  avatar?: string;
  ip?: string;
}): { success: boolean; user?: DBUser; token?: string; error?: string; log?: AuthLog } {
  const db = initDb();
  const normalizedEmail = (params.email || '').trim().toLowerCase();

  const existing = db.users.find(u => (u.email || '').toLowerCase() === normalizedEmail);
  if (existing) {
    const failedLog: AuthLog = {
      id: `LOG-${Date.now()}`,
      userName: params.name || 'Unknown',
      userEmail: normalizedEmail,
      authProvider: 'email',
      action: 'REGISTER',
      ip: params.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
      status: 'FAILED',
      details: 'Registration attempt failed: Email already exists.'
    };
    db.authLogs.unshift(failedLog);
    saveDb(db);
    return { success: false, error: 'User with this email already exists!', log: failedLog };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = params.password ? hashPassword(params.password, salt) : undefined;
  const userId = generateId('KR');

  const newUser: DBUser = {
    id: userId,
    name: (params.name || '').trim() || 'Anonymous Typist',
    email: normalizedEmail,
    passwordHash,
    salt,
    bio: params.bio?.trim() || 'Excited speed typist on KeyRush Engine!',
    avatar: params.avatar || 'default',
    authProvider: 'email',
    createdAt: new Date().toLocaleDateString(),
    stats: { ...DEFAULT_STATS }
  };

  const token = generateToken(userId);
  db.users.push(newUser);
  db.sessions[token] = { userId, createdAt: Date.now() };

  const authLog: AuthLog = {
    id: `LOG-${Date.now()}`,
    userId,
    userName: newUser.name,
    userEmail: newUser.email,
    authProvider: 'email',
    action: 'REGISTER',
    ip: params.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    details: 'New account registered successfully.'
  };

  db.authLogs.unshift(authLog);
  // Keep logs at max 100 entries
  if (db.authLogs.length > 100) {
    db.authLogs = db.authLogs.slice(0, 100);
  }

  saveDb(db);
  return { success: true, user: newUser, token, log: authLog };
}

// 2. Login User with Email & Password
export function loginUser(params: {
  email: string;
  password: string;
  ip?: string;
}): { success: boolean; user?: DBUser; token?: string; error?: string; log?: AuthLog } {
  const db = initDb();
  const normalizedEmail = (params.email || '').trim().toLowerCase();

  const user = db.users.find(u => (u.email || '').toLowerCase() === normalizedEmail);
  if (!user || !user.passwordHash || !user.salt) {
    const failedLog: AuthLog = {
      id: `LOG-${Date.now()}`,
      userName: 'Unknown',
      userEmail: normalizedEmail,
      authProvider: 'email',
      action: 'LOGIN_FAILED',
      ip: params.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
      status: 'FAILED',
      details: 'Login failed: Account not found or invalid credentials.'
    };
    db.authLogs.unshift(failedLog);
    saveDb(db);
    return { success: false, error: 'Invalid email address or password!', log: failedLog };
  }

  const checkHash = hashPassword(params.password, user.salt);
  if (checkHash !== user.passwordHash) {
    const failedLog: AuthLog = {
      id: `LOG-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userEmail: normalizedEmail,
      authProvider: 'email',
      action: 'LOGIN_FAILED',
      ip: params.ip || '127.0.0.1',
      timestamp: new Date().toISOString(),
      status: 'FAILED',
      details: 'Login failed: Incorrect password.'
    };
    db.authLogs.unshift(failedLog);
    saveDb(db);
    return { success: false, error: 'Invalid email address or password!', log: failedLog };
  }

  const token = generateToken(user.id);
  db.sessions[token] = { userId: user.id, createdAt: Date.now() };

  const successLog: AuthLog = {
    id: `LOG-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    authProvider: 'email',
    action: 'LOGIN_SUCCESS',
    ip: params.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    details: 'User authenticated successfully via Email.'
  };

  db.authLogs.unshift(successLog);
  if (db.authLogs.length > 100) db.authLogs = db.authLogs.slice(0, 100);

  saveDb(db);
  return { success: true, user, token, log: successLog };
}

// 3. OAuth Connect / Quick Login
export function oauthLoginUser(params: {
  authProvider: 'google' | 'discord' | 'telegram';
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  ip?: string;
}): { success: boolean; user: DBUser; token: string; log: AuthLog } {
  const db = initDb();
  const normalizedEmail = (params.email || '').trim().toLowerCase();

  let user = db.users.find(u => (u.email || '').toLowerCase() === normalizedEmail);

  if (!user) {
    const userId = generateId('KR');
    const providerStr = (params.authProvider || 'OAUTH').toUpperCase();
    user = {
      id: userId,
      name: params.name || (normalizedEmail ? normalizedEmail.split('@')[0] : 'Typist'),
      email: normalizedEmail,
      bio: params.bio || `${providerStr} connected speed typist.`,
      avatar: params.avatar || 'default',
      authProvider: params.authProvider,
      createdAt: new Date().toLocaleDateString(),
      stats: { ...DEFAULT_STATS }
    };
    db.users.push(user);
  } else {
    // Update auth provider if changed
    user.authProvider = params.authProvider;
    if (params.name) user.name = params.name;
  }

  const token = generateToken(user.id);
  db.sessions[token] = { userId: user.id, createdAt: Date.now() };

  const providerStr = (params.authProvider || 'OAUTH').toUpperCase();
  const authLog: AuthLog = {
    id: `LOG-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    authProvider: params.authProvider,
    action: 'OAUTH_CONNECT',
    ip: params.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    details: `Successfully signed in via ${providerStr}.`
  };

  db.authLogs.unshift(authLog);
  if (db.authLogs.length > 100) db.authLogs = db.authLogs.slice(0, 100);

  saveDb(db);
  return { success: true, user, token, log: authLog };
}

// 4. Validate Token & Get User
export function getUserByToken(token: string): DBUser | null {
  const db = initDb();
  const session = db.sessions[token];
  if (!session) return null;

  const user = db.users.find(u => u.id === session.userId);
  return user || null;
}

// 5. Update User Stats & Profile in Database
export function updateUserStats(userId: string, stats: UserStats, profileUpdates?: Partial<UserProfile>): DBUser | null {
  const db = initDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;

  user.stats = stats;
  if (profileUpdates) {
    if (profileUpdates.name) user.name = profileUpdates.name;
    if (profileUpdates.bio) user.bio = profileUpdates.bio;
    if (profileUpdates.avatar) user.avatar = profileUpdates.avatar;
  }

  saveDb(db);
  return user;
}

// 6. Get Auth Activity Logs
export function getAuthLogs(limit = 30): AuthLog[] {
  const db = initDb();
  return db.authLogs.slice(0, limit);
}

// 7. Get Global Leaderboard Top Typists
export function getLeaderboard(limit = 10) {
  const db = initDb();
  return [...db.users]
    .map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar || 'default',
      bio: u.bio || '',
      authProvider: u.authProvider || 'email',
      maxWpm: u.stats?.maxWpm || 0,
      averageWpm: u.stats?.averageWpm || 0,
      racesCompleted: u.stats?.racesCompleted || 0,
      averageAccuracy: u.stats?.averageAccuracy || 100
    }))
    .sort((a, b) => b.maxWpm - a.maxWpm || b.averageWpm - a.averageWpm)
    .slice(0, limit);
}

// 8. Delete User Account Permanently
export function deleteUserAccount(userId: string): { success: boolean; error?: string; log?: AuthLog } {
  const db = initDb();
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: 'User account not found' };
  }

  const deletedUser = db.users[userIndex];

  // Remove user from users array
  db.users.splice(userIndex, 1);

  // Clear session tokens for this user
  Object.keys(db.sessions).forEach(token => {
    if (db.sessions[token].userId === userId) {
      delete db.sessions[token];
    }
  });

  // Create deletion log entry
  const deletionLog: AuthLog = {
    id: `LOG-${Date.now()}`,
    userId: deletedUser.id,
    userName: deletedUser.name,
    userEmail: deletedUser.email,
    authProvider: deletedUser.authProvider || 'email',
    action: 'ACCOUNT_DELETED',
    ip: '127.0.0.1',
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    details: 'User account and associated session tokens permanently deleted.'
  };

  db.authLogs.unshift(deletionLog);
  if (db.authLogs.length > 100) {
    db.authLogs = db.authLogs.slice(0, 100);
  }

  saveDb(db);
  return { success: true, log: deletionLog };
}
