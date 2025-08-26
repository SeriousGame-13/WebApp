import { useState, useEffect } from 'react';
import RankingSystem from '../services/firebase/RankingSystem';
import '../components/styles/LayoutElements.css';

function Page({ data }) {
    const userData = data;
    const [rankings, setRankings] = useState([]);
    const [leaderboardType, setLeaderboardType] = useState('level');
    const [isLoading, setIsLoading] = useState(true);
    const [userRank, setUserRank] = useState(null);
    const [orientation, setOrientation] = useState('landscape');

    useEffect(() => {
        const checkOrientation = () => {
            const isPortrait = window.innerHeight > window.innerWidth;
            setOrientation(isPortrait ? 'portrait' : 'landscape');
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

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
        <div className="AppContents">
            <div className={`MainContentWrapper ${orientation}`}>
                {orientation === 'portrait' ? (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* 고정 부분 */}
                        <div style={{ flexShrink: 0 }}>
                            <div className="GuideTitle">Ranking</div>
                            <div className='GuideText'>Leaderboard Type</div>
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

                            {userRank && (
                                <div style={{
                                    color: 'var(--main-color)',
                                    fontSize: 'xx-large',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    margin: '30px 0'
                                }}>
                                    Mein Ranking: Rank {userRank.rank}
                                </div>
                            )}

                            <div className='GuideText'>
                                {getLeaderboardTitle()}
                            </div>
                        </div>
                        
                        {/* 스크롤 부분 */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
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
                                    <div key={`${ranking.uid}_${leaderboardType}`} className='CardContainer'>
                                        <div className='CardHeader'>
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
                                        <div className='CardContents'>
                                            {getScoreLabel()}: {getScoreValue(ranking).toLocaleString()}
                                        </div>
                                        <div className='CardContents'>
                                            Rank: #{ranking.rank} |
                                            Level: {ranking.level || 1} |
                                            Points: {ranking.points || 0}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="TopGridSection">
                            <div className="RankingActionsSectionHorizontal">
                                <div className="GuideTitle">Ranking</div>
                                <div className='GuideText'>Leaderboard Type</div>
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

                                {userRank && (
                                    <div style={{
                                        color: 'var(--main-color)',
                                        fontSize: 'xx-large',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        margin: '30px 0'
                                    }}>
                                        Mein Ranking: Rank {userRank.rank}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="BottomGridSection" style={{ overflow: 'auto', maxHeight: '100%' }}>
                            <div className='GuideText'>
                                    {getLeaderboardTitle()}
                            </div>
                            <div className="RankingContainer" style={{ 
                                maxHeight: 'calc(100vh - 200px)',
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
                                        <div key={`${ranking.uid}_${leaderboardType}`} className='CardContainer'>
                                            <div className='CardHeader'>
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
                                            <div className='CardContents'>
                                                {getScoreLabel()}: {getScoreValue(ranking).toLocaleString()}
                                            </div>
                                            <div className='CardContents'>
                                                Points: {ranking.points || 0}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const RankingPageElements = {
    Page
};

export default RankingPageElements;