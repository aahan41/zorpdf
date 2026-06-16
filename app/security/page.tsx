import Link from 'next/link';

export default function SecurityPage() {
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
          Security
        </h1>

        <p className="text-slate-400 mb-8">
          Your files are handled with care.
        </p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <p>
              ZorPDF is built to provide safe, simple and reliable file conversion tools.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">
              Secure Processing
            </h2>
            <p>
              Uploaded files are processed only for conversion and are not meant to be publicly accessible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">
              No Signup Required
            </h2>
            <p>
              Basic ZorPDF tools can be used without creating an account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-3">
              Privacy Friendly
            </h2>
            <p>
              We aim to keep file conversion fast, clean and privacy-friendly.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
