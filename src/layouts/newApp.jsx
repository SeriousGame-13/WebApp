import React, { useMemo, useState } from "react";
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";
import '../sphere-styles.css';

/**
 * THE SPHERE — Complete Demo App (CSS version)
 * All components in one file for easy setup
 */

// ---------- Avatar & UI helpers ----------
const GRADIENTS = [
  "avatar-gradient-0",
  "avatar-gradient-1", 
  "avatar-gradient-2",
  "avatar-gradient-3",
  "avatar-gradient-4",
  "avatar-gradient-5",
];

function initials(name = "?") {
  const parts = name.split(new RegExp("\\s+")).filter(Boolean);
  const letters = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "?");
  return letters.join("");
}

function Avatar({ name, size = 48, seed }) {
  const idx = Math.abs((seed ?? name ?? "0").split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % GRADIENTS.length;
  const style = { width: size, height: size };
  return (
    <div className={`avatar ${GRADIENTS[idx]}`} style={style}>
      <span className="avatar-text">{initials(name)}</span>
    </div>
  );
}

// ---------- Badge icons + data ----------
function HeartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21s-7.5-4.35-10-8.57C-.66 7.66 2.1 3 6.6 3c2.17 0 3.76 1.1 4.4 2.17C11.64 4.1 13.23 3 15.4 3 19.9 3 22.66 7.66 22 12.43 19.5 16.65 12 21 12 21z"/>
    </svg>
  );
}

const ALL_BADGES = [
  { id: "sleep", name: "Sleep Master", icon: <Moon className="w-5 h-5" /> },
  { id: "stars", name: "Star Collector", icon: <Star className="w-5 h-5" /> },
  { id: "calories", name: "Calorie Burner", icon: <Flame className="w-5 h-5" /> },
  { id: "steps", name: "Step Up", icon: <Activity className="w-5 h-5" /> },
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

// ---------- Dummy Data ----------
const DUMMY_USER = {
  id: "me",
  name: "Max Mustermann",
  level: 5,
  xp: 320,
  nextLevelXp: 500,
  lastWorkout: { time: 32 * 60 + 10, heartRate: 145, points: 84, calories: 230 },
  weeklyPoints: 215,
  badges: [
    { id: "sleep", name: "Sleep Master", level: 2 },
    { id: "stars", name: "Star Collector", level: 3 },
    { id: "calories", name: "Calorie Burner", level: 1 },
    { id: "steps", name: "Step Up", level: 2 },
  ],
};

const BASE_USERS = [
  { id: "u1", name: "Puttich", level: 7, weeklyPoints: 240, badges: ["stars", "steps"] },
  { id: "u2", name: "Fiuther", level: 6, weeklyPoints: 240, badges: ["sleep"] },
  { id: "u3", name: "Usered", level: 3, weeklyPoints: 160, badges: ["calories"] },
  { id: "u4", name: "Usrname", level: 2, weeklyPoints: 80, badges: [] },
  { id: "u11", name: "Atlas", level: 18, weeklyPoints: 400, badges: ["streak", "zone"] },
  { id: "u12", name: "Nova", level: 15, weeklyPoints: 360, badges: ["focus", "stars"] },
  { id: "u13", name: "Kai", level: 12, weeklyPoints: 300, badges: ["steps", "sleep"] },
];

const DEFAULT_GROUPS = [
  { 
    id: "g1", 
    name: "Sport Enthusiasts", 
    members: 24, 
    description: "Mixed team training every Tue & Thu.", 
    memberIds: ["u1","u2","u3","me"] 
  },
  { 
    id: "g2", 
    name: "Runners", 
    members: 15, 
    description: "Intervals & mobility on Wednesdays.", 
    memberIds: ["u11","u12","u13"] 
  },
  { 
    id: "g3", 
    name: "Fitness Buddies", 
    members: 8, 
    description: "Weekend bootcamps + brunch.", 
    memberIds: ["u3","u4"] 
  },
  { 
    id: "g4", 
    name: "Sphere Team Tuesday", 
    members: 12, 
    description: "Internal team challenge night.", 
    memberIds: ["u1","u11","u12"] 
  },
];

const STATIONS = [
  { id: "s1", name: "Cardio Zone", icon: <HeartPulse className="w-5 h-5" />, last: { date: "2025-08-20", time: 20 * 60, heartRate: 152, points: 45, calories: 160 } },
  { id: "s2", name: "Strength Bay", icon: <Dumbbell className="w-5 h-5" />, last: { date: "2025-08-18", time: 25 * 60, heartRate: 135, points: 38, calories: 210 } },
  { id: "s3", name: "Bike Studio", icon: <Bike className="w-5 h-5" />, last: { date: "2025-08-17", time: 30 * 60, heartRate: 148, points: 52, calories: 280 } },
  { id: "s4", name: "HIIT Floor", icon: <Activity className="w-5 h-5" />, last: { date: "2025-08-15", time: 18 * 60, heartRate: 160, points: 60, calories: 230 } },
];

const EXTRA_NAMES = [
  "Aria", "Blaze", "Cora", "Dante", "Eli", "Faye", "Gale", "Hana", "Ivo", "Juno",
  "Kira", "Luca", "Mira", "Nico", "Orin", "Pia", "Quin", "Rhea", "Sora", "Tess",
  "Uma", "Vik", "Wren", "Xeno", "Yael", "Zane", "Ari", "Bea", "Cas", "Dax",
  "Eve", "Fox", "Gia", "Hal", "Ira", "Jon", "Ken", "Lux", "Mae", "Noa",
  "Oak", "Poe", "Ray", "Sky", "Tao", "Uli", "Vea", "Wes", "Yui", "Ziv"
];

// ---------- Helper Functions ----------
function secondsToClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function badgeLevelColor(level) {
  if (level === 3) return "badge-level-3";
  if (level === 2) return "badge-level-2";
  return "badge-level-1";
}

function buildRanking(mode) {
  const base = mode === "weekly"
    ? [
        ...BASE_USERS.map(u => ({ 
          id: u.id, 
          name: u.name, 
          points: u.weeklyPoints, 
          level: u.level, 
          badgesCount: u.badges.length 
        })),
        { 
          id: "me", 
          name: "You", 
          points: DUMMY_USER.weeklyPoints, 
          level: DUMMY_USER.level, 
          badgesCount: DUMMY_USER.badges.length 
        }
      ]
    : [
        { id: "u11", name: "Atlas", points: 1830, level: 18, badgesCount: 2 },
        { id: "u12", name: "Nova", points: 1700, level: 15, badgesCount: 2 },
        { id: "u13", name: "Kai", points: 1520, level: 12, badgesCount: 2 },
        { 
          id: "me", 
          name: "You", 
          points: 1337, 
          level: DUMMY_USER.level, 
          badgesCount: DUMMY_USER.badges.length 
        },
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

// ---------- UI Components ----------
function Modal({ open, onClose, children, title, size = "md" }) {
  if (!open) return null;
  const maxW = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-xl" : "max-w-lg";
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className={`modal-content ${maxW}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Card({ children, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={onClick ? "card-button" : "card"}>
      {children}
    </Comp>
  );
}

function Background() {
  return (
    <div className="background" aria-hidden>
      <div className="bg-gradient-1" />
      <div className="bg-gradient-2" />
      <div className="bg-overlay" />
    </div>
  );
}

function Screen({ children, title, subtitle, titleNode }) {
  return (
    <div className="screen">
      <Background />
      <header className="screen-header">
        {titleNode ? (
          titleNode
        ) : (
          <>
            {title && <h1 className="screen-title">{title}</h1>}
            {subtitle && <p className="screen-subtitle">{subtitle}</p>}
          </>
        )}
      </header>
      <main className="screen-main">{children}</main>
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
      className={`pill ${active ? 'pill-active' : 'pill-inactive'}`}
    >
      {children}
    </button>
  );
}

function Legend() {
  const item = (lvl, cls) => (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-4 h-4 rounded ${cls}`} />
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

// ---------- Screen Components ----------
function Home({ onStartWorkout }) {
  const { lastWorkout, name, level, xp, nextLevelXp } = DUMMY_USER;
  const progress = Math.min(100, Math.round(((xp || 0) / (nextLevelXp || 1)) * 100));
  const [stationOpen, setStationOpen] = useState(null);
  const currentStation = stationOpen ? STATIONS.find(s => s.id === stationOpen) : null;

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar name={name} size={48} />
        <div>
          <h1 className="screen-title">{name}</h1>
          <p className="screen-subtitle">Level {level}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Screen titleNode={header}>
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">Level Progress</span>
          <span className="text-slate-300 text-sm">{xp}/{nextLevelXp} XP</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      <div className="grid-2 mt-4">
        <Card><Stat label="TIME" value={secondsToClock(lastWorkout.time)} /></Card>
        <Card><Stat label="HEART RATE" value={<>{lastWorkout.heartRate} bpm</>} /></Card>
        <Card><Stat label="POINTS" value={lastWorkout.points} /></Card>
        <Card><Stat label="CALORIES" value={<>{lastWorkout.calories} kcal</>} /></Card>
      </div>

      <div className="mt-6">
        <button onClick={onStartWorkout} className="btn-primary w-full py-3">
          Start Workout
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gradient mb-3">Stations</h3>
        <div className="grid-2 gap-3">
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

      <Modal open={!!currentStation} onClose={() => setStationOpen(null)} title={currentStation?.name} size="sm">
        {currentStation && (
          <div className="space-y-3">
            <div className="grid-2 gap-3">
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
  const [opened, setOpened] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const filtered = useMemo(() => 
    groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())), 
    [groups, search]
  );
  
  const current = opened ? groups.find(g => g.id === opened) : null;

  const createGroup = () => {
    if (!newName.trim()) return;
    const id = `g${Math.random().toString(36).slice(2, 7)}`;
    const g = { 
      id, 
      name: newName, 
      members: 1, 
      description: newDesc || "", 
      memberIds: ["me"] 
    };
    setGroups(prev => [g, ...prev]);
    setCreateOpen(false); 
    setNewName(""); 
    setNewDesc("");
  };

  const toggleJoin = (gid) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== gid) return g;
      const already = (g.memberIds || []).includes("me");
      const memberIds = already 
        ? g.memberIds.filter(id => id !== "me") 
        : [...(g.memberIds || []), "me"]; 
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
            <div className="search-container">
              <Search className="search-icon" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search groups"
                className="search-input"
              />
            </div>
            <button 
              onClick={() => setCreateOpen(true)} 
              className="btn-primary flex items-center gap-2 px-3 py-2"
            >
              <Plus className="w-4 h-4" /> Create
            </button>
          </div>

          <div className="space-y-3">
            {filtered.map(g => (
              <Card key={g.id}>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/10 p-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold">{g.name}</p>
                    <p className="text-slate-400 text-sm">{g.members} members</p>
                  </div>
                  <button 
                    onClick={() => setOpened(g.id)} 
                    className="btn-secondary"
                  >
                    Open
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Group" size="sm">
            <div className="space-y-3">
              <label className="form-label">
                Name
                <input 
                  value={newName} 
                  onChange={e=>setNewName(e.target.value)} 
                  className="form-input mt-1" 
                />
              </label>
              <label className="form-label">
                Description
                <textarea 
                  value={newDesc} 
                  onChange={e=>setNewDesc(e.target.value)} 
                  className="form-textarea mt-1" 
                  rows={3} 
                />
              </label>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={()=>setCreateOpen(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={createGroup} 
                  className="btn-primary"
                >
                  Create
                </button>
              </div>
            </div>
          </Modal>
        </>
      )}

      {opened && current && (
        <div className="space-y-4">
          <button 
            onClick={() => setOpened(null)} 
            className="text-sm text-slate-300 hover:text-white cursor-pointer"
            style={{ background: 'none', border: 'none' }}
          >
            ← Back
          </button>
          
          <Card>
            <p className="text-slate-300 mb-2">{current.description}</p>
            <p className="text-slate-400 text-sm">Members: {current.members}</p>
          </Card>

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
              {!(current.memberIds && current.memberIds.length) && (
                <p className="text-slate-400 text-sm">No members yet.</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => toggleJoin(current.id)} 
              className={joinedIds.includes(current.id) ? "btn-secondary" : "btn-primary"}
            >
              {joinedIds.includes(current.id) ? "Joined" : "Join Group"}
            </button>
          </div>
        </div>
      )}
    </Screen>
  );
}

function Ranking({ onPreviewUser }) {
  const [tab, setTab] = useState("weekly");
  const full = buildRanking(tab);
  const top20 = full.slice(0, 20);
  const myIdx = full.findIndex(r => r.id === "me");

  return (
    <Screen title="Ranking">
      <div className="flex gap-2 mb-5">
        <Pill active={tab === "weekly"} onClick={() => setTab("weekly")}>
          Weekly
        </Pill>
        <Pill active={tab === "all"} onClick={() => setTab("all")}>
          All-time
        </Pill>
      </div>

      <div className="space-y-3">
        {top20.map((row, idx) => (
          <Card key={row.id}>
            <button 
              onClick={() => onPreviewUser(row)} 
              className="w-full text-left"
              style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 text-center font-bold text-slate-300">
                  {idx + 1}
                </div>
                <Avatar name={row.name} size={40} seed={row.id} />
                <div className="flex-1 font-medium">{row.name}</div>
                <div className="text-lg font-semibold">{row.points}</div>
              </div>
            </button>
          </Card>
        ))}

        {myIdx >= 20 && (
          <>
            <div className="h-px bg-white/10 mt-2 mb-2" />
            <Card>
              <button 
                onClick={() => onPreviewUser(full[myIdx])} 
                className="w-full text-left opacity-90"
                style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center font-bold text-slate-300">
                    {myIdx + 1}
                  </div>
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
  const [items, setItems] = useState([
    { id: "c1", title: "Herzsache", description: "halte die Herzfrequenz über 120", done: true },
    { id: "c2", title: "Fokus-Zone", description: "bleibe 5 Minuten fehlerfrei", done: false },
    { id: "c3", title: "Kombiniert", description: "schlage 3 Kombos in einem Training", done: false },
  ]);

  const markDone = (id) => setItems(prev => prev.map(c => (c.id === id ? { ...c, done: !c.done } : c)));

  return (
    <Screen title="Weekly Challenge">
      <div className="space-y-3">
        {items.map(c => (
          <Card key={c.id}>
            <div className="flex items-center gap-3">
              <div className={`${c.done ? "btn-primary" : "bg-white/10"} w-10 h-10 rounded-xl flex items-center justify-center`}>
                {c.done ? <Check className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">{c.title}</p>
                <p className="text-slate-400 text-sm">{c.description}</p>
              </div>
              <button 
                onClick={() => markDone(c.id)} 
                className={c.done ? "btn-secondary" : "btn-primary"}
              >
                {c.done ? "Undo" : "Mark"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <button className="btn-primary w-full mt-6 py-3">
        Group Challenges
      </button>
    </Screen>
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
          <h1 className="screen-title">{u.name}</h1>
          <p className="screen-subtitle">Level {u.level}</p>
        </div>
      </div>
      <button 
        onClick={onOpenSettings} 
        className="btn-secondary text-sm flex items-center gap-2"
      >
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

      <div className="grid-3">
        {ALL_BADGES.map((b) => {
          const lvl = owned.get(b.id);
          const unlocked = !!lvl;
          return (
            <Card key={b.id} onClick={() => onOpenBadge(b.id)}>
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-xl ${unlocked ? badgeLevelColor(lvl) : "badge-locked"}`}>
                  {b.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium truncate" style={{ maxWidth: '8rem' }}>
                    {b.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {unlocked ? `Lvl ${lvl}` : "Locked"}
                  </p>
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

// ---------- Main App Component ----------
const TABS = [
  { key: "home", label: "Home", icon: <HomeIcon className="w-6 h-6" /> },
  { key: "groups", label: "Groups", icon: <Users className="w-6 h-6" /> },
  { key: "ranking", label: "Ranking", icon: <Trophy className="w-6 h-6" /> },
  { key: "challenges", label: "Challenges", icon: <CalendarDays className="w-6 h-6" /> },
  { key: "profile", label: "Profile", icon: <User className="w-6 h-6" /> },
];

export default function App() {
  const [tab, setTab] = useState("home");
  
  // Groups state
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [joinedIds, setJoinedIds] = useState([]);
  
  // Modals
  const [previewUserData, setPreviewUserData] = useState(null);
  const [activeBadgeId, setActiveBadgeId] = useState(null);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Form states
  const [wTime, setWTime] = useState("32:10");
  const [wHR, setWHR] = useState(145);
  const [wPoints, setWPoints] = useState(84);
  const [wCals, setWCals] = useState(230);
  const [usernameInput, setUsernameInput] = useState(DUMMY_USER.name);
  const [notificationsOn, setNotificationsOn] = useState(true);

  const saveWorkout = () => {
    const [mm, ss] = (wTime || "0:0").split(":");
    const secs = (parseInt(mm, 10) || 0) * 60 + (parseInt(ss, 10) || 0);
    DUMMY_USER.lastWorkout = { 
      time: secs, 
      heartRate: parseInt(wHR, 10) || 0, 
      points: parseInt(wPoints, 10) || 0, 
      calories: parseInt(wCals, 10) || 0 
    };
    DUMMY_USER.weeklyPoints += parseInt(wPoints, 10) || 0;
    DUMMY_USER.xp = (DUMMY_USER.xp || 0) + (parseInt(wPoints, 10) || 0);
    while (DUMMY_USER.xp >= DUMMY_USER.nextLevelXp) {
      DUMMY_USER.xp -= DUMMY_USER.nextLevelXp;
      DUMMY_USER.level += 1;
      DUMMY_USER.nextLevelXp = Math.round(DUMMY_USER.nextLevelXp * 1.1);
    }
    setWorkoutOpen(false);
  };

  const saveSettings = () => {
    DUMMY_USER.name = usernameInput.trim() || DUMMY_USER.name;
    setSettingsOpen(false);
  };

  const renderCurrentTab = () => {
    switch(tab) {
      case "home": 
        return <Home onStartWorkout={() => setWorkoutOpen(true)} />;
      case "groups": 
        return <Groups groups={groups} setGroups={setGroups} joinedIds={joinedIds} setJoinedIds={setJoinedIds} />;
      case "ranking": 
        return <Ranking onPreviewUser={(row) => setPreviewUserData(row)} />;
      case "challenges": 
        return <Challenges />;
      case "profile": 
        return <Profile onOpenBadge={(id) => setActiveBadgeId(id)} onOpenSettings={() => { setUsernameInput(DUMMY_USER.name); setSettingsOpen(true); }} />;
      default: 
        return <Home onStartWorkout={() => setWorkoutOpen(true)} />;
    }
  };

  return (
    <div className="app-container">
      {renderCurrentTab()}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <ul className="nav-list">
          {TABS.map(t => (
            <li key={t.key} className="nav-item">
              <button
                onClick={() => setTab(t.key)}
                className={`nav-button ${
                  tab === t.key ? "nav-button-active" : "nav-button-inactive"
                }`}
              >
                {t.icon}
                <span className="nav-label">{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Preview Modal */}
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
              <div className="grid-3 gap-3">
                <Card><div className="text-center"><div className="text-xs text-slate-400">Points</div><div className="text-lg font-semibold">{points}</div></div></Card>
                <Card><div className="text-center"><div className="text-xs text-slate-400">Badges</div><div className="text-lg font-semibold">{badgesCount}</div></div></Card>
                <Card><div className="text-center"><div className="text-xs text-slate-400">Level</div><div className="text-lg font-semibold">{level}</div></div></Card>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Badge Info Modal */}
      <Modal open={!!activeBadgeId} onClose={() => setActiveBadgeId(null)} title="Badge Info" size="sm">
        {activeBadgeId && (() => {
          const badge = ALL_BADGES.find(b => b.id === activeBadgeId);
          const owned = new Map(DUMMY_USER.badges.map(b => [b.id, b.level]));
          const isUnlocked = owned.has(activeBadgeId);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-3 ${isUnlocked ? "btn-primary" : "bg-white/10 text-slate-200"}`}>
                  {badge?.icon}
                </div>
                <div>
                  <p className="font-semibold">{badge?.name}</p>
                  <p className="text-slate-400 text-sm">{isUnlocked ? "Freigeschaltet" : "Gesperrt"}</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Sammle diesen Badge durch passende Aktivitäten und erreiche verschiedene Level.
              </p>
            </div>
          );
        })()}
      </Modal>

      {/* Workout Modal */}
      <Modal open={workoutOpen} onClose={() => setWorkoutOpen(false)} title="Create Workout" size="md">
        <div className="space-y-3">
          <div className="grid-2 gap-3">
            <label className="form-label">Time (mm:ss)
              <input value={wTime} onChange={e=>setWTime(e.target.value)} className="form-input mt-1" />
            </label>
            <label className="form-label">Heart Rate (bpm)
              <input type="number" value={wHR} onChange={e=>setWHR(e.target.value)} className="form-input mt-1" />
            </label>
            <label className="form-label">Points
              <input type="number" value={wPoints} onChange={e=>setWPoints(e.target.value)} className="form-input mt-1" />
            </label>
            <label className="form-label">Calories
              <input type="number" value={wCals} onChange={e=>setWCals(e.target.value)} className="form-input mt-1" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={()=>setWorkoutOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={saveWorkout} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" size="sm">
        <div className="space-y-3">
          <label className="form-label">Username
            <input value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} className="form-input mt-1" />
          </label>
          <label className="flex items-center justify-between form-label">
            <span>Benachrichtigungen</span>
            <button 
              onClick={()=>setNotificationsOn(v=>!v)} 
              className={`toggle ${notificationsOn ? 'toggle-active' : 'toggle-inactive'}`}
            >
              <span className={`toggle-thumb ${notificationsOn ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setSettingsOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={saveSettings} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}