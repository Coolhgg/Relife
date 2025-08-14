// Enhanced API worker for Relife Alarms with Battle System
// This runs on Cloudflare Workers at the edge

// Import types from the main application
interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  experience: number;
  createdAt: string;
}

interface Alarm {
  id: string;
  userId: string;
  time: string;
  label: string;
  enabled: boolean;
  days: number[];
  voiceMood: string;
  sound: string;
  difficulty: string;
  battleId?: string;
  createdAt: string;
}

interface Battle {
  id: string;
  type: string;
  participants: BattleParticipant[];
  creatorId: string;
  status: string;
  startTime: string;
  endTime: string;
  settings: BattleSettings;
  winner?: string;
  maxParticipants?: number;
  entryFee?: number;
  createdAt: string;
}

interface BattleParticipant {
  userId: string;
  joinedAt: string;
  status: string;
  score: number;
  wakeTime: string | null;
  completedTasks: string[];
}

interface BattleSettings {
  wakeWindow: number;
  allowSnooze: boolean;
  maxSnoozes: number;
  difficulty: string;
  weatherBonus: boolean;
  taskChallenge: boolean;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  participants: any[];
  maxParticipants: number;
  entryFee: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

// Mock data - in production, you'd use a database like D1 or KV
const mockUsers: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    username: "alice_wake",
    displayName: "Alice Johnson",
    avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=alice",
    level: 5,
    experience: 1250,
    createdAt: "2024-01-01"
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    username: "bob_early",
    displayName: "Bob Smith",
    avatar: "https://api.dicebear.com/7.x/avatars/svg?seed=bob",
    level: 3,
    experience: 750,
    createdAt: "2024-01-02"
  },
];

const mockAlarms: Alarm[] = [
  {
    id: "alarm_1",
    userId: "1",
    time: "07:00",
    label: "Morning Workout",
    enabled: true,
    days: [1, 2, 3, 4, 5],
    voiceMood: "drill-sergeant",
    sound: "default",
    difficulty: "medium",
    battleId: "battle_1",
    createdAt: "2024-01-01"
  },
];

const mockBattles: Battle[] = [
  {
    id: "battle_1",
    type: "speed",
    participants: [
      {
        userId: "1",
        joinedAt: "2024-01-01T08:00:00Z",
        status: "joined",
        score: 0,
        wakeTime: null,
        completedTasks: []
      }
    ],
    creatorId: "1",
    status: "registration",
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    settings: {
      wakeWindow: 30,
      allowSnooze: false,
      maxSnoozes: 0,
      difficulty: "medium",
      weatherBonus: false,
      taskChallenge: false
    },
    maxParticipants: 10,
    entryFee: 50,
    createdAt: "2024-01-01"
  }
];

const mockTournaments: Tournament[] = [
  {
    id: "tournament_1",
    name: "Weekly Wake Challenge",
    description: "Who can wake up most consistently this week?",
    type: "round-robin",
    status: "registration",
    participants: [],
    maxParticipants: 16,
    entryFee: 100,
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: "2024-01-01"
  }
];

// Helper function for CORS headers
function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

// Main worker handler
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const origin = request.headers.get("Origin") || "*";
    
    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    
    // Router - match paths and methods
    try {
      // GET /api/health - Health check endpoint
      if (url.pathname === "/api/health" && method === "GET") {
        return Response.json(
          { 
            status: "healthy", 
            timestamp: new Date().toISOString(),
            version: "1.0.0"
          },
          { headers: corsHeaders(origin) }
        );
      }
      
      // GET /api/users - List all users with battle stats
      if (url.pathname === "/api/users" && method === "GET") {
        const enhancedUsers = mockUsers.map(user => ({
          ...user,
          battlesWon: mockBattles.filter(b => b.winner === user.id).length,
          totalBattles: mockBattles.filter(b => b.participants.some(p => p.userId === user.id)).length
        }));
        
        return Response.json(
          { users: enhancedUsers },
          { headers: corsHeaders(origin) }
        );
      }
      
      // GET /api/users/:id - Get specific user
      const userMatch = url.pathname.match(/^\/api\/users\/(\d+)$/);
      if (userMatch && method === "GET") {
        const userId = userMatch[1];
        const user = mockUsers.find(u => u.id === userId);
        
        if (!user) {
          return Response.json(
            { error: "User not found" },
            { status: 404, headers: corsHeaders(origin) }
          );
        }
        
        return Response.json(
          { user },
          { headers: corsHeaders(origin) }
        );
      }
      
      // POST /api/users - Create new user
      if (url.pathname === "/api/users" && method === "POST") {
        const body = await request.json() as Partial<User>;
        
        // Validate input
        if (!body.name || !body.email) {
          return Response.json(
            { error: "Name and email are required" },
            { status: 400, headers: corsHeaders(origin) }
          );
        }
        
        const newUser: User = {
          id: String(mockUsers.length + 1),
          name: body.name,
          email: body.email,
          createdAt: new Date().toISOString(),
        };
        
        // In production, you'd save to database here
        mockUsers.push(newUser);
        
        return Response.json(
          { user: newUser },
          { status: 201, headers: corsHeaders(origin) }
        );
      }
      
      // GET /api/alarms - List alarms with optional filtering
      if (url.pathname === "/api/alarms" && method === "GET") {
        const userId = url.searchParams.get("userId");
        const enabled = url.searchParams.get("enabled");
        const withBattles = url.searchParams.get("withBattles");
        
        let filteredAlarms = mockAlarms;
        
        if (userId) {
          filteredAlarms = filteredAlarms.filter(a => a.userId === userId);
        }
        
        if (enabled !== null) {
          filteredAlarms = filteredAlarms.filter(a => a.enabled === (enabled === "true"));
        }
        
        if (withBattles === "true") {
          filteredAlarms = filteredAlarms.filter(a => a.battleId);
        }
        
        return Response.json(
          { alarms: filteredAlarms },
          { headers: corsHeaders(origin) }
        );
      }
      
      // POST /api/alarms - Create new alarm
      if (url.pathname === "/api/alarms" && method === "POST") {
        const body = await request.json() as Partial<Alarm>;
        
        // Validate input
        if (!body.userId || !body.time || !body.label) {
          return Response.json(
            { error: "UserId, time, and label are required" },
            { status: 400, headers: corsHeaders(origin) }
          );
        }
        
        const newAlarm: Alarm = {
          id: `alarm_${Date.now()}`,
          userId: body.userId,
          time: body.time,
          label: body.label,
          enabled: body.enabled ?? true,
          days: body.days ?? [1, 2, 3, 4, 5, 6, 0],
          voiceMood: body.voiceMood ?? "motivational",
          sound: body.sound ?? "default",
          difficulty: body.difficulty ?? "medium",
          battleId: body.battleId,
          createdAt: new Date().toISOString(),
        };
        
        mockAlarms.push(newAlarm);
        
        return Response.json(
          { alarm: newAlarm },
          { status: 201, headers: corsHeaders(origin) }
        );
      }
      
      // GET /api/battles - List battles with optional filtering
      if (url.pathname === "/api/battles" && method === "GET") {
        const type = url.searchParams.get("type");
        const status = url.searchParams.get("status");
        const userId = url.searchParams.get("userId");
        
        let filteredBattles = mockBattles;
        
        if (type) {
          filteredBattles = filteredBattles.filter(b => b.type === type);
        }
        
        if (status) {
          filteredBattles = filteredBattles.filter(b => b.status === status);
        }
        
        if (userId) {
          filteredBattles = filteredBattles.filter(b => 
            b.creatorId === userId || b.participants.some(p => p.userId === userId)
          );
        }
        
        return Response.json(
          { battles: filteredBattles },
          { headers: corsHeaders(origin) }
        );
      }
      
      // POST /api/battles - Create new battle
      if (url.pathname === "/api/battles" && method === "POST") {
        const body = await request.json() as Partial<Battle>;
        
        // Validate input
        if (!body.type || !body.creatorId || !body.startTime || !body.endTime) {
          return Response.json(
            { error: "Type, creatorId, startTime, and endTime are required" },
            { status: 400, headers: corsHeaders(origin) }
          );
        }
        
        const newBattle: Battle = {
          id: `battle_${Date.now()}`,
          type: body.type,
          participants: [],
          creatorId: body.creatorId,
          status: "registration",
          startTime: body.startTime,
          endTime: body.endTime,
          settings: body.settings ?? {
            wakeWindow: 30,
            allowSnooze: false,
            maxSnoozes: 0,
            difficulty: "medium",
            weatherBonus: false,
            taskChallenge: false
          },
          maxParticipants: body.maxParticipants,
          entryFee: body.entryFee,
          createdAt: new Date().toISOString(),
        };
        
        mockBattles.push(newBattle);
        
        return Response.json(
          { battle: newBattle },
          { status: 201, headers: corsHeaders(origin) }
        );
      }
      
      // GET /api/battles/:id - Get specific battle
      const battleMatch = url.pathname.match(/^\/api\/battles\/([^/]+)$/);
      if (battleMatch && method === "GET") {
        const battleId = battleMatch[1];
        const battle = mockBattles.find(b => b.id === battleId);
        
        if (!battle) {
          return Response.json(
            { error: "Battle not found" },
            { status: 404, headers: corsHeaders(origin) }
          );
        }
        
        return Response.json(
          { battle },
          { headers: corsHeaders(origin) }
        );
      }
      
      // POST /api/battles/:id/join - Join battle
      const joinBattleMatch = url.pathname.match(/^\/api\/battles\/([^/]+)\/join$/);
      if (joinBattleMatch && method === "POST") {
        const battleId = joinBattleMatch[1];
        const body = await request.json() as { userId: string };
        
        const battle = mockBattles.find(b => b.id === battleId);
        
        if (!battle) {
          return Response.json(
            { error: "Battle not found" },
            { status: 404, headers: corsHeaders(origin) }
          );
        }
        
        if (battle.status !== "registration") {
          return Response.json(
            { error: "Battle registration is closed" },
            { status: 400, headers: corsHeaders(origin) }
          );
        }
        
        if (battle.maxParticipants && battle.participants.length >= battle.maxParticipants) {
          return Response.json(
            { error: "Battle is full" },
            { status: 400, headers: corsHeaders(origin) }
          );
        }
        
        const isAlreadyParticipant = battle.participants.some(p => p.userId === body.userId);
        if (isAlreadyParticipant) {
          return Response.json(
            { error: "User already in battle" },
            { status: 400, headers: corsHeaders(origin) }
          );
        }
        
        const participant: BattleParticipant = {
          userId: body.userId,
          joinedAt: new Date().toISOString(),
          status: "joined",
          score: 0,
          wakeTime: null,
          completedTasks: []
        };
        
        battle.participants.push(participant);
        
        return Response.json(
          { success: true, battle },
          { headers: corsHeaders(origin) }
        );
      }
      
      // GET /api/tournaments - List tournaments
      if (url.pathname === "/api/tournaments" && method === "GET") {
        const status = url.searchParams.get("status");
        
        let filteredTournaments = mockTournaments;
        
        if (status) {
          filteredTournaments = filteredTournaments.filter(t => t.status === status);
        }
        
        return Response.json(
          { tournaments: filteredTournaments },
          { headers: corsHeaders(origin) }
        );
      }
      
      // POST /api/battles/:id/wake - Record wake up time
      const wakeMatch = url.pathname.match(/^\/api\/battles\/([^/]+)\/wake$/);
      if (wakeMatch && method === "POST") {
        const battleId = wakeMatch[1];
        const body = await request.json() as { userId: string; wakeTime: string };
        
        const battle = mockBattles.find(b => b.id === battleId);
        
        if (!battle) {
          return Response.json(
            { error: "Battle not found" },
            { status: 404, headers: corsHeaders(origin) }
          );
        }
        
        const participant = battle.participants.find(p => p.userId === body.userId);
        if (!participant) {
          return Response.json(
            { error: "User not in battle" },
            { status: 404, headers: corsHeaders(origin) }
          );
        }
        
        participant.wakeTime = body.wakeTime;
        
        // Calculate score based on wake time
        const targetTime = new Date(battle.startTime);
        const actualWakeTime = new Date(body.wakeTime);
        const diffMinutes = Math.abs((actualWakeTime.getTime() - targetTime.getTime()) / 60000);
        participant.score = Math.max(0, 100 - diffMinutes);
        
        return Response.json(
          { success: true, score: participant.score },
          { headers: corsHeaders(origin) }
        );
      }
      
      // GET /api/users/:id/stats - Get user battle statistics
      const userStatsMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/stats$/);
      if (userStatsMatch && method === "GET") {
        const userId = userStatsMatch[1];
        
        const userBattles = mockBattles.filter(b => 
          b.participants.some(p => p.userId === userId) && b.status === "completed"
        );
        
        const wins = mockBattles.filter(b => b.winner === userId).length;
        const totalBattles = userBattles.length;
        const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;
        
        const stats = {
          totalBattles,
          wins,
          losses: totalBattles - wins,
          winRate: Math.round(winRate),
          averageScore: 0, // Would calculate from participant scores
          currentStreak: 0, // Would track current win streak
          longestStreak: 0 // Would track longest win streak
        };
        
        return Response.json(
          { stats },
          { headers: corsHeaders(origin) }
        );
      }
      
      // POST /api/echo - Echo endpoint for testing
      if (url.pathname === "/api/echo" && method === "POST") {
        const body = await request.json();
        return Response.json(
          { 
            echo: body,
            headers: Object.fromEntries(request.headers.entries()),
            timestamp: new Date().toISOString()
          },
          { headers: corsHeaders(origin) }
        );
      }
      
      // 404 for unmatched routes
      return Response.json(
        { error: "Not Found", path: url.pathname },
        { status: 404, headers: corsHeaders(origin) }
      );
      
    } catch (error) {
      console.error("API Error:", error);
      return Response.json(
        { error: "Internal Server Error" },
        { status: 500, headers: corsHeaders(origin) }
      );
    }
  }
};

// You can also define environment bindings interface for type safety
// interface Env {
//   DB: D1Database;           // For SQL database
//   KV: KVNamespace;          // For key-value storage
//   BUCKET: R2Bucket;         // For file storage
//   API_KEY: string;          // For secrets
//   SUPABASE_URL: string;     // Supabase URL
//   SUPABASE_KEY: string;     // Supabase API key
// }

// Available API Endpoints:
// GET  /api/health - Health check
// GET  /api/users - List users with battle stats
// GET  /api/users/:id - Get specific user
// POST /api/users - Create new user
// GET  /api/users/:id/stats - Get user battle statistics
// GET  /api/alarms - List alarms (with userId, enabled, withBattles filters)
// POST /api/alarms - Create new alarm
// GET  /api/battles - List battles (with type, status, userId filters)
// POST /api/battles - Create new battle
// GET  /api/battles/:id - Get specific battle
// POST /api/battles/:id/join - Join battle
// POST /api/battles/:id/wake - Record wake up time
// GET  /api/tournaments - List tournaments (with status filter)
// POST /api/echo - Echo endpoint for testing 