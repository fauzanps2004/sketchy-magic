
import React, { useState } from 'react';
import { StyleType, CategoryType } from './types';
import { STYLES, CATEGORIES } from './constants';
import { transformSketch } from './geminiService';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import StyleCard from './components/StyleCard';

const App: React.FC = () => {
  const [sketch, setSketch] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleType>(StyleType.REALISTIC);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(CategoryType.CHARACTER);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const handleTransform = async () => {
    if (!sketch) {
      setError("Oops! You forgot to draw something!");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setNeedsKey(false);

    try {
      const generatedUrl = await transformSketch(sketch, selectedStyle, selectedCategory);
      setResult(generatedUrl);
    } catch (err: any) {
      if (err.message === "MISSING_API_KEY") {
        setError("I need a 'Magic Key' to work on this computer!");
        setNeedsKey(true);
      } else {
        setError(err.message || "Oh no! The magic failed. Let's try again!");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setError(null);
      setNeedsKey(false);
    } catch (e) {
      console.error("Failed to open key selector", e);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />
      
      <main className="max-w-5xl mx-auto px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* Left Side: Input & Controls */}
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center gap-2">
                <span className="bg-blue-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Draw or Upload
              </h2>
              <UploadZone onImageSelect={(b) => { setSketch(b); setResult(null); }} previewImage={sketch} />
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                <span className="bg-yellow-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Choose Magic
              </h2>
              
              <div className="grid grid-cols-3 gap-3">
                {STYLES.map(s => (
                  <StyleCard 
                    key={s.id} 
                    {...s} 
                    isSelected={selectedStyle === s.id} 
                    onSelect={setSelectedStyle} 
                  />
                ))}
              </div>

              <div>
                <p className="text-sm font-bold text-gray-500 mb-2">What is it?</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`px-4 py-1 text-sm hand-drawn-button font-bold
                        ${selectedCategory === c.id ? 'bg-blue-100 border-blue-600' : 'bg-white'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <button
              onClick={handleTransform}
              disabled={isGenerating || !sketch}
              className={`w-full py-5 text-2xl hand-drawn-button shadow-lg flex items-center justify-center gap-4 transition-transform
                ${isGenerating || !sketch 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-green-400 text-white hover:bg-green-500 border-green-700 active:scale-95'}`}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Mixing Magic Colors...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  <span>Make it REAL!</span>
                </>
              )}
            </button>

            {error && (
              <div className="text-center bg-red-50 p-6 rounded-xl border-2 border-red-200 space-y-4">
                <p className="text-red-600 font-bold text-lg">{error}</p>
                
                {needsKey ? (
                  <button 
                    onClick={handleOpenKey}
                    className="bg-white hand-drawn-button px-6 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2 mx-auto"
                  >
                    <i className="fas fa-key text-yellow-500"></i>
                    <span>Set Magic Key</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => setError(null)}
                    className="text-xs underline text-red-400"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Result */}
          <div className="sticky top-12">
            <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center gap-2">
              <span className="bg-purple-400 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
              Magic Result
            </h2>
            <div className="aspect-square hand-drawn-border bg-white flex flex-col items-center justify-center overflow-hidden relative shadow-xl">
              {result ? (
                <>
                  <img src={result} alt="Magic result" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = result;
                      link.download = "my-creation.png";
                      link.click();
                    }}
                    className="absolute bottom-4 right-4 bg-white hand-drawn-button p-3 text-gray-700 hover:bg-gray-50 shadow-md"
                    title="Download Image"
                  >
                    <i className="fas fa-download text-xl"></i>
                  </button>
                </>
              ) : (
                <div className="text-center p-12 text-gray-300">
                  <i className="fas fa-wand-sparkles text-6xl mb-6 opacity-20"></i>
                  <p className="text-lg font-bold">Your masterpiece will appear here!</p>
                </div>
              )}
              
              {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-100 rounded-full animate-spin mb-4"></div>
                  <p className="text-xl font-bold text-blue-500">Wait a second...</p>
                  <p className="text-sm text-gray-500">The AI artist is painting your dream!</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      
      <footer className="mt-12 text-center text-gray-400 text-sm">
        <p>Made with crayons, paper, and Gemini AI ✨</p>
      </footer>
    </div>
  );
};

export default App;
