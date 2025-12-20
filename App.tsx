
import React, { useState, useEffect, useRef } from 'react';
import { StyleType, CategoryType, TransformationResult, GeneratedImages } from './types';
import { STYLES, CATEGORIES } from './constants';
import { transformSketch, generateAIsimpleSketch } from './geminiService';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import StyleCard from './components/StyleCard';
import DrawingCanvas, { DrawingCanvasRef } from './components/DrawingCanvas';

// IndexedDB Helper for Large Binary/Base64 Data
const DB_NAME = 'WallpaperMagicDB';
const STORE_NAME = 'history';
const DB_VERSION = 1;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getHistoryFromDB = async (): Promise<TransformationResult[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        // Sort by timestamp descending
        const results = (request.result as TransformationResult[]).sort((a, b) => b.timestamp - a.timestamp);
        resolve(results.slice(0, 5)); // Keep only latest 5 in state
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to load history from DB', e);
    return [];
  }
};

const saveItemToDB = async (item: TransformationResult) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(item);
    
    // Clean up old items (optional, keeping DB tidy)
    const countRequest = store.count();
    countRequest.onsuccess = () => {
      if (countRequest.result > 10) {
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = (e: any) => {
          const cursor = e.target.result;
          if (cursor) {
            cursor.delete(); // Delete oldest
          }
        };
      }
    };
  } catch (e) {
    console.error('Failed to save to DB', e);
  }
};

const App: React.FC = () => {
  const [sketch, setSketch] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedImages | null>(null);
  const [activeTab, setActiveTab] = useState<'square' | 'portrait' | 'landscape'>('square');

  const [selectedStyle, setSelectedStyle] = useState<StyleType>(StyleType.REALISTIC);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(CategoryType.CHARACTER);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSketching, setIsSketching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [history, setHistory] = useState<TransformationResult[]>([]);
  const [inputMode, setInputMode] = useState<'upload' | 'draw'>('upload');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [isListeningSketch, setIsListeningSketch] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'id-ID';
      recognitionRef.current = recognition;
    }

    const savedTheme = localStorage.getItem('mefuya_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    const hasSeenTutorial = localStorage.getItem('mefuya_tutorial_seen');
    if (!hasSeenTutorial) setShowTutorial(true);
    
    // Load history from IndexedDB
    getHistoryFromDB().then(setHistory);
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (isListeningSketch) {
        handleAutoSketch(transcript);
      } else if (isListening) {
        setExtraPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
      }
      setIsListening(false);
      setIsListeningSketch(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      setIsListeningSketch(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
      setIsListeningSketch(false);
    };
  }, [isListening, isListeningSketch]);

  const toggleListeningDetails = () => {
    if (isListening || isListeningSketch) {
      recognitionRef.current?.stop();
      return;
    }
    setIsListening(true);
    setIsListeningSketch(false);
    recognitionRef.current?.start();
  };

  const toggleListeningSketch = () => {
    if (isListening || isListeningSketch) {
      recognitionRef.current?.stop();
      return;
    }
    setInputMode('draw');
    setIsListening(false);
    setIsListeningSketch(true);
    recognitionRef.current?.start();
  };

  const handleAutoSketch = async (prompt: string) => {
    setIsSketching(true);
    setError(null);
    try {
      const aiSketch = await generateAIsimpleSketch(prompt);
      if (canvasRef.current) {
        canvasRef.current.setImage(aiSketch);
        setSketch(aiSketch);
      }
    } catch (err: any) {
      setError(err.message || "AI gagal bikin sketsa.");
    } finally {
      setIsSketching(false);
    }
  };

  const handleTransform = async () => {
    if (!sketch || sketch === "") {
      setError("Sketsa belum ada, Bro. Gambar dulu atau pake Voice Sketch.");
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
      const newResults = { square: sq, portrait: pt, landscape: ls };
      setResults(newResults);
      setActiveTab('square');
      saveToHistory(newResults);
    } catch (err: any) {
      setError(err.message || "Gagal bikin magic. Coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('mefuya_theme', newMode ? 'dark' : 'light');
  };

  const saveToHistory = async (newResults: GeneratedImages) => {
    if (!sketch) return;
    const item: TransformationResult = { 
      originalImage: sketch, 
      results: newResults, 
      style: selectedStyle, 
      category: selectedCategory, 
      timestamp: Date.now() 
    };
    
    // Update local state (UI)
    setHistory(prev => [item, ...prev].slice(0, 5));
    
    // Persist to IndexedDB instead of localStorage
    await saveItemToDB(item);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-neutral-950 text-white selection:bg-white selection:text-black' : 'bg-white text-black selection:bg-black selection:text-white'}`}>
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pb-12 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 mb-16">
          
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="modern-card p-6 flex flex-col flex-1 relative overflow-hidden">
              {isSketching && (
                <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 transition-all animate-in fade-in">
                  <div className="w-12 h-12 border-2 border-t-white border-white/20 rounded-full animate-spin mb-4"></div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white text-center">Melukis Sketsa Presisi...</h4>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-4">
                  <button onClick={() => setInputMode('upload')} className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${inputMode === 'upload' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-gray-400 hover:text-gray-500'}`}>Upload</button>
                  <button onClick={() => setInputMode('draw')} className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${inputMode === 'draw' ? (isDarkMode ? 'text-white' : 'text-black') : 'text-gray-400 hover:text-gray-500'}`}>Gambar</button>
                </div>
                <button
                  onClick={toggleListeningSketch}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all
                    ${isListeningSketch 
                      ? 'bg-blue-600 text-white animate-pulse shadow-lg' 
                      : (isDarkMode ? 'bg-neutral-800 text-blue-400' : 'bg-blue-50 text-blue-600')}`}
                >
                  <i className={`fas ${isListeningSketch ? 'fa-stop' : 'fa-wand-magic-sparkles'}`}></i>
                  {isListeningSketch ? 'Mendengarkan...' : 'Voice Sketch'}
                </button>
              </div>
              
              <div className="flex-1 min-h-[350px]">
                {inputMode === 'upload' ? (
                  <UploadZone onImageSelect={(b) => { setSketch(b); setResults(null); setError(null); }} previewImage={sketch} />
                ) : (
                  <DrawingCanvas ref={canvasRef} onImageChange={(b) => setSketch(b)} width={512} height={512} />
                )}
              </div>
            </div>

            <div className="modern-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Detail Final</h2>
                <button
                  onClick={toggleListeningDetails}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all
                    ${isListening 
                      ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                      : (isDarkMode ? 'bg-neutral-800 text-gray-400' : 'bg-gray-50 text-gray-400')}`}
                >
                  <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
                  {isListening ? 'Listening...' : 'Voice Input'}
                </button>
              </div>
              <textarea 
                placeholder="Misal: Cahaya neon, kostum baja mengkilap..." 
                value={extraPrompt} 
                onChange={(e) => setExtraPrompt(e.target.value)} 
                className={`w-full p-4 rounded-lg border border-transparent transition-all outline-none text-xs min-h-[100px] resize-none ${isDarkMode ? 'bg-neutral-800 focus:bg-neutral-900 focus:border-white text-gray-200' : 'bg-gray-50 focus:bg-white focus:border-black text-black'}`} 
              />
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-8">
            <div className="modern-card p-6 flex-1 flex flex-col">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Gaya Visual</h2>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {STYLES.map(s => <StyleCard key={s.id} {...s} isSelected={selectedStyle === s.id} onSelect={setSelectedStyle} />)}
              </div>
              <div className="space-y-6 mt-auto">
                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Kategori Objek</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all border ${selectedCategory === c.id ? (isDarkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black') : (isDarkMode ? 'bg-neutral-900 text-gray-400 border-neutral-800 hover:border-white' : 'bg-white text-gray-400 border-gray-100 hover:border-black')}`}>{c.label}</button>)}
                  </div>
                </div>
              </div>
            </div>
            
            <button onClick={handleTransform} disabled={isGenerating || isSketching} className={`w-full py-5 modern-button text-sm uppercase tracking-widest transition-all shadow-xl ${isGenerating ? 'bg-gray-100 dark:bg-neutral-800 text-gray-300 cursor-wait' : (isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-900')}`}>
              {isGenerating ? 'Membuat Wallpaper...' : 'Generate Magic'}
            </button>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <div className="modern-card p-2 flex-1 relative overflow-hidden flex flex-col">
              {results && (
                <div className={`flex items-center p-2 mb-2 rounded-lg gap-2 ${isDarkMode ? 'bg-neutral-900' : 'bg-gray-50'}`}>
                    {['square', 'portrait', 'landscape'].map(id => <button key={id} onClick={() => setActiveTab(id as any)} className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === id ? (isDarkMode ? 'bg-neutral-800 text-white shadow-sm' : 'bg-white text-black shadow-sm') : 'text-gray-400'}`}>{id === 'square' ? '1:1' : id === 'portrait' ? '9:16' : '16:9'}</button>)}
                </div>
              )}
              <div className={`flex-1 flex items-center justify-center rounded-lg overflow-hidden relative min-h-[400px] transition-colors ${isDarkMode ? 'bg-neutral-900' : 'bg-[#fafafa]'}`}>
                {results ? (
                  <div className="w-full h-full p-2 flex items-center justify-center fade-in-up relative group/result">
                    <img key={activeTab} src={results[activeTab]} alt="Final Result" onClick={() => setFullScreenImage(results[activeTab])} className="max-w-full max-h-full object-contain rounded-md shadow-2xl cursor-zoom-in" />
                    <button onClick={() => { const link = document.createElement('a'); link.href = results[activeTab]; link.download = `magic-${activeTab}.png`; link.click(); }} className={`absolute bottom-6 right-6 border p-4 rounded-full shadow-2xl transition-all z-10 ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-black/5 text-black'}`}><i className="fas fa-download"></i></button>
                  </div>
                ) : (
                  <div className="text-center p-10 space-y-4 opacity-10">
                    <div className="w-20 h-20 border rounded-full flex items-center justify-center mx-auto"><i className="fas fa-wand-magic-sparkles text-3xl"></i></div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">AI Magic Rendering</p>
                  </div>
                )}
                {isGenerating && (
                  <div className={`absolute inset-0 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 z-20 ${isDarkMode ? 'bg-black/80 text-white' : 'bg-white/90 text-black'}`}>
                    <div className="w-10 h-10 border border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Memproses Render...</h3>
                  </div>
                )}
              </div>
              {error && (
                <div className="absolute bottom-8 left-8 right-8 bg-red-500 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 z-40">
                  <span className="text-[11px] font-bold flex-1">{error}</span>
                  <button onClick={() => setError(null)}><i className="fas fa-times"></i></button>
                </div>
              )}
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="fade-in-up">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-8">Kreasi Terakhir</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {history.map((item, idx) => (
                <div key={idx} className={`group relative aspect-square rounded-xl overflow-hidden border cursor-pointer ${isDarkMode ? 'border-neutral-800' : 'border-gray-100'}`} onClick={() => { setResults(item.results); setActiveTab('square'); }}>
                  <img src={item.results.square} className="w-full h-full object-cover" alt="History" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {fullScreenImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setFullScreenImage(null)}>
          <img src={fullScreenImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        </div>
      )}

      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-xl">
          <div className={`w-full max-w-sm p-10 relative border shadow-2xl rounded-2xl ${isDarkMode ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-black/5 text-black'}`}>
            <h3 className="text-xl font-extrabold uppercase mb-6 text-center">Wallpaper Magic</h3>
            <p className="text-xs font-medium leading-relaxed mb-10">Gunakan <b>Voice Sketch</b> biar AI gambarin pondasi anatomi karakter yang akurat buat lo.</p>
            <button onClick={() => setShowTutorial(false)} className={`w-full py-4 font-bold text-xs uppercase modern-button ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>Mulai</button>
          </div>
        </div>
      )}
      
      <footer className="py-12 text-center text-gray-500 font-bold text-[9px] uppercase tracking-[0.4em]">
        &copy; 2025 Wallpaper Magic • Mefuya Entertainment
      </footer>
    </div>
  );
};

export default App;
