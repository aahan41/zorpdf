import { Download } from 'lucide-react';

interface DownloadButtonProps {
  onClick: () => void;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DownloadButton({
  onClick,
  text = 'Download',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
}: DownloadButtonProps) {
  const sizeStyles = {
    sm: 'h-10 px-4 gap-1.5 text-xs',
    md: 'h-12 px-5 gap-2 text-sm',
    lg: 'h-14 px-6 gap-2 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : 'min-w-[140px]'}
        btn-primary rounded-xl font-bold text-white
        flex items-center justify-center whitespace-nowrap
        transition-all duration-200
        hover:shadow-lg hover:shadow-blue-500/30
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <Download className={`flex-shrink-0 ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      {text}
    </button>
  );
}
