'use client';

import type { CompressionLevel } from '@/lib/imageCompression';

interface CompressionLevelSelectorProps {
  value: CompressionLevel;
  onChange: (value: CompressionLevel) => void;
}

const levels: {
  value: CompressionLevel;
  label: string;
  description: string;
}[] = [
  {
    value: 'low',
    label: 'High Quality',
    description: 'Best quality, larger output',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Good quality and smaller size',
  },
  {
    value: 'high',
    label: 'High Compression',
    description: 'Smaller file size',
  },
  {
    value: 'ultra',
    label: 'Maximum Compression',
    description: 'Smallest file size',
  },
];

export default function CompressionLevelSelector({
  value,
  onChange,
}: CompressionLevelSelectorProps) {
  return (
    <div className="w-full">
      <div className="mb-2">
        <p className="text-sm font-semibold text-white">
          Output Quality
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          Choose the quality of the converted file.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {levels.map((level) => {
          const selected =
            value === level.value;

          return (
            <button
              key={level.value}
              type="button"
              onClick={() =>
                onChange(level.value)
              }
              className={`
                rounded-xl border p-3 text-left
                transition-all
                ${
                  selected
                    ? 'border-blue-500/50 bg-blue-600/10'
                    : 'border-white/10 bg-slate-900/20 hover:border-white/20 hover:bg-white/5'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`
                    flex h-4 w-4 items-center justify-center
                    rounded-full border
                    ${
                      selected
                        ? 'border-blue-400'
                        : 'border-slate-600'
                    }
                  `}
                >
                  {selected && (
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                  )}
                </span>

                <span
                  className={`
                    text-xs font-semibold
                    ${
                      selected
                        ? 'text-blue-300'
                        : 'text-slate-300'
                    }
                  `}
                >
                  {level.label}
                </span>
              </div>

              <p className="mt-1 pl-6 text-[11px] text-slate-500">
                {level.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
