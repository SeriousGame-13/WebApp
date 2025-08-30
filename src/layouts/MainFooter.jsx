
import React, { useState, useEffect } from "react";
import { Trophy, Users, Home as HomeIcon, User, CalendarDays, Flame, Star, Moon, Settings, Search, Plus, Check, X, Dumbbell, Bike, HeartPulse, Activity, Info, Medal } from "lucide-react";

const TABS = [
  { key: "home", label: "Home", icon: <HomeIcon className="w-6 h-6" /> },
  { key: "groups", label: "Groups", icon: <Users className="w-6 h-6" /> },
  { key: "rankings", label: "Ranking", icon: <Trophy className="w-6 h-6" /> },
  { key: "challenges", label: "Challenges", icon: <CalendarDays className="w-6 h-6" /> },
  { key: "user", label: "Profile", icon: <User className="w-6 h-6" /> },
];

function Footer({ selectedIcon, onIconSelect }) {

    return (
        <footer className="AppFooter">
            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'home' ? 'var(--main-color)' : 'var(--text-secondary)' }}
                onClick={() => onIconSelect('home')}>
                <IconElements.HomeIcon />
                <div className='IconName' style={{ color: selectedIcon === 'home' ? 'var(--main-color)' : 'var(--text-secondary)' }}>
                    HOME
                </div>
            </div>

            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'ranking' ? 'var(--main-color)' : 'var(--text-secondary)' }}
                onClick={() => onIconSelect('ranking')}>
                <IconElements.RankingIcon />
                <div className='IconName' style={{ color: selectedIcon === 'ranking' ? 'var(--main-color)' : 'var(--text-secondary)' }}>
                    RANKING
                </div>
            </div>

            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'challenge' ? 'var(--main-color)' : 'var(--text-secondary)' }}
                onClick={() => onIconSelect('challenge')}>
                <IconElements.ChallengeIcon />
                <div className='IconName' style={{ color: selectedIcon === 'challenge' ? 'var(--main-color)' : 'var(--text-secondary)' }}>
                    CHALLENGE
                </div>
            </div>

            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'group' ? 'var(--main-color)' : 'var(--text-secondary)' }}
                onClick={() => onIconSelect('group')}>
                <IconElements.GroupIcon />
                <div className='IconName' style={{ color: selectedIcon === 'group' ? 'var(--main-color)' : 'var(--text-secondary)' }}>
                    GROUP
                </div>
            </div>

            <div className='FooterIconbox'
                style={{ color: selectedIcon === 'user' ? 'var(--main-color)' : 'var(--text-secondary)' }}
                onClick={() => onIconSelect('user')}>
                <IconElements.UserIcon />
                <div className='IconName' style={{ color: selectedIcon === 'user' ? 'var(--main-color)' : 'var(--text-secondary)' }}>
                    USER
                </div>
            </div>
        </footer>
    );
}

function newFooter({tab, setTab}) {
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
    Footer,
    newFooter
};

export default MainFooter