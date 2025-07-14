import React, { useState, useRef, useEffect } from 'react';
import BadgeManagement from '../services/firebase/BadgeManagement';
import '../components/styles/LoginPage.css';

// 기존 이미지 리사이징 함수 재사용
const resizeImage = (file, width = 100, height = 100, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const base64String = canvas.toDataURL('image/jpeg', quality);
      resolve(base64String);
    };
    
    img.onerror = () => reject(new Error('Image loading failed'));
    img.src = URL.createObjectURL(file);
  });
};

// 뱃지 이미지 선택 컴포넌트
const BadgeImageSelector = ({ badgeId, onImageProcessed, onError, disabled }) => {
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 기존 이미지 로드 (badgeId가 있을 때만)
  useEffect(() => {
    const loadExistingImage = async () => {
      if (!badgeId) {
        setImageLoading(false);
        return;
      }
      
      setImageLoading(true);
      try {
        const existingImageBase64 = await BadgeManagement.getBadgeImage(badgeId);
        setExistingImage(existingImageBase64 || '');
      } catch (error) {
        console.error('Failed to load existing badge image:', error);
        setExistingImage('');
      } finally {
        setImageLoading(false);
      }
    };

    loadExistingImage();
  }, [badgeId]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 검증
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
      // 이미지 리사이징 + Base64 변환
      const resizedBase64 = await resizeImage(file, 100, 100, 0.8);
      
      // 미리보기 설정
      setPreviewUrl(resizedBase64);

      // 결과 콜백 호출 (실제 저장은 뱃지 생성 시에)
      onImageProcessed && onImageProcessed({
        originalFile: file,
        base64Data: resizedBase64,
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
    if (!disabled) {
      fileInputRef.current?.click();
    }
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
            alt="Badge Preview" 
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
      <button className='UploadButton'
        onClick={handleButtonClick}
        disabled={processing || disabled || imageLoading}
      >
        {processing ? 'Processing...' : 
         imageLoading ? 'Loading...' : 
         disabled ? 'Creating badge first...' :
         existingImage || previewUrl ? 'Change Image' : 'Select Badge Image'}
      </button>

      {processing && (
        <div className='PopupBackground'>
            <div className='PopupContainer'>
                <h2>...Resizing Image...</h2>
                <h2>...Converting to Base64...</h2>
            </div>
        </div>
      )}
    </div>
  );
};

// 메인 뱃지 이미지 업로더 컴포넌트
const BadgeImageUploader = ({ badgeId, onUploadComplete, disabled }) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImageProcessed = (processResult) => {
    setResult(processResult);
    setError('');
    
    // 부모 컴포넌트에 결과 전달
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
    resizeImage, 
    BadgeImageSelector,
    BadgeImageUploader
};

export default BadgeImageElements;