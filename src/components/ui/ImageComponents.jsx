import { useEffect, useRef, useState } from 'react';
import { resizeImage } from '../../utils/ImageUtils.jsx';


export const ImageSelector = ({ 
  id, 
  onImageProcessed, 
  onError, 
  disabled = false,
  loadExistingImage,
  altText = "Image Preview",
  buttonClassName = 'ButtonSmall',
  buttonText = {
    processing: 'Processing...',
    loading: 'Loading...',
    disabled: 'Disabled',
    noImage: 'Select Image',
    hasImage: 'Change Image'
  }
}) => {
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Load existing image when the component mounts
  useEffect(() => {
    const loadImage = async () => {
      if (!id || !loadExistingImage) {
        setImageLoading(false);
        return;
      }
      
      setImageLoading(true);
      try {
        const existingImageBase64 = await loadExistingImage(id);
        setExistingImage(existingImageBase64 || '');
      } catch (error) {
        console.error('Failed to load existing image:', error);
        setExistingImage('');
      } finally {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [id, loadExistingImage]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

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

      // Update existing image after processing
      setExistingImage(resizedBase64);

      // Call result callback
      const result = {
        originalFile: file,
        base64Data: resizedBase64,
        previewUrl: resizedBase64
      };
      onImageProcessed && onImageProcessed(result);

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

  const getButtonText = () => {
    if (processing) return buttonText.processing;
    if (imageLoading) return buttonText.loading;
    if (disabled) return buttonText.disabled;
    return displayImage ? buttonText.hasImage : buttonText.noImage;
  };

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
            alt={altText} 
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
      <button className='btn-primary flex items-center gap-2 px-3 py-2'
        onClick={handleButtonClick}
        disabled={processing || disabled || imageLoading}
      >
        {getButtonText()}
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
