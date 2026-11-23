import type { Area } from 'react-easy-crop';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    // Stored photos come from the photo store's own web address; without this the browser
    // refuses to let us read their pixels when re-cropping
    if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not open that image'));
    img.src = src;
  });

/**
 * Cuts the chosen area out of a photo (after turning it by `rotation` degrees, a multiple of 90)
 * and returns a JPEG no wider or taller than `maxSize` pixels.
 */
export const cropImageToBlob = async (
  imageSrc: string,
  area: Area,
  rotation = 0,
  maxSize = 1600
): Promise<Blob> => {
  const img = await loadImage(imageSrc);
  const turns = ((Math.round(rotation / 90) % 4) + 4) % 4;
  const sideways = turns % 2 === 1;

  // Draw the turned photo first, then cut the area out of it (react-easy-crop gives the
  // area in the turned photo's pixels)
  const turned = document.createElement('canvas');
  turned.width = sideways ? img.naturalHeight : img.naturalWidth;
  turned.height = sideways ? img.naturalWidth : img.naturalHeight;
  const tctx = turned.getContext('2d')!;
  tctx.translate(turned.width / 2, turned.height / 2);
  tctx.rotate((turns * Math.PI) / 2);
  tctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const scale = Math.min(1, maxSize / Math.max(area.width, area.height));
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(area.width * scale));
  out.height = Math.max(1, Math.round(area.height * scale));
  const octx = out.getContext('2d')!;
  octx.fillStyle = '#ffffff'; // transparent PNG areas become white, not black
  octx.fillRect(0, 0, out.width, out.height);
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(turned, area.x, area.y, area.width, area.height, 0, 0, out.width, out.height);

  return new Promise((resolve, reject) =>
    out.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not save the photo'))), 'image/jpeg', 0.86)
  );
};
