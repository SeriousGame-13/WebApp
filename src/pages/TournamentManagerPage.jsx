import { useState, useEffect } from 'react';
import '../components/styles/LayoutElements.css';
import TournamentManagement from '../services/firebase/TournamentManagement';
import UserManagement from '../services/firebase/UserManagementSystem';
import { CHALLENGE_VISIBILITY } from '../services/interfaces/constants';
import {localDateTimeStringToTimestamp, localISODateTime} from '../utils/DateUtils';


function FormBase({ 
    title, 
    inputFields, 
    initialData, 
    onSubmit, 
    onCancel, 
    isProcessing, 
    submitText,
    groups = null,
    exercises = null
}) {
    const [formData, setFormData] = useState(() => {
        return inputFields.reduce((acc, field) => {
            const sourceValue = initialData?.[field.key];
            if (field.type === 'datetime-local' && sourceValue?.toDate) {
                acc[field.key] = localISODateTime(sourceValue);
            } else if (field.type === 'select' && field.key === 'visibility') {
                acc[field.key] = sourceValue || CHALLENGE_VISIBILITY.PUBLIC;
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
            const submitData = inputFields.reduce((acc, field) => {
                const value = formData[field.key];
                if (field.type === 'number') {
                    acc[field.key] = parseInt(value, 10) || 0;
                } else if (field.type === 'datetime-local') {
                    acc[field.key] = value ? localDateTimeStringToTimestamp(value) : null;
                } else if (field.key === 'visibility') {
                    acc[field.key] = value || CHALLENGE_VISIBILITY.PUBLIC;
                } else if (field.key === 'groupId' || field.key === 'targetExerciseId') {
                    acc[field.key] = value || null;
                } else if (typeof value === 'string') {
                    acc[field.key] = value.trim();
                } else {
                    acc[field.key] = value;
                }
                return acc;
            }, {});
            
            if (initialData?.uid) {
                submitData.uid = initialData.uid;
            }
            onSubmit(submitData);
        }
    };

    const isValid = formData.name?.trim() !== '';

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (isValid && !isProcessing) {
                    handleSubmit();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isValid, isProcessing, formData]);

    if (isProcessing) {
        return (
            <div className='PopupBackground'>
                <div className='PopupContainer'>
                    <h2>{initialData ? 'Updating' : 'Creating'}...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>{title}</h2>
                <div className='BadgeCreateContent' style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '15px' }}>
                    <div className='BadgeInputSection'>
                        {inputFields.map(field => (
                            <div key={field.key} className='BadgeInputGroup'>
                                <label className='BadgeInputLabel'>{field.label}</label>
                                {field.type === 'select' ? (
                                    <select
                                        className='Input'
                                        value={formData[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    >
                                        <option value="" disabled>{field.placeholder}</option>
                                        {field.key === 'visibility' && (
                                            <>
                                                <option value={CHALLENGE_VISIBILITY.PUBLIC}>Public</option>
                                                <option value={CHALLENGE_VISIBILITY.GROUP}>Group Only</option>
                                                <option value={CHALLENGE_VISIBILITY.PRIVATE}>Private</option>
                                            </>
                                        )}
                                        {field.key === 'groupId' && groups && groups.map(group => (
                                            <option key={group.uid} value={group.uid}>
                                                {group.name}
                                            </option>
                                        ))}
                                        {field.key === 'targetExerciseId' && exercises && exercises.map(exercise => (
                                            <option key={exercise.uid} value={exercise.uid}>
                                                {exercise.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        className='Input'
                                        value={formData[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={4}
                                        style={{ resize: 'vertical' }}
                                    />
                                ) : (
                                    <input
                                        className='Input'
                                        type={field.type}
                                        value={formData[field.key]}
                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        maxLength={field.maxLength}
                                        min={field.min}
                                    />
                                )}
                            </div>
                        ))}
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
                            onClick={handleSubmit}
                            disabled={!isValid}
                        >
                            {submitText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TournamentForm(props) {
    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter tournament name' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
        { key: 'startDate', label: 'Start Date', type: 'datetime-local' },
        { key: 'endDate', label: 'End Date', type: 'datetime-local' },
        { key: 'visibility', label: 'Visibility', type: 'select', placeholder: 'Select Visibility...' },
        { key: 'groupId', label: 'Group (Optional)', type: 'select', placeholder: 'Select Group...' },
        { key: 'targetExerciseId', label: 'Target Exercise (Optional)', type: 'select', placeholder: 'Select Exercise...' },
        { key: 'targetValue', label: 'Target Value', type: 'number', min: 0, placeholder: 'Enter target value' },
        { key: 'rewardPoints', label: 'Reward Points', type: 'number', min: 0, placeholder: 'Enter reward points' },
    ];

    const title = props.tournamentToEdit ? 'Edit Tournament' : 'Create New Tournament';

    return (
        <FormBase
            title={title}
            inputFields={inputFields}
            initialData={props.tournamentToEdit}
            onSubmit={props.onSubmit}
            onCancel={props.onCancel}
            isProcessing={props.isProcessing}
            submitText={props.submitText}
            groups={props.groups}
            exercises={props.exercises}
        />
    );
}

function TournamentDetailPopup({ tournament, onClose, onTournamentUpdated, user, groups, exercises }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [participantDetails, setParticipantDetails] = useState({});
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

    useEffect(() => {
        if (showEditPopup) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showEditPopup, onClose]);

    useEffect(() => {
        loadParticipants();
    }, [tournament.uid]);

    const loadParticipants = async () => {
        setIsLoadingParticipants(true);
        try {
            const participantList = await TournamentManagement.getTournamentParticipants(tournament.uid);
            setParticipants(participantList);
            
            // Load user details for each participant
            const details = {};
            for (const participant of participantList) {
                try {
                    const user = await UserManagement.getUserDetails(participant.userId);
                    details[participant.userId] = user;
                } catch (error) {
                    console.error(`Failed to load details for user ${participant.userId}:`, error);
                }
            }
            setParticipantDetails(details);
        } catch (error) {
            console.error('Failed to load tournament participants:', error);
        } finally {
            setIsLoadingParticipants(false);
        }
    };

    const handleDeleteTournament = async () => {
        if (confirm(`Are you sure you want to delete the tournament "${tournament.name}"? This action cannot be undone.`)) {
            setIsProcessing(true);
            try {
                await TournamentManagement.deleteTournament(tournament.uid);
                onTournamentUpdated();
                onClose();
            } catch (error) {
                console.error('Failed to delete tournament:', error);
                alert('Failed to delete tournament: ' + error.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };
    
    const handleUpdateTournament = async (updates) => {
        setIsUpdating(true);
        try {
            await TournamentManagement.updateTournament(tournament.uid, updates);
            setShowEditPopup(false);
            onTournamentUpdated();
        } catch (error) {
            console.error('Failed to update tournament:', error);
            alert('Failed to update tournament: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveParticipant = async (userId) => {
        if (confirm(`Are you sure you want to remove this participant from the tournament?`)) {
            setIsProcessing(true);
            try {
                await TournamentManagement.leaveTournament(tournament.uid, userId);
                await loadParticipants();
            } catch (error) {
                console.error('Failed to remove participant:', error);
                alert('Failed to remove participant: ' + error.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    // Find group name if available
    const group = groups?.find(g => g.uid === tournament.groupId);
    const groupName = group ? group.name : 'No group selected';

    // Find exercise name if available
    const exercise = exercises?.find(e => e.uid === tournament.targetExerciseId);
    const exerciseName = exercise ? exercise.name : 'No exercise selected';

    // Format dates
    const startDate = tournament.startDate?.toDate ? 
        tournament.startDate.toDate().toLocaleDateString() + ' ' + tournament.startDate.toDate().toLocaleTimeString() : 
        'No start date set';
    
    const endDate = tournament.endDate?.toDate ? 
        tournament.endDate.toDate().toLocaleDateString() + ' ' + tournament.endDate.toDate().toLocaleTimeString() : 
        'No end date set';

    // Get visibility text
    let visibilityText = 'Unknown';
    if (tournament.visibility === CHALLENGE_VISIBILITY.PUBLIC) visibilityText = 'Public';
    else if (tournament.visibility === CHALLENGE_VISIBILITY.GROUP) visibilityText = 'Group Only';
    else if (tournament.visibility === CHALLENGE_VISIBILITY.PRIVATE) visibilityText = 'Private';

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Tournament Details</h2>
                <div className='GroupDetailContainer'>
                    <div className='BadgeDetailHeader'>
                        <div className='BadgeInfoContainer'>
                            <div className='BadgeDetailTitle' style={{ color: 'var(--main-color)' }}>
                                {tournament.name}
                            </div>
                        </div>
                    </div>
                    <div className='GroupDetailDescription' style={{ textAlign: 'left' }}>
                        {tournament.description || 'No description available.'}
                    </div>
                    <div className='GroupDetailInfo' style={{ textAlign: 'left' }}>
                        <div>Tournament ID: {tournament.uid}</div>
                        <div>Visibility: {visibilityText}</div>
                        <div>Group: {groupName}</div>
                        <div>Target Exercise: {exerciseName}</div>
                        <div>Target Value: {tournament.targetValue || 'Not specified'}</div>
                        <div>Reward Points: {tournament.rewardPoints || 0}</div>
                        <div>Start Date: {startDate}</div>
                        <div>End Date: {endDate}</div>
                        <div>Creator ID: {tournament.creatorId}</div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <h3 style={{ color: 'var(--main-color)', marginBottom: '10px' }}>Participants ({participants.length})</h3>
                        
                        {isLoadingParticipants ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>Loading participants...</div>
                        ) : participants.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>No participants in this tournament yet</div>
                        ) : (
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {participants.map(participant => {
                                    const user = participantDetails[participant.userId] || {};
                                    return (
                                        <div key={participant.userId} className="ParticipantItem" style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            padding: '10px',
                                            borderBottom: '1px solid #444'
                                        }}>
                                            <div>
                                                <div>{user.displayName || participant.userId}</div>
                                                <div style={{ fontSize: '12px', color: '#A0A0A0' }}>
                                                    {participant.completionDate ? 'Completed' : 'In Progress'}
                                                </div>
                                            </div>
                                            <button
                                                className="AdminActionButton"
                                                onClick={() => handleRemoveParticipant(participant.userId)}
                                                disabled={isProcessing}
                                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="GroupActionButtons" style={{ marginTop: '40px' }}>
                        <button
                            className='AdminActionButton'
                            onClick={() => setShowEditPopup(true)}
                            disabled={isProcessing}
                        >
                            Edit Tournament
                        </button>
                        <button
                            className='GroupActionButton'
                            onClick={handleDeleteTournament}
                            disabled={isProcessing}
                            style={{ backgroundColor: 'var(--error-color)' }}
                        >
                            {isProcessing ? 'Deleting...' : 'Delete Tournament'}
                        </button>
                    </div>
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>Close</button>
                </div>

                {showEditPopup && (
                    <TournamentForm
                        tournamentToEdit={tournament}
                        onSubmit={handleUpdateTournament}
                        onCancel={() => setShowEditPopup(false)}
                        isProcessing={isUpdating}
                        submitText="Update Tournament"
                        groups={groups}
                        exercises={exercises}
                    />
                )}
            </div>
        </div>
    );
}

function TournamentManagerPage({ user }) {
    const [tournaments, setTournaments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const tournamentData = await TournamentManagement.getTournaments();
            setTournaments(tournamentData);

            // Here you would load groups and exercises data
            // For now we'll use placeholder empty arrays
            // setGroups(await GroupManagement.getAllGroups());
            // setExercises(await ExerciseDefinitionManager.loadAll());
            setGroups([]);
            setExercises([]);

            if (selectedTournament) {
                const updatedSelectedTournament = tournamentData.find(t => t.uid === selectedTournament.uid);
                if (updatedSelectedTournament) {
                    setSelectedTournament(updatedSelectedTournament);
                } else {
                    setSelectedTournament(null);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            setTournaments([]);
            setGroups([]);
            setExercises([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.uid) {
            loadData();
        }
    }, [user]);

    const handleTournamentCreation = async (data) => {
        setIsCreating(true);
        try {
            await TournamentManagement.createTournament(user.uid, data);
            setShowCreatePopup(false);
            await loadData();
        } catch (error) {
            console.error('Failed to create tournament:', error);
            alert('Failed to create tournament: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const renderList = () => {
        if (isLoading) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>Loading Tournaments...</div>;
        }

        if (tournaments.length === 0) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>No Tournaments Found. Create one to get started!</div>;
        }

        return tournaments.map(tournament => {
            // Get visibility text
            let visibilityText = 'Unknown';
            if (tournament.visibility === CHALLENGE_VISIBILITY.PUBLIC) visibilityText = 'Public';
            else if (tournament.visibility === CHALLENGE_VISIBILITY.GROUP) visibilityText = 'Group Only';
            else if (tournament.visibility === CHALLENGE_VISIBILITY.PRIVATE) visibilityText = 'Private';

            // Is tournament active
            const now = new Date();
            const startDate = tournament.startDate?.toDate ? tournament.startDate.toDate() : null;
            const endDate = tournament.endDate?.toDate ? tournament.endDate.toDate() : null;
            const isActive = (!startDate || now >= startDate) && (!endDate || now <= endDate);

            return (
                <div
                    key={tournament.uid}
                    className="CardContainer"
                    onClick={() => setSelectedTournament(tournament)}
                >
                    <div className="CardHeader" style={{ color: 'var(--main-color)' }}>
                        {tournament.name}
                        <span style={{ 
                            color: isActive ? 'var(--success-color)' : 'var(--error-color)', 
                            fontSize: '14px', 
                            marginLeft: '10px' 
                        }}>
                            ({isActive ? 'Active' : 'Inactive'})
                        </span>
                    </div>
                    <div className="CardContents">
                        {tournament.description || 'No description available.'}
                    </div>
                    <div className="CardContents" style={{ fontSize: '12px', color: '#A0A0A0' }}>
                        Visibility: {visibilityText}
                    </div>
                    {startDate && (
                        <div className="CardContents" style={{ fontSize: '12px', marginTop: '5px' }}>
                            Starts: {startDate.toLocaleDateString()}
                        </div>
                    )}
                    {endDate && (
                        <div className="CardContents" style={{ fontSize: '12px', marginTop: '5px' }}>
                            Ends: {endDate.toLocaleDateString()}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="AppContents">
            <h2 style={{ color: '#E5E5E5', margin: '0 0 20px 0' }}>Tournament Manager</h2>
            <div className="AdminGroupContainer">
                <div className="GuideText">All Tournaments</div>
                {renderList()}
                <button
                    className="AdminActionButton"
                    onClick={() => setShowCreatePopup(true)}
                >
                    Create New Tournament
                </button>
            </div>

            {showCreatePopup && (
                <TournamentForm
                    onSubmit={handleTournamentCreation}
                    onCancel={() => setShowCreatePopup(false)}
                    isProcessing={isCreating}
                    submitText="Create Tournament"
                    groups={groups}
                    exercises={exercises}
                />
            )}

            {selectedTournament && (
                <TournamentDetailPopup
                    tournament={selectedTournament}
                    onClose={() => setSelectedTournament(null)}
                    onTournamentUpdated={loadData}
                    user={user}
                    groups={groups}
                    exercises={exercises}
                />
            )}
        </div>
    );
}

export default TournamentManagerPage;