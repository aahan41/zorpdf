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
    label: 'Low',
    description: 'Best quality, larger file size',
    icon: Sparkles,
    quality: '85% quality',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Recommended for most uses',
    icon: Zap,
    quality: '80% quality',
    recommended: true,
  },
  {
    id: 'high',
    label: 'High',
    description: 'Smaller file, good quality',
    icon: Target,
    quality: '65% quality',
  },
  {
    id: 'ultra',
    label: 'Ultra',
    description: 'Smallest size, lower quality',
    icon: Minimize2,
    quality: '50% quality',
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

      {/* Options */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
                relative w-full text-left p-2 rounded-lg
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
                    absolute -top-2 right-2
                    px-1.5 py-0.5 rounded-full
                    text-[9px] font-bold
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

              <div className="flex flex-col items-center text-center gap-1">

                {/* Icon */}
                <div
                  className={`
                    w-7 h-7 rounded-md
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
                      w-3.5 h-3.5
                      ${
                        isSelected
                          ? 'text-blue-600'
                          : 'text-slate-400'
                      }
                    `}
                  />
                </div>

                {/* Text */}
                <div className="min-w-0">

                  <div className="flex items-center justify-center gap-1">
                    <span
                      className={`
                        text-xs font-semibold whitespace-nowrap
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
                      <Check className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    )}
                  </div>

                  <p
                    className={`
                      text-[11px] font-medium
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

    </div>
  );
}
