import React, { useState, useRef, useEffect } from 'react';
import { db } from './config/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

import DatamanagerElements from './dataManager';
import './firebaseAuth.css';

// 이미지 리사이징 함수
const resizeImage = (file, width = 100, height = 100, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Canvas를 Base64로 변환
      const base64String = canvas.toDataURL('image/jpeg', quality);
      resolve(base64String);
    };
    
    img.onerror = () => reject(new Error('Imageloading failed'));
    img.src = URL.createObjectURL(file);
  });
};

// 이미지 선택 컴포넌트
const ImageSelector = ({ userId, onImageProcessed, onError }) => {
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const fileInputRef = useRef(null);

  // 컴포넌트 마운트 시 기존 이미지 로드
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
  }, [userId]); // userId가 변경될 때마다 실행

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 사용자 ID 확인
    if (!userId) {
      onError && onError('사용자 ID가 설정되지 않았습니다.');
      return;
    }

    // 파일 검증
    if (!file.type.startsWith('image/')) {
      onError && onError('이미지 파일만 선택해주세요.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError && onError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setProcessing(true);

    try {
      // 이미지 리사이징 + Base64 변환
      const resizedBase64 = await resizeImage(file, 100, 100, 0.8);
      
      // 미리보기 설정
      setPreviewUrl(resizedBase64);

      // Firestore에 저장
      const saveResult = await DatamanagerElements.saveImageToFirestore(resizedBase64, userId);

      // 저장 후 기존 이미지 업데이트
      setExistingImage(resizedBase64);

      // 결과 콜백 호출
      onImageProcessed && onImageProcessed({
        originalFile: file,
        base64Data: resizedBase64,
        saveResult: saveResult,
        previewUrl: resizedBase64
      });

    } catch (error) {
      console.error('이미지 처리 실패:', error);
      onError && onError(`처리 실패: ${error.message}`);
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
      {/* 미리보기 */}
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

      {/* 파일 선택 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* 선택 버튼 */}
      <button className='Upload-button'
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

// 메인 컴포넌트
const ProfileImageUploader = ({ userId, onUploadComplete }) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImageProcessed = (processResult) => {
    setResult(processResult);
    setError('');
    
    // 부모 컴포넌트에 결과 전달
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

// 각 함수들을 export
const ProfileImageElements = { 
    resizeImage, 
    ImageSelector,
    ProfileImageUploader
};

export default ProfileImageElements;