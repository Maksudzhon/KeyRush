import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { Player, Room } from "./src/types";
import { getRandomText } from "./src/data/texts";
import { 
  initDb, 
  registerUser, 
  loginUser, 
  oauthLoginUser, 
  getUserByToken, 
  updateUserStats, 
  getAuthLogs,
  getLeaderboard,
  deleteUserAccount
} from "./src/server/dbEngine";

dotenv.config();

// Initialize Database on Startup
initDb();

const app = express();
const PORT = 3000;

// Setup Gemini Client lazily to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error("Gemini initialization failed:", err);
      }
    }
  }
  return aiClient;
}

app.use(express.json());

// Broadcast helper for Real-Time Auth Logs to WebSockets
function broadcastAuthLog(log: any) {
  const messageStr = JSON.stringify({ type: "auth_log_event", log });
  wss.clients.forEach((clientWs) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(messageStr);
    }
  });
}

// API Routes
// 1. Live health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Real Database Auth Routes
// A. Register User
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, bio, avatar } = req.body || {};
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Name, email, and password are required!" });
  }

  const result = registerUser({ name, email, password, bio, avatar, ip });
  if (!result.success) {
    if (result.log) broadcastAuthLog(result.log);
    return res.status(400).json({ success: false, error: result.error });
  }

  if (result.log) broadcastAuthLog(result.log);
  res.json({ success: true, user: result.user, token: result.token, log: result.log });
});

// B. Login User
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required!" });
  }

  const result = loginUser({ email, password, ip });
  if (!result.success) {
    if (result.log) broadcastAuthLog(result.log);
    return res.status(400).json({ success: false, error: result.error });
  }

  if (result.log) broadcastAuthLog(result.log);
  res.json({ success: true, user: result.user, token: result.token, log: result.log });
});

// C. OAuth / Quick Connect
app.post("/api/auth/oauth", (req, res) => {
  const { authProvider, email, name, avatar, bio } = req.body || {};
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

  if (!email || !authProvider) {
    return res.status(400).json({ success: false, error: "Provider and email are required!" });
  }

  const result = oauthLoginUser({ authProvider, email, name, avatar, bio, ip });
  if (result.log) broadcastAuthLog(result.log);
  res.json({ success: true, user: result.user, token: result.token, log: result.log });
});

// D. Get Current Authenticated Profile
app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  if (!token) {
    return res.status(401).json({ success: false, error: "Unauthorized: Token missing" });
  }

  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid or expired token" });
  }

  res.json({ success: true, user });
});

// E. Get Real-Time Database Authentication Logs
app.get("/api/auth/logs", (req, res) => {
  const logs = getAuthLogs(50);
  res.json({ success: true, logs });
});

// F. Save / Update User Stats in Database
app.post("/api/user/stats", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const { stats, name, bio, avatar, userId } = req.body || {};

  let user = token ? getUserByToken(token) : null;
  const targetUserId = user ? user.id : userId;

  if (!targetUserId) {
    return res.status(400).json({ success: false, error: "User ID or Authorization token required" });
  }

  const updatedUser = updateUserStats(targetUserId, stats, { name, bio, avatar });
  if (!updatedUser) {
    return res.status(404).json({ success: false, error: "User record not found in database" });
  }

  res.json({ success: true, user: updatedUser });
});

// G. Get Global Leaderboard Standings
app.get("/api/leaderboard", (req, res) => {
  const leaderboard = getLeaderboard(10);
  res.json({ success: true, leaderboard });
});

// H. Delete User Account Permanently
app.delete("/api/user", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const { userId } = req.body || {};

  let targetUserId: string | null = null;
  if (token) {
    const user = getUserByToken(token);
    if (user) targetUserId = user.id;
  }
  if (!targetUserId && userId) {
    targetUserId = userId;
  }

  if (!targetUserId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Token or User ID missing" });
  }

  const result = deleteUserAccount(targetUserId);
  if (!result.success) {
    return res.status(404).json({ success: false, error: result.error || "User account not found" });
  }

  if (result.log) {
    broadcastAuthLog(result.log);
  }

  res.json({ success: true, message: "Account deleted successfully" });
});

// 2. Custom AI text generation via Gemini
app.get("/api/generate-text", async (req, res) => {
  const theme = (req.query.theme as string) || "kompyuter texnologiyalari";
  const lang = (req.query.lang as string) || "uz";
  const diff = (req.query.diff as string) || "medium";

  // Define language names for prompt
  const langNames: Record<string, string> = {
    uz: "O'zbek tilida (lotin alifbosida)",
    en: "English language",
    ru: "Russian language"
  };

  const selectedLang = langNames[lang] || langNames.uz;

  const client = getGeminiClient();
  if (!client) {
    // Graceful fallback to static text bank
    console.log("Gemini API key is not set or invalid, falling back to static texts");
    const fallback = getRandomText(lang === "code" ? "en" : lang, diff);
    return res.json({
      text: fallback.text,
      theme: fallback.category || "General",
      isAiGenerated: false,
      message: "API key yo'qligi sababli tayyor matn tanlandi"
    });
  }

  try {
    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Mavzu: "${theme}". Qiyinchilik darajasi: "${diff}". Iltimos, ushbu mavzu va darajaga mos keluvchi, aynan ${selectedLang} yozilgan, klaviaturada yozishni mashq qilish uchun matn generatsiya qiling.
Talablar:
1. Matn aniq 120 tadan 220 tagacha belgi (simvol)dan iborat bo'lsin.
2. Hech qanday qo'shtirnoq, markdown formatlash, tushuntirishlar yoki ortiqcha belgi bo'lmasin. Faqat matnning o'zi qaytsin.
3. Imloviy jihatdan mukammal va yozish uchun qiziqarli bo'lsin.`,
    });

    const text = response.text?.trim() || "";
    if (text.length < 30) {
      throw new Error("Generatsiya qilingan matn juda qisqa");
    }

    res.json({
      text,
      theme,
      isAiGenerated: true
    });
  } catch (error: any) {
    console.error("Gemini text generation error:", error);
    const fallback = getRandomText(lang === "code" ? "en" : lang, diff);
    res.json({
      text: fallback.text,
      theme: fallback.category || "General",
      isAiGenerated: false,
      error: error.message || "Xatolik yuz berdi"
    });
  }
});

// 3. Expose active public multiplayer rooms
app.get("/api/active-rooms", (req, res) => {
  const activeRoomsList = Array.from(rooms.values()).map(r => ({
    id: r.id,
    language: r.language,
    difficulty: r.difficulty,
    playersCount: r.players.length,
    players: r.players.map(p => ({ name: p.name, color: p.color })),
    status: r.status
  }));
  res.json(activeRoomsList);
});

// Create HTTP Server
const server = http.createServer(app);

// WebSocket Server attached to same server
const wss = new WebSocketServer({ noServer: true });

// Store active rooms and active client ws mappings
const rooms = new Map<string, Room>();
const clients = new Map<WebSocket, { playerId: string; roomId: string; joinTime: number }>();

// Generate unique room ID
function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KR-${result}`;
}

// Keep-alive connection ping
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, 30000);

wss.on("close", () => {
  clearInterval(interval);
});

// Handle WebSocket logic
wss.on("connection", (ws: WebSocket) => {
  console.log("Yangi o'yinchi bog'landi");

  ws.on("message", (message: string) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case "join": {
          const { roomId: requestedRoomId, name, color, language, difficulty, customText } = data;
          let roomId = requestedRoomId;
          let targetRoom: Room | undefined;

          // Find or create public room
          if (roomId === "public") {
            const activeRooms = Array.from(rooms.values()).filter(
              r => r.status === "waiting" && r.players.length < 5 && r.language === (language || "all")
            );
            if (activeRooms.length > 0) {
              targetRoom = activeRooms[0];
              roomId = targetRoom.id;
            } else {
              roomId = generateRoomId();
            }
          }

          const playerId = `P-${Math.random().toString(36).substr(2, 9)}`;

          if (!targetRoom) {
            targetRoom = rooms.get(roomId);
          }

          // If room doesn't exist, create it
          if (!targetRoom) {
            const textToUse = customText || getRandomText(language || "uz", difficulty || "medium").text;
            targetRoom = {
              id: roomId,
              text: textToUse,
              language: language || "uz",
              difficulty: difficulty || "medium",
              players: [],
              status: "waiting",
              countdown: 10,
              createdAt: Date.now()
            };
            rooms.set(roomId, targetRoom);
          }

          // Create new player entry
          const newPlayer: Player = {
            id: playerId,
            name: name || `Mehmon-${Math.floor(Math.random() * 900 + 100)}`,
            progress: 0,
            errorsCount: 0,
            wpm: 0,
            accuracy: 100,
            completed: false,
            color: color || "#3B82F6"
          };

          // Anti-cheat verification property
          targetRoom.players.push(newPlayer);
          clients.set(ws, { playerId, roomId, joinTime: Date.now() });

          console.log(`Player ${newPlayer.name} joined room ${roomId}`);

          // Send initialization data to the client
          ws.send(JSON.stringify({
            type: "init",
            roomId,
            text: targetRoom.text,
            players: targetRoom.players,
            selfId: playerId,
            status: targetRoom.status,
            countdown: targetRoom.countdown
          }));

          // Broadcast to everyone in the room
          broadcastToRoom(roomId, {
            type: "players_update",
            players: targetRoom.players
          });

          // In public rooms, auto-trigger countdown if we reach 2+ players
          if (targetRoom.players.length >= 2 && targetRoom.status === "waiting") {
            startCountdown(targetRoom);
          }
          break;
        }

        case "progress": {
          const clientInfo = clients.get(ws);
          if (!clientInfo) return;

          const { roomId, playerId, joinTime } = clientInfo;
          const room = rooms.get(roomId);
          if (!room || room.status === "waiting") return;

          const { progress, errorsCount, wpm, accuracy, completed } = data;
          const player = room.players.find(p => p.id === playerId);
          if (!player) return;

          // --- Server-side Keystroke & Speed Anti-Cheat Validation ---
          const elapsedSeconds = (Date.now() - joinTime) / 1000;
          let isCheating = false;

          // Check for sudden jumps in typing progress
          const charsTyped = progress;
          const calculatedWpm = charsTyped > 0 ? Math.round((charsTyped / 5) / (elapsedSeconds / 60)) : 0;

          // WPM limit (e.g. 260 WPM is extraordinarily rare, anything over 290 WPM is extremely suspicious for standard texts)
          if (calculatedWpm > 280 && charsTyped > 20) {
            isCheating = true;
            console.warn(`Anti-Cheat: Foydalanuvchi ${player.name} cheater deb gumonlandi! (WPM: ${calculatedWpm})`);
          }

          // Apply and update stats
          player.progress = progress;
          player.errorsCount = errorsCount;
          // If suspect cheating, flag them by altering their WPM display or appending a warning
          if (isCheating) {
            player.wpm = Math.min(wpm, 60); // Cap their displayed WPM
            player.name = player.name.includes("⚠️ BOT") ? player.name : `${player.name} ⚠️ BOT`;
          } else {
            player.wpm = wpm;
          }
          player.accuracy = accuracy;
          player.completed = completed;

          // Broadcast progress
          broadcastToRoom(roomId, {
            type: "progress_update",
            players: room.players
          });

          // Check if all players finished
          const allFinished = room.players.every(p => p.completed);
          if (allFinished && room.status === "racing") {
            room.status = "finished";
            broadcastToRoom(roomId, {
              type: "race_finished",
              players: room.players
            });
          }
          break;
        }

        case "start_race": {
          const clientInfo = clients.get(ws);
          if (!clientInfo) return;

          const { roomId } = clientInfo;
          const room = rooms.get(roomId);
          if (room && room.status === "waiting") {
            startCountdown(room, 5); // Fast 5-second countdown
          }
          break;
        }

        case "chat": {
          const clientInfo = clients.get(ws);
          if (!clientInfo) return;

          const { roomId, playerId } = clientInfo;
          const room = rooms.get(roomId);
          if (!room) return;

          const player = room.players.find(p => p.id === playerId);
          if (!player) return;

          broadcastToRoom(roomId, {
            type: "chat_message",
            playerId,
            sender: player.name,
            color: player.color,
            message: data.message
          });
          break;
        }
      }
    } catch (err) {
      console.error("WebSocket xabarini qayta ishlashda xatolik:", err);
    }
  });

  ws.on("close", () => {
    console.log("O'yinchi aloqani uzdi");
    handleDisconnect(ws);
  });

  ws.on("error", (err) => {
    console.error("WS client error:", err);
    handleDisconnect(ws);
  });
});

// Broadcast helper
function broadcastToRoom(roomId: string, payload: any) {
  const messageStr = JSON.stringify(payload);
  clients.forEach((info, clientWs) => {
    if (info.roomId === roomId && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(messageStr);
    }
  });
}

// Start room countdown
function startCountdown(room: Room, customSeconds?: number) {
  if (room.status !== "waiting") return;
  room.status = "countdown";
  room.countdown = customSeconds !== undefined ? customSeconds : 10;

  broadcastToRoom(room.id, {
    type: "countdown",
    seconds: room.countdown,
    status: "countdown"
  });

  const countdownInterval = setInterval(() => {
    const currentRoom = rooms.get(room.id);
    if (!currentRoom || currentRoom.status !== "countdown") {
      clearInterval(countdownInterval);
      return;
    }

    currentRoom.countdown--;

    if (currentRoom.countdown <= 0) {
      clearInterval(countdownInterval);
      currentRoom.status = "racing";
      
      // Update join/start typing time for players to compute anti-cheat WPM accurately
      clients.forEach((info, clientWs) => {
        if (info.roomId === room.id) {
          info.joinTime = Date.now(); // Reset start time to now
        }
      });

      broadcastToRoom(room.id, {
        type: "start_race",
        status: "racing"
      });
    } else {
      broadcastToRoom(room.id, {
        type: "countdown",
        seconds: currentRoom.countdown,
        status: "countdown"
      });
    }
  }, 1000);
}

// Handle client disconnect cleanup
function handleDisconnect(ws: WebSocket) {
  const clientInfo = clients.get(ws);
  if (!clientInfo) return;

  const { playerId, roomId } = clientInfo;
  clients.delete(ws);

  const room = rooms.get(roomId);
  if (room) {
    // Remove player
    room.players = room.players.filter(p => p.id !== playerId);
    console.log(`Removed player ${playerId} from room ${roomId}`);

    if (room.players.length === 0) {
      rooms.delete(roomId);
      console.log(`Deleted empty room ${roomId}`);
    } else {
      broadcastToRoom(roomId, {
        type: "players_update",
        players: room.players
      });

      // If everyone remaining has completed the race, finish it
      if (room.status === "racing" && room.players.every(p => p.completed)) {
        room.status = "finished";
        broadcastToRoom(roomId, {
          type: "race_finished",
          players: room.players
        });
      }
    }
  }
}

// Upgrade handling for WebSockets
server.on("upgrade", (request, socket, head) => {
  try {
    const pathname = new URL(request.url || "", `http://${request.headers.host || "localhost"}`).pathname;
    if (pathname === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      // Allow other middleware or close gracefully without abrupt reset error
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    }
  } catch (err) {
    socket.destroy();
  }
});

// Vite middleware integration for full-stack build
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server http://localhost:${PORT} portida muvaffaqiyatli ishga tushdi.`);
  });
}

startApp();
