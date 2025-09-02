import '../styles/ExpBar.css';
import { Card } from './UIComponents.jsx';


export function ProgressBar({ current, max }) {
    const progress = Math.min((current / max) * 100, 100);

    return (
        <div className="progress-bar">
            <div className="progress-bar">
                <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}

/**
 * Progress bar showing user's current level progress.
 * 
 * @component LevelProgressBar
 * @param {Object} props - Component props
 * @param {Object} props.userData - User data object
 * @param {number} props.userData.points - User's current points
 * @param {Function} props.userData.currentMaxPoints - Function returning max points for current level
 * @returns {JSX.Element} Level progress bar component
 */
export function LevelProgressBar({ userData }) {
  const progress = Math.min(100, Math.round(((userData.points || 0) / (userData.currentMaxPoints() || 1)) * 100));
  
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">Level Progress</span>
        <span className="text-slate-300 text-sm">{userData.points}/{userData.currentMaxPoints()} Points</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress < 0 ? 0 : progress}%` }} />
      </div>
    </Card>
  );
}