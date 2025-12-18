
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="p-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl text-yellow-500 rotate-[-5deg]">
            <i className="fas fa-pencil-alt"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-800">Sketchy Magic</h1>
            <p className="text-sm text-gray-500 italic">Bring your drawings to life!</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
