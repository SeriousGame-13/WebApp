import React, { useState, useRef, useEffect } from 'react';
import { db } from '../services/firebase/firebaseConfig';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

import DatamanagerElements from './dataManager';
import '../pages/LoginPage.css';

// Image resizing function
const resizeImage = (file, width = 100, height = 100, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert canvas to Base64
      const base64String = canvas.toDataURL('image/jpeg', quality);
      resolve(base64String);
    };
    
    img.onerror = () => reject(new Error('Image loading failed'));
    img.src = URL.createObjectURL(file);
  });
};

// Image selection component
const ImageSelector = ({ userId, onImageProcessed, onError }) => {
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Load existing image when the component mounts
  useEffect(() => {
    const loadExistingImage = async () => {
      if (!userId) {
        setImageLoading(false);
        return;
      }
      
      setImageLoading(true);
      const existingImageBase64 = await DatamanagerElements.getExistingImage(userId);
      setExistingImage(existingImageBase64 || '');
      setImageLoading(false);
    };

    loadExistingImage();
  }, [userId]); // Runs whenever userId changes

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check user ID
    if (!userId) {
      onError && onError('User ID is not set.');
      return;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      onError && onError('Please select an image file only.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError && onError('File size must be less than 10MB.');
      return;
    }

    setProcessing(true);

    try {
      // Resize image + convert to Base64
      const resizedBase64 = await resizeImage(file, 100, 100, 0.8);
      
      // Set preview
      setPreviewUrl(resizedBase64);

      // Save to Firestore
      const saveResult = await DatamanagerElements.saveImageToFirestore(resizedBase64, userId);

      // Update existing image after saving
      setExistingImage(resizedBase64);

      // Call result callback
      onImageProcessed && onImageProcessed({
        originalFile: file,
        base64Data: resizedBase64,
        saveResult: saveResult,
        previewUrl: resizedBase64
      });

    } catch (error) {
      console.error('Image processing failed:', error);
      onError && onError(`Processing failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const displayImage = previewUrl || existingImage;

  return (
    <div>
      {/* Preview */}
      <div className='EditImageContainer'>
        {imageLoading ? (
          <div className='ProfileImageAlt'>
            <div>Loading...</div>
          </div>
        ) : displayImage ? (
          <img className='ProfileImage'
            src={displayImage} 
            alt="Profile Preview" 
          />
        ) : (
          <div className='ProfileImageAlt'>
            <div>No Image</div>
          </div>
        )}
      </div>

      {/* File selection input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Selection button */}
      <button className='UploadButton'
        onClick={handleButtonClick}
        disabled={processing || !userId || imageLoading}
      >
        {processing ? 'Processing...' : 
         imageLoading ? 'Loading...' : 
         !userId ? 'User ID required' : 
         existingImage ? 'Change Image' : 'Select New Image'}
      </button>

      {processing && (
        <div className='PopupBackground'>
            <div className='PopupContainer'>
                <h2>...Resizing Image...</h2>
                <h2>...Converting to Base64...</h2>
                <h2>...Saving...</h2>
            </div>
        </div>
      )}
    </div>
  );
};

// Main component
const ProfileImageUploader = ({ userId, onUploadComplete }) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImageProcessed = (processResult) => {
    setResult(processResult);
    setError('');
    
    // Pass result to parent component
    onUploadComplete && onUploadComplete({
      base64Data: processResult.base64Data,
      size: processResult.saveResult.size,
      userId: userId
    });
  };

  const handleError = (errorMessage) => {
    console.error('Error:', errorMessage);
    setError(errorMessage);
    setResult(null);
  };

  return (
    <div>
      <ImageSelector 
        userId={userId}
        onImageProcessed={handleImageProcessed}
        onError={handleError}
      />
    </div>
  );
};

// Export functions
const ProfileImageElements = { 
    resizeImage, 
    ImageSelector,
    ProfileImageUploader
};

export default ProfileImageElements;