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
    <div className="w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-slate-700 font-semibold text-sm">
          Compression Level
        </label>

        <span className="text-xs text-slate-400">
          Choose your preferred quality
        </span>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {compressionOptions.map((option) => {
          const isSelected = value === option.id;
          const Icon = option.icon;

          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`
                relative w-full text-left p-4 rounded-xl
                border transition-all duration-200
                ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }
              `}
            >

              {/* Popular badge */}
              {option.recommended && (
                <span
                  className={`
                    absolute -top-2 right-3
                    px-2 py-0.5 rounded-full
                    text-[10px] font-bold
                    ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-600'
                    }
                  `}
                >
                  Popular
                </span>
              )}

              <div className="flex items-start gap-3">

                {/* Icon */}
                <div
                  className={`
                    w-10 h-10 rounded-lg
                    flex items-center justify-center
                    flex-shrink-0 border
                    ${
                      isSelected
                        ? 'bg-blue-100 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                    }
                  `}
                >
                  <Icon
                    className={`
                      w-5 h-5
                      ${
                        isSelected
                          ? 'text-blue-600'
                          : 'text-slate-400'
                      }
                    `}
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`
                        text-sm font-semibold
                        ${
                          isSelected
                            ? 'text-blue-700'
                            : 'text-slate-700'
                        }
                      `}
                    >
                      {option.label}
                    </span>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    {option.description}
                  </p>

                  <p
                    className={`
                      text-xs mt-1 font-medium
                      ${
                        isSelected
                          ? 'text-blue-600'
                          : 'text-slate-400'
                      }
                    `}
                  >
                    {option.quality}
                  </p>

                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Smart Compression */}
      <div className="mt-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-start gap-2">

          <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />

          <p className="text-slate-500 text-xs leading-relaxed">
            <strong className="text-slate-700">
              Smart Compression:
            </strong>{' '}
            Images are automatically analyzed for document content.
            Text and details are preserved with adaptive quality
            settings. Maximum dimensions: 1200px width for balanced mode.
          </p>

        </div>
      </div>

    </div>
  );
}
