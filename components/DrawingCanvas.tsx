
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface DrawingCanvasProps {
  onImageChange: (base64: string) => void;
  width: number;
  height: number;
}

export interface DrawingCanvasRef {
  clear: () => void;
  setImage: (base64: string) => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({ onImageChange, width, height }, ref) => {
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

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    clear: clearCanvas,
    setImage: (base64: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw image keeping aspect ratio but fitting the canvas
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height, 
                           centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
        onImageChange(canvas.toDataURL('image/png'));
      };
      img.src = base64;
    }
  }));

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

  const getCanvasPos = (cssX: number, cssY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return { x: cssX * scaleX, y: cssY * scaleY };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getMousePos(e);
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
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
                className="relative w-9 h-9 rounded-full overflow-hidden border-2 shadow-sm group hover:scale-105 transition-transform cursor-pointer border-white dark:border-neutral-600 ring-1 ring-black/5 dark:ring-white/10"
                style={{ backgroundColor: color }}
            >
                <input 
                type="color" 
                value={color} 
                onChange={(e) => selectColor(e.target.value)}
                className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer border-none p-0 opacity-0"
                title="Ganti Warna"
                />
            </div>
            <div className="flex flex-col">
                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Warna</span>
                <span className="text-[9px] font-mono text-gray-400 uppercase">{color}</span>
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-gray-200 dark:bg-neutral-600 mx-2"></div>

          <div className="flex items-center gap-3 flex-1">
            <i className={`fas fa-circle text-[6px] ${isEraser ? 'text-gray-300 dark:text-neutral-600' : 'text-black dark:text-white'}`}></i>
            <input 
              type="range" 
              min="1" 
              max="40" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-full max-w-[120px] accent-black dark:accent-white h-1 cursor-pointer"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200/50 dark:border-neutral-700 mt-1">
          <button 
            onClick={() => setIsEraser(!isEraser)}
            className={`text-[9px] font-bold uppercase tracking-[0.15em] transition-colors flex items-center gap-2 px-3 py-1.5 rounded-full
              ${isEraser 
                ? 'text-white bg-black dark:bg-white dark:text-black shadow-md' 
                : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white bg-white dark:bg-neutral-700 border border-gray-100 dark:border-neutral-600'}`}
          >
            <i className="fas fa-eraser"></i>
            {isEraser ? 'Eraser On' : 'Eraser'}
          </button>

          <button 
            onClick={clearCanvas}
            className="text-[9px] font-bold uppercase tracking-[0.15em] text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-2 px-3 py-1.5 rounded-full"
          >
            <i className="fas fa-trash-alt"></i>
            Reset
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px] bg-white rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden relative shadow-inner group touch-none">
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
        
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none z-10">
          <div className="bg-black/5 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest text-gray-500">
            {isEraser ? 'Mode Penghapus' : 'Mode Gambar'}
          </div>
        </div>
      </div>
    </div>
  );
});

export default DrawingCanvas;
