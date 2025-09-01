import { useState, useEffect } from 'react';
import RankingSystem from '../services/firebase/RankingSystem';
import StationManager from '../services/firebase/StationManagement';
import {Card, Modal, Legend, Pill, Screen, Stat, Avatar} from '../components/ui/UIComponents';
import IconElements from '../components/ui/IconElements';

import '../sphere-styles.css';

function Page({ userData }) {
  const [tab, setTab] = useState("points");
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const loadStations = async () => {
      try {
        const stationsList = await StationManager.loadAll();
        setStations(stationsList);
      } catch (error) {
        console.error('Failed to load stations:', error);
      }
    };
    
    loadStations();
  }, []);

  useEffect(() => {
    loadRankings();
  }, [tab, selectedStation]);

  const loadRankings = async () => {
    try {
      setIsLoading(true);
      let rankingData = [];

      if (selectedStation) {
        rankingData = await RankingSystem.getStationRankings(selectedStation.uid, 50);
      } else if (tab === "points") {
        rankingData = await RankingSystem.getTopUsersPointsRankings(50);
      }

      const enrichedRankings = rankingData.map((ranking, index) => ({
        ...ranking,
        id: ranking.uid || `user-${index}`,
        name: ranking.displayName || 'Unknown User',
        points: ranking.points || 0,
        rank: index + 1,
        level: ranking.level || 1
      }));
      
      setRankings(enrichedRankings);

      // Find the current user in rankings
      const myIdx = enrichedRankings.findIndex(r => r.id === userData.uid);
      if (myIdx >= 0) {
        setUserRank(enrichedRankings[myIdx]);
      }
    } catch (error) {
      console.error('Failed to load rankings:', error);
      setRankings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setTab("station");
  };

  const getTitle = () => {
    if (selectedStation) {
      return `${selectedStation.name} Rankings`;
    }
    return "Points Ranking";
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };
  
  const top100 = rankings.slice(0, 100)

  // Find the current user's position

  const myIdx = rankings.findIndex(r => r.id === userData.uid || r.uid === userData.uid);

  return (
    
    <Screen title={getTitle()}>
      <div className="flex gap-2 mb-5 flex-wrap">
        <Pill 
          active={tab === "points" && !selectedStation} 
          onClick={() => { setTab("points"); setSelectedStation(null); }}
        >
          Points
        </Pill>
        
        {stations.map(station => (
          <Pill 
            key={station.uid}
            active={selectedStation && selectedStation.uid === station.uid} 
            onClick={() => handleStationSelect(station)}
          >
            {station.name}
          </Pill>
        ))}
      </div>
      
      {userRank && myIdx >= 0 && (
        <Card>
          <div className="text-center p-0">
            <div className="text-gradient font-semibold">
              Your Rank: #{myIdx + 1}
            </div>
            <div className="text-sm text-slate-200">
              {userRank.points} points | Level {userRank.level}
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3 mt-4">
        {isLoading ? (
          <div className="text-center text-slate-400 py-3">
            Loading rankings...
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center text-slate-400 py-3">
            No rankings available for this category.
          </div>
        ) : (
          <>
            {top100.map((row, idx) => (
              <Card key={row.id || row.uid}>
                <button 
                  onClick={() => setSelectedUser(row)} 
                  className="w-full text-left"
                  style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center font-bold" >
                      {getRankIcon(idx + 1)}
                    </div>
                    <Avatar name={row.name || row.displayName} size={40} seed={row.id || row.uid} />
                    <div className="flex-1 font-medium">
                      {row.name || row.displayName}
                      {(row.id === userData.uid || row.uid === userData.uid) && (
                        <span className="text-xs ml-2" >
                           {" "}(You)
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-semibold">{row.points}</div>
                  </div>
                </button>
              </Card>
            ))}
          </>
        )}
      </div>
       {/* User Preview Modal */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Profile" size="sm">
        {selectedUser && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar name={selectedUser.name || selectedUser.displayName} size={48} seed={selectedUser.id || selectedUser.uid} />
              <div>
                <p className="text-lg font-semibold">{selectedUser.name || selectedUser.displayName}</p>
                <p className="text-slate-400 text-sm">Level {selectedUser.level || 1}</p>
              </div>
            </div>
            <div className="grid-3 gap-3">
              <Card>
                <div className="text-center">
                  <div className="text-xs text-slate-400">Points</div>
                  <div className="text-lg font-semibold">{selectedUser.points || 0}</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-xs text-slate-400">Rank</div>
                  <div className="text-lg font-semibold">{rankings.findIndex(r => r.id === selectedUser.id || r.uid === selectedUser.uid) + 1}</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-xs text-slate-400">Level</div>
                  <div className="text-lg font-semibold">{selectedUser.level || 1}</div>
                </div>
              </Card>
            </div>
          </div>
        )}
    </Modal>
    </Screen>
  );
}

const RankingPage = {
    Page
};

export default RankingPage;