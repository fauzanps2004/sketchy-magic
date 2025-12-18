
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
      className={`p-4 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 border-2
        ${isSelected 
          ? 'bg-blue-50 border-blue-600 shadow-lg shadow-blue-50 scale-105' 
          : 'bg-white border-gray-100 hover:border-gray-300 text-gray-400 hover:text-gray-600'}`}
    >
      <div className={`text-xl transition-colors ${isSelected ? 'text-blue-600' : ''}`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <span className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-blue-900' : ''}`}>{label}</span>
    </button>
  );
};

export default StyleCard;
