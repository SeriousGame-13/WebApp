import React, { useMemo, useState } from "react";
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";
import '../sphere-styles.css';
import Helper from "./Helper.jsx"


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

const ALL_BADGES = [
  { id: "sleep", name: "Sleep Master", icon: <Moon className="w-5 h-5" /> },
  { id: "stars", name: "Star Collector", icon: <Star className="w-5 h-5" /> },
  { id: "calories", name: "Calorie Burner", icon: <Flame className="w-5 h-5" /> },
  { id: "steps", name: "Step Up", icon: <Activity className="w-5 h-5" /> },
  { id: "focus", name: "Focus Wizard", icon: <Star className="w-5 h-5" /> },
  { id: "zone", name: "Zone Keeper", icon: <Helper.HeartIcon /> },
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





function Page ({ onOpenBadge, onOpenSettings }) {
  const u = DUMMY_USER;
  const owned = new Map(u.badges.map(b => [b.id, b.level]));
  const ownedCount = owned.size;
  const total = ALL_BADGES.length;

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Helper.Avatar name={u.name} size={48} seed={u.id} />
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
    <Helper.Screen titleNode={header}>
      <Helper.Card>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-300 text-sm">Badges gesammelt</p>
            <p className="text-xl font-semibold">{ownedCount} / {total}</p>
          </div>
          <Helper.Legend />
        </div>
      </Helper.Card>

      <div className="mt-4 mb-2 text-slate-400 text-xs">Badges</div>

      <div className="grid-3">
        {ALL_BADGES.map((b) => {
          const lvl = owned.get(b.id);
          const unlocked = !!lvl;
          return (
            <Helper.Card key={b.id} onClick={() => onOpenBadge(b.id)}>
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-xl ${unlocked ? Helper.badgeLevelColor(lvl) : "badge-locked"}`}>
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
            </Helper.Card>
          );
        })}
      </div>
      <p className="text-slate-400 text-xs mt-3">Tippe auf ein Badge für Details.</p>
    </Helper.Screen>
  );
}

const UserPageElements = {
    Page
};

export default UserPageElements;