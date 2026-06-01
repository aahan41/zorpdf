'use client';

import Navbar from '@/components/sections/Navbar';
import ConverterWorkspace from '@/components/sections/ConverterWorkspace';
import FeaturesSection from '@/components/sections/FeaturesSection';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050913]">
      <Navbar />
      <main>
        <ConverterWorkspace />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
