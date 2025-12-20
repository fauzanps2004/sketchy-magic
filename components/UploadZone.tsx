
import React, { useRef, useState } from 'react';
import ImageCropper from './ImageCropper';

interface UploadZoneProps {
  onImageSelect: (base64: string) => void;
  previewImage: string | null;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelect, previewImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    onImageSelect(croppedImage);
    setImageToCrop(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelCrop = () => {
    setImageToCrop(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`w-full h-full rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all p-4 relative border border-dashed
          ${previewImage 
            ? 'bg-white overflow-hidden border-transparent' 
            : 'bg-gray-50/50 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:border-black dark:hover:border-white'}`}
      >
        {previewImage ? (
          <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-lg" />
        ) : (
          <div className="text-center space-y-3 p-4">
            <div className="w-10 h-10 border rounded-full flex items-center justify-center mx-auto bg-white dark:bg-neutral-800 border-black/10 dark:border-white/10">
              <i className="fas fa-arrow-up-from-bracket text-sm text-black dark:text-white"></i>
            </div>
            <p className="text-xs font-semibold text-black dark:text-white tracking-tight">Pilih sketsa Anda</p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Format PNG atau JPG</p>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {imageToCrop && (
        <ImageCropper 
          image={imageToCrop} 
          onCropComplete={handleCropComplete} 
          onCancel={handleCancelCrop} 
        />
      )}
    </>
  );
};

export default UploadZone;
