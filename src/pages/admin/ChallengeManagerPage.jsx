import { useState, useEffect } from 'react';
import { Timestamp } from '../../services/firebase/FirebaseHelper.jsx';
import BaseModel from '../../services/interfaces/Base.jsx';
import ChallengeManagement from '../../services/ChallengeManagement.jsx';
import GroupManagement from '../../services/GroupManagementSystem.jsx';
import { CHALLENGE_TYPE, CHALLENGE_VISIBILITY } from '../../services/interfaces/Constants.jsx';
import { AdminPageLayout, AdminCard } from '../../components/ui/AdminComponents.jsx';
import '../../components/styles/sphere-styles.css';
import { Plus, Target, Trophy, Calendar, X, Search, Edit, Trash2 } from 'lucide-react';

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
            startDate: Timestamp.fromDate(new Date(startDate)),
            endDate: Timestamp.fromDate(new Date(endDate)),
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
            <div className="modal-overlay">
                <div className="modal-backdrop"></div>
                <div className="modal-content">
                    <div className="text-center py-12">
                        <div className="login-spinner mx-auto mb-4"></div>
                        <p className="text-slate-400">Creating Challenge...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onCancel}></div>
            <div className="modal-content max-w-2xl">
                <div className="modal-header">
                    <h3 className="text-xl font-bold text-gradient">Create New Challenge</h3>
                    <button 
                        onClick={onCancel}
                        className="modal-close-btn"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="modal-body space-y-4">
                    {/* Basic Info */}
                    <div className="grid-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Challenge Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={challengeName}
                                onChange={(e) => setChallengeName(e.target.value)}
                                placeholder="Enter challenge name"
                                maxLength={50}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Challenge Type *</label>
                            <select
                                className="form-input"
                                value={challengeType}
                                onChange={(e) => setChallengeType(e.target.value)}
                            >
                                <option value={CHALLENGE_TYPE.TARGET}>Target</option>
                                <option value={CHALLENGE_TYPE.STREAK}>Streak</option>
                                <option value={CHALLENGE_TYPE.ENDURANCE}>Endurance</option>
                                <option value={CHALLENGE_TYPE.FREQUENCY}>Frequency</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input"
                            rows="3"
                            value={challengeDescription}
                            onChange={(e) => setChallengeDescription(e.target.value)}
                            placeholder="Enter challenge description"
                            maxLength={200}
                        />
                    </div>

                    {/* Challenge Settings */}
                    <div className="grid-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Target Value</label>
                            <input
                                type="number"
                                className="form-input"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                placeholder="Enter target value (e.g., 100)"
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Reward Points</label>
                            <input
                                type="number"
                                className="form-input"
                                value={rewardPoints}
                                onChange={(e) => setRewardPoints(e.target.value)}
                                placeholder="Points awarded when completed"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Start Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">End Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Visibility Settings */}
                    <div className="form-group">
                        <label className="form-label">Visibility *</label>
                        <select
                            className="form-input"
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value)}
                        >
                            <option value={CHALLENGE_VISIBILITY.PUBLIC}>Public</option>
                            <option value={CHALLENGE_VISIBILITY.HIDDEN}>Hidden</option>
                            <option value={CHALLENGE_VISIBILITY.GROUP}>Group</option>
                        </select>
                    </div>

                    {/* Group Selection */}
                    {visibility === CHALLENGE_VISIBILITY.GROUP && (
                        <div className="form-group">
                            <label className="form-label">Target Group *</label>
                            {isLoadingGroups ? (
                                <div className="text-slate-400 py-4 text-center">Loading groups...</div>
                            ) : (
                                <select
                                    className="form-input"
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

                <div className="modal-footer">
                    <button
                        onClick={onCancel}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleConfirm}
                        disabled={!challengeName.trim() || !startDate || !endDate}
                    >
                        Create Challenge
                    </button>
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

    const formatDate = (ts) => {
        if (!ts) return 'N/A';
        try {
            // Handle both Date objects and timestamps
            let date;
            if (ts instanceof Date) {
                date = ts;
            } else if (typeof ts === 'number') {
                date = new Date(ts);
            } else if (ts.seconds) {
                // Firestore timestamp
                date = new Date(ts.seconds * 1000);
            } else if (ts.toDate && typeof ts.toDate === 'function') {
                // Firebase Timestamp object
                date = ts.toDate();
            } else {
                date = new Date(ts);
            }
            
            // Ensure we have a valid date
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    const getStatusText = () => {
        if (challenge.hasNotStarted()) return 'Not Started';
        if (challenge.isActive()) return 'Active';
        if (challenge.isExpired()) return 'Expired';
        return 'Unknown';
    };

    const getStatusColor = () => {
        if (challenge.hasNotStarted()) return '#F59E0B';
        if (challenge.isActive()) return '#10B981';
        if (challenge.isExpired()) return '#EF4444';
        return '#9CA3AF';
    };

    const getVisibilityColor = (visibility) => {
        const colors = {
            [CHALLENGE_VISIBILITY.PUBLIC]: '#10B981',
            [CHALLENGE_VISIBILITY.HIDDEN]: '#9CA3AF',
            [CHALLENGE_VISIBILITY.GROUP]: '#3B82F6'
        };
        return colors[visibility] || '#9CA3AF';
    };

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content max-w-3xl">
                <div className="modal-header">
                    <div>
                        <h3 className="text-xl font-bold text-gradient">{challenge.name}</h3>
                        <p className="text-sm text-slate-400">Challenge Management</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="modal-close-btn"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="modal-body space-y-6">
                    {/* Challenge Overview */}
                    <div className="card">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span 
                                        className="text-xs px-2 py-1 rounded-full"
                                        style={{ 
                                            backgroundColor: `${getStatusColor()}20`,
                                            color: getStatusColor()
                                        }}
                                    >
                                        {getStatusText()}
                                    </span>
                                    <span 
                                        className="text-xs px-2 py-1 rounded-full"
                                        style={{ 
                                            backgroundColor: `${getVisibilityColor(challenge.visibility)}20`,
                                            color: getVisibilityColor(challenge.visibility)
                                        }}
                                    >
                                        {challenge.visibility}
                                    </span>
                                </div>
                                <p className="text-slate-300 mb-3">
                                    {challenge.description || 'No description available.'}
                                </p>
                                <div className="grid-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400">Challenge ID:</span>
                                        <span className="text-slate-300 ml-2">{String(challenge.challengeId)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Type:</span>
                                        <span className="text-slate-300 ml-2">{String(challenge.challengeType)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Start Date:</span>
                                        <span className="text-slate-300 ml-2">{formatDate(challenge.startDate)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">End Date:</span>
                                        <span className="text-slate-300 ml-2">{formatDate(challenge.endDate)}</span>
                                    </div>
                                    {challenge.targetValue && (
                                        <div>
                                            <span className="text-slate-400">Target Value:</span>
                                            <span className="text-slate-300 ml-2">{String(challenge.targetValue)}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-slate-400">Reward Points:</span>
                                        <span className="text-slate-300 ml-2">{String(challenge.rewardPoints)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid-3 gap-4">
                        <div className="card text-center">
                            <div className="text-2xl font-bold text-gradient">{challenge.getParticipantCount()}</div>
                            <div className="text-sm text-slate-400">Participants</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-2xl font-bold text-gradient">{challenge.getCompletionRate().toFixed(1)}%</div>
                            <div className="text-sm text-slate-400">Completion Rate</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-2xl font-bold text-gradient">
                                {challenge.participants.filter(p => p.isCompleted()).length}
                            </div>
                            <div className="text-sm text-slate-400">Completed</div>
                        </div>
                    </div>

                    {/* Participants List */}
                    {challenge.participants.length > 0 && (
                        <div className="card">
                            <h4 className="text-lg font-semibold text-gradient mb-4">Participants</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {challenge.participants.slice(0, 10).map(participant => (
                                    <div key={participant.participantId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div>
                                            <div className="text-slate-300">User ID: {participant.userId}</div>
                                            <div className="text-sm text-slate-400">
                                                Joined: {formatDate(participant.joinedAt)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {participant.isCompleted() ? (
                                                <div>
                                                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                                                        Completed
                                                    </span>
                                                    {participant.completedAt && (
                                                        <div className="text-xs text-slate-400 mt-1">
                                                            {formatDate(participant.completedAt)}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full">
                                                    In Progress
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {challenge.participants.length > 10 && (
                                    <div className="text-center text-slate-400 py-2">
                                        ... and {challenge.participants.length - 10} more participants
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Danger Zone */}
                    <div className="card border border-red-500/20">
                        <h4 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h4>
                        <p className="text-sm text-slate-400 mb-4">
                            Once you delete a challenge, there is no going back. Please be certain.
                        </p>
                        <button
                            onClick={handleDeleteChallenge}
                            disabled={isProcessing}
                            className="btn-danger flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isProcessing ? 'Deleting...' : 'Delete Challenge'}
                        </button>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                    >
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
    const [searchTerm, setSearchTerm] = useState('');

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

    const getStatusColor = (challenge) => {
        if (challenge.isActive()) return '#10B981';
        if (challenge.isExpired()) return '#EF4444';
        return '#F59E0B';
    };

    const getStatusText = (challenge) => {
        if (challenge.isActive()) return 'Active';
        if (challenge.isExpired()) return 'Expired';
        return 'Scheduled';
    };

    const getVisibilityColor = (visibility) => {
        const colors = {
            [CHALLENGE_VISIBILITY.PUBLIC]: '#10B981',
            [CHALLENGE_VISIBILITY.HIDDEN]: '#9CA3AF',
            [CHALLENGE_VISIBILITY.GROUP]: '#3B82F6'
        };
        return colors[visibility] || '#9CA3AF';
    };

    const filteredChallenges = allChallenges.filter(challenge =>
        challenge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.challengeType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { value: allChallenges.length, label: 'Total Challenges' },
        { value: allChallenges.filter(c => c.isActive()).length, label: 'Active Now' },
        { value: allChallenges.reduce((sum, challenge) => sum + challenge.getParticipantCount(), 0), label: 'Total Participants' }
    ];

    const renderChallengeCards = () => {
        return filteredChallenges.map(challenge => (
            <AdminCard
                key={challenge.challengeId}
                onClick={() => setSelectedChallenge(challenge)}
            >
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gradient truncate">
                                {challenge.name}
                            </h3>
                            <span 
                                className="text-xs px-2 py-1 rounded-full"
                                style={{ 
                                    backgroundColor: `${getStatusColor(challenge)}20`,
                                    color: getStatusColor(challenge)
                                }}
                            >
                                {getStatusText(challenge)}
                            </span>
                        </div>
                        <p className="text-sm text-slate-300 line-clamp-2 mb-3">
                            {challenge.description || 'No description available.'}
                        </p>
                        <div className="grid-2 gap-2 text-xs text-slate-400">
                            <div>
                                <span className="block">Type</span>
                                <span className="text-slate-300">{challenge.challengeType}</span>
                            </div>
                            <div>
                                <span className="block">Reward</span>
                                <span className="text-slate-300">{challenge.rewardPoints} pts</span>
                            </div>
                            <div>
                                <span className="block">Participants</span>
                                <span className="text-slate-300">{challenge.getParticipantCount()}</span>
                            </div>
                            <div>
                                <span className="block">Visibility</span>
                                <span 
                                    className="text-xs"
                                    style={{ color: getVisibilityColor(challenge.visibility) }}
                                >
                                    {challenge.visibility}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminCard>
        ));
    };

    return (
        <>
            <AdminPageLayout
                title="Challenge Manager"
                stats={stats}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Search challenges by name, description, or type..."
                onCreateClick={() => setShowCreateChallengePopup(true)}
                createButtonText="Create Challenge"
                isLoading={isLoadingChallenges}
                emptyMessage="No challenges found."
                contentGridClass="grid-2 gap-4"
            >
                {renderChallengeCards()}
            </AdminPageLayout>

            {/* Modals */}
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
        </>
    );
}

export default ChallengeManagerPage;