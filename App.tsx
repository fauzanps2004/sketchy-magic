
import React, { useState, useEffect, useRef } from 'react';
import { StyleType, CategoryType, TransformationResult, GeneratedImages } from './types';
import { STYLES, CATEGORIES } from './constants';
import { transformSketch } from './geminiService';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import StyleCard from './components/StyleCard';
import DrawingCanvas from './components/DrawingCanvas';

const App: React.FC = () => {
  const [sketch, setSketch] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedImages | null>(null);
  const [activeTab, setActiveTab] = useState<'square' | 'portrait' | 'landscape'>('square');

  const [selectedStyle, setSelectedStyle] = useState<StyleType>(StyleType.REALISTIC);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(CategoryType.CHARACTER);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [history, setHistory] = useState<TransformationResult[]>([]);
  const [inputMode, setInputMode] = useState<'upload' | 'draw'>('upload');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  // Speech to Text States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'id-ID'; // Default to Indonesian

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setExtraPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError("Izin mikrofon ditolak. Silakan aktifkan di pengaturan browser.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Load Dark Mode Preference
    const savedTheme = localStorage.getItem('mefuya_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

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
        localStorage.removeItem('mefuya_history');
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Browser Anda tidak mendukung fitur Speech-to-Text.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (e) {
        console.error("Recognition already started", e);
      }
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mefuya_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mefuya_theme', 'light');
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    try {
      localStorage.setItem('mefuya_tutorial_seen', 'true');
    } catch (e) {
      console.warn("Could not save tutorial preference");
    }
  };

  const saveToHistory = (newResults: GeneratedImages) => {
    if (!sketch) return;
    const item: TransformationResult = {
      originalImage: sketch,
      results: newResults,
      style: selectedStyle,
      category: selectedCategory,
      timestamp: Date.now()
    };

    const updatedHistory = [item, ...history].slice(0, 3);
    setHistory(updatedHistory);

    try {
      localStorage.setItem('mefuya_history', JSON.stringify(updatedHistory));
    } catch (e: any) {
      try {
        localStorage.setItem('mefuya_history', JSON.stringify([item]));
      } catch (retryError) {
        console.warn("Storage full. History hanya tersedia untuk sesi ini.");
        localStorage.removeItem('mefuya_history');
      }
    }
  };

  const handleTransform = async () => {
    if (!sketch || sketch === "") {
      setError("Silakan buat atau unggah sketsa terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResults(null);

    try {
      const [sq, pt, ls] = await Promise.all([
        transformSketch(sketch, selectedStyle, selectedCategory, extraPrompt, "1:1"),
        transformSketch(sketch, selectedStyle, selectedCategory, extraPrompt, "9:16"),
        transformSketch(sketch, selectedStyle, selectedCategory, extraPrompt, "16:9")
      ]);

      const newResults: GeneratedImages = {
        square: sq,
        portrait: pt,
        landscape: ls
      };

      setResults(newResults);
      setActiveTab('square');
      saveToHistory(newResults);
    } catch (err: any) {
      setError(err.message || "Gagal menghasilkan gambar. Coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleMode = (mode: 'upload' | 'draw') => {
    setInputMode(mode);
    setSketch(null);
    setResults(null);
    setError(null);
  };

  const getActiveImage = () => {
    if (!results) return null;
    return results[activeTab];
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-neutral-950 text-white selection:bg-white selection:text-black' : 'bg-white text-black selection:bg-black selection:text-white'}`}>
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pb-12 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 mb-16">
          
          {/* Section: Source */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="modern-card p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4">
                  <button 
                    onClick={() => toggleMode('upload')}
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${inputMode === 'upload' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-gray-400 hover:text-gray-500'}`}
                  >
                    01. Upload
                  </button>
                  <button 
                    onClick={() => toggleMode('draw')}
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${inputMode === 'draw' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-gray-400 hover:text-gray-500'}`}
                  >
                    01. Gambar
                  </button>
                </div>
                {inputMode === 'upload' && sketch && (
                  <button 
                    onClick={() => { setSketch(null); setResults(null); }}
                    className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:opacity-70 transition-opacity"
                  >
                    Hapus
                  </button>
                )}
              </div>
              
              <div className="flex-1 min-h-[350px]">
                {inputMode === 'upload' ? (
                  <UploadZone 
                    onImageSelect={(b) => { setSketch(b); setResults(null); setError(null); }} 
                    previewImage={sketch} 
                  />
                ) : (
                  <DrawingCanvas 
                    onImageChange={(b) => setSketch(b)} 
                    width={512} 
                    height={512} 
                  />
                )}
              </div>
            </div>

            <div className="modern-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">02. Detail</h2>
                <button
                  onClick={toggleListening}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all
                    ${isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' 
                      : (isDarkMode ? 'bg-neutral-800 text-gray-400 hover:text-white' : 'bg-gray-50 text-gray-400 hover:text-black')}`}
                >
                  <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
                  {isListening ? 'Mendengarkan...' : 'Voice Input'}
                </button>
              </div>
              <textarea 
                placeholder="Deskripsi tambahan (cth: robot perak mengkilap, latar cyberpunk)..."
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
                className={`w-full p-4 rounded-lg border border-transparent transition-all outline-none text-xs min-h-[100px] resize-none
                  ${isDarkMode 
                    ? 'bg-neutral-800 focus:bg-neutral-900 focus:border-white text-gray-200 placeholder-gray-600' 
                    : 'bg-gray-50 focus:bg-white focus:border-black text-black placeholder-gray-400'}`}
              />
              <p className="text-[8px] text-gray-400 mt-2 uppercase tracking-widest text-right">Mendukung ID & EN</p>
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

              <div className="space-y-6 mt-auto">
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Kategori Objek</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all border
                          ${selectedCategory === c.id 
                            ? (isDarkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black') 
                            : (isDarkMode 
                                ? 'bg-neutral-900 text-gray-400 border-neutral-800 hover:border-white hover:text-white' 
                                : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black')}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleTransform}
              disabled={isGenerating}
              className={`w-full py-5 modern-button text-sm uppercase tracking-widest transition-all shadow-xl
                ${isGenerating
                  ? 'bg-gray-100 dark:bg-neutral-800 text-gray-300 dark:text-gray-600 cursor-wait' 
                  : (isDarkMode 
                      ? 'bg-white text-black hover:bg-gray-200 shadow-white/5' 
                      : 'bg-black text-white hover:bg-gray-900 shadow-black/5')}
                  hover:scale-[1.02] active:scale-[0.98]`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 border-2 rounded-full animate-spin ${isDarkMode ? 'border-black/20 border-t-black' : 'border-white/20 border-t-white'}`}></div>
                  Proses Magic
                </span>
              ) : (
                'Generate Magic'
              )}
            </button>
          </div>

          {/* Section: Result */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="modern-card p-2 flex-1 relative overflow-hidden flex flex-col">
              
              {results && (
                <div className={`flex items-center p-2 mb-2 rounded-lg gap-2 ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-50'}`}>
                    {[
                        { id: 'square', label: '1:1', icon: 'fa-square' },
                        { id: 'portrait', label: '9:16', icon: 'fa-mobile-alt' },
                        { id: 'landscape', label: '16:9', icon: 'fa-tv' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                                ${activeTab === tab.id 
                                    ? (isDarkMode ? 'bg-neutral-800 text-white shadow-sm' : 'bg-white text-black shadow-sm') 
                                    : 'text-gray-400 hover:text-gray-500'}`}
                        >
                            <i className={`fas ${tab.icon}`}></i>
                            {tab.label}
                        </button>
                    ))}
                </div>
              )}

              <div className={`flex-1 flex items-center justify-center rounded-lg overflow-hidden relative min-h-[400px] transition-colors
                ${isDarkMode ? 'bg-neutral-900' : 'bg-[#fafafa]'}`}>
                {results ? (
                  <div className="w-full h-full p-2 flex items-center justify-center fade-in-up relative group/result">
                    <img 
                      key={activeTab} 
                      src={getActiveImage()!} 
                      alt={`Magic Result ${activeTab}`} 
                      onClick={() => setFullScreenImage(getActiveImage()!)}
                      className="max-w-full max-h-full object-contain rounded-md shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300 cursor-zoom-in" 
                      title="Klik untuk memperbesar"
                    />
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = getActiveImage()!;
                        link.download = `wallpaper-magic-${activeTab}.png`;
                        link.click();
                      }}
                      className={`absolute bottom-6 right-6 border p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all z-10
                        ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-black/5 text-black'}`}
                      title="Download gambar ini"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-10 space-y-4 opacity-10">
                    <div className={`w-20 h-20 border rounded-full flex items-center justify-center mx-auto ${isDarkMode ? 'border-white' : 'border-black'}`}>
                      <i className="fas fa-wand-magic-sparkles text-3xl"></i>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">AI Image Generator</p>
                  </div>
                )}
                
                {isGenerating && (
                  <div className={`absolute inset-0 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 z-20
                    ${isDarkMode ? 'bg-black/80 text-white' : 'bg-white/90 text-black'}`}>
                    <div className={`w-10 h-10 border border-t-transparent rounded-full animate-spin mb-6 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Sedang Memproses</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">Membuat 3 variasi...</p>
                  </div>
                )}
              </div>
              
              {error && (
                <div className={`absolute bottom-8 left-8 right-8 border p-5 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 z-30
                  ${isDarkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-black text-black'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    <i className="fas fa-info text-[10px]"></i>
                  </div>
                  <span className="text-[11px] font-medium leading-relaxed flex-1">{error}</span>
                  <button onClick={() => setError(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">Kreasi Terakhir</h2>
              <div className={`h-[1px] flex-1 ${isDarkMode ? 'bg-neutral-800' : 'bg-gray-100'}`}></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {history.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all
                    ${isDarkMode ? 'border-neutral-800 hover:border-white' : 'border-gray-100 hover:border-black'}`}
                  onClick={() => {
                    setResults(item.results);
                    setActiveTab('square');
                  }}
                >
                  <img src={item.results.square} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`History ${idx}`} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white uppercase tracking-widest">Buka</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Full Screen Image Preview Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setFullScreenImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <button 
              onClick={() => setFullScreenImage(null)}
              className="absolute top-0 right-0 p-4 text-white/50 hover:text-white transition-colors z-50"
            >
              <i className="fas fa-times text-3xl"></i>
            </button>

            <img 
              src={fullScreenImage} 
              alt="Full Screen Preview" 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Tutorial Popup */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-xl animate-in fade-in duration-500">
          <div className={`w-full max-w-sm p-10 relative border shadow-2xl rounded-2xl animate-in zoom-in-95
            ${isDarkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-black/5 text-black'}`}>
            <div className="text-center mb-10">
              <h3 className="text-xl font-extrabold tracking-tight uppercase">Wallpaper Magic</h3>
              <p className="text-gray-400 text-[9px] font-bold tracking-[0.3em] uppercase mt-2">by Mefuya Entertainment</p>
            </div>

            <div className="space-y-6 mb-10">
              {[
                { n: "01", t: "Gambar sketsa atau upload gambar" },
                { n: "02", t: "Tambahkan detail deskripsi" },
                { n: "03", t: "Pilih gaya visual favoritmu" },
                { n: "04", t: "Generate 3 variasi sekaligus" }
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <span className={`text-[10px] font-black transition-colors ${isDarkMode ? 'text-neutral-700 group-hover:text-white' : 'text-gray-200 group-hover:text-black'}`}>{step.n}</span>
                  <p className={`font-bold text-xs tracking-tight ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{step.t}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={closeTutorial}
              className={`w-full py-4 font-bold text-xs uppercase tracking-widest modern-button shadow-xl
                ${isDarkMode ? 'bg-white text-black shadow-white/5' : 'bg-black text-white shadow-black/10'}`}
            >
              Mulai Berkreasi
            </button>
          </div>
        </div>
      )}
      
      <footer className="py-12 text-center">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 text-gray-500 font-bold text-[9px]">
          <div className="flex items-center gap-4 tracking-[0.4em] uppercase">
            <span>&copy; 2025 Wallpaper Magic</span>
            <span className="opacity-30">•</span>
            <span>Mefuya Entertainment</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
