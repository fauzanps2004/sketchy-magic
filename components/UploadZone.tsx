
import React, { useRef } from 'react';

interface UploadZoneProps {
  onImageSelect: (base64: string) => void;
  previewImage: string | null;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelect, previewImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      className={`w-full aspect-square hand-drawn-border flex flex-col items-center justify-center cursor-pointer transition-colors p-4 bg-white
        ${previewImage ? 'border-gray-400' : 'border-dashed border-gray-300 hover:bg-gray-50'}`}
    >
      {previewImage ? (
        <img src={previewImage} alt="Your Sketch" className="w-full h-full object-contain rounded-lg" />
      ) : (
        <div className="text-center space-y-4">
          <i className="fas fa-plus-circle text-4xl text-gray-300"></i>
          <p className="text-lg font-bold text-gray-500">Put your drawing here!</p>
          <p className="text-xs text-gray-400 italic">(Click to pick a photo)</p>
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
  );
};

export default UploadZone;
