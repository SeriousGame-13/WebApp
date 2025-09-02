import { useState, useEffect } from 'react';
import '../../components/styles/sphere-styles.css';
import StationManager from '../../services/StationManagement.jsx';
import HighscoreManager from '../../services/HighscoreManager.jsx';
import { Plus, Dumbbell, Edit, Trash2, X, Search, Trophy, Target } from 'lucide-react';


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
            <div className="modal-overlay">
                <div className="modal-backdrop"></div>
                <div className="modal-content">
                    <div className="text-center py-12">
                        <div className="login-spinner mx-auto mb-4"></div>
                        <p className="text-slate-400">{station ? 'Updating' : 'Creating'} Station...</p>
                    </div>
                </div>
            </div>
        );
    }

    const inputFields = [
        { key: 'name', label: 'Station Name', type: 'text', maxLength: 50, placeholder: 'Enter station name' },
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onCancel}></div>
            <div className="modal-content max-w-lg">
                <div className="modal-header">
                    <h3 className="text-xl font-bold text-gradient">
                        {station ? 'Edit Station' : 'Create New Station'}
                    </h3>
                    <button 
                        onClick={onCancel}
                        className="modal-close-btn"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="modal-body space-y-4">
                    {inputFields.map(field => (
                        <div key={field.key} className="form-group">
                            <label className="form-label">{field.label}</label>
                            <input
                                className="form-input"
                                type={field.type}
                                value={formData[field.key]}
                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                maxLength={field.maxLength}
                            />
                        </div>
                    ))}
                </div>

                <div className="modal-footer">
                    <button 
                        className="btn-secondary" 
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={!isValid}
                    >
                        {submitText}
                    </button>
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
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content max-w-2xl">
                <div className="modal-header">
                    <div>
                        <h3 className="text-xl font-bold text-gradient">{station.name}</h3>
                        <p className="text-sm text-slate-400">Station Details & Performance</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="modal-close-btn"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="modal-body space-y-6">
                    {/* Station Overview */}
                    <div className="card">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Dumbbell className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gradient mb-2">{station.name}</h4>
                                <div className="text-sm text-slate-300">
                                    <div className="mb-2">
                                        <span className="text-slate-400">Station ID:</span>
                                        <span className="text-slate-300 ml-2 font-mono text-xs">{station.uid}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Highscores Section */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            <h4 className="text-lg font-semibold text-gradient">Station Records</h4>
                        </div>
                        
                        {highscores.length > 0 ? (
                            <div className="space-y-3">
                                {highscores.map(score => (
                                    <div key={score.metric} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div>
                                            <div className="font-medium text-slate-300">
                                                {formatMetricName(score.metric)}
                                            </div>
                                            <div className="text-sm text-slate-400">
                                                by {score.userName || 'Unknown User'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gradient">
                                                {score.score.toLocaleString('de-DE')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No records yet for this station.</p>
                                <p className="text-sm text-slate-500">Records will appear here once users start exercising!</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button 
                            className="btn-secondary flex items-center gap-2 flex-1"
                            onClick={() => setShowEditPopup(true)} 
                            disabled={isProcessing}
                        >
                            <Edit className="w-4 h-4" />
                            Edit Station Info
                        </button>
                        <button 
                            className="btn-danger flex items-center gap-2"
                            onClick={handleDeleteStation} 
                            disabled={isProcessing}
                        >
                            <Trash2 className="w-4 h-4" />
                            {isProcessing ? 'Deleting...' : 'Delete Station'}
                        </button>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="btn-secondary" 
                        onClick={onClose}
                    >
                        Close
                    </button>
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
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredStations = stations.filter(station =>
        station.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderList = () => {
        if (isLoading) {
            return (
                <div className="text-center py-12">
                    <div className="login-spinner mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading stations...</p>
                </div>
            );
        }

        if (filteredStations.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="text-slate-400 mb-4">
                        {searchTerm ? 'No stations match your search.' : 'No stations found.'}
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreatePopup(true)}
                    >
                        Create First Station
                    </button>
                </div>
            );
        }

        return (
            <div className="grid-2 gap-6">
                {filteredStations.map(station => (
                    <div
                        key={station.uid}
                        className="card cursor-pointer"
                        onClick={() => setSelectedStation(station)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Dumbbell className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gradient truncate mb-1">
                                    {station.name}
                                </h3>
                                <p className="text-sm text-slate-300 mb-3">
                                    Fitness station for equipment-based exercises
                                </p>
                                <div className="text-xs text-slate-500">
                                    #{station.uid.slice(-8)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gradient">Station Manager</h2>
            </div>

            {/* Stats Cards */}
            <div className="grid-3 gap-6">
                <div className="card text-center">
                    <div className="text-2xl font-bold text-gradient">{stations.length}</div>
                    <div className="text-sm text-slate-400">Total Stations</div>
                </div>
                <div className="card text-center">
                    <div className="text-2xl font-bold text-gradient">
                        {stations.filter(s => s.name).length}
                    </div>
                    <div className="text-sm text-slate-400">Active Stations</div>
                </div>
                <div className="card text-center">
                    <div className="text-2xl font-bold text-gradient">
                        {searchTerm ? filteredStations.length : stations.length}
                    </div>
                    <div className="text-sm text-slate-400">
                        {searchTerm ? 'Search Results' : 'Available Equipment'}
                    </div>
                </div>
            </div>

            {/* Search and Create */}
            <div className="flex items-center gap-4 mt-4">
                <div className="search-container flex-1">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search stations by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <button
                    className="btn-primary flex items-center gap-2"
                    onClick={() => setShowCreatePopup(true)}
                >
                    <Plus className="w-4 h-4" />
                    Create Station
                </button>
            </div>

            {/* Station List */}
            <div className="mt-4">
                {renderList()}
            </div>

            {/* Modals */}
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