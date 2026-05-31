'use client';

import Navbar from '@/components/sections/Navbar';
import HeroSection from '@/components/sections/HeroSection';
import ToolsGrid from '@/components/sections/ToolsGrid';
import FeaturesSection from '@/components/sections/FeaturesSection';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050913]">
      <Navbar />
      <main>
        <HeroSection />
        <ToolsGrid />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
