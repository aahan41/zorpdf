'use client';

import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using ZorPDF, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the service.`,
  },
  {
    title: '2. Description of Service',
    body: `ZorPDF provides online tools for converting, compressing, merging, and editing PDF and image files. Some tools are free to use, while certain features may be offered under a premium plan.`,
  },
  {
    title: '3. User Accounts',
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate information when creating an account.`,
  },
  {
    title: '4. Acceptable Use',
    body: `You agree not to use ZorPDF to upload, convert, or process any content that is illegal, infringes on intellectual property rights, or violates the rights of others. We reserve the right to suspend accounts that misuse the service.`,
  },
  {
    title: '5. File Ownership',
    body: `You retain full ownership of any files you upload. We do not claim any rights over the content of your documents, and files are automatically deleted after processing as described in our Privacy Policy.`,
  },
  {
    title: '6. Service Availability',
    body: `We aim to keep ZorPDF available at all times but do not guarantee uninterrupted access. Features, tools, or pricing may change without prior notice.`,
  },
  {
    title: '7. Limitation of Liability',
    body: `ZorPDF is provided "as is" without warranties of any kind. We are not liable for any loss of data, files, or damages arising from the use or inability to use the service.`,
  },
  {
    title: '8. Changes to These Terms',
    body: `We may update these Terms & Conditions from time to time. Continued use of ZorPDF after changes are posted constitutes acceptance of the revised terms.`,
  },
  {
    title: '9. Contact Us',
    body: `For any questions regarding these Terms & Conditions, contact us at support@zorpdf.com.`,
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-100/40 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6 flex justify-center">
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </a>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
                <FileText className="w-3.5 h-3.5" />
                Terms & Conditions
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
                Terms of using ZorPDF
              </h1>

              <p className="mt-5 text-slate-500 max-w-xl mx-auto leading-relaxed">
                Last updated: August 2026
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 mt-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass-card rounded-2xl p-8 sm:p-10 flex flex-col gap-8"
          >
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-slate-900 font-semibold text-lg mb-2">{s.title}</h2>
                <p className="text-slate-500 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
