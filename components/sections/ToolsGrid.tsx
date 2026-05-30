'use client';

import { motion } from 'framer-motion';
import { Image, FileImage, FileText, FileType, ArrowRight } from 'lucide-react';

export type ToolId = 'jpg-to-pdf' | 'pdf-to-jpg' | 'word-to-pdf' | 'pdf-to-word';

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
    description: 'Convert your JPG images into professional PDF documents instantly.',
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
    description: 'Extract high-quality JPG images from any PDF file in seconds.',
    from: 'PDF',
    to: 'JPG',
    icon: FileImage,
    gradient: 'from-sky-600/20 to-sky-900/20',
    iconBg: 'from-sky-500 to-blue-600',
    accept: '.pdf',
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Transform Word documents into perfectly formatted PDF files.',
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
    description: 'Convert PDF files into fully editable Word documents.',
    from: 'PDF',
    to: 'DOCX',
    icon: FileType,
    gradient: 'from-cyan-600/20 to-blue-900/20',
    iconBg: 'from-cyan-500 to-blue-600',
    accept: '.pdf',
  },
];

interface ToolsGridProps {
  onSelectTool: (tool: Tool) => void;
}

export default function ToolsGrid({ onSelectTool }: ToolsGridProps) {
  const scrollToUpload = (tool: Tool) => {
    onSelectTool(tool);
    setTimeout(() => {
      document.querySelector('#upload')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-glow mb-5">
            <span className="text-blue-400 text-sm font-medium">Conversion Tools</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5">
            All the Tools You Need
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Professional-grade file conversion tools, completely free and available 24/7.
          </p>
        </motion.div>

        {/* Tool cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div
                className={`group relative card-hover glass-card rounded-2xl p-6 h-full flex flex-col cursor-pointer bg-gradient-to-br ${tool.gradient}`}
                onClick={() => scrollToUpload(tool)}
              >
                {/* Glowing border on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.25), inset 0 0 30px rgba(59, 130, 246, 0.04)' }}
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
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.iconBg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <tool.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">
                  {tool.description}
                </p>

                {/* CTA */}
                <button className="w-full py-3 rounded-xl btn-primary text-sm font-semibold text-white flex items-center justify-center gap-2 group-hover:shadow-blue-900/50">
                  Convert Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
