/**
 * Shrinks an uploaded image so it can be saved with the church/member record.
 * Phone photos are often several MB; a logo or avatar only needs a few hundred pixels.
 */
export const resizeImageFile = (file: File, maxSize = 400): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // SVGs are already small and scale cleanly
      if (file.type === 'image/svg+xml') {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read that image file'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        // PNG keeps transparent logo backgrounds; JPEG is much smaller for photos
        resolve(file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp'
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
