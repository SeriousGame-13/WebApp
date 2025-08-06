import { useState, useEffect } from 'react';
import '../components/styles/LayoutElements.css';
import StationManager from '../services/firebase/StationManagement';
import HighscoreManager from '../services/firebase/HighscoreManager';


function EditStationForm({ station = null, onSubmit, onCancel, isProcessing, submitText }) {
    const [formData, setFormData] = useState({
        name: '',
    });

    useEffect(() => {
        if (station) {
            setFormData({ name: station.name || '' });
        }
    }, [station]);


    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (formData.name.trim()) {
            onSubmit({
                ...formData,
                name: formData.name.trim(),
            });
        }
    };

    const isValid = formData.name.trim() !== '';

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
                    <h2>{station ? 'Updating' : 'Creating'} Station...</h2>
                </div>
            </div>
        );
    }

    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter station name' },
    ];

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>
                    {station ? 'Edit Station' : 'Create New Station'}
                </h2>
                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        {inputFields.map(field => (
                            <div key={field.key} className='BadgeInputGroup'>
                                <label className='BadgeInputLabel'>{field.label}</label>
                                <input
                                    className='Input'
                                    type={field.type}
                                    value={formData[field.key]}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    maxLength={field.maxLength}
                                />
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

function StationDetailPopup({ station, onClose, onStationUpdated }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [highscores, setHighscores] = useState({});

    useEffect(() => {
        if (station?.uid) {
            const fetchHighscores = async () => {
                const data = await HighscoreManager.loadHighscoresForStation(station.uid);
                setHighscores(Object.values(data));
            };
            fetchHighscores();
        }
    }, [station]);

    const formatMetricName = (metric) => {
        switch (metric) {
            case 'points': return 'Top Points';
            case 'calories': return 'Top Calories';
            case 'heartRateAvg': return 'Top Avg. Heart Rate';
            default: return metric;
        }
    };

    const handleDeleteStation = async () => {
        if (confirm(`Are you sure you want to delete the station "${station.name}"? This action cannot be undone.`)) {
            setIsProcessing(true);
            try {
                await StationManager.delete(station.uid);
                onStationUpdated();
                onClose();
            } catch (error) {
                console.error('Failed to delete station:', error);
                alert('Failed to delete station: ' + error.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleUpdateStation = async (updates) => {
        setIsProcessing(true);
        try {
            await StationManager.update({
                uid: station.uid,
                name: updates.name,
            });
            setShowEditPopup(false);
            onStationUpdated();
        } catch (error) {
            console.error('Failed to update station:', error);
            alert('Failed to update station: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Station Details</h2>
                <div className='GroupDetailContainer'>
                    <div className='BadgeDetailHeader'>
                        <div className='BadgeDetailTitle' style={{ color: 'var(--main-color)' }}>
                            {station.name}
                        </div>
                    </div>

                    <div className="HighscoresSection" style={{ marginTop: '20px', textAlign: 'left' }}>
                        <h3 style={{ color: 'var(--main-color)', marginBottom: '10px' }}>Highscores</h3>
                        <div style={{ paddingLeft: '10px', display: 'grid', gap: '8px' }}>
                            {highscores.length > 0 ? (
                                highscores.map(score => (
                                    <div key={score.metric}>
                                        <strong>{formatMetricName(score.metric)}:</strong> {score.score.toLocaleString('de-DE')}
                                        <em style={{ color: '#A0A0A0' }}> by {score.userName || 'Unknown User'}</em>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#A0A0A0' }}>No records yet for this station.</p>
                            )}
                        </div>
                    </div>

                    <div className="GroupActionButtons" style={{ marginTop: '40px' }}>
                        <button className='AdminActionButton' onClick={() => setShowEditPopup(true)} disabled={isProcessing}>
                            Edit Station Info
                        </button>
                        <button className='GroupActionButton' onClick={handleDeleteStation} disabled={isProcessing}>
                            {isProcessing ? 'Deleting...' : 'Delete Station'}
                        </button>
                    </div>
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>Close</button>
                </div>

                {showEditPopup && (
                    <EditStationForm
                        station={station}
                        onSubmit={handleUpdateStation}
                        onCancel={() => setShowEditPopup(false)}
                        isProcessing={isProcessing}
                        submitText="Update Station"
                    />
                )}
            </div>
        </div>
    );
}



function StationManagerPage({ user }) {
    const [stations, setStations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStation, setSelectedStation] = useState(null);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const loadStations = async () => {
        setIsLoading(true);
        try {
            const data = await StationManager.loadAll();
            setStations(data);

            if (selectedStation) {
                const updatedSelected = data.find(s => s.uid === selectedStation.uid);
                setSelectedStation(updatedSelected || null);
            }
        } catch (error) {
            console.error('Failed to load stations:', error);
            setStations([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStations();
    }, []);

    const handleCreation = async (data) => {
        setIsCreating(true);
        try {
            await StationManager.save(data);
            setShowCreatePopup(false);
            await loadStations();
        } catch (error) {
            console.error('Failed to create station:', error);
            alert('Failed to create station: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const renderList = () => {
        if (isLoading) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>Loading Stations...</div>;
        }

        if (stations.length === 0) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>No Stations Found. Create one to get started!</div>;
        }

        return stations.map(station => (
            <div
                key={station.uid}
                className="GroupExerciseContainer"
                onClick={() => setSelectedStation(station)}
            >
                <div className="GroupExerciseHeader" style={{ color: 'var(--main-color)' }}>
                    {station.name}
                </div>
            </div>
        ));
    };

    return (
        <div className="AppContents">
            <h2 style={{ color: '#E5E5E5', margin: '0 0 20px 0' }}>Station Manager</h2>
            <div className="AdminGroupContainer">
                <div className="GuideText">All Stations</div>
                {renderList()}
                <button
                    className="AdminActionButton"
                    onClick={() => setShowCreatePopup(true)}
                >
                    Create New Station
                </button>
            </div>

            {showCreatePopup && (
                <EditStationForm
                    onSubmit={handleCreation}
                    onCancel={() => setShowCreatePopup(false)}
                    isProcessing={isCreating}
                    submitText="Create Station"
                />
            )}

            {selectedStation && (
                <StationDetailPopup
                    station={selectedStation}
                    onClose={() => setSelectedStation(null)}
                    onStationUpdated={loadStations}
                />
            )}
        </div>
    );
}

export default StationManagerPage;