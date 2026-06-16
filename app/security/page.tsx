export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#050913] text-white px-6 py-16">
      <div className="max-w-4xl mx-auto rounded-3xl border border-blue-500/20 bg-[#0b1120] p-8">
        <h1 className="text-4xl font-bold mb-6">Security</h1>
        <p className="text-slate-400 mb-6">Your files are handled with care.</p>

        <p className="text-slate-300 mb-5">
          ZorPDF is built to provide safe and reliable file conversion tools.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Secure Processing</h2>
        <p className="text-slate-300">
          Uploaded files are processed only for conversion and are not meant to be publicly accessible.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">No Signup Required</h2>
        <p className="text-slate-300">
          You can use basic ZorPDF tools without creating an account.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Privacy Focused</h2>
        <p className="text-slate-300">
          We aim to keep file conversion simple, fast and privacy-friendly.
        </p>
      </div>
    </main>
  );
}
