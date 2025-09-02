import {ProfileAvatar} from './ProfileAvatar.jsx';

/**
 * User header with avatar, name, and level display.
 * 
 * @component UserHeader
 * @param {Object} props - Component props
 * @param {Object} props.userData - User data object
 * @param {string} props.userData.displayName - User's display name
 * @param {string} props.userData.photoURL - User's profile photo URL (passed as image prop to Avatar)
 * @param {number} props.userData.level - User's current level
 * @param {string} props.userData.uid - User's unique identifier (used as seed for Avatar)
 * @returns {JSX.Element} User header component
 */
export function UserHeader({ userData}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ProfileAvatar name={userData.displayName} userId={userData.uid} size={48} seed={userData.uid} />
        <div>
          <h1 className="screen-title">{userData.displayName?.split(' ')[0] || 'User'}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="user-stats text-right">
          <div className="user-stats text-right">
            <div>
              <div className="stat-label">Level</div>
                <div className="stat-value">{userData.level}</div>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
}