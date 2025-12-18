
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 rotate-3">
            <i className="fas fa-pencil-ruler text-2xl text-white"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-tight">Mefuya Magic</h1>
            <p className="text-gray-400 font-medium">Ubah coretanmu jadi mahakarya nyata!</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 bg-gray-100/50 px-4 py-2 rounded-full border border-gray-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sistem Aktif</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
