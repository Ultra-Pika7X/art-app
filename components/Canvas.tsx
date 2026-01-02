'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CanvasProps {
  color: string;
  brushSize: number;
  tool: 'brush' | 'eraser';
  brushType?: 'pen' | 'marker' | 'spray';
  onUndoAvailable: (available: boolean) => void;
  onRedoAvailable: (available: boolean) => void;
  clearTrigger: number;
  undoTrigger: number;
  redoTrigger: number;
  downloadTrigger: number;
}

const Canvas: React.FC<CanvasProps> = ({
  color,
  brushSize,
  tool,
  brushType = 'pen',
  onUndoAvailable,
  onRedoAvailable,
  clearTrigger,
  undoTrigger,
  redoTrigger,
  downloadTrigger
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;

    // Fill background with white/black (optional, but good for saving)
    context.fillStyle = '#050505';
    context.fillRect(0, 0, canvas.width, canvas.height);

    saveToHistory();

    const handleResize = () => {
      // Small trick to keep canvas content on resize: save state, resize, restore
      const tempImage = canvas.toDataURL();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const newCtx = canvas.getContext('2d');
      if (newCtx) {
        newCtx.lineCap = 'round';
        newCtx.lineJoin = 'round';
        const img = new Image();
        img.src = tempImage;
        img.onload = () => {
          newCtx.drawImage(img, 0, 0);
        };
        contextRef.current = newCtx;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update context properties when color, brush size, tool, or brush type changes
  useEffect(() => {
    if (contextRef.current) {
      if (tool === 'eraser') {
        contextRef.current.globalCompositeOperation = 'source-over';
        contextRef.current.strokeStyle = '#050505';
        contextRef.current.globalAlpha = 1;
        contextRef.current.shadowBlur = 0;
        contextRef.current.lineCap = 'round';
        contextRef.current.lineJoin = 'round';
      } else {
        contextRef.current.globalCompositeOperation = 'source-over';
        contextRef.current.strokeStyle = color;
        contextRef.current.fillStyle = color;

        switch (brushType) {
          case 'marker':
            contextRef.current.globalAlpha = 0.5;
            contextRef.current.shadowBlur = 0;
            contextRef.current.lineCap = 'square';
            contextRef.current.lineJoin = 'bevel';
            break;
          case 'spray':
            contextRef.current.globalAlpha = 1;
            contextRef.current.shadowBlur = brushSize / 2; // Soft edges for spray
            contextRef.current.shadowColor = color;
            contextRef.current.lineCap = 'round';
            contextRef.current.lineJoin = 'round';
            break;
          case 'pen':
          default:
            contextRef.current.globalAlpha = 1;
            contextRef.current.shadowBlur = 0;
            contextRef.current.lineCap = 'round';
            contextRef.current.lineJoin = 'round';
            break;
        }
      }
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, tool, brushType]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);

    // Limit history size to 50 steps
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }

    setHistory(newHistory);
  }, [history, historyIndex]);

  useEffect(() => {
    onUndoAvailable(historyIndex > 0);
    onRedoAvailable(historyIndex < history.length - 1);
  }, [historyIndex, history.length, onUndoAvailable, onRedoAvailable]);

  // Handle clear trigger
  useEffect(() => {
    if (clearTrigger > 0) {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context) {
        context.fillStyle = '#050505';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.shadowBlur = 0; // Reset shadow for clear
        saveToHistory();
        // Restore context state
        context.fillStyle = color;
      }
    }
  }, [clearTrigger, saveToHistory, color]);

  // Handle undo trigger
  useEffect(() => {
    if (undoTrigger > 0 && historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const img = new Image();
      img.src = history[newIndex];
      img.onload = () => {
        contextRef.current?.clearRect(0, 0, contextRef.current.canvas.width, contextRef.current.canvas.height);
        contextRef.current?.drawImage(img, 0, 0);
        setHistoryIndex(newIndex);
      };
    }
  }, [undoTrigger]);

  // Handle redo trigger
  useEffect(() => {
    if (redoTrigger > 0 && historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const img = new Image();
      img.src = history[newIndex];
      img.onload = () => {
        contextRef.current?.clearRect(0, 0, contextRef.current.canvas.width, contextRef.current.canvas.height);
        contextRef.current?.drawImage(img, 0, 0);
        setHistoryIndex(newIndex);
      };
    }
  }, [redoTrigger]);

  // Handle download trigger
  useEffect(() => {
    if (downloadTrigger > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        const link = document.createElement('a');
        link.download = `artwork-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  }, [downloadTrigger]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);

    if (tool === 'brush' && brushType === 'spray') {
      spray(x, y);
      return;
    }

    contextRef.current?.beginPath();
    contextRef.current?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);

    if (tool === 'brush' && brushType === 'spray') {
      spray(x, y);
      return;
    }

    contextRef.current?.lineTo(x, y);
    contextRef.current?.stroke();
  };

  const spray = (x: number, y: number) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const density = brushSize * 2;

    for (let i = 0; i < density; i++) {
      const offset = brushSize / 2;
      const offsetX = (Math.random() - 0.5) * offset * 2;
      const offsetY = (Math.random() - 0.5) * offset * 2;

      // Circular spray pattern
      if (offsetX * offsetX + offsetY * offsetY <= offset * offset) {
        ctx.fillStyle = color;
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
      }
    }
  };

  const endDrawing = () => {
    if (isDrawing) {
      if (tool === 'brush' && brushType !== 'spray') {
        contextRef.current?.closePath();
      }
      setIsDrawing(false);
      saveToHistory();
    }
  };

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
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={endDrawing}
      style={{
        cursor: tool === 'brush'
          ? brushType === 'spray' ? 'crosshair' : 'crosshair'
          : 'cell',
        touchAction: 'none' // Prevent scrolling while drawing
      }}
    />
  );
};

export default Canvas;
