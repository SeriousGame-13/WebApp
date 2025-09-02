import { useState, useEffect } from 'react';
import '../../components/styles/sphere-styles.css';
import StationGameManager from '../../services/GameManager.jsx';
import StationManager from '../../services/StationManagement.jsx';
import { Plus, Gamepad2, Edit, Trash2, X, Search } from 'lucide-react';

function EditForm({ object = null, onSubmit, onCancel, isProcessing, submitText, stations }) {
    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter name' },
        { key: 'stationId', label: 'Station', type: 'selectStation', placeholder: 'Select Station...' },
    ];

    // The initial state is generated dynamically from the inputFields array.
    const [formData, setFormData] = useState(() => {
        return inputFields.reduce((acc, field) => {
            const sourceValue = object?.[field.key];
            acc[field.key] = sourceValue ?? (field.type === 'number' ? 0 : '');
            return acc;
        }, {});
    });

    useEffect(() => {
        if (object) {
            setFormData({ name: object.name || '' });
        }
    }, [object]);


    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // The submission data is generated dynamically from the inputFields array.
    const handleSubmit = () => {
        if (formData.name && formData.name.trim()) {
            const submitData = inputFields.reduce((acc, field) => {
                const value = formData[field.key];
                if (field.type === 'number') {
                    acc[field.key] = parseInt(value, 10) || 0;
                } else if (typeof value === 'string') {
                    acc[field.key] = value.trim();
                } else {
                    acc[field.key] = value;
                }
                return acc;
            }, {});
            onSubmit(submitData);
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
                        <p className="text-slate-400">{object ? 'Updating' : 'Creating'}...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onCancel}></div>
            <div className="modal-content max-w-lg">
                <div className="modal-header">
                    <h3 className="text-xl font-bold text-gradient">
                        {object ? 'Edit Station Game' : 'Create New Station Game'}
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
                            {field.type === 'textarea' ? (
                                <textarea
                                    className="form-input"
                                    value={formData[field.key]}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    rows={4}
                                />
                            ) : field.type === 'selectStation' ? (
                                <select
                                    className="form-input"
                                    value={formData[field.key]}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                >
                                    <option value="" disabled>{field.placeholder}</option>
                                    {stations && stations.map(obj => (
                                        <option key={obj.uid} value={obj.uid}>
                                            {obj.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    className="form-input"
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

function DetailPopup({ object, onClose, onUpdated, stations }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);

    useEffect(() => {
    }, [object]);

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete "${object.name}"? This action cannot be undone.`)) {
            setIsProcessing(true);
            try {
                await StationGameManager.delete(object.uid);
                onUpdated();
                onClose();
            } catch (error) {
                console.error('Failed to delete:', error);
                alert('Failed to delete: ' + error.message);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleUpdate = async (updates) => {
        setIsProcessing(true);
        try {
            await StationGameManager.update({
                ...updates,
                uid:object.uid
            });
            setShowEditPopup(false);
            onUpdated();
        } catch (error) {
            console.error('Failed to update:', error);
            alert('Failed to update: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content max-w-lg">
                <div className="modal-header">
                    <div>
                        <h3 className="text-xl font-bold text-gradient">{object.name}</h3>
                        <p className="text-sm text-slate-400">Station Game Details</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="modal-close-btn"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="modal-body space-y-6">
                    {/* Game Overview */}
                    <div className="card">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Gamepad2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gradient mb-2">{object.name}</h4>
                                <div className="text-sm text-slate-300">
                                    <div className="mb-2">
                                        <span className="text-slate-400">Game ID:</span>
                                        <span className="text-slate-300 ml-2 font-mono text-xs">{object.uid}</span>
                                    </div>
                                    {object.stationId && (
                                        <div className="mb-2">
                                            <span className="text-slate-400">Station ID:</span>
                                            <span className="text-slate-300 ml-2 font-mono text-xs">{object.stationId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button 
                            className="btn-secondary flex items-center gap-2 flex-1"
                            onClick={() => setShowEditPopup(true)} 
                            disabled={isProcessing}
                        >
                            <Edit className="w-4 h-4" />
                            Edit Info
                        </button>
                        <button 
                            className="btn-danger flex items-center gap-2"
                            onClick={handleDelete} 
                            disabled={isProcessing}
                        >
                            <Trash2 className="w-4 h-4" />
                            {isProcessing ? 'Deleting...' : 'Delete'}
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
                    <EditForm
                        object={object}
                        onSubmit={handleUpdate}
                        onCancel={() => setShowEditPopup(false)}
                        isProcessing={isProcessing}
                        submitText="Update"
                        stations={stations}
                    />
                )}
            </div>
        </div>
    );
}



function StationGamePage({ user }) {
    const [objects, setObjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedObject, setSelectedObject] = useState(null);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [stations, setStations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const loadObjects = async () => {
        setIsLoading(true);
        try {
            const data = await StationGameManager.loadAll();
            setObjects(data);

            const stationData = await StationManager.loadAll();
            setStations(stationData);

            if (selectedObject) {
                const updatedSelected = data.find(s => s.uid === selectedObject.uid);
                setSelectedObject(updatedSelected || null);
            }
        } catch (error) {
            console.error('Failed to load:', error);
            setObjects([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadObjects();
    }, []);

    const handleCreation = async (data) => {
        setIsCreating(true);
        try {
            await StationGameManager.save(data);
            setShowCreatePopup(false);
            await loadObjects();
        } catch (error) {
            console.error('Failed to create:', error);
            alert('Failed to create: ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const filteredObjects = objects.filter(obj =>
        obj.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStationName = (stationId) => {
        const station = stations.find(s => s.uid === stationId);
        return station ? station.name : 'Unknown Station';
    };

    const renderList = () => {
        if (isLoading) {
            return (
                <div className="text-center py-12">
                    <div className="login-spinner mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading station games...</p>
                </div>
            );
        }

        if (filteredObjects.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="text-slate-400 mb-4">
                        {searchTerm ? 'No station games match your search.' : 'No station games found.'}
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreatePopup(true)}
                    >
                        Create First Station Game
                    </button>
                </div>
            );
        }

        return (
            <div className="grid-2 gap-6">
                {filteredObjects.map(obj => (
                    <div
                        key={obj.uid}
                        className="card cursor-pointer"
                        onClick={() => setSelectedObject(obj)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Gamepad2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gradient truncate mb-1">
                                    {obj.name}
                                </h3>
                                <p className="text-sm text-slate-300 mb-3">
                                    Station: {obj.stationId ? getStationName(obj.stationId) : 'No station assigned'}
                                </p>
                                <div className="text-xs text-slate-500">
                                    #{obj.uid.slice(-8)}
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
                <h2 className="text-2xl font-bold text-gradient">Station Game Manager</h2>
            </div>

            {/* Stats Cards */}
            <div className="grid-3 gap-6">
                <div className="card text-center">
                    <div className="text-2xl font-bold text-gradient">{objects.length}</div>
                    <div className="text-sm text-slate-400">Total Games</div>
                </div>
                <div className="card text-center">
                    <div className="text-2xl font-bold text-gradient">{stations.length}</div>
                    <div className="text-sm text-slate-400">Available Stations</div>
                </div>
                <div className="card text-center">
                    <div className="text-2xl font-bold text-gradient">
                        {objects.filter(obj => obj.stationId).length}
                    </div>
                    <div className="text-sm text-slate-400">Assigned Games</div>
                </div>
            </div>

            {/* Search and Create */}
            <div className="flex items-center gap-4 mt-4">
                <div className="search-container flex-1">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search station games by name..."
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
                    Create Game
                </button>
            </div>

            {/* Game List */}
            <div className="mt-4">
                {renderList()}
            </div>

            {/* Modals */}
            {showCreatePopup && (
                <EditForm
                    onSubmit={handleCreation}
                    onCancel={() => setShowCreatePopup(false)}
                    isProcessing={isCreating}
                    submitText="Create Game"
                    stations={stations}
                />
            )}

            {selectedObject && (
                <DetailPopup
                    object={selectedObject}
                    onClose={() => setSelectedObject(null)}
                    onUpdated={loadObjects}
                    stations={stations}
                />
            )}
        </div>
    );
}

export default StationGamePage;