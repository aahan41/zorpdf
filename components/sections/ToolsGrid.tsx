'use client';

import { motion } from 'framer-motion';
import { Image, FileImage, FileText, FileType, ArrowRight, Minimize2, Layers, FileOutput, Crown } from 'lucide-react';
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
    gradient: 'from-blue-50 to-blue-100/50',
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
    gradient: 'from-sky-50 to-sky-100/50',
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
    gradient: 'from-emerald-50 to-emerald-100/50',
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
    gradient: 'from-teal-50 to-teal-100/50',
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
    gradient: 'from-blue-50 to-slate-100/50',
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
    gradient: 'from-indigo-50 to-slate-100/50',
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
    gradient: 'from-cyan-50 to-blue-100/50',
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
    gradient: 'from-teal-50 to-blue-100/50',
    iconBg: 'from-teal-500 to-blue-600',
    accept: '.jpg,.jpeg,.png,.webp',
  },
];

interface ToolCardProps {
  tool: Tool;
  onNavigate: (toolId: ToolId) => void;
}

function ToolCard({ tool, onNavigate }: ToolCardProps) {
  const handleClick = () => onNavigate(tool.id);

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
        {/* Format badges */}
        <div className="flex items-center gap-2 mb-5">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {tool.from}
          </span>
          <ArrowRight className="w-4 h-4 text-blue-500" />
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            {tool.to}
          </span>
        </div>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.iconBg} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          <tool.icon className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
          {tool.title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-6">
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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-5">
            Choose Your Tool
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Select a conversion tool to get started. All conversions are processed locally in your browser.
          </p>
        </motion.div>

        {/* Tool cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {/* Zor Remover premium card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <div
            onClick={() => router.push('/zor-remover')}
            className="group relative card-hover rounded-2xl p-6 sm:p-8 cursor-pointer overflow-hidden border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-slate-900">Zor Remover</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">PRO</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Remove image backgrounds instantly with AI. Get clean, transparent PNGs in seconds.
                </p>
              </div>
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm group-hover:gap-3 transition-all">
                <span>Open Tool</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
