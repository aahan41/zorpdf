'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { tools, type ToolId } from '@/components/sections/ToolsGrid';
import UploadSection from '@/components/sections/UploadSection';
import NotFound from './not-found';

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const toolId = params.id as ToolId;
  const tool = tools.find(t => t.id === toolId);

  if (!tool) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-[#050913]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to tools</span>
        </button>

        {/* Tool header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.iconBg} mb-4 shadow-lg`}>
            <tool.icon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {tool.title}
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {tool.description}
          </p>
        </div>

        {/* Upload section */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <UploadSection toolId={tool.id} tool={tool} />
        </div>
      </div>
    </div>
  );
}
