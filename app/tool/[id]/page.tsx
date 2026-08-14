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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pt-20">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all tools
        </button>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-20px_rgba(15,23,42,0.15)]">
          <UploadSection toolId={toolId} tool={tool} />
        </div>
      </div>
    </div>
  );
}
