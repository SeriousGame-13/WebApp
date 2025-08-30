import React, { useState, useEffect } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import GroupManagement from '../services/firebase/GroupManagementSystem';
import UserManagement from '../services/firebase/UserManagementSystem';
import '../sphere-styles.css';


function newChallenges() {
  const [items, setItems] = useState([
    { id: "c1", title: "Herzsache", description: "halte die Herzfrequenz über 120", done: true },
    { id: "c2", title: "Fokus-Zone", description: "bleibe 5 Minuten fehlerfrei", done: false },
    { id: "c3", title: "Kombiniert", description: "schlage 3 Kombos in einem Training", done: false },
  ]);

  const markDone = (id) => setItems(prev => prev.map(c => (c.id === id ? { ...c, done: !c.done } : c)));

  return (
    <Screen title="Weekly Challenge">
      <div className="space-y-3">
        {items.map(c => (
          <Card key={c.id}>
            <div className="flex items-center gap-3">
              <div className={`${c.done ? "btn-primary" : "bg-white/10"} w-10 h-10 rounded-xl flex items-center justify-center`}>
                {c.done ? <Check className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">{c.title}</p>
                <p className="text-slate-400 text-sm">{c.description}</p>
              </div>
              <button 
                onClick={() => markDone(c.id)} 
                className={c.done ? "btn-secondary" : "btn-primary"}
              >
                {c.done ? "Undo" : "Mark"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <button className="btn-primary w-full mt-6 py-3">
        Group Challenges
      </button>
    </Screen>
  );
}

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
        <div className="app-container">
            <div className="screen">
                <div className="background">
                    <div className="bg-gradient-1"></div>
                    <div className="bg-gradient-2"></div>
                    <div className="bg-overlay"></div>
                </div>
                
                <div className="screen-main">
                    <h2 className="screen-title mb-2">Challenges</h2>
                    <h3 className="text-slate-200 font-semibold mb-4">My Challenges</h3>
                    
                    {isLoadingChallenges ? (
                        <div className="text-slate-400 text-center py-6">
                            Loading challenges...
                        </div>
                    ) : activeChallenges.length === 0 ? (
                        <div className="text-slate-400 text-center py-6">
                            No active challenges available
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeChallenges.map(challenge => (
                                <div key={challenge.challengeId} className='card'>
                                    <div className='flex items-center gap-2 mb-2'>
                                        <span className='text-gradient font-semibold'>
                                            {challenge.name}
                                        </span>
                                        <span className='text-slate-300 text-sm'> 
                                            - {getChallengeSourceText(challenge)}
                                        </span>
                                        <span className='text-green-400 text-xs'>
                                            (Active)
                                        </span>
                                    </div>
                                    <div className='text-slate-300 mb-2'>
                                        {challenge.description || 'No description available.'}
                                    </div>
                                    <div className='text-slate-400 text-sm'>
                                        Type: {challenge.challengeType} | 
                                        Target: {challenge.targetValue || 'N/A'} | 
                                        Participants: {challenge.getParticipantCount()} | 
                                        Reward: {challenge.rewardPoints} pts
                                    </div>
                                    <div className='mt-3'>
                                        <ExpElements.NewLinearExpContainerSimple 
                                            expnow={0} 
                                            expmax={challenge.targetValue || 100} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const ChallengePageElements = {
    Page,
    newChallenges
};

export default ChallengePageElements;