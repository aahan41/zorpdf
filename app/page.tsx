'use client';

import { useState } from 'react';
import Navbar from '@/components/sections/Navbar';
import HeroSection from '@/components/sections/HeroSection';
import ToolsGrid from '@/components/sections/ToolsGrid';
import UploadSection from '@/components/sections/UploadSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import Footer from '@/components/sections/Footer';
import type { Tool } from '@/components/sections/ToolsGrid';

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  return (
    <div className="min-h-screen bg-[#050913]">
      <Navbar />
      <main>
        <HeroSection />
        <ToolsGrid onSelectTool={setSelectedTool} />
        <UploadSection selectedTool={selectedTool} />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}