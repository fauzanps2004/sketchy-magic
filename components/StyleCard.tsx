
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
      className={`p-4 rounded-xl transition-all flex flex-col items-center justify-center gap-2 border
        ${isSelected 
          ? 'bg-black text-white border-black shadow-sm' 
          : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}
    >
      <div className="text-lg">
        <i className={`fas ${icon}`}></i>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
};

export default StyleCard;
