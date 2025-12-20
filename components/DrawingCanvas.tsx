
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set white background initially
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
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
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
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

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
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

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${color === c.value ? 'border-black scale-110' : 'border-white'}`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
          <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm group hover:scale-110 transition-transform">
             <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer border-none p-0"
              title="Pilih warna kustom"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-200/50">
          <div className="flex items-center gap-3 flex-1">
            <i className="fas fa-paint-brush text-[10px] text-gray-400"></i>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-full max-w-[120px] accent-black h-1"
            />
            <span className="text-[9px] font-bold text-gray-400 w-4">{lineWidth}</span>
          </div>
          <button 
            onClick={clearCanvas}
            className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-trash-alt"></i>
            Reset
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] bg-white rounded-xl border border-gray-200 overflow-hidden cursor-crosshair relative shadow-inner group">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full touch-none"
        />
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/5 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest text-gray-500">
            Canvas Aktif
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
