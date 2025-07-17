import { useState, useEffect } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import RankingSystem from '../services/firebase/RankingSystem';
import '../components/styles/LayoutElements.css';

function Page({ data }) {
    const userData = data;
    const [rankings, setRankings] = useState([]);
    const [leaderboardType, setLeaderboardType] = useState('level');
    const [isLoading, setIsLoading] = useState(true);
    const [userRank, setUserRank] = useState(null);

    useEffect(() => {
        loadRankings();
    }, [leaderboardType]);

    const loadRankings = async () => {
        try {
            setIsLoading(true);
            let rankingData = [];

            switch (leaderboardType) {
                case 'level':
                    rankingData = await RankingSystem.getTopUsersLevelRankings(50);
                    break;
                case 'points':
                    rankingData = await RankingSystem.getTopUsersPointsRankings(50);
                    break;
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
        switch (leaderboardType) {
            case 'level':
                return 'Level Leaderboard';
            case 'points':
                return 'Points Leaderboard';
            default:
                return 'Leaderboard';
        }
    };

    const getScoreLabel = () => {
        switch (leaderboardType) {
            case 'level':
                return 'Level';
            case 'points':
                return 'Points';
            default:
                return 'Score';
        }
    };

    const getScoreValue = (ranking) => {
        switch (leaderboardType) {
            case 'level':
                return ranking.level || 0;
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
    };

    return (
        <div className="AppContents" style={{ 
            height: 'calc(100vh - 140px)',
            overflow: 'auto',
            paddingBottom: '20px'
        }}>
            <div className='GuideText'>
                <IconElements.RankingIcon />
                <span style={{ marginLeft: '8px' }}>Leaderboards</span>
            </div>

            <div className='GroupExerciseContainer' style={{ marginBottom: '20px' }}>
                <div className='GroupExerciseHeader'>
                    <span style={{ color: 'var(--main-color)' }}>
                        Leaderboard Type
                    </span>
                </div>
                <div className='GroupExerciseContents'>
                    <select 
                        value={leaderboardType}
                        onChange={handleLeaderboardTypeChange}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--border-glass)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--background-glass)',
                            color: 'var(--light-color)',
                            fontSize: '14px',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        <option value="level">Level Rankings</option>
                        <option value="points">Total Points</option>
                    </select>
                </div>
            </div>

            {userRank && (
                <div className='GroupExerciseContainer' style={{ marginBottom: '20px' }}>
                    <div className='GroupExerciseHeader'>
                        <span style={{ color: 'var(--main-color)' }}>
                            Your Ranking
                        </span>
                        <span style={{ 
                            color: '#00FF94', 
                            fontSize: '12px', 
                            marginLeft: '8px' 
                        }}>
                            (Rank #{userRank.rank})
                        </span>
                    </div>
                    <div className='GroupExerciseContents'>
                        Your {getScoreLabel()}: {getScoreValue(userRank).toLocaleString()}
                    </div>
                </div>
            )}

            <div className='GuideText'>
                {getLeaderboardTitle()}
            </div>
            
            <div style={{ 
                maxHeight: 'calc(100vh - 380px)', // Account for footer (80px) + headers (300px)
                overflow: 'auto',
                paddingRight: '8px'
            }}>
                {isLoading ? (
                    <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                        Loading rankings...
                    </div>
                ) : rankings.length === 0 ? (
                    <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                        No rankings available for this category.
                    </div>
                ) : (
                    rankings.map((ranking) => (
                        <div key={`${ranking.uid}_${leaderboardType}`} className='GroupExerciseContainer'>
                            <div className='GroupExerciseHeader'>
                                <span style={{ 
                                    color: ranking.rank <= 3 ? '#FFD700' : 'var(--main-color)',
                                    fontSize: '18px',
                                    marginRight: '8px'
                                }}>
                                    {getRankIcon(ranking.rank)}
                                </span>
                                <span style={{ color: 'var(--main-color)' }}>
                                    {ranking.displayName}
                                </span>
                                {ranking.uid === userData?.uid && (
                                    <span style={{ 
                                        color: '#00FF94', 
                                        fontSize: '12px', 
                                        marginLeft: '8px' 
                                    }}>
                                        (You)
                                    </span>
                                )}
                                <span style={{ 
                                    color: 'var(--light-color)', 
                                    fontSize: '14px', 
                                    marginLeft: 'auto' 
                                }}>
                                    {' Level ' + (ranking.level || 1)}
                                </span>
                            </div>
                            <div className='GroupExerciseContents'>
                                {getScoreLabel()}: {getScoreValue(ranking).toLocaleString()}
                            </div>
                            <div style={{ 
                                margin: '8px 16px', 
                                fontSize: '12px', 
                                color: '#A0A0A0' 
                            }}>
                                Rank: #{ranking.rank} | 
                                Level: {ranking.level || 1} | 
                                Points: {ranking.points || 0}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const RankingPageElements = {
    Page
};

export default RankingPageElements;