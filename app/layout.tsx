import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'ZorPDF - Convert Any File in Seconds',
  description: 'Fast, secure and free online file converter. Convert JPG to PDF, PDF to JPG, Word to PDF, PDF to Word and more. No signup required.',
  keywords: 'file converter, JPG to PDF, PDF to JPG, Word to PDF, PDF to Word, online converter, free converter',
  authors: [{ name: 'ZorPDF' }],
  openGraph: {
    title: 'ZorPDF - Convert Any File in Seconds',
    description: 'Fast, secure and free online file converter. No signup required.',
    type: 'website',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZorPDF - Convert Any File in Seconds',
    description: 'Fast, secure and free online file converter. No signup required.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
