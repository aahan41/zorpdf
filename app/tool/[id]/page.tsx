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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pt-20">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all tools
        </button>

        <UploadSection toolId={toolId} tool={tool} />
      </div>
    </div>
  );
}
