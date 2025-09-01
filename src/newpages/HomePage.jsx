import React, { useMemo, useState } from "react";
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";
import './sphere-styles.css';
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










export default function Home({ onStartWorkout }) {
  const { lastWorkout, name, level, xp, nextLevelXp } = DUMMY_USER;
  const progress = Math.min(100, Math.round(((xp || 0) / (nextLevelXp || 1)) * 100));
  const [stationOpen, setStationOpen] = useState(null);
  const currentStation = stationOpen ? STATIONS.find(s => s.id === stationOpen) : null;

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Helper.Avatar name={name} size={48} />
        <div>
          <h1 className="screen-title">{name}</h1>
          <p className="screen-subtitle">Level {level}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Helper.Screen titleNode={header}>
      <Helper.Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-sm">Level Progress</span>
          <span className="text-slate-300 text-sm">{xp}/{nextLevelXp} XP</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </Helper.Card>

      <div className="grid-2 mt-4">
        <Helper.Card><Helper.Stat label="TIME" value={Helper.secondsToClock(lastWorkout.time)} /></Helper.Card>
        <Helper.Card><Helper.Stat label="HEART RATE" value={<>{lastWorkout.heartRate} bpm</>} /></Helper.Card>
        <Helper.Card><Helper.Stat label="POINTS" value={lastWorkout.points} /></Helper.Card>
        <Helper.Card><Helper.Stat label="CALORIES" value={<>{lastWorkout.calories} kcal</>} /></Helper.Card>
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
            <Helper.Card key={s.id} onClick={() => Helper.setStationOpen(s.id)}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-3">{s.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-slate-400 text-sm">Letzte Aktivität: {s.last.date}</p>
                </div>
                <Info className="w-4 h-4 text-slate-400" />
              </div>
            </Helper.Card>
          ))}
        </div>
      </div>

      <Helper.Modal open={!!currentStation} onClose={() => Helper.setStationOpen(null)} title={currentStation?.name} size="sm">
        {currentStation && (
          <div className="space-y-3">
            <div className="grid-2 gap-3">
              <Helper.Card><Helper.Stat label="TIME" value={Helper.secondsToClock(currentStation.last.time)} /></Helper.Card>
              <Helper.Card><Helper.Stat label="HR" value={`${currentStation.last.heartRate} bpm`} /></Helper.Card>
              <Helper.Card><Helper.Stat label="POINTS" value={currentStation.last.points} /></Helper.Card>
              <Helper.Card><Helper.Stat label="CAL" value={`${currentStation.last.calories} kcal`} /></Helper.Card>
            </div>
            <p className="text-slate-400 text-sm">Zuletzt am {currentStation.last.date}</p>
          </div>
        )}
      </Helper.Modal>
    </Helper.Screen>
  );
}