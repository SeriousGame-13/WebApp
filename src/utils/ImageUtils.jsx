export const resizeImage = (file, width = 100, height = 100, quality = 0.8) => {
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