import { useRef, useState, type PointerEvent } from 'react';
import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  onChange: (file: File | null) => void;
}

// Canvas de firma — pointerdown/move/up cubre mouse, touch y stylus con una sola API.
export function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  function getPos(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // El canvas se estira por CSS (w-full) pero su resolución interna es fija —
    // hay que reescalar la posición del puntero a coordenadas del canvas.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function handlePointerDown(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0B1E36';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasDrawing(true);
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onChange(new File([blob], 'firma.png', { type: 'image/png' }));
    }, 'image/png');
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={140}
        className="w-full touch-none rounded-lg border border-dashed border-slate-300 bg-white"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!hasDrawing}
          className="flex items-center gap-1.5"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
          <span>Limpiar</span>
        </Button>
      </div>
    </div>
  );
}
