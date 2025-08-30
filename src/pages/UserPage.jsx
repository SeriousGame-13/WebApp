import React, { useState, useEffect } from 'react';
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";
import ProfileImageElements from '../utils/profileImageManager';
import DatamanagerElements from '../utils/dataManager';
import BadgeManagement from '../services/firebase/BadgeManagement';
import FirebaseManager from '../services/firebase/FirestoreManager';
import FireAuthManager from '../services/firebase/FirebaseAuthenticationManager';
import { USERS_COLLECTION } from '../services/firebase/collections';
import '../sphere-styles.css';

// ---------- Helper Components ----------
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

// ---------- Profile Avatar Component ----------
function ProfileAvatar({ user, size = 48 }) {
  const [profileImage, setProfileImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const loadProfileImage = async () => {
      setImageLoading(true);
      try {
        // This will handle the profile image loading automatically
        // We just need to set a state to trigger re-render when it's loaded
        setImageLoading(false);
      } catch (error) {
        console.error('Profile image loading error:', error);
        setImageLoading(false);
      }
    };

    loadProfileImage();
  }, [user?.uid]);

  if (!user?.uid) {
    // Fallback to Avatar component if no user
    return <Avatar name={user?.name || user?.displayName} size={size} seed={user?.id || 'default'} />;
  }

  return (
    <div style={{ width: size, height: size }} className="flex-shrink-0">
      <DatamanagerElements.ProfileImageDisplay 
        userId={user.uid} 
        imageclass={`w-full h-full rounded-full object-cover`}
        style={{ width: size, height: size }}
      />
    </div>
  );
}

function HeartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21s-7.5-4.35-10-8.57C-.66 7.66 2.1 3 6.6 3c2.17 0 3.76 1.1 4.4 2.17C11.64 4.1 13.23 3 15.4 3 19.9 3 22.66 7.66 22 12.43 19.5 16.65 12 21 12 21z"/>
    </svg>
  );
}

function badgeLevelColor(level) {
  if (level === 3) return "badge-level-3";
  if (level === 2) return "badge-level-2";
  return "badge-level-1";
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

function Modal({ open, onClose, children, title, size = "md" }) {
  if (!open) return null;
  const maxW = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-xl" : "max-w-lg";
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className={`modal-content card ${maxW}`}>
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

// ---------- Badge Data ----------
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

// ---------- Badge Detail Modal ----------
function BadgeDetailModal({ badgeId, open, onClose, allBadges, userBadgesMap }) {
  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !badgeId) return;

    setLoading(true);
    try {
      // Find badge from allBadges array
      const foundBadge = allBadges.find(b => (b.id || b.badgeId) === badgeId);
      setBadge(foundBadge || null);
    } catch (error) {
      console.error('Failed to load badge details:', error);
      setBadge(null);
    } finally {
      setLoading(false);
    }
  }, [badgeId, open, allBadges]);

  if (!open) return null;

  const userBadgeLevel = userBadgesMap?.get(badgeId);
  const unlocked = !!userBadgeLevel;

  return (
    <Modal open={open} onClose={onClose} title="Badge Details" size="sm">
      <div className="p-4">
        {loading ? (
          <div className="text-center text-slate-400 py-4">Loading...</div>
        ) : badge ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className={`p-4 rounded-xl ${unlocked ? badgeLevelColor(userBadgeLevel) : "badge-locked"}`}>
                {badge.icon}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{badge.name}</h3>
              {badge.description ? (
                <p className="text-sm text-slate-400 mt-2">{badge.description}</p>
              ) : (
                <p className="text-sm text-slate-400 mt-2">
                  Complete specific challenges to unlock and upgrade this badge.
                </p>
              )}
              {badge.rarity && (
                <p className="text-xs text-slate-500 mt-1 capitalize">
                  Rarity: {badge.rarity}
                </p>
              )}
              {unlocked && (
                <p className="text-sm text-green-400 mt-2 font-medium">
                  Unlocked - Level {userBadgeLevel}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-400 py-4">Badge not found</div>
        )}
      </div>
    </Modal>
  );
}

// ---------- Settings Modal ----------
function SettingsModal({ open, onClose, user, onUserUpdated }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    if (open && user) {
      setNewName(user.displayName || user.name || '');
    }
  }, [open, user]);

  const handleNameSave = async () => {
    if (!newName.trim() || !user?.uid) return;
    
    setIsSavingName(true);
    try {
      // Update Firebase Auth profile first
      const currentAuthUser = FireAuthManager.getCurrentUser();
      if (currentAuthUser) {
        await FireAuthManager.updateUserProfile(currentAuthUser, { 
          displayName: newName.trim() 
        });
      }

      // Update Firestore document
      await FirebaseManager.updateDocument(USERS_COLLECTION, user.uid, {
        displayName: newName.trim()
      }, true);
      
      setIsEditingName(false);
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (error) {
      console.error('Failed to update name:', error);
      alert('Failed to update name: ' + error.message);
    } finally {
      setIsSavingName(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Settings" size="md">
      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Profile</h3>
          
          <div className="card p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {user?.uid && <ProfileImageElements.ProfileImageUploader userId={user.uid} />}
              </div>
              <div className="flex-1 space-y-3">
                {/* Name Edit */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Name:</label>
                  {isEditingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="form-input flex-1"
                        placeholder="Enter your name"
                        maxLength={50}
                        disabled={isSavingName}
                      />
                      <button
                        onClick={handleNameSave}
                        disabled={!newName.trim() || isSavingName}
                        className="btn-primary px-3"
                      >
                        {isSavingName ? '...' : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        disabled={isSavingName}
                        className="btn-secondary px-3"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{user?.displayName || user?.name}</p>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="btn-secondary text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Other Info */}
                <div className="space-y-1 text-sm text-slate-300">
                  <p>E-mail: {user?.email}</p>
                  <p>Level: {user?.level}</p>
                  <p>Points: {user?.points}</p>
                  {user?.longestStreak && (
                    <p>Max Streak: {user.longestStreak}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Preferences</h3>
          <div className="card p-4">
            <p className="text-slate-400 text-sm">
              Additional settings will be added here.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Main Page Component ----------
function Page({ data, onOpenBadge, onOpenSettings, onUserUpdated }) {
  const [allBadges, setAllBadges] = useState([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const [selectedBadgeId, setSelectedBadgeId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Use real user data if available, fallback to dummy data
  const userData = data || {
    id: "me",
    name: "Max Mustermann",
    displayName: "Max Mustermann",
    level: 5,
    badges: [
      { id: "sleep", level: 2 },
      { id: "stars", level: 3 },
      { id: "calories", level: 1 },
      { id: "steps", level: 2 },
    ],
  };

  // Create a map of user's badges for quick lookup
  const userBadgesMap = new Map();
  if (userData.badges && Array.isArray(userData.badges)) {
    userData.badges.forEach(badge => {
      const badgeId = badge.id || badge.badgeId;
      if (badgeId) {
        userBadgesMap.set(badgeId, badge.level || 1);
      }
    });
  }

  const ownedCount = userBadgesMap.size;

  // Load all badges from Firebase
  useEffect(() => {
    const loadAllBadges = async () => {
      try {
        setIsLoadingBadges(true);
        
        // Try to load all badges from Firebase
        let firebaseBadges = [];
        try {
          firebaseBadges = await BadgeManagement.getAllBadges();
        } catch (error) {
          console.warn('Failed to load badges from Firebase:', error);
        }

        // Merge Firebase badges with static badges
        const badgeMap = new Map();
        
        // Add static badges first
        ALL_BADGES.forEach(badge => {
          badgeMap.set(badge.id, {
            id: badge.id,
            name: badge.name,
            icon: badge.icon,
            source: 'static'
          });
        });

        // Override/add Firebase badges
        if (firebaseBadges && firebaseBadges.length > 0) {
          firebaseBadges.forEach(badge => {
            const badgeId = badge.badgeId || badge.id;
            if (badgeId) {
              // Find corresponding static badge for icon
              const staticBadge = ALL_BADGES.find(sb => sb.id === badgeId);
              badgeMap.set(badgeId, {
                id: badgeId,
                badgeId: badge.badgeId,
                name: badge.name,
                icon: staticBadge?.icon || <Star className="w-5 h-5" />,
                rarity: badge.rarity,
                description: badge.description,
                source: 'firebase'
              });
            }
          });
        }

        // Convert map to array and sort
        const finalBadges = Array.from(badgeMap.values()).sort((a, b) => {
          // Put owned badges first
          const aOwned = userBadgesMap.has(a.id);
          const bOwned = userBadgesMap.has(b.id);
          if (aOwned && !bOwned) return -1;
          if (!aOwned && bOwned) return 1;
          return a.name.localeCompare(b.name);
        });

        setAllBadges(finalBadges);
      } catch (error) {
        console.error('Failed to load badges:', error);
        // Fallback to static badges only
        setAllBadges(ALL_BADGES);
      } finally {
        setIsLoadingBadges(false);
      }
    };

    loadAllBadges();
  }, [userData.badges]);

  const total = allBadges.length;

  const handleBadgeClick = (badgeId) => {
    setSelectedBadgeId(badgeId);
    if (onOpenBadge) {
      onOpenBadge(badgeId);
    }
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
    if (onOpenSettings) {
      onOpenSettings();
    }
  };

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ProfileAvatar user={userData} size={48} />
        <div>
          <h1 className="screen-title">{userData.name || userData.displayName}</h1>
          <p className="screen-subtitle">Level {userData.level}</p>
        </div>
      </div>
      <button 
        onClick={handleSettingsClick} 
        className="btn-secondary text-sm flex items-center gap-2"
      >
        <Settings className="w-4 h-4" /> Settings
      </button>
    </div>
  );

  return (
    <>
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

        {isLoadingBadges ? (
          <div className="text-center text-slate-400 py-4">
            Loading badges...
          </div>
        ) : (
          <div className="grid-3">
            {allBadges.map((badge) => {
              const badgeId = badge.id || badge.badgeId;
              const userBadgeLevel = userBadgesMap.get(badgeId);
              const unlocked = !!userBadgeLevel;
              
              return (
                <Card key={badgeId} onClick={() => handleBadgeClick(badgeId)}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-xl ${unlocked ? badgeLevelColor(userBadgeLevel) : "badge-locked"}`}>
                      {badge.icon}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium truncate" style={{ maxWidth: '8rem' }}>
                        {badge.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {unlocked ? `Lvl ${userBadgeLevel}` : "Locked"}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <p className="text-slate-400 text-xs mt-3">Tippe auf ein Badge für Details.</p>
      </Screen>

      {/* Badge Detail Modal */}
      <BadgeDetailModal 
        badgeId={selectedBadgeId}
        open={!!selectedBadgeId}
        onClose={() => setSelectedBadgeId(null)}
        allBadges={allBadges}
        userBadgesMap={userBadgesMap}
      />

      {/* Settings Modal */}
      <SettingsModal 
        open={showSettings}
        onClose={() => setShowSettings(false)}
        user={userData}
        onUserUpdated={onUserUpdated}
      />
    </>
  );
}

// ---------- Legacy newProfile component for backward compatibility ----------
function newProfile({ onOpenBadge, onOpenSettings }) {
  return <Page onOpenBadge={onOpenBadge} onOpenSettings={onOpenSettings} />;
}

const UserPageElements = {
  Page,
  newProfile
};

export default UserPageElements;