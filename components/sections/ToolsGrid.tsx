'use client';

import { motion } from 'framer-motion';
import { Image, FileImage, FileText, FileType, ArrowRight, Minimize2, Layers, File, FileOutput } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type ToolId =
  | 'jpg-to-pdf'
  | 'pdf-to-jpg'
  | 'png-to-jpg'
  | 'png-to-pdf'
  | 'word-to-pdf'
  | 'pdf-to-word'
  | 'pdf-compressor'
  | 'image-compressor';

export interface Tool {
  id: ToolId;
  title: string;
  description: string;
  from: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
  accept: string;
}

export const tools: Tool[] = [
  {
    id: 'jpg-to-pdf',
    title: 'JPG to PDF',
    description: 'Convert JPG images to PDF documents.',
    from: 'JPG',
    to: 'PDF',
    icon: Image,
    gradient: 'from-blue-600/20 to-blue-900/20',
    iconBg: 'from-blue-500 to-blue-700',
    accept: '.jpg,.jpeg,.png',
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF to JPG',
    description: 'Extract high-quality JPG images from PDF.',
    from: 'PDF',
    to: 'JPG',
    icon: FileImage,
    gradient: 'from-sky-600/20 to-sky-900/20',
    iconBg: 'from-sky-500 to-blue-600',
    accept: '.pdf',
  },
  {
    id: 'png-to-jpg',
    title: 'PNG to JPG',
    description: 'Convert PNG images to JPG format.',
    from: 'PNG',
    to: 'JPG',
    icon: Image,
    gradient: 'from-emerald-600/20 to-emerald-900/20',
    iconBg: 'from-emerald-500 to-emerald-700',
    accept: '.png',
  },
  {
    id: 'png-to-pdf',
    title: 'PNG to PDF',
    description: 'Convert PNG images to PDF documents.',
    from: 'PNG',
    to: 'PDF',
    icon: Image,
    gradient: 'from-teal-600/20 to-teal-900/20',
    iconBg: 'from-teal-500 to-teal-700',
    accept: '.png',
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Convert Word documents to PDF files.',
    from: 'DOCX',
    to: 'PDF',
    icon: FileText,
    gradient: 'from-blue-700/20 to-slate-900/20',
    iconBg: 'from-blue-600 to-blue-800',
    accept: '.doc,.docx',
  },
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Convert PDF documents into editable Word files (.docx).',
    from: 'PDF',
    to: 'DOCX',
    icon: FileOutput,
    gradient: 'from-indigo-600/20 to-slate-900/20',
    iconBg: 'from-blue-500 to-slate-600',
    accept: '.pdf',
  },
  {
    id: 'pdf-compressor',
    title: 'PDF Compressor',
    description: 'Reduce PDF file size while maintaining quality.',
    from: 'PDF',
    to: 'PDF',
    icon: Minimize2,
    gradient: 'from-cyan-600/20 to-blue-900/20',
    iconBg: 'from-cyan-500 to-blue-600',
    accept: '.pdf',
  },
  {
    id: 'image-compressor',
    title: 'Image Compressor',
    description: 'Compress images without losing quality.',
    from: 'IMAGE',
    to: 'IMAGE',
    icon: Layers,
    gradient: 'from-teal-600/20 to-blue-900/20',
    iconBg: 'from-teal-500 to-blue-600',
    accept: '.jpg,.jpeg,.png,.webp',
  },
];

interface ToolCardProps {
  tool: Tool;
  onNavigate: (toolId: ToolId) => void;
}

function ToolCard({ tool, onNavigate }: ToolCardProps) {
  const handleClick = () => {
    onNavigate(tool.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full"
    >
      <div
        className={`group relative card-hover glass-card rounded-2xl p-6 h-full flex flex-col cursor-pointer bg-gradient-to-br ${tool.gradient}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Glowing border on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 40px rgba(59, 130, 246, 0.05)' }}
        />

        {/* Format badges */}
        <div className="flex items-center gap-2 mb-5">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 text-slate-300 border border-white/10">
            {tool.from}
          </span>
          <ArrowRight className="w-4 h-4 text-blue-400" />
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
            {tool.to}
          </span>
        </div>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.iconBg} flex items-center justify-center mb-5 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          <tool.icon className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
          {tool.title}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">
          {tool.description}
        </p>

        {/* CTA Button */}
        <div
          className="w-full py-3.5 rounded-xl btn-primary text-sm font-semibold text-white flex items-center justify-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none"
        >
          <span>Open Tool</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

export default function ToolsGrid() {
  const router = useRouter();

  const handleNavigate = (toolId: ToolId) => {
    router.push(`/tool/${toolId}`);
  };

  return (
    <section id="tools" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5">
            Choose Your Tool
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Select a conversion tool to get started. All conversions are processed locally in your browser.
          </p>
        </motion.div>

        {/* Tool cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
