import { useState, useEffect } from 'react';
import ChallengeManagement from '../services/firebase/ChallengeManagement';
import GroupManagement from '../services/firebase/GroupManagementSystem';
import { CHALLENGE_TYPE, CHALLENGE_VISIBILITY } from '../services/interfaces/constants';
import '../components/styles/LayoutElements.css';

function CreateChallengePopup({ onCreateChallenge, onCancel, isCreating }) {
    const [challengeName, setChallengeName] = useState('');
    const [challengeDescription, setChallengeDescription] = useState('');
    const [challengeType, setChallengeType] = useState(CHALLENGE_TYPE.TARGET);
    const [visibility, setVisibility] = useState(CHALLENGE_VISIBILITY.PUBLIC);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rewardPoints, setRewardPoints] = useState(0);
    const [targetValue, setTargetValue] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    
    const [allGroups, setAllGroups] = useState([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);

    useEffect(() => {
        if (visibility === CHALLENGE_VISIBILITY.GROUP) {
            loadAllGroups();
        }
    }, [visibility]);

    const loadAllGroups = async () => {
        try {
            setIsLoadingGroups(true);
            const groups = await GroupManagement.getAllGroups();
            setAllGroups(groups);
        } catch (error) {
            console.error('Failed to load groups:', error);
            setAllGroups([]);
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const handleConfirm = async () => {
        if (!challengeName.trim() || !startDate || !endDate) {
            alert('Please fill in all required fields');
            return;
        }

        if (new Date(endDate) <= new Date(startDate)) {
            alert('End date must be after start date');
            return;
        }

        if (visibility === CHALLENGE_VISIBILITY.GROUP && !selectedGroupId) {
            alert('Please select a group for group challenge');
            return;
        }

        const challengeData = {
            name: challengeName.trim(),
            description: challengeDescription.trim(),
            challengeType: challengeType,
            visibility: visibility,
            startDate: new Date(startDate).getTime(),
            endDate: new Date(endDate).getTime(),
            rewardPoints: parseInt(rewardPoints) || 0,
            targetValue: targetValue ? parseFloat(targetValue) : null,
            groupId: visibility === CHALLENGE_VISIBILITY.GROUP ? selectedGroupId : null,
            creatorId: visibility === CHALLENGE_VISIBILITY.GROUP ? 
                allGroups.find(g => g.groupId === selectedGroupId)?.createdBy : 
                'admin' // Admin이 생성하는 경우
        };
        
        onCreateChallenge(challengeData);
    };

    if (isCreating) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>Creating Challenge...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>Create New Challenge</h2>
                
                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Challenge Name</label>
                            <input 
                                className='Input'
                                type="text"
                                value={challengeName}
                                onChange={(e) => setChallengeName(e.target.value)}
                                placeholder="Enter challenge name"
                                maxLength={50}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Description</label>
                            <input 
                                className='Input'
                                type="text"
                                value={challengeDescription}
                                onChange={(e) => setChallengeDescription(e.target.value)}
                                placeholder="Enter challenge description"
                                maxLength={200}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Challenge Type</label>
                            <select 
                                className='Input'
                                value={challengeType}
                                onChange={(e) => setChallengeType(e.target.value)}
                            >
                                <option value={CHALLENGE_TYPE.TARGET}>Target</option>
                                <option value={CHALLENGE_TYPE.STREAK}>Streak</option>
                                <option value={CHALLENGE_TYPE.ENDURANCE}>Endurance</option>
                                <option value={CHALLENGE_TYPE.FREQUENCY}>Frequency</option>
                            </select>
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Visibility</label>
                            <select 
                                className='Input'
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                            >
                                <option value={CHALLENGE_VISIBILITY.PUBLIC}>Public</option>
                                <option value={CHALLENGE_VISIBILITY.HIDDEN}>Hidden</option>
                                <option value={CHALLENGE_VISIBILITY.GROUP}>Group</option>
                            </select>
                        </div>

                        {visibility === CHALLENGE_VISIBILITY.GROUP && (
                            <div className='BadgeInputGroup'>
                                <label className='BadgeInputLabel'>Target Group</label>
                                {isLoadingGroups ? (
                                    <div style={{ color: '#A0A0A0', padding: '10px' }}>Loading groups...</div>
                                ) : (
                                    <select 
                                        className='Input'
                                        value={selectedGroupId}
                                        onChange={(e) => setSelectedGroupId(e.target.value)}
                                    >
                                        <option value="">Select a group</option>
                                        {allGroups.map(group => (
                                            <option key={group.groupId} value={group.groupId}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>

                    <div className='BadgeInputSection'>
                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Start Date</label>
                            <input 
                                className='Input'
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>End Date</label>
                            <input 
                                className='Input'
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Reward Points</label>
                            <input 
                                className='Input'
                                type="number"
                                value={rewardPoints}
                                onChange={(e) => setRewardPoints(e.target.value)}
                                placeholder="Points awarded when completed"
                                min="0"
                            />
                        </div>

                        <div className='BadgeInputGroup'>
                            <label className='BadgeInputLabel'>Target Value</label>
                            <input 
                                className='Input'
                                type="number"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                placeholder="Enter target value (e.g., 100)"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className='BadgeCreateFooter'>
                    <div className='Line'></div>
                    <div className='Buttonfield'>
                        <button className='CancelButton' onClick={onCancel}>
                            Cancel
                        </button>
                        <button 
                            className='ConfirmButton' 
                            onClick={handleConfirm}
                            disabled={!challengeName.trim() || !startDate || !endDate}
                        >
                            Create Challenge
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdminChallengeDetailPopup({ challenge, onClose, onChallengeUpdated }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDeleteChallenge = async () => {
        const confirmDelete = confirm(`Are you sure you want to delete the challenge "${challenge.name}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        setIsProcessing(true);
        try {
            await ChallengeManagement.deleteChallenge(challenge.challengeId);
            onChallengeUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to delete challenge:', error);
            alert('Failed to delete challenge: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusText = () => {
        if (challenge.hasNotStarted()) return 'Not Started';
        if (challenge.isActive()) return 'Active';
        if (challenge.isExpired()) return 'Expired';
        return 'Unknown';
    };

    const getStatusColor = () => {
        if (challenge.hasNotStarted()) return '#A0A0A0';
        if (challenge.isActive()) return '#00FF94';
        if (challenge.isExpired()) return '#FF4757';
        return '#A0A0A0';
    };

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Challenge Management</h2>
                
                <div className='GroupDetailContainer'>
                    <div className='GroupDetailHeader' style={{ textAlign: 'left' }}>
                        <span style={{ color: 'var(--main-color)' }}>{challenge.name}</span>
                        <span style={{ fontSize: '14px', color: getStatusColor(), marginLeft: '12px' }}>
                            ({getStatusText()})
                        </span>
                    </div>
                    
                    <div className='GroupDetailDescription' style={{ textAlign: 'left' }}>
                        {challenge.description || 'No description available.'}
                    </div>
                    
                    <div className='GroupDetailInfo' style={{ textAlign: 'left' }}>
                        <div>Challenge ID: {challenge.challengeId}</div>
                        <div>Type: {challenge.challengeType}</div>
                        <div>Visibility: {challenge.visibility}</div>
                        {challenge.groupId && <div>Group ID: {challenge.groupId}</div>}
                        <div>Participants: {challenge.getParticipantCount()}</div>
                        <div>Completion Rate: {challenge.getCompletionRate().toFixed(1)}%</div>
                        <div>Reward Points: {challenge.rewardPoints}</div>
                        {challenge.targetValue && <div>Target Value: {challenge.targetValue}</div>}
                        <div>Start Date: {formatDate(challenge.startDate)}</div>
                        <div>End Date: {formatDate(challenge.endDate)}</div>
                    </div>

                    {/* 참가자 목록 */}
                    {challenge.participants.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <div className="GuideText" style={{ textAlign: 'center' }}>Participants</div>
                            {challenge.participants.slice(0, 10).map(participant => (
                                <div key={participant.participantId} className="GroupJoinItem">
                                    <div style={{ 
                                        color: 'var(--main-color)', 
                                        margin: '16px 0px 12px 16px',
                                        fontSize: '15px'
                                    }}>
                                        User ID: {participant.userId}
                                        {participant.isCompleted() && <span style={{ fontSize: '12px', color: '#00FF94' }}> (Completed)</span>}
                                    </div>
                                    <div style={{ 
                                        color: 'var(--light-color)', 
                                        margin: '0 16px 16px 16px',
                                        fontSize: '13px'
                                    }}>
                                        Joined: {formatDate(participant.joinedAt)}
                                        {participant.completedAt && ` | Completed: ${formatDate(participant.completedAt)}`}
                                    </div>
                                </div>
                            ))}
                            {challenge.participants.length > 50 && (
                                <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '10px' }}>
                                    ... and {challenge.participants.length - 10} more participants
                                </div>
                            )}
                        </div>
                    )}

                    <div className="GroupActionButtons" style={{ marginTop: '40px' }}>
                        <button 
                            className='GroupActionButton'
                            onClick={handleDeleteChallenge}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Deleting...' : 'Delete Challenge'}
                        </button>
                    </div>
                </div>
                
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function ChallengeManagerPage() {
    const [allChallenges, setAllChallenges] = useState([]);
    const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [showCreateChallengePopup, setShowCreateChallengePopup] = useState(false);
    const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

    useEffect(() => {
        loadAllChallenges();
    }, []);

    const loadAllChallenges = async () => {
        try {
            setIsLoadingChallenges(true);
            const challenges = await ChallengeManagement.getAllChallenges();
            setAllChallenges(challenges);
        } catch (error) {
            console.error('Failed to load all challenges:', error);
            setAllChallenges([]);
        } finally {
            setIsLoadingChallenges(false);
        }
    };

    const handleChallengeCreation = async (challengeData) => {
        setIsCreatingChallenge(true);
        try {
            await ChallengeManagement.createChallenge(challengeData);
            setShowCreateChallengePopup(false);
            await loadAllChallenges();
        } catch (error) {
            console.error('Failed to create challenge:', error);
            alert('Failed to create challenge: ' + error.message);
        } finally {
            setIsCreatingChallenge(false);
        }
    };

    const getVisibilityBadge = (visibility) => {
        const colors = {
            [CHALLENGE_VISIBILITY.PUBLIC]: '#00FF94',
            [CHALLENGE_VISIBILITY.HIDDEN]: '#A0A0A0',
            [CHALLENGE_VISIBILITY.GROUP]: '#0070dd'
        };
        return <span style={{ fontSize: '12px', color: colors[visibility] }}>({visibility})</span>;
    };

    return (
        <div className="AppContents">
            <h2 style={{ color: '#E5E5E5', margin: '0 0 20px 0' }}>Challenge Manager</h2>

            <div className="AdminGroupContainer">
                <div className="GuideText">All Challenges</div>
                
                {isLoadingChallenges ? (
                    <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                        Loading...
                    </div>
                ) : allChallenges.length === 0 ? (
                    <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>
                        No Challenges Found
                    </div>
                ) : (
                    allChallenges.map(challenge => (
                        <div 
                            key={challenge.challengeId}
                            className="GroupExerciseContainer"
                            onClick={() => setSelectedChallenge(challenge)}
                        >
                            <div className="GroupExerciseHeader" style={{ color: 'var(--main-color)' }}>
                                {challenge.name} {getVisibilityBadge(challenge.visibility)}
                            </div>
                            <div className="GroupExerciseContents">
                                {challenge.description || 'No description available.'}
                            </div>
                            <div style={{ margin: '0 16px 16px 16px', fontSize: '12px', color: '#A0A0A0' }}>
                                Type: {challenge.challengeType} | Participants: {challenge.getParticipantCount()} | 
                                Reward: {challenge.rewardPoints} pts | Status: {challenge.isActive() ? 'Active' : challenge.isExpired() ? 'Expired' : 'Not Started'}
                            </div>
                        </div>
                    ))
                )}

                <button 
                    className="AdminActionButton"
                    onClick={() => setShowCreateChallengePopup(true)}
                >
                    Create New Challenge
                </button>
            </div>

            {showCreateChallengePopup && (
                <CreateChallengePopup
                    onCreateChallenge={handleChallengeCreation}
                    onCancel={() => setShowCreateChallengePopup(false)}
                    isCreating={isCreatingChallenge}
                />
            )}

            {selectedChallenge && (
                <AdminChallengeDetailPopup
                    challenge={selectedChallenge}
                    onClose={() => setSelectedChallenge(null)}
                    onChallengeUpdated={loadAllChallenges}
                />
            )}
        </div>
    );
}

export default ChallengeManagerPage;