
import React, { useState, useEffect } from 'react';
import { StyleType, CategoryType, TransformationResult } from './types';
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
  const [extraPrompt, setExtraPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [history, setHistory] = useState<TransformationResult[]>([]);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('mefuya_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
    
    const savedHistory = localStorage.getItem('mefuya_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('mefuya_tutorial_seen', 'true');
  };

  const saveToHistory = (newResult: string) => {
    const item: TransformationResult = {
      originalImage: sketch!,
      resultImage: newResult,
      style: selectedStyle,
      category: selectedCategory,
      timestamp: Date.now()
    };
    const updatedHistory = [item, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('mefuya_history', JSON.stringify(updatedHistory));
  };

  const handleTransform = async () => {
    if (!sketch) {
      setError("Silakan unggah sketsa terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedUrl = await transformSketch(sketch, selectedStyle, selectedCategory, extraPrompt);
      setResult(generatedUrl);
      saveToHistory(generatedUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-black selection:text-white">
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pb-12 overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 mb-16">
          
          {/* Section: Source */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="modern-card p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">01. Sketsa</h2>
                <button 
                  onClick={() => { setSketch(null); setResult(null); }}
                  className={`text-[10px] font-bold uppercase tracking-widest text-red-500 hover:opacity-70 transition-opacity ${!sketch && 'invisible'}`}
                >
                  Hapus
                </button>
              </div>
              <div className="flex-1 min-h-[250px]">
                <UploadZone 
                  onImageSelect={(b) => { setSketch(b); setResult(null); setError(null); }} 
                  previewImage={sketch} 
                />
              </div>
            </div>

            <div className="modern-card p-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">02. Detail</h2>
              <textarea 
                placeholder="Deskripsi tambahan (cth: armor mengkilap, latar futuristik)..."
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
                className="w-full p-4 rounded-lg bg-gray-50 border border-transparent focus:border-black focus:bg-white transition-all outline-none text-xs min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Section: Controls */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            <div className="modern-card p-6 flex-1 flex flex-col">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">03. Konfigurasi</h2>
              
              <div className="grid grid-cols-2 gap-3 mb-8">
                {STYLES.map(s => (
                  <StyleCard 
                    key={s.id} 
                    {...s} 
                    isSelected={selectedStyle === s.id} 
                    onSelect={setSelectedStyle} 
                  />
                ))}
              </div>

              <div className="space-y-4 mt-auto">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Kategori Objek</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all border
                        ${selectedCategory === c.id 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleTransform}
              disabled={isGenerating || !sketch}
              className={`w-full py-5 modern-button text-sm uppercase tracking-widest transition-all
                ${isGenerating || !sketch 
                  ? 'bg-gray-100 text-gray-300' 
                  : 'bg-black text-white hover:bg-gray-900 shadow-xl shadow-black/5'}`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Proses
                </span>
              ) : (
                'Generate'
              )}
            </button>
          </div>

          {/* Section: Result */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="modern-card p-2 flex-1 relative overflow-hidden flex flex-col">
              <div className="flex-1 flex items-center justify-center bg-[#fafafa] rounded-lg overflow-hidden relative">
                {result ? (
                  <div className="w-full h-full p-2 flex items-center justify-center fade-in-up">
                    <img 
                      src={result} 
                      alt="Magic Result" 
                      className="max-w-full max-h-full object-contain rounded-md shadow-2xl shadow-black/10" 
                    />
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = result;
                        link.download = "mefuya-magic-output.png";
                        link.click();
                      }}
                      className="absolute bottom-6 right-6 bg-white border border-black/5 p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all z-10"
                    >
                      <i className="fas fa-download text-black"></i>
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-10 space-y-4 opacity-10">
                    <div className="w-20 h-20 border border-black rounded-full flex items-center justify-center mx-auto">
                      <i className="fas fa-sparkles text-3xl"></i>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Ready for Magic</p>
                  </div>
                )}
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 z-20">
                    <div className="w-10 h-10 border border-black border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h3 className="text-xs font-bold text-black uppercase tracking-[0.2em]">Memproses Imajinasi</h3>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="absolute bottom-8 left-8 right-8 bg-white border border-black p-5 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 z-30">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                    <i className="fas fa-info text-[10px]"></i>
                  </div>
                  <span className="text-[11px] font-medium leading-relaxed flex-1">{error}</span>
                  <button onClick={() => setError(null)} className="text-gray-400 hover:text-black transition-colors">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* History Section (Tambah juga fitur) */}
        {history.length > 0 && (
          <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">Recent Creations</h2>
              <div className="h-[1px] flex-1 bg-gray-100"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {history.map((item, idx) => (
                <div 
                  key={idx} 
                  className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 cursor-pointer hover:border-black transition-all"
                  onClick={() => setResult(item.resultImage)}
                >
                  <img src={item.resultImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`History ${idx}`} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white uppercase tracking-widest">Lihat Hasil</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Tutorial Popup */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-sm p-10 relative border border-black/5 shadow-2xl rounded-2xl animate-in zoom-in-95">
            <div className="text-center mb-10">
              <h3 className="text-xl font-extrabold text-black tracking-tight uppercase">Mefuya Magic</h3>
              <p className="text-gray-400 text-[9px] font-bold tracking-[0.3em] uppercase mt-2">Versi 2025</p>
            </div>

            <div className="space-y-6 mb-10">
              {[
                { n: "01", t: "Unggah sketsa garis hitam" },
                { n: "02", t: "Atur konfigurasi & gaya" },
                { n: "03", t: "Generate mahakarya Anda" }
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <span className="text-[10px] font-black text-gray-200 group-hover:text-black transition-colors">{step.n}</span>
                  <p className="font-bold text-xs tracking-tight text-gray-800">{step.t}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={closeTutorial}
              className="w-full py-4 bg-black text-white font-bold text-xs uppercase tracking-widest modern-button shadow-xl shadow-black/10"
            >
              Mulai Eksplorasi
            </button>
          </div>
        </div>
      )}
      
      <footer className="py-12 text-center">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 text-gray-300 font-bold text-[9px]">
          <div className="flex items-center gap-4 tracking-[0.4em] uppercase">
            <span>&copy; 2025 MEFUYA ENTERTAINMENT</span>
            <span className="opacity-30">•</span>
            <span>MODERN ELEGANCE</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
