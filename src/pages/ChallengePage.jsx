import { useState, useEffect } from 'react';
import ExpElements from '../components/ui/ExpBar';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import GroupManagement from '../services/firebase/GroupManagementSystem';

function Page({ data }) {
    const userData = data;
    const [activeChallenges, setActiveChallenges] = useState([]);
    const [groupNames, setGroupNames] = useState({});
    const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);

    useEffect(() => {
        if (userData && userData.uid) {
            loadUserActiveChallenges();
        }
    }, [userData?.uid]);

    const loadUserActiveChallenges = async () => {
        try {
            setIsLoadingChallenges(true);
            
            const allChallenges = await ChallengeManagement.getAllChallenges();
            
            const publicChallenges = allChallenges.filter(challenge => 
                challenge.visibility === 'public' && challenge.isActive()
            );
            
            const hiddenChallenges = allChallenges.filter(challenge => 
                challenge.visibility === 'hidden' && 
                challenge.isActive() && 
                challenge.hasParticipant(userData.uid)
            );
            
            const userGroups = await GroupManagement.getUserGroups(userData.uid);
            
            const allGroupChallenges = [];
            const groupNamesMap = {};
            
            for (const group of userGroups) {
                const groupChallenges = allChallenges.filter(challenge =>
                    challenge.visibility === 'group' && 
                    challenge.groupId === group.groupId &&
                    challenge.isActive()
                );
                
                groupNamesMap[group.groupId] = group.name;
                
                allGroupChallenges.push(...groupChallenges);
            }
            
            const userActiveChallenges = [...publicChallenges, ...allGroupChallenges, ...hiddenChallenges];
            
            setActiveChallenges(userActiveChallenges);
            setGroupNames(groupNamesMap);
        } catch (error) {
            console.error('Failed to load active challenges:', error);
            setActiveChallenges([]);
        } finally {
            setIsLoadingChallenges(false);
        }
    };

    const getChallengeSourceText = (challenge) => {
        if (challenge.visibility === 'public') return 'Public';
        if (challenge.visibility === 'hidden') return 'Achievement';
        if (challenge.visibility === 'group') return groupNames[challenge.groupId] || 'Unknown Group';
        return 'Unknown';
    };

    const getChallengeSourceColor = (challenge) => {
        if (challenge.visibility === 'public') return 'var(--light-color)';
        if (challenge.visibility === 'hidden') return '#A0A0A0';
        if (challenge.visibility === 'group') return 'var(--light-color)';
        return 'var(--light-color)';
    };

    return (
        <div className="AppContents">
            <div className='GroupContainer'>
                <div className="GuideTitle">Challenges</div>
                <div className="GuideText">My Challenges</div>
                
                {isLoadingChallenges ? (
                    <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                        Loading challenges...
                    </div>
                ) : activeChallenges.length === 0 ? (
                    <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                        No active challenges available
                    </div>
                ) : (
                    activeChallenges.map(challenge => (
                        <div key={challenge.challengeId} className='CardContainer'>
                            <div className='CardHeader'>
                                <span style={{ color: 'var(--main-color)' }}>
                                    {challenge.name}
                                </span>
                                <span style={{ 
                                    color: getChallengeSourceColor(challenge), 
                                    fontSize: '14px', 
                                    marginLeft: '8px' 
                                }}>
                                    - {getChallengeSourceText(challenge)}
                                </span>
                                <span style={{ 
                                    color: '#00FF94', 
                                    fontSize: '12px', 
                                    marginLeft: '8px' 
                                }}>
                                    (Active)
                                </span>
                            </div>
                            <div className='CardContents'>
                                {challenge.description || 'No description available.'}
                            </div>
                            <div className='CardContents'>
                                Type: {challenge.challengeType} | 
                                Target: {challenge.targetValue || 'N/A'} | 
                                Participants: {challenge.getParticipantCount()} | 
                                Reward: {challenge.rewardPoints} pts
                            </div>
                            <div className='GroupExpContainer'>
                                <ExpElements.NewLinearExpContainerSimple 
                                    expnow={challenge.progress || 0} 
                                    expmax={challenge.targetValue || 100} 
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const ChallengePageElements = {
    Page
};

export default ChallengePageElements;