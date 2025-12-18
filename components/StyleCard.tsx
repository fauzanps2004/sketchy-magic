
import React from 'react';
import { StyleType } from '../types';

interface StyleCardProps {
  id: StyleType;
  label: string;
  icon: string;
  isSelected: boolean;
  onSelect: (id: StyleType) => void;
}

const StyleCard: React.FC<StyleCardProps> = ({ id, label, icon, isSelected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(id)}
      className={`p-3 hand-drawn-button transition-all flex flex-col items-center justify-center gap-2
        ${isSelected 
          ? 'bg-yellow-200 border-yellow-600 shadow-md rotate-[-2deg]' 
          : 'bg-white border-gray-300 hover:border-gray-500'}`}
    >
      <div className={`text-xl ${isSelected ? 'text-yellow-700' : 'text-gray-400'}`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
};

export default StyleCard;
