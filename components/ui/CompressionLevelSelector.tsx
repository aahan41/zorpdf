'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Minimize2, Target, Check } from 'lucide-react';
import type { CompressionLevel } from '@/lib/imageCompression';

interface CompressionOption {
  id: CompressionLevel;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  quality: string;
  recommended?: boolean;
}

const compressionOptions: CompressionOption[] = [
  {
    id: 'low',
    label: 'Low Compression',
    description: 'Best quality, larger file size',
    icon: Sparkles,
    quality: '85% quality',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Recommended for most uses',
    icon: Zap,
    quality: '65% quality',
    recommended: true,
  },
  {
    id: 'high',
    label: 'High Compression',
    description: 'Smaller file, good quality',
    icon: Target,
    quality: '50% quality',
  },
  {
    id: 'ultra',
    label: 'Ultra Compress',
    description: 'Smallest size, lower quality',
    icon: Minimize2,
    quality: '35% quality',
  },
];

interface CompressionLevelSelectorProps {
  value: CompressionLevel;
  onChange: (level: CompressionLevel) => void;
}

export default function CompressionLevelSelector({
  value,
  onChange,
}: CompressionLevelSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-white font-medium text-sm">Compression Level</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {compressionOptions.map((option) => {
          const isSelected = value === option.id;
          const Icon = option.icon;

          return (
            <motion.button
              key={option.id}
              onClick={() => onChange(option.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-900/20'
                  : 'bg-slate-800/30 border-white/10 hover:border-white/20 hover:bg-slate-800/50'
              }`}
            >
              {option.recommended && !isSelected && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full">
                  Popular
                </span>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-slate-700/50 border border-white/10'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {option.label}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                  <p className="text-slate-500 text-xs mt-1">{option.description}</p>
                  <p className="text-slate-600 text-xs mt-1">{option.quality}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-4 p-3 rounded-lg bg-blue-900/10 border border-blue-500/20">
        <p className="text-slate-400 text-xs leading-relaxed">
          <strong className="text-blue-400">Smart Compression:</strong> Images are automatically
          analyzed for document content. Text and details are preserved with adaptive quality
          settings. Maximum dimensions: 1200px width for balanced mode.
        </p>
      </div>
    </div>
  );
}
