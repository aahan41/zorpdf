'use client';

import Navbar from '@/components/sections/Navbar';
import FeaturesSection from '@/components/sections/FeaturesSection';
import HeroSection from '@/components/sections/HeroSection';
import ToolsGrid from '@/components/sections/ToolsGrid';
import ZorRemoverSection from '@/components/sections/ZorRemoverSection';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <ToolsGrid />
        <ZorRemoverSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
