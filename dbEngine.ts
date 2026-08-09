import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserProfile, UserStats, AuthLog } from './src/types';

export interface DBUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  bio?: string;
  authProvider: string;
  avatar?: string;
  createdAt: string;
  stats: UserStats;
}

export const JWT_SECRET = process.env.JWT_SECRET || 'keyrush_super_secret_jwt_key_2026';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'keyrush.sqlite');

let db: Database | null = null;
let isInitialized = false;

// Save SQLite database to disk
export function saveDbToDisk(): void {
  if (!db) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

// Ensure database is initialized
export async function initDb(): Promise<Database> {
  if (db && isInitialized) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.error('Failed to load existing SQLite database, creating new instance:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Define Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT,
      bio TEXT,
      authProvider TEXT NOT NULL,
      avatar TEXT,
      createdAt TEXT NOT NULL,
      stats TEXT NOT NULL
    );
  `);

  // Define AuthLogs table
  db.run(`
    CREATE TABLE IF NOT EXISTS auth_logs (
      id TEXT PRIMARY KEY,
      userName TEXT NOT NULL,
      action TEXT NOT NULL,
      authProvider TEXT NOT NULL,
      status TEXT NOT NULL,
      ip TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      details TEXT NOT NULL
    );
  `);

  // Seed default typists if database is empty
  const res = db.exec('SELECT COUNT(*) as count FROM users;');
  const userCount = res[0]?.values[0]?.[0] || 0;

  if (userCount === 0) {
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const defaultStats: UserStats = {
      racesCompleted: 42,
      averageWpm: 124,
      maxWpm: 168,
      averageAccuracy: 98,
      recentRaces: [
        { date: '2026-07-22', wpm: 142, accuracy: 99, language: 'uz' },
        { date: '2026-07-21', wpm: 135, accuracy: 98, language: 'en' },
        { date: '2026-07-20', wpm: 128, accuracy: 97, language: 'code' }
      ]
    };

    const benchmarkUsers = [
      {
        id: 'KR-10001',
        name: 'KeyRush Admin',
        email: 'admin@keyrush.io',
        passwordHash: adminPasswordHash,
        bio: 'Official KeyRush Master Typist & Speed Benchmark Record Holder.',
        authProvider: 'email',
        avatar: 'default',
        createdAt: new Date().toLocaleDateString(),
        stats: JSON.stringify(defaultStats)
      },
      {
        id: 'KR-10002',
        name: 'SpeedDemon',
        email: 'speed@keyrush.io',
        passwordHash: adminPasswordHash,
        bio: 'Mechanical keyboard enthusiast. Reached 150+ WPM on custom Lubed switches.',
        authProvider: 'google',
        avatar: '⚡',
        createdAt: '2026-07-21',
        stats: JSON.stringify({ racesCompleted: 88, averageWpm: 138, maxWpm: 154, averageAccuracy: 99, recentRaces: [] })
      },
      {
        id: 'KR-10003',
        name: 'TypeNinja',
        email: 'ninja@keyrush.io',
        passwordHash: adminPasswordHash,
        bio: 'Silent, swift, accurate. Touch-typing since 2018.',
        authProvider: 'discord',
        avatar: '🥷',
        createdAt: '2026-07-20',
        stats: JSON.stringify({ racesCompleted: 64, averageWpm: 128, maxWpm: 142, averageAccuracy: 98, recentRaces: [] })
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, passwordHash, bio, authProvider, avatar, createdAt, stats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of benchmarkUsers) {
      stmt.run([u.id, u.name, u.email, u.passwordHash, u.bio, u.authProvider, u.avatar, u.createdAt, u.stats]);
    }
    stmt.free();

    // Initial AuthLog seeding
    const logStmt = db.prepare(`
      INSERT INTO auth_logs (id, userName, action, authProvider, status, ip, timestamp, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    logStmt.run([
      `LOG-${Date.now()}`,
      'KeyRush Admin',
      'REGISTER',
      'system',
      'SUCCESS',
      '127.0.0.1',
      new Date().toISOString(),
      'SQLite database initialized with Users and AuthLogs tables.'
    ]);
    logStmt.free();
  }

  isInitialized = true;
  saveDbToDisk();
  return db;
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
}

// Generate JWT token
export function generateJwtToken(user: { id: string; email: string; name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Get user by email
export function getUserByEmail(email: string): DBUser | null {
  if (!db) return null;
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1');
  stmt.bind([email.trim()]);
  let user: DBUser | null = null;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    user = {
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      passwordHash: row.passwordHash as string,
      bio: row.bio as string,
      authProvider: row.authProvider as string,
      avatar: row.avatar as string,
      createdAt: row.createdAt as string,
      stats: typeof row.stats === 'string' ? JSON.parse(row.stats) : row.stats
    };
  }
  stmt.free();
  return user;
}

// Get user by ID
export function getUserById(id: string): DBUser | null {
  if (!db) return null;
  const stmt = db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
  stmt.bind([id]);
  let user: DBUser | null = null;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    user = {
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      passwordHash: row.passwordHash as string,
      bio: row.bio as string,
      authProvider: row.authProvider as string,
      avatar: row.avatar as string,
      createdAt: row.createdAt as string,
      stats: typeof row.stats === 'string' ? JSON.parse(row.stats) : row.stats
    };
  }
  stmt.free();
  return user;
}

// Add AuthLog entry
export function addAuthLog(log: {
  id?: string;
  userName: string;
  action: AuthLog['action'];
  authProvider: string;
  status: 'SUCCESS' | 'FAILED';
  ip: string;
  timestamp?: string;
  details: string;
}): AuthLog {
  if (!db) {
    return {
      id: log.id || `LOG-${Date.now()}`,
      userName: log.userName,
      action: log.action,
      authProvider: log.authProvider,
      status: log.status,
      ip: log.ip,
      timestamp: log.timestamp || new Date().toISOString(),
      details: log.details
    };
  }

  const logEntry: AuthLog = {
    id: log.id || `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userName: log.userName || 'Unknown',
    action: log.action,
    authProvider: log.authProvider || 'email',
    status: log.status,
    ip: log.ip || '127.0.0.1',
    timestamp: log.timestamp || new Date().toISOString(),
    details: log.details
  };

  const stmt = db.prepare(`
    INSERT INTO auth_logs (id, userName, action, authProvider, status, ip, timestamp, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    logEntry.id,
    logEntry.userName,
    logEntry.action,
    logEntry.authProvider,
    logEntry.status,
    logEntry.ip,
    logEntry.timestamp,
    logEntry.details
  ]);
  stmt.free();

  saveDbToDisk();
  return logEntry;
}

// Get AuthLogs (last N entries)
export function getAuthLogs(limit = 50): AuthLog[] {
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM auth_logs ORDER BY timestamp DESC LIMIT ?');
  stmt.bind([limit]);
  const logs: AuthLog[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    logs.push({
      id: row.id as string,
      userName: row.userName as string,
      action: row.action as AuthLog['action'],
      authProvider: row.authProvider as string,
      status: row.status as 'SUCCESS' | 'FAILED',
      ip: row.ip as string,
      timestamp: row.timestamp as string,
      details: row.details as string
    });
  }
  stmt.free();
  return logs;
}

// 1. Register User Method
export function registerUser(params: {
  name: string;
  email: string;
  password?: string;
  bio?: string;
  avatar?: string;
  ip?: string;
}): { success: boolean; user?: DBUser; token?: string; error?: string; log?: AuthLog } {
  if (!db) initDb();
  const normalizedEmail = (params.email || '').trim().toLowerCase();

  const existing = getUserByEmail(normalizedEmail);
  if (existing) {
    const failedLog = addAuthLog({
      userName: params.name || 'Unknown',
      action: 'REGISTER',
      authProvider: 'email',
      status: 'FAILED',
      ip: params.ip || '127.0.0.1',
      details: `Registration failed: Email '${normalizedEmail}' already registered.`
    });
    return { success: false, error: 'User with this email already exists!', log: failedLog };
  }

  const passwordHash = params.password ? bcrypt.hashSync(params.password, 10) : undefined;
  const userId = generateId('KR');
  const defaultStats: UserStats = {
    racesCompleted: 0,
    averageWpm: 0,
    maxWpm: 0,
    averageAccuracy: 100,
    recentRaces: []
  };

  const newUser: DBUser = {
    id: userId,
    name: (params.name || '').trim() || 'Anonymous Typist',
    email: normalizedEmail,
    passwordHash,
    bio: params.bio?.trim() || 'Excited speed typist on KeyRush Engine!',
    avatar: params.avatar || 'default',
    authProvider: 'email',
    createdAt: new Date().toLocaleDateString(),
    stats: defaultStats
  };

  const stmt = db!.prepare(`
    INSERT INTO users (id, name, email, passwordHash, bio, authProvider, avatar, createdAt, stats)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    newUser.id,
    newUser.name,
    newUser.email,
    newUser.passwordHash || '',
    newUser.bio || '',
    newUser.authProvider,
    newUser.avatar || 'default',
    newUser.createdAt,
    JSON.stringify(newUser.stats)
  ]);
  stmt.free();

  const token = generateJwtToken({ id: newUser.id, email: newUser.email, name: newUser.name });

  const successLog = addAuthLog({
    userName: newUser.name,
    action: 'REGISTER',
    authProvider: 'email',
    status: 'SUCCESS',
    ip: params.ip || '127.0.0.1',
    details: 'New account registered successfully in SQLite database.'
  });

  saveDbToDisk();
  return { success: true, user: newUser, token, log: successLog };
}

// 2. Login User Method
export function loginUser(params: {
  email: string;
  password: string;
  ip?: string;
}): { success: boolean; user?: DBUser; token?: string; error?: string; log?: AuthLog } {
  if (!db) initDb();
  const normalizedEmail = (params.email || '').trim().toLowerCase();

  const user = getUserByEmail(normalizedEmail);
  if (!user || !user.passwordHash) {
    const failedLog = addAuthLog({
      userName: 'Unknown',
      action: 'LOGIN_FAILED',
      authProvider: 'email',
      status: 'FAILED',
      ip: params.ip || '127.0.0.1',
      details: `Login failed: Account '${normalizedEmail}' not found.`
    });
    return { success: false, error: 'Invalid email address or password!', log: failedLog };
  }

  const isValidPassword = bcrypt.compareSync(params.password, user.passwordHash);
  if (!isValidPassword) {
    const failedLog = addAuthLog({
      userName: user.name,
      action: 'LOGIN_FAILED',
      authProvider: 'email',
      status: 'FAILED',
      ip: params.ip || '127.0.0.1',
      details: 'Login failed: Incorrect password provided.'
    });
    return { success: false, error: 'Invalid email address or password!', log: failedLog };
  }

  const token = generateJwtToken({ id: user.id, email: user.email, name: user.name });

  const successLog = addAuthLog({
    userName: user.name,
    action: 'LOGIN_SUCCESS',
    authProvider: 'email',
    status: 'SUCCESS',
    ip: params.ip || '127.0.0.1',
    details: 'User logged in successfully.'
  });

  return { success: true, user, token, log: successLog };
}

// 3. OAuth Connect / Login Method
export function oauthLoginUser(params: {
  authProvider: string;
  email?: string;
  name?: string;
  bio?: string;
  avatar?: string;
  ip?: string;
}): { success: boolean; user?: DBUser; token?: string; error?: string; log?: AuthLog } {
  if (!db) initDb();
  const provider = params.authProvider || 'google';
  const email = (params.email || `${provider}_user_${Date.now()}@keyrush.io`).trim().toLowerCase();
  const name = (params.name || `${provider.toUpperCase()} Typist`).trim();

  let user = getUserByEmail(email);

  if (!user) {
    const userId = generateId('KR');
    const defaultStats: UserStats = {
      racesCompleted: 0,
      averageWpm: 0,
      maxWpm: 0,
      averageAccuracy: 100,
      recentRaces: []
    };

    user = {
      id: userId,
      name,
      email,
      bio: params.bio || `Connected via ${provider.toUpperCase()}`,
      avatar: params.avatar || (provider === 'google' ? '⚡' : provider === 'discord' ? '🥷' : '🤖'),
      authProvider: provider,
      createdAt: new Date().toLocaleDateString(),
      stats: defaultStats
    };

    const stmt = db!.prepare(`
      INSERT INTO users (id, name, email, passwordHash, bio, authProvider, avatar, createdAt, stats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      user.id,
      user.name,
      user.email,
      '',
      user.bio || '',
      user.authProvider,
      user.avatar || 'default',
      user.createdAt,
      JSON.stringify(user.stats)
    ]);
    stmt.free();
  }

  const token = generateJwtToken({ id: user.id, email: user.email, name: user.name });

  const log = addAuthLog({
    userName: user.name,
    action: 'OAUTH_CONNECT',
    authProvider: provider,
    status: 'SUCCESS',
    ip: params.ip || '127.0.0.1',
    details: `Successfully authenticated via ${provider.toUpperCase()}.`
  });

  saveDbToDisk();
  return { success: true, user, token, log };
}

// Get user profile by JWT token
export function getUserByToken(token: string): DBUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    if (decoded?.id) {
      return getUserById(decoded.id);
    }
  } catch {
    // Invalid or expired token
  }
  return null;
}

// Update User Stats and profile information
export function updateUserStats(
  userId: string,
  statsData?: Partial<UserStats>,
  profileData?: { name?: string; bio?: string; avatar?: string }
): DBUser | null {
  if (!db) return null;
  const user = getUserById(userId);
  if (!user) return null;

  const currentStats = user.stats || {
    racesCompleted: 0,
    averageWpm: 0,
    maxWpm: 0,
    averageAccuracy: 100,
    recentRaces: []
  };

  const updatedStats: UserStats = statsData ? {
    ...currentStats,
    ...statsData,
    recentRaces: statsData.recentRaces || currentStats.recentRaces || []
  } : currentStats;

  const name = profileData?.name || user.name;
  const bio = profileData?.bio !== undefined ? profileData.bio : user.bio;
  const avatar = profileData?.avatar || user.avatar;

  const stmt = db.prepare('UPDATE users SET stats = ?, name = ?, bio = ?, avatar = ? WHERE id = ?');
  stmt.run([JSON.stringify(updatedStats), name, bio || '', avatar || 'default', userId]);
  stmt.free();

  saveDbToDisk();
  return getUserById(userId);
}

// Get Leaderboard rankings
export function getLeaderboard(limit = 50): DBUser[] {
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM users LIMIT ?');
  stmt.bind([limit]);
  const users: DBUser[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    users.push({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      bio: row.bio as string,
      authProvider: row.authProvider as string,
      avatar: row.avatar as string,
      createdAt: row.createdAt as string,
      stats: typeof row.stats === 'string' ? JSON.parse(row.stats) : row.stats
    });
  }
  stmt.free();

  // Sort by average WPM descending
  return users.sort((a, b) => (b.stats?.averageWpm || 0) - (a.stats?.averageWpm || 0));
}

// Delete user account
export function deleteUserAccount(
  userId: string,
  ip = '127.0.0.1'
): { success: boolean; log?: AuthLog; error?: string } {
  if (!db) return { success: false, error: 'Database not initialized' };
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'User record not found' };

  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run([userId]);
  stmt.free();

  const log = addAuthLog({
    userName: user.name,
    action: 'ACCOUNT_DELETED',
    authProvider: user.authProvider,
    status: 'SUCCESS',
    ip,
    details: `User account '${user.email}' was permanently deleted.`
  });

  saveDbToDisk();
  return { success: true, log };
}
