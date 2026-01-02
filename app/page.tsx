'use client';

import React, { useState } from 'react';
import Canvas from '@/components/Canvas';
import {
  Paintbrush,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  Download,
  Square,
  Minus,
  Plus
} from 'lucide-react';

const COLORS = [
  '#ffffff', // White
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#22c55e', // Green
  '#eab308', // Yellow
  '#f97316', // Orange
  '#ef4444', // Red
  '#a855f7', // Purple
  '#06b6d4', // Cyan
];

export default function Home() {
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');

  const [undoAvailable, setUndoAvailable] = useState(false);
  const [redoAvailable, setRedoAvailable] = useState(false);

  const [clearTrigger, setClearTrigger] = useState(0);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);
  const [downloadTrigger, setDownloadTrigger] = useState(0);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <header className="header glass">
        <div className="logo">AetherArt</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="icon-button"
            onClick={() => setUndoTrigger(prev => prev + 1)}
            disabled={!undoAvailable}
            title="Undo"
            style={{ opacity: undoAvailable ? 1 : 0.5 }}
          >
            <RotateCcw size={20} />
          </button>
          <button
            className="icon-button"
            onClick={() => setRedoTrigger(prev => prev + 1)}
            disabled={!redoAvailable}
            title="Redo"
            style={{ opacity: redoAvailable ? 1 : 0.5 }}
          >
            <RotateCw size={20} />
          </button>
          <div style={{ width: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
          <button
            className="icon-button"
            onClick={() => setDownloadTrigger(prev => prev + 1)}
            title="Export PNG"
          >
            <Download size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar - Color Palette */}
      <aside className="sidebar glass">
        {COLORS.map((c) => (
          <div
            key={c}
            className={`color-dot ${color === c && tool === 'brush' ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => {
              setColor(c);
              setTool('brush');
            }}
          />
        ))}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
        <button
          className={`icon-button ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="Eraser"
        >
          <Eraser size={20} />
        </button>
      </aside>

      {/* Main Drawing Area */}
      <Canvas
        color={color}
        brushSize={brushSize}
        tool={tool}
        onUndoAvailable={setUndoAvailable}
        onRedoAvailable={setRedoAvailable}
        clearTrigger={clearTrigger}
        undoTrigger={undoTrigger}
        redoTrigger={redoTrigger}
        downloadTrigger={downloadTrigger}
      />

      {/* Bottom Toolbar - Brush Controls */}
      <div className="toolbar glass">
        <button
          className={`icon-button ${tool === 'brush' ? 'active' : ''}`}
          onClick={() => setTool('brush')}
        >
          <Paintbrush size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1rem' }}>
          <Minus
            size={16}
            className="icon-button"
            style={{ width: '24px', height: '24px' }}
            onClick={() => setBrushSize(prev => Math.max(1, prev - 2))}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <span style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>{brushSize}px</span>
          </div>
          <Plus
            size={16}
            className="icon-button"
            style={{ width: '24px', height: '24px' }}
            onClick={() => setBrushSize(prev => Math.min(50, prev + 2))}
          />
        </div>

        <div style={{ width: '1px', background: 'var(--border)', height: '24px' }} />

        <button
          className="icon-button"
          onClick={() => {
            if (confirm('Clear entire canvas?')) {
              setClearTrigger(prev => prev + 1);
            }
          }}
          title="Clear Canvas"
          style={{ color: '#ef4444' }}
        >
          <Trash2 size={20} />
        </button>
      </div>

    </main>
  );
}
