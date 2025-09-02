import { useEffect, useState } from 'react';
import { ProgressBar } from '../components/ui/ExpBarComponents.jsx';
import ChallengeManagement from '../services/ChallengeManagement.jsx';
import GoalSystem from '../services/GoalSystem.jsx';
import GroupManagement from '../services/GroupManagementSystem.jsx';
import StationManager from '../services/StationManagement.jsx';
import FirestoreManager from '../services/firebase/FirestoreManager.jsx';
import BaseModel from '../services/interfaces/Base.jsx';
import { localDateTimeStringToTimestamp, localTime, toGermanDateLongFormat } from '../utils/DateUtils.jsx';
import { toDate } from '../utils/DateUtils.jsx';

import { CheckCircle, Clock, Plus, Target, Trophy, X } from 'lucide-react';
import '../components/styles/sphere-styles.css';

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

// ========== Challenge Components ==========
function ChallengeDetailModal({ challengeId, open, onClose, allChallenges, groupNames, userData, onJoinChallenge, isJoiningChallenge }) {
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProgress, setUserProgress] = useState(0);
    const [isParticipating, setIsParticipating] = useState(false);

    useEffect(() => {
        if (!open || !challengeId) return;

        const loadChallengeDetails = async () => {
            setLoading(true);
            try {
                const foundChallenge = allChallenges.find(c => c.challengeId === challengeId);
                setChallenge(foundChallenge || null);

                if (foundChallenge && userData?.uid) {
                    // Check if user is participating in this challenge
                    const participating = foundChallenge.hasParticipant(userData.uid);
                    setIsParticipating(participating);

                    if (participating) {
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
                    } else {
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
                        <div className="flex items-start gap-4" style={{ marginBottom: '20px' }}>
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
                                    <p className="text-sm text-slate-300" style={{ textAlign: 'center' }}>{challenge.description}</p>
                                )}
                            </div>
                        </div>

                        {isParticipating ? (
                            <div className="space-y-2" style={{ marginBottom: '20px' }}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Your Progress</span>
                                    <span className="text-sm text-slate-300">
                                        {userProgress} / {challenge.targetValue || 0}
                                    </span>
                                </div>
                                <ProgressBar
                                    current={userProgress}
                                    max={challenge.targetValue}
                                />
                            </div>
                        ) : (
                            <div className="text-center" style={{ marginBottom: '20px' }}>
                                <p className="text-slate-400 mb-4">You are not participating in this challenge</p>
                                {challenge.visibility === 'public' && (
                                    <button
                                        onClick={() => {
                                            onJoinChallenge(challengeId);
                                            onClose();
                                        }}
                                        className="btn-primary"
                                        disabled={isJoiningChallenge}
                                    >
                                        {isJoiningChallenge ? 'Joining...' : 'Join Challenge'}
                                    </button>
                                )}
                            </div>
                        )}

                        <span className="text-sm text-slate-400" style={{ marginBottom: '20px' }}>Details</span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: '20px' }}>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">Challenge Type</span>
                                </div>
                                <p className="text-white font-medium">{challenge.challengeType || 'N/A'}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">Target Value</span>
                                </div>
                                <p className="text-white font-medium">{challenge.targetValue || 'N/A'}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">Start Date</span>
                                </div>
                                <p className="text-white font-medium">{formatDate(challenge.startDate)}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">End Date</span>
                                </div>
                                <p className="text-white font-medium">{formatDate(challenge.endDate)}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">Reward Points</span>
                                </div>
                                <p className="text-white font-medium">{challenge.rewardPoints || 0} pts</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">Participants</span>
                                </div>
                                <p className="text-white font-medium">{challenge.getParticipantCount ? challenge.getParticipantCount() : 0}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-4">Challenge not found</div>
                )}
            </div>
        </Modal>
    );
}

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
                <Trophy className="w-4 h-4 text-yellow-400" />
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
                <ProgressBar
                    current={userProgress}
                    max={challenge.targetValue}
                />
            </div>
        </div>
    );
}

function ClickablePublicChallengeCard({ challenge, onClick, onJoin, isJoining }) {
    const getChallengeSourceText = (challenge) => {
        if (challenge.visibility === 'public') return 'Public';
        if (challenge.visibility === 'hidden') return 'Achievement';
        if (challenge.visibility === 'group') return 'Group';
        return 'Unknown';
    };

    return (
        <div className='card hover:bg-slate-800/50 transition-colors'>
            <div
                className='cursor-pointer'
                onClick={() => onClick(challenge.challengeId)}
            >
                <div className='flex items-center gap-2 mb-2'>
                    <Trophy className="w-4 h-4 text-yellow-400" />
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
            </div>
            <div className='mt-3 flex justify-end'>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onJoin(challenge.challengeId);
                    }}
                    className="btn-primary"
                    disabled={isJoining}
                >
                    {isJoining ? 'Joining...' : 'Join Challenge'}
                </button>
            </div>
        </div>
    );
}

// ========== Goal Components ==========
function GoalForm({ goalToEdit, onSubmit, onCancel, isProcessing, submitText, stations }) {
    const [formData, setFormData] = useState(() => {
        const inputFields = [
            { key: 'name', type: 'text' },
            { key: 'description', type: 'textarea' },
            { key: 'targetValue', type: 'number' },
            { key: 'stationId', type: 'select' },
            { key: 'deadline', type: 'datetime-local' },
        ];

        return inputFields.reduce((acc, field) => {
            const sourceValue = goalToEdit?.[field.key];
            if (field.type === 'datetime-local' && sourceValue?.toDate) {
                acc[field.key] = localTime(sourceValue);
            } else {
                acc[field.key] = sourceValue ?? (field.type === 'number' ? 0 : '');
            }
            return acc;
        }, {});
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (formData.name && formData.name.trim()) {
            const submitData = {
                name: formData.name.trim(),
                description: formData.description?.trim() || '',
                targetValue: parseInt(formData.targetValue, 10) || 0,
                stationId: formData.stationId || null,
                deadline: formData.deadline ? localDateTimeStringToTimestamp(formData.deadline) : null,
            };

            if (goalToEdit?.uid) {
                submitData.uid = goalToEdit.uid;
            }
            onSubmit(submitData);
        }
    };

    const isValid = formData.name?.trim() !== '';

    return (
        <Modal open={true} onClose={onCancel} title={goalToEdit ? 'Edit Goal' : 'Create New Goal'} size="lg">
            <div className="p-4 space-y-4">
                <div className='grid-2'>
                    <label className="form-label">
                        Goal Name
                        <input
                            value={formData.name}
                            onChange={e => handleInputChange('name', e.target.value)}
                            className="form-input mt-1"
                            placeholder="Enter goal name"
                            maxLength={50}
                        />
                    </label>

                    <label className="form-label">
                        Description
                        <textarea
                            value={formData.description}
                            onChange={e => handleInputChange('description', e.target.value)}
                            className="form-textarea mt-1"
                            rows={3}
                            placeholder="Enter description"
                        />
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="form-label">
                            Target Value
                            <input
                                type="number"
                                value={formData.targetValue}
                                onChange={e => handleInputChange('targetValue', e.target.value)}
                                className="form-input mt-1"
                                min="1"
                                placeholder="Enter target value"
                            />
                        </label>

                        <label className="form-label">
                            Station
                            <select
                                value={formData.stationId}
                                onChange={e => handleInputChange('stationId', e.target.value)}
                                className="form-input mt-1"
                            >
                                <option value="">Select Station...</option>
                                {stations && stations.map(station => (
                                    <option key={station.uid} value={station.uid}>
                                        {station.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className="form-label">
                        Deadline
                        <input
                            type="datetime-local"
                            value={formData.deadline}
                            onChange={e => handleInputChange('deadline', e.target.value)}
                            className="form-input mt-1"
                        />
                    </label>

                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={onCancel} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="btn-primary"
                            disabled={isProcessing || !isValid}
                        >
                            {isProcessing ? (goalToEdit ? 'Updating...' : 'Creating...') : submitText}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

function GoalDetailModal({ goal, open, onClose, onGoalUpdated, userData, stations }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [manualProgressValue, setManualProgressValue] = useState(goal?.currentValue || 0);

    useEffect(() => {
        if (goal) {
            setManualProgressValue(goal.currentValue || 0);
        }
    }, [goal]);

    if (!open || !goal) return null;

    const handleDeleteGoal = async () => {
        if (confirm(`Are you sure you want to delete the goal "${goal.name}"? This action cannot be undone.`)) {
            setIsProcessing(true);
            try {
                await GoalSystem.deleteGoal(goal.uid, userData.uid);
                onGoalUpdated();
                onClose();
            } catch (error) {
                console.error('Failed to delete goal:', error);
                alert('Failed to delete goal: ' + error.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleUpdateGoal = async (updates) => {
        setIsUpdating(true);
        try {
            await GoalSystem.updateGoal(goal.uid, userData.uid, updates);
            setShowEditPopup(false);
            onGoalUpdated();
        } catch (error) {
            console.error('Failed to update goal:', error);
            alert('Failed to update goal: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleProgressUpdate = async () => {
        const newValue = parseInt(manualProgressValue, 10);
        if (isNaN(newValue) || newValue < 0) {
            alert('Please enter a valid progress value.');
            return;
        }

        setIsProcessing(true);
        try {
            await GoalSystem.updateGoalProgress(goal.uid, userData.uid, newValue);
            onGoalUpdated();
        } catch (error) {
            console.error('Failed to update goal progress:', error);
            alert('Failed to update goal progress: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const progressPercentage = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
    const formattedDeadline = goal.deadline ? toGermanDateLongFormat(goal.deadline) : 'No deadline set';

    const isOverdue = goal.deadline?.toDate && !goal.isCompleted && new Date() > goal.deadline.toDate();
    const station = stations?.find(s => s.uid === goal.stationId);
    const stationName = station ? station.name : 'No station selected';

    return (
        <>
            <Modal open={open} onClose={onClose} title="Goal Details" size="lg">
                <div className="p-4 space-y-4">
                    <div className='grid-2'>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-slate-400">Name:</span>
                            <span className="text-white ml-2">{goal.name || 'No name available.'}
                                {goal.isCompleted && (
                                    <span className="text-green-400 text-sm ml-2">(Completed)</span>
                                )}
                                {isOverdue && (
                                    <span className="text-red-400 text-sm ml-2">(Overdue)</span>
                                )}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-slate-400">Description:</span>
                            <span className="text-white ml-2">{goal.description || 'No description available.'}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-slate-400">Station:</span>
                            <span className="text-white ml-2">{stationName}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-slate-400">Progress:</span>
                            <span className="text-white ml-2">{goal.currentValue} / {goal.targetValue}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-slate-400">Deadline:</span>
                            <span className="text-white ml-2">{formattedDeadline}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={manualProgressValue}
                                onChange={(e) => setManualProgressValue(e.target.value)}
                                className="form-input flex-1"
                                min="0"
                                max={goal.targetValue * 2}
                                placeholder="Update progress"
                            />
                            <button
                                onClick={handleProgressUpdate}
                                className="btn-primary"
                                disabled={isProcessing}
                            >
                                Update
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className='text-slate-400 text-sm mb-3 text-center'>
                            Progress: {goal.currentValue}/{goal.targetValue} ({progressPercentage}%)
                        </div>                        
                        <ProgressBar
                            current={goal.currentValue}
                            max={goal.targetValue}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <div>
                            <button
                                onClick={handleDeleteGoal}
                                className="btn-danger p-4"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Deleting...' : 'Delete Goal'}
                            </button>
                            <button
                                onClick={() => setShowEditPopup(true)}
                                className="btn-secondary p-4"
                                disabled={isProcessing}
                            >
                                Edit Goal
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {showEditPopup && (
                <GoalForm
                    goalToEdit={goal}
                    onSubmit={handleUpdateGoal}
                    onCancel={() => setShowEditPopup(false)}
                    isProcessing={isUpdating}
                    submitText="Update Goal"
                    stations={stations}
                />
            )}
        </>
    );
}

function ClickableGoalCard({ goal, stations, onClick }) {
    const progressPercentage = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
    const isOverdue = goal.deadline?.toDate && !goal.isCompleted && new Date() > goal.deadline.toDate();
    const station = stations.find(s => s.uid === goal.stationId);
    const formattedDeadline = goal.deadline ? toGermanDateLongFormat(goal.deadline) : 'No deadline set';

    return (
        <div
            className='card cursor-pointer hover:bg-slate-800/50 transition-colors'
            onClick={() => onClick(goal)}
        >
            {/* Top row with title and status */}
            <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className='text-gradient font-semibold'>
                        {goal.name}
                    </span>
                    {goal.isCompleted && (
                        <span className='text-green-400 text-xs'>(Completed)</span>
                    )}
                    {isOverdue && (
                        <span className='text-red-400 text-xs'>(Overdue)</span>
                    )}

                </div>
                <div className='flex items-center gap-2'>
                </div>
                <div>
                    {station && (
                        <div className='text-slate-400 text-sm'>
                            Station: <span className='text-white'>{station.name}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className='flex items-center justify-between mb-2'>
                <div className='text-slate-400 text-sm'>
                    Description: {goal.description || 'No description available.'}
                </div>
                <div>
                    {goal.deadline && (
                        <div className='text-slate-400 text-xs'>
                            Deadline: <span className='text-white'>{formattedDeadline}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className='text-slate-400 text-sm mb-3 text-center'>
                Progress: {goal.currentValue}/{goal.targetValue} ({progressPercentage}%)
            </div>
            <div className='mt-3'>
                <ProgressBar
                    current={goal.currentValue}
                    max={goal.targetValue}
                />
            </div>
        </div>
    );
}

function ProgressPage({ data }) {
    const userData = data;

    // Challenge state
    const [activeChallenges, setActiveChallenges] = useState([]);
    const [availablePublicChallenges, setAvailablePublicChallenges] = useState([]);
    const [groupNames, setGroupNames] = useState({});
    const [isLoadingChallenges, setIsLoadingChallenges] = useState(true);
    const [selectedChallengeId, setSelectedChallengeId] = useState(null);
    const [isJoiningChallenge, setIsJoiningChallenge] = useState(false);

    // Goal state
    const [goals, setGoals] = useState([]);
    const [stations, setStations] = useState([]);
    const [isLoadingGoals, setIsLoadingGoals] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [showCreateGoal, setShowCreateGoal] = useState(false);
    const [isCreatingGoal, setIsCreatingGoal] = useState(false);

    useEffect(() => {
        if (userData && userData.uid) {
            loadUserActiveChallenges();
            loadAvailablePublicChallenges();
            loadGoals();
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

    const loadAvailablePublicChallenges = async () => {
        try {
            const publicChallenges = await ChallengeManagement.getPublicChallenges();

            // Filter to only show public challenges that the user is not already participating in
            const availableChallenges = publicChallenges.filter(challenge =>
                challenge.isActive() && !challenge.hasParticipant(userData.uid)
            );

            setAvailablePublicChallenges(availableChallenges);
        } catch (error) {
            console.error('Failed to load available public challenges:', error);
            setAvailablePublicChallenges([]);
        }
    };

    const loadGoals = async () => {
        setIsLoadingGoals(true);
        try {
            const goalData = await GoalSystem.getUserGoals(userData.uid);
            setGoals(goalData);

            const stationData = await StationManager.loadAll();
            setStations(stationData);

            if (selectedGoal) {
                const updatedSelectedGoal = goalData.find(g => g.uid === selectedGoal.uid);
                if (updatedSelectedGoal) {
                    setSelectedGoal(updatedSelectedGoal);
                } else {
                    setSelectedGoal(null);
                }
            }
        } catch (error) {
            console.error('Failed to load goals:', error);
            setGoals([]);
            setStations([]);
        } finally {
            setIsLoadingGoals(false);
        }
    };

    const handleChallengeClick = (challengeId) => {
        setSelectedChallengeId(challengeId);
    };

    const handleJoinChallenge = async (challengeId) => {
        setIsJoiningChallenge(true);
        try {
            await ChallengeManagement.joinChallenge(challengeId, userData.uid);
            // Refresh both challenge lists
            await loadUserActiveChallenges();
            await loadAvailablePublicChallenges();
        } catch (error) {
            console.error('Failed to join challenge:', error);
            alert('Failed to join challenge: ' + error.message);
        } finally {
            setIsJoiningChallenge(false);
        }
    };

    const handleGoalClick = (goal) => {
        setSelectedGoal(goal);
    };

    const handleGoalCreation = async (data) => {
        setIsCreatingGoal(true);
        try {
            data.userId = userData.uid;
            await GoalSystem.createGoal(userData.uid, data);
            setShowCreateGoal(false);
            await loadGoals();
        } catch (error) {
            console.error('Failed to create goal:', error);
            alert('Failed to create goal: ' + error.message);
        } finally {
            setIsCreatingGoal(false);
        }
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
                        <h2 className="screen-title mb-6">Progress Tracking</h2>

                        {/* Challenges Section */}
                        <div className="mb-8">
                            <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                                My Challenges
                            </h3>

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
                        </div>

                        {/* Available Public Challenges Section */}
                        <div className="mb-8">
                            <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-green-400" />
                                Available Public Challenges
                            </h3>

                            {isLoadingChallenges ? (
                                <div className="text-slate-400 text-center py-6">
                                    Loading available challenges...
                                </div>
                            ) : availablePublicChallenges.length === 0 ? (
                                <div className="text-slate-400 text-center py-6">
                                    No public challenges available to join
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {availablePublicChallenges.map(challenge => (
                                        <ClickablePublicChallengeCard
                                            key={challenge.challengeId}
                                            challenge={challenge}
                                            onClick={handleChallengeClick}
                                            onJoin={handleJoinChallenge}
                                            isJoining={isJoiningChallenge}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Goals Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-slate-200 font-semibold flex items-center gap-2">
                                    <Target className="w-5 h-5 text-blue-400" />
                                    My Goals
                                </h3>
                                <button
                                    onClick={() => setShowCreateGoal(true)}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Goal
                                </button>
                            </div>

                            {isLoadingGoals ? (
                                <div className="text-slate-400 text-center py-6">
                                    Loading goals...
                                </div>
                            ) : goals.length === 0 ? (
                                <div className="text-slate-400 text-center py-6">
                                    No goals found. Create one to get started!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {goals.map(goal => (
                                        <ClickableGoalCard
                                            key={goal.uid}
                                            goal={goal}
                                            stations={stations}
                                            onClick={handleGoalClick}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Challenge Detail Modal */}
            <ChallengeDetailModal
                challengeId={selectedChallengeId}
                open={!!selectedChallengeId}
                onClose={() => setSelectedChallengeId(null)}
                allChallenges={[...activeChallenges, ...availablePublicChallenges]}
                groupNames={groupNames}
                userData={userData}
                onJoinChallenge={handleJoinChallenge}
                isJoiningChallenge={isJoiningChallenge}
            />

            {/* Goal Detail Modal */}
            <GoalDetailModal
                goal={selectedGoal}
                open={!!selectedGoal}
                onClose={() => setSelectedGoal(null)}
                onGoalUpdated={loadGoals}
                userData={userData}
                stations={stations}
            />

            {/* Create Goal Modal */}
            {showCreateGoal && (
                <GoalForm
                    onSubmit={handleGoalCreation}
                    onCancel={() => setShowCreateGoal(false)}
                    isProcessing={isCreatingGoal}
                    submitText="Create Goal"
                    stations={stations}
                />
            )}
        </>
    );
}

export default ProgressPage;
