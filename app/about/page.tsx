import Link from "next/link";

export default function AboutPage() {
return ( <div className="min-h-screen bg-[#0d1117] text-white"> <div className="max-w-4xl mx-auto px-6 py-16">

```
    <Link
      href="/"
      className="inline-flex items-center mb-8 text-blue-400 hover:text-blue-300 font-medium transition-colors"
    >
      ← Back to Home
    </Link>

    <div className="text-center mb-16">
      <h1 className="text-4xl font-bold mb-4">
        Zor<span className="text-blue-400">PDF</span> ke baare mein
      </h1>
      <p className="text-gray-400 text-lg max-w-2xl mx-auto">
        Free, fast aur secure PDF tools — directly your browser mein. Koi signup nahi, koi wait nahi.
      </p>
    </div>

    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 mb-8">
      <h2 className="text-2xl font-semibold mb-4">🎯 Hamara Mission</h2>
      <p className="text-gray-300 leading-relaxed">
        ZorPDF ka mission hai PDF tools ko sabke liye accessible banana — bilkul free mein.
        Hum believe karte hain ki document conversion ek simple kaam hona chahiye,
        isliye humne ek aisa platform banaya jahan aap bina kisi account ke apne files
        convert kar sako — sirf seconds mein.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {[
        { icon: "⚡", title: "Fast", desc: "Seconds mein conversion — koi waiting nahi" },
        { icon: "🔒", title: "Secure", desc: "Files directly browser mein process hoti hain" },
        { icon: "💯", title: "Free", desc: "Sabhi tools bilkul free — koi hidden charges nahi" },
      ].map((f) => (
        <div
          key={f.title}
          className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 text-center"
        >
          <div className="text-3xl mb-3">{f.icon}</div>
          <h3 className="font-semibold mb-2">{f.title}</h3>
          <p className="text-gray-400 text-sm">{f.desc}</p>
        </div>
      ))}
    </div>

    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 mb-8">
      <h2 className="text-2xl font-semibold mb-4">🛠️ Hamare Tools</h2>

      <div className="grid md:grid-cols-2 gap-3">
        {[
          "JPG to PDF",
          "PDF to JPG",
          "PNG to PDF",
          "PNG to JPG",
          "Word to PDF",
          "PDF to Word",
          "PDF Compressor",
        ].map((tool) => (
          <div key={tool} className="flex items-center gap-2 text-gray-300">
            <span className="text-blue-400">✓</span>
            {tool}
          </div>
        ))}
      </div>
    </div>

    <div className="text-center">
      <Link
        href="/"
        className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition inline-block"
      >
        Tools Use Karo →
      </Link>
    </div>
  </div>
</div>
```

);
}
