import React, { useMemo, useState } from "react";
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";
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











export default function Ranking({ onPreviewUser }) {
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