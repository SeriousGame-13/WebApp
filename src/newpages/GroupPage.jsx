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









export default function Groups({ groups, setGroups, joinedIds, setJoinedIds }) {
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
    <Helper.Screen title="Groups" subtitle={opened ? current?.name : "My Groups"}>
      {!opened && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <div className="search-container">
              <Helper.Search className="search-icon" />
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
              <Helper.Plus className="w-4 h-4" /> Create
            </button>
          </div>

          <div className="space-y-3">
            {filtered.map(g => (
              <Helper.Card key={g.id}>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/10 p-3">
                    <Helper.Users className="w-5 h-5" />
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
              </Helper.Card>
            ))}
          </div>

          <Helper.Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Group" size="sm">
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
          </Helper.Modal>
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
          
          <Helper.Card>
            <p className="text-slate-300 mb-2">{current.description}</p>
            <p className="text-slate-400 text-sm">Members: {current.members}</p>
          </Helper.Card>

          <div>
            <h4 className="mb-2 text-slate-200 font-semibold">Members</h4>
            <div className="space-y-2">
              {(current.memberIds || []).map((mid) => {
                const m = getUserById(mid);
                return (
                  <Helper.Card key={mid}>
                    <div className="flex items-center gap-3">
                      <Helper.Avatar name={m.name} size={36} seed={mid} />
                      <span className="font-medium">{m.name}</span>
                    </div>
                  </Helper.Card>
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
    </Helper.Screen>
  );
}