//new
import React, { useState, useEffect } from "react";
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";
import './sphere-styles.css';

import UserPage from '../pages/UserPage';
import HomePage from '../pages/HomePage';
import RankingPage from '../pages/RankingPage';
import GroupPage from '../pages/GroupPage';
import ChallengePage from '../pages/ChallengePage';

// Import Firebase services
import FireAuthManager from './services/firebase/FirebaseAuthenticationManager';

/**
 * THE SPHERE — Complete Demo App (CSS version)
 * All components in one file for easy setup
 */



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


// ---------- Main App Component ----------
function App() {
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
        return <HomePage.Page onStartWorkout={() => setWorkoutOpen(true)} />;
      case "groups": 
        return <GroupPage.Page groups={groups} setGroups={setGroups} joinedIds={joinedIds} setJoinedIds={setJoinedIds} />;
      case "ranking": 
        return <RankingPage.Page onPreviewUser={(row) => setPreviewUserData(row)} />;
      case "challenges": 
        return <ChallengePage.Page />;
      case "profile": 
        return <UserPage.Page onOpenBadge={(id) => setActiveBadgeId(id)} onOpenSettings={() => { setUsernameInput(DUMMY_USER.name); setSettingsOpen(true); }} />;
      default: 
        return <HomePage.Page onStartWorkout={() => setWorkoutOpen(true)} />;
    }
  };

  return (
    <div className="app-container">
      {renderCurrentTab()}

      {/* Bottom Navigation */}
      {newFooter(tab)}

      

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