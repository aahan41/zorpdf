'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

const sections = [
  {
    title: '1. Information We Collect',
    body: `We collect the minimum information needed to operate ZorPDF. This includes account details you provide when signing up (such as email and mobile number), and files you upload for conversion, which are used solely to perform the requested operation.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Account information is used to authenticate you and manage your account. Uploaded files are processed automatically to deliver the tool's output (e.g. a converted or compressed file) and are not used for any other purpose.`,
  },
  {
    title: '3. File Retention & Deletion',
    body: `Files you upload are processed and then automatically deleted from our servers shortly after conversion. We do not retain copies of your documents beyond what is necessary to complete the requested operation.`,
  },
  {
    title: '4. Data Sharing',
    body: `We do not sell, rent, or share your personal data or files with third parties for marketing or advertising purposes. Data may be shared with service providers strictly to the extent necessary to operate ZorPDF (e.g. hosting infrastructure).`,
  },
  {
    title: '5. Cookies',
    body: `We use essential cookies to keep you signed in and to remember basic preferences such as language selection. We do not use cookies to track you across other websites.`,
  },
  {
    title: '6. Your Rights',
    body: `You may request access to, correction of, or deletion of your account data at any time by contacting us. You can also delete your account directly from your account settings.`,
  },
  {
    title: '7. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. Material changes will be reflected on this page with an updated revision date.`,
  },
  {
    title: '8. Contact Us',
    body: `If you have questions about this Privacy Policy, reach out to us at support@zorpdf.com.`,
  },
];

export default function PrivacyPolicyPage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
                <Lock className="w-3.5 h-3.5" />
                Privacy Policy
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
                Your privacy matters to us
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
