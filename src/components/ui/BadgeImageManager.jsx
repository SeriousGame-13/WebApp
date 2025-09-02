import { useState } from 'react';
import BadgeManagement from '../../services/BadgeManagement.jsx';
import { ImageSelector } from './ImageComponents.jsx';


//TODO: Decompose into COMPONENT PART and MANAGER PART

const BadgeImageSelector = ({ badgeId, onImageProcessed, onError, disabled }) => {
  return (
    <ImageSelector
      id={badgeId}
      onImageProcessed={onImageProcessed}
      onError={onError}
      disabled={disabled}
      loadExistingImage={BadgeManagement.getBadgeImage}
      altText="Badge Preview"
      buttonClassName="UploadButton"
      buttonText={{
        processing: 'Processing...',
        loading: 'Loading...',
        disabled: 'Creating badge first...',
        noImage: 'Select Badge Image',
        hasImage: 'Change Image'
      }}
    />
  );
};

const BadgeImageUploader = ({ badgeId, onUploadComplete, disabled }) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImageProcessed = (processResult) => {
    setResult(processResult);
    setError('');
    
    onUploadComplete && onUploadComplete({
      base64Data: processResult.base64Data,
      badgeId: badgeId
    });
  };

  const handleError = (errorMessage) => {
    console.error('Error:', errorMessage);
    setError(errorMessage);
    setResult(null);
  };

  return (
    <div>
      <BadgeImageSelector 
        badgeId={badgeId}
        onImageProcessed={handleImageProcessed}
        onError={handleError}
        disabled={disabled}
      />
      {error && (
        <div style={{ color: '#FF4757', fontSize: '12px', marginTop: '8px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

const BadgeImageElements = { 
    BadgeImageSelector,
    BadgeImageUploader
};

export default BadgeImageElements;