import { useState, useEffect } from 'react';
import '../../components/styles/LayoutElements.css';
import GoalSystem from '../../services/GoalSystem.jsx';
import StationManager from '../../services/StationManagement.jsx';
import { localDateTimeStringToTimestamp, localTime } from '../../utils/DateUtils.jsx';
import BaseModel from '../../services/interfaces/Base.jsx';


function FormBase({
    title,
    inputFields,
    initialData,
    onSubmit,
    onCancel,
    isProcessing,
    submitText,
    goalTypes = null,
    stations = null
}) {
    const [formData, setFormData] = useState(() => {
        return inputFields.reduce((acc, field) => {
            const sourceValue = initialData?.[field.key];
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
            const submitData = inputFields.reduce((acc, field) => {
                const value = formData[field.key];
                if (field.type === 'number') {
                    acc[field.key] = parseInt(value, 10) || 0;
                } else if (field.type === 'datetime-local') {
                    acc[field.key] = value ? localDateTimeStringToTimestamp(value) : null;
                } else if (field.key === 'goalType') {
                    acc[field.key] = value || 'custom';
                } else if (field.key === 'stationId') {
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
                                        {field.key === 'goalType' && goalTypes && goalTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                        {field.key === 'stationId' && stations && stations.map(station => (
                                            <option key={station.uid} value={station.uid}>
                                                {station.name}
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

function GoalForm(props) {
    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter goal name' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter description' },
        { key: 'targetValue', label: 'Target Value', type: 'number', min: 1, placeholder: 'Enter target value' },
        { key: 'stationId', label: 'Station', type: 'select', placeholder: 'Select Station...' },
        { key: 'deadline', label: 'Deadline', type: 'datetime-local' },
    ];

    const title = props.goalToEdit ? 'Edit Goal' : 'Create New Goal';

    return (
        <FormBase
            title={title}
            inputFields={inputFields}
            initialData={props.goalToEdit}
            onSubmit={props.onSubmit}
            onCancel={props.onCancel}
            isProcessing={props.isProcessing}
            submitText={props.submitText}
            stations={props.stations}
        />
    );
}

function GoalDetailPopup({ goal, onClose, onGoalUpdated, user, stations }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [manualProgressValue, setManualProgressValue] = useState(goal.currentValue || 0);

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

    const handleDeleteGoal = async () => {
        if (confirm(`Are you sure you want to delete the goal "${goal.name}"? This action cannot be undone.`)) {
            setIsProcessing(true);
            try {
                await GoalSystem.deleteGoal(goal.uid, user.uid);
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
            await GoalSystem.updateGoal(goal.uid, user.uid, updates);
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
            await GoalSystem.updateGoalProgress(goal.uid, user.uid, newValue);
            onGoalUpdated();
        } catch (error) {
            console.error('Failed to update goal progress:', error);
            alert('Failed to update goal progress: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Calculate progress percentage
    const progressPercentage = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);

    // Format the deadline date if available
    const formattedDeadline = goal.deadline ? (() => { const bm = new BaseModel({ createdAt: goal.deadline }); return bm.getCreateAt(); })() : 'No deadline set';

    // Determine if the goal is overdue
    const isOverdue = goal.deadline?.toDate && !goal.isCompleted &&
        new Date() > goal.deadline.toDate();

    // Find station name if available
    const station = stations?.find(s => s.uid === goal.stationId);
    const stationName = station ? station.name : 'No station selected';

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Goal Details</h2>
                <div className='GroupDetailContainer'>
                    <div className='BadgeDetailHeader'>
                        <div className='BadgeInfoContainer'>
                            <div className='BadgeDetailTitle' style={{ color: 'var(--main-color)' }}>
                                {goal.name}
                                {goal.isCompleted &&
                                    <span style={{ color: 'var(--success-color)', fontSize: '16px', marginLeft: '10px' }}>
                                        (Completed)
                                    </span>
                                }
                                {isOverdue &&
                                    <span style={{ color: 'var(--error-color)', fontSize: '16px', marginLeft: '10px' }}>
                                        (Overdue)
                                    </span>
                                }
                            </div>
                        </div>
                    </div>
                    <div className='GroupDetailDescription' style={{ textAlign: 'left' }}>
                        {goal.description || 'No description available.'}
                    </div>
                    <div className='GroupDetailInfo' style={{ textAlign: 'left' }}>
                        <div>Goal ID: {goal.uid}</div>
                        <div>Station: {stationName}</div>
                        <div>Progress: {goal.currentValue} / {goal.targetValue}</div>
                        <div>Deadline: {formattedDeadline}</div>
                        <div>Status: {goal.isCompleted ? 'Completed' : 'In Progress'}</div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <h3 style={{ color: 'var(--main-color)', marginBottom: '10px' }}>Progress</h3>
                        <div className="ProgressBar">
                            <div
                                className="ProgressBarFill"
                                style={{
                                    width: `${progressPercentage}%`,
                                    backgroundColor: goal.isCompleted ? 'var(--success-color)' : isOverdue ? 'var(--error-color)' : 'var(--main-color)'
                                }}
                            ></div>
                        </div>
                        <div className="ProgressText" style={{ marginBottom: '20px' }}>{progressPercentage}% Complete</div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <input
                                type="number"
                                className="Input"
                                value={manualProgressValue}
                                onChange={(e) => setManualProgressValue(e.target.value)}
                                style={{ width: '100px', marginRight: '10px' }}
                                min="0"
                                max={goal.targetValue * 2}
                            />
                            <button
                                className="AdminActionButton"
                                onClick={handleProgressUpdate}
                                disabled={isProcessing}
                                style={{ marginLeft: '10px' }}
                            >
                                Update Progress
                            </button>
                        </div>
                    </div>

                    <div className="GroupActionButtons" style={{ marginTop: '40px' }}>
                        <button
                            className='AdminActionButton'
                            onClick={() => setShowEditPopup(true)}
                            disabled={isProcessing}
                        >
                            Edit Goal
                        </button>
                        <button
                            className='AdminActionButton'
                            onClick={handleDeleteGoal}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Deleting...' : 'Delete Goal'}
                        </button>
                    </div>
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>Close</button>
                </div>

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
            </div>
        </div>
    );
}

function GoalManagerPage({ user }) {
    const [goals, setGoals] = useState([]);
    const [stations, setStations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const goalData = await GoalSystem.getGoals(user.uid);
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
            console.error('Failed to load data:', error);
            setGoals([]);
            setStations([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.uid) {
            loadData();
        }
    }, [user]);

    const handleGoalCreation = async (data) => {
        setIsCreating(true);
        try {
            data.userId = user.uid;
            await GoalSystem.createGoal(user.uid, data);
            setShowCreatePopup(false);
            await loadData();
        } catch (error) {
            console.error('Failed to create goal:', error);
            alert('Failed to create goal: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const renderList = () => {
        if (isLoading) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>Loading Goals...</div>;
        }

        if (goals.length === 0) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>No Goals Found. Create one to get started!</div>;
        }

        return goals.map(goal => {
            // Calculate progress percentage
            const progressPercentage = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);

            // Determine if the goal is overdue
            const isOverdue = goal.deadline?.toDate && !goal.isCompleted &&
                new Date() > goal.deadline.toDate();

            // Find station name if available
            const station = stations.find(s => s.uid === goal.stationId);

            return (
                <div
                    key={goal.uid}
                    className="CardContainer"
                    onClick={() => setSelectedGoal(goal)}
                >
                    <div className="CardHeader" style={{ color: 'var(--main-color)' }}>
                        {goal.name}
                        {goal.isCompleted &&
                            <span style={{ color: 'var(--success-color)', fontSize: '14px', marginLeft: '10px' }}>
                                (Completed)
                            </span>
                        }
                        {isOverdue &&
                            <span style={{ color: 'var(--error-color)', fontSize: '14px', marginLeft: '10px' }}>
                                (Overdue)
                            </span>
                        }
                    </div>
                    <div className="CardContents">
                        {goal.description || 'No description available.'}
                    </div>
                    {station && (
                        <div className="CardContents" style={{ fontSize: '12px', color: '#A0A0A0' }}>
                            Station: {station.name}
                        </div>
                    )}
                    <div className="CardContents">
                        Progress: {goal.currentValue}/{goal.targetValue} ({progressPercentage}%)
                    </div>
                    <div className="ProgressBarSmall">
                        <div
                            className="ProgressBarFillSmall"
                            style={{
                                width: `${progressPercentage}%`,
                                backgroundColor: goal.isCompleted ? 'var(--success-color)' : isOverdue ? 'var(--error-color)' : 'var(--main-color)'
                            }}
                        ></div>
                    </div>
                    {goal.deadline && (
                        <div className="CardContents" style={{ fontSize: '12px', marginTop: '5px' }}>
                            {(() => { const bm = new BaseModel({ createdAt: goal.deadline }); return `Deadline: ${bm.getCreateAt()}`; })()}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="AppContents">
            <h2 style={{ color: '#E5E5E5', margin: '0 0 20px 0' }}>Goal Manager</h2>
            <div className="AdminGroupContainer">
                <div className="GuideText">All Goals</div>
                {renderList()}
                <button
                    className="AdminActionButton"
                    onClick={() => setShowCreatePopup(true)}
                >
                    Create New Goal
                </button>
            </div>

            {showCreatePopup && (
                <GoalForm
                    onSubmit={handleGoalCreation}
                    onCancel={() => setShowCreatePopup(false)}
                    isProcessing={isCreating}
                    submitText="Create Goal"
                    stations={stations}
                />
            )}

            {selectedGoal && (
                <GoalDetailPopup
                    goal={selectedGoal}
                    onClose={() => setSelectedGoal(null)}
                    onGoalUpdated={loadData}
                    user={user}
                    stations={stations}
                />
            )}
        </div>
    );
}

export default GoalManagerPage;