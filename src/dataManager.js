//여기에 DB에 값을 요청하고 돌려받고 하는 기능들을 집어넣자.

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    signOut,
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from 'firebase/firestore';

import { auth, db } from './config/firebase';

const useAuth = (tableName) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const db = getFirestore();
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                
                // Firestore에서 사용자 상세 정보 가져오기
                try {
                    const userDoc = await getDoc(doc(db, tableName, user.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (error) {
                    console.error('사용자 데이터 가져오기 실패:', error);
                }
            } else {
                setCurrentUser(null);
                setUserData(null);
            }
            setLoading(false);
        });
        
        return () => unsubscribe(); // 메모리 누수 방지
    }, []);

    return { currentUser, userData, loading };
};

// profileimages 컬렉션에 Base64 저장 함수
const saveImageToFirestore = async (base64Data, userId) => {
  try {
    if (!userId) {
      throw new Error('사용자 ID가 필요합니다');
    }

    console.log('profileimages 컬렉션에 이미지 저장 중...');
    
    // setDoc을 사용해서 문서가 없으면 생성, 있으면 덮어쓰기
    await setDoc(doc(db, 'profileimages', userId), {
      uid: userId,
      imageBase64: base64Data,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(), // 처음 생성 시에만 설정됨
      imageSize: Math.round(base64Data.length * 0.75), // Base64 크기 추정
      format: 'jpeg',
      dimensions: '100x100'
    }, { merge: true }); // merge: true로 기존 데이터 보존

    console.log('profileimages 컬렉션 저장 완료');
    
    return {
      uid: userId,
      base64: base64Data,
      size: Math.round(base64Data.length * 0.75),
      updatedAt: new Date()
    };

  } catch (error) {
    console.error('profileimages 저장 오류:', error);
    throw error;
  }
};

// Firestore에서 기존 이미지 가져오는 함수
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

// 프로필 이미지 표시 컴포넌트
const ProfileImageDisplay = ({ userId, imageclass }) => {
  
  const [imageLoading, setImageLoading] = useState(true);
  const [existingImage, setExistingImage] = useState('');

  // 컴포넌트 마운트 시 기존 이미지 로드
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
  }, [userId]); // userId가 변경될 때마다 실행

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