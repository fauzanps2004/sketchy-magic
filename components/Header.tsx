
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-16 px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <div className="text-center group cursor-default space-y-2">
          <div className="text-4xl md:text-5xl font-black tracking-[-0.05em] text-black leading-none uppercase">
            Mefuya
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-8 bg-black/10"></div>
            <div className="text-[10px] md:text-xs tracking-[0.6em] font-bold text-gray-400 uppercase">
              Entertainment
            </div>
            <div className="h-[1px] w-8 bg-black/10"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
