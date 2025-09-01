import React, { useState, useEffect } from 'react';
import ExpElements from '../components/ui/ExpBar';
import IconElements from '../components/ui/IconElements';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import GroupManagement from '../services/firebase/GroupManagementSystem';
import UserManagement from '../services/firebase/UserManagementSystem';
import FirestoreManager from '../services/firebase/FirestoreManager';

import { X, Calendar, Target, Users, Trophy, Info, Clock, CheckCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { CHALLENGE_TYPE, CHALLENGE_VISIBILITY } from '../services/interfaces/constants';
import '../sphere-styles.css';

function Modal({ open, onClose, children, title, size = "md" }) {
  if (!open) return null;
  const maxW = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-xl" : "max-w-lg";
  return (
    <div className="modal-overlay">
        <div className="modal-backdrop" onClick={onClose} />
        <div className='centered'>
            <div className={`modal-content card ${maxW}`}>
                <div className="modal-header">
                <h3 className="modal-title">{title}</h3>
                <button onClick={onClose} className="modal-close">
                    <X className="w-5 h-5" />
                </button>
                </div>
                {children}
            </div>
        </div>
    </div>
  );
}

function ChallengeDetailModal({ challengeId, open, onClose, allChallenges, groupNames, userData, setEditingChallenge, setShowEditChallenge}) {
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProgress, setUserProgress] = useState(0);

    useEffect(() => {
        if (!open || !challengeId) return;

        const loadChallengeDetails = async () => {
            setLoading(true);
            try {
                // Find selected Challenge from allChallenges 
                const foundChallenge = allChallenges.find(c => c.challengeId === challengeId);
                setChallenge(foundChallenge || null);

                if (foundChallenge && userData?.uid) {
                    try {
                        const participantData = await FirestoreManager.findDocumentByField(
                        `challenges/${challengeId}/participants`,
                        'uid',
                        userData.uid
                        );
                        
                        if (participantData) {
                        setUserProgress(participantData.currentValue || 0);
                        } else {
                        setUserProgress(0);
                        }
                    } catch (error) {
                        console.error('Failed to load user progress:', error);
                        setUserProgress(0);
                    }
                }
            } catch (error) {
                console.error('Failed to load challenge details:', error);
                setChallenge(null);
            } finally {
                setLoading(false);
            }
        };

        loadChallengeDetails();
    }, [challengeId, open, allChallenges, userData?.uid]);

    if (!open) return null;

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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusIcon = (challenge) => {
        if (challenge?.isActive && challenge.isActive()) {
        return <CheckCircle className="w-5 h-5 text-green-400" />;
        }
        return <Clock className="w-5 h-5 text-slate-400" />;
    };

    const getStatusText = (challenge) => {
        if (challenge?.isActive && challenge.isActive()) {
        return "Active";
        }
        return "Inactive";
    };

    return (
        <Modal open={open} onClose={onClose} title={challenge?.name || "Challenge Details"} size="lg">
            <div className="p-4">
                {loading ? (
                <div className="text-center text-slate-400 py-4">Loading...</div>
                ) : challenge ? (
                <div className="space-y-6">
                    <div className="flex items-start gap-4" style={{marginBottom: '20px'}}>
                    <div className="flex-1">
                        <h3 className="text-lg Badge-title font-semibold text-white mb-1">{challenge.name}</h3>
                        <div className="flex Badge-subtitle items-center gap-2 mb-2">
                        <span 
                            className="text-sm font-medium"
                            style={{ color: getChallengeSourceColor(challenge) }}
                        >
                            {getChallengeSourceText(challenge)}
                        </span>
                        <span className="text-slate-500">:</span>
                        <div className="flex items-center gap-1">
                            <span className={`text-sm ${challenge?.isActive && challenge.isActive() ? 'text-green-400' : 'text-slate-400'}`}>
                            {getStatusText(challenge)}
                            </span>
                        </div>
                        </div>
                        <span className="text-sm text-slate-400">Description</span>
                        {challenge.description && (
                        <p className="text-sm text-slate-300" style={{textAlign: 'center'}}>{challenge.description}</p>
                        )}
                    </div>
                    </div>

                    {/* Progressbar */}
                    <div className="space-y-2" style={{marginBottom: '20px'}}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Progress</span>
                        <span className="text-sm text-slate-300">
                        {userProgress} / {challenge.targetValue || 0}
                        </span>
                    </div>
                    <ExpElements.NewLinearExpContainerSimple 
                        expnow={userProgress} 
                        expmax={challenge.targetValue || 100} 
                    />
                    </div>

                    <span className="text-sm text-slate-400" style={{marginBottom: '20px'}}>Details</span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{marginTop: '20px'}}>
                    {/* Challenge Type */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Challenge Type</span>
                        </div>
                        <p className="text-white font-medium">{challenge.challengeType || 'N/A'}</p>
                    </div>

                    {/* Ziel value */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Target Value</span>
                        </div>
                        <p className="text-white font-medium">{challenge.targetValue || 'N/A'}</p>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Start Date</span>
                        </div>
                        <p className="text-white font-medium">{formatDate(challenge.startDate)}</p>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">End Date</span>
                        </div>
                        <p className="text-white font-medium">{formatDate(challenge.endDate)}</p>
                    </div>

                    {/* points */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Reward Points</span>
                        </div>
                        <p className="text-white font-medium">{challenge.rewardPoints || 0} pts</p>
                    </div>

                    {/* number Teilnehmers */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Participants</span>
                        </div>
                        <p className="text-white font-medium">{challenge.getParticipantCount ? challenge.getParticipantCount() : 0}</p>
                    </div>
                    </div>

                    {challenge.targetField && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Target Field</span>
                        </div>
                        <p className="text-white font-medium">{challenge.targetField}</p>
                    </div>
                    )}

                    {/* conditions */}
                    {challenge.conditions && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Conditions</span>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                        <pre className="text-sm text-slate-300 whitespace-pre-wrap">{challenge.conditions}</pre>
                        </div>
                    </div>
                    )}

                    <div className="pt-4 border-t border-white/10 space-y-2">
                    <p className="text-xs text-slate-500">
                        Challenge ID: {challenge.challengeId}
                    </p>
                    {challenge.createdAt && (
                        <p className="text-xs text-slate-500">
                        Created: {formatDate(challenge.createdAt)}
                        </p>
                    )}
                    </div>
                </div>
                ) : (
                <div className="text-center text-slate-400 py-4">Challenge not found</div>
                )}
            </div>
            {userData?.uid === challenge?.creatorId && (
                <div className="pt-4 border-t border-white/10">
                    <button
                        onClick={() => {
                            setEditingChallenge(challenge);
                            setShowEditChallenge(true);
                            onClose();
                        }}
                        className="btn-primary flex centered gap-2"
                        style={{marginBottom: '20px', marginTop: '20px' }}
                    >
                        Edit Challenge
                    </button>
                </div>
            )}
        </Modal>
    );
}

// ========== Challege Card  ==========
function ClickableChallengeCard({ challenge, groupNames, onClick, userData }) {
    const [userProgress, setUserProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserProgress = async () => {
        if (!challenge.challengeId || !userData?.uid) {
            setLoading(false);
            return;
        }

        try {
            const participantData = await FirestoreManager.findDocumentByField(
            `challenges/${challenge.challengeId}/participants`,
            'uid',
            userData.uid
            );
            
            if (participantData) {
            setUserProgress(participantData.currentValue || 0);
            } else {
            setUserProgress(0);
            }
        } catch (error) {
            console.error('Failed to load user progress:', error);
            setUserProgress(0);
        } finally {
            setLoading(false);
        }
        };

        loadUserProgress();
    }, [challenge.challengeId, userData?.uid]);

    const getChallengeSourceText = (challenge) => {
        if (challenge.visibility === 'public') return 'Public';
        if (challenge.visibility === 'hidden') return 'Achievement';
        if (challenge.visibility === 'group') return groupNames[challenge.groupId] || 'Unknown Group';
        return 'Unknown';
    };

    return (
        <div
        className='card cursor-pointer hover:bg-slate-800/50 transition-colors'
        onClick={() => onClick(challenge.challengeId)}
        >
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
            Participants: {challenge.getParticipantCount ? challenge.getParticipantCount() : 0} |
            Reward: {challenge.rewardPoints} pts
        </div>
        <div className='mt-3'>
            <ExpElements.NewLinearExpContainerSimple
            expnow={userProgress}
            expmax={challenge.targetValue || 100}
            />
        </div>
        </div>
    );
}

// ========== Main Page ==========
function Page({ data }) {
    const userData = data;
    const [activeChallenges, setActiveChallenges] = useState([]);
    const [groupNames, setGroupNames] = useState({});
    const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
    const [selectedChallengeId, setSelectedChallengeId] = useState(null);
    const [showEditChallenge, setShowEditChallenge] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState(null);

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

    const handleChallengeClick = (challengeId) => {
        setSelectedChallengeId(challengeId);
    };

    return (
        <>
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
                                    <ClickableChallengeCard
                                        key={challenge.challengeId}
                                        challenge={challenge}
                                        groupNames={groupNames}
                                        onClick={handleChallengeClick}
                                        userData={userData}
                                    />
                                ))}
                            </div>
                        )}
                        
                        <p className="text-slate-400 text-xs mt-4">
                            Tippe auf ein Challenge für Details
                        </p>
                    </div>
                </div>
            </div>

            <ChallengeDetailModal 
                challengeId={selectedChallengeId}
                open={!!selectedChallengeId}
                onClose={() => setSelectedChallengeId(null)}
                allChallenges={activeChallenges}
                groupNames={groupNames}
                userData={userData}
                setEditingChallenge={setEditingChallenge}
                setShowEditChallenge={setShowEditChallenge}
            />

            {showEditChallenge && editingChallenge && (
                <EditChallengePopup
                    challenge={editingChallenge}
                    onClose={() => {
                        setShowEditChallenge(false);
                        setEditingChallenge(null);
                    }}
                    onUpdate={(updatedData) => {
                        console.log("Updating challenge:", updatedData);
                        setShowEditChallenge(false);
                        setEditingChallenge(null);
                        loadUserActiveChallenges(); // 챌린지 목록 새로고침
                    }}
                />
            )}
        </>
    );
}

// ========== Legacy newChallenges==========
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

function EditChallengePopup({ challenge, onClose, onUpdate }) {
    const [challengeData, setChallengeData] = useState({
        name: '',
        description: '',
        challengeType: CHALLENGE_TYPE.TARGET,
        startDate: '',
        endDate: '',
        rewardPoints: 100,
        targetValue: 10,
        conditions: '',
        targetField: '',
    });
    const [isCreating, setIsCreating] = useState(false);

    const handleInputChange = (field, value) => {
        setChallengeData(prev => ({ ...prev, [field]: value }));
    };

    const handleConfirm = async () => {
        if (!challengeData.name.trim() || !challengeData.startDate || !challengeData.endDate) {
            alert("Please fill in all required fields: Name, Start Date, and End Date.");
            return;
        }
        setIsCreating(true);
        try {
            const currentUser = await UserManagement.getCurrentUser();
            const updateData = {
                ...challengeData,
                rewardPoints: Number(challengeData.rewardPoints) || 0,
                targetValue: Number(challengeData.targetValue) || 0,
                startDate: Timestamp.fromDate(new Date(challengeData.startDate)),
                endDate: Timestamp.fromDate(new Date(challengeData.endDate)),
                conditions: challengeData.conditions,
                targetField: challengeData.targetField,
            };
            await ChallengeManagement.updateChallenge(challenge.challengeId, updateData);
            onUpdate(updateData);
        } catch (error) {
            console.error("Failed to create challenge:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    useEffect(() => {
        if (challenge) {
            setChallengeData({
                name: challenge.name || '',
                description: challenge.description || '',
                challengeType: challenge.challengeType || CHALLENGE_TYPE.TARGET,
                startDate: challenge.startDate ? new Date(challenge.startDate.toDate()).toISOString().split('T')[0] : '',
                endDate: challenge.endDate ? new Date(challenge.endDate.toDate()).toISOString().split('T')[0] : '',
                rewardPoints: challenge.rewardPoints || 100,
                targetValue: challenge.targetValue || 10,
                conditions: challenge.conditions || '',
                targetField: challenge.targetField || '',
            });
        }
    }, [challenge]);

    return (
        <Modal open={true} onClose={onClose} title={`Edit Challenge`} size="md">
            <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
                {/* Scrollable form area */}
                <div className="space-y-4 overflow-y-auto" style={{ flex: '1 1 auto' }}>
                    <label className="form-label">
                        Challenge Name
                        <input
                            value={challengeData.name}
                            onChange={e => handleInputChange('name', e.target.value)}
                            className="form-input mt-1"
                            placeholder="e.g., Weekly Step Goal"
                        />
                    </label>
                    <label className="form-label">
                        Description
                        <textarea
                            value={challengeData.description}
                            onChange={e => handleInputChange('description', e.target.value)}
                            className="form-textarea mt-1"
                            rows={3}
                            placeholder="Describe the challenge for your group"
                        />
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="form-label">
                            Challenge Type
                            <select
                                value={challengeData.challengeType}
                                onChange={e => handleInputChange('challengeType', e.target.value)}
                                className="form-input mt-1"
                            >
                                {Object.values(CHALLENGE_TYPE).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </label>
                        <label className="form-label">
                            Target Value
                            <input
                                type="number"
                                value={challengeData.targetValue}
                                onChange={e => handleInputChange('targetValue', e.target.value)}
                                className="form-input mt-1"
                                min="0"
                            />
                        </label>
                        <label className="form-label">
                            Start Date
                            <input
                                type="date"
                                value={challengeData.startDate}
                                onChange={e => handleInputChange('startDate', e.target.value)}
                                className="form-input mt-1"
                            />
                        </label>
                        <label className="form-label">
                            End Date
                            <input
                                type="date"
                                value={challengeData.endDate}
                                onChange={e => handleInputChange('endDate', e.target.value)}
                                className="form-input mt-1"
                            />
                        </label>
                        <label className="form-label">
                            Reward Points
                            <input
                                type="number"
                                value={challengeData.rewardPoints}
                                onChange={e => handleInputChange('rewardPoints', e.target.value)}
                                className="form-input mt-1"
                                min="0"
                            />
                        </label>
                        <label className="form-label">
                            Target Field
                            <input
                                value={challengeData.targetField}
                                onChange={e => handleInputChange('targetField', e.target.value)}
                                className="form-input mt-1"
                                placeholder="e.g., points"
                            />
                        </label>
                    </div>

                    <label className="form-label">
                        Conditions
                        <textarea
                            value={challengeData.conditions}
                            onChange={e => handleInputChange('conditions', e.target.value)}
                            className="form-textarea mt-1"
                            rows={3}
                            placeholder="Enter conditions, one per line"
                        />
                    </label>
                </div>
                {/* Sticky footer inside modal (non-scrolling) */}
                <div className="flex justify-end gap-2 mt-6" style={{ flexShrink: 0 }}>
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="btn-primary"
                        disabled={isCreating || !challengeData.name.trim() || !challengeData.startDate || !challengeData.endDate}
                    >
                        {isCreating ? 'Updating...' : 'Edit Challenge'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

const ChallengePageElements = {
    Page,
    newChallenges
};

export default ChallengePageElements;