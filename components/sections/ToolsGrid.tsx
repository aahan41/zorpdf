'use client';

import { motion } from 'framer-motion';
import {
  Image,
  FileImage,
  FileText,
  ArrowRight,
  Minimize2,
  FileOutput,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export type ToolId =
  | 'jpg-to-pdf'
  | 'pdf-to-jpg'
  | 'png-to-jpg'
  | 'word-to-pdf'
  | 'pdf-to-word'
  | 'pdf-compressor';

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
    description: 'Convert JPG images and existing PDF documents to a single PDF.',
    from: 'JPG',
    to: 'PDF',
    icon: Image,
    gradient: 'from-blue-50 to-blue-100/50',
    iconBg: 'from-blue-500 to-blue-700',
    accept: '.jpg,.jpeg,.png,.pdf',
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
        <div className="flex items-center gap-2 mb-5">
          <span className="px-3 py-1 rounded-lg bg-white/70 text-slate-700 text-xs font-bold">
            {tool.from}
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="px-3 py-1 rounded-lg bg-white/70 text-slate-700 text-xs font-bold">
            {tool.to}
          </span>
        </div>

        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.iconBg} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
        >
          <tool.icon className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
          {tool.title}
        </h3>

        <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-6">
          {tool.description}
        </p>

        <div className="w-full py-3.5 rounded-xl btn-primary text-sm font-semibold text-white flex items-center justify-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
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
    <section id="tools" className="pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            File Converter
          </h2>
          <p className="text-slate-500 text-lg">
            Convert your files to any format you need
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
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
