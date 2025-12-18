
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
  const [extraPrompt, setExtraPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransform = async () => {
    if (!sketch) {
      setError("Ups! Masukkan dulu sketsa buatanmu ke dalam kotak.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedUrl = await transformSketch(sketch, selectedStyle, selectedCategory, extraPrompt);
      setResult(generatedUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-yellow-200">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sisi Kiri: Kontrol & Input (7 Kolom) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Langkah 1: Upload */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-200">1</span>
                <h2 className="text-2xl font-bold text-gray-800">Siapkan Sketsamu</h2>
              </div>
              <UploadZone 
                onImageSelect={(b) => { setSketch(b); setResult(null); setError(null); }} 
                previewImage={sketch} 
              />
            </section>

            {/* Langkah 2: Kustomisasi */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 space-y-8">
              <div className="flex items-center gap-3">
                <span className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg shadow-yellow-100">2</span>
                <h2 className="text-2xl font-bold text-gray-800">Pilih Gaya & Detail</h2>
              </div>
              
              <div className="space-y-4">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block">Gaya Visual</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {STYLES.map(s => (
                    <StyleCard 
                      key={s.id} 
                      {...s} 
                      isSelected={selectedStyle === s.id} 
                      onSelect={setSelectedStyle} 
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block">Jenis Objek</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all border-2
                          ${selectedCategory === c.id 
                            ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-105' 
                            : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block">Bisikan Mantra (Opsional)</label>
                  <textarea 
                    placeholder="Contoh: Pakai armor emas, latar belakang hutan salju..."
                    value={extraPrompt}
                    onChange={(e) => setExtraPrompt(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-300 focus:bg-white transition-all outline-none text-sm min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Tombol Aksi */}
            <div className="space-y-4">
              <button
                onClick={handleTransform}
                disabled={isGenerating || !sketch}
                className={`w-full py-6 text-2xl font-bold rounded-3xl shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95
                  ${isGenerating || !sketch 
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-none shadow-none' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-200 hover:-translate-y-1'}`}
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Menenun Imajinasi...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-sparkles text-yellow-300"></i>
                    <span>Hidupkan Sekarang!</span>
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex gap-4">
                    <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-red-500">
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                      <p className="text-red-800 font-bold mb-1">Ada Sedikit Kendala</p>
                      <p className="text-red-600/80 text-sm leading-relaxed mb-3">{error}</p>
                      <button 
                        onClick={() => setError(null)}
                        className="text-xs font-bold text-red-500 underline decoration-red-200 underline-offset-4 hover:text-red-700"
                      >
                        Tutup Pesan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Hasil (5 Kolom) */}
          <div className="lg:col-span-5 lg:sticky lg:top-8">
             <div className="flex items-center gap-3 mb-6">
                <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg shadow-purple-100">3</span>
                <h2 className="text-2xl font-bold text-gray-800">Hasil Karya Ajaib</h2>
              </div>

            <div className="aspect-square rounded-[40px] bg-white border-4 border-white shadow-2xl flex flex-col items-center justify-center overflow-hidden relative group">
              {result ? (
                <>
                  <img src={result} alt="Magic result" className="w-full h-full object-cover animate-fade-in" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = result;
                        link.download = "karya-ajaibku.png";
                        link.click();
                      }}
                      className="bg-white text-gray-800 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-110 transition-transform"
                    >
                      <i className="fas fa-download"></i> Simpan
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-12 space-y-6">
                  <div className="w-24 h-24 mx-auto bg-gray-50 rounded-full flex items-center justify-center">
                    <i className="fas fa-wand-magic-sparkles text-4xl text-gray-200"></i>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-gray-400">Belum ada sihir</p>
                    <p className="text-sm text-gray-300 max-w-[200px] mx-auto">Selesaikan langkah 1 & 2 di sebelah kiri untuk melihat keajaiban!</p>
                  </div>
                </div>
              )}
              
              {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
                  <div className="relative w-20 h-20 mb-8">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-blue-600 border-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-4 bg-blue-50 rounded-full flex items-center justify-center">
                      <i className="fas fa-magic text-2xl text-blue-500 animate-pulse"></i>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-blue-900 mb-2">Sedang Meramu...</h3>
                  <p className="text-blue-700/60 text-sm leading-relaxed">
                    AI sedang mempelajari setiap garis sketsamu untuk diubah menjadi mahakarya.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">
              <i className="fas fa-info-circle text-blue-400 mt-1"></i>
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Tips:</strong> Gunakan garis yang tegas pada sketsamu agar AI lebih mudah mengenali bentuknya. Kamu juga bisa menambahkan warna dasar pada sketsa untuk hasil lebih akurat!
              </p>
            </div>
          </div>

        </div>
      </main>
      
      <footer className="mt-20 py-10 border-t border-gray-100 text-center">
        <p className="text-gray-400 font-medium flex items-center justify-center gap-2">
          <span>Dibuat dengan imajinasi & Gemini AI</span>
        </p>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; filter: blur(10px); }
          to { opacity: 1; filter: blur(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
