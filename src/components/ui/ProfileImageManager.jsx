import { useState, useEffect } from 'react';
import { ImageSelector } from './ImageComponents.jsx';
import FirestoreManager from '../../services/firebase/FirestoreManager.jsx'

//TODO: Decompose into COMPONENT PART and MANAGER PART

const ProfileImageSelector = ({ userId, onImageProcessed }) => {
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
    }
  };

  return (
    <ImageSelector
      id={userId}
      onImageProcessed={handleImageProcessed}
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

  const handleImageProcessed = (processResult) => {    
    onUploadComplete && onUploadComplete({
      base64Data: processResult.base64Data,
      size: processResult.saveResult?.size || 0,
      userId: userId
    });
  };

  return (
    <div>
      <ProfileImageSelector 
        userId={userId}
        onImageProcessed={handleImageProcessed}
      />
    </div>
  );
};

// Export functions
const ProfileImageElements = { 
    ProfileImageSelector,
    ProfileImageUploader
};

export default ProfileImageElements;