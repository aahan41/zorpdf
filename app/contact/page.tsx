"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center mb-8 text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          ← Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Hum se <span className="text-blue-400">Sampark</span> Karo
          </h1>
          <p className="text-gray-400">
            Koi sawaal hai? Hum help karne ke liye tayyar hain!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            { icon: "📧", title: "Email", value: "support@zorpdf.com" },
            { icon: "⏰", title: "Response Time", value: "24 ghante ke andar" },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 text-center"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm text-gray-400 mb-1">{item.title}</div>
              <div className="text-sm font-medium">{item.value}</div>
            </div>
          ))}
        </div>

        {sent ? (
          <div className="bg-green-900/30 border border-green-800 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">Message bhej diya!</h2>
            <p className="text-gray-400 text-sm mb-6">
              Hum jald hi aapse sampark karenge.
            </p>
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm transition"
            >
              Home pe Wapas Jao
            </Link>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-6">Message Bhejo</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Aapka Naam
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="Aapka sawaal ya suggestion..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium transition"
              >
                Message Bhejo →
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
