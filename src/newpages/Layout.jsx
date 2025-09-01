import React, { useMemo, useState } from "react";
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";

import Challenges from "./ChallengePage";
import Groups from "./GroupPage";
import Home from "./HomePage";
import LoginPage from "./LoginPage";
import Profile from "./ProfilePage";
import Ranking from "./RankingPage";
import Helper from "./Helper.jsx"

import './sphere-styles.css';



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


// ---------- Screen Components ----------
const TABS = [
  { key: "home", label: "Home", icon: <HomeIcon className="w-6 h-6" /> },
  { key: "groups", label: "Groups", icon: <Users className="w-6 h-6" /> },
  { key: "ranking", label: "Ranking", icon: <Trophy className="w-6 h-6" /> },
  { key: "challenges", label: "Challenges", icon: <CalendarDays className="w-6 h-6" /> },
  { key: "profile", label: "Profile", icon: <User className="w-6 h-6" /> },
];

export default function Layout() {
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
      <Helper.Modal open={!!previewUserData} onClose={() => setPreviewUserData(null)} title="User" size="sm">
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
      </Helper.Modal>

      {/* Badge Info Modal */}
      <Helper.Modal open={!!activeBadgeId} onClose={() => setActiveBadgeId(null)} title="Badge Info" size="sm">
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
      </Helper.Modal>

      {/* Workout Modal */}
      <Helper.Modal open={workoutOpen} onClose={() => setWorkoutOpen(false)} title="Create Workout" size="md">
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
      </Helper.Modal>

      {/* Settings Modal */}
      <Helper.Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" size="sm">
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
      </Helper.Modal>
    </div>
  );
}