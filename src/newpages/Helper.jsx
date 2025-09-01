import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";

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
      <span className="text-xl font-semibold text-slate-100">{value}</span>
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

const Helper = {
    Legend,
    Pill,
    Stat,
    Screen,
    Background,
    Card,
    Modal,badgeLevelColor,
    secondsToClock, 
    HeartIcon, 
    Avatar, 
    initials,
}

export default Helper;