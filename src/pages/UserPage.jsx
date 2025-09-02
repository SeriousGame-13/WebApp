import { Activity, Bike, CalendarDays, Check, Dumbbell, Flame, HeartPulse, Medal, Moon, Settings, Star, Trophy, Users, X } from "lucide-react";
import { useEffect, useState } from 'react';
import '../components/styles/sphere-styles.css';
import { Avatar, Card, Modal, Screen } from '../components/ui/UIComponents';
import BadgeManagement from '../services/BadgeManagement.jsx';
import FireAuthManager from '../services/firebase/FirebaseAuthenticationManager.jsx';
import FirestoreManager from '../services/firebase/FirestoreManager.jsx';
import { USERS_COLLECTION } from '../services/firebase/Collections.jsx';
import ProfileImageElements from '../components/ui/ProfileImageManager.jsx';


//TODO Refactor!!!!!!!!!!!!!!!!!!!!!!!
function HeartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21s-7.5-4.35-10-8.57C-.66 7.66 2.1 3 6.6 3c2.17 0 3.76 1.1 4.4 2.17C11.64 4.1 13.23 3 15.4 3 19.9 3 22.66 7.66 22 12.43 19.5 16.65 12 21 12 21z"/>
    </svg>
  );
}

//TODO Refactor
function Legend({ userBadgesMap, allBadges }) {
  // Count badges by rarity that the user has unlocked
  const rarityCount = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  };

  allBadges.forEach(badge => {
    const badgeId = badge.id || badge.badgeId;
    if (userBadgesMap && userBadgesMap.has(badgeId)) {
      const rarity = badge.rarity?.toLowerCase() || 'common';
      if (Object.prototype.hasOwnProperty.call(rarityCount, rarity)) {
        rarityCount[rarity]++;
      }
    }
  });

  const item = (label, count, color) => (
    <div className="flex items-center gap-2">
      <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: color }} />
      <span className="text-xs text-slate-300">{label}: {count}</span>
    </div>
  );
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        {item("Common", rarityCount.common, '#808080')}
        {item("Uncommon", rarityCount.uncommon, '#1eff00')}
        {item("Rare", rarityCount.rare, '#0070dd')}
      </div>
      <div className="flex items-center gap-4">
        {item("Epic", rarityCount.epic, '#a335ee')}
        {item("Legendary", rarityCount.legendary, '#ff8000')}
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

// ---------- Badge Item Component ----------
function BadgeItem({ badge, userBadgeLevel, onClick }) {
  const [badgeImage, setBadgeImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const loadBadgeImage = async () => {
      if (!badge?.badgeId) {
        setImageLoading(false);
        return;
      }

      setImageLoading(true);
      try {
        const imageBase64 = await BadgeManagement.getBadgeImage(badge.badgeId);
        setBadgeImage(imageBase64);
      } catch (error) {
        console.error('Failed to load badge image:', error);
        setBadgeImage(null);
      } finally {
        setImageLoading(false);
      }
    };

    loadBadgeImage();
  }, [badge?.badgeId]);

  const badgeId = badge.id || badge.badgeId;
  const unlocked = !!userBadgeLevel;

  // Fallback to static icon if no image
  const staticBadge = ALL_BADGES.find(sb => sb.id === badgeId);
  
  // Get rarity color
  const getRarityColor = (rarity) => {
    const colors = {
      'common': '#808080',
      'uncommon': '#1eff00', 
      'rare': '#0070dd',
      'epic': '#a335ee',
      'legendary': '#ff8000'
    };
    return colors[rarity?.toLowerCase()] || colors.common;
  };

  // Get rarity style class
  const getRarityClass = (rarity) => {
    if (!unlocked) return "badge-locked";
    
    const rarityClasses = {
      'common': "badge-level-1",
      'uncommon': "badge-level-2", 
      'rare': "badge-level-3",
      'epic': "badge-level-3",
      'legendary': "badge-level-3"
    };
    return rarityClasses[rarity?.toLowerCase()] || "badge-level-1";
  };
  
  return (
    <Card onClick={() => onClick(badgeId)}>
      <div className="flex flex-col items-center gap-2">
        <div className={`p-3 rounded-xl ${getRarityClass(badge.rarity)}`}>
          {imageLoading ? (
            <div className="w-5 h-5 bg-slate-600 rounded animate-pulse" />
          ) : badgeImage ? (
            <img 
              src={badgeImage} 
              alt={badge.name}
              className="w-5 h-5 object-contain"
            />
          ) : staticBadge?.icon ? (
            staticBadge.icon
          ) : (
            <Star className="w-5 h-5" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium truncate" style={{ maxWidth: '8rem' }}>
            {badge.name}
          </p>
          <p 
            className="text-xs font-medium truncate capitalize" 
            style={{ 
              maxWidth: '8rem',
              color: unlocked ? getRarityColor(badge.rarity) : '#9CA3AF'
            }}
          >
            {unlocked ? (badge.rarity || 'Common') : "Locked"}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ---------- Badge Detail Modal ----------
function BadgeDetailModal({ badgeId, open, onClose, allBadges, userBadgesMap }) {
  const [badge, setBadge] = useState(null);
  const [badgeImage, setBadgeImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !badgeId) return;

    const loadBadgeDetails = async () => {
      setLoading(true);
      try {
        // Find badge from allBadges array
        const foundBadge = allBadges.find(b => (b.id || b.badgeId) === badgeId);
        setBadge(foundBadge || null);

        // Load badge image if it's a Firebase badge
        if (foundBadge?.badgeId) {
          try {
            const imageBase64 = await BadgeManagement.getBadgeImage(foundBadge.badgeId);
            setBadgeImage(imageBase64);
          } catch (error) {
            console.error('Failed to load badge image:', error);
            setBadgeImage(null);
          }
        }
      } catch (error) {
        console.error('Failed to load badge details:', error);
        setBadge(null);
      } finally {
        setLoading(false);
      }
    };

    loadBadgeDetails();
  }, [badgeId, open, allBadges]);

  if (!open) return null;

  const userBadgeLevel = userBadgesMap?.get(badgeId);
  const unlocked = !!userBadgeLevel;

  // Fallback to static icon
  const staticBadge = ALL_BADGES.find(sb => sb.id === badgeId);

  // Get rarity color
  const getRarityColor = (rarity) => {
    const colors = {
      'common': '#808080',
      'uncommon': '#1eff00', 
      'rare': '#0070dd',
      'epic': '#a335ee',
      'legendary': '#ff8000'
    };
    return colors[rarity?.toLowerCase()] || colors.common;
  };

  // Get rarity style class
  const getRarityClass = (rarity) => {
    if (!unlocked) return "badge-locked";
    
    const rarityClasses = {
      'common': "badge-level-1",
      'uncommon': "badge-level-2", 
      'rare': "badge-level-3",
      'epic': "badge-level-3",
      'legendary': "badge-level-3"
    };
    return rarityClasses[rarity?.toLowerCase()] || "badge-level-1";
  };

  return (
    <Modal open={open} onClose={onClose} title={badge?.name || "Badge Details"} size="md">
      <div className="p-4">
        {loading ? (
          <div className="text-center text-slate-400 py-4">Loading...</div>
        ) : badge ? (
          <div className="space-y-4">
            {/* Badge Header */}
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${getRarityClass(badge.rarity)}`}>
                {badgeImage ? (
                  <img 
                    src={badgeImage} 
                    alt={badge.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : staticBadge?.icon ? (
                  staticBadge.icon
                ) : (
                  <Star className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className="text-lg Badge-title font-semibold text-white">{badge.name}</h3>
                <p className="text-sm Badge-subtitle text-slate-400">
                  {unlocked ? "Freigeschaltet" : "Gesperrt"}
                </p>
              </div>
            </div>

            {/* Badge Description */}
            {badge.description && (
              <p className="text-sm Badge-subtitle text-slate-300">{badge.description}</p>
            )}

            {/* Badge Info */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              {badge.rarity && (
                <p 
                  className="text-sm font-medium capitalize"
                  style={{ color: getRarityColor(badge.rarity) }}
                >
                  {badge.rarity} Badge
                </p>
              )}
              {badge.rewardPoints && (
                <p className="text-xs text-slate-500">
                  Belohnungspunkte: {badge.rewardPoints}
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
      await FirestoreManager.updateDocument(USERS_COLLECTION, user.uid, {
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

  const handleDeleteAccount = async () => {
    if (window.confirm('Bist du sicher, dass du dein Konto löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        // await FirestoreManager.deleteAllData();
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

        {/* Danger Zone */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-500">Danger Zone</h3>
          <div className="card p-4 bg-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-red-400">Konto löschen</p>
                <p className="text-sm text-slate-400">
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten werden dauerhaft entfernt.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="btn-danger text-sm"
              >
                Löschen
              </button>
            </div>
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

  console.log('UserPage executing with data:', data);

    // Use real user data if available, fallback to dummy data  
    const userData = data || {
    id: "me",
    name: "Max Mustermann",
    displayName: "Max Mustermann",
    level: 5
    };

    console.log('Final userData:', userData);

    // Load user badges from Firebase
    const [userBadgesMap, setUserBadgesMap] = useState(new Map());
    const [ownedCount, setOwnedCount] = useState(0);

    useEffect(() => {
    const loadUserBadges = async () => {
        if (!userData.uid) return;
        
        try {
        console.log('Loading badges for:', userData.uid);
        const snapshot = await FirestoreManager.getAllDocuments(`${USERS_COLLECTION}/${userData.uid}/ubadges`);
        const badgesMap = new Map();
        
        snapshot.forEach(doc => {
            const badgeData = doc.data();
            console.log('Badge data:', badgeData);
            if (badgeData.badgeId) {
            badgesMap.set(badgeData.badgeId, badgeData.level || 1);
            }
        });
        
        console.log('Final badges map:', badgesMap);
        setUserBadgesMap(badgesMap);
        setOwnedCount(badgesMap.size);
        } catch (error) {
        console.error('Failed to load user badges:', error);
        }
    };
    
    loadUserBadges();
    }, [userData.uid]);

  // Load all badges from Firebase
  useEffect(() => {
    const loadAllBadges = async () => {
      try {
        setIsLoadingBadges(true);
        
        // Load all badges from Firebase
        const firebaseBadges = await BadgeManagement.getAllBadges();
        
        if (firebaseBadges && firebaseBadges.length > 0) {
          // Use Firebase badges
          const sortedBadges = firebaseBadges.sort((a, b) => {
            // Put owned badges first
            const badgeIdA = a.id || a.badgeId;
            const badgeIdB = b.id || b.badgeId;
            const aOwned = userBadgesMap.has(badgeIdA);
            const bOwned = userBadgesMap.has(badgeIdB);
            if (aOwned && !bOwned) return -1;
            if (!aOwned && bOwned) return 1;
            return a.name.localeCompare(b.name);
          });
          
          setAllBadges(sortedBadges);
        } else {
          // Fallback to static badges if no Firebase badges
          console.warn('No badges found in Firebase, using static badges');
          const sortedStaticBadges = ALL_BADGES.sort((a, b) => {
            const aOwned = userBadgesMap.has(a.id);
            const bOwned = userBadgesMap.has(b.id);
            if (aOwned && !bOwned) return -1;
            if (!aOwned && bOwned) return 1;
            return a.name.localeCompare(b.name);
          });
          setAllBadges(sortedStaticBadges);
        }
      } catch (error) {
        console.error('Failed to load badges:', error);
        // Fallback to static badges on error
        const sortedStaticBadges = ALL_BADGES.sort((a, b) => {
          const aOwned = userBadgesMap.has(a.id);
          const bOwned = userBadgesMap.has(b.id);
          if (aOwned && !bOwned) return -1;
          if (!aOwned && bOwned) return 1;
          return a.name.localeCompare(b.name);
        });
        setAllBadges(sortedStaticBadges);
      } finally {
        setIsLoadingBadges(false);
      }
    };

    loadAllBadges();
  }, [userData.badges, userBadgesMap]);

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
        <div className="relative" style={{ width: 48, height: 48 }}>
          <ProfileImageElements.ProfileImageDisplay 
            userId={userData.uid} 
            imageclass="w-full h-full rounded-full object-cover"
            style={{ width: 48, height: 48 }}
          />
          {!userData.uid && (
            <Avatar name={userData.name || userData.displayName} size={48} seed={userData.id || 'default'} />
          )}
        </div>
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
            <Legend userBadgesMap={userBadgesMap} allBadges={allBadges} />
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
              
              return (
                <BadgeItem
                  key={badgeId}
                  badge={badge}
                  userBadgeLevel={userBadgeLevel}
                  onClick={handleBadgeClick}
                />
              );
            })}
          </div>
        )}
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

const UserPageElements = {
  Page,
};

export default UserPageElements;