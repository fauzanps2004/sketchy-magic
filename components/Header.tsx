
import React from 'react';

interface HeaderProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <header className="py-16 px-6 relative">
      <div className="max-w-6xl mx-auto flex flex-col items-center relative">
        <div className="text-center group cursor-default space-y-2">
          <div className={`text-4xl md:text-5xl font-black tracking-[-0.05em] leading-none uppercase transition-colors
            ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Mefuya
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className={`h-[1px] w-8 transition-colors ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}></div>
            <div className="text-[10px] md:text-xs tracking-[0.6em] font-bold text-gray-400 uppercase">
              Entertainment
            </div>
            <div className={`h-[1px] w-8 transition-colors ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}></div>
          </div>
        </div>

        {/* Theme Toggle Button */}
        {toggleTheme && (
          <button 
            onClick={toggleTheme}
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
              ${isDarkMode 
                ? 'bg-neutral-800 text-yellow-400 hover:bg-neutral-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <i className="fas fa-sun text-sm"></i>
            ) : (
              <i className="fas fa-moon text-sm"></i>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
