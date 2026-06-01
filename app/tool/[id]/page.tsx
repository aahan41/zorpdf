'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { tools, type ToolId } from '@/components/sections/ToolsGrid';
import ConverterWorkspace from '@/components/sections/ConverterWorkspace';
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all tools
        </button>

        <ConverterWorkspace />
      </div>
    </div>
  );
}
