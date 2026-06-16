import Link from 'next/link';

export default function TermsConditionsPage() {
  return (
    <main className="min-h-screen bg-[#050913] text-white px-4 sm:px-6 py-14">
      <div className="max-w-4xl mx-auto rounded-3xl border border-blue-500/20 bg-[#0b1120] p-6 sm:p-8 lg:p-10 shadow-2xl shadow-blue-950/20">

        <Link
          href="/"
          className="inline-flex items-center mb-8 text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Terms & Conditions
        </h1>

        <p className="text-slate-400 mb-8">
          Last updated: 2026
        </p>

        <div className="space-y-8 text-slate-300 leading-relaxed">

          <section>
            <p>
              By using ZorPDF, you agree to use our services only for legal and
              authorized file conversion purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">
              Use of Service
            </h2>
            <p>
              ZorPDF provides free online PDF and document conversion tools for
              personal and professional use.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">
              User Responsibility
            </h2>
            <p>
              Users are responsible for ensuring they have permission to upload,
              convert and use any files submitted to the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">
              Service Changes
            </h2>
            <p>
              We may improve, update or modify services at any time to provide
              a better experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">
              Contact
            </h2>
            <p>
              Questions regarding these terms can be submitted through the
              Contact Us page.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
