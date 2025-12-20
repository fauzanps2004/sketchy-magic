
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined); // Default ke undefined (bebas/fill)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number, y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaChange = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      if (!croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  const ratios = [
    { label: 'Bebas', value: undefined },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="text-center space-y-2 mb-4">
          <h3 className="text-white text-sm font-bold uppercase tracking-[0.2em]">Sesuaikan Sketsa</h3>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest">Pilih rasio dan atur posisi sketsa</p>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex justify-center gap-2">
          {ratios.map((r) => (
            <button
              key={r.label}
              onClick={() => setAspect(r.value)}
              className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border
                ${aspect === r.value 
                  ? 'bg-white text-black border-white' 
                  : 'bg-neutral-900 text-gray-400 border-neutral-800 hover:border-gray-600'}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="relative w-full aspect-square bg-neutral-900 rounded-2xl overflow-hidden border border-white/5">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            classes={{
                containerClassName: "rounded-2xl",
                mediaClassName: "rounded-2xl"
            }}
          />
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 px-4">
             <i className="fas fa-minus text-gray-500 text-[10px]"></i>
             <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-white h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
              <i className="fas fa-plus text-gray-500 text-[10px]"></i>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-4 bg-neutral-800 text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-700 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={createCroppedImage}
              className="flex-1 py-4 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors shadow-xl shadow-white/5"
            >
              Gunakan Sketsa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility function to get the cropped image
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Pastikan latar belakang putih jika ada area transparan
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/png');
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

export default ImageCropper;
