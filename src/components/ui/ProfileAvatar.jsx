import React, { useState, useEffect } from 'react';
import { Avatar } from './UIComponents.jsx';
import FirestoreManager from '../../services/firebase/FirestoreManager.jsx';

/**
 * ProfileAvatar component that loads user profile images and displays them using the Avatar component
 * This component handles the Firebase integration so Avatar remains a pure UI component
 */
export function ProfileAvatar({ name, size = 48, seed, userId, refreshTrigger }) {
  const [profileImage, setProfileImage] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  // Load profile image when userId is provided
  useEffect(() => {
    const loadProfileImage = async () => {
      if (!userId) {
        setImageLoading(false);
        return;
      }
      
      setImageLoading(true);
      try {
        const existingImageBase64 = await FirestoreManager.getUserImage(userId);
        setProfileImage(existingImageBase64 || '');
      } catch (error) {
        console.error('Failed to load profile image for avatar:', error);
        setProfileImage('');
      } finally {
        setImageLoading(false);
      }
    };

    loadProfileImage();
  }, [userId, refreshTrigger]); // Reload when userId or refreshTrigger changes

  if (imageLoading) {
    return (
      <div className={`avatar`} style={{ width: size, height: size }}>
        <span className="avatar-text">...</span>
      </div>
    );
  }

  return (
    <Avatar
      name={name}
      image={profileImage}
      size={size}
      seed={seed}
    />
  );
}

export default ProfileAvatar;
