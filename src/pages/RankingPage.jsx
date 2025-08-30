import { useState, useEffect } from 'react';
import RankingSystem from '../services/firebase/RankingSystem';
import StationManager from '../services/firebase/StationManagement';
import {Card, Modal, Legend, Pill,Screen,Stat} from '../components/ui/UIComponents';

import '../sphere-styles.css';

function newRanking({ onPreviewUser }) {
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

function Page({ data }) {
    const userData = data;
    const [rankings, setRankings] = useState([]);
    const [leaderboardType, setLeaderboardType] = useState('level');
    const [isLoading, setIsLoading] = useState(true);
    const [userRank, setUserRank] = useState(null);
    const [orientation, setOrientation] = useState('landscape');
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);

    useEffect(() => {
        const checkOrientation = () => {
            const isPortrait = window.innerHeight > window.innerWidth;
            setOrientation(isPortrait ? 'portrait' : 'landscape');
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        // Load all stations for the dropdown
        const loadStations = async () => {
            const stationsList = await StationManager.loadAll();
            setStations(stationsList);
        };
        
        loadStations();

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    useEffect(() => {
        loadRankings();
    }, [leaderboardType, selectedStation]);

    const loadRankings = async () => {
        try {
            setIsLoading(true);
            let rankingData = [];

            if (selectedStation) {
                rankingData = await RankingSystem.getStationRankings(selectedStation.uid, 50);
            } else {
                switch (leaderboardType) {
                    case 'points':
                        rankingData = await RankingSystem.getTopUsersPointsRankings(50);
                        break;
                }
            }

            const enrichedRankings = enrichRankingsWithUserData(rankingData);
            setRankings(enrichedRankings);
            
            const currentUserRank = enrichedRankings.find(ranking => ranking.uid === userData?.uid);
            setUserRank(currentUserRank);
        } catch (error) {
            console.error('Failed to load rankings:', error);
            setRankings([]);
        } finally {
            setIsLoading(false);
        }
    };

    const enrichRankingsWithUserData = (rankingData) => {
        return rankingData.map((ranking, index) => ({
            ...ranking,
            rank: index + 1,
            displayName: ranking.displayName || 'Unknown User'
        }));
    };

    const getLeaderboardTitle = () => {
        if (selectedStation) {
            return `${selectedStation.name} Station Leaderboard`;
        }
        
        switch (leaderboardType) {
            case 'points':
                return 'Points Leaderboard';
            default:
                return 'Leaderboard';
        }
    };

    const getScoreLabel = () => {
        if (selectedStation) {
            return 'Station Points';
        }
        
        switch (leaderboardType) {
            case 'points':
                return 'Points';
            default:
                return 'Score';
        }
    };

    const getScoreValue = (ranking) => {
        if (selectedStation) {
            return ranking.points || 0;
        }
        
        switch (leaderboardType) {
            case 'points':
                return ranking.points || 0;
            default:
                return 0;
        }
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return '🏆';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return `#${rank}`;
        }
    };

    const handleLeaderboardTypeChange = (e) => {
        setLeaderboardType(e.target.value);
        setSelectedStation(null);
    };
    
    const handleStationChange = (e) => {
        const stationId = e.target.value;
        if (stationId === 'points') {
            setSelectedStation(null);
            setLeaderboardType('points');
        } else if (stationId === 'level') {
            setSelectedStation(null);
            setLeaderboardType('level');
        } else {
            const station = stations.find(s => s.uid === stationId);
            setSelectedStation(station);
        }
    };

    return (
        <div className="app-container">
            <div className="screen">
                <div className="background">
                    <div className="bg-gradient-1"></div>
                    <div className="bg-gradient-2"></div>
                    <div className="bg-overlay"></div>
                </div>
                <header className="screen-header">
                    <h1 className="screen-title">Ranking</h1>
                    <p className="screen-subtitle">{getLeaderboardTitle()}</p>
                </header>
                
                <main className="screen-main">
                    {orientation === 'portrait' ? (
                        <>
                            <div className="card mb-4">
                                <label className="form-label">Leaderboard Type</label>
                                <select 
                                    value={selectedStation ? selectedStation.uid : leaderboardType}
                                    onChange={handleStationChange}
                                    className="form-input mt-2"
                                >
                                    <option value="points">Total Points</option>
                                    {stations.length > 0 && (
                                        <>
                                            {stations.map((station) => (
                                                <option key={station.uid} value={station.uid}>
                                                    {station.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            {userRank && (
                                <div className="card mb-4 text-center p-5">
                                    <div className="text-2xl font-bold text-gradient">
                                        My Ranking: #{userRank.rank}
                                    </div>
                                </div>
                            )}

                            <h2 className="text-lg font-semibold text-slate-300 mb-3">
                                {getLeaderboardTitle()}
                            </h2>
                            
                            <div className="space-y-3">
                                {isLoading ? (
                                    <div className="text-center text-slate-400 py-3">
                                        Loading rankings...
                                    </div>
                                ) : rankings.length === 0 ? (
                                    <div className="text-center text-slate-400 py-3">
                                        No rankings available for this category.
                                    </div>
                                ) : (
                                    rankings.map((ranking) => (
                                        <div key={`${ranking.uid}_${leaderboardType}`} className="card">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 text-center font-bold" 
                                                    style={{ color: ranking.rank <= 3 ? '#FFD700' : 'var(--main-color)' }}>
                                                    {getRankIcon(ranking.rank)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {ranking.displayName}
                                                        {ranking.uid === userData?.uid && (
                                                            <span className="text-xs ml-2" style={{ color: '#00FF94' }}>
                                                                (You)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-slate-400">
                                                        Level {ranking.level || 1} | {getScoreLabel()}: {getScoreValue(ranking).toLocaleString()}
                                                        {selectedStation && ranking.exerciseCount !== undefined && (
                                                            <span className="ml-2">
                                                                ({ranking.exerciseCount} {ranking.exerciseCount === 1 ? 'exercise' : 'exercises'})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex gap-4 mb-4">
                                <div className="card flex-1">
                                    <label className="form-label">Leaderboard Type</label>
                                    <select 
                                        value={selectedStation ? selectedStation.uid : leaderboardType}
                                        onChange={handleStationChange}
                                        className="form-input mt-2"
                                    >
                                        <option value="points">Total Points</option>
                                        {stations.length > 0 && (
                                            <>
                                                {stations.map((station) => (
                                                    <option key={station.uid} value={station.uid}>
                                                        {station.name}
                                                    </option>
                                                ))}
                                            </>
                                        )}
                                    </select>
                                </div>

                                {userRank && (
                                    <div className="card flex-1 flex items-center justify-center">
                                        <div className="text-xl font-bold text-gradient">
                                            My Ranking: #{userRank.rank}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <h2 className="text-lg font-semibold text-slate-300 mb-3">
                                {getLeaderboardTitle()}
                            </h2>
                            
                            <div className="space-y-3" style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
                                {isLoading ? (
                                    <div className="text-center text-slate-400 py-3">
                                        Loading rankings...
                                    </div>
                                ) : rankings.length === 0 ? (
                                    <div className="text-center text-slate-400 py-3">
                                        No rankings available for this category.
                                    </div>
                                ) : (
                                    rankings.map((ranking) => (
                                        <div key={`${ranking.uid}_${leaderboardType}`} className="card">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 text-center font-bold" 
                                                    style={{ color: ranking.rank <= 3 ? '#FFD700' : 'var(--main-color)' }}>
                                                    {getRankIcon(ranking.rank)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {ranking.displayName}
                                                        {ranking.uid === userData?.uid && (
                                                            <span className="text-xs ml-2" style={{ color: '#00FF94' }}>
                                                                (You)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-slate-400">
                                                        Level {ranking.level || 1} | {getScoreLabel()}: {getScoreValue(ranking).toLocaleString()}
                                                        {selectedStation && ranking.exerciseCount !== undefined && (
                                                            <span className="ml-2">
                                                                ({ranking.exerciseCount} {ranking.exerciseCount === 1 ? 'exercise' : 'exercises'})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

const RankingPageElements = {
    Page,
    newRanking
};

export default RankingPageElements;