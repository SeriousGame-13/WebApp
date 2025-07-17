import React, { useState, useEffect, useRef } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import GroupManagement from '../services/firebase/GroupManagementSystem';
import UserManagement from '../services/firebase/UserManagementSystem';
import RankingSystem from '../services/firebase/RankingSystem';

import '../components/styles/HomePage.css';

import LastWorkoutsDisplay from '../components/ui/LastWorkoutsDisplay';

function Page({ data }) {
    const userData = data;
    const containerRef = useRef(null);
    const timeRef = useRef(null);
    const [isLandscape, setIsLandscape] = useState(false);
    const [activeChallenges, setActiveChallenges] = useState([]);
    const [groupNames, setGroupNames] = useState({});
    const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
    const [rank, setRank] = useState('--');

    const time = userData.formatDuration(userData.getTotalTrainingTime());
    
    useEffect(() => {
        const fetchUserRank = async () => {
            try {
                const userRank = await RankingSystem.getUserPointsRank(userData.uid);
                setRank(userRank);
            } catch (error) {
                console.error('Failed to fetch user rank:', error);
                setRank('--');
            }
        };
        
        fetchUserRank();
    }, [userData.uid]);

    useEffect(() => {
        loadUserActiveChallenges();
    }, [userData.uid]);

    const loadUserActiveChallenges = async () => {
        try {
            setIsLoadingChallenges(true);
            
            const userGroups = await GroupManagement.getUserGroups(userData.uid);
            
            const allGroupChallenges = [];
            const groupNamesMap = {};
            
            for (const group of userGroups) {
                const groupChallenges = await ChallengeManagement.getGroupChallenges(group.groupId);
                const activeChallenges = groupChallenges.filter(challenge => 
                    challenge.isActive() || challenge.hasNotStarted()
                );
                
                groupNamesMap[group.groupId] = group.name;
                
                allGroupChallenges.push(...activeChallenges);
            }
            
            setActiveChallenges(allGroupChallenges);
            setGroupNames(groupNamesMap);
        } catch (error) {
            console.error('Failed to load active challenges:', error);
            setActiveChallenges([]);
        } finally {
            setIsLoadingChallenges(false);
        }
    };

    useEffect(() => {
        const checkOrientation = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setIsLandscape(width > height);
            }
        };

        checkOrientation();

        const resizeObserver = new ResizeObserver(() => {
            checkOrientation();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        window.addEventListener('resize', () => {
            checkOrientation();
        });

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', checkOrientation);
        };
    }, [time]);

    const getStatusText = (challenge) => {
        if (challenge.hasNotStarted()) return 'Starting Soon';
        if (challenge.isActive()) return 'Active';
        return 'Unknown';
    };

    const getStatusColor = (challenge) => {
        if (challenge.hasNotStarted()) return '#A0A0A0';
        if (challenge.isActive()) return '#00FF94';
        return '#A0A0A0';
    };

    return (
        <div className="AppContents" ref={containerRef}>
            <div className={`MainContentWrapper ${isLandscape ? 'landscape' : 'portrait'}`}>
                <div className="TopGridSection">
                    <ExpElements.NewCircleExpContainer level={userData.level} expnow={userData.points} expmax={userData.currentMaxPoints()} />
                </div>

                <div className="BottomGridSection">
                    <div className='HelloText'>
                        Good Morning, {userData.displayName}
                    </div>
                    <div className='HomeInfoContainer'>
                        <div className='HomeInfo'>
                            <div className='HomeInfoItemContainer'
                                style={{ color: 'var(--main-color)' }}>
                                <IconElements.RankingIcon />
                                <div className='HomeInfoName'>
                                    {rank}
                                </div>
                                <p style={{ textAlign: 'center' }}>Place</p>
                            </div>
                        </div>
                        <div className='HomeInfo'>
                            <div className='HomeInfoItemContainer'
                                style={{ color: 'var(--main-color)' }}>
                                <IconElements.TimeIcon />
                                <div className='HomeInfoName' ref={timeRef}>
                                    {time}
                                </div>
                                <p style={{ textAlign: 'center' }}>Training</p>
                            </div>
                        </div>
                        <div className='HomeInfo'>
                            <div className='HomeInfoItemContainer'
                                style={{ color: 'var(--main-color)' }}>
                                <IconElements.FitnessIcon />
                                <div className='HomeInfoName'>
                                    3/7
                                </div>
                                <p style={{ textAlign: 'center' }}>Goal</p>
                            </div>
                        </div>
                        <div className='HomeInfo'>
                            <div className='HomeInfoItemContainer'
                                style={{ color: 'var(--main-color)' }}>
                                <IconElements.CalorieIcon />
                                <div className='HomeInfoName'>
                                    {userData.getCalories()}
                                </div>
                                <p style={{ textAlign: 'center' }}>Total Calories</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className='GuideText'>
                        <div className='GuideText'>
                            Active Group Challenges
                        </div>
                        
                        {isLoadingChallenges ? (
                            <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                                Loading challenges...
                            </div>
                        ) : activeChallenges.length === 0 ? (
                            <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                                No active group challenges
                            </div>
                        ) : (
                            activeChallenges.map(challenge => (
                                <div key={challenge.challengeId} className='GroupExerciseContainer'>
                                    <div className='GroupExerciseHeader'>
                                        <span style={{ color: 'var(--main-color)' }}>
                                            {challenge.name}
                                        </span>
                                        <span style={{ color: 'var(--light-color)', fontSize: '14px', marginLeft: '8px' }}>
                                            - {groupNames[challenge.groupId] || 'Unknown Group'}
                                        </span>
                                        <span style={{ 
                                            color: getStatusColor(challenge), 
                                            fontSize: '12px', 
                                            marginLeft: '8px' 
                                        }}>
                                            ({getStatusText(challenge)})
                                        </span>
                                    </div>
                                    <div className='GroupExerciseContents'>
                                        {challenge.description || 'No description available.'}
                                    </div>
                                    <div style={{ 
                                        margin: '8px 16px', 
                                        fontSize: '12px', 
                                        color: '#A0A0A0' 
                                    }}>
                                        Type: {challenge.challengeType} | 
                                        Target: {challenge.targetValue || 'N/A'} | 
                                        Participants: {challenge.getParticipantCount()}
                                    </div>
                                    <div className='GroupExpContainer'>
                                        <ExpElements.NewLinearExpContainerSimple 
                                            expnow={0} 
                                            expmax={challenge.targetValue || 100} 
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <LastWorkoutsDisplay userData={userData} />
                </div>
            </div>
        </div>
    )
}

const HomePageElements = {
    Page
};

export default HomePageElements;