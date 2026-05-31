'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GripVertical, X, Image as ImageIcon } from 'lucide-react';
import type { ImageProcessingResult } from '@/lib/pdfMerger';

interface ImageReorderGridProps {
  images: ImageProcessingResult[];
  onReorder: (images: ImageProcessingResult[]) => void;
  onRemove: (id: string) => void;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ImageReorderGrid({ images, onReorder, onRemove }: ImageReorderGridProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-400" />
          <span className="text-white font-semibold">
            {images.length} image{images.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        <p className="text-slate-500 text-sm">
          Drag to reorder pages
        </p>
      </div>

      <Reorder.Group
        axis="y"
        values={images}
        onReorder={onReorder}
        className="space-y-2 max-h-[500px] overflow-y-auto pr-2"
      >
        <AnimatePresence>
          {images.map((image, index) => (
            <Reorder.Item
              key={image.id}
              value={image}
              onDragStart={() => setDraggedId(image.id)}
              onDragEnd={() => setDraggedId(null)}
              className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 cursor-grab active:cursor-grabbing transition-all ${
                draggedId === image.id ? 'shadow-xl shadow-blue-900/40 border-blue-500/30' : 'hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Page number */}
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                </div>

                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                  <img
                    src={image.thumbnail}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{image.file.name}</p>
                  <p className="text-slate-500 text-xs">
                    {image.width} x {image.height} | {formatBytes(image.file.size)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-slate-500 hover:text-slate-300 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(image.id);
                  }}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}
