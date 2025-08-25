import { useState, useEffect } from 'react';
import '../components/styles/LayoutElements.css';
import StationGameManager from '../services/firebase/GameManager';

function EditForm({ object = null, onSubmit, onCancel, isProcessing, submitText }) {
    const [formData, setFormData] = useState({
        name: '',
    });

    useEffect(() => {
        if (object) {
            setFormData({ name: object.name || '' });
        }
    }, [object]);


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
                    <h2>{object ? 'Updating' : 'Creating'}...</h2>
                </div>
            </div>
        );
    }

    const inputFields = [
        { key: 'name', label: 'Name', type: 'text', maxLength: 50, placeholder: 'Enter name' },
    ];



    return (
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ margin: '20px 0', textAlign: 'center' }}>
                    {object ? 'Edit ' : 'Create New '}
                </h2>
                <div className='BadgeCreateContent'>
                    <div className='BadgeInputSection'>
                        {inputFields.map(field => (

                            <div key={field.key} className='BadgeInputGroup'>
                                <label className='BadgeInputLabel'>{field.label}</label>
                                { field.type === 'textarea' ? (
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

function DetailPopup({ object, onClose, onUpdated }) {
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
                uid: object.uid,
                name: updates.name,
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
        <div className='PopupBackground'>
            <div className='LargePopupContainer'>
                <h2 style={{ textAlign: 'center' }}>Details</h2>
                <div className='GroupDetailContainer'>
                    <div className='BadgeDetailHeader'>
                        <div className='BadgeDetailTitle' style={{ color: 'var(--main-color)' }}>
                            {object.name}
                        </div>
                    </div>

                    <div className="GroupActionButtons" style={{ marginTop: '40px' }}>
                        <button className='AdminActionButton' onClick={() => setShowEditPopup(true)} disabled={isProcessing}>
                            Edit Info
                        </button>
                        <button className='GroupActionButton' onClick={handleDelete} disabled={isProcessing}>
                            {isProcessing ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
                <div className='Line'></div>
                <div className='Buttonfield'>
                    <button className='CancelButton' onClick={onClose}>Close</button>
                </div>

                {showEditPopup && (
                    <EditForm
                        object={object}
                        onSubmit={handleUpdate}
                        onCancel={() => setShowEditPopup(false)}
                        isProcessing={isProcessing}
                        submitText="Update"
                    />
                )}
            </div>
        </div>
    );
}



function StationGamePage({ user }) {
    const [objects, sets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedObject, setSelected] = useState(null);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const loadObjects = async () => {
        setIsLoading(true);
        try {
            const data = await StationGameManager.loadAll();
            sets(data);

            if (selectedObject) {
                const updatedSelected = data.find(s => s.uid === selectedObject.uid);
                setSelected(updatedSelected || null);
            }
        } catch (error) {
            console.error('Failed to load:', error);
            sets([]);
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
            console.error('Failed to create :', error);
            alert('Failed to create : ' + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const renderList = () => {
        if (isLoading) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>Loading...</div>;
        }

        if (objects.length === 0) {
            return <div style={{ color: '#A0A0A0', textAlign: 'center', padding: '20px' }}>Nothing Found. Create something to get started!</div>;
        }

        return objects.map(obj => (
            <div
                key={obj.uid}
                className="CardContainer"
                onClick={() => setSelected(obj)}
            >
                <div className="CardHeader" style={{ color: 'var(--main-color)' }}>
                    {obj.name}
                </div>
            </div>
        ));
    };

    return (
        <div className="AppContents">
            <h2 style={{ color: '#E5E5E5', margin: '0 0 20px 0' }}>Manager</h2>
            <div className="AdminGroupContainer">
                <div className="GuideText">All</div>
                {renderList()}
                <button
                    className="AdminActionButton"
                    onClick={() => setShowCreatePopup(true)}
                >
                    Create New
                </button>
            </div>

            {showCreatePopup && (
                <EditForm
                    onSubmit={handleCreation}
                    onCancel={() => setShowCreatePopup(false)}
                    isProcessing={isCreating}
                    submitText="Create "
                />
            )}

            {selectedObject && (
                <DetailPopup
                    object={selectedObject}
                    onClose={() => setSelected(null)}
                    onUpdated={loadObjects}
                />
            )}
        </div>
    );
}

export default StationGamePage;