
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

  const handleTransform = async () => {
    if (!sketch) {
      setError("Masukkan gambarmu dulu ke dalam kotak!");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedUrl = await transformSketch(sketch, selectedStyle, selectedCategory);
      setResult(generatedUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
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
              <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center gap-2 text-shadow-sm">
                <span className="bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">1</span>
                Siapkan Gambar
              </h2>
              <UploadZone onImageSelect={(b) => { setSketch(b); setResult(null); setError(null); }} previewImage={sketch} />
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2 text-shadow-sm">
                <span className="bg-yellow-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">2</span>
                Tentukan Gaya Magic
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

              <div className="bg-white/50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Tipe Objek:</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`px-4 py-2 text-sm hand-drawn-button font-bold transition-all
                        ${selectedCategory === c.id 
                          ? 'bg-blue-500 text-white border-blue-700 scale-105 shadow-md' 
                          : 'bg-white text-gray-600 hover:border-gray-400'}`}
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
              className={`w-full py-5 text-2xl hand-drawn-button shadow-lg flex items-center justify-center gap-4 transition-all
                ${isGenerating || !sketch 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                  : 'bg-green-500 text-white hover:bg-green-600 border-green-700 active:scale-95 hover:-rotate-1'}`}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Meracik Ramuan...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-magic text-yellow-300"></i>
                  <span>Jadikan Nyata!</span>
                </>
              )}
            </button>

            {error && (
              <div className="text-center bg-red-50 p-6 rounded-2xl border-2 border-red-300 animate-bounce-short">
                <p className="text-red-600 font-bold text-lg mb-2">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="px-6 py-1 bg-white border border-red-300 rounded-full text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  OK, Mengerti
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Result */}
          <div className="md:sticky md:top-12">
            <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center gap-2 text-shadow-sm">
              <span className="bg-purple-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-sm">3</span>
              Hasil Karya
            </h2>
            <div className="aspect-square hand-drawn-border bg-white flex flex-col items-center justify-center overflow-hidden relative shadow-2xl">
              {result ? (
                <>
                  <img src={result} alt="Magic result" className="w-full h-full object-cover animate-fade-in" />
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = result;
                      link.download = "sketsa-magic.png";
                      link.click();
                    }}
                    className="absolute bottom-6 right-6 bg-white/90 hover:bg-white hand-drawn-button p-4 text-gray-800 shadow-xl transition-all hover:scale-110 active:scale-90"
                    title="Simpan Hasil"
                  >
                    <i className="fas fa-save text-2xl"></i>
                  </button>
                </>
              ) : (
                <div className="text-center p-12">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center border-4 border-dashed border-gray-100">
                    <i className="fas fa-wand-magic-sparkles text-5xl text-gray-200"></i>
                  </div>
                  <p className="text-xl font-bold text-gray-400">Hasil magic akan muncul di sini</p>
                  <p className="text-sm text-gray-300 mt-2">Pilih sketsa dan tekan tombol di samping!</p>
                </div>
              )}
              
              {isGenerating && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-pulse-slow">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-25"></div>
                    <div className="absolute inset-0 border-4 border-t-blue-600 border-transparent rounded-full animate-spin"></div>
                    <i className="fas fa-sparkles absolute inset-0 flex items-center justify-center text-3xl text-yellow-400 animate-bounce"></i>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mb-2">Transformasi Dimulai!</p>
                  <p className="text-sm text-gray-500">Menganalisa garis, menambahkan cahaya, dan mewarnai dunia...</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      
      <footer className="mt-12 text-center text-gray-400 text-sm">
        <p className="flex items-center justify-center gap-2">
          <span>Dibuat dengan</span>
          <i className="fas fa-heart text-red-300"></i>
          <span>dan Gemini 2.5 AI</span>
        </p>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
