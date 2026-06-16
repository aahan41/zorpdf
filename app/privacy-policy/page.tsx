import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#050913] text-white px-4 sm:px-6 py-14">
      <div className="max-w-4xl mx-auto rounded-3xl border border-blue-500/20 bg-[#0b1120] p-6 sm:p-8 lg:p-10 shadow-2xl shadow-blue-950/20">
        <Link
          href="/"
          className="inline-flex items-center mb-8 text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <p>
              ZorPDF respects your privacy. Our tools are designed to convert files quickly,
              securely, and conveniently for everyday document needs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">File Handling</h2>
            <p>
              Uploaded files are used only for conversion. We do not intend to permanently
              store your uploaded files after the conversion process is completed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Personal Information</h2>
            <p>
              Basic file conversion tools on ZorPDF do not require users to create an account.
              If account features are used, the information provided is used only to support
              the requested service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Security</h2>
            <p>
              We aim to keep file conversion simple and safe. Users should avoid uploading
              files they are not authorized to use or share.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">Contact</h2>
            <p>
              For privacy-related questions, please contact us through the Contact Us page.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
