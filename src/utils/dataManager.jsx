import React, { useState, useEffect } from 'react';
import { 
    getAuth, 
    onAuthStateChanged
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from 'firebase/firestore';

import { firebaseApp } from '../services/firebase/FirebaseAppConfiguration';
import UserManagement from '../services/firebase/UserManagementSystem';

const db = getFirestore(firebaseApp);

//#TODO clean this class up and imports. Please do not add to the mess

const useAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                
                // Use UserManagement system to fetch detailed user information
                try {
                    const userDataFromManagement = await UserManagement.getUser(user.uid);
                    if (userDataFromManagement) {
                        setUserData(userDataFromManagement);
                    } else {
                        console.warn('User data not found in UserManagement system');
                        setUserData(null);
                    }
                } catch (error) {
                    console.error('Failed to fetch user data from UserManagement:', error);
                    setUserData(null);
                }
            } else {
                setCurrentUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        
        return () => unsubscribe(); // Prevent memory leaks
    }, []);

    return { currentUser, userData, loading };
};

// Function to save Base64 to profileimages collection
const saveImageToFirestore = async (base64Data, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Saving image to profileimages collection...');
    
    // Use setDoc to create a document if it doesn't exist, or overwrite if it does
    await setDoc(doc(db, 'profileimages', userId), {
      uid: userId,
      imageBase64: base64Data,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(), // Set only when first created
      imageSize: Math.round(base64Data.length * 0.75), // Estimate Base64 size
      format: 'jpeg',
      dimensions: '100x100'
    }, { merge: true }); // Preserve existing data with merge: true

    console.log('Saved to profileimages collection');
    
    return {
      uid: userId,
      base64: base64Data,
      size: Math.round(base64Data.length * 0.75),
      updatedAt: serverTimestamp()
    };

  } catch (error) {
    console.error('Error saving to profileimages:', error);
    throw error;
  }
};

// Function to fetch existing image from Firestore
const getExistingImage = async (userId) => {
  try {
    if (!userId) return null;
    
    const docRef = doc(db, 'profileimages', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.imageBase64;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Get-image Error:', error);
    return null;
  }
};

// Component to display profile image
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
      const existingImageBase64 = await getExistingImage(userId);
      setExistingImage(existingImageBase64 || '');
      setImageLoading(false);
    };

    loadExistingImage();
  }, [userId]); // Runs whenever userId changes

  return (
    <img className={imageclass}
      src={existingImage} 
      alt="Profile" 
    />
  );
};

const DatamanagerElements = {
    useAuth,
    saveImageToFirestore,
    ProfileImageDisplay,
    getExistingImage
}

export default DatamanagerElements;