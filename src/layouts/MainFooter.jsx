
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";

const TABS = [
  { key: "home", label: "Home", icon: <HomeIcon className="w-6 h-6" /> },
  { key: "groups", label: "Groups", icon: <Users className="w-6 h-6" /> },
  { key: "rankings", label: "Ranking", icon: <Trophy className="w-6 h-6" /> },
  { key: "challenges", label: "Challenges", icon: <CalendarDays className="w-6 h-6" /> },
  { key: "user", label: "Profile", icon: <User className="w-6 h-6" /> },
];

function Footer({tab, setTab}) {
    return <nav className="bottom-nav">
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

}

const MainFooter = {
    Footer
};

export default MainFooter