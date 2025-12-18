
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
      className={`w-full h-full rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all p-4 relative
        ${previewImage ? 'bg-white overflow-hidden' : 'bg-gray-50/50 border border-dashed border-gray-200 hover:bg-gray-50 hover:border-black'}`}
    >
      {previewImage ? (
        <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-lg" />
      ) : (
        <div className="text-center space-y-3 p-4">
          <div className="w-10 h-10 border border-black/10 rounded-full flex items-center justify-center mx-auto bg-white">
            <i className="fas fa-arrow-up-from-bracket text-sm text-black"></i>
          </div>
          <p className="text-xs font-semibold text-black tracking-tight">Pilih sketsa Anda</p>
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
  );
};

export default UploadZone;
