
import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  onImageChange: (base64: string) => void;
  width: number;
  height: number;
}

const PRESET_COLORS = [
  { name: 'Hitam', value: '#000000' },
  { name: 'Abu', value: '#666666' },
  { name: 'Putih', value: '#ffffff' },
  { name: 'Biru', value: '#2563eb' },
  { name: 'Merah', value: '#dc2626' },
  { name: 'Hijau', value: '#16a34a' },
  { name: 'Kuning', value: '#ca8a04' },
  { name: 'Ungu', value: '#9333ea' }
];

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onImageChange, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [isCursorVisible, setIsCursorVisible] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set white background initially (Keep it white for the AI model)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Mendapatkan posisi mouse relatif terhadap elemen canvas (CSS Pixels)
  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Konversi CSS Pixels ke Canvas Bitmap Pixels (memperhitungkan scaling)
  const getCanvasPos = (cssX: number, cssY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Hitung rasio scaling (misal canvas 512px ditampilkan dalam 300px)
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    
    return {
      x: cssX * scaleX,
      y: cssY * scaleY
    };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getMousePos(e);
    
    // Update posisi visual cursor secara langsung (tanpa re-render React) untuk performa
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    }

    if (!isCursorVisible) setIsCursorVisible(true);

    if (isDrawing) {
      const canvasPos = getCanvasPos(pos.x, pos.y);
      draw(canvasPos);
    }
  };

  const handleMouseLeave = () => {
    setIsCursorVisible(false);
    stopDrawing();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update cursor pos immediately
    const pos = getMousePos(e);
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    }
    setIsCursorVisible(true);

    const canvasPos = getCanvasPos(pos.x, pos.y);
    
    ctx.beginPath();
    ctx.moveTo(canvasPos.x, canvasPos.y);
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = lineWidth;
    
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onImageChange(canvas.toDataURL('image/png'));
    }
  };

  const draw = (coords: { x: number, y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onImageChange("");
  };

  const selectColor = (newColor: string) => {
    setColor(newColor);
    setIsEraser(false);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex flex-col gap-3 p-4 rounded-lg border transition-colors bg-gray-50 border-gray-100 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => selectColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 shadow-sm 
                ${color === c.value && !isEraser 
                  ? 'border-black dark:border-white scale-110' 
                  : 'border-white dark:border-neutral-600'}`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
          <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 shadow-sm group hover:scale-110 transition-transform border-white dark:border-neutral-600">
             <input 
              type="color" 
              value={color} 
              onChange={(e) => selectColor(e.target.value)}
              className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer border-none p-0"
              title="Pilih warna kustom"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-200/50 dark:border-neutral-700">
          <div className="flex items-center gap-3 flex-1">
            <i className={`fas fa-circle text-[6px] ${isEraser ? 'text-gray-300 dark:text-neutral-600' : 'text-black dark:text-white'}`}></i>
            <input 
              type="range" 
              min="1" 
              max="40" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-full max-w-[100px] accent-black dark:accent-white h-1"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEraser(!isEraser)}
              className={`text-[9px] font-bold uppercase tracking-[0.15em] transition-colors flex items-center gap-2 px-2 py-1 rounded
                ${isEraser 
                  ? 'text-black bg-gray-200 dark:text-black dark:bg-white' 
                  : 'text-gray-400 hover:text-black dark:hover:text-white'}`}
            >
              <i className="fas fa-eraser"></i>
              {isEraser ? 'Eraser On' : 'Eraser'}
            </button>

            <button 
              onClick={clearCanvas}
              className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-trash-alt"></i>
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* Container Canvas dengan Cursor Custom */}
      <div className="flex-1 min-h-[300px] bg-white rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden relative shadow-inner group touch-none">
        
        {/* Custom Cursor Overlay */}
        <div 
          ref={cursorRef}
          className="pointer-events-none absolute top-0 left-0 z-50 flex items-center justify-center rounded-full border border-black/20 will-change-transform"
          style={{ 
            width: Math.max(lineWidth, 10) + 'px',
            height: Math.max(lineWidth, 10) + 'px',
            backgroundColor: isEraser ? 'rgba(255, 255, 255, 0.8)' : color,
            borderColor: isEraser ? '#000' : 'transparent',
            mixBlendMode: isEraser ? 'normal' : 'multiply',
            opacity: isCursorVisible ? 1 : 0,
            marginTop: `-${Math.max(lineWidth, 10) / 2}px`,
            marginLeft: `-${Math.max(lineWidth, 10) / 2}px`,
          }}
        >
          {isEraser && (
            <i 
              className="fas fa-eraser text-black/80" 
              style={{ fontSize: Math.max(lineWidth * 0.5, 8) + 'px' }}
            ></i>
          )}
        </div>

        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={handleMouseLeave}
          onTouchStart={startDrawing}
          onTouchMove={handleMouseMove}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-none block" 
        />
        
        {/* Label Mode di pojok */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none z-10">
          <div className="bg-black/5 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest text-gray-500">
            {isEraser ? 'Mode Penghapus' : 'Mode Gambar'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
