//import LoginPage from './pages/LoginPage';
//import './App.css';

//function App() {
//  return (
//    <>
//      <div className="App">
//        <LoginPage.AppLogin />
//      </div> 
//    </>
//  );
//}

//export default App;

import React, { useMemo, useState } from "react";
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";

/**
 * THE SPHERE — Demo App (single file)
 * Changes in this version:
 * - Ranking: Top 20 + own placement if >20; user preview shows only Name, Level, Points, #Badges (works for all users)
 * - Generic avatars everywhere
 * - Home: avatar next to name; level progress; 4 stations with last activity
 * - Groups: Create works; Join works; **Members list** shown; Message button removed
 * - Profile: header with avatar + settings; badge counter; **legend for level colors**; 24-badge grid (locked grayscale, unlocked color by level); badge modal shows **requirements for L1–L3**
 * - All popups are centered modals
 */

// ---------- Avatar & UI helpers ----------
const GRADIENTS = [
  "from-fuchsia-400 to-rose-400",
  "from-violet-400 to-fuchsia-400",
  "from-sky-400 to-cyan-400",
  "from-emerald-400 to-teal-400",
  "from-amber-300 to-rose-400",
  "from-indigo-400 to-purple-400",
];

function initials(name = "?") {
  const parts = name.split(new RegExp("\s+")).filter(Boolean);
  const letters = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "?");
  return letters.join("");
}

function Avatar({ name, size = 48, seed }) {
  const idx = Math.abs((seed ?? name ?? "0").split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % GRADIENTS.length;
  const style = { width: size, height: size };
  return (
    <div className={`rounded-full text-neutral-900 flex items-center justify-center font-semibold bg-gradient-to-br ${GRADIENTS[idx]}`} style={style}>
      <span className="drop-shadow-sm">{initials(name)}</span>
    </div>
  );
}

// ---------- Badge icons + data (24 total) ----------
function HeartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7.5-4.35-10-8.57C-.66 7.66 2.1 3 6.6 3c2.17 0 3.76 1.1 4.4 2.17C11.64 4.1 13.23 3 15.4 3 19.9 3 22.66 7.66 22 12.43 19.5 16.65 12 21 12 21z"/></svg>
  );
}

const ALL_BADGES = [
  { id: "sleep", name: "Sleep Master", icon: <Moon className="w-5 h-5" /> },
  { id: "stars", name: "Star Collector", icon: <Star className="w-5 h-5" /> },
  { id: "calories", name: "Calorie Burner", icon: <Flame className="w-5 h-5" /> },
  { id: "steps", name: "Step Up", icon: <User className="w-5 h-5" /> },
  { id: "focus", name: "Focus Wizard", icon: <Star className="w-5 h-5" /> },
  { id: "zone", name: "Zone Keeper", icon: <HeartIcon /> },
  { id: "streak", name: "Streak Hero", icon: <Star className="w-5 h-5" /> },
  { id: "hiit", name: "HIIT Hustler", icon: <Activity className="w-5 h-5" /> },
  { id: "cardio", name: "Cardio Champ", icon: <HeartPulse className="w-5 h-5" /> },
  { id: "biker", name: "Bike Boss", icon: <Bike className="w-5 h-5" /> },
  { id: "iron", name: "Iron Lifter", icon: <Dumbbell className="w-5 h-5" /> },
  { id: "stamina", name: "Stamina Star", icon: <Trophy className="w-5 h-5" /> },
  { id: "planner", name: "Plan Keeper", icon: <CalendarDays className="w-5 h-5" /> },
  { id: "medal1", name: "Bronze Path", icon: <Medal className="w-5 h-5" /> },
  { id: "medal2", name: "Silver Path", icon: <Medal className="w-5 h-5" /> },
  { id: "medal3", name: "Golden Path", icon: <Medal className="w-5 h-5" /> },
  { id: "combo", name: "Combo Crafter", icon: <Activity className="w-5 h-5" /> },
  { id: "zen", name: "Zen Flow", icon: <Star className="w-5 h-5" /> },
  { id: "hydr", name: "Hydration Hero", icon: <HeartPulse className="w-5 h-5" /> },
  { id: "warm", name: "Warmup Wizard", icon: <Flame className="w-5 h-5" /> },
  { id: "cool", name: "Cooldown Pro", icon: <Moon className="w-5 h-5" /> },
  { id: "route", name: "Route Runner", icon: <Activity className="w-5 h-5" /> },
  { id: "coach", name: "Coach's Pick", icon: <Trophy className="w-5 h-5" /> },
  { id: "club", name: "Club Member", icon: <Users className="w-5 h-5" /> },
];

const BADGE_DESCRIPTIONS = Object.fromEntries(
  ALL_BADGES.map(b => [
    b.id,
    {
      title: b.name,
      description: {
        sleep: "Halte 7 Tage in Folge ≥7h Schlaf im Schnitt.",
        stars: "Schließe 5 Workouts diese Woche mit ≥4★ ab.",
        calories: "Verbrenne 2.000 kcal in 7 Tagen.",
        steps: "Erreiche an 5 Tagen ≥10.000 Schritte.",
        focus: "Absolviere 5 Sessions ohne Fehlversuche.",
        zone: "Bleibe 20 Min. in deiner optimalen HF‑Zone.",
        streak: "Trainiere 7 Tage am Stück.",
      }[b.id] || "Sammle diesen Badge durch passende Aktivitäten.",
    }
  ])
);

const BADGE_LEVEL_REQS = {
  // Specific examples
  sleep: [
    "Ø ≥7h an 1 Tag",
    "Ø ≥7h an 7 Tagen",
    "Ø ≥7h an 30 Tagen",
  ],
  stars: ["≥1 Workout mit ≥4★", "≥5 Workouts mit ≥4★", "≥20 Workouts mit ≥4★"],
  calories: ["≥500 kcal", "≥2.000 kcal/Woche", "≥10.000 kcal/Monat"],
  steps: ["≥10.000 Schritte (1 Tag)", "≥10.000 Schritte (5 Tage)", "≥10.000 Schritte (20 Tage)"],
  focus: ["1 Session ohne Fehler", "5 Sessions ohne Fehler", "20 Sessions ohne Fehler"],
  zone: ["10 Min. in Zone", "20 Min. in Zone", "60 Min. in Zone"],
  streak: ["3 Tage in Folge", "7 Tage in Folge", "30 Tage in Folge"],
  // Defaults for all others
};

function getLevelReqs(id) {
  const def = ["Einmal Ziel erreichen", "7 Tage schaffen", "30 Tage schaffen"];
  return BADGE_LEVEL_REQS[id] || def;
}

// ---------- Dummy Users / Groups / Stations ----------
const DUMMY_USER = {
  id: "me",
  name: "Max Mustermann",
  level: 5,
  xp: 320,
  nextLevelXp: 500,
  lastWorkout: { time: 32 * 60 + 10, heartRate: 145, points: 84, calories: 230 },
  weeklyPoints: 215,
  badges: [
    { id: "sleep", name: "Sleep Master", level: 2, icon: <Moon className="w-5 h-5" /> },
    { id: "stars", name: "Star Collector", level: 3, icon: <Star className="w-5 h-5" /> },
    { id: "calories", name: "Calorie Burner", level: 1, icon: <Flame className="w-5 h-5" /> },
    { id: "steps", name: "Step Up", level: 2, icon: <User className="w-5 h-5" /> },
  ],
};

const BASE_USERS = [
  { id: "u1", name: "Puttich", level: 7, weeklyPoints: 240, badges: ["stars", "steps"], lastWorkout: { time: 1800, heartRate: 152, points: 50, calories: 200 } },
  { id: "u2", name: "Fiuther", level: 6, weeklyPoints: 240, badges: ["sleep"], lastWorkout: { time: 2100, heartRate: 148, points: 40, calories: 180 } },
  { id: "u3", name: "Usered", level: 3, weeklyPoints: 160, badges: ["calories"], lastWorkout: { time: 1500, heartRate: 140, points: 30, calories: 150 } },
  { id: "u4", name: "Usrname", level: 2, weeklyPoints: 80, badges: [], lastWorkout: { time: 900, heartRate: 130, points: 15, calories: 90 } },
  { id: "u11", name: "Atlas", level: 18, weeklyPoints: 400, badges: ["streak", "zone"], lastWorkout: { time: 2700, heartRate: 158, points: 120, calories: 350 } },
  { id: "u12", name: "Nova", level: 15, weeklyPoints: 360, badges: ["focus", "stars"], lastWorkout: { time: 2650, heartRate: 160, points: 110, calories: 330 } },
  { id: "u13", name: "Kai", level: 12, weeklyPoints: 300, badges: ["steps", "sleep"], lastWorkout: { time: 2400, heartRate: 150, points: 95, calories: 300 } },
];

const DEFAULT_GROUPS = [
  { id: "g1", name: "Sport Enthusiasts", members: 24, description: "Mixed team training every Tue & Thu.", upcoming: [{ when: "Tue 18:00", title: "Team HIIT" }, { when: "Thu 18:00", title: "Plyo Flow" }], memberIds: ["u1","u2","u3","me"] },
  { id: "g2", name: "Runners", members: 15, description: "Intervals & mobility on Wednesdays.", upcoming: [{ when: "Wed 19:00", title: "Intervals 6x800m" }], memberIds: ["u11","u12","u13"] },
  { id: "g3", name: "Fitness Buddies", members: 8, description: "Weekend bootcamps + brunch.", upcoming: [{ when: "Sat 10:00", title: "Bootcamp" }], memberIds: ["u3","u4"] },
  { id: "g4", name: "Sphere Team Tuesday", members: 12, description: "Internal team challenge night.", upcoming: [{ when: "Tue 20:00", title: "Team Challenge" }], memberIds: ["u1","u11","u12"] },
];

const STATIONS = [
  { id: "s1", name: "Cardio Zone", icon: <HeartPulse className="w-5 h-5" />, last: { date: "2025-08-20", time: 20 * 60, heartRate: 152, points: 45, calories: 160 } },
  { id: "s2", name: "Strength Bay", icon: <Dumbbell className="w-5 h-5" />, last: { date: "2025-08-18", time: 25 * 60, heartRate: 135, points: 38, calories: 210 } },
  { id: "s3", name: "Bike Studio", icon: <Bike className="w-5 h-5" />, last: { date: "2025-08-17", time: 30 * 60, heartRate: 148, points: 52, calories: 280 } },
  { id: "s4", name: "HIIT Floor", icon: <Activity className="w-5 h-5" />, last: { date: "2025-08-15", time: 18 * 60, heartRate: 160, points: 60, calories: 230 } },
];

const CHALLENGES = [
  { id: "c1", title: "Herzsache", description: "halte die Herzfrequenz über 120", done: true },
  { id: "c2", title: "Fokus-Zone", description: "bleibe 5 Minuten fehlerfrei", done: false },
  { id: "c3", title: "Kombiniert", description: "schlage 3 Kombos in einem Training", done: false },
];

// ---------- Helpers ----------
function secondsToClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function Modal({ open, onClose, children, title, size = "md" }) {
  if (!open) return null;
  const maxW = size === "sm" ? "sm:max-w-sm" : size === "lg" ? "sm:max-w-xl" : "sm:max-w-lg";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxW} sm:rounded-2xl bg-neutral-900 text-slate-200 ring-1 ring-white/10 p-5 shadow-2xl mx-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-rose-300 bg-clip-text text-transparent">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Card({ children, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={`rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 shadow-md shadow-black/40 backdrop-blur-sm ${onClick ? "text-left w-full hover:bg-white/10 transition" : ""}`}>
      {children}
    </Comp>
  );
}

// ---------- UI Skeleton ----------
function Background() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
      <div className="absolute -top-24 -left-24 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-violet-600/40 via-fuchsia-500/30 to-rose-400/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-rose-500/30 via-purple-500/20 to-fuchsia-400/10 blur-3xl" />
      <div className="absolute inset-0 mix-blend-soft-light" style={{ backgroundImage: "radial-gradient(60rem 30rem at 10% 10%, rgba(255,255,255,.08), transparent), radial-gradient(50rem 40rem at 90% 80%, rgba(255,255,255,.06), transparent)" }} />
    </div>
  );
}

function Screen({ children, title, subtitle, titleNode }) {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-slate-200 flex flex-col relative overflow-hidden">
      <Background />
      <header className="px-5 pt-10 pb-4 relative z-10">
        {titleNode ? (
          titleNode
        ) : (
          <>
            {title && (
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-rose-300 bg-clip-text text-transparent tracking-tight">{title}</h1>
            )}
            {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
          </>
        )}
      </header>
      <main className="flex-1 px-5 pb-32 relative z-10">{children}</main>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-2xl font-semibold text-slate-100">{value}</span>
    </div>
  );
}

function Pill({ children, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
        active ? "bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950" : "bg-white/5 text-slate-100 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

// ---------- Screens ----------
function Home({ onStartWorkout }) {
  const { lastWorkout, name, level, xp, nextLevelXp } = DUMMY_USER;
  const progress = Math.min(100, Math.round(((xp || 0) / (nextLevelXp || 1)) * 100));
  const [stationOpen, setStationOpen] = useState(null); // station id
  const currentStation = stationOpen ? STATIONS.find(s => s.id === stationOpen) : null;

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={name} size={48} />
        <div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-rose-300 bg-clip-text text-transparent tracking-tight">{name}</h1>
          <p className="text-slate-400">Level {level}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Screen titleNode={header}>
      {/* Level Progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">Level Progress</span>
          <span className="text-slate-300 text-sm">{xp}/{nextLevelXp} XP</span>
        </div>
        <div className="h-3 w-full rounded-lg bg-white/10 overflow-hidden ring-1 ring-white/10">
          <div className="h-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      {/* Last Workout Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Card><Stat label="TIME" value={secondsToClock(lastWorkout.time)} /></Card>
        <Card><Stat label="HEART RATE" value={<>{lastWorkout.heartRate} bpm</>} /></Card>
        <Card><Stat label="POINTS" value={lastWorkout.points} /></Card>
        <Card><Stat label="CALORIES" value={<>{lastWorkout.calories} kcal</>} /></Card>
      </div>

      {/* Quick Actions (only Start Workout) */}
      <div className="mt-6">
        <button onClick={onStartWorkout} className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950 py-3 font-semibold hover:brightness-110 transition">Start Workout</button>
      </div>

      {/* Stations */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-rose-300 bg-clip-text text-transparent mb-3">Stations</h3>
        <div className="grid grid-cols-2 gap-3">
          {STATIONS.map(s => (
            <Card key={s.id} onClick={() => setStationOpen(s.id)}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-3">{s.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-slate-400 text-sm">Letzte Aktivität: {s.last.date}</p>
                </div>
                <Info className="w-4 h-4 text-slate-400" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Station Detail Modal */}
      <Modal open={!!currentStation} onClose={() => setStationOpen(null)} title={currentStation?.name} size="sm">
        {currentStation && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card><Stat label="TIME" value={secondsToClock(currentStation.last.time)} /></Card>
              <Card><Stat label="HR" value={`${currentStation.last.heartRate} bpm`} /></Card>
              <Card><Stat label="POINTS" value={currentStation.last.points} /></Card>
              <Card><Stat label="CAL" value={`${currentStation.last.calories} kcal`} /></Card>
            </div>
            <p className="text-slate-400 text-sm">Zuletzt am {currentStation.last.date}</p>
          </div>
        )}
      </Modal>
    </Screen>
  );
}

function Groups({ groups, setGroups, joinedIds, setJoinedIds }) {
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(null); // group id
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const filtered = useMemo(() => groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())), [groups, search]);
  const current = opened ? groups.find(g => g.id === opened) : null;

  const createGroup = () => {
    if (!newName.trim()) return;
    const id = `g${Math.random().toString(36).slice(2, 7)}`;
    const g = { id, name: newName, members: 1, description: newDesc || "", upcoming: [], memberIds: ["me"] };
    setGroups(prev => [g, ...prev]);
    setCreateOpen(false); setNewName(""); setNewDesc("");
  };

  const toggleJoin = (gid) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== gid) return g;
      const already = (g.memberIds || []).includes("me");
      const memberIds = already ? g.memberIds.filter(id => id !== "me") : [...(g.memberIds || []), "me"]; 
      const members = Math.max(0, (g.members || memberIds.length) + (already ? -1 : 1));
      return { ...g, memberIds, members };
    }));
    const set = new Set(joinedIds);
    if (set.has(gid)) set.delete(gid); else set.add(gid);
    setJoinedIds(Array.from(set));
  };

  const getUserById = (id) => {
    if (id === "me") return { id: "me", name: DUMMY_USER.name };
    const u = BASE_USERS.find(u => u.id === id);
    return u ? { id: u.id, name: u.name } : { id, name: `Member ${id}` };
  };

  return (
    <Screen title="Groups" subtitle={opened ? current?.name : "My Groups"}>
      {!opened && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fuchsia-300" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search groups"
                className="w-full rounded-xl bg-white/5 ring-1 ring-white/10 pl-9 pr-3 py-2 text-slate-100 placeholder-slate-400/70 outline-none focus:ring-violet-400"
              />
            </div>
            <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950 px-3 py-2 font-semibold hover:brightness-110 transition">
              <Plus className="w-4 h-4" /> Create
            </button>
          </div>

          <div className="space-y-3">
            {filtered.map(g => (
              <Card key={g.id}>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/10 p-3"><Users className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{g.name}</p>
                    <p className="text-slate-400 text-sm">{g.members} members</p>
                  </div>
                  <button onClick={() => setOpened(g.id)} className="rounded-xl bg-white/5 text-slate-100 px-3 py-2 font-semibold hover:bg-white/10 transition">Open</button>
                </div>
              </Card>
            ))}
          </div>

          {/* Create Group Modal */}
          <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Group" size="sm">
            <div className="space-y-3">
              <label className="text-sm text-slate-300">Name
                <input value={newName} onChange={e=>setNewName(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-slate-100 outline-none focus:ring-violet-400" />
              </label>
              <label className="text-sm text-slate-300">Description
                <textarea value={newDesc} onChange={e=>setNewDesc(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-slate-100 outline-none focus:ring-violet-400" rows={3} />
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={()=>setCreateOpen(false)} className="rounded-xl bg-white/5 text-slate-100 px-3 py-2 font-semibold hover:bg-white/10 transition">Cancel</button>
                <button onClick={createGroup} className="rounded-xl bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950 px-3 py-2 font-semibold hover:brightness-110 transition">Create</button>
              </div>
            </div>
          </Modal>
        </>
      )}

      {opened && current && (
        <div className="space-y-4">
          <button onClick={() => setOpened(null)} className="text-sm text-slate-300 hover:text-white">← Back</button>
          <Card>
            <p className="text-slate-300 mb-2">{current.description}</p>
            <p className="text-slate-400 text-sm">Members: {current.members}</p>
          </Card>

          {/* Members list */}
          <div>
            <h4 className="mb-2 text-slate-200 font-semibold">Members</h4>
            <div className="space-y-2">
              {(current.memberIds || []).map((mid) => {
                const m = getUserById(mid);
                return (
                  <Card key={mid}>
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size={36} seed={mid} />
                      <span className="font-medium">{m.name}</span>
                    </div>
                  </Card>
                );
              })}
              {!(current.memberIds && current.memberIds.length) && <p className="text-slate-400 text-sm">No members yet.</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => toggleJoin(current.id)} className={`rounded-xl px-3 py-2 font-semibold transition ${joinedIds.includes(current.id) ? "bg-white/5 text-slate-100 hover:bg-white/10" : "bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950 hover:brightness-110"}`}>
              {joinedIds.includes(current.id) ? "Joined" : "Join Group"}
            </button>
          </div>
        </div>
      )}
    </Screen>
  );
}

// build a long ranking list (≥50) deterministically
const EXTRA_NAMES = [
  "Aria", "Blaze", "Cora", "Dante", "Eli", "Faye", "Gale", "Hana", "Ivo", "Juno",
  "Kira", "Luca", "Mira", "Nico", "Orin", "Pia", "Quin", "Rhea", "Sora", "Tess",
  "Uma", "Vik", "Wren", "Xeno", "Yael", "Zane", "Ari", "Bea", "Cas", "Dax",
  "Eve", "Fox", "Gia", "Hal", "Ira", "Jon", "Ken", "Lux", "Mae", "Noa",
  "Oak", "Poe", "Ray", "Sky", "Tao", "Uli", "Vea", "Wes", "Yui", "Ziv"
];

function buildRanking(mode) {
  const base = mode === "weekly"
    ? [
        ...BASE_USERS.map(u => ({ id: u.id, name: u.name, points: u.weeklyPoints, level: u.level, badgesCount: u.badges.length })),
        { id: "me", name: "You", points: DUMMY_USER.weeklyPoints, level: DUMMY_USER.level, badgesCount: DUMMY_USER.badges.length }
      ]
    : [
        { id: "u11", name: "Atlas", points: 1830, level: 18, badgesCount: 2 },
        { id: "u12", name: "Nova", points: 1700, level: 15, badgesCount: 2 },
        { id: "u13", name: "Kai", points: 1520, level: 12, badgesCount: 2 },
        { id: "me", name: "You", points: 1337, level: DUMMY_USER.level, badgesCount: DUMMY_USER.badges.length },
      ];

  const extra = EXTRA_NAMES.slice(0, 40).map((n, i) => ({
    id: `e${i}`,
    name: n,
    points: mode === "weekly" ? 400 - i * 8 : 3200 - i * 40,
    level: Math.max(1, 1 + Math.floor(i / 3)),
    badgesCount: (i % 4),
  }));

  const full = [...base, ...extra]
    .filter((v, i, a) => a.findIndex(x => x.id === v.id) === i)
    .sort((a, b) => b.points - a.points);
  return full;
}

function Ranking({ onPreviewUser }) {
  const [tab, setTab] = useState("weekly");
  const full = buildRanking(tab);
  const top20 = full.slice(0, 20);
  const myIdx = full.findIndex(r => r.id === "me");

  return (
    <Screen title="Ranking">
      <div className="flex gap-2 mb-5">
        <Pill active={tab === "weekly"} onClick={() => setTab("weekly")}>Weekly</Pill>
        <Pill active={tab === "all"} onClick={() => setTab("all")}>All-time</Pill>
      </div>

      <div className="space-y-3">
        {top20.map((row, idx) => (
          <Card key={row.id}>
            <button onClick={() => onPreviewUser(row)} className="w-full text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 text-center font-bold text-slate-300">{idx + 1}</div>
                <Avatar name={row.name} size={40} seed={row.id} />
                <div className="flex-1 font-medium">{row.name}</div>
                <div className="text-lg font-semibold">{row.points}</div>
              </div>
            </button>
          </Card>
        ))}

        {myIdx >= 20 && (
          <>
            <div className="h-px bg-white/10 my-2" />
            <Card>
              <button onClick={() => onPreviewUser(full[myIdx])} className="w-full text-left">
                <div className="flex items-center gap-3 opacity-90">
                  <div className="w-8 text-center font-bold text-slate-300">{myIdx + 1}</div>
                  <Avatar name="You" size={40} seed="me" />
                  <div className="flex-1 font-medium">You</div>
                  <div className="text-lg font-semibold">{full[myIdx].points}</div>
                </div>
              </button>
            </Card>
          </>
        )}
      </div>
    </Screen>
  );
}

function Challenges() {
  const [items, setItems] = useState(CHALLENGES);
  const markDone = (id) => setItems(prev => prev.map(c => (c.id === id ? { ...c, done: !c.done } : c)));

  return (
    <Screen title="Weekly Challenge">
      <div className="space-y-3">
        {items.map(c => (
          <Card key={c.id}>
            <div className="flex items-center gap-3">
              <div className={`${c.done ? "bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950" : "bg-white/10"} w-10 h-10 rounded-xl flex items-center justify-center`}>
                {c.done ? <Check className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">{c.title}</p>
                <p className="text-slate-400 text-sm">{c.description}</p>
              </div>
              <button onClick={() => markDone(c.id)} className={`rounded-xl px-3 py-2 font-semibold transition ${c.done ? "bg-white/5 text-slate-100 hover:bg-white/10" : "bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950 hover:brightness-110"}`}>
                {c.done ? "Undo" : "Mark"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <button className="mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950 py-3 font-semibold hover:brightness-110 transition">Group Challenges</button>
    </Screen>
  );
}

function badgeLevelColor(level) {
  if (level === 3) return "from-amber-300 to-rose-400";
  if (level === 2) return "from-violet-400 to-fuchsia-400";
  return "from-sky-400 to-cyan-400"; // level 1
}

function Legend() {
  const item = (lvl, cls) => (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-4 h-4 rounded bg-gradient-to-br ${cls}`} />
      <span className="text-xs text-slate-300">Level {lvl}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-4">
      {item(1, badgeLevelColor(1))}
      {item(2, badgeLevelColor(2))}
      {item(3, badgeLevelColor(3))}
    </div>
  );
}

function Profile({ onOpenBadge, onOpenSettings }) {
  const u = DUMMY_USER;
  const owned = new Map(u.badges.map(b => [b.id, b.level]));
  const ownedCount = owned.size;
  const total = ALL_BADGES.length;

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={u.name} size={48} seed={u.id} />
        <div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-rose-300 bg-clip-text text-transparent tracking-tight">{u.name}</h1>
          <p className="text-slate-400">Level {u.level}</p>
        </div>
      </div>
      <button onClick={onOpenSettings} className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm font-medium hover:bg-white/10 flex items-center gap-2">
        <Settings className="w-4 h-4" /> Settings
      </button>
    </div>
  );

  return (
    <Screen titleNode={header}>
      <Card>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-300 text-sm">Badges gesammelt</p>
            <p className="text-xl font-semibold">{ownedCount} / {total}</p>
          </div>
          <Legend />
        </div>
      </Card>

      <div className="mt-4 mb-2 text-slate-400 text-xs">Badges</div>

      {/* Tile grid of 24 badges */}
      <div className="grid grid-cols-3 gap-3">
        {ALL_BADGES.map((b) => {
          const lvl = owned.get(b.id);
          const unlocked = !!lvl;
          return (
            <Card key={b.id} onClick={() => onOpenBadge(b.id)}>
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-xl ${unlocked ? `bg-gradient-to-br ${badgeLevelColor(lvl)} text-neutral-950` : "bg-white/5 text-slate-300 grayscale"}`}>
                  {b.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium truncate max-w-[8rem]">{b.name}</p>
                  <p className="text-[11px] text-slate-400">{unlocked ? `Lvl ${lvl}` : "Locked"}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-slate-400 text-xs mt-3">Tippe auf ein Badge für Details.</p>
    </Screen>
  );
}

// ---------- Root App with Bottom Nav & Modals ----------
const TABS = [
  { key: "home", label: "Home", icon: <HomeIcon className="w-6 h-6" /> },
  { key: "groups", label: "Groups", icon: <Users className="w-6 h-6" /> },
  { key: "ranking", label: "Ranking", icon: <Trophy className="w-6 h-6" /> },
  { key: "challenges", label: "Challenges", icon: <CalendarDays className="w-6 h-6" /> },
  { key: "profile", label: "Profile", icon: <User className="w-6 h-6" /> },
];

export default function App() {
  const [tab, setTab] = useState("home");

  // groups state
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [joinedIds, setJoinedIds] = useState([]);

  // Modals & sheets
  const [activeBadgeId, setActiveBadgeId] = useState(null); // for badge info popup
  const [previewUserData, setPreviewUserData] = useState(null);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // profile settings state
  const [usernameInput, setUsernameInput] = useState(DUMMY_USER.name);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [, force] = useState(0); // for re-render after saving settings

  // form state for workout
  const [wTime, setWTime] = useState("32:10");
  const [wHR, setWHR] = useState(145);
  const [wPoints, setWPoints] = useState(84);
  const [wCals, setWCals] = useState(230);

  const saveWorkout = () => {
    const [mm, ss] = (wTime || "0:0").split(":");
    const secs = (parseInt(mm, 10) || 0) * 60 + (parseInt(ss, 10) || 0);
    DUMMY_USER.lastWorkout = { time: secs, heartRate: parseInt(wHR, 10) || 0, points: parseInt(wPoints, 10) || 0, calories: parseInt(wCals, 10) || 0 };
    DUMMY_USER.weeklyPoints += parseInt(wPoints, 10) || 0;
    DUMMY_USER.xp = (DUMMY_USER.xp || 0) + (parseInt(wPoints, 10) || 0);
    while (DUMMY_USER.xp >= DUMMY_USER.nextLevelXp) {
      DUMMY_USER.xp -= DUMMY_USER.nextLevelXp;
      DUMMY_USER.level += 1;
      DUMMY_USER.nextLevelXp = Math.round(DUMMY_USER.nextLevelXp * 1.1);
    }
    setWorkoutOpen(false);
  };

  const unlockedIds = new Set(DUMMY_USER.badges.map(b => b.id));
  const activeMeta = activeBadgeId ? BADGE_DESCRIPTIONS[activeBadgeId] : null;
  const isUnlocked = activeBadgeId ? unlockedIds.has(activeBadgeId) : false;

  const levelReqs = activeBadgeId ? getLevelReqs(activeBadgeId) : [];

  const saveSettings = () => {
    DUMMY_USER.name = usernameInput.trim() || DUMMY_USER.name;
    setSettingsOpen(false);
    force(x => x + 1);
  };

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-slate-200">
      {/* Render current tab */}
      {tab === "home" && <Home onStartWorkout={() => setWorkoutOpen(true)} />}
      {tab === "groups" && <Groups groups={groups} setGroups={setGroups} joinedIds={joinedIds} setJoinedIds={setJoinedIds} />}
      {tab === "ranking" && <Ranking onPreviewUser={(row) => setPreviewUserData(row)} />}
      {tab === "challenges" && <Challenges />}
      {tab === "profile" && <Profile onOpenBadge={(id) => setActiveBadgeId(id)} onOpenSettings={() => { setUsernameInput(DUMMY_USER.name); setSettingsOpen(true); }} />}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md z-50 backdrop-blur supports-[backdrop-filter]:bg-black/60 bg-black/70 border-t border-white/10 text-slate-200">
        <ul className="grid grid-cols-5">
          {TABS.map(t => (
            <li key={t.key}>
              <button
                onClick={() => setTab(t.key)}
                className={`w-full flex flex-col items-center py-3 gap-1 transition ${
                  tab === t.key ? "text-fuchsia-300" : "text-slate-300/70 hover:text-slate-100"
                }`}
              >
                {t.icon}
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Badge Info Modal (small centered) */}
      <Modal open={!!activeBadgeId} onClose={() => setActiveBadgeId(null)} title={activeMeta?.title || "Badge"} size="sm">
        {activeBadgeId && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-3 ${isUnlocked ? "bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950" : "bg-white/10 text-slate-200"}`}>
                {ALL_BADGES.find(b => b.id === activeBadgeId)?.icon}
              </div>
              <div>
                <p className="font-semibold">{activeMeta?.title}</p>
                <p className="text-slate-400 text-sm">{isUnlocked ? "Freigeschaltet" : "Gesperrt"}</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{activeMeta?.description || "Keine Beschreibung verfügbar."}</p>
            {/* Level requirements */}
            <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
              <p className="text-slate-300 text-sm mb-2">Was brauche ich je Level?</p>
              <ul className="space-y-2 text-sm">
                {levelReqs.map((txt, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className={`inline-block w-4 h-4 rounded bg-gradient-to-br ${badgeLevelColor(i+1)}`} />
                    <span className="text-slate-200">Level {i+1}: {txt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* User Preview Modal (only Name, Level, Points, #Badges) */}
      <Modal open={!!previewUserData} onClose={() => setPreviewUserData(null)} title="User" size="sm">
        {previewUserData && (() => {
          const id = previewUserData.id;
          const base = id === "me" ? DUMMY_USER : BASE_USERS.find(u => u.id === id);
          const name = id === "me" ? DUMMY_USER.name : (base?.name || previewUserData.name);
          const level = base?.level ?? Math.max(1, Math.floor((previewUserData.points || 0) / 100));
          const points = previewUserData.points || base?.weeklyPoints || 0;
          const badgesCount = (id === "me" ? DUMMY_USER.badges.length : (base?.badges?.length || (previewUserData.badgesCount ?? 0)));
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar name={name} size={48} seed={id} />
                <div>
                  <p className="text-lg font-semibold">{name}</p>
                  <p className="text-slate-400 text-sm">Level {level}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Card><div className="text-center"><div className="text-xs text-slate-400">Points</div><div className="text-lg font-semibold">{points}</div></div></Card>
                <Card><div className="text-center"><div className="text-xs text-slate-400">Badges</div><div className="text-lg font-semibold">{badgesCount}</div></div></Card>
                <Card><div className="text-center"><div className="text-xs text-slate-400">Level</div><div className="text-lg font-semibold">{level}</div></div></Card>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Create Workout Modal */}
      <Modal open={workoutOpen} onClose={() => setWorkoutOpen(false)} title="Create Workout" size="md">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-300">Time (mm:ss)
              <input value={wTime} onChange={e=>setWTime(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-slate-100 placeholder-slate-400/70 outline-none focus:ring-violet-400" />
            </label>
            <label className="text-sm text-slate-300">Heart Rate (bpm)
              <input type="number" value={wHR} onChange={e=>setWHR(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-slate-100 outline-none focus:ring-violet-400" />
            </label>
            <label className="text-sm text-slate-300">Points
              <input type="number" value={wPoints} onChange={e=>setWPoints(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-slate-100 outline-none focus:ring-violet-400" />
            </label>
            <label className="text-sm text-slate-300">Calories
              <input type="number" value={wCals} onChange={e=>setWCals(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-slate-100 outline-none focus:ring-violet-400" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={()=>setWorkoutOpen(false)} className="rounded-xl bg-white/5 text-slate-100 px-3 py-2 font-semibold hover:bg-white/10 transition">Cancel</button>
            <button onClick={saveWorkout} className="rounded-xl bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950 px-3 py-2 font-semibold hover:brightness-110 transition">Save</button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" size="sm">
        <div className="space-y-3">
          <label className="text-sm text-slate-300">Username
            <input value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2 text-slate-100 outline-none focus:ring-violet-400" />
          </label>
          <label className="flex items-center justify-between text-sm text-slate-300">
            <span>Benachrichtigungen</span>
            <button onClick={()=>setNotificationsOn(v=>!v)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${notificationsOn ? 'bg-fuchsia-500/70' : 'bg-white/10'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${notificationsOn ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setSettingsOpen(false)} className="rounded-xl bg-white/5 text-slate-100 px-3 py-2 font-semibold hover:bg-white/10 transition">Cancel</button>
            <button onClick={saveSettings} className="rounded-xl bg-gradient-to-r from-fuchsia-400 via-violet-400 to-rose-400 text-neutral-950 px-3 py-2 font-semibold hover:brightness-110 transition">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
