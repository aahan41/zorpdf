'use client';

import Navbar from '@/components/sections/Navbar';
import ConverterWorkspace from '@/components/sections/ConverterWorkspace';
import FeaturesSection from '@/components/sections/FeaturesSection';
import HeroSection from '@/components/sections/HeroSection';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <ConverterWorkspace />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
