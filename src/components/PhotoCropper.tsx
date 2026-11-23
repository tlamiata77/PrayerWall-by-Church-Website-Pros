import React, { useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { RotateCw, X, Check, ZoomIn } from 'lucide-react';
import { cropImageToBlob } from '../utils/cropImage';

type Shape = 'wide' | 'square' | 'original';

interface PhotoCropperProps {
  /** The photo to crop (an object URL or web address) */
  imageSrc: string;
  onCancel: () => void;
  /** Called with the cropped JPEG (at most 1600px on its longest side) */
  onSave: (photo: Blob) => void | Promise<void>;
}

/** Crop window for directory photos: pick a shape, drag to position, zoom, turn, save */
export const PhotoCropper: React.FC<PhotoCropperProps> = ({ imageSrc, onCancel, onSave }) => {
  // Start with the photo's own shape so wide family photos keep everyone; Wide or Square are a tap away
  const [shape, setShape] = useState<Shape>('original');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageSrc;
  }, [imageSrc]);

  const sideways = Math.round(rotation / 90) % 2 !== 0;
  const originalAspect = natural ? (sideways ? natural.h / natural.w : natural.w / natural.h) : 4 / 3;
  const aspect = shape === 'wide' ? 4 / 3 : shape === 'square' ? 1 : originalAspect;

  const save = async () => {
    if (!area) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await cropImageToBlob(imageSrc, area, rotation);
      await onSave(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the photo');
      setSaving(false);
    }
  };

  const shapes: Array<{ id: Shape; label: string }> = [
    { id: 'original', label: 'Original shape' },
    { id: 'wide', label: 'Wide (4:3)' },
    { id: 'square', label: 'Square' },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-stone-950/80 flex items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Crop photo">
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
          <h3 className="font-semibold text-stone-900">Crop photo</h3>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer" aria-label="Cancel">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 sm:flex-none sm:h-[420px] bg-stone-900 min-h-[300px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            minZoom={1}
            maxZoom={4}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {shapes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setShape(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                  shape === s.id ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-stone-200 text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Turn
            </button>
          </div>

          <label className="flex items-center gap-3 text-xs text-stone-600">
            <ZoomIn className="w-4 h-4 shrink-0" />
            <span className="sr-only">Zoom</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-stone-900"
              aria-label="Zoom"
            />
          </label>
          <p className="text-[11px] text-stone-500">Drag the photo to position it. Pinch or use the slider to zoom.</p>

          {error && <p className="text-xs text-rose-700">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer">
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!area || saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : 'Use this photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
