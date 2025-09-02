import { useState, useEffect } from 'react';
import '../../components/styles/LoginPage.css';
import { ImageSelector } from './ImageComponents.jsx';
import FirestoreManager from '../../services/firebase/FirestoreManager.jsx'

//TODO: Decompose into COMPONENT PART and MANAGER PART

const ProfileImageSelector = ({ userId, onImageProcessed, onError }) => {
  const handleImageProcessed = async (result) => {
    try {
      // Save to Firestore
      const saveResult = await FirestoreManager.saveUserImage(result.base64Data, userId);
      
      // Call result callback with save result
      onImageProcessed && onImageProcessed({
        ...result,
        saveResult: saveResult
      });
    } catch (error) {
      console.error('Failed to save image:', error);
      onError && onError(`Save failed: ${error.message}`);
    }
  };

  return (
    <ImageSelector
      id={userId}
      onImageProcessed={handleImageProcessed}
      onError={onError}
      disabled={!userId}
      loadExistingImage={FirestoreManager.getUserImage}
      altText="Profile Preview"
      buttonText={{
        processing: 'Processing...',
        loading: 'Loading...',
        disabled: 'User ID required',
        noImage: 'Select New Image',
        hasImage: 'Change Image'
      }}
    />
  );
};

// Main component
const ProfileImageUploader = ({ userId, onUploadComplete }) => {
  const [error, setError] = useState('');

  const handleImageProcessed = (processResult) => {
    setError('');
    
    // Pass result to parent component
    onUploadComplete && onUploadComplete({
      base64Data: processResult.base64Data,
      size: processResult.saveResult?.size || 0,
      userId: userId
    });
  };

  const handleError = (errorMessage) => {
    console.error('Error:', errorMessage);
    setError(errorMessage);
  };

  return (
    <div>
      <ProfileImageSelector 
        userId={userId}
        onImageProcessed={handleImageProcessed}
        onError={handleError}
      />
      {error && (
        <div style={{ color: '#FF4757', fontSize: '12px', marginTop: '8px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

const ProfileImageDisplay = ({ userId, imageclass }) => {
  
  const [imageLoading, setImageLoading] = useState(true);
  const [existingImage, setExistingImage] = useState('');

  // Load existing image when the component mounts
  useEffect(() => {
    const loadExistingImage = async () => {
      if (!userId) {
        setImageLoading(false);
        return;
      }
      
      setImageLoading(true);
      try {
        const existingImageBase64 = await FirestoreManager.getUserImage(userId);
        setExistingImage(existingImageBase64 || '');
      } catch (error) {
        console.error('Failed to load user image:', error);
        setExistingImage('');
      } finally {
        setImageLoading(false);
      }
    };

    loadExistingImage();
  }, [userId]); // Runs whenever userId changes

  if (imageLoading) {
    return <div className={imageclass}>Loading...</div>;
  }

  return (
    <img className={imageclass}
      src={existingImage} 
      alt="Profile" 
    />
  );
};

// Export functions
const ProfileImageElements = { 
    ProfileImageSelector,
    ProfileImageUploader,
    ProfileImageDisplay
};

export default ProfileImageElements;